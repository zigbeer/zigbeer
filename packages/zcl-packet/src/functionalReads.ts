import { BufferWithPointer } from "buffster"
import { readUntilEnd } from "./readUtils"

export const specialReads = {
  preLenUint8: (r: BufferWithPointer) => r.uint8(),
  preLenUint16: (r: BufferWithPointer) => r.uint16le(),
  preLenUint32: (r: BufferWithPointer) => r.uint32le(),
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
  extfieldsets: readUntilEnd(r => {
    const clstId = r.uint16le()
    const len = r.uint8()
    const extField: number[] = new Array(len)
    for (let i = 0; i < len; i++) {
      extField[i] = r.uint8()
    }
    return {
      clstId,
      len,
      extField
    } as const
  }),
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
