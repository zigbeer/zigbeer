export const isAnalogType = (type: number) => {
  // GENERAL_DATA, LOGICAL, BITMAP
  // ENUM
  // STRING, ORDER_SEQ, COLLECTION
  // IDENTIFIER, MISC
  if (
    (type > 0x07 && type < 0x20) ||
    (type > 0x2f && type < 0x38) ||
    (type > 0x3f && type < 0x58) ||
    (type > 0xe7 && type < 0xff)
  ) {
    return false
  }
  // UNSIGNED_INT, SIGNED_INT
  // FLOAT
  // TIME
  if (
    (type > 0x1f && type < 0x30) ||
    (type > 0x37 && type < 0x40) ||
    (type > 0xdf && type < 0xe8)
  ) {
    return true
  }
  throw new Error(
    `dataType ID not in range to find out if it's discrete or analog. Got ${type} instead.`
  )
}

export interface Selector {
  indicator: number
  indexes: number[]
}
