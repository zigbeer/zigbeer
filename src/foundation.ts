import { ZclID } from "zcl-id"

import { Callback } from "./typeUtils"
import { BufferWithPointer, BufferBuilder } from "./buffer"
import { stdTypeMapping, zclTypeName, getStdType } from "./definition"
import { readDataTable } from "./readDataTypes"
import { writeDataTable } from "./writeDataTypes"
import { readUntilEnd, fixedLength } from "./readUtils"

type ZCLType = keyof typeof stdTypeMapping
type StdType = typeof stdTypeMapping[ZCLType]

type ParamTypes = keyof (typeof specialWrites & typeof writeDataTable)

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

const attrVal = (r: BufferWithPointer) => {
  const elmType = r.uint8()
  const numElms = r.uint16le()
  const elmVals = new Array(numElms)
  for (let count = 0; count < numElms; count++) {
    elmVals[count] = readTypedValue(r, elmType)
  }
  return { elmType, numElms, elmVals }
}
const attrValStruct = (r: BufferWithPointer) => {
  const numElms = r.uint16le()
  const structElms = new Array(numElms)
  for (let count = 0; count < numElms; count++) {
    const elmType = r.uint8()
    const elmVal = readTypedValue(r, elmType)
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
    return attrVal(r)
  }
  if (typeName === "struct") {
    return attrValStruct(r)
  }
  return readTypedValue(r, dataType)
}
const innerConfigReport = (r: BufferWithPointer) => {
  const direction = r.uint8()
  r.fwd(2) // attrId
  if (direction !== 0) {
    const timeout = r.uint16le()
    return { timeout }
  }
  const dataType = r.uint8()
  const minRepIntval = r.uint16le()
  const maxRepIntval = r.uint16le()
  if (!isAnalogType(dataType)) {
    return { direction, dataType, minRepIntval, maxRepIntval }
  }
  const repChange = readTypedValue(r, dataType)
  return { direction, dataType, minRepIntval, maxRepIntval, repChange }
}

const specialTypeReads = {
  selector: (r: BufferWithPointer) => {
    const indicator = r.uint8()
    const indexes = new Array(indicator)
    for (let i = 0; i < indicator; i++) {
      indexes[i] = r.uint16le()
    }
    return { indicator, indexes }
  },
  variable: (r: BufferWithPointer) => {
    r.fwd(-1) // TODO: Remove `dataType` from before `variable` usage
    const dataType = r.uint8()
    const typeName = zclTypeName(dataType)
    const stdType = getStdType(typeName)
    if (!stdType) throw new Error(`No stdType for typeName ${typeName}`)
    const fn = readDataTable[stdType]
    if (!fn) throw new Error(`No read function for stdType ${stdType}`)
    const attrData = fn(r)
    return { dataType, attrData }
  },
  readRsp: (r: BufferWithPointer) => {
    r.fwd(-1) // TODO: Remove `status` from `foundation/readRsp`
    const status = r.uint8()
    if (status !== 0) return { status }
    const dataType = r.uint8()
    const attrData = innerMulti(r, dataType)
    return { status, dataType, attrData }
  },
  writeRsp: (r: BufferWithPointer) => {
    const status = r.uint8()
    // TODO: Reconsider: Status can only be zero if ALL writes were successful.
    // Otherwise, only failed statuses and their attributes are listed.
    // This shouldn't recurse if it's 0.
    if (status === 0) return { status }
    const attrId = r.uint16le()
    return { status, attrId }
  },
  multi: (r: BufferWithPointer) => {
    r.fwd(-1) // TODO: Fix
    const dataType = r.uint8()
    return innerMulti(r, dataType)
  },
  configReport: (r: BufferWithPointer) => {
    r.fwd(-3) // TODO: Fix
    return innerConfigReport(r)
  },
  configReportRsp: (r: BufferWithPointer) => {
    const status = r.uint8()
    if (status === 0) return { status }
    const direction = r.uint8()
    const attrId = r.uint16le()
    return { status, direction, attrId }
  },
  readReportConfigRsp: (r: BufferWithPointer) => {
    r.fwd(-4) // TODO: Remove `status` from `foundation/readReportConfigRsp`
    const status = r.uint8()
    if (status !== 0) {
      r.fwd(3) // TODO: Remove. Replaces innerConfigReport
      return { status }
    }
    return innerConfigReport(r)
  },
  discoverRsp: readUntilEnd(r => ({
    attrId: r.uint16le(),
    dataType: r.uint8()
  }))
}

const writeDataTypeByTypeID = (typeID: number, c: BufferBuilder, value) => {
  const dataType = zclTypeName(typeID)
  const stdType = getStdType(dataType)
  if (!stdType) throw new Error(`Unknown dataType ${dataType}`)

  const fn = writeDataTable[stdType]
  if (!fn) throw new Error(`Writing dataType ${stdType} not implemented`)

  return fn(c, value)
}

