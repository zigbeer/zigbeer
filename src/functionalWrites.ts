import { BufferBuilder } from "./buffer"

export const specialWrites = {
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
    value: {
      clstId: number
      len: number
      extField: any
    }[]
  ) => {
    for (const { clstId, len, extField } of value) {
      c.uint16le(clstId)
        .uint8(len)
        .buffer(Buffer.from(extField))
    }
  }
}
