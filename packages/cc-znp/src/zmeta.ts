import { Enum } from './enum';

import * as zpiMeta from './defs/zpi_meta.json';
import * as zmtDefs from './defs/zmt_defs.json';

export const CmdType = new Enum(zmtDefs.CmdType);
export const Subsys = new Enum(zmtDefs.Subsys);
export const ParamType = new Enum(zmtDefs.ParamType);
export const SYS = new Enum(zmtDefs.SYS);
export const MAC = new Enum(zmtDefs.MAC);
export const AF = new Enum(zmtDefs.AF);
export const ZDO = new Enum(zmtDefs.ZDO);
export const SAPI = new Enum(zmtDefs.SAPI);
export const UTIL = new Enum(zmtDefs.UTIL);
export const DBG = new Enum(zmtDefs.DBG);
export const APP = new Enum(zmtDefs.APP);
export const DEBUG = new Enum(zmtDefs.DEBUG);

export function get(subsys, cmd) {
  const meta = zpiMeta[subsys];
  return meta ? meta[cmd] : undefined;
  // return: {
  //  type,
  //  cmdId,
  //  params:
  //      {
  //          req: [ { name: type }, ... ],
  //          rsp: [ { name: type }, ... ]
  //      }
  // }
}

export function getType(subsys, cmd) {
  let meta = get(subsys, cmd);

  if (meta) {
    meta = CmdType.get(meta.type);
  }

  // return: "POLL", "SREQ", "AREQ", "SRSP"
  return meta ? meta.key : undefined;
}

export function getParams(subsys, cmdName) {
  const meta = get(subsys, cmdName);
  return meta ? meta.params : meta;
}

export function getReqParams(subsys, cmd) {
  const meta = getParams(subsys, cmd);
  // [ { name: type }, .... ]
  const params = meta ? meta.req : meta;

  if (params) {
    return cloneParamsWithNewFormat(params);
  }
}

export function getRspParams(subsys, cmd) {
  const meta = getParams(subsys, cmd);
  // [ { name: type }, .... ]
  const params = meta ? meta.rsp : meta;

  if (params) {
    return cloneParamsWithNewFormat(params);
  }
}

export function cloneParamsWithNewFormat(params) {
  let output = params.map(item => {
    const name = Object.keys(item)[0];
    return {
      name,
      type: item[name],
    };
  });

  output = _paramTypeToString(output);

  return output;
}

function _paramTypeToString(params) {
  params.forEach((item, idx) => {
    // enum | undefined
    const type = ParamType.get(item.type);
    // item.type is a string
    item.type = type ? type.key : item.type;
  });

  return params;
}
