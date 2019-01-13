import { Enum } from './enum'

import * as common from './definitions/common.json'
import * as clusterDefs from './definitions/cluster_defs.json'

type ClusterName = keyof typeof clusterDefs

interface ClusterDef {
  attrId: Record<string, { id: number; type: string }> | null // Actually type should be keyof typeof common.dataType
  cmd: Record<string, number> | null
  cmdRsp: Record<string, number> | null
}
const _clusterDefs: Record<string, ClusterDef | undefined> = clusterDefs

/*************************************************************************************************/
/*** Loading Enumerations                                                                      ***/
/*************************************************************************************************/
export const _common = common
export const profileId = new Enum(_common.profileId)
export const foundationId = new Enum(_common.foundation)
export const dataTypeId = new Enum(_common.dataType)
export const statusId = new Enum(_common.status)
export const clusterId = new Enum(_common.clusterId)
export const deviceId: Record<string, Enum<string, number>> = {
  HA: new Enum(_common.haDevId)
}

function isValidArgType(param: any): param is string | number {
  if (typeof param === 'string') {
    return true
  }
  if (typeof param === 'number') {
    return !isNaN(param)
  }
  return false
}

const isNil = (val: any): val is null | undefined => val == undefined

const assertAndParse = (val: any, name: string): string | number => {
  if (!isValidArgType(val))
    throw new TypeError(name + ' should be a number or a string.')
  const num = parseInt(val as string, 10)
  return isNaN(num) ? val : num
}
type AttributeName = string
type AttributeID = number
type AttributeType = string
type CommandName = string
type CommandID = number
type CommandResponseName = string
type CommandResponseID = number
interface NewFormatCluster {
  attr: Enum<AttributeName, AttributeID>
  attrType: Enum<AttributeName, AttributeType>
  cmd?: Enum<CommandName, CommandID>
  cmdRsp?: Enum<CommandResponseName, CommandResponseID>
}

function clusterWithNewFormat({
  attrId,
  cmd,
  cmdRsp
}: ClusterDef): NewFormatCluster {
  type AttrID = NonNullable<typeof attrId>
  const attrs: Record<keyof AttrID, AttrID[string]['id']> = {}
  const attrTypes: Record<keyof AttrID, AttrID[string]['type']> = {}

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

/*************************************************************************************************/
/*** zclId Methods                                                                             ***/
/*************************************************************************************************/
export function _getCluster(
  cluster: AnyClusterName
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

export function profile(profId: string | number) {
  profId = assertAndParse(profId, 'profId')

  return profileId.get(profId) // { key: 'HA', value: 260 }
}

export function device(profId: string | number, devId: string | number) {
  profId = assertAndParse(profId, 'profId')
  devId = assertAndParse(devId, 'devId')

  const profItem = profileId.get(profId)
  if (!profItem) return

  return deviceId[profItem.key].get(devId) // { key: 'ON_OFF_SWITCH', value: 0 }
}

/**
 * Get cluster entry by name|id|id as string
 * */
export function cluster(cId: string | number) {
  cId = assertAndParse(cId, 'cId')

  return clusterId.get(cId) // { key: 'genBasic', value: 0 }
}

/**
 * Get foundation command entry by name|id|id as string
 * */
export function foundation(cmdId: string | number) {
  cmdId = assertAndParse(cmdId, 'cmdId')

  return foundationId.get(cmdId) // { key: 'read', value: 0 }
}

/**
 * Get functional command entry of cluster by two name|id|id as string
 * */
export function functional(cId: string | number, cmdId: string | number) {
  cId = assertAndParse(cId, 'cId')
  cmdId = assertAndParse(cmdId, 'cmdId')

  const cItem = clusterId.get(cId)
  if (!cItem) return

  const cInfo = _getCluster(cItem.key)
  if (!cInfo || isNil(cInfo.cmd)) return

  return cInfo.cmd.get(cmdId) // { key: 'view', value: 1 }
}

/**
 * Get functional (command) response entry of cluster by two name|id|id as string
 * */
export function getCmdRsp(cId: string | number, rspId: string | number) {
  cId = assertAndParse(cId, 'cId')
  rspId = assertAndParse(rspId, 'rspId')

  const cItem = clusterId.get(cId)
  if (!cItem) return

  const cInfo = _getCluster(cItem.key)
  if (!cInfo || isNil(cInfo.cmdRsp)) return

  return cInfo.cmdRsp.get(rspId) // { key: 'viewRsp', value: 1 }
}

/**
 * Get an array of all attributes, with numeric ID and numeric type of cluster by name|id|id as string
 * */
export function attrList(cId: string | number) {
  const cItem = cluster(cId)
  const clst = cItem ? _getCluster(cItem.key) : undefined

  if (!cItem || !clst) return

  return clst.attr.enums.map(function(item) {
    const attrId = item.value
    const type = attrType(cItem.key, attrId)
    const dataType = type ? type.value : 255
    return { attrId, dataType }
  })
}

/**
 * Get an attribute entry, with numeric ID and numeric type of cluster by two name|id|id as string
 * */
export function attr(cId: string | number, attrId: string | number) {
  cId = assertAndParse(cId, 'cId')
  attrId = assertAndParse(attrId, 'attrId')

  const cItem = clusterId.get(cId)
  if (!cItem) return

  const cInfo = _getCluster(cItem.key)
  if (!cInfo || isNil(cInfo.attr)) return

  return cInfo.attr.get(attrId) // { key: 'modelId', value: 5 }
}

/**
 * Get the type entry of an attribute by two name|id|id as string
 * */
export function attrType(cId: string | number, attrId: string | number) {
  cId = assertAndParse(cId, 'cId')
  attrId = assertAndParse(attrId, 'attrId')

  const cItem = clusterId.get(cId)
  if (!cItem) return

  const cInfo = _getCluster(cItem.key)
  if (!cInfo || isNil(cInfo.attr)) return

  const attrName = cInfo.attr.get(attrId)
  if (!attrName) return

  const attrItem = cInfo.attrType.get(attrName.key)
  if (!attrItem) return

  return dataTypeId.byKey.get(attrItem.value) // { key: 'CHAR_STR', value: 66 }
}

/**
 * Get a dataType entry by name|id|id as string
 * */
export function dataType(type: string | number) {
  type = assertAndParse(type, 'type')

  return dataTypeId.get(type) // { key: 'DATA8', value: 8 }
}

/**
 * Get a status entry by name|id|id as string
 * */
export function status(status: string | number) {
  status = assertAndParse(status, 'status')

  return statusId.get(status) // { key: 'DATA8', value: 8 }
}
