import { writeFile as _writeFile } from "fs"
import { promisify } from "util"
const writeFile = promisify(_writeFile)

import common = require("./common.json")
import zclMeta = require("./zcl_meta.json")
import clusterDefs = require("./cluster_defs.json")
const { foundation, clusterId: clusterIDs, ...newCommon } = common
const { foundation: foundation2, functional } = zclMeta

writeFile(__dirname + "/_common.json", JSON.stringify(newCommon))

const newFoundation: Record<
  string,
  { id: number; params: [string, string][] } | { id: number; TODO: 1 }
> = {}
for (const fCmdName in foundation) {
  const id = foundation[fCmdName as keyof typeof foundation]
  const f2 = foundation2[fCmdName as keyof typeof foundation2]
  if (f2) {
    let { params: oldParams, knownBufLen } = f2
    let len = 0
    const params = (oldParams as (typeof oldParams)[keyof typeof oldParams][]).map(
      x => {
        const entry: [string, string] = Object.entries(x)[0]
        if (entry[1] == "uint8") len += 1
        if (entry[1] == "uint16") len += 2
        return entry
      }
    )
    if (len !== knownBufLen)
      throw new Error(
        `Wrong knownBufLen: expected ${knownBufLen} got ${len} in ${fCmdName}`
      )
    newFoundation[fCmdName] = {
      id,
      params
    }
  } else {
    newFoundation[fCmdName] = {
      id,
      TODO: 1
    }
  }
}
writeFile(__dirname + "/_foundation.json", JSON.stringify(newFoundation))

for (const clName in clusterDefs) {
  if (!clusterIDs.hasOwnProperty(clName))
    throw new Error(`${clName} in cluster_defs but not in common`)
}
for (const clName in functional) {
  if (!clusterIDs.hasOwnProperty(clName))
    throw new Error(`${clName} in zcl_meta but not in common`)
}

interface ClusterDef {
  id: number
  attrs?: { id: number; type: string }[]
  cmd?: Record<
    string,
    { id: number; params: [string, string][] } | { id: number; TODO: 1 }
  >
  cmdRsp?: Record<
    string,
    { id: number; params: [string, string][] } | { id: number; TODO: 1 }
  >
}
const newClusterDefs: Record<string, ClusterDef | { id: number; TODO: 2 }> = {}
for (const clName in clusterIDs) {
  const id = clusterIDs[clName as keyof typeof clusterIDs]
  const cl1 = clusterDefs[clName as keyof typeof clusterDefs]
  const cl2 = functional[clName as keyof typeof functional]
  if (!cl1) {
    newClusterDefs[clName] = { id, TODO: 2 }
    continue
  }
  const newClusterDef: ClusterDef = { id, attrs: cl1.attrId as any }
  for (const fnCmdName in cl2) {
    const missing1 = cl1.cmd && !cl1.cmd.hasOwnProperty(fnCmdName)
    const missing2 = cl1.cmdRsp && !cl1.cmdRsp.hasOwnProperty(fnCmdName)
    if (
      (missing1 && missing2) ||
      (!cl1.cmd && missing2) ||
      (!cl1.cmdRsp && missing1)
    )
      throw new Error(`${fnCmdName} in zcl_meta but not in cluster_defs`)
  }
  if (cl1.cmd) {
    newClusterDef.cmd = {}
    for (const fnCmdName in cl1.cmd) {
      const id = cl1.cmd[fnCmdName as keyof typeof cl1.cmd]!
      if (!cl2) {
        newClusterDef.cmd[fnCmdName] = { id, TODO: 1 }
        continue
      }
      const desc = cl2[fnCmdName as keyof typeof cl2]
      if (!desc) {
        newClusterDef.cmd[fnCmdName] = { id, TODO: 1 }
        continue
      }
      const { params: oldParams, dir } = desc
      const params = (oldParams as (typeof oldParams)[keyof typeof oldParams][]).map(
        x => Object.entries(x)[0] as [string, string]
      )
      if (dir !== 0) throw new Error(`Dir not 0 on ${clName} / ${fnCmdName}`)
      newClusterDef.cmd[fnCmdName] = { id, params }
    }
  }
  if (cl1.cmdRsp) {
    newClusterDef.cmdRsp = {}
    for (const fnCmdName in cl1.cmdRsp) {
      const id = cl1.cmdRsp[fnCmdName as keyof typeof cl1.cmdRsp]!
      if (!cl2) {
        newClusterDef.cmdRsp[fnCmdName] = { id, TODO: 1 }
        continue
      }
      const desc = cl2[fnCmdName as keyof typeof cl2]
      if (!desc) {
        newClusterDef.cmdRsp[fnCmdName] = { id, TODO: 1 }
        continue
      }
      const { params: oldParams, dir } = desc

      const params = (oldParams as (typeof oldParams)[keyof typeof oldParams][]).map(
        x => Object.entries(x)[0] as [string, string]
      )
      if (dir !== 1) throw new Error(`Dir not 1 on ${clName}/${fnCmdName}`)
      newClusterDef.cmdRsp[fnCmdName] = { id, params }
    }
  }
  newClusterDefs[clName] = newClusterDef
}

writeFile(__dirname + "/_cluster_defs.json", JSON.stringify(newClusterDefs))
