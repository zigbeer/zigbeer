import { BufferBuilder } from "./buffer"
export const writeDataTable = {
  noData: (c: BufferBuilder) => {},
  // bool: (c: BufferBuilder, value: boolean) =>
  //   c.uint8(value === true ? 0x01 : value === false ? 0x00 : 0xff),
  uint8: (c: BufferBuilder, value: number) => c.uint8(value),
  int8: (c: BufferBuilder, value: number) => c.int8(value),
  uint16: (c: BufferBuilder, value: number) => c.uint16le(value),
  int16: (c: BufferBuilder, value: number) => c.int16le(value),
  uint32: (c: BufferBuilder, value: number) => c.uint32le(value),
  int32: (c: BufferBuilder, value: number) => c.int32le(value),
  floatle: (c: BufferBuilder, value: number) => c.floatle(value),
  doublele: (c: BufferBuilder, value: number) => c.doublele(value),
  uint24: (c: BufferBuilder, value: number) => c.uintle(value, 3),
  int24: (c: BufferBuilder, value: number) => c.intle(value, 3),
  uint40: (c: BufferBuilder, value: number) => c.uintle(value, 5),
  int40: (c: BufferBuilder, value: number) => c.intle(value, 5),
  uint48: (c: BufferBuilder, value: number) => c.uintle(value, 6),
  int48: (c: BufferBuilder, value: number) => c.intle(value, 6),
  uint56: (c: BufferBuilder, value: Buffer) => {
    if (value.length !== 7)
      throw new TypeError(
        `uint56 Buffer must be 7 bytes long, got ${value.length} instead`
      )
    c.buffer(value)
  },
  int56: (c: BufferBuilder, value: Buffer) => {
    if (value.length !== 7)
      throw new TypeError(
        `int56 Buffer must be 7 bytes long, got ${value.length} instead`
      )
    c.buffer(value)
  },
  uint64: (c: BufferBuilder, value: Buffer) => {
    if (value.length !== 8)
      throw new TypeError(
        `uint64 Buffer must be 8 bytes long, got ${value.length} instead`
      )
    c.buffer(value)
  },
  int64: (c: BufferBuilder, value: Buffer) => {
    if (value.length !== 8)
      throw new TypeError(
        `uint64 Buffer must be 8 bytes long, got ${value.length} instead`
      )
    c.buffer(value)
  },
  strPreLenUint8: (c: BufferBuilder, value: string) => {
    const encoding = "utf8"
    if (typeof value !== "string") {
      throw new Error("The value for strPreLenUint8 must be a string.")
    }
    const strLen = Buffer.byteLength(value, encoding)
    c.uint8(strLen).string(value, encoding)
  },
  strPreLenUint16: (c: BufferBuilder, value: string) => {
    const encoding = "utf8"
    if (typeof value !== "string") {
      throw new Error("The value for strPreLenUint16 must be a string.")
    }
    const strLen = Buffer.byteLength(value, encoding)
    c.uint16le(strLen).string(value, encoding)
  }
}
