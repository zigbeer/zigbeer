export { ZclID } from "./zcl-id"

import { CommonJSON, FoundationJSON, ClustedDefsJSON } from "./zcl-id"

import * as _common from "./definitions/_common.json"
import * as _foundation from "./definitions/_foundation.json"
import * as _clusterDefs from "./definitions/_cluster_defs.json"

const common = (_common as unknown) as CommonJSON
const foundation = (_foundation as unknown) as FoundationJSON
const clusterDefs = (_clusterDefs as unknown) as ClustedDefsJSON

export { common, foundation, clusterDefs }
