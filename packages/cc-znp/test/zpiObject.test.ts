import { randomArg } from './randomData';
import * as zmeta from '../src/zmeta';
import { frame, parse, getCommandData, getParams } from '../src/zpiObject';

const getIncomingType = type => {
  if (type === 'SREQ') return 'SRSP';
  if (type === 'AREQ') return 'AREQ';
  throw new Error(`Unknown type ${type}`);
};

const makeRandomArgsObj = params => {
  const args = {};
  for (const param of params)
    args[param.name] = randomArg(param.type, param.name);
  return args;
};

describe('frame and parse', () => {
  for (const { key: subsys } of zmeta.Subsys.enums) {
    if (subsys === 'RES0' || subsys === 'NWK') continue;
    for (const { key: cmdName } of zmeta[subsys].enums) {
      const type = zmeta.getType(subsys as any, cmdName);
      const commandMetadata = getCommandData(subsys, cmdName);
      /**Incoming (response) */
      {
        const inType = getIncomingType(type);
        const params = getParams(inType, subsys, cmdName);
        const args = makeRandomArgsObj(params);
        const payload = frame(inType, commandMetadata, args);

        test(`incoming ${inType} ${subsys}/${cmdName}`, () => {
          const result = parse(inType, commandMetadata, payload);
          expect(result).toEqual(args);
        });
      }
      /**Outgoing (request) */
      if (type === 'SREQ') {
        const params = getParams(type, subsys, cmdName);
        const args = makeRandomArgsObj(params);
        const payload = frame(type, commandMetadata, args);

        test(`outgoing ${type} ${subsys}/${cmdName}`, () => {
          const result = parse(type, commandMetadata, payload);
          expect(result).toEqual(args);
        });
      }
    }
  }
});
