"use strict"

import { Enum } from "./enum"

const Direction = new Enum({
  clientToServer: 0,
  serverToClient: 1
})

import { ZclID } from "."

export interface OldStyleParam {
  [name: string]: string
}

function zclmetaFactory(zclId: ZclID) {
  const {
    foundation: meta_foundation,
    functional: meta_functional
  }: {
    // "writeStructRsp": {
    //   "params": [
    //     { "status": "uint8" },
    //     { "attrId": "uint16" },
    //     { "selector": "selector" }
    //   ],
    //   "knownBufLen": 3
    // }
    foundation: Record<string, { params: OldStyleParam[]; knownBufLen: number }>
    // "genGroups": {
    //   "getMembershipRsp": {
    //     "params": [
    //       { "capacity": "uint8" },
    //       { "groupcount": "preLenUint8" },
    //       { "grouplist": "dynUint16" }
    //     ],
    //     "dir": 1
    //   }
    // }
    functional: Record<
      string,
      Record<string, { params: OldStyleParam[]; dir: 0 | 1 }>
    >
  } = require("./definitions/zcl_meta.json") // TODO: replace this dependency

  function cloneParamsWithNewFormat(params: OldStyleParam[]) {
    const output = params.map(item => {
      const name = Object.keys(item)[0]
      return {
        name,
        // type is a number
        type: item[name]
      }
    })

    return output
  }

  const getFoundation = (cmd: string) => meta_foundation[cmd]
  const getFoundationParams = (cmd: string) => {
    const meta = getFoundation(cmd)
    if (!meta || !meta.params) return
    return cloneParamsWithNewFormat(meta.params)
  }

  const foundation = {
    get: getFoundation,
    getParams: getFoundationParams
  }

  const getFunctional = (cluster: string, cmd: string) => {
    const cl = meta_functional[cluster]
    if (!cl) return
    return cl[cmd]
  }

  const getCommand = (cluster: string, dir: 0 | 1, cmd: string) => {
    if (dir === 0) {
      // client to server, cmd
      return zclId.functional(cluster, cmd)
    }

    if (dir === 1) {
      // server to client, cmdRsp
      return zclId.getCmdRsp(cluster, cmd)
    }
  }

  const getDirection = (cluster: string, cmd: string) => {
    let meta = getFunctional(cluster, cmd)
    if (!meta) return
    const dirEntry = Direction.get(meta.dir)
    if (dirEntry == undefined) return

    // return: "Client To Server", "Server To Client"
    return dirEntry.key
  }

  const getFunctionalParams = (cluster: string, cmd: string) => {
    const meta = getFunctional(cluster, cmd)
    if (!meta || !meta.params) return
    // [ { name: type }, .... ]
    return cloneParamsWithNewFormat(meta.params)
  }

  const functional = {
    get: getFunctional,
    getCommand,
    getDirection,
    getParams: getFunctionalParams
  }

  return {
    foundation,
    functional,
    Direction
  }
}

export { zclmetaFactory }
