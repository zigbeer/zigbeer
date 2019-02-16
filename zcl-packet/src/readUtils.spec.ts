import { fixedLength, readUntilEnd } from "./readUtils"
import { BufferWithPointer } from "./buffer"

const readTwo = (r: BufferWithPointer) => [r.fwd(1), r.fwd(1)]
const readTwoLengthed = fixedLength(2, (r: BufferWithPointer) => [
  r.fwd(1),
  r.fwd(1)
])
const makeBuf = len => new BufferWithPointer(Buffer.allocUnsafe(len))

describe("readUntilEnd", () => {
  it("should work without fixed length", () => {
    const readAllTwos = readUntilEnd(readTwo)
    expect(readAllTwos(makeBuf(4))).toEqual([[0, 1], [2, 3]])
    expect(() => readAllTwos(makeBuf(3))).toThrowErrorMatchingInlineSnapshot(
      `"Index past Buffer end"`
    )
    expect(() => readAllTwos(makeBuf(5))).toThrowErrorMatchingInlineSnapshot(
      `"Index past Buffer end"`
    )
  })
  it("should work with fixed length", () => {
    const readAllTwosFixed = readUntilEnd(readTwoLengthed)
    expect(readAllTwosFixed(makeBuf(4))).toEqual([[0, 1], [2, 3]])
    expect(() =>
      readAllTwosFixed(makeBuf(3))
    ).toThrowErrorMatchingInlineSnapshot(
      `"Bad buffer: Remaining length not multiple of repeat unit length"`
    )
    expect(() =>
      readAllTwosFixed(makeBuf(5))
    ).toThrowErrorMatchingInlineSnapshot(
      `"Bad buffer: Remaining length not multiple of repeat unit length"`
    )
  })
  it("should rely on provided length", () => {
    const readAllTwosFixedNoop = readUntilEnd(fixedLength(2, () => {}))
    expect(readAllTwosFixedNoop(makeBuf(4))).toEqual([undefined, undefined])
    expect(() =>
      readAllTwosFixedNoop(makeBuf(3))
    ).toThrowErrorMatchingInlineSnapshot(
      `"Bad buffer: Remaining length not multiple of repeat unit length"`
    )
    expect(() =>
      readAllTwosFixedNoop(makeBuf(5))
    ).toThrowErrorMatchingInlineSnapshot(
      `"Bad buffer: Remaining length not multiple of repeat unit length"`
    )
  })
  it("should not enter infinite loops", () => {
    const readAllZeros = readUntilEnd(() => {})
    expect(() => readAllZeros(makeBuf(4))).toThrowErrorMatchingInlineSnapshot(
      `"Infinite loop: repeat unit isn't consuming buffer"`
    )

    let flag = true
    const readAllPlusMinus = readUntilEnd(r => {
      r.fwd(flag ? 1 : -1)
      flag = !flag
    })
    expect(() =>
      readAllPlusMinus(makeBuf(4))
    ).toThrowErrorMatchingInlineSnapshot(
      `"Infinite loop: repeat unit isn't consuming buffer"`
    )

    expect(() =>
      readUntilEnd(fixedLength(0, () => {}))
    ).toThrowErrorMatchingInlineSnapshot(
      `"byte length must be a positive integer, got 0 instead"`
    )
  })
})
