import { Enum } from "./enum"

import * as common from "./definitions/common.json"
import * as clusterDefs from "./definitions/cluster_defs.json"

/* type DataTypeNames = keyof typeof common.dataType */
type DataTypeNames = string

interface ClusterDef {
  attrId?: Record<string, { id: number; type: DataTypeNames }>
  cmd?: Record<string, number>
  cmdRsp?: Record<string, number>
}
const _clusterDefs = clusterDefs as Record<string, ClusterDef | undefined>

/* interface CommonJSON {
  profileId: Record<keyof typeof common.profileId, number>
  foundation: Record<keyof typeof common.foundation, number>
  dataType: Record<keyof typeof common.dataType, number>
  status: Record<keyof typeof common.status, number>
  otaStatus: Record<keyof typeof common.otaStatus, number>
  clusterId: Record<keyof typeof common.clusterId, number>
  haDevId: Record<keyof typeof common.haDevId, number>
  [key: string]: Record<string, number>
} */
interface CommonJSON {
  profileId: Record<string, number>
  foundation: Record<string, number>
  dataType: Record<string, number>
  status: Record<string, number>
  otaStatus: Record<string, number>
  clusterId: Record<string, number>
  haDevId: Record<string, number>
  [key: string]: Record<string, number>
}
/**
 * The whole common.json
 */
export const _common: CommonJSON = common
/**
 * The zigbee profile ID lookup
 *
 * key: 2-letter profile name, value: numeric ID
 *
 * example: `{ key: "HA", value: 260 }`
 */
export const profileId = new Enum(_common.profileId)
/**
 * The foundation command ID lookup
 *
 * key: 2-letter profile name, value: numeric ID
 *
 * example: `{ key: "read", value: 0 }`
 */
export const foundationId = new Enum(_common.foundation)
/**
 * The datatype ID lookup
 *
 * key: DataType name, value: numeric ID
 *
 * example: `{ key: "uint8", value: 32 }`
 */
export const dataTypeId = new Enum(_common.dataType)
/**
 * The status ID lookup
 *
 * key: status name, value: numeric ID
 *
 * example: `{ key: "success", value: 0 }`
 */
export const statusId = new Enum(_common.status)
/**
 * The OTA update status ID lookup
 *
 * key: status name, value: numeric ID
 *
 * example: `{ key: "ABORT", value: 149 }`
 */
export const otaStatusId = new Enum(_common.otaStatus)
/**
 * The cluster ID lookup
 *
 * key: status name, value: numeric ID
 *
 * example: `{ key: "genOnOff", value: 6 }`
 */
export const clusterId = new Enum(_common.clusterId)
/**
 * Zigbee device ID lookups, per profile name
 */
export const deviceId: {
  HA: Enum<keyof typeof _common.cluster, number>
  [key: string]: Enum<string, number>
} = {
  /**
   * The device ID lookup of Home Automation profile
   *
   * key: status name, value: numeric ID
   *
   * example: `{ key: "onOffOutput", value: 2 }`
   */
  HA: new Enum(_common.haDevId)
}

function isValidArgType(param: any): param is string | number {
  if (typeof param === "string") {
    return true
  }
  if (typeof param === "number") {
    return !isNaN(param)
  }
  return false
}

const assertAndParse = (val: any, name: string): string | number => {
  if (!isValidArgType(val))
    throw new TypeError(name + " should be a number or a string.")
  const num = parseInt(val as string, 10)
  return isNaN(num) ? val : num
}

type AttributeName = string
type AttributeID = number
type AttributeType = DataTypeNames
type CommandName = string
type CommandID = number
type CommandResponseName = string
type CommandResponseID = number
interface NewFormatCluster {
  /**
   * key: Attribute Name, value: numeric ID
   *
   * example: `{ key: "modelId", value: 5 }`
   */
  attr: Enum<AttributeName, AttributeID>
  /**
   * key: Attribute Name, value: DataType Name
   *
   * example: `{ key: "uint8", value: 32 }`
   */
  attrType: Enum<AttributeName, AttributeType>
  /**
   * key: Functional Command Name, value: numeric ID
   *
   * example: `{ key: "view", value: 1 }`
   */
  cmd?: Enum<CommandName, CommandID>
  /**
   * key: Functional Command Response Name, value: numeric ID
   *
   * example: `{ key: "viewRsp", value: 1 }`
   */
  cmdRsp?: Enum<CommandResponseName, CommandResponseID>
}

function clusterWithNewFormat({
  attrId,
  cmd,
  cmdRsp
}: ClusterDef): NewFormatCluster {
  type AttrID = NonNullable<typeof attrId>
  const attrs: Record<keyof AttrID, AttrID[string]["id"]> = {}
  const attrTypes: Record<keyof AttrID, AttrID[string]["type"]> = {}

  for (const name in attrId) {
    const { id, type } = attrId[name]
    attrs[name] = id
    attrTypes[name] = type
  }

  return {
    attr: new Enum(attrs),
    attrType: new Enum(attrTypes),
    cmd: cmd ? new Enum(cmd) : undefined,
    cmdRsp: cmdRsp ? new Enum(cmdRsp) : undefined
  }
}

const newFormatClusters = new Map()

type AnyClusterName = keyof typeof _common.clusterId

/**
 * Get cluster description by name
 * */
