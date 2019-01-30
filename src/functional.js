"use strict"

const Concentrate = require("concentrate")
const DChunks = require("dissolve-chunks")

function funcPayloadFactory(zclId) {
  const ru = DChunks().Rule()

  let parsedBufLen = 0

  /*
        FuncPayload Class
    */
  class FuncPayload {
    constructor(clusterId, direction, cmd) {
      const cluster = zclId.cluster(clusterId)
      let command

      // string after assgined
      this.direction = undefined
      // string after assigned
      this.cluster = undefined
      // string after assigned
      this.cmd = undefined
      // number after assigned
      this.cmdId = undefined

      if (!cluster) {
        throw new Error("Unrecognized cluster")
      }

      this.cluster = cluster.key
      command = zclId.zclmeta.functional.getCommand(
        this.cluster,
        direction,
        cmd
      )

      if (!command) {
        throw new Error("Unrecognized command")
      }

      this.cmd = command.key
      this.cmdId = command.value

      this.direction = zclId.zclmeta.functional.getDirection(
        this.cluster,
        this.cmd
      )

      if (!this.direction) {
        throw new Error("Unrecognized direction")
      }
    }

    parse(zclBuf, callback) {
      let chunkRules = []
      let err
      let params
      let parser
      let parseTimeout

      if (
        this.cluster === "genScenes" &&
        ["add", "enhancedAdd", "viewRsp", "enhancedViewRsp"].includes(this.cmd)
      ) {
        parsedBufLen = zclId.zclmeta.functional
          .get(this.cluster, this.cmd)
          .params.reduce((acc, [, type]) => {
            switch (type) {
              case "uint8":
              case "stringPreLen":
                return acc + 1

              case "uint16":
                return acc + 2
            }
            return acc
          }, 0)
      }

      params = zclId.zclmeta.functional.getParams(this.cluster, this.cmd)

      // [ { name, type }, ... ]
      if (params) {
        params.forEach(function(arg) {
          let rule = ru[arg.type]
          if (rule) {
            rule = rule(arg.name, zclBuf.length)
            chunkRules.push(rule)
          } else {
            err = new Error("Parsing rule for " + arg.type + " is not found.")
          }
        })
      } else {
        err = new Error("Response parameter definitions not found.")
      }

      if (!err) {
        if (chunkRules.length === 0) {
          callback(null, {})
          return
        }

        parser = DChunks()
          .join(chunkRules)
          .compile()

        parseTimeout = setTimeout(function() {
          if (parser.listenerCount("parsed")) {
            parser.emit("parsed", "__timeout__")
          }

          parseTimeout = null
        }, 3000)

        parser.once("parsed", function(result) {
          if (parseTimeout) {
            clearTimeout(parseTimeout)
            parseTimeout = null
          }

          parser = null

          if (result === "__timeout__") {
            callback(new Error("zcl functional parse timeout"))
          } else {
            callback(null, result)
          }
        })
      }

      // error occurs, no parser created
      if (!parser) {
        callback(err)
      } else {
        parser.end(zclBuf)
      }
    }

    // args can be an array or a value-object if given
    frame(args) {
      let params

      // [ { name, type }, ... ]
      params = zclId.zclmeta.functional.getParams(this.cluster, this.cmd)

      if (params) {
        if (Array.isArray(args)) {
          // arg: { name, type } -> { name, type, value }
          params.forEach(function(arg, idx) {
            arg.value = args[idx]
          })
        } else if (typeof args === "object") {
          params.forEach(function(arg, idx) {
            if (!args.hasOwnProperty(arg.name)) {
              throw new Error("The argument object has incorrect properties")
            } else {
              arg.value = args[arg.name]
            }
          })
        }

        // [ { name, type, value }, ... ]
        args = params
      }

      let dataBuf = Concentrate()

      // arg: { name, type, value }
      args.forEach(function(arg, idx) {
        let type = arg.type
        const val = arg.value

        switch (type) {
          case "int8":
          case "uint8":
          case "int16":
          case "uint16":
          case "int32":
          case "uint32":
          case "floatle":
            dataBuf = dataBuf[type](val)
            break
          case "preLenUint8":
          case "preLenUint16":
          case "preLenUint32":
            type = type.slice(6).toLowerCase()
            dataBuf = dataBuf[type](val)
            break
          case "buffer":
            dataBuf = dataBuf.buffer(new Buffer(val))
            break
          case "longaddr":
            // string '0x00124b00019c2ee9'
            const msb = parseInt(val.slice(2, 10), 16)
            const lsb = parseInt(val.slice(10), 16)

            dataBuf = dataBuf.uint32le(lsb).uint32le(msb)
            break
          case "stringPreLen":
            if (typeof val !== "string") {
              throw new Error("The value for " + val + " must be an string.")
            }
            dataBuf = dataBuf.uint8(val.length).string(val, "utf8")
            break
          case "dynUint8":
          case "dynUint16":
          case "dynUint32":
            // [ x, y, z, ... ]
            type = type.slice(3).toLowerCase()
            for (let idxarr = 0; idxarr < val.length; idxarr += 1) {
              dataBuf = dataBuf[type](val[idxarr])
            }
            break
          case "dynUint24":
            // [ x, y, z, ... ]
            for (let idxarr = 0; idxarr < val.length; idxarr += 1) {
              const value = val[idxarr]
              const msb24 = (value & 0xff0000) >> 16
              const mid24 = (value & 0xff00) >> 8
              const lsb24 = value & 0xff

              dataBuf = dataBuf
                .uint8(lsb24)
                .uint8(mid24)
                .uint8(msb24)
            }
            break
          case "locationbuffer":
            {
              let k = 0
              // [ '0x00124b00019c2ee9', int16, int16, int16, int8, uint8, ... ]
              for (let idxarr = 0; idxarr < val.length / 6; idxarr += 1) {
                const msbaddr = parseInt(val[k].slice(2, 10), 16)
                const lsbaddr = parseInt(val[k].slice(10), 16)
                dataBuf = dataBuf
                  .uint32le(lsbaddr)
                  .uint32le(msbaddr)
                  .int16(val[k + 1])
                  .int16(val[k + 2])
                  .int16(val[k + 3])
                  .int8(val[k + 4])
                  .uint8(val[k + 5])
                k += 6
              }
            }
            break
          case "zonebuffer":
            {
              let k = 0
              // [ uint8, uint16, ... ]
              for (let idxarr = 0; idxarr < val.length / 2; idxarr += 1) {
                dataBuf = dataBuf.uint8(val[k]).uint16le(val[k + 1])
                k += 2
              }
            }
            break
          case "extfieldsets":
            // [ { clstId, len, extField }, ... ]
            for (let idxarr = 0; idxarr < val.length; idxarr += 1) {
              dataBuf = dataBuf
                .uint16le(val[idxarr].clstId)
                .uint8(val[idxarr].len)
                .buffer(new Buffer(val[idxarr].extField))
            }
            break
          default:
            throw new Error("Unknown Data Type")
        }
      })

      return dataBuf.result()
    }
  }

  /*
        Add Parsing Rules to DChunks
    */
  const rules1 = ["preLenUint8", "preLenUint16", "preLenUint32"]

  const rules2 = [
    "dynUint8",
    "dynUint16",
    "dynUint24",
    "dynUint32",
    "zonebuffer",
    "extfieldsets",
    "locationbuffer"
  ]

  rules1.forEach(function(ruName) {
    ru.clause(ruName, function(name) {
      if (ruName === "preLenUint8") {
        this.uint8(name)
      } else if (ruName === "preLenUint16") {
        this.uint16(name)
      } else if (ruName === "preLenUint32") {
        this.uint32(name)
      }

      this.tap(function() {
        this.vars.preLenNum = this.vars[name]
      })
    })
  })

  rules2.forEach(function(ruName) {
    ru.clause(ruName, function(name, bufLen) {
      this.tap(function() {
        let length

        if (ruName === "zonebuffer") {
          length = this.vars.preLenNum * 3
        } else if (ruName === "extfieldsets") {
          length = bufLen - parsedBufLen
        } else if (ruName === "locationbuffer") {
          length = this.vars.preLenNum * 16
        } else {
          length = this.vars.preLenNum * (parseInt(ruName.slice(7)) / 8)
        }

        this.buffer(name, length).tap(function() {
          const buf = this.vars[name]
          this.vars[name] = buf2Arr(buf, ruName)
          delete this.vars.preLenNum
        })
      })
    })
  })

  ru.clause("longaddr", function(name) {
    this.buffer(name, 8).tap(function() {
      const addrBuf = this.vars[name]
      this.vars[name] = addrBuf2Str(addrBuf)
    })
  })

  ru.clause("stringPreLen", function(name) {
    this.uint8("len").tap(function() {
      this.string(name, this.vars.len)
      parsedBufLen += this.vars.len
      delete this.vars.len
    })
  })

  function addrBuf2Str(buf) {
    const bufLen = buf.length
    let strChunk = "0x"

    for (let i = 0; i < bufLen; i += 1) {
      const val = buf.readUInt8(bufLen - i - 1)
      if (val <= 15) {
        strChunk += "0" + val.toString(16)
      } else {
        strChunk += val.toString(16)
      }
    }

    return strChunk
  }

  function buf2Arr(buf, type) {
    const arr = []

    switch (type) {
      case "dynUint8":
        for (let i = 0; i < buf.length; i += 1) {
          arr.push(buf.readUInt8(i))
        }
        break
      case "dynUint16":
        for (let i = 0; i < buf.length; i += 2) {
          arr.push(buf.readUInt16LE(i))
        }
        break
      case "dynUint24":
        for (let i = 0; i < buf.length; i += 3) {
          const lsb = buf.readUInt16LE(i)
          const msb = buf.readUInt8(i + 2)
          const val = (msb << 16) + lsb
          arr.push(val)
        }
        break
      case "dynUint32":
        for (let i = 0; i < buf.length; i += 4) {
          arr.push(buf.readUInt32LE(i))
        }
        break
      case "zonebuffer":
        for (let i = 0; i < buf.length; i += 3) {
          arr.push(buf.readUInt8(i), buf.readUInt16LE(i + 1))
        }
        break
      case "extfieldsets":
        let extFieldLen
        for (let i = 0; i < buf.length; i += extFieldLen) {
          const obj = {}

          obj.clstId = buf.readUInt16LE(i)
          obj.len = extFieldLen = buf.readUInt8(i + 2)
          obj.extField = []
          i += 3
          for (let j = 0; j < obj.len; j += 1) {
            obj.extField.push(buf.readUInt8(i + j))
          }
          arr.push(obj)
        }
        break
      case "locationbuffer":
        for (let i = 0; i < buf.length; i += 16) {
          const addr = addrBuf2Str(buf.slice(i, i + 8))
          arr.push(
            addr,
            buf.readInt16LE(i + 8),
            buf.readInt16LE(i + 10),
            buf.readInt16LE(i + 12),
            buf.readInt8(i + 14),
            buf.readUInt8(i + 15)
          )
        }
        break
      default:
        break
    }

    return arr
  }

  return FuncPayload
}

module.exports = funcPayloadFactory
