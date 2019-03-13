import { BufferWithPointer } from "buffster"
import { readByType } from "./dataTypeRead"
import { isAnalogType, Selector } from "./foundationUtils"
import { collapseSuccess, fixedLength, readUntilEnd } from "./readUtils"

const readSelector = (r: BufferWithPointer) => {
  const indicator = r.uint8()
  const depth = indicator & 0x0f
  const operation = indicator >> 4
  if (operation < 0b00 || operation > 0b10)
    throw new Error(`Invalid indicator high bits, got ${operation}`)
  if (depth === 0) return { indicator } as const // TODO: Get rid of this hack, always just return array and operation, with no indicator
  const indexes: Selector["indexes"] = new Array(depth)
  for (let i = 0; i < depth; i++) {
    indexes[i] = r.uint16le()
  }
  return { indicator, indexes } as const
}

const readReportConfigRecord = (r: BufferWithPointer) => {
  const direction = r.uint8()
  const attrId = r.uint16le()
  if (direction === 0x01)
    return { direction, attrId, timeout: r.uint16le() } as const
  if (direction !== 0x00) throw `Direction must be 0 or 1, got ${direction}`
  const dataType = r.uint8()
  const minRepIntval = r.uint16le()
  const maxRepIntval = r.uint16le()
  if (!isAnalogType(dataType))
    return { direction, attrId, dataType, minRepIntval, maxRepIntval } as const
  return {
    direction,
    attrId,
    dataType,
    minRepIntval,
    maxRepIntval,
    repChange: readByType(r, dataType) // TODO: Won't this always be an unstructured scalar value?
  } as const
}

export const specialReads = {
  read: readUntilEnd(fixedLength(2, r => r.uint16le())),
  readRsp: readUntilEnd(r => {
    const attrId = r.uint16le()
    const status = r.uint8()
    if (status !== 0) return { attrId, status } as const
    const dataType = r.uint8()
    const attrData = readByType(r, dataType)
    return { attrId, status, dataType, attrData } as const
  }),
  write: readUntilEnd(r => {
    const attrId = r.uint16le()
    const dataType = r.uint8()
    const attrData = readByType(r, dataType)
    return { attrId, dataType, attrData } as const
  }),
  writeRsp: collapseSuccess(
    fixedLength(
      3,
      r =>
        ({
          attrId: r.uint16le()
        } as const)
    )
  ),
  configReport: readUntilEnd(readReportConfigRecord),
  configReportRsp: collapseSuccess(
    fixedLength(
      4,
      r =>
        ({
          direction: r.uint8(),
          attrId: r.uint16le()
        } as const)
    )
  ),
  readReportConfig: readUntilEnd(
    fixedLength(
      3,
      r => ({ direction: r.uint8(), attrId: r.uint16le() } as const)
    )
  ),
  readReportConfigRsp: readUntilEnd((r: BufferWithPointer) => {
    const status = r.uint8()
    if (status !== 0x00) {
      // TODO: assert and type that only "unsupAttribute" | "unreportableAttribute" | "notFound" get returned
      return { status, direction: r.uint8(), attrId: r.uint16le() } as const
    }
    return { status, ...readReportConfigRecord(r) } as const
  }),
  report: readUntilEnd(r => {
    const attrId = r.uint16le()
    const dataType = r.uint8()
    return { attrId, dataType, attrData: readByType(r, dataType) } as const
  }),
  readStruct: readUntilEnd(r => {
    return { attrId: r.uint16le(), selector: readSelector(r) } as const
  }),
  writeStruct: readUntilEnd(r => {
    const attrId = r.uint16le()
    const selector = readSelector(r)
    const dataType = r.uint8()
    return {
      attrId,
      selector,
      dataType,
      attrData: readByType(r, dataType)
    } as const
  }),
  writeStructRsp: collapseSuccess(
    r =>
      ({
        attrId: r.uint16le(),
        selector: readSelector(r)
      } as const)
  ),
  discoverRsp: readUntilEnd(
    fixedLength(
      3,
      r =>
        ({
          attrId: r.uint16le(),
          dataType: r.uint8()
        } as const)
    )
  )
} as const
