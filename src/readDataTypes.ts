import { BufferWithPointer } from "./buffer"
export const readDataTable = {
  noData: (r: BufferWithPointer) => {},
  uint8: (r: BufferWithPointer) => r.uint8(),
  int8: (r: BufferWithPointer) => r.int8(),
  uint16: (r: BufferWithPointer) => r.uint16le(),
  int16: (r: BufferWithPointer) => r.int16le(),
  uint24: (r: BufferWithPointer) => r.uintle(3),
  int24: (r: BufferWithPointer) => r.intle(3),
  uint32: (r: BufferWithPointer) => r.uint32le(),
  int32: (r: BufferWithPointer) => r.int32le(),
  uint40: (r: BufferWithPointer) => r.uintle(5),
  uint48: (r: BufferWithPointer) => r.uintle(6),
  uint56: (r: BufferWithPointer) => r.buffer(7),
  uint64: (r: BufferWithPointer) => r.buffer(8),
  int40: (r: BufferWithPointer) => r.intle(5),
  int48: (r: BufferWithPointer) => r.intle(6),
  int56: (r: BufferWithPointer) => r.buffer(7),
  int64: (r: BufferWithPointer) => r.buffer(8),
  secKey: (r: BufferWithPointer): number[] => r.buffer(16).toJSON().data,
  floatle: (r: BufferWithPointer) => r.floatle(),
  doublele: (r: BufferWithPointer) => r.doublele(),
  strPreLenUint8: (r: BufferWithPointer) => {
    const len = r.uint8()
    // This needs to encode all possible bytes, not only ASCII
    // because some manufacturers, eg. Xiaomi send binary data
    // under a string datatype.
    // We should probably return a (wrapped?) buffer which the
    // consumer can `.toString` themselves
    return r.string(len, "latin1") // TODO: Spec says 'utf8'
  },
  strPreLenUint16: (r: BufferWithPointer) => {
    const len = r.uint16le()
    return r.string(len, "utf8")
  }
}
