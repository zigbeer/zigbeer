import { BufferWithPointer } from "./buffer"

const byteLength = Symbol("ByteLengthRead")

/** Utility to specifiy that a reader function consumes a constant length of buffer */
export const fixedLength = <
  L extends number,
  F extends ((r: BufferWithPointer) => any) & { [byteLength]?: L }
>(
  len: L,
  fn: F
) => {
  if (!Number.isInteger(len) || len < 1)
    throw new TypeError(
      `byte length must be a positive integer, got ${len} instead`
    )
  fn[byteLength] = len
  return fn as F & { [byteLength]: L }
}

/** Wraps a reader function, to read until end of buffer and return array */
export const readUntilEnd = <R>(
  fn: ((r: BufferWithPointer) => R) & { [byteLength]?: number }
): ((r: BufferWithPointer) => R[]) => {
  const len = fn[byteLength]
  return len
    ? r => {
        const repeats = r.remaining() / len
        if (!Number.isInteger(repeats))
          throw new RangeError(
            `Bad buffer: Remaining length not multiple of repeat unit length`
          )
        const arr: R[] = new Array(len)
        for (let i = 0; i < repeats; i++) {
          arr[i] = fn(r)
        }
        return arr
      }
    : r => {
        const arr: R[] = []
        let last = r.remaining()
        while (last) {
          arr.push(fn(r))
          const remaining = r.remaining()
          if (remaining >= last)
            throw new Error(`Infinite loop: repeat unit isn't consuming buffer`)
          last = remaining
        }
        return arr
      }
}
