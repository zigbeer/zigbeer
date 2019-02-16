import { BufferWithPointer } from "./buffer"
import { getStdType, zclTypeName } from "./definition"
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
    if (len === 0xff) return
    // This needs to encode all possible bytes, not only ASCII
    // because some manufacturers, eg. Xiaomi send binary data
    // under a string datatype.
    // We should probably return a (wrapped?) buffer which the
    // consumer can `.toString` themselves
    return r.string(len, "latin1") // TODO: Spec says 'utf8'
  },
  strPreLenUint16: (r: BufferWithPointer) => {
    const len = r.uint16le()
    if (len === 0xffff) return
    return r.string(len, "utf8")
  },
  arraySetBag: (r: BufferWithPointer) => {
    const elmType = r.uint8()
    const numElms = r.uint16le()
    const elmVals = new Array(numElms)
    for (let count = 0; count < numElms; count++) {
      elmVals[count] = readByType(r, elmType)
    }
    return { elmType, numElms, elmVals }
  },
  struct: (r: BufferWithPointer) => {
    const numElms = r.uint16le()
    const structElms = new Array(numElms)
    for (let count = 0; count < numElms; count++) {
      const elmType = r.uint8()
      const elmVal = readByType(r, elmType)
      structElms[count] = { elmType, elmVal }
    }
    return { numElms, structElms }
  }
}

export const readByType = (r: BufferWithPointer, dataType: number) => {
  const type = zclTypeName(dataType)
  const stdType = getStdType(type)
  if (!stdType) throw new Error(`Unknown dataType ${dataType}`)

  const fn = readDataTable[stdType]
  if (!fn) throw new Error(`Writing dataType ${stdType} not implemented`)

  return fn(r)
}
