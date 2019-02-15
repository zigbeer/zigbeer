import { ZclID } from "zcl-id"
import { SecondArgument } from "./typeUtils"

import { BufferWithPointer, BufferBuilder } from "./buffer"
import { writeDataTable } from "./writeDataTypes"
import { readDataTable } from "./readDataTypes"
import { getStdType } from "./definition"

type ParamTypes = keyof (typeof specialWrites & typeof writeDataTable)

const specialReads = {
  preLenUint8: (r: BufferWithPointer) => r.uint8(), // TODO: Remove this once gone from zcl-id
  preLenUint16: (r: BufferWithPointer) => r.uint16le(), // TODO: Remove this once gone from zcl-id
  preLenUint32: (r: BufferWithPointer) => r.uint32le(), // TODO: Remove this once gone from zcl-id
  len8uint8: (r: BufferWithPointer) => {
    const length = r.uint8()
    const arr: number[] = new Array(length)
    for (let i = 0; i < length; i++) {
      arr[i] = r.uint8()
    }
    return arr
  },
  len32uint8: (r: BufferWithPointer) => {
    const length = r.uint32le()
    const arr: number[] = new Array(length)
    for (let i = 0; i < length; i++) {
      arr[i] = r.uint8()
    }
    return arr
  },
  intervals: (r: BufferWithPointer) => {
    const intervals = r.uint8()
    r.fwd(2) // Skip attrId
    // const arr: Buffer[] = new Array(intervals)
    // const lenghtOfEach = r.remaining() / intervals
    const arr: number[] = new Array(intervals)
    for (let i = 0; i < intervals; i++) {
      // TODO: This isn't always a uint8! It depends on the attribute's normal type!
      // arr[i] = r.buffer(lenghtOfEach)
      arr[i] = r.uint8()
    }
    return arr
  },
  len8uint16: (r: BufferWithPointer) => {
    const length = r.uint8()
    const arr: number[] = new Array(length)
    for (let i = 0; i < length; i++) {
      arr[i] = r.uint16le()
    }
    return arr
  },
  len8uint24: (r: BufferWithPointer) => {
    const length = r.uint8()
    const arr: number[] = new Array(length)
    for (let i = 0; i < length; i++) {
      arr[i] = r.uintle(3)
    }
    return arr
  },
  len8uint32: (r: BufferWithPointer) => {
    const length = r.uint8()
    const arr: number[] = new Array(length)
    for (let i = 0; i < length; i++) {
      arr[i] = r.uint32le()
    }
    return arr
  },
  zonebuffer: (r: BufferWithPointer) => {
    const length = r.uint8()
    const arr: number[] = new Array(length * 2)
    for (let i = 0, off = 0; i < length; i++) {
      arr[off++] = r.uint8()
      arr[off++] = r.uint16le()
    }
    return arr
  },
  extfieldsets: (r: BufferWithPointer) => {
    const arr: {
      clstId: number
      len: number
      extField: number[]
    }[] = []
    while (r.remaining()) {
      const clstId = r.uint16le()
      const len = r.uint8()
      const extField: number[] = new Array(len)
      for (let i = 0; i < len; i++) {
        extField[i] = r.uint8()
      }
      arr.push({
        clstId,
        len,
        extField
      })
    }
    return arr
  },
  neighborsInfo: (r: BufferWithPointer) => {
    const length = r.uint8()
    const arr: (number | Buffer)[] = new Array(length * 6)
    for (let i = 0, off = 0; i < length; i++) {
      const addr = r.buffer(8)
      arr[off++] = addr
      arr[off++] = r.int16le()
      arr[off++] = r.int16le()
      arr[off++] = r.int16le()
      arr[off++] = r.int8()
      arr[off++] = r.uint8()
    }

    return arr
  }
}

