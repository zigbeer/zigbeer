import { BufferWithPointer } from "./buffer"
import { Status, FailureStatus } from "./definition"

const byteLengths = new WeakMap<(r: BufferWithPointer) => any, number>()

/** Utility to specifiy that a reader function consumes a constant length of buffer */
export const fixedLength = <
  L extends number,
  F extends (r: BufferWithPointer) => any
>(
  len: L,
  fn: F
): F => {
  if (!Number.isInteger(len) || len < 1)
    throw new TypeError(
      `byte length must be a positive integer, got ${len} instead`
    )
  if (byteLengths.has(fn))
    throw new TypeError(
      `tried to redefine byteLength of a function, tried to set ${len}, was ${byteLengths.get(
        fn
      )}`
    )

  byteLengths.set(fn, len)
  return fn
}

/** Wraps a reader function, to read until end of buffer and return array */
export const readUntilEnd = <R>(
  fn: (r: BufferWithPointer) => R
): ((r: BufferWithPointer) => R[]) => {
  const len = byteLengths.get(fn)
  return len
    ? r => {
        const repeats = r.remaining() / len
        if (!Number.isInteger(repeats))
          throw new RangeError(
            `Bad buffer: Remaining length not multiple of repeat unit length`
          )
        const arr: R[] = new Array(repeats)
        for (let i = 0; i < repeats; i++) {
          arr[i] = fn(r)
        }
        return arr
      }
    : r => {
        const arr: R[] = []
        let last = r.remaining()
        while (last !== 0) {
          arr.push(fn(r))
          const remaining = r.remaining()
          if (remaining >= last)
            throw new Error(`Infinite loop: repeat unit isn't consuming buffer`)
          last = remaining
        }
        return arr
      }
}
export const collapseSuccess = <R>(
  fn: (r: BufferWithPointer) => R
): ((
  r: BufferWithPointer
) =>
  | readonly[{ readonly status: 0x00 }]
  | ({ readonly status: FailureStatus } & R)[]) => {
  type Items = ({ readonly status: FailureStatus } & R)[]
  const len = byteLengths.get(fn)
  return len
    ? (r: BufferWithPointer) => {
        const repeats = r.remaining() / len
        if (!Number.isInteger(repeats))
          throw new RangeError(
            `Bad buffer: Remaining length not multiple of repeat unit length`
          )
        const arr: Items = new Array(repeats)
        for (let i = 0; i < repeats; i++) {
          const status = r.uint8() as Status // TODO: Validate that it's a known status?
          if (status === 0x00)
            if (i === 0 && r.remaining() === 0) return [{ status }]
            else throw new Error("Bad payload: successful status not alone")
          arr[i] = { status, ...fn(r) }
        }
        return arr
      }
    : (r: BufferWithPointer) => {
        let i = 0
        const arr: Items = []
        let last = r.remaining()
        while (r.remaining() !== 0) {
          const status = r.uint8() as Status // TODO: Validate that it's a known status?
          if (status === 0x00)
            if (i === 0 && r.remaining() === 0) return [{ status }]
            else throw new Error("Bad payload: successful status not alone")
          arr.push({ status, ...fn(r) })
          const remaining = r.remaining()
          if (remaining >= last)
            throw new Error(`Infinite loop: repeat unit isn't consuming buffer`)
          last = remaining
          i++
        }
        return arr
      }
}
