import { Enum } from "./enum"
import { zclmetaFactory } from "./zclmeta"

const isValidArgType = (param: any): param is string | number => {
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

type DataTypeNames = string

export interface CommonJSON {
  aclMask: Record<string, number>
  profileId: Record<string, number>
  direction: Record<string, number>
  cmdDirection: Record<string, number>
  haDevId: Record<string, number>
  dataType: Record<string, number>
  status: Record<string, number>
  otaStatus: Record<string, number>
}
export type FoundationJSON = Record<
  string,
  | {
      id: number
      params: [string, string][]
      TODO: undefined
    }
  | {
      id: number
      TODO: 1
    }
>
export interface CompleteClusterDefJSON {
  id: number
  attrs?: Record<string, { id: number; type: string }>
  cmd?: Record<
    string,
    | { id: number; params: [string, string][]; TODO: undefined }
    | { id: number; TODO: 1 }
  >
  cmdRsp?: Record<
    string,
    | { id: number; params: [string, string][]; TODO: undefined }
    | { id: number; TODO: 1 }
  >
  TODO: undefined
}
export interface IncompleteClusterDefJSON {
  id: number
  TODO: 2
}

const pickID = <T>(x: { id: T }) => x.id
const pickType = <T>(x: { type: T }) => x.type

const isComplete = (val: ClusterDefJSON): val is CompleteClusterDefJSON =>
  !(val as any).TODO

function clusterWithNewFormat(def: ClusterDefJSON): NewFormatCluster {
  if (!isComplete(def)) return { attr: new Enum({}), attrType: new Enum({}) }

  return {
    attr: new Enum(def.attrs ? def.attrs : {}, pickID),
    attrType: new Enum(def.attrs ? def.attrs : {}, pickType),
    cmd: def.cmd ? new Enum(def.cmd, pickID) : undefined,
    cmdRsp: def.cmdRsp ? new Enum(def.cmdRsp, pickID) : undefined
  }
}

type ClusterDefJSON = CompleteClusterDefJSON | IncompleteClusterDefJSON
export type ClustedDefsJSON = Record<string, ClusterDefJSON>

export class ZclID {
  constructor(
    private common: CommonJSON,
    private _foundation: FoundationJSON,
    private clusterDefs: ClustedDefsJSON
  ) {}
  zclmeta = zclmetaFactory(this, this._foundation, this.clusterDefs)
  /**
   * The Zigbee profile ID lookup
   *
   * key: 2-letter profile name, value: numeric ID
   *
   * example: `{ key: "HA", value: 260 }`
   */
  profileId = new Enum(this.common.profileId)
  /**
   * The foundation command ID lookup
   *
   * key: 2-letter profile name, value: numeric ID
   *
   * example: `{ key: "read", value: 0 }`
   */
  foundationId = new Enum(this._foundation, pickID)
  /**
   * The datatype ID lookup
   *
   * key: DataType name, value: numeric ID
   *
   * example: `{ key: "uint8", value: 32 }`
   */
  dataTypeId = new Enum(this.common.dataType)
  /**
   * The status ID lookup
   *
   * key: status name, value: numeric ID
   *
   * example: `{ key: "success", value: 0 }`
   */
  statusId = new Enum(this.common.status)
  /**
   * The OTA update status ID lookup
   *
   * key: status name, value: numeric ID
   *
   * example: `{ key: "ABORT", value: 149 }`
   */
  otaStatusId = new Enum(this.common.otaStatus)
  /**
   * The cluster ID lookup
   *
   * key: status name, value: numeric ID
   *
   * example: `{ key: "genOnOff", value: 6 }`
   */
  clusterId = new Enum(this.clusterDefs, pickID)
  /**
   * Zigbee device ID lookups, per profile name
   */
  deviceId: {
    HA: Enum<string, number>
    [key: string]: Enum<string, number>
  } = {
    /**
     * The device ID lookup of Home Automation profile
     *
     * key: status name, value: numeric ID
     *
     * example: `{ key: "onOffOutput", value: 2 }`
     */
    HA: new Enum(this.common.haDevId)
  }
  private newFormatClusters: Map<string, NewFormatCluster> = new Map()

  _getCluster(cluster: string): NewFormatCluster | undefined {
    const readyCluster = this.newFormatClusters.get(cluster)
    if (readyCluster) return readyCluster

    const newClusterDef = this.clusterDefs[cluster]
    if (!newClusterDef) return // throw new Error(`Cluster ${cluster} not found in cluster_defs.json`)

    const newCluster = clusterWithNewFormat(newClusterDef)
    this.newFormatClusters.set(cluster, newCluster)
    return newCluster
  }

  /**
   * Get cluster description by name|id|id as string
   */
  private getClusterDescription(cId: string | number) {
    cId = assertAndParse(cId, "cId")

    const cName = this.clusterId.getKey(cId)
    if (!cName) return

    return this._getCluster(cName)
  }

  /**
   * Get profile entry by name|id|id as string
   *
   * example: `{ key: 'HA', value: 260 }`
   * */
  profile(profId: string | number) {
    profId = assertAndParse(profId, "profId")

    return this.profileId.get(profId)
  }

  /**
   * Get device entry of profile by two name|id|id as string
   *
   * example: `{ key: "onOffOutput", value: 2 }`
   * */
  device(profId: string | number, devId: string | number) {
    profId = assertAndParse(profId, "profId")
    devId = assertAndParse(devId, "devId")

    const profItem = this.profileId.get(profId)
    if (!profItem) return

    return this.deviceId[profItem.key].get(devId)
  }

  /**
   * Get cluster entry by name|id|id as string
   *
   * example: `{ key: "genOnOff", value: 6 }`
   * */
  cluster(cId: string | number) {
    cId = assertAndParse(cId, "cId")

    return this.clusterId.get(cId)
  }

  /**
   * Get foundation command entry by name|id|id as string
   *
   * example: `{ key: "read", value: 0 }`
   * */
  foundation(cmdId: string | number) {
    cmdId = assertAndParse(cmdId, "cmdId")

    return this.foundationId.get(cmdId)
  }

  /**
   * Get functional command entry of cluster by two name|id|id as string
   *
   * example: `{ key: "view", value: 1 }`
   * */
  functional(cId: string | number, cmdId: string | number) {
    cmdId = assertAndParse(cmdId, "cmdId")

    const cInfo = this.getClusterDescription(cId)
    if (!cInfo || !cInfo.cmd) return

    return cInfo.cmd.get(cmdId)
  }

  /**
   * Get functional (command) response entry of cluster by two name|id|id as string
   *
   * example: `{ key: "viewRsp", value: 1 }`
   * */
  getCmdRsp(cId: string | number, rspId: string | number) {
    rspId = assertAndParse(rspId, "rspId")

    const cInfo = this.getClusterDescription(cId)
    if (!cInfo || !cInfo.cmdRsp) return

    return cInfo.cmdRsp.get(rspId)
  }

  /**
   * Get an array of all attributes, with numeric ID and numeric type of cluster by name|id|id as string
   * */
  attrList(cId: string | number) {
    const cInfo = this.getClusterDescription(cId)
    if (!cInfo || !cInfo.attr) return

    return cInfo.attr.enums.map((attr, i) => {
      const attrId = attr.value
      const attrTypeName = cInfo.attrType.enums[i].value
      const _dataType = this.dataTypeId.values.get(attrTypeName)
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
  attr(cId: string | number, attrId: string | number) {
    attrId = assertAndParse(attrId, "attrId")

    const cInfo = this.getClusterDescription(cId)
    if (!cInfo || !cInfo.attr) return

    return cInfo.attr.get(attrId) // { key: 'modelId', value: 5 }
  }

  /**
   * Get the type entry of an attribute by two name|id|id as string
   *
   * example: `{ key: "uint8", value: 32 }`
   * */
  attrType(cId: string | number, attrId: string | number) {
    attrId = assertAndParse(attrId, "attrId")

    const cInfo = this.getClusterDescription(cId)
    if (!cInfo || !cInfo.attr) return

    const attrName = cInfo.attr.getKey(attrId)
    if (!attrName) return

    const attrTypeName = cInfo.attrType.values.get(attrName)
    if (!attrTypeName) return

    return this.dataTypeId.byKey.get(attrTypeName)
  }

  /**
   * Get a dataType entry by name|id|id as string
   *
   * example: `{ key: "uint8", value: 32 }`
   * */
  dataType(type: string | number) {
    type = assertAndParse(type, "type")

    return this.dataTypeId.get(type)
  }

  /**
   * Get a status entry by name|id|id as string
   *
   * example: `{ key: "genOnOff", value: 6 }`
   * */
  status(status: string | number) {
    status = assertAndParse(status, "status")

    return this.statusId.get(status)
  }

  /**
   * Get a OTA update status entry by name|id|id as string
   *
   * example: `{ key: "ABORT", value: 149 }`
   * */
  otaStatus(otaStatus: string | number) {
    otaStatus = assertAndParse(otaStatus, "otaStatus")

    return this.otaStatusId.get(otaStatus)
  }
}
