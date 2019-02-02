import Concentrate = require("concentrate")
import dissolveChunks = require("dissolve-chunks")
import { buf2Str, writeUInt64 } from "./utils"
import { ZclID } from "zcl-id"
import { SecondArgument } from "./typeUtils"

const buf2ArrMap = {
  dynUint8: (buf: Buffer) => {
    const { length } = buf
    const repeats = length
    const arr: number[] = new Array(length)
    for (let i = 0; i < repeats; i++) {
      arr[i] = buf.readUInt8(i)
    }
    return arr
  },
  dynUint16: (buf: Buffer) => {
    const { length } = buf
    const repeats = length / 2
    const arr: number[] = new Array(repeats)
    for (let i = 0; i < repeats; i++) {
      arr[i] = buf.readUInt16LE(i * 2)
    }
    return arr
  },
  dynUint24: (buf: Buffer) => {
    const { length } = buf
    const repeats = length / 3
    const arr: number[] = new Array(repeats)
    for (let i = 0; i < repeats; i++) {
      const offset = i * 3
      const lsb = buf.readUInt16LE(offset)
      const msb = buf.readUInt8(offset + 2)
      const val = (msb << 16) + lsb
      arr[i] = val
    }
    return arr
  },
  dynUint32: (buf: Buffer) => {
    const { length } = buf
    const repeats = length / 4
    const arr: number[] = new Array(repeats)
    for (let i = 0; i < repeats; i++) {
      const offset = i * 4
      arr[i] = buf.readUInt32LE(offset)
    }
    return arr
  },
  zonebuffer: (buf: Buffer) => {
    const { length } = buf
    const repeats = (length * 2) / 3
    const arr: number[] = new Array(repeats)
    for (let i = 0; i < repeats; i += 2) {
      const offset = (i * 3) / 2
      arr[i] = buf.readUInt8(offset)
      arr[i + 1] = buf.readUInt16LE(offset + 1)
    }
    return arr
  },
  extfieldsets: (buf: Buffer) => {
    const { length } = buf
    const arr: {
      clstId: number
      len: number
      extField: number[]
    }[] = []
    let offset = 0
    while (offset < length) {
      const clstId = buf.readUInt16LE(offset)
      offset += 2
      const len = buf.readUInt8(offset)
      offset += 1
      const extField: number[] = new Array(len)
      for (let j = 0; j < len; j++) {
        extField[j] = buf.readUInt8(offset + j)
      }
      offset += len
      arr.push({
        clstId,
        len,
        extField
      })
    }
    return arr
  },
  locationbuffer: (buf: Buffer) => {
    const { length } = buf
    const repeats = (length * 6) / 16
    const arr: (number | string)[] = new Array(repeats)
    for (let i = 0; i < repeats; i++) {
      const offset = (i * 16) / 6
      const addr = buf2Str(buf.slice(offset, offset + 8))
      arr[i] = addr
      arr[i + 1] = buf.readInt16LE(offset + 8)
      arr[i + 2] = buf.readInt16LE(offset + 10)
      arr[i + 3] = buf.readInt16LE(offset + 12)
      arr[i + 4] = buf.readInt8(offset + 14)
      arr[i + 5] = buf.readUInt8(offset + 15)
    }
    return arr
  }
}
const buf2Arr = (buf: Buffer, type: keyof typeof buf2ArrMap) => {
  const fn = buf2ArrMap[type]
  if (!fn) throw new Error(`Unknown dataType ${type}`)

  return fn(buf)
}

