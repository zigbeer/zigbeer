import { ZclID } from "zcl-id"

import { Callback } from "./typeUtils"
import { BufferWithPointer, BufferBuilder } from "./buffer"
import { stdTypeMapping, zclTypeName, getStdType } from "./definition"
import { readDataTable } from "./readDataTypes"
import { writeDataTable } from "./writeDataTypes"

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

const specialReads = {
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
  }
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
      getChunkBufTable.multi(c, arg)
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

const getChunkBufTable = {
  multi: (
    c: BufferBuilder,
    { dataType, attrData }: { dataType: number; attrData: any }
  ): void => {
    const type = zclTypeName(dataType)
    if (type === "array" || type === "set" || type === "bag") {
      getChunkBufTable.attrVal(c, attrData)
    } else if (type === "struct") {
      getChunkBufTable.attrValStruct(c, attrData)
    } else {
      writeDataTypeByTypeID(dataType, c, attrData)
    }
  },
  attrVal: (
    c: BufferBuilder,
    {
      elmType,
      numElms,
      elmVals
    }: { elmType: number; numElms: number; elmVals: any[] }
  ): void => {
    c.uint8(elmType).uint16le(numElms)
    for (let i = 0; i < numElms; i += 1) {
      writeDataTypeByTypeID(elmType, c, elmVals[i])
    }
  },
  attrValStruct: (
    c: BufferBuilder,
    {
      numElms,
      structElms
    }: {
      numElms: number
      structElms: { elmType: number; elmVal: unknown }[]
    }
  ): void => {
    c.uint16le(numElms)
    for (let i = 0; i < numElms; i++) {
      getChunkBufTable.attrValStructNip(c, structElms[i])
    }
  },
  attrValStructNip: (
    c: BufferBuilder,
    { elmType, elmVal }: { elmType: number; elmVal: unknown }
  ): void => {
    c.uint8(elmType)
    writeDataTypeByTypeID(elmType, c, elmVal)
  },
  selector: (
    c: BufferBuilder,
    { indicator, indexes }: { indicator: number; indexes: number[] }
  ): void => {
    c.uint8(indicator)

    for (let i = 0; i < indicator; i += 1) {
      c.uint16le(indexes[i])
    }
  }
}

const foundPayloadFactory = (zclId: ZclID) => {
  class FoundPayload {
    readonly cmd: string
    readonly cmdId: number
    readonly params: {
      name: string
      type: string
    }[]
    constructor(cmd: string | number) {
      const command = zclId.foundation(cmd)

      if (!command) throw new Error("Unrecognized command: " + cmd)

      const { key: cmdName, value: cmdId } = command

      this.cmd = cmdName
      this.cmdId = cmdId

      const params = zclId.zclmeta.foundation.getParams(cmdName)
      if (!params)
        throw new Error("Zcl Foundation not support " + cmd + " command.")

      this.params = params
    }

    parse(r: BufferWithPointer) {
      if (this.cmd === "defaultRsp" || this.cmd === "discover") {
        return this.readObj(r)
      }

      if (this.cmd === "discoverRsp") {
        const discComplete = r.uint8()
        const arr = this.readObjArray(r)
        return { discComplete, attrInfos: arr }
      }

      const arr = this.readObjArray(r)
      return arr
    }

    frame(c: BufferBuilder, payload: any) {
      switch (this.cmd) {
        case "defaultRsp":
        case "discover":
          if (typeof payload !== "object" || Array.isArray(payload))
            throw new TypeError(
              "Payload arguments of " +
                this.cmd +
                " command should be an object"
            )
          this.writeBuf(payload, c)
          break
        case "discoverRsp":
          if (typeof payload !== "object" || Array.isArray(payload))
            throw new TypeError(
              "Payload arguments of " +
                this.cmd +
                " command should be an object"
            )
          c.uint8(payload.discComplete)
          for (const attrInfo of payload.attrInfos) {
            this.writeBuf(attrInfo, c)
          }
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

    private writeBuf(arg: any, c: BufferBuilder) {
      const fn = specialWrites[this.cmd]
      if (fn) {
        fn(c, arg)
        return
      }
      for (const { name, type } of this.params) {
        if (arg[name] === undefined)
          throw new Error(
            `Payload of command: ${this.cmd} must have property ${name}`
          )

        if (type === "variable") {
          writeDataTypeByTypeID(arg.dataType, c, arg.attrData)
        } else if (type === "selector") {
          getChunkBufTable.selector(c, arg.selector)
        } else if (type === "multi") {
          getChunkBufTable.multi(c, arg)
        } else {
          const stdType = getStdType(type)
          const fn = writeDataTable[stdType]
          if (!fn) throw new Error(`No builder method for ${stdType}`)
          fn(c, arg[name])
        }
      }
    }

    private readObjArray(r: BufferWithPointer) {
      let parsedData = [] as any[]
      while (r.remaining()) {
        parsedData.push(this.readObj(r))
      }
      return parsedData
    }

    private readObj(r: BufferWithPointer) {
      const { params } = this

      const data: Record<string, any> = {}
      for (const { type, name } of params) {
        const fn =
          specialReads[type] ||
          readDataTable[type] ||
          readDataTable[getStdType(type)]

        if (!fn) throw new Error(`No read function for ${type}`)

        let out = fn(r)

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
  }
  return FoundPayload
}

export { foundPayloadFactory }
