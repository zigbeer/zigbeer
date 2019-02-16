import { Enum } from "./enum"

const Direction = new Enum({
  clientToServer: 0,
  serverToClient: 1
})

import { ZclID } from "."

export interface OldStyleParam {
  [name: string]: string
}

function zclmetaFactory(
  zclId: ZclID,
  _foundation: typeof zclId["_foundation"],
  clusterDefs: typeof zclId["clusterDefs"]
) {
  const getFoundation = (cmd: string) => {
    const c = _foundation[cmd]
    if (!c || c.TODO === 1) return
    return c
  }
  const getFoundationParams = (cmd: string) => {
    const meta = _foundation[cmd]
    if (!meta || meta.TODO === 1 || !meta.params) return
    return meta.params.map(([name, type]) => ({ name, type }))
  }

  const foundation = {
    get: getFoundation,
    getParams: getFoundationParams
  }

  const getFunctional = (cluster: string, cmdName: string) => {
    const cl = clusterDefs[cluster]
    if (!cl || cl.TODO === 2) return
    const { cmd, cmdRsp } = cl
    const c:
      | {
          dir: 0 | 1
          id: number
          /**
           * `[name, type]`
           */
          params: [string, string][]
          TODO: undefined
        }
      | {
          dir: 0 | 1
          id: number
          TODO: 1
        }
      | undefined =
      (cmd && cmd[cmdName] && { ...cmd[cmdName], dir: 0 }) ||
      (cmdRsp && cmdRsp[cmdName] && { ...cmdRsp[cmdName], dir: 1 })

    if (!c || c.TODO === 1) return
    return c
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

  const getFunctionalParams = (cluster: string, cmdName: string) => {
    const cl = clusterDefs[cluster]
    if (!cl || cl.TODO === 2) return
    const { cmd, cmdRsp } = cl
    const c = (cmd && cmd[cmdName]) || (cmdRsp && cmdRsp[cmdName])
    if (!c || c.TODO === 1 || !c.params) return
    return c.params.map(([name, type]) => ({ name, type }))
  }

  const functional = {
    get: getFunctional,
    getCommand,
    getDirection,
    getParams: getFunctionalParams
  }

  return {
    foundation,
    functional
  }
}

export { zclmetaFactory }