export class FuncPayload {
  direction: string
  cluster: string
  cmd: string
  cmdId: number
  params: [string, ParamTypes][]
  constructor(
    clusterId: string | number,
    direction: 0 | 1,
    cmd: string | number,
    zclId: ZclID
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
    this.params = wholeCommand.params as [string, ParamTypes][]

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

  parse(r: BufferWithPointer) {
    const data: Record<string, any> = {}
    for (let [name, type] of this.params) {
      // TODO: Remove all these dirty hacks
      switch (type) {
        case "dynUint8":
          switch (name) {
            case "scenelist":
            case "zoneidlist":
            case "zoneid":
            case "bypassresult":
              r.fwd(-1)
              type = "len8uint8" as any
              break
            case "logpayload":
              r.fwd(-4)
              type = "len32uint8" as any
              break
            case "intervals":
              r.fwd(-3) // len8 and attrId
              type = "intervals" as any
              break
            default:
              throw new Error(`unknown dynUint8 name: ${name}`)
          }
          break
        case "dynUint16":
          switch (name) {
            case "grouplist":
            case "thermoseqmode":
            case "listofattr":
            case "bypassresult":
              r.fwd(-1)
              type = "len8uint16" as any
              break
            default:
              throw new Error(`unknown dynUint16 name: ${name}`)
          }
          break
        case "dynUint24":
          switch (name) {
            case "aalert":
              r.fwd(-1)
              type = "len8uint24" as any
              break
            default:
              throw new Error(`unknown dynUint24 name: ${name}`)
          }
          break
        case "dynUint32":
          switch (name) {
            case "logid":
              r.fwd(-1)
              type = "len8uint32" as any
              break
            default:
              throw new Error(`unknown dynUint32 name: ${name}`)
          }
          break
        case "zonebuffer":
          r.fwd(-1)
          break
        case "neighborsInfo":
          r.fwd(-1)
          break
      }
      // End of dirty hacks

      const fn = specialReads[type] || readDataTable[getStdType(type)]

      if (!fn) throw new Error(`No read function for ${type}`)

      data[name] = fn(r)
    }
    return data
  }

  // args can be an array or a value-object if given
  frame(c: BufferBuilder, args) {
    if (typeof args !== "object")
      throw new TypeError("`args` must be an object or array")
    const newArgs = this.params.map(
      Array.isArray(args)
        ? ([, type], i) => ({ type, value: args[i] })
        : ([name, type]) => {
            if (!args.hasOwnProperty(name)) {
              throw new Error("The argument object has incorrect properties")
            }
            return { type, value: args[name] }
          }
    )

    frameArgs(c, newArgs)
  }
}

const specialWrites = {
  preLenUint8: (c: BufferBuilder, value: number) => c.uint8(value),
  preLenUint16: (c: BufferBuilder, value: number) => c.uint16le(value),
  preLenUint32: (c: BufferBuilder, value: number) => c.uint32le(value),
  buffer: (c: BufferBuilder, value: Buffer) => c.buffer(Buffer.from(value)),
  strPreLenUint8: (c: BufferBuilder, value: string) =>
    c.uint8(value.length).string(value, "utf8"),
  dynUint8: (c: BufferBuilder, value: number[]): void => {
    for (const val of value) {
      c.uint8(val)
    }
  },
  dynUint16: (c: BufferBuilder, value: number[]): void => {
    for (const val of value) {
      c.uint16le(val)
    }
  },
  dynUint32: (c: BufferBuilder, value: number[]): void => {
    for (const val of value) {
      c.uint32le(val)
    }
  },
  dynUint24: (c: BufferBuilder, value: number[]): void => {
    for (const val of value) {
      const msb24 = (val & 0xff0000) >> 16
      const mid24 = (val & 0xff00) >> 8
      const lsb24 = val & 0xff
      c.uint8(lsb24)
        .uint8(mid24)
        .uint8(msb24)
    }
  },
  neighborsInfo: (c: BufferBuilder, value: (Buffer | number)[]): void => {
    let k = 0
    // [ '0x00124b00019c2ee9', int16, int16, int16, int8, uint8, ... ]
    for (let idxarr = 0; idxarr < value.length / 6; idxarr += 1) {
      const addr = value[k++]
      if (!((addr as unknown) instanceof Buffer))
        throw new Error(
          `The first element of neighborsInfo must be a buffer, got ${addr} instead`
        )
      if ((addr as Buffer).length !== 8)
        throw new Error(
          `The address buffer must be 8 bytes, got ${
            (addr as Buffer).length
          } instead`
        )
      c.buffer(addr as Buffer)
        .int16le(value[k++] as number) // Do we need to test this is number?
        .int16le(value[k++] as number)
        .int16le(value[k++] as number)
        .int8(value[k++] as number)
        .uint8(value[k++] as number)
    }
  },
  zonebuffer: (c: BufferBuilder, value: number[]): void => {
    let k = 0
    // [ uint8, uint16, ... ]
    for (let idxarr = 0; idxarr < value.length / 2; idxarr += 1) {
      c.uint8(value[k]).uint16le(value[k + 1])
      k += 2
    }
  },
  extfieldsets: (
    c: BufferBuilder,
    value: { clstId: number; len: number; extField: any }[]
  ) => {
    for (const { clstId, len, extField } of value) {
      c.uint16le(clstId)
        .uint8(len)
        .buffer(Buffer.from(extField))
    }
  }
}
const frameArg = <T extends ParamTypes>(
  type: T,
  c: BufferBuilder,
  value: SecondArgument<
    T extends keyof typeof writeDataTable
      ? typeof writeDataTable[T]
      : T extends keyof typeof specialWrites
      ? typeof specialWrites[T]
      : never
  >
): void => {
  const fn: ((c: BufferBuilder, val: typeof value) => void) | undefined =
    specialWrites[type as string] || writeDataTable[getStdType(type as string)]
  if (!fn) throw new Error(`No frameArgMap defined for ${type}`)
  fn(c, value)
}
const frameArgs = (
  c: BufferBuilder,
  args: { type: ParamTypes; value: any }[]
) => {
  for (const { type, value } of args) {
    frameArg(type, c, value)
  }
}
