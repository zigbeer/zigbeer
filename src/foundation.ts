import { ZclID } from "zcl-id"

import { Values } from "./typeUtils"
import { BufferWithPointer, BufferBuilder } from "./buffer"
import {
  stdTypeMapping,
  getStdType,
  statusCodes,
  FailureStatus
} from "./definition"
import { readDataTable, readByType } from "./readDataTypes"
import { writeDataTable, writeByType } from "./writeDataTypes"
import { readUntilEnd, fixedLength, collapseSuccess } from "./readUtils"

type ZCLType = keyof typeof stdTypeMapping
type StdType = typeof stdTypeMapping[ZCLType]

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

const readReportConfigRecord = (r: BufferWithPointer) => {
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
    repChange: readByType(r, dataType) // TODO: Won't this always be an unstructured scalar value?
  } as const
}

const specialReads = {
  read: readUntilEnd(fixedLength(2, r => r.uint16le())),
  readRsp: readUntilEnd(r => {
    const attrId = r.uint16le()
    const status = r.uint8()
    if (status !== 0) return { attrId, status } as const
    const dataType = r.uint8()
    const attrData = readByType(r, dataType)
    return { attrId, status, dataType, attrData } as const
  }),
  write: readUntilEnd(r => {
    const attrId = r.uint16le()
    const dataType = r.uint8()
    const attrData = readByType(r, dataType)
    return { attrId, dataType, attrData } as const
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
  configReport: readUntilEnd(readReportConfigRecord),
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
    return { status, ...readReportConfigRecord(r) } as const
  }),
  report: readUntilEnd(r => {
    const attrId = r.uint16le()
    const dataType = r.uint8()
    return { attrId, dataType, attrData: readByType(r, dataType) } as const
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
      attrData: readByType(r, dataType)
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

interface AttrsArray<T> {
  write: (
    args: ReadonlyArray<T>
  ) => {
    readonly attrs: ReadonlyArray<T>
  }
  read: (data: { readonly attrs: ReadonlyArray<T> }) => ReadonlyArray<T>
}
type SpecAA<
  K extends keyof (typeof specialReads & typeof specialWrites)
> = AttrsArray<ReturnType<typeof specialReads[K]>>
const attrsArray: AttrsArray<unknown> = {
  write: <T>(args: ReadonlyArray<T>) =>
    ({
      attrs: args
    } as const),
  read: <T>({ attrs }: { readonly attrs: ReadonlyArray<T> }) => attrs
} as const
const compatabilityTable = {
  read: {
    write: (args: { attrId: number }[]) =>
      ({
        attrIds: args.map(x => x.attrId)
      } as const),
    read: (data: { attrIds: number[] }) =>
      data.attrIds.map(x => ({ attrId: x } as const))
  } as const,
  readRsp: attrsArray as SpecAA<"readRsp">,
  write: attrsArray as SpecAA<"write">,
  writeUndiv: attrsArray as SpecAA<"write">,
  writeRsp: attrsArray as SpecAA<"writeRsp">,
  writeNoRsp: attrsArray as SpecAA<"write">,
  configReport: attrsArray as SpecAA<"configReport">,
  configReportRsp: attrsArray as SpecAA<"configReportRsp">,
  readReportConfig: attrsArray as SpecAA<"readReportConfig">,
  readReportConfigRsp: attrsArray as SpecAA<"readReportConfigRsp">,
  report: attrsArray as SpecAA<"report">,
  readStruct: attrsArray as SpecAA<"readStruct">,
  writeStruct: attrsArray as SpecAA<"writeStruct">,
  writeStructRsp: attrsArray as SpecAA<"writeStructRsp">
} as const
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

type Compat<K extends "read" | "write"> = <
  C extends string,
  A extends C extends keyof typeof compatabilityTable
    ? ArgsType<typeof compatabilityTable[C][K]>[0]
    : any
>(
  cmd: C,
  args: A
) => C extends keyof typeof compatabilityTable
  ? ReturnType<typeof compatabilityTable[C][K]>
  : A

const writeCompatabilityLayer: Compat<"write"> = (cmd, args) => {
  const type = compatabilityTable[cmd as string]
  if (type) return type.write(args)
  return args
}
const readCompatabilityLayer: Compat<"read"> = (cmd, args) => {
  const type = compatabilityTable[cmd as string]
  if (type) return type.read(args)
  return args
}

type ReportConfigRecord =
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
  record: ReportConfigRecord
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
  if (isAnalogType(dataType)) writeByType(c, dataType, record.repChange)
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
        writeByType(c, record.dataType, record.attrData)
      }
    }
  },
  write: (
    c: BufferBuilder,
    arg: { attrId: number; dataType: number; attrData: any }[]
  ) => {
    for (const { attrId, dataType, attrData } of arg) {
      c.uint16le(attrId).uint8(dataType)
      writeByType(c, dataType, attrData)
    }
  },
  writeRsp: writeWithStatus((c, rec: { attrId: number }) => {
    c.uint16le(rec.attrId)
  }),
  configReport: (c: BufferBuilder, arg: ReportConfigRecord[]) => {
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
      | { status: 0x00 } & ReportConfigRecord
      | {
          status: Values<
            Pick<
              typeof statusCodes,
              "unsupAttribute" | "unreportableAttribute" | "notFound"
            >
          >
        } & Pick<ReportConfigRecord, "direction" | "attrId">)[]
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
      writeByType(c, dataType, attrData)
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
      writeByType(c, dataType, attrData)
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

interface Selector {
  indicator: number
  indexes: number[]
}
const writeSelector = (
  c: BufferBuilder,
  { indicator, indexes }: Selector
): void => {
  const depth = indicator & 0x0f
  const operation = indicator >> 4
  if (operation < 0b00 || operation > 0b10)
    throw new Error(`Invalid indicator high bits, got ${operation}`)
  c.uint8(indicator)
  for (let i = 0; i < depth; i += 1) {
    c.uint16le(indexes[i])
  }
}
const readSelector = (r: BufferWithPointer) => {
  const indicator = r.uint8()
  const depth = indicator & 0x0f
  const operation = indicator >> 4
  if (operation < 0b00 || operation > 0b10)
    throw new Error(`Invalid indicator high bits, got ${operation}`)
  if (depth === 0) return { indicator } // TODO: Get rid of this hack, always just return array and operation, with no indicator
  const indexes: Selector["indexes"] = new Array(depth)
  for (let i = 0; i < depth; i++) {
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
    const data: Record<string, any> = {}
    for (const [name, type] of this.params) {
      const fn = specialReads[type] || readDataTable[getStdType(type)]

      if (!fn) throw new Error(`No read function for ${type}`)

      data[name] = fn(r)
    }
    return readCompatabilityLayer(this.cmd, data)
  }

  frame(c: BufferBuilder, payload: any) {
    const compPayload = writeCompatabilityLayer(this.cmd, payload)
    if (typeof compPayload !== "object" || Array.isArray(compPayload))
      throw new TypeError(
        "Payload arguments of " + this.cmd + " command should be an object"
      )
    for (const [name, type] of this.params) {
      if (compPayload[name] === undefined)
        throw new Error(
          `Payload of command: ${this.cmd} must have property ${name}`
        )

      const sfn = specialWrites[type]
      if (sfn) {
        sfn(c, compPayload[name])
        return
      }
      const stdType = getStdType(type)
      const fn = writeDataTable[stdType]
      if (!fn) throw new Error(`No write function for ${stdType}`)
      fn(c, compPayload[name])
    }
  }
}
