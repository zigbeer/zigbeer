import Concentrate = require("concentrate")

import { ZclID } from "zcl-id"

import { Callback } from "./typeUtils"
import { BufferWithPointer } from "./buffer"
import { stdTypeMapping, zclTypeName } from "./definition"

type ZCLType = keyof typeof stdTypeMapping
type StdType = typeof stdTypeMapping[ZCLType]

const isDataAnalogDigital = (type: number) => {
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
    return "DIGITAL"
  }
  // UNSIGNED_INT, SIGNED_INT
  // FLOAT
  // TIME
  if (
    (type > 0x1f && type < 0x30) ||
    (type > 0x37 && type < 0x40) ||
    (type > 0xdf && type < 0xe8)
  ) {
    return "ANALOG"
  }
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
  const stdType = stdTypeMapping[typeName]
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
  if (isDataAnalogDigital(dataType) === "ANALOG") {
    const repChange = readTypedValue(r, dataType)
    return { direction, dataType, minRepIntval, maxRepIntval, repChange }
  }
  return { direction, dataType, minRepIntval, maxRepIntval }
}

const readDataTable = {
  uint8: (r: BufferWithPointer) => r.uint8(),
  int8: (r: BufferWithPointer) => r.int8(),
  uint16: (r: BufferWithPointer) => r.uint16le(),
  int16: (r: BufferWithPointer) => r.int16le(),
  uint24: (r: BufferWithPointer) => r.uint24le(),
  int24: (r: BufferWithPointer) => r.int24le(),
  uint32: (r: BufferWithPointer) => r.uint32le(),
  int32: (r: BufferWithPointer) => r.int32le(),
  uint40: (r: BufferWithPointer) => r.uint40le(),
  uint48: (r: BufferWithPointer) => r.uint48le(),
  uint56: (r: BufferWithPointer) => r.uint56le(),
  uint64: (r: BufferWithPointer) => r.uint64le(),
  int40: (r: BufferWithPointer) => r.int40le(),
  int48: (r: BufferWithPointer) => r.int48le(),
  int56: (r: BufferWithPointer) => r.int56le(),
  int64: (r: BufferWithPointer) => r.int64le(),
  secKey: (r: BufferWithPointer): number[] => r.buffer(16).toJSON().data,
  floatle: (r: BufferWithPointer) => r.floatle(),
  doublele: (r: BufferWithPointer) => r.doublele(),
  strPreLenUint8: (r: BufferWithPointer) => {
    const len = r.uint8()
    // This needs to encode all possible bytes, not only ASCII
    // because some manufacturers, eg. Xiaomi send binary data
    // under a string datatype.
    // We should probably return a (wrapped?) buffer which the
    // consumer can `.toString` themselves
    return r.string(len, "latin1") // TODO: Spec says 'utf8'
  },
  strPreLenUint16: (r: BufferWithPointer) => {
    const len = r.uint16le()
    return r.string(len, "utf8")
  },
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
    const stdType = stdTypeMapping[typeName]
    const attrData = readDataTable[stdType](r)
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
    r.fwd(-1) //TODO: Fix
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

const writeDataTypeBufTable = {
  uint8: (c: Concentrate, value: number) => c.uint8(value),
  int8: (c: Concentrate, value: number) => c.int8(value),
  uint16: (c: Concentrate, value: number) => c.uint16le(value),
  int16: (c: Concentrate, value: number) => c.int16le(value),
  uint32: (c: Concentrate, value: number) => c.uint32le(value),
  int32: (c: Concentrate, value: number) => c.int32le(value),
  floatle: (c: Concentrate, value: number) => c.floatle(value),
  doublele: (c: Concentrate, value: number) => c.doublele(value),
  uint24: (c: Concentrate, value: number) =>
    c.buffer(
      new Concentrate()
        .uint32le(value)
        .result()
        .slice(0, 3)
    ),
  int24: (c: Concentrate, value: number) =>
    c.buffer(
      new Concentrate()
        .int32le(value)
        .result()
        .slice(0, 3)
    ),
  uint40: (c: Concentrate, value: number) => {
    const buf = Buffer.allocUnsafe(5)
    buf.writeUIntLE(value, 0, 5)
    c.buffer(buf)
  },
  int40: (c: Concentrate, value: number) => {
    const buf = Buffer.allocUnsafe(5)
    buf.writeIntLE(value, 0, 5)
    c.buffer(buf)
  },
  uint48: (c: Concentrate, value: number) => {
    const buf = Buffer.allocUnsafe(6)
    buf.writeUIntLE(value, 0, 6)
    c.buffer(buf)
  },
  int48: (c: Concentrate, value: number) => {
    const buf = Buffer.allocUnsafe(6)
    buf.writeIntLE(value, 0, 6)
    c.buffer(buf)
  },
  uint56: (c: Concentrate, value: Buffer) => {
    if (value.length !== 7)
      throw new TypeError(
        `uint56 Buffer must be 7 bytes long, got ${value.length} instead`
      )
    c.buffer(value)
  },
  int56: (c: Concentrate, value: Buffer) => {
    if (value.length !== 7)
      throw new TypeError(
        `int56 Buffer must be 7 bytes long, got ${value.length} instead`
      )
    c.buffer(value)
  },
  uint64: (c: Concentrate, value: Buffer) => {
    if (value.length !== 8)
      throw new TypeError(
        `uint64 Buffer must be 8 bytes long, got ${value.length} instead`
      )
    c.buffer(value)
  },
  int64: (c: Concentrate, value: Buffer) => {
    if (value.length !== 8)
      throw new TypeError(
        `uint64 Buffer must be 8 bytes long, got ${value.length} instead`
      )
    c.buffer(value)
  },
  strPreLenUint8: (c: Concentrate, value: string) => {
    if (typeof value !== "string") {
      throw new Error("The value for strPreLenUint8 must be a string.")
    }
    const strLen = value.length
    c.uint8(strLen).string(value, "utf8")
  },
  strPreLenUint16: (c: Concentrate, value: string) => {
    if (typeof value !== "string") {
      throw new Error("The value for strPreLenUint16 must be a string.")
    }
    const strLen = value.length
    c.uint16le(strLen).string(value, "ucs2")
  }
}

function foundPayloadFactory(zclId: ZclID) {
  const writeBuf = {
    readRsp: (
      c: Concentrate,
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
    writeRsp: (c: Concentrate, arg: { status: number; attrId: number }) => {
      c.uint8(arg.status)
      if (arg.status !== 0) c.uint16le(arg.attrId)
    },
    configReport: (
      c: Concentrate,
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
        if (isDataAnalogDigital(arg.dataType) === "ANALOG") {
          writeDataTypeByTypeID(arg.dataType, c, arg.repChange)
        }
      } else if (arg.direction === 1) {
        c.uint16le(arg.timeout)
      }
    },
    configReportRsp: (
      c: Concentrate,
      arg: { status: number; direction: 0 | 1; attrId: number }
    ) => {
      c.uint8(arg.status)
      if (arg.status !== 0) c.uint8(arg.direction).uint16le(arg.attrId)
    },
    readReportConfigRsp: (
      c: Concentrate,
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
        writeBuf.configReport(c, arg)
      } else {
        c.uint8(arg.direction).uint16le(arg.attrId)
      }
    }
  }
  /*
        FoundPayload Class
    */
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

    innerParse(zBuf: Buffer) {
      const r = new BufferWithPointer(zBuf)
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

    parse(zBuf: Buffer, callback: Callback<any>) {
      try {
        return callback(undefined, this.innerParse(zBuf))
      } catch (error) {
        return callback(error)
      }
    }

    frame(payload: any) {
      const self = this
      let c = new Concentrate()

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
          payload.attrInfos.forEach((attrInfo: any) => {
            self.writeBuf(attrInfo, c)
          })
          break

        default:
          if (!Array.isArray(payload))
            throw new TypeError(
              "Payload arguments of " + this.cmd + " command should be an array"
            )

          payload.forEach(function(argObj) {
            self.writeBuf(argObj, c)
          })
      }

      return c.result()
    }

    private writeBuf(arg: any, c: Concentrate) {
      const self = this
      const fn = writeBuf[this.cmd]
      if (fn) {
        fn(c, arg)
        return
      }
      for (const { name, type } of this.params) {
        if (arg[name] === undefined)
          throw new Error(
            `Payload of command: ${self.cmd} must have property ${name}`
          )

        if (type === "variable") {
          getDataTypeAndWrite(arg.dataType, c, arg.attrData)
        } else if (type === "selector") {
          getChunkBufTable.selector(c, arg.selector)
        } else if (type === "multi") {
          getChunkBufTable.multi(c, arg)
        } else {
          c[type](arg[name])
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
        const fn = readDataTable[type] || readDataTable[stdTypeMapping[type]]

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

  /*
        Private Functions
    */
  const getChunkBufTable = {
    multi: (
      c: Concentrate,
      { dataType, attrData }: { dataType: any; attrData: any }
    ): void => {
      const typeEntry = zclId.dataType(dataType)
      if (!typeEntry) throw new Error(`Unknown data type ${dataType}`)
      const type = typeEntry.key
      if (type === "array" || type === "set" || type === "bag") {
        getChunkBufTable.attrVal(c, attrData)
      } else if (type === "struct") {
        getChunkBufTable.attrValStruct(c, attrData)
      } else {
        getDataTypeAndWrite(dataType, c, attrData)
      }
    },
    attrVal: (
      c: Concentrate,
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
      c: Concentrate,
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
      c: Concentrate,
      { elmType, elmVal }: { elmType: number; elmVal: unknown }
    ): void => {
      c.uint8(elmType)
      writeDataTypeByTypeID(elmType, c, elmVal)
    },
    selector: (
      c: Concentrate,
      { indicator, indexes }: { indicator: number; indexes: number[] }
    ): void => {
      c.uint8(indicator)

      for (let i = 0; i < indicator; i += 1) {
        c.uint16le(indexes[i])
      }
    }
  }

  function ensureDataTypeString(
    dataType: number | ZCLType | { key: ZCLType }
  ): ZCLType {
    if (typeof dataType === "number") {
      const entry = zclId.dataType(dataType)
      if (entry) return entry.key as any
      throw new Error(
        `Unknown dataType number: ${dataType} (0x${dataType.toString(16)})`
      )
    }
    if (typeof dataType === "object" && dataType.hasOwnProperty("key")) {
      return dataType.key
    }
    if (typeof dataType === "string") {
      return dataType as any
    }
    throw new Error(`Unknown data type ${dataType}`)
  }

  function writeDataTypeByTypeID(type: number, c: Concentrate, value) {
    // This wrapper function exists to optimize for the numeric case in the future
    return getDataTypeAndWrite(type, c, value)
  }

  function getDataTypeAndWrite(type, c: Concentrate, value) {
    const dataType = ensureDataTypeString(type)
    const stdType = stdTypeMapping[dataType]
    if (!stdType) throw new Error(`Unknown dataType ${dataType}`)

    const fn = writeDataTypeBufTable[stdType]
    if (!fn) throw new Error(`Writing dataType ${stdType} not implemented`)

    return fn(c, value)
  }

  return FoundPayload
}

export { foundPayloadFactory }
