import _ = require('busyman')
import Enum = require('./definitions/enum')

import common = require('./definitions/common.json')
import clusterDefs = require('./definitions/cluster_defs.json')
import clusterWithNewFormat from './definitions/clusterWithNewFormat'

/*************************************************************************************************/
/*** Loading Enumerations                                                                      ***/
/*************************************************************************************************/
export const _common = common
export const profileId = new Enum(_common.profileId)
export const foundationId = new Enum(_common.foundation)
export const dataTypeId = new Enum(_common.dataType)
export const statusId = new Enum(_common.status)
export const clusterId = new Enum(_common.clusterId)
export const deviceId = { HA: new Enum(_common.haDevId) }

function isValidArgType(param) {
  if (typeof param !== 'number' && typeof param !== 'string') {
    return false
  }
  if (typeof param === 'number') {
    return !isNaN(param)
  }
  return true
}

const newFormatClusters = new Map()

/*************************************************************************************************/
/*** zclId Methods                                                                             ***/
/*************************************************************************************************/
export function _getCluster(cluster) {
  const readyCluster = newFormatClusters.get(cluster)
  if (readyCluster) return readyCluster
  const newClusterDef = clusterDefs[cluster]
  if (newClusterDef) {
    const newCluster = clusterWithNewFormat(newClusterDef)
    newFormatClusters.set(cluster, newCluster)
    clusterDefs[cluster] = null
    return newCluster
  }
  throw new Error(`Cluster ${cluster} not found in cluster_defs.json`)
  // return: {
  //     attr,
  //     attrType,
  //     cmd,
  //     cmdRsp
  // }
}

export function profile(profId) {
  // profId: String | Number
  if (!isValidArgType(profId))
    throw new TypeError('profId should be a number or a string.')

  const profNumber = parseInt(profId)

  if (!isNaN(profNumber)) profId = profNumber

  const profItem = profileId.get(profId)

  if (profItem) return { key: profItem.key, value: profItem.value } // { key: 'HA', value: 260 }
}

export function device(profId, devId) {
  // profId: String | Number, devId: String | Number
  if (!isValidArgType(profId))
    throw new TypeError('profId should be a number or a string.')

  if (!isValidArgType(devId))
    throw new TypeError('devId should be a number or a string.')

  const profNumber = parseInt(profId)
  const devNumber = parseInt(devId)

  if (!isNaN(profNumber)) profId = profNumber

  if (!isNaN(devNumber)) devId = devNumber

  const profItem = profileId.get(profId)

  let devItem
  if (profItem) devItem = deviceId[profItem.key].get(devId)

  if (devItem) return { key: devItem.key, value: devItem.value } // { key: 'ON_OFF_SWITCH', value: 0 }
}

export function cluster(cId: string | number): { key: string; value: number } {
  // cId: String | Number
  if (!isValidArgType(cId))
    throw new TypeError('cId should be a number or a string.')

  const cNumber = parseInt(cId as string)

  if (!isNaN(cNumber)) cId = cNumber

  const cItem = clusterId.get(cId)

  return cItem // { key: 'genBasic', value: 0 }
}

export function foundation(cmdId) {
  // cmdId: String | Number
  if (!isValidArgType(cmdId))
    throw new TypeError('cmdId should be a number or a string.')

  const cmdNumber = parseInt(cmdId)

  if (!isNaN(cmdNumber)) cmdId = cmdNumber

  const cmdItem = foundationId.get(cmdId)

  if (cmdItem) return { key: cmdItem.key, value: cmdItem.value } // { key: 'read', value: 0 }
}

export function functional(cId, cmdId) {
  // cId: String | Number, cmdId: String | Number
  if (!isValidArgType(cId))
    throw new TypeError('cId should be a number or a string.')

  if (!isValidArgType(cmdId))
    throw new TypeError('cmdId should be a number or a string.')

  const cNumber = parseInt(cId)
  const cmdNumber = parseInt(cmdId)

  if (!isNaN(cNumber)) cId = cNumber

  let cmdItem
  if (!isNaN(cmdNumber)) cmdId = cmdNumber

  const cItem = clusterId.get(cId)

  let cInfo
  if (cItem) cInfo = _getCluster(cItem.key)

  if (cInfo && !_.isNil(cInfo.cmd)) cmdItem = cInfo.cmd.get(cmdId)

  if (cmdItem) return { key: cmdItem.key, value: cmdItem.value } // { key: 'view', value: 1 }
}

