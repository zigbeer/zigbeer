import { ZclID } from "../src/zcl-id"

import * as common from "../src/definitions/_common.json"
import * as foundation from "../src/definitions/_foundation.json"
import * as clusterDefs from "../src/definitions/_cluster_defs.json"

export const zclId = new ZclID(common, foundation as any, clusterDefs as any)
