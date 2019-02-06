import Concentrate = require("concentrate")
import dissolveChunks = require("dissolve-chunks")

import { ZclID } from "zcl-id"

import { buf2Str, writeUInt64, timeout } from "./utils"
import { Callback, SecondArgument } from "./typeUtils"
import { BufferWithPointer } from "./buffer"

const bufToArray = (buf: Buffer) => {
  const arr: number[] = buf.toJSON().data
  return arr
}

function foundPayloadFactory(zclId: ZclID) {
  const dChunks = dissolveChunks()
  const ru = dChunks.Rule()

  let parsedBufLen = 0

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
          getDataTypeAndWrite(arg.dataType, c, arg.repChange)
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

    parse(zBuf: Buffer, callback: Callback<any>) {
      if (this.cmd === "defaultRsp" || this.cmd === "discover") {
        return this.readObj(zBuf).then(
          (result?: { data: any; leftBuf: Buffer }) => {
            if (!result) return callback(new Error("Couldn't getObj"))

            const { data } = result
            callback(null, data)
          },
          callback
        )
      }

      if (this.cmd === "discoverRsp") {
        const pBuf = new BufferWithPointer(zBuf)
        const discComplete = pBuf.uint8()
        parsedBufLen += pBuf.pointer
        const rest = pBuf.rest()
        return this.readObjArray(rest).then(
          attrInfos => callback(undefined, { discComplete, attrInfos }),
          callback
        )
      }

      return this.readObjArray(zBuf).then(
        result => callback(undefined, result),
        callback
      )
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

          this._getBuf(payload, c)
          break

        case "discoverRsp":
          if (typeof payload !== "object" || Array.isArray(payload))
            throw new TypeError(
              "Payload arguments of " +
                this.cmd +
                " command should be an object"
            )

          c = c.uint8(payload.discComplete)
          payload.attrInfos.forEach((attrInfo: any) => {
            self._getBuf(attrInfo, c)
          })
          break

        default:
          if (!Array.isArray(payload))
            throw new TypeError(
              "Payload arguments of " + this.cmd + " command should be an array"
            )

          payload.forEach(function(argObj) {
            self._getBuf(argObj, c)
          })
          break
      }

      return c.result()
    }

    private _getBuf(arg: any, c: Concentrate) {
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

    private async readObjArray(buf: Buffer) {
      let parsedData = [] as any[]
      while (true) {
        const result = await this.readObj(buf)
        buf = result.leftBuf
        const { data } = result
        if (data) parsedData.push(data)

        if (!buf.length) return parsedData
      }
    }

    private readObj(buf: Buffer) {
      const { params } = this

      const knownBufLen = params.reduce(
        (acc, { type }) =>
          type === "uint8" ? acc + 1 : type === "uint16" ? acc + 2 : acc,
        0
      )

      parsedBufLen = knownBufLen

      const chunkRules = params.map(({ type, name }) => ru[type]([name]))

      let parser = dissolveChunks()
        .join(chunkRules)
        .compile({ once: true })

      let resolve

      const resultPromise = new Promise(res => {
        resolve = res
        parser.once("parsed", resolve)
        parser.end(buf)
      })

      const parseTimeout = timeout(1000)

      return Promise.race([
        resultPromise.then(parsed => {
          parseTimeout.cancel()
          return {
            data: parsed,
            leftBuf: buf.slice(parsedBufLen)
          }
        }),
        parseTimeout.then(() => {
          parser.removeListener("parsed", resolve)
          throw new Error("zcl functional parse timeout")
        })
      ])
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
        getDataTypeAndWrite(elmType, c, elmVals[i])
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
      getDataTypeAndWrite(elmType, c, elmVal)
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

  function ensureDataTypeString(dataType) {
    if (typeof dataType === "number") {
      const entry = zclId.dataType(dataType)
      if (entry) return entry.key
      throw new Error(
        `Unknown dataType number: ${dataType} (0x${dataType.toString(16)})`
      )
    }
    if (typeof dataType === "object" && dataType.hasOwnProperty("key")) {
      return dataType.key
    }
    if (typeof dataType === "string") {
      return dataType
    }
  }

  function getDataType(dataType) {
    const type = ensureDataTypeString(dataType)
    if (!type) throw new Error(`Unknown data type ${type}`)
    let newDataType: string | undefined

    switch (type) {
      case "data8":
      case "boolean":
      case "bitmap8":
      case "uint8":
      case "enum8":
        newDataType = "uint8"
        parsedBufLen += 1
        break
      case "int8":
        newDataType = "int8"
        parsedBufLen += 1
        break
      case "data16":
      case "bitmap16":
      case "uint16":
      case "enum16":
      case "clusterId":
      case "attrId":
        newDataType = "uint16"
        parsedBufLen += 2
        break
      case "int16":
        newDataType = "int16"
        parsedBufLen += 2
        break
      case "semiPrec":
        // TODO
        break
      case "data24":
      case "bitmap24":
      case "uint24":
        newDataType = "uint24"
        parsedBufLen += 3
        break
      case "int24":
        newDataType = "int24"
        parsedBufLen += 3
        break
      case "data32":
      case "bitmap32":
      case "uint32":
      case "tod":
      case "date":
      case "utc":
      case "bacOid":
        newDataType = "uint32"
        parsedBufLen += 4
        break
      case "int32":
        newDataType = "int32"
        parsedBufLen += 4
        break
      case "singlePrec":
        newDataType = "floatle"
        parsedBufLen += 4
        break
      case "doubleprec":
        newDataType = "doublele"
        parsedBufLen += 8
        break
      case "uint40":
      case "bitmap40":
      case "data40":
        newDataType = "uint40"
        parsedBufLen += 5
        break
      case "uint48":
      case "bitmap48":
      case "data48":
        newDataType = "uint48"
        parsedBufLen += 6
        break
      case "uint56":
      case "bitmap56":
      case "data56":
        newDataType = "uint56"
        parsedBufLen += 7
        break
      case "uint64":
      case "bitmap64":
      case "data64":
      case "ieeeAddr":
        newDataType = "uint64"
        parsedBufLen += 8
        break
      case "int40":
        newDataType = "int40"
        parsedBufLen += 5
        break
      case "int48":
        newDataType = "int48"
        parsedBufLen += 6
        break
      case "int56":
        newDataType = "int56"
        parsedBufLen += 7
        break
      case "int64":
        newDataType = "int64"
        parsedBufLen += 8
        break
      case "octetStr":
      case "charStr":
        newDataType = "strPreLenUint8"
        break
      case "longOctetStr":
      case "longCharStr":
        newDataType = "strPreLenUint16"
        break
      case "struct":
        newDataType = "attrValStruct"
        break
      case "noData":
      case "unknown":
        break
      case "secKey":
        newDataType = "secKey"
        parsedBufLen += 16
        break
    }
    if (!newDataType) throw new Error(`Unknown data type ${type}`)
    return newDataType
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
      if (!Array.isArray(value) || value.length !== 2) {
        throw new Error(
          "The value for UINT40/BITMAP40/DATA40 must be orgnized in an 2-element number array."
        )
      }
      if (value[0] > 0xff) {
        throw new Error(
          "The value[0] for UINT40/BITMAP40/DATA40 must be smaller than 0xff (255)."
        )
      }
      c.uint32le(value[1]).uint8(value[0])
    },
    int40: (c: Concentrate, value: number) => {
      /* TODO: Not implemented */
    },
    uint48: (c: Concentrate, value: number) => {
      if (!Array.isArray(value) || value.length !== 2) {
        throw new Error(
          "The value for UINT48/BITMAP48/DATA48 must be orgnized in an 2-element number array."
        )
      }
      if (value[0] > 0xffff) {
        throw new Error(
          "The value[0] for UINT48/BITMAP48/DATA48 must be smaller than 0xffff (65535)."
        )
      }
      c.uint32le(value[1]).uint16le(value[0])
    },
    int48: (c: Concentrate, value: number) => {
      /* TODO: Not implemented */
    },
    uint56: (c: Concentrate, value: number) => {
      if (!Array.isArray(value) || value.length !== 2) {
        throw new Error(
          "The value for UINT56/BITMAP56/DATA56 must be orgnized in an 2-element number array."
        )
      }
      if (value[0] > 0xffffff) {
        throw new Error(
          "The value[0] for UINT56/BITMAP56/DATA56 must be smaller than 0xffffff (16777215)."
        )
      }
      c.uint32le(value[1])
      c.buffer(
        new Concentrate()
          .uint32le(value[0])
          .result()
          .slice(0, 3)
      )
    },
    int56: (c: Concentrate, value: number) => {
      /* TODO: Not implemented */
    },
    uint64: writeUInt64,
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

  function getDataTypeAndWrite(type: string | number, c: Concentrate, value) {
    const stdType = getDataType(type)
    const fn = writeDataTypeBufTable[stdType]
    if (fn) {
      fn(c, value)
      return
    }
  }

  function isDataAnalogDigital(type: number) {
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

  /*
        Add Parsing Rules to DChunks
    */
  ru.clause("uint24", function(name) {
    this.uint16("lsb")
      .uint8("msb")
      .tap(function() {
        const { msb, lsb } = this.vars
        delete this.vars.lsb
        delete this.vars.msb
        this.vars[name] = (msb << 16) + lsb
      })
  })

  ru.clause("int24", function(name) {
    this.uint16("lsb")
      .uint8("msb")
      .tap(function() {
        const { msb, lsb } = this.vars
        delete this.vars.lsb
        delete this.vars.msb
        const sign = (msb & 0x80) >> 7
        const value = ((msb & 0x7f) << 16) + lsb
        this.vars[name] = sign ? value - 0x800000 : value
      })
  })

  ru.clause("uint40", function(name) {
    this.uint32("lsb")
      .uint8("msb")
      .tap(function() {
        const { msb, lsb } = this.vars
        delete this.vars.lsb
        delete this.vars.msb
        this.vars[name] = [msb, lsb]
      })
  })

  ru.clause("int40", function(name) {
    // TODO
  })

  ru.clause("uint48", function(name) {
    this.uint32("lsb")
      .uint16("msb")
      .tap(function() {
        const { msb, lsb } = this.vars
        delete this.vars.lsb
        delete this.vars.msb
        this.vars[name] = [msb, lsb]
      })
  })

  ru.clause("int48", function(name) {
    // TODO
  })

  ru.clause("uint56", function(name) {
    this.uint32("lsb")
      .uint16("xsb")
      .uint8("msb")
      .tap(function() {
        const { msb, xsb, lsb } = this.vars
        delete this.vars.lsb
        delete this.vars.xsb
        delete this.vars.msb
        this.vars[name] = [msb, xsb, lsb]
      })
  })

  ru.clause("int56", function(name) {
    // TODO
  })

  ru.clause("uint64", function(name) {
    this.buffer(name, 8).tap(function() {
      this.vars[name] = buf2Str(this.vars[name])
    })
  })

  ru.clause("strPreLenUint8", function(name) {
    parsedBufLen += 1
    this.uint8("len").tap(function() {
      const { len } = this.vars
      delete this.vars.len
      parsedBufLen += len
      this.buffer(name, len).tap(function() {
        // This needs to encode all possible bytes, not only ASCII
        // because some manufacturers, eg. Xiaomi send binary data
        // under a string datatype.
        this.vars[name] = this.vars[name].toString("latin1")
      })
    })
  })

  ru.clause("strPreLenUint16", function(name) {
    parsedBufLen += 2
    this.uint16("len").tap(function() {
      const { len } = this.vars
      delete this.vars.len
      parsedBufLen += len
      this.string(name, len)
    })
  })

  ru.clause("secKey", function(name) {
    this.buffer(name, 16).tap(function() {
      this.vars[name] = bufToArray(this.vars[name])
    })
  })

  ru.clause("variable", function(name, dataTypeParam) {
    if (!dataTypeParam) dataTypeParam = "dataType"

    this.tap(function() {
      const stdType = getDataType(this.vars[dataTypeParam])
      ru[stdType](name)(this)
    })
  })

  ru.clause("attrVal", function() {
    let count = 0
    parsedBufLen += 3
    this.uint8("elmType")
      .uint16("numElms")
      .tap(function() {
        if (!this.vars.numElms) {
          this.vars.elmVals = []
        } else {
          this.loop("elmVals", function(end) {
            ru.variable("data", "elmType")(this)

            count += 1
            if (count === this.vars.numElms) end()
          }).tap(function() {
            this.vars.elmVals = this.vars.elmVals.map(elmVal => elmVal.data)
          })
        }
      })
  })

  ru.clause("attrValStruct", function() {
    let count = 0

    parsedBufLen += 2
    this.uint16("numElms").tap(function() {
      if (!this.vars.numElms) {
        this.vars.structElms = []
      } else {
        this.loop("structElms", function(end) {
          parsedBufLen += 1
          this.uint8("elmType").tap(function() {
            ru.variable("elmVal", "elmType")(this)
          })

          count += 1
          if (count === this.vars.numElms) end()
        }).tap(function() {
          this.vars.structElms.forEach(function(structElm) {
            delete structElm.__proto__
          })
        })
      }
    })
  })

  ru.clause("selector", function() {
    let count = 0

    parsedBufLen += 1
    this.tap("selector", function() {
      this.uint8("indicator").tap(function() {
        if (!this.vars.indicator) {
          this.indexes = []
        } else {
          this.loop("indexes", function(end) {
            this.uint16("ind")
            parsedBufLen += 2

            count += 1
            if (count === this.vars.indicator) end()
          }).tap(function() {
            this.vars.indexes = this.vars.indexes.map(index => index.ind)
          })
        }
      })
    }).tap(function() {
      delete this.vars.selector.__proto__
    })
  })

  ru.clause("multi", function(name) {
    let flag = false

    this.tap(name, function() {
      const type = zclId.dataTypeId.keys.get(this.vars.dataType)

      if (type === "array" || type === "set" || type === "bag") {
        ru.attrVal()(this)
      } else if (type === "struct") {
        ru.attrValStruct()(this)
      } else {
        flag = true
        ru.variable(name)(this)
      }
    }).tap(function() {
      delete this.vars[name].__proto__
      if (flag) this.vars[name] = this.vars[name][name]
    })
  })

  ru.clause("readRsp", function() {
    this.tap(function() {
      if (this.vars.status === 0) {
        parsedBufLen += 1
        this.uint8("dataType").tap(function() {
          ru.multi("attrData")(this)
        })
      }
    })
  })

  ru.clause("writeRsp", function() {
    this.uint8("status").tap(function() {
      if (this.vars.status === 0) {
        parsedBufLen += 1
      } else {
        this.uint16("attrId")
        parsedBufLen += 3
      }
    })
  })

  ru.clause("configReport", function() {
    this.tap(function() {
      if (this.vars.direction === 0) {
        parsedBufLen += 5
        this.uint8("dataType")
          .uint16("minRepIntval")
          .uint16("maxRepIntval")
          .tap(function() {
            const analogOrDigital = isDataAnalogDigital(this.vars.dataType)
            if (analogOrDigital === "ANALOG") ru.variable("repChange")(this)
          })
      } else {
        this.uint16("timeout")
        parsedBufLen += 2
      }
    })
  })

  ru.clause("configReportRsp", function() {
    this.uint8("status").tap(function() {
      if (this.vars.status === 0) {
        parsedBufLen += 1
      } else {
        this.uint8("direction").uint16("attrId")
        parsedBufLen += 4
      }
    })
  })

  ru.clause("readReportConfigRsp", function() {
    this.tap(function() {
      if (this.vars.status === 0) {
        ru.configReport()(this)
      }
    })
  })

  return FoundPayload
}

export { foundPayloadFactory }
