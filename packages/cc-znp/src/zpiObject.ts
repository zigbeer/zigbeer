import { BufferBuilder, BufferWithPointer } from 'buffster';
import * as zmeta from './zmeta';
import { writeDataTable } from './encoding/writes';
import { readTable } from './encoding/reads';

export const getParams = (type, subsys: string, cmdName: string) => {
  if (type === 'SRSP' || type === 3) return zmeta.getRspParams(subsys, cmdName);
  if (type === 'AREQ' || type === 2 || type === 'SREQ' || type === 1)
    return zmeta.getReqParams(subsys, cmdName);
  throw new Error(`Unknown type ${type}`);
};

export const getCommandData = (subsystem, cmd) => {
  const subsysEntry = zmeta.Subsys.get(subsystem);
  if (!subsysEntry) {
    throw new Error(`Unrecognized subsystem: ${subsystem}`);
  }

  const subsysName = subsysEntry.key;
  const command = zmeta[subsysName].get(cmd);

  if (!command) {
    throw new Error(`Unrecognized command: ${cmd}`);
  }

  const cmdName = command.key;
  const cmdId = command.value;
  return { subsysName, cmdName, cmdId };
};

export const parse = (type, { subsysName, cmdName }, zBuf: Buffer) => {
  const rspParams = getParams(type, subsysName, cmdName);

  // [ { name, type }, ... ]
  if (!rspParams)
    throw new Error(
      `Response parameter definitions not found for type:${type} subsys:${subsysName} cmd:${cmdName}`
    );

  const r = new BufferWithPointer(zBuf);
  const result: Record<string, any> = {};
  for (const { name, type } of rspParams) {
    const fn = readTable[type];
    if (!fn) throw new Error(`No read rule for ${type}`);

    let res = fn(r);
    // TODO: remove hacks
    // HACK: conditional nwkaddr
    if (type === 'uint8ZdoInd') {
      const { val, nwkaddr } = res;
      if (nwkaddr) result.nwkaddr = nwkaddr;
      res = val;
    }

    result[name] = res;
  }
  return result;
};

export const frame = (
  type,
  { subsysName, cmdName },
  args: any[] | Record<string, any>
) => {
  const reqParams = getParams(type, subsysName, cmdName);

  if (Array.isArray(args)) {
    // arg: { name, type } -> { name, type, value }
    reqParams.forEach((arg, idx) => {
      arg.value = args[idx];
    });
  } else if (typeof args === 'object') {
    reqParams.forEach((arg, idx) => {
      if (!args.hasOwnProperty(arg.name)) {
        throw new Error('The argument object has incorrect properties');
      } else {
        arg.value = args[arg.name];
      }
    });
  }
  // no args, cannot build frame
  if (!Array.isArray(reqParams))
    throw new Error(
      `Cannot build ${subsysName}/${cmdName}: no arguments provided`
    );
  const c = new BufferBuilder();
  for (const { type, value } of reqParams) {
    const fn = writeDataTable[type];
    if (!fn) throw new TypeError(`Unknown argument type: ${type}`);
    fn(c, value);
  }
  return c.result();
};
