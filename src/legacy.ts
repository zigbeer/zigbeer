import { ZclID } from "./zcl-id"

import * as common from "./definitions/common.json"
import * as clusterDefs from "./definitions/cluster_defs.json"

module.exports = new ZclID(common, clusterDefs)
