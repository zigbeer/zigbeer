import { ZclID } from "zcl-id"

import { Callback, Values } from "./typeUtils"
import { BufferWithPointer, BufferBuilder } from "./buffer"
import {
  stdTypeMapping,
  zclTypeName,
  getStdType,
  statusCodes
} from "./definition"
import { readDataTable } from "./readDataTypes"
import { writeDataTable } from "./writeDataTypes"
import { readUntilEnd, fixedLength } from "./readUtils"

type ZCLType = keyof typeof stdTypeMapping
type StdType = typeof stdTypeMapping[ZCLType]
type Status = Values<typeof statusCodes>
type FailureStatus = Exclude<Status, 0>

const isAnalogType = (type: number) => {
  // GENERAL_DATA, LOGICAL, BITMAP
  // ENUM
  // STRING, ORDER_SEQ, COLLECTION
  // IDENTIFIER, MISC
  if (
    (type > 0x07 && type < 0x20) ||
    (type > 0x2f && type < 0x38) ||
    (type > 0x3f && type < 0x58) ||
    (type > 0xe7 && type < 0xff)
  ) {
    return false
  }
  // UNSIGNED_INT, SIGNED_INT
  // FLOAT
  // TIME
  if (
    (type > 0x1f && type < 0x30) ||
    (type > 0x37 && type < 0x40) ||
    (type > 0xdf && type < 0xe8)
  ) {
    return true
  }
  throw new Error(
    `dataType ID not in range to find out if it's discrete or analog. Got ${type} instead.`
  )
}

const readAttrVal = (r: BufferWithPointer) => {
  const elmType = r.uint8()
  const numElms = r.uint16le()
  const elmVals = new Array(numElms)
  for (let count = 0; count < numElms; count++) {
    elmVals[count] = innerMulti(r, elmType)
  }
  return { elmType, numElms, elmVals }
}
const readAttrValStruct = (r: BufferWithPointer) => {
  const numElms = r.uint16le()
  const structElms = new Array(numElms)
  for (let count = 0; count < numElms; count++) {
    const elmType = r.uint8()
    const elmVal = innerMulti(r, elmType)
    structElms[count] = { elmType, elmVal }
  }
  return { numElms, structElms }
}
const readTypedValue = (r: BufferWithPointer, dataType: number) => {
  const typeName = zclTypeName(dataType)
  const stdType = getStdType(typeName)
  return readDataTable[stdType](r)
}
const innerMulti = (r: BufferWithPointer, dataType: number) => {
  const typeName = zclTypeName(dataType)
  if (typeName === "array" || typeName === "set" || typeName === "bag") {
    return readAttrVal(r)
  }
  if (typeName === "struct") {
    return readAttrValStruct(r)
  }
  return readTypedValue(r, dataType)
}
const innerConfigReport = (r: BufferWithPointer) => {
  const direction = r.uint8()
  const attrId = r.uint16le()
  if (direction === 0x01)
    return { direction, attrId, timeout: r.uint16le() } as const
  if (direction !== 0x00) throw `Direction must be 0 or 1, got ${direction}`
  const dataType = r.uint8()
  const minRepIntval = r.uint16le()
  const maxRepIntval = r.uint16le()
  if (!isAnalogType(dataType))
    return { direction, attrId, dataType, minRepIntval, maxRepIntval } as const
  return {
    direction,
    attrId,
    dataType,
    minRepIntval,
    maxRepIntval,
    repChange: innerMulti(r, dataType) // TODO: Won't this always be an unstructured scalar value?
  } as const
}

