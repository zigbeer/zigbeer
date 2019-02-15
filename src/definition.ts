export const stdTypeMapping = {
  noData: "noData",

  data8: "uint8",
  data16: "uint16",
  data24: "uint24",
  data32: "uint32",
  data40: "uint40",
  data48: "uint48",
  data56: "uint56",
  data64: "uint64",

  boolean: "uint8",

  map8: "uint8",
  map16: "uint16",
  map24: "uint24",
  map32: "uint32",
  map40: "uint40",
  map48: "uint48",
  map56: "uint56",
  map64: "uint64",

  uint8: "uint8",
  uint16: "uint16",
  uint24: "uint24",
  uint32: "uint32",
  uint40: "uint40",
  uint48: "uint48",
  uint56: "uint56",
  uint64: "uint64",

  int8: "int8",
  int16: "int16",
  int24: "int24",
  int32: "int32",
  int40: "int40",
  int48: "int48",
  int56: "int56",
  int64: "int64",

  enum8: "uint8",
  enum16: "uint16",

  semi: undefined,
  single: "floatle",
  double: "doublele",

  octstr: "strPreLenUint8",
  string: "strPreLenUint8",
  octstr16: "strPreLenUint16",
  string16: "strPreLenUint16",

  array: undefined,
  struct: "attrValStruct",

  set: undefined,
  bag: undefined,

  ToD: "uint32",
  date: "uint32",
  utc: "uint32",

  clusterId: "uint16",
  attrId: "uint16",
  bacOid: "uint32",

  ieeeAddr: "uint64",
  secKey: "secKey",
  opaque: undefined,

  unknown: undefined
} as const

export const getStdType = <T extends string>(
  type: T
): Exclude<
  T extends keyof typeof stdTypeMapping
    ? typeof stdTypeMapping[T]
    : typeof stdTypeMapping[keyof typeof stdTypeMapping],
  undefined
> => {
  const stdType = stdTypeMapping[type as keyof typeof stdTypeMapping]
  if (!stdType) throw new Error(`stdType for type ${type} missing`)
  return stdType as any
}

export const zclTypes = {
  noData: 0x00,

  data8: 0x08,
  data16: 0x09,
  data24: 0x0a,
  data32: 0x0b,
  data40: 0x0c,
  data48: 0x0d,
  data56: 0x0e,
  data64: 0x0f,

  boolean: 0x10,

  map8: 0x18,
  map16: 0x19,
  map24: 0x1a,
  map32: 0x1b,
  map40: 0x1c,
  map48: 0x1d,
  map56: 0x1e,
  map64: 0x1f,

  uint8: 0x20,
  uint16: 0x21,
  uint24: 0x22,
  uint32: 0x23,
  uint40: 0x24,
  uint48: 0x25,
  uint56: 0x26,
  uint64: 0x27,

  int8: 0x28,
  int16: 0x29,
  int24: 0x2a,
  int32: 0x2b,
  int40: 0x2c,
  int48: 0x2d,
  int56: 0x2e,
  int64: 0x2f,

  enum8: 0x30,
  enum16: 0x31,

  semi: 0x38,
  single: 0x39,
  double: 0x3a,

  octstr: 0x41,
  string: 0x42,
  octstr16: 0x43,
  string16: 0x44,

  array: 0x48,
  struct: 0x4c,

  set: 0x50,
  bag: 0x51,

  ToD: 0xe0,
  date: 0xe1,
  utc: 0xe2,

  clusterId: 0xe8,
  attrId: 0xe9,
  bacOid: 0xea,

  ieeeAddr: 0xf0,
  secKey: 0xf1,

  unknown: 0xff
} as const
const typeNameLookup = new Map()
for (const [name, id] of Object.entries(zclTypes)) {
  typeNameLookup.set(id, name)
}
type Entries<T> = { [K in keyof T]: [K, T[K]] }
type Values<T> = T[keyof T]
type ByValue<T, V> = Extract<Values<Entries<T>>, [any, V]>[0]
export const zclTypeName = <T extends Values<typeof zclTypes> | number>(
  id: T
) => {
  const name = typeNameLookup.get(id)
  if (name) return name as ByValue<typeof zclTypes, T>
  throw new Error(
    `No Zigbee datatype with id${id.toString &&
      " 0x" + id.toString(16)} (${id})`
  )
}

export const statusCodes = {
  success: 0x00,
  failure: 0x01,
  notAuthorized: 0x7e,
  reservedFieldNotZero: 0x7e,
  malformedCmd: 0x80,
  unsupClusterCmd: 0x81,
  unsupGeneralCmd: 0x82,
  unsupManuClusterCmd: 0x83,
  unsupManuGeneralCmd: 0x84,
  invalidField: 0x85,
  unsupAttribute: 0x86,
  invalidValue: 0x87,
  readOnly: 0x88,
  insufficientSpace: 0x89,
  duplicateExists: 0x8a,
  notFound: 0x8b,
  unreportableAttribute: 0x8c,
  invalidDataType: 0x8d,
  invalidSelector: 0x8e,
  writeOnly: 0x8f,
  inconsistentStartupState: 0x90,
  definedOutOfBand: 0x91,
  inconsistent: 0x92,
  actionDenied: 0x93,
  timeout: 0x94,
  abort: 0x95,
  invalidImage: 0x96,
  waitForData: 0x97,
  noImageAvailable: 0x98,
  requireMoreImage: 0x99,
  notificationPending: 0x9a,
  hardwareFailure: 0xc0,
  softwareFailure: 0xc1,
  calibrationError: 0xc2,
  unsupportedCluster: 0xc3
} as const

export type Status = Values<typeof statusCodes>
export type FailureStatus = Exclude<Status, 0>
