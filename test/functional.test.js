const expect = require('chai').expect;
const Chance = require('chance');
const chance = new Chance();
const zclId = require('zcl-id/dist/legacy');

const zclmeta = require('../lib/zclmeta')(zclId);

const FuncClass = require('../lib/functional')(zclId);

const clusterIds = Object.keys(require('zcl-id/src/definitions/common.json').clusterId);

describe('Functional Cmd framer and parser Check', function () {
    clusterIds.forEach(function (cluster) {
        const cInfo = zclId._getCluster(cluster);
        const cmdIds = [];

        if (!cInfo || !cInfo.cmd) return;

        cInfo.cmd.enums.forEach(function (cmdObj) {
            cmdIds.push(cmdObj.key);
        });

        cmdIds.forEach(function (cmd) {
            let funcObj;
            let reqParams;
            let payload;
            let args = {};

            reqParams = zclmeta.functional.getParams(cluster, cmd);

            if (!reqParams) return;

            reqParams.forEach(function (arg) {
                args[arg.name] = randomArg(arg.type);
            });

            funcObj = new FuncClass(cluster, 0, cmd);
            payload = funcObj.frame(args);

            funcObj.parse(payload, function (err, result) {
                it(funcObj.cmd + ' frame() and parse() check', function () {
                    expect(result).to.eql(args);
                });
            });
        });
    });
});

describe('Functional CmdRsp framer and parser Check', function () {
    clusterIds.forEach(function (cluster) {
        const cInfo = zclId._getCluster(cluster);
        const cmdRspIds = [];

        if (!cInfo || !cInfo.cmdRsp) return;

        cInfo.cmdRsp.enums.forEach(function (cmdObj) {
            cmdRspIds.push(cmdObj.key);
        });

        cmdRspIds.forEach(function (cmdRsp) {

            if (['reportRssiMeas'].includes(cmdRsp)) return
            
            const reqParams = zclmeta.functional.getParams(cluster, cmdRsp);
            
            if (!reqParams) return;
            
            let args = {};
            reqParams.forEach(function (arg) {
                args[arg.name] = randomArg(arg.type);
            });

            const funcObj = new FuncClass(cluster, 1, cmdRsp);
            const payload = funcObj.frame(args);

            funcObj.parse(payload, function (err, result) {
                it(funcObj.cmd + ' frame() and parse() check', function () {
                    expect(result).to.eql(args);
                });
            });
        });
    });
});

function randomArg(type) {
    switch (type) {
        case 'uint8':
            return chance.integer({min: 0, max: 255});
        case 'uint16':
            return chance.integer({min: 0, max: 65535});
        case 'uint32':
            return chance.integer({min: 0, max: 4294967295});
        case 'int8':
            return chance.integer({min: -128, max: 127});
        case 'int16':
            return chance.integer({min: -32768, max: 32767});
        case 'int32':
            return chance.integer({min: -2147483648, max: 2147483647});
        case 'floatle':
            return chance.floating({min: 0, max: 4294967295});
        case 'longaddr':
            return '0x00124b00019c2ee9';
        case 'stringPreLen':
            const length = chance.integer({min: 0, max: 255});
            return chance.string({length});
        case 'preLenUint8':
        case 'preLenUint16':
        case 'preLenUint32':
            return 10;
        case 'dynUint8':
        case 'dynUint16':
        case 'dynUint24':
        case 'dynUint32':
            {
                const testArr = [];
                for (let k = 0; k < 10; k += 1) {
                    if (type === 'dynUint8') {
                        testArr[k] = chance.integer({min: 0, max: 255});
                    } else if (type === 'dynUint16') {
                        testArr[k] = chance.integer({min: 0, max: 65535});
                    } else if (type === 'dynUint24') {
                        testArr[k] = chance.integer({min: 0, max: 16777215});
                    } else if (type === 'dynUint32') {
                        testArr[k] = chance.integer({min: 0, max: 4294967295});
                    }
                }
                return testArr;
            }
        case 'locationbuffer':
            const testBuf = new Buffer(16);
            for (let k = 0; k < 16; k += 1) {
                testBuf[k] = chance.integer({min: 0, max: 255});
            }
            return testBuf;
        case 'zonebuffer':
            const testArr = [];
            for (let k = 0; k < 20; k += 2) {
                testArr[k] = chance.integer({min: 0, max: 255});
                testArr[k + 1] = chance.integer({min: 0, max: 65535});
            }
            return testArr;
        case 'extfieldsets':
            return [
                {clstId: 0x0006, len: 0x3, extField: [0x01, 0x02, 0x03]},
                {clstId: 0x0009, len: 0x5, extField: [0x05, 0x04, 0x03, 0x02, 0x01]},
            ];
        default:
            break;
    }

    return;
}