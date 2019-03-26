import 'jest-extended';
import zpiMeta from '../src/defs/zpi_meta';
import {} from '../src/defs/zmt_defs';
describe('cmd metadata validation', () => {
  for (const [subsysName, subsysCmds] of Object.entries(zpiMeta))
    for (const [cmdName, cmdDef] of Object.entries(subsysCmds))
      it(`${subsysName} / ${cmdName}`, () => {
        expect(cmdDef.type).toBeOneOf([1, 2]);
        expect(cmdDef.cmdId).toBeNumber();
        if (cmdDef.type === 1)
          expect(cmdDef).toHaveProperty('params', {
            req: expect.any(Array),
            rsp: expect.any(Array),
          });
        else
          expect(cmdDef).toHaveProperty('params', {
            req: expect.any(Array),
          });
      });
});
