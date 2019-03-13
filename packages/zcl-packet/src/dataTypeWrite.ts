import { BufferBuilder } from "buffster"
import { zclTypeName, getStdType } from "./definition"
const assertBufferLength = (name: string, len: number) => (buf: Buffer) => {
  if (buf.length !== len)
    throw new TypeError(
      `${name} Buffer must be ${len} bytes long, got ${buf.length} instead`
    )
  return true
}
const assertUInt56 = assertBufferLength("uint56", 7)
const assertInt56 = assertBufferLength("int56", 7)
const assertUInt64 = assertBufferLength("uint64", 8)
const assertInt64 = assertBufferLength("int64", 8)
const assertString = (name: string) => (val: string) => {
  if (typeof val !== "string") {
    throw new Error(`The value for ${name} must be a string.`)
  }
  return true
}
const assertStrPreLenUint8 = assertString("strPreLenUint8")
const assertStrPreLenUint16 = assertString("strPreLenUint16")
const ENCODING = "utf8"
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
  uint56: (c: BufferBuilder, value: Buffer) =>
    assertUInt56(value) && c.buffer(value),
  int56: (c: BufferBuilder, value: Buffer) =>
    assertInt56(value) && c.buffer(value),
  uint64: (c: BufferBuilder, value: Buffer) =>
    assertUInt64(value) && c.buffer(value),
  int64: (c: BufferBuilder, value: Buffer) =>
    assertInt64(value) && c.buffer(value),
  strPreLenUint8: (c: BufferBuilder, value: string | undefined) =>
    typeof value === "undefined"
      ? c.uint8(0xff)
      : assertStrPreLenUint8(value) &&
        c.uint8(Buffer.byteLength(value, ENCODING)).string(value, ENCODING),
  strPreLenUint16: (c: BufferBuilder, value: string | undefined) =>
    typeof value === "undefined"
      ? c.uint8(0xffff)
      : assertStrPreLenUint16(value) &&
        c.uint16le(Buffer.byteLength(value, ENCODING)).string(value, ENCODING),
  arraySetBag: (
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
  ) => {
    c.uint8(elmType).uint16le(numElms)
    for (let i = 0; i < numElms; i += 1) {
      writeByType(c, elmType, elmVals[i])
    }
  },
  struct: (
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
      writeByType(c, elmType, elmVal)
    }
  }
}

export const writeByType = (
  c: BufferBuilder,
  dataType: number,
  attrData: any
): void => {
  const type = zclTypeName(dataType)
  const stdType = getStdType(type)
  if (!stdType) throw new Error(`Unknown dataType ${dataType}`)

  const fn = writeDataTable[stdType]
  if (!fn) throw new Error(`Writing dataType ${stdType} not implemented`)

  return fn(c, attrData)
}