const collapseSuccess = <R>(fn: (r: BufferWithPointer) => R) => (
  r: BufferWithPointer
) => {
  let i = 0
  const arr: ({ status: FailureStatus } & R)[] = []
  while (r.remaining() !== 0) {
    const status = r.uint8() as Status // TODO: Validate that it's a known status?
    if (status === 0x00)
      if (i === 0 && r.remaining() === 0) return [{ status }] as const
      else throw new Error("Bad payload: successful status not alone")
    arr.push({ status, ...fn(r) } as const)
  }
  return arr
}
const specialReads = {
  read: readUntilEnd(fixedLength(2, r => r.uint16le())),
  readRsp: readUntilEnd(r => {
    const attrId = r.uint16le()
    const status = r.uint8()
    if (status !== 0) return { attrId, status }
    const dataType = r.uint8()
    const attrData = innerMulti(r, dataType)
    return { attrId, status, dataType, attrData }
  }),
  write: readUntilEnd(r => {
    const attrId = r.uint16le()
    const dataType = r.uint8()
    const attrData = innerMulti(r, dataType)
    return { attrId, dataType, attrData }
  }),
  writeRsp: collapseSuccess(
    fixedLength(
      3,
      r =>
        ({
          attrId: r.uint16le()
        } as const)
    )
  ),
  configReport: readUntilEnd(innerConfigReport),
  configReportRsp: collapseSuccess(
    fixedLength(
      4,
      r =>
        ({
          direction: r.uint8(),
          attrId: r.uint16le()
        } as const)
    )
  ),
  readReportConfig: readUntilEnd(
    fixedLength(
      3,
      r => ({ direction: r.uint8(), attrId: r.uint16le() } as const)
    )
  ),
  readReportConfigRsp: readUntilEnd((r: BufferWithPointer) => {
    const status = r.uint8()
    if (status !== 0x00) {
      // TODO: assert and type that only "unsupAttribute" | "unreportableAttribute" | "notFound" get returned
      return { status, direction: r.uint8(), attrId: r.uint16le() } as const
    }
    return { status, ...innerConfigReport(r) } as const
  }),
  report: readUntilEnd(r => {
    const attrId = r.uint16le()
    const dataType = r.uint8()
    return { attrId, dataType, attrData: innerMulti(r, dataType) } as const
  }),
  readStruct: readUntilEnd(r => {
    return { attrId: r.uint16le(), selector: readSelector(r) } as const
  }),
  writeStruct: readUntilEnd(r => {
    const attrId = r.uint16le()
    const selector = readSelector(r)
    const dataType = r.uint8()
    return {
      attrId,
      selector,
      dataType,
      attrData: innerMulti(r, dataType)
    } as const
  }),
  writeStructRsp: collapseSuccess(
    r =>
      ({
        attrId: r.uint16le(),
        selector: readSelector(r)
      } as const)
  ),
  discoverRsp: readUntilEnd(
    fixedLength(
      3,
      r =>
        ({
          attrId: r.uint16le(),
          dataType: r.uint8()
        } as const)
    )
  )
} as const

const writeDataTypeByTypeID = (typeID: number, c: BufferBuilder, value) => {
  const dataType = zclTypeName(typeID)
  const stdType = getStdType(dataType)
  if (!stdType) throw new Error(`Unknown dataType ${dataType}`)

  const fn = writeDataTable[stdType]
  if (!fn) throw new Error(`Writing dataType ${stdType} not implemented`)

  return fn(c, value)
}
const attrsArray = {
  write: <T>(args: T[]) => ({
    attrs: args
  }),
  read: <T>({ attrs }: { attrs: T[] }) => attrs
}
const compatabilityTable = {
  read: {
    write: (args: { attrId: number }[]) => ({
      attrIds: args.map(x => x.attrId)
    }),
    read: (data: { attrIds: number[] }) =>
      data.attrIds.map(x => ({ attrId: x }))
  },
  readRsp: attrsArray,
  write: attrsArray,
  writeUndiv: attrsArray,
  writeRsp: attrsArray,
  writeNoRsp: attrsArray,
  configReport: attrsArray,
  configReportRsp: attrsArray,
  readReportConfig: attrsArray,
  readReportConfigRsp: attrsArray,
  report: attrsArray,
  readStruct: attrsArray,
  writeStruct: attrsArray,
  writeStructRsp: attrsArray
}
type Inverse<F extends (arg: any) => any> = F extends (arg: infer A) => infer R
  ? (arg: R) => A
  : never
type Check = {
  [K in keyof typeof compatabilityTable]: {
    write: Inverse<typeof compatabilityTable[K]["read"]>
    read: Inverse<typeof compatabilityTable[K]["write"]>
  }
}
const compatabilityTableTypeCheck: Check = compatabilityTable

const writeCompatabilityLayer = (cmd, args) => {
  const type = compatabilityTable[cmd]
  if (type) return type.write(args)
  return args
}
const readCompatabilityLayer = (cmd, args) => {
  const type = compatabilityTable[cmd]
  if (type) return type.read(args)
  return args
}

type ConfigReportRecord =
  | { direction: 0x01; attrId: number; timeout: number }
  | {
      direction: 0x00
      attrId: number
      dataType: number
      minRepIntval: number
      maxRepIntval: number
      repChange: any
    }
