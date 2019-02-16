import { BufferBuilder } from "./buffer"
import { writeByType } from "./dataTypeWrite"
import { statusCodes } from "./definition"
import { isAnalogType, Selector } from "./foundationUtils"
import { Values } from "./typeUtils"
import { writeWithStatus } from "./writeUtils"

type ReportConfigRecord =
  | { direction: 0x01; attrId: number; timeout: number }
  | {
      direction: 0x00
      attrId: number
      dataType: number
      minRepIntval: number
      maxRepIntval: number
      repChange: any
    }

const writeReportConfigRecord = (
  c: BufferBuilder,
  record: ReportConfigRecord
) => {
  c.uint8(record.direction).uint16le(record.attrId)
  if (record.direction === 0x01) {
    c.uint16le(record.timeout)
    return
  }
  if (record.direction !== 0x00)
    throw `Direction must be 0 or 1, got ${record!.direction}`
  const { dataType, minRepIntval, maxRepIntval } = record
  c.uint8(dataType)
    .uint16le(minRepIntval)
    .uint16le(maxRepIntval)
  if (isAnalogType(dataType)) writeByType(c, dataType, record.repChange)
}

const writeSelector = (
  c: BufferBuilder,
  { indicator, indexes }: Selector
): void => {
  const depth = indicator & 0x0f
  const operation = indicator >> 4
  if (operation < 0b00 || operation > 0b10)
    throw new Error(`Invalid indicator high bits, got ${operation}`)
  c.uint8(indicator)
  for (let i = 0; i < depth; i += 1) {
    c.uint16le(indexes[i])
  }
}

export const specialWrites = {
  read: (c: BufferBuilder, attrIds: number[]) => {
    for (const attrId of attrIds) {
      c.uint16le(attrId)
    }
  },
  readRsp: (
    c: BufferBuilder,
    arg: {
      attrId: number
      status: number
      dataType: number
      attrData: unknown
    }[]
  ) => {
    for (const record of arg) {
      c.uint16le(record.attrId).uint8(record.status)
      if (record.status === 0) {
        c.uint8(record.dataType)
        writeByType(c, record.dataType, record.attrData)
      }
    }
  },
  write: (
    c: BufferBuilder,
    arg: {
      attrId: number
      dataType: number
      attrData: any
    }[]
  ) => {
    for (const { attrId, dataType, attrData } of arg) {
      c.uint16le(attrId).uint8(dataType)
      writeByType(c, dataType, attrData)
    }
  },
  writeRsp: writeWithStatus((c, rec: { attrId: number }) => {
    c.uint16le(rec.attrId)
  }),
  configReport: (c: BufferBuilder, arg: ReportConfigRecord[]) => {
    for (const record of arg) {
      writeReportConfigRecord(c, record)
    }
  },
  configReportRsp: writeWithStatus(
    (
      c,
      rec: {
        direction: 0x00 | 0x01
        attrId: number
      }
    ) => {
      c.uint8(rec.direction).uint16le(rec.attrId)
    }
  ),
  readReportConfig: (
    c: BufferBuilder,
    arg: {
      direction: 0x00 | 0x01
      attrId: number
    }[]
  ) => {
    for (const { direction, attrId } of arg) c.uint8(direction).uint16le(attrId)
  },
  readReportConfigRsp: (
    c: BufferBuilder,
    arg: (
      | {
          status: 0x00
        } & ReportConfigRecord
      | {
          status: Values<
            Pick<
              typeof statusCodes,
              "unsupAttribute" | "unreportableAttribute" | "notFound"
            >
          >
        } & Pick<ReportConfigRecord, "direction" | "attrId">)[]
  ) => {
    for (const record of arg) {
      c.uint8(record.status)
      if (record.status !== 0x00) {
        c.uint8(record.direction).uint16le(record.attrId)
        continue
      }
      writeReportConfigRecord(c, record)
    }
  },
  report: (
    c: BufferBuilder,
    arg: {
      attrId: number
      dataType: number
      attrData: any
    }[]
  ) => {
    for (const { attrId, dataType, attrData } of arg) {
      c.uint16le(attrId).uint8(dataType)
      writeByType(c, dataType, attrData)
    }
  },
  readStruct: (
    c: BufferBuilder,
    arg: {
      attrId: number
      selector: Selector
    }[]
  ) => {
    for (const { attrId, selector } of arg) {
      c.uint16le(attrId)
      writeSelector(c, selector)
    }
  },
  writeStruct: (
    c: BufferBuilder,
    arg: {
      attrId: number
      selector: Selector
      dataType: number
      attrData: any
    }[]
  ) => {
    for (const { attrId, selector, dataType, attrData } of arg) {
      c.uint16le(attrId)
      writeSelector(c, selector)
      c.uint8(dataType)
      writeByType(c, dataType, attrData)
    }
  },
  writeStructRsp: writeWithStatus(
    (
      c,
      rec: {
        attrId: number
        selector: Selector
      }
    ) => {
      c.uint16le(rec.attrId)
      writeSelector(c, rec.selector)
    }
  ),
  discoverRsp: (
    c: BufferBuilder,
    attrInfos: {
      attrId: number
      dataType: number
    }[]
  ) => {
    for (const { attrId, dataType } of attrInfos) {
      c.uint16le(attrId).uint8(dataType)
    }
  }
} as const