export function _getCluster(
  cluster: AnyClusterName | string
): NewFormatCluster | undefined {
  const readyCluster = newFormatClusters.get(cluster)
  if (readyCluster) return readyCluster

  const newClusterDef = _clusterDefs[cluster]
  if (!newClusterDef) return // throw new Error(`Cluster ${cluster} not found in cluster_defs.json`)

  const newCluster = clusterWithNewFormat(newClusterDef)
  newFormatClusters.set(cluster, newCluster)
  delete _clusterDefs[cluster] // Drop references to original Def to free memory. Do we need this?
  return newCluster
}

/**
 * Get cluster description by name|id|id as string
 */
function getClusterDescription(cId: string | number) {
  cId = assertAndParse(cId, "cId")

  const cName = clusterId.getKey(cId)
  if (!cName) return

  return _getCluster(cName)
}

/**
 * Get profile entry by name|id|id as string
 *
 * example: `{ key: 'HA', value: 260 }`
 * */
export function profile(profId: string | number) {
  profId = assertAndParse(profId, "profId")

  return profileId.get(profId)
}

/**
 * Get device entry of profile by two name|id|id as string
 *
 * example: `{ key: "onOffOutput", value: 2 }`
 * */
export function device(profId: string | number, devId: string | number) {
  profId = assertAndParse(profId, "profId")
  devId = assertAndParse(devId, "devId")

  const profItem = profileId.get(profId)
  if (!profItem) return

  return deviceId[profItem.key].get(devId)
}

/**
 * Get cluster entry by name|id|id as string
 *
 * example: `{ key: "genOnOff", value: 6 }`
 * */
export function cluster(cId: string | number) {
  cId = assertAndParse(cId, "cId")

  return clusterId.get(cId)
}

/**
 * Get foundation command entry by name|id|id as string
 *
 * example: `{ key: "read", value: 0 }`
 * */
export function foundation(cmdId: string | number) {
  cmdId = assertAndParse(cmdId, "cmdId")

  return foundationId.get(cmdId)
}

/**
 * Get functional command entry of cluster by two name|id|id as string
 *
 * example: `{ key: "view", value: 1 }`
 * */
export function functional(cId: string | number, cmdId: string | number) {
  cmdId = assertAndParse(cmdId, "cmdId")

  const cInfo = getClusterDescription(cId)
  if (!cInfo || !cInfo.cmd) return

  return cInfo.cmd.get(cmdId)
}

/**
 * Get functional (command) response entry of cluster by two name|id|id as string
 *
 * example: `{ key: "viewRsp", value: 1 }`
 * */
export function getCmdRsp(cId: string | number, rspId: string | number) {
  rspId = assertAndParse(rspId, "rspId")

  const cInfo = getClusterDescription(cId)
  if (!cInfo || !cInfo.cmdRsp) return

  return cInfo.cmdRsp.get(rspId)
}

/**
 * Get an array of all attributes, with numeric ID and numeric type of cluster by name|id|id as string
 * */
export function attrList(cId: string | number) {
  const cInfo = getClusterDescription(cId)
  if (!cInfo || !cInfo.attr) return

  return cInfo.attr.enums.map((attr, i) => {
    const attrId = attr.value
    const attrTypeName = cInfo.attrType.enums[i].value
    const _dataType = dataTypeId.values.get(attrTypeName)
    // Because zero is a valid type id
    const dataType = _dataType !== undefined ? _dataType : 255
    return { attrId, dataType }
  })
}

/**
 * Get an attribute entry, with numeric ID and numeric type of cluster by two name|id|id as string
 *
 * example: `{ key: "modelId", value: 5 }`
 * */
export function attr(cId: string | number, attrId: string | number) {
  attrId = assertAndParse(attrId, "attrId")

  const cInfo = getClusterDescription(cId)
  if (!cInfo || !cInfo.attr) return

  return cInfo.attr.get(attrId) // { key: 'modelId', value: 5 }
}

/**
 * Get the type entry of an attribute by two name|id|id as string
 *
 * example: `{ key: "uint8", value: 32 }`
 * */
export function attrType(cId: string | number, attrId: string | number) {
  attrId = assertAndParse(attrId, "attrId")

  const cInfo = getClusterDescription(cId)
  if (!cInfo || !cInfo.attr) return

  const attrName = cInfo.attr.getKey(attrId)
  if (!attrName) return

  const attrTypeName = cInfo.attrType.values.get(attrName)
  if (!attrTypeName) return

  return dataTypeId.byKey.get(attrTypeName)
}

/**
 * Get a dataType entry by name|id|id as string
 *
 * example: `{ key: "uint8", value: 32 }`
 * */
export function dataType(type: string | number) {
  type = assertAndParse(type, "type")

  return dataTypeId.get(type)
}

/**
 * Get a status entry by name|id|id as string
 *
 * example: `{ key: "genOnOff", value: 6 }`
 * */
export function status(status: string | number) {
  status = assertAndParse(status, "status")

  return statusId.get(status)
}

/**
 * Get a OTA update status entry by name|id|id as string
 *
 * example: `{ key: "ABORT", value: 149 }`
 * */
export function otaStatus(otaStatus: string | number) {
  otaStatus = assertAndParse(otaStatus, "otaStatus")

  return otaStatusId.get(otaStatus)
}