const writeReportConfigRecord = (
  c: BufferBuilder,
  record: ConfigReportRecord
) => {
  c.uint8(record.direction).uint16le(record.attrId)
  if (record.direction === 0x01) {
    c.uint16le(record.timeout)
    return
  }
  if (record.direction !== 0x00)
    throw `Direction must be 0 or 1, got ${record!.direction}`
  const { dataType, minRepIntval, maxRepIntval } = record
  c.uint8(dataType)
    .uint16le(minRepIntval)
    .uint16le(maxRepIntval)
  if (isAnalogType(dataType))
    writeDataTypeByTypeID(dataType, c, record.repChange)
}

const writeWithStatus = <R, T>(fn: (c: BufferBuilder, record: T) => R) => (
  c: BufferBuilder,
  arg:
    | [
        {
          status: 0x00
        }
      ]
    | ({
        status: FailureStatus
      } & T)[]
) => {
  const { length } = arg
  for (let i = 0; i < length; i++) {
    const record = arg[i]
    c.uint8(record.status)
    if (record.status === 0x00)
      if (length === 1) return
      else throw new Error("Bad payload: successful status not alone")
    fn(c, record)
  }
}

const specialWrites = {
  read: (c: BufferBuilder, attrIds: number[]) => {
    for (const attrId of attrIds) {
      c.uint16le(attrId)
    }
  },
  readRsp: (
    c: BufferBuilder,
    arg: {
      attrId: number
      status: number
      dataType: number
      attrData: unknown
    }[]
  ) => {
    for (const record of arg) {
      c.uint16le(record.attrId).uint8(record.status)

      if (record.status === 0) {
        c.uint8(record.dataType)
        writeMulti(c, record.dataType, record.attrData)
      }
    }
  },
  write: (
    c: BufferBuilder,
    arg: { attrId: number; dataType: number; attrData: any }[]
  ) => {
    for (const { attrId, dataType, attrData } of arg) {
      c.uint16le(attrId).uint8(dataType)
      writeMulti(c, dataType, attrData)
    }
  },
  writeRsp: writeWithStatus((c, rec: { attrId: number }) => {
    c.uint16le(rec.attrId)
  }),
  configReport: (c: BufferBuilder, arg: ConfigReportRecord[]) => {
    for (const record of arg) {
      writeReportConfigRecord(c, record)
    }
  },
  configReportRsp: writeWithStatus(
    (c, rec: { direction: 0x00 | 0x01; attrId: number }) => {
      c.uint8(rec.direction).uint16le(rec.attrId)
    }
  ),
  readReportConfig: (
    c: BufferBuilder,
    arg: { direction: 0x00 | 0x01; attrId: number }[]
  ) => {
    for (const { direction, attrId } of arg) c.uint8(direction).uint16le(attrId)
  },
  readReportConfigRsp: (
    c: BufferBuilder,
    arg: (
      | { status: 0x00 } & ConfigReportRecord
      | {
          status: Values<
            Pick<
              typeof statusCodes,
              "unsupAttribute" | "unreportableAttribute" | "notFound"
            >
          >
        } & Pick<ConfigReportRecord, "direction" | "attrId">)[]
  ) => {
    for (const record of arg) {
      c.uint8(record.status)
      if (record.status !== 0x00) {
        c.uint8(record.direction).uint16le(record.attrId)
        continue
      }
      writeReportConfigRecord(c, record)
    }
  },
  report: (
    c: BufferBuilder,
    arg: { attrId: number; dataType: number; attrData: any }[]
  ) => {
    for (const { attrId, dataType, attrData } of arg) {
      c.uint16le(attrId).uint8(dataType)
      writeMulti(c, dataType, attrData)
    }
  },
  readStruct: (
    c: BufferBuilder,
    arg: { attrId: number; selector: Selector }[]
  ) => {
    for (const { attrId, selector } of arg) {
      c.uint16le(attrId)
      writeSelector(c, selector)
    }
  },
  writeStruct: (
    c: BufferBuilder,
    arg: {
      attrId: number
      selector: Selector
      dataType: number
      attrData: any
    }[]
  ) => {
    for (const { attrId, selector, dataType, attrData } of arg) {
      c.uint16le(attrId)
      writeSelector(c, selector)
      c.uint8(dataType)
      writeMulti(c, dataType, attrData)
    }
  },
  writeStructRsp: writeWithStatus(
    (c, rec: { attrId: number; selector: Selector }) => {
      c.uint16le(rec.attrId)
      writeSelector(c, rec.selector)
    }
  ),
  discoverRsp: (
    c: BufferBuilder,
    attrInfos: { attrId: number; dataType: number }[]
  ) => {
    for (const { attrId, dataType } of attrInfos) {
      c.uint16le(attrId).uint8(dataType)
    }
  }
} as const