const specialWrites = {
  readRsp: (
    c: BufferBuilder,
    arg: {
      attrId: number
      status: number
      dataType: number
      attrData: unknown
    }
  ) => {
    c.uint16le(arg.attrId).uint8(arg.status)

    if (arg.status === 0) {
      c.uint8(arg.dataType)
      writeMulti(c, arg.dataType, arg.attrData)
    }
  },
  writeRsp: (c: BufferBuilder, arg: { status: number; attrId: number }) => {
    c.uint8(arg.status)
    if (arg.status !== 0) c.uint16le(arg.attrId)
  },
  configReport: (
    c: BufferBuilder,
    arg: {
      direction: 0 | 1
      attrId: number
      dataType: number
      minRepIntval: number
      maxRepIntval: number
      repChange: any
      timeout: number
    }
  ) => {
    c.uint8(arg.direction).uint16le(arg.attrId)
    if (arg.direction === 0) {
      c.uint8(arg.dataType)
        .uint16le(arg.minRepIntval)
        .uint16le(arg.maxRepIntval)
      if (isAnalogType(arg.dataType)) {
        writeDataTypeByTypeID(arg.dataType, c, arg.repChange)
      }
    } else if (arg.direction === 1) {
      c.uint16le(arg.timeout)
    }
    // TODO: Complain about reserved `direction` value
  },
  configReportRsp: (
    c: BufferBuilder,
    arg: { status: number; direction: 0 | 1; attrId: number }
  ) => {
    c.uint8(arg.status)
    if (arg.status !== 0) c.uint8(arg.direction).uint16le(arg.attrId)
  },
  readReportConfigRsp: (
    c: BufferBuilder,
    arg: {
      status: number
      direction: 0 | 1
      attrId: number
      dataType: number
      minRepIntval: number
      maxRepIntval: number
      repChange: any
      timeout: number
    }
  ) => {
    c.uint8(arg.status)
    if (arg.status === 0) {
      specialWrites.configReport(c, arg)
    } else {
      c.uint8(arg.direction).uint16le(arg.attrId)
    }
  }
}

const specialTypeWrites = {
  discoverRsp: (
    c: BufferBuilder,
    attrInfos: { attrId: number; dataType: number }[]
  ) => {
    for (const { attrId, dataType } of attrInfos) {
      c.uint16le(attrId)
      c.uint8(dataType)
    }
  }
}

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
    writeAttrValStructNip(c, structElms[i])
  }
}
const writeAttrValStructNip = (
  c: BufferBuilder,
  {
    elmType,
    elmVal
  }: {
    elmType: number
    elmVal: unknown
  }
): void => {
  c.uint8(elmType)
  writeDataTypeByTypeID(elmType, c, elmVal)
}
const writeSelector = (
  c: BufferBuilder,
  {
    indicator,
    indexes
  }: {
    indicator: number
    indexes: number[]
  }
): void => {
  c.uint8(indicator)
  for (let i = 0; i < indicator; i += 1) {
    c.uint16le(indexes[i])
  }
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
    if (
      this.cmd === "defaultRsp" ||
      this.cmd === "discover" ||
      this.cmd === "discoverRsp"
    ) {
      return this.readObj(r)
    }

    const arr = this.readObjArray(r)
    return arr
  }

  private readObjArray(r: BufferWithPointer) {
    let parsedData = [] as any[]
    while (r.remaining()) {
      parsedData.push(this.readObj(r))
    }
    return parsedData
  }

  private readObj(r: BufferWithPointer) {
    const data: Record<string, any> = {}
    for (const [name, type] of this.params) {
      const fn =
        specialTypeReads[type] ||
        readDataTable[type] ||
        readDataTable[getStdType(type)]

      if (!fn) throw new Error(`No read function for ${type}`)

      const out = fn(r)

      // TODO: Remove all these dirty hacks
      if (type === "variable") {
        const { attrData, dataType } = out
        data.attrData = attrData
        data.dataType = dataType
        continue
      }
      if (name === "extra") {
        Object.assign(data, out)
        continue
      }
      if (type === "selector") {
        if (out.indicator === 0) delete out.indexes
      }
      // End of dirty hacks

      data[name] = out
    }
    return data
  }

  frame(c: BufferBuilder, payload: any) {
    switch (this.cmd) {
      case "defaultRsp":
      case "discover":
        if (typeof payload !== "object" || Array.isArray(payload))
          throw new TypeError(
            "Payload arguments of " + this.cmd + " command should be an object"
          )
        this.writeBuf(payload, c)
        break
      case "discoverRsp":
        if (typeof payload !== "object" || Array.isArray(payload))
          throw new TypeError(
            "Payload arguments of " + this.cmd + " command should be an object"
          )
        this.writeBuf(payload, c)
        // c.uint8(payload.discComplete)
        // for (const attrInfo of payload.attrInfos) {
        //   this.writeBuf(attrInfo, c)
        // }
        break
      default:
        if (!Array.isArray(payload))
          throw new TypeError(
            "Payload arguments of " + this.cmd + " command should be an array"
          )
        for (const argObj of payload) {
          this.writeBuf(argObj, c)
        }
    }
  }

  private writeBuf(args, c: BufferBuilder) {
    const fn = specialWrites[this.cmd]
    if (fn) {
      fn(c, args)
      return
    }
    for (const [name, type] of this.params) {
      if (args[name] === undefined)
        throw new Error(
          `Payload of command: ${this.cmd} must have property ${name}`
        )

      if (type === "variable") {
        writeDataTypeByTypeID(args.dataType, c, args.attrData)
      } else if (type === "selector") {
        writeSelector(c, args.selector)
      } else if (type === "multi") {
        writeMulti(c, args.dataType, args.attrData)
      } else {
        const sfn = specialTypeWrites[type]
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
}
