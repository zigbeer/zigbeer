import Enum = require('./enum')

export default function clusterWithNewFormat({ attrId, cmd, cmdRsp }) {
  const attrs = {}
  const attrTypes = {}

  for (const name in attrId) {
    const { id, type } = attrId[name]
    attrs[name] = id
    attrTypes[name] = type
  }

  return {
    attr: new Enum(attrs),
    attrType: new Enum(attrTypes),
    cmd: cmd ? new Enum(cmd) : null,
    cmdRsp: cmdRsp ? new Enum(cmdRsp) : null
  }
}