const writeMulti = (
  c: BufferBuilder,
  dataType: number,
  attrData: any
): void => {
  const type = zclTypeName(dataType)
  if (type === "array" || type === "set" || type === "bag") {
    writeAttrVal(c, attrData)
  } else if (type === "struct") {
    writeAttrValStruct(c, attrData)
  } else {
    writeDataTypeByTypeID(dataType, c, attrData)
  }
}
const writeAttrVal = (
  c: BufferBuilder,
  {
    elmType,
    numElms,
    elmVals
  }: {
    elmType: number
    numElms: number
    elmVals: any[]
  }
): void => {
  c.uint8(elmType).uint16le(numElms)
  for (let i = 0; i < numElms; i += 1) {
    writeDataTypeByTypeID(elmType, c, elmVals[i])
  }
}
const writeAttrValStruct = (
  c: BufferBuilder,
  {
    numElms,
    structElms
  }: {
    numElms: number
    structElms: {
      elmType: number
      elmVal: unknown
    }[]
  }
): void => {
  c.uint16le(numElms)
  for (let i = 0; i < numElms; i++) {
    const { elmType, elmVal } = structElms[i]
    c.uint8(elmType)
    writeDataTypeByTypeID(elmType, c, elmVal)
  }
}

interface Selector {
  indicator: number
  indexes: number[]
}
const writeSelector = (
  c: BufferBuilder,
  { indicator, indexes }: Selector
): void => {
  c.uint8(indicator)
  for (let i = 0; i < indicator; i += 1) {
    c.uint16le(indexes[i])
  }
}
const readSelector = (r: BufferWithPointer) => {
  const indicator = r.uint8()
  if (indicator === 0) return { indicator } // TODO: Get rid of this hack, always just return array, with no indicator
  if (indicator > 15) throw new Error(`indicator exceeds 15, got ${indicator}`)
  const indexes = new Array(indicator)
  for (let i = 0; i < indicator; i++) {
    indexes[i] = r.uint16le()
  }
  return { indicator, indexes }
}

export class FoundPayload {
  readonly cmd: string
  readonly cmdId: number
  readonly params: [string, string][]
  constructor(cmd: string | number, zclId: ZclID) {
    const command = zclId.foundation(cmd)

    if (!command) throw new Error("Unrecognized command: " + cmd)

    this.cmd = command.key
    this.cmdId = command.value

    const wholeCommand = zclId.zclmeta.foundation.get(this.cmd)
    if (!wholeCommand) throw new Error(`Unknown command foundation/${this.cmd}`)
    this.cmdId = wholeCommand.id
    this.params = wholeCommand.params
  }

  parse(r: BufferWithPointer) {
    return readCompatabilityLayer(this.cmd, this.readObj(r))
  }

  private readObj(r: BufferWithPointer) {
    const data: Record<string, any> = {}
    for (const [name, type] of this.params) {
      const fn = specialReads[type] || readDataTable[getStdType(type)]

      if (!fn) throw new Error(`No read function for ${type}`)

      data[name] = fn(r)
    }
    return data
  }

  frame(c: BufferBuilder, payload: any) {
    payload = writeCompatabilityLayer(this.cmd, payload)
    if (typeof payload !== "object" || Array.isArray(payload))
      throw new TypeError(
        "Payload arguments of " + this.cmd + " command should be an object"
      )
    return this.writeBuf(payload, c)
  }

  private writeBuf(args, c: BufferBuilder) {
    for (const [name, type] of this.params) {
      if (args[name] === undefined)
        throw new Error(
          `Payload of command: ${this.cmd} must have property ${name}`
        )

      const sfn = specialWrites[type]
      if (sfn) {
        sfn(c, args[name])
        return
      }
      const stdType = getStdType(type)
      const fn = writeDataTable[stdType]
      if (!fn) throw new Error(`No builder method for ${stdType}`)
      fn(c, args[name])
    }
  }
}