export function getCmdRsp(cId: string | number, rspId: string | number) {
  // TODO
  if (!isValidArgType(cId))
    throw new TypeError('cId should be a number or a string.')

  if (!isValidArgType(rspId))
    throw new TypeError('rspId should be a number or a string.')

  const cNumber = parseInt(cId as string)
  const cmdNumber = parseInt(rspId as string)

  if (!isNaN(cNumber)) cId = cNumber

  if (!isNaN(cmdNumber)) rspId = cmdNumber

  const cItem = clusterId.get(cId)

  let cInfo
  if (cItem) cInfo = _getCluster(cItem.key)

  let cmdItem
  if (cInfo && !_.isNil(cInfo.cmdRsp)) cmdItem = cInfo.cmdRsp.get(rspId)

  if (cmdItem) return { key: cmdItem.key, value: cmdItem.value } // { key: 'viewRsp', value: 1 }
}

export function attrList(cId: string | number) {
  if (!isValidArgType(cId))
    throw new TypeError('cId should be a number or a string.')

  const cItem = cluster(cId)
  const clst = cItem ? _getCluster(cItem.key) : undefined

  if (!cItem || !clst) return

  const attrs = _.map(clst.attr.enums, function(item) {
    return { attrId: item.value }
  })

  _.forEach(attrs, function(item) {
    const type = attrType(cItem.key, item.attrId)
    item.dataType = type ? type.value : 255
  })

  return attrs
}

export function attr(cId: string | number, attrId: string | number) {
  if (!isValidArgType(cId))
    throw new TypeError('cId should be a number or a string.')

  if (!isValidArgType(attrId))
    throw new TypeError('attrId should be a number or a string.')

  const cNumber = parseInt(cId as string)
  const attrNumber = parseInt(attrId as string)

  if (!isNaN(cNumber)) cId = cNumber

  if (!isNaN(attrNumber)) attrId = attrNumber

  const cItem = clusterId.get(cId)

  let cInfo
  if (cItem) cInfo = _getCluster(cItem.key)

  let attrItem
  if (cInfo && !_.isNil(cInfo.attr)) attrItem = cInfo.attr.get(attrId)

  if (attrItem) return { key: attrItem.key, value: attrItem.value } // { key: 'modelId', value: 5 }
}

export function attrType(cId: string | number, attrId: string | number) {
  if (!isValidArgType(cId))
    throw new TypeError('cId should be a number or a string.')

  if (!isValidArgType(attrId))
    throw new TypeError('attrId should be a number or a string.')

  const cNumber = parseInt(cId as string)
  const attrNumber = parseInt(attrId as string)

  if (!isNaN(cNumber)) cId = cNumber

  if (!isNaN(attrNumber)) attrId = attrNumber

  const cItem = clusterId.get(cId)

  let cInfo
  if (cItem) cInfo = _getCluster(cItem.key)

  const attrName = attr(cId, attrId)

  let attrItem
  let attrType
  if (cInfo && !_.isNil(cInfo.attrType) && attrName) {
    attrItem = cInfo.attrType.get(attrName.key)
    attrType = dataType(attrItem.value)
  }

  if (attrType) return { key: attrType.key, value: attrType.value } // { key: 'CHAR_STR', value: 66 }
}

export function dataType(type: string | number) {
  if (!isValidArgType(type))
    throw new TypeError('dataType should be a number or a string.')

  const typeNumber = parseInt(type as string)

  if (!isNaN(typeNumber)) type = typeNumber

  const typeItem = dataTypeId.get(type)

  if (typeItem) return { key: typeItem.key, value: typeItem.value } // { key: 'DATA8', value: 8 }
}

export function status(status: string | number) {
  if (!isValidArgType(status))
    throw new TypeError('status should be a number or a string.')

  const statusNumber = parseInt(status as string)

  if (!isNaN(statusNumber)) status = statusNumber

  const statusItem = statusId.get(status)

  if (statusItem) return { key: statusItem.key, value: statusItem.value } // { key: 'DATA8', value: 8 }
}
