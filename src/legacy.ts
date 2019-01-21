import { ZclID } from "./zcl-id"

import * as common from "./definitions/_common.json"
import * as foundation from "./definitions/_foundation.json"
import * as clusterDefs from "./definitions/_cluster_defs.json"

module.exports = new ZclID(common, foundation as any, clusterDefs as any)
