import { Enum } from './enum';

import zpiMeta from './defs/zpi_meta';
import * as zmtDefs from './defs/zmt_defs';

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

export function get<
  S extends keyof typeof zpiMeta,
  C extends keyof typeof zpiMeta[S]
>(subsys: S, cmd: C): typeof zpiMeta[S][C] {
  const s = zpiMeta[subsys];
  if (!s) throw new Error(`No subsystem <${subsys}>`);
  const c = s[cmd];
  if (!c) throw new Error(`No cmd <${cmd}> in ${subsys}`);
  return c;
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

interface Type1Cmd {
  readonly cmdId: number;
  readonly type: 1;
  readonly params: { readonly req: object[]; readonly rsp: object[] };
}
interface Type2Cmd {
  readonly cmdId: number;
  readonly type: 2;
  readonly params: { readonly req: object[] };
}
type Cmd = Type1Cmd | Type2Cmd;
interface Subsys {
  readonly [cmd: string]: Cmd;
}
interface ZpiMeta {
  readonly [subsys: string]: Subsys;
}

export function getType<
  S extends keyof typeof zpiMeta,
  C extends keyof typeof zpiMeta[S]
>(subsys: S, cmd: C) {
  const type = CmdType.keys.get(((get(subsys, cmd) as unknown) as Cmd).type);
  if (!type) throw new Error(`type unspecified on ${subsys}/${cmd}`);
  // return: "POLL", "SREQ", "AREQ", "SRSP"
  return type;
}

export function getReqParams(subsys, cmd) {
  // [ { name: type }, .... ]
  const params = get(subsys, cmd).params.req;

  if (params) {
    return cloneParamsWithNewFormat(params);
  }
}

export function getRspParams(subsys, cmd) {
  // [ { name: type }, .... ]
  const params = get(subsys, cmd).params.rsp;

  if (params) {
    return cloneParamsWithNewFormat(params);
  }
}

export function cloneParamsWithNewFormat(params) {
  return params.map(item => {
    const name = Object.keys(item)[0];
    const val = item[name];
    const type = ParamType.keys.get(val);
    return {
      name,
      type: type || val,
    };
  });
}