function funcPayloadFactory(zclId: ZclID) {
  const ru = dissolveChunks().Rule()

  let parsedBufLen = 0

  class FuncPayload {
    direction: string
    cluster: string
    cmd: string
    cmdId: number
    params: [string, keyof typeof frameArgMap][]
    constructor(
      clusterId: string | number,
      direction: 0 | 1,
      cmd: string | number
    ) {
      const cluster = zclId.cluster(clusterId)

      if (!cluster) {
        throw new Error(`Unknown cluster ${clusterId}`)
      }

      this.cluster = cluster.key

      const cmdEntry = direction
        ? zclId.getCmdRsp(this.cluster, cmd)
        : zclId.functional(this.cluster, cmd)
      if (!cmdEntry) throw new Error(`Unknown command ${this.cluster}/${cmd}`)

      this.cmd = cmdEntry.key

      const wholeCommand = zclId.zclmeta.functional.get(this.cluster, this.cmd)
      if (!wholeCommand)
        throw new Error(`Unknown command ${this.cluster}/${this.cmd}`)
      this.cmdId = wholeCommand.id
      this.params = wholeCommand.params as [string, keyof typeof frameArgMap][]

      const _direction = zclId.zclmeta.functional.getDirection(
        this.cluster,
        this.cmd
      )
      if (!_direction) {
        throw new Error("Unrecognized direction")
      }
      if (_direction !== (direction ? "serverToClient" : "clientToServer")) {
        throw new Error("Wrong direction")
      }
      this.direction = _direction
    }

    parse(zclBuf: Buffer, callback) {
      const { params } = this
      if (
        this.cluster === "genScenes" &&
        ["add", "enhancedAdd", "viewRsp", "enhancedViewRsp"].includes(this.cmd)
      ) {
        parsedBufLen = params.reduce((acc, [, type]) => {
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
      try {
        const chunkRules = params.map(([name, type]) => {
          const rule = ru[type]
          if (!rule)
            throw new Error("Parsing rule for " + type + " is not found.")
          return rule(name, zclBuf.length)
        })

        if (chunkRules.length === 0) {
          callback(null, {})
          return
        }

        const parser = dissolveChunks()
          .join(chunkRules)
          .compile({ once: true })

        let finished = false

        const listener = (result: any) => {
          if (finished) return
          finished = true
          clearTimeout(parseTimeout)

          callback(null, result)
        }

        const parseTimeout = setTimeout(() => {
          if (finished) return
          finished = true
          parser.removeListener("parsed", listener)
          callback(new Error("zcl functional parse timeout"))
        }, 1000)

        parser.once("parsed", listener)

        parser.end(zclBuf)
      } catch (error) {
        callback(error)
        throw error
      }
    }

    // args can be an array or a value-object if given
    frame(args) {
      if (typeof args !== "object")
        throw new TypeError("`args` must be an object or array")
      const newArgs = Array.isArray(args)
        ? this.params.map(([, type], i) => ({ type, value: args[i] }))
        : this.params.map(([name, type]) => {
            if (!args.hasOwnProperty(name)) {
              throw new Error("The argument object has incorrect properties")
            }
            return { type, value: args[name] }
          })

      return frameArgs(newArgs)
    }
  }

  /*
        Add Parsing Rules to DChunks
    */
  for (const ruName of ["preLenUint8", "preLenUint16", "preLenUint32"]) {
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
  }

  const ruleNames2: (keyof typeof buf2ArrMap)[] = [
    "dynUint8",
    "dynUint16",
    "dynUint24",
    "dynUint32",
    "zonebuffer",
    "extfieldsets",
    "locationbuffer"
  ]
  for (const ruName of ruleNames2) {
    ru.clause(ruName, function(name: string, bufLen: number) {
      this.tap(function() {
        const { preLenNum } = this.vars
        delete this.vars.preLenNum

        let length
        switch (ruName) {
          case "zonebuffer":
            length = preLenNum * 3
            break
          case "extfieldsets":
            length = bufLen - parsedBufLen
            break
          case "locationbuffer":
            length = preLenNum * 16
            break
          default:
            length = preLenNum * (parseInt(ruName.slice(7)) / 8)
        }

        this.buffer(name, length).tap(function() {
          const buf = this.vars[name]
          this.vars[name] = buf2Arr(buf, ruName)
        })
      })
    })
  }

  ru.clause("longaddr", function(name) {
    this.buffer(name, 8).tap(function() {
      this.vars[name] = buf2Str(this.vars[name])
    })
  })

  ru.clause("stringPreLen", function(name) {
    this.uint8("len").tap(function() {
      const { len } = this.vars
      delete this.vars.len
      this.string(name, len)
      parsedBufLen += len
    })
  })

  return FuncPayload
}

export { funcPayloadFactory }
const frameArgMap = {
  int8: (c: Concentrate, value: number) => c.int8(value),
  uint8: (c: Concentrate, value: number) => c.uint8(value),
  int16: (c: Concentrate, value: number) => c.int16le(value),
  uint16: (c: Concentrate, value: number) => c.uint16le(value),
  int32: (c: Concentrate, value: number) => c.int32le(value),
  uint32: (c: Concentrate, value: number) => c.uint32le(value),
  floatle: (c: Concentrate, value: number) => c.floatle(value),
  preLenUint8: (c: Concentrate, value: number) => c.uint8(value),
  preLenUint16: (c: Concentrate, value: number) => c.uint16le(value),
  preLenUint32: (c: Concentrate, value: number) => c.uint32le(value),
  buffer: (c: Concentrate, value: Buffer) => c.buffer(Buffer.from(value)),
  longaddr: writeUInt64,
  stringPreLen: (c: Concentrate, value: string) =>
    c.uint8(value.length).string(value, "utf8"),
  dynUint8: (c: Concentrate, value: number[]): void => {
    for (const val of value) {
      c.uint8(val)
    }
  },
  dynUint16: (c: Concentrate, value: number[]): void => {
    for (const val of value) {
      c.uint16le(val)
    }
  },
  dynUint32: (c: Concentrate, value: number[]): void => {
    for (const val of value) {
      c.uint32le(val)
    }
  },
  dynUint24: (c: Concentrate, value: number[]): void => {
    for (const val of value) {
      const msb24 = (val & 0xff0000) >> 16
      const mid24 = (val & 0xff00) >> 8
      const lsb24 = val & 0xff
      c.uint8(lsb24)
        .uint8(mid24)
        .uint8(msb24)
    }
  },
  locationbuffer: (c: Concentrate, value: (string | number)[]): void => {
    let k = 0
    // [ '0x00124b00019c2ee9', int16, int16, int16, int8, uint8, ... ]
    for (let idxarr = 0; idxarr < value.length / 6; idxarr += 1) {
      writeUInt64(c, value[k++] as string) // there's a check inside

      c.int16le(value[k++] as number) // Do we need to test this is number?
        .int16le(value[k++] as number)
        .int16le(value[k++] as number)
        .int8(value[k++] as number)
        .uint8(value[k++] as number)
    }
  },
  zonebuffer: (c: Concentrate, value: number[]): void => {
    let k = 0
    // [ uint8, uint16, ... ]
    for (let idxarr = 0; idxarr < value.length / 2; idxarr += 1) {
      c.uint8(value[k]).uint16le(value[k + 1])
      k += 2
    }
  },
  extfieldsets: (
    c: Concentrate,
    value: { clstId: number; len: number; extField: any }[]
  ) => {
    for (const { clstId, len, extField } of value) {
      c.uint16le(clstId)
        .uint8(len)
        .buffer(Buffer.from(extField))
    }
  }
}
const frameArg = <T extends keyof typeof frameArgMap>(
  type: T,
  c: Concentrate,
  value: SecondArgument<typeof frameArgMap[T]>
): void => {
  const fn: ((c: Concentrate, val: typeof value) => void) | undefined =
    frameArgMap[type]
  if (!fn) throw `No frameArgMapp defined for ${type}`
  fn(c, value)
}
const frameArgs = (args: { type: keyof typeof frameArgMap; value: any }[]) => {
  const c = new Concentrate()

  for (const { type, value } of args) {
    frameArg(type, c, value)
  }

  return c.result()
}
