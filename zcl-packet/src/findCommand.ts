import { ZclID } from "zcl-id"
import { FunctionalParamTypes } from "./functional"

export const findFoundation = (cmd: string | number, zclId: ZclID) => {
  const command = zclId.foundation(cmd)

  if (!command) throw new Error("Unrecognized command: " + cmd)

  const cmdName = command.key
  const cmdId = command.value

  const wholeCommand = zclId.zclmeta.foundation.get(cmdName)
  if (!wholeCommand) throw new Error(`Unknown command foundation/${cmdName}`)
  // cmdId = wholeCommand.id
  return { cmdName, cmdId, params: wholeCommand.params }
}

export const findFunctional = (
  clusterId: string | number,
  direction: 0 | 1,
  cmd: string | number,
  zclId: ZclID
) => {
  const cluster = zclId.cluster(clusterId)

  if (!cluster) {
    throw new Error(`Unknown cluster ${clusterId}`)
  }

  const clusterName = cluster.key

  const cmdEntry = direction
    ? zclId.getCmdRsp(clusterName, cmd)
    : zclId.functional(clusterName, cmd)
  if (!cmdEntry) throw new Error(`Unknown command ${clusterName}/${cmd}`)

  const cmdName = cmdEntry.key

  const wholeCommand = zclId.zclmeta.functional.get(clusterName, cmdName)
  if (!wholeCommand)
    throw new Error(`Unknown command ${clusterName}/${cmdName}`)
  const cmdId = wholeCommand.id
  const params = wholeCommand.params as [string, FunctionalParamTypes][]

  const _direction = zclId.zclmeta.functional.getDirection(clusterName, cmdName)
  if (!_direction) {
    throw new Error("Unrecognized direction")
  }
  if (_direction !== (direction ? "serverToClient" : "clientToServer")) {
    throw new Error("Wrong direction")
  }
  return {
    directionString: _direction,
    cmdId,
    cmdName,
    params,
    cluster: clusterName
  } as const
}
