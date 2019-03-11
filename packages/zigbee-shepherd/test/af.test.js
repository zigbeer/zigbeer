'use strict';
const EventEmitter = require('events');
const controller = new EventEmitter();
const Q = require('q');

const zclId = require('zcl-id/dist/legacy');

const afConstructor = require('../lib/components/af')(zclId);
const Device  = require('../lib/model/device');
const Endpoint  = require('../lib/model/endpoint');
const Coord  = require('../lib/model/coord');
const Coordpoint  = require('../lib/model/coordpoint');
let af;

const remoteDev = new Device({
    type: 1,
    ieeeAddr: '0x123456789ABCDEF',
    nwkAddr: 100,
    status: 2,
    joinTime: 1468293176128,
    manufId: 10,
    epList: [ 1, 2 ],
    endpoints: {}
});

const rmEp1 = new Endpoint(remoteDev, {
    profId: 0x0104,
    epId: 1,
    devId: 0x0000,
    inClusterList: [ 0x0000, 0x0006 ],
    outClusterList: [ 0x0000 ]
});

const rmEp2 = new Endpoint(remoteDev, {
    profId: 0x0104,
    epId: 2,
    devId: 0x0002,
    inClusterList: [ 0x0000 ],
    outClusterList: [ 0x0000, 0x0006 ]
});

const coordDev = new Coord({
    type: 0,
    ieeeAddr: '0xABCDEF123456789',
    nwkAddr: 0,
    status: 2,
    joinTime: 1468293006128,
    manufId: 10,
    epList: [ 1, 8 ],
    endpoints: {}
});

const loEp1 = new Coordpoint(coordDev, {
    profId: 0x0104,
    epId: 1,
    devId: 0x0002,
    inClusterList: [ 0x0000 ],
    outClusterList: [ 0x0000, 0x0006 ]
}, true);

const loEp8 = new Coordpoint(coordDev, {
    profId: 0x0104,
    epId: 8,
    devId: 0x0050,
    inClusterList: [ 0x0000 ],
    outClusterList: [ 0x0000, 0x0006 ]
});

coordDev.endpoints[loEp1.getEpId()] = loEp1;
coordDev.endpoints[loEp8.getEpId()] = loEp8;

coordDev.getDelegator = function (profId) {
    if (profId === 0x0104)
        return loEp1;
};

controller._coord = coordDev;

let transId = 0;
controller.nextTransId = function () {
    if (++transId > 0xff)
        transId = 1;
    return transId;
};

controller.request = function (subsys, cmdId, valObj, callback) {
    const deferred = Q.defer();
    process.nextTick(() => {
        deferred.resolve({ status: 0 });
    });

    return deferred.promise.nodeify(callback);
};

controller.findEndpoint = function (srcaddr, srcendpoint) {
    if (srcaddr === 100) {
        if (srcendpoint === rmEp1.getEpId())
            return rmEp1;
        else if (srcendpoint === rmEp2.getEpId())
            return rmEp2;
    } else if (srcaddr === 0) {
        if (srcendpoint === loEp1.getEpId())
            return loEp1;
        else if (srcendpoint === loEp8.getEpId())
            return loEp8;
    }
};

function fireFakeCnf(status, epid, transid) {
    const afEventCnf = `AF:dataConfirm:${epid}:${transid}`;
    setTimeout(() => {
        controller.emit(afEventCnf, { status, endpoint: epid, transid  });
    });
}

function fireFakeZclRsp(dstNwkAddr, dstEpId, srcEpId, zclData) {
    setTimeout(() => {
        controller.emit('ZCL:incomingMsg', {
            srcaddr: dstNwkAddr,
            srcendpoint: dstEpId,
            dstendpoint: srcEpId || loEp1.getEpId(),
            zclMsg: zclData
        });
    });
}

function fireFakeZclRawRsp(dstNwkAddr, dstEpId, srcEpId, zclBuffer, cid) {
    // msg: { groupid, clusterid, srcaddr, srcendpoint, dstendpoint, wasbroadcast, linkquality, securityuse, timestamp, transseqnumber, len, data }
    setTimeout(() => {
        controller.emit('AF:incomingMsg', {
            srcaddr: dstNwkAddr,
            srcendpoint: dstEpId,
            dstendpoint: srcEpId || loEp1.getEpId(),
            clusterid: cid || 0,
            data: zclBuffer
        });
    });
}

const someBuffer = Buffer.from([ 1, 2 ])

// af is an inner module, don't have to check all the arguments things
describe('APIs Arguments Check for Throwing Error', () => {
    beforeAll(() => {
        af = afConstructor(controller);
    });

    describe('#.send', () => {
        test('should be a function', () => {
            expect(typeof af.send).toBe('function');
        });

        test('Throw TypeError if srcEp is not an Endpoint or a Coorpoint', () => {
            expect(() => af.send('x', rmEp1, 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(1, rmEp1, 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send([], rmEp1, 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send({}, rmEp1, 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(undefined, rmEp1, 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(null, rmEp1, 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(NaN, rmEp1, 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(new Date(), rmEp1, 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(() => {}, rmEp1, 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);

            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { options: 3000 }, () => {})).not.toThrowError(TypeError);
            expect(() => af.send(loEp1, rmEp1, 3, someBuffer, { options: 3000 }, () => {})).not.toThrowError(TypeError);

        });

        test('Throw TypeError if dstEp is not an Endpoint or a Coorpoint', () => {
            expect(() => af.send(rmEp1, 'x', 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, 1, 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, [], 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, {}, 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, undefined, 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, null, 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, NaN, 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, new Date(), 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, () => {}, 3, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);

            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { options: 3000 }, () => {})).not.toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp2, 3, someBuffer, { options: 3000 }, () => {})).not.toThrowError(TypeError);
            expect(() => af.send(rmEp1, loEp8, 3, someBuffer, { options: 3000 }, () => {})).not.toThrowError(TypeError);
        });

        test('Throw TypeError if cluster id is string, but not a valud id', done => {
            af.send(rmEp1, rmEp1, 'x', someBuffer, { options: 3000 }, err => {
                expect(err).toBeTruthy();
                done();
            });
        });

        test('Throw TypeError if cluster id is string, but a valud id', done => {
            af.send(rmEp1, rmEp1, 'genAlarms', someBuffer, { options: 3000 }, err => {
                if (!err)
                    done();
            });

            fireFakeCnf(0, 1, transId);
        });

        test('Throw TypeError if cluster id is not a number', () => {
            expect(() => af.send(rmEp1, rmEp1, {}, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, [], someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, NaN, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, undefined, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, null, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(
                rmEp1,
                rmEp1,
                new Date(),
                someBuffer,
                { options: 3000 },
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, () => {}, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { options: 3000 }, () => {})).not.toThrowError(TypeError);
        });

        test('Throw TypeError if rawPayload is not a buffer', () => {
            expect(() => af.send(rmEp1, rmEp1, 3, 'x', { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, [], { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, {}, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, 311, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, NaN, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Date(), { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, () => {}, { options: 3000 }, () => {})).toThrowError(TypeError);

            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { options: 3000 }, () => {})).not.toThrowError(TypeError);
        });

        test('if opt is given: should throw if opt.options is not a number', () => {
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { options: 'x' }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { options: [] }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { options: null }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { options: {} }, () => {})).toThrowError(TypeError);
            expect(() => af.send(
                rmEp1,
                rmEp1,
                3,
                someBuffer,
                { options() {} },
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { options: NaN }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { options: 3000 }, () => {})).not.toThrowError(TypeError);
        });

        test('if opt is given: should throw if opt.radius is not a number', () => {
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { radius: 'x' }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { radius: [] }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { radius: null }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { radius: {} }, () => {})).toThrowError(TypeError);
            expect(() => af.send(
                rmEp1,
                rmEp1,
                3,
                someBuffer,
                { radius() {} },
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { radius: NaN }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { radius: 3000 }, () => {})).not.toThrowError(TypeError);
        });

        test('if opt is given: should throw if opt.timeout is not a number', () => {
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { timeout: 'x' }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { timeout: [] }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { timeout: null }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { timeout: {} }, () => {})).toThrowError(TypeError);
            expect(() => af.send(
                rmEp1,
                rmEp1,
                3,
                someBuffer,
                { timeout() {} },
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { timeout: NaN }, () => {})).toThrowError(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, someBuffer, { timeout: 3000 }, () => {})).not.toThrowError(TypeError);
        });
    });

    describe('#.sendExt', () => {
        test('should be a function', () => {
            expect(typeof af.sendExt).toBe('function');
        });

        test(
            'Throw TypeError if srcEp is not an Instance of Endpoint or Coordpoint class',
            () => {
                expect(() => af.sendExt('x', 2, 3, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(1, 2, 3, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt([], 2, 3, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt({}, 2, 3, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(new Date(), 2, 3, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(null, 2, 3, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(undefined, 2, 3, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(NaN, 2, 3, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(() => {}, 2, 3, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);

                expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { options: 3000 }, () => {})).not.toThrowError(TypeError);
            }
        );

        test('Throw TypeError if addrMode is not a number', () => {
            expect(() => af.sendExt(loEp8, 'x', 3, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, [], 3, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, {}, 3, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, NaN, 3, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(
                loEp8,
                new Date(),
                3,
                12,
                someBuffer,
                { options: 3000 },
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, () => {}, 3, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);

            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { options: 3000 }, () => {})).not.toThrowError(TypeError);
        });

        test(
            'Throw TypeError if dstAddrOrGrpId is not a number for ADDR_16BIT(2)',
            () => {
                expect(() => af.sendExt(loEp8, 2, [], 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(loEp8, 2, {}, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(loEp8, 2, NaN, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(
                    loEp8,
                    2,
                    new Date(),
                    12,
                    someBuffer,
                    { options: 3000 },
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.sendExt(loEp8, 2, () => {}, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(loEp8, 2, 'xxx', 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);

                expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { options: 3000 }, () => {})).not.toThrowError(TypeError);
            }
        );

        test(
            'Throw TypeError if dstAddrOrGrpId is not a number for ADDR_GROUP(1)',
            () => {
                expect(() => af.sendExt(loEp8, 1, [], 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(loEp8, 1, {}, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(loEp8, 1, NaN, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(
                    loEp8,
                    1,
                    new Date(),
                    12,
                    someBuffer,
                    { options: 3000 },
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.sendExt(loEp8, 1, () => {}, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(loEp8, 1, 'xxx', 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);

                expect(() => af.sendExt(loEp8, 1, 3, 12, someBuffer, { options: 3000 }, () => {})).not.toThrowError(TypeError);
            }
        );

        test(
            'Throw TypeError if dstAddrOrGrpId is not a string for ADDR_64BIT(1)',
            () => {
                expect(() => af.sendExt(loEp8, 3, [], 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(loEp8, 3, {}, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(loEp8, 3, NaN, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(
                    loEp8,
                    3,
                    new Date(),
                    12,
                    someBuffer,
                    { options: 3000 },
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.sendExt(loEp8, 3, () => {}, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
                expect(() => af.sendExt(loEp8, 3, 1234, 12, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);

                expect(() => af.sendExt(loEp8, 3, 'xxx', 3, someBuffer, { options: 3000 }, () => {})).not.toThrowError(TypeError);
            }
        );

        test('Throw TypeError if cluster id is string, but not a valud id', done => {
            af.sendExt(loEp8, 2, 3, 'x', someBuffer, { options: 3000 }, err => {
                expect(err).toBeTruthy();
                done();
            });
        });

        test('Throw TypeError if cluster id is string, but a valud id', done => {
            af.sendExt(loEp8, 2, 3, 'genAlarms', someBuffer, { options: 3000 }, err => {
                if (!err)
                    done();
            });

            fireFakeCnf(0, 8, transId);
        });

        test('Throw TypeError if cluster id is not a number', () => {
            expect(() => af.sendExt(loEp8, 2, 3, {}, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, [], someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, NaN, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, undefined, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, null, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, new Date(), someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, () => {}, someBuffer, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 3, someBuffer, { options: 3000 }, () => {})).not.toThrowError(TypeError);
        });

        test('Throw TypeError if rawPayload is not a buffer', () => {
            expect(() => af.sendExt(loEp8, 2, 3, 12, 'x', { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, [], { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, {}, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, 311, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, NaN, { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Date(), { options: 3000 }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, () => {}, { options: 3000 }, () => {})).toThrowError(TypeError);

            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { options: 3000 }, () => {})).not.toThrowError(TypeError);
        });

        test('if opt is given: should throw if opt.options is not a number', () => {
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { options: 'x' }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { options: [] }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { options: null }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { options: {} }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(
                loEp8,
                2,
                3,
                12,
                someBuffer,
                { options() {} },
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { options: NaN }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { options: 3000 }, () => {})).not.toThrowError(TypeError);
        });

        test('if opt is given: should throw if opt.radius is not a number', () => {
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { radius: 'x' }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { radius: [] }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { radius: null }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { radius: {} }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(
                loEp8,
                2,
                3,
                12,
                someBuffer,
                { radius() {} },
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { radius: NaN }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { radius: 3000 }, () => {})).not.toThrowError(TypeError);
        });

        test('if opt is given: should throw if opt.timeout is not a number', () => {
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { timeout: 'x' }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { timeout: [] }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { timeout: null }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { timeout: {} }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(
                loEp8,
                2,
                3,
                12,
                someBuffer,
                { timeout() {} },
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { timeout: NaN }, () => {})).toThrowError(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, someBuffer, { timeout: 3000 }, () => {})).not.toThrowError(TypeError);
        });
    });

    describe('#.zclFoundation', () => {
        test(
            'Throw TypeError if srcEp is not an Instance of Endpoint or Coordpoint class',
            () => {
                expect(() => af.zclFoundation(
                    'x',
                    rmEp1,
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.zclFoundation(
                    1,
                    rmEp1,
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.zclFoundation(
                    [],
                    rmEp1,
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.zclFoundation(
                    {},
                    rmEp1,
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.zclFoundation(
                    null,
                    rmEp1,
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.zclFoundation(
                    true,
                    rmEp1,
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.zclFoundation(
                    undefined,
                    rmEp1,
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.zclFoundation(
                    new Date(),
                    rmEp1,
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.zclFoundation(
                    () => {},
                    rmEp1,
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);

                expect(() => af.zclFoundation(
                    rmEp1,
                    rmEp1,
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).not.toThrowError(TypeError);
            }
        );

        test(
            'Throw TypeError if dstEp is not an Instance of Endpoint or Coordpoint class',
            () => {
                expect(() => af.zclFoundation(
                    rmEp1,
                    'x',
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.zclFoundation(
                    rmEp1,
                    1,
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.zclFoundation(
                    rmEp1,
                    [],
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.zclFoundation(
                    rmEp1,
                    {},
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.zclFoundation(
                    rmEp1,
                    null,
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.zclFoundation(
                    rmEp1,
                    true,
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.zclFoundation(
                    rmEp1,
                    undefined,
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.zclFoundation(
                    rmEp1,
                    new Date(),
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);
                expect(() => af.zclFoundation(
                    rmEp1,
                    () => {},
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).toThrowError(TypeError);

                expect(() => af.zclFoundation(
                    rmEp1,
                    rmEp1,
                    3,
                    'read',
                    [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                    () => {}
                )).not.toThrowError(TypeError);
            }
        );

        test('Throw TypeError if cId is not a string and not a number', () => {
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                [],
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                {},
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                null,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                undefined,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                NaN,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                false,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                new Date(),
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                () => {},
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).toThrowError(TypeError);

            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).not.toThrowError(TypeError);
        });

        test('Throw TypeError if cmd is not a string and not a number', () => {
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                [],
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                {},
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                null,
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                undefined,
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                NaN,
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                false,
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                new Date(),
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).toThrowError(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                () => {},
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).toThrowError(TypeError);

            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).not.toThrowError(TypeError);
        });

        test('Throw TypeError if zclData is with bad type', () => {
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', 'x', () => {})).toThrowError(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', null, () => {})).toThrowError(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', 3, () => {})).toThrowError(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', true, () => {})).toThrowError(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', NaN, () => {})).toThrowError(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', undefined, () => {})).toThrowError(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', () => {}, () => {})).toThrowError(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', new Date(), () => {})).toThrowError(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', {}, () => {})).toThrowError(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', () => {}, () => {})).toThrowError(TypeError);

            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], () => {})).not.toThrowError(TypeError);
        });

        test('Throw TypeError if cfg is given but not an object', () => {
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], 'x', () => {})).toThrowError(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], 1, () => {})).toThrowError(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], [], () => {})).toThrowError(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], true, () => {})).toThrowError(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], () => {}, () => {})).toThrowError(TypeError);

            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], NaN, () => {})).not.toThrowError(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], null, () => {})).not.toThrowError(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], undefined, () => {})).not.toThrowError(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], {}, () => {})).not.toThrowError(TypeError);
        });
    });
    describe('#.zclFunctional', () => {
        test(
            'Throw TypeError if srcEp is not an Instance of Endpoint or Coordpoint class',
            () => {
                expect(() => af.zclFunctional('x', rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
                expect(() => af.zclFunctional(1, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
                expect(() => af.zclFunctional([], rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
                expect(() => af.zclFunctional({}, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
                expect(() => af.zclFunctional(null, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
                expect(() => af.zclFunctional(true, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
                expect(() => af.zclFunctional(undefined, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
                expect(() => af.zclFunctional(new Date(), rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
                expect(() => af.zclFunctional(() => {}, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);

                expect(() => af.zclFunctional(rmEp1, rmEp1, 5, 3, { groupid: 1 }, () => {})).not.toThrowError(TypeError);
                expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).not.toThrowError(TypeError);
            }
        );

        test(
            'Throw TypeError if dstEp is not an Instance of Endpoint or Coordpoint class',
            () => {
                expect(() => af.zclFunctional(rmEp1, 'x', 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
                expect(() => af.zclFunctional(rmEp1, 1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
                expect(() => af.zclFunctional(rmEp1, [], 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
                expect(() => af.zclFunctional(rmEp1, {}, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
                expect(() => af.zclFunctional(rmEp1, null, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
                expect(() => af.zclFunctional(rmEp1, true, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
                expect(() => af.zclFunctional(rmEp1, undefined, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
                expect(() => af.zclFunctional(rmEp1, new Date(), 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
                expect(() => af.zclFunctional(rmEp1, () => {}, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);

                expect(() => af.zclFunctional(rmEp1, rmEp1, 5, 3, { groupid: 1 }, () => {})).not.toThrowError(TypeError);
                expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).not.toThrowError(TypeError);
            }
        );

        test('Throw TypeError if cId is not a string and not a number', () => {
            expect(() => af.zclFunctional(rmEp1, rmEp1, [], 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, {}, 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, null, 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, true, 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, undefined, 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, new Date(), 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, () => {}, 'removeAll', { groupid: 1 }, () => {})).toThrowError(TypeError);

            expect(() => af.zclFunctional(rmEp1, rmEp1, 5, 3, { groupid: 1 }, () => {})).not.toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).not.toThrowError(TypeError);
        });

        test('Throw TypeError if cmd is not a string and not a number', () => {
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', [], { groupid: 1 }, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', {}, { groupid: 1 }, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', null, { groupid: 1 }, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', true, { groupid: 1 }, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', undefined, { groupid: 1 }, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', NaN, { groupid: 1 }, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', new Date(), { groupid: 1 }, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', () => {}, { groupid: 1 }, () => {})).toThrowError(TypeError);

            expect(() => af.zclFunctional(rmEp1, rmEp1, 5, 3, { groupid: 1 }, () => {})).not.toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).not.toThrowError(TypeError);
        });

        test('Throw TypeError if zclData is with bad type', () => {
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', 'x', () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', null, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', 3, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', true, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', NaN, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', undefined, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', () => {}, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', () => {}, () => {})).toThrowError(TypeError);

            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, () => {})).not.toThrowError(TypeError);
        });

        test('Throw TypeError if cfg is given but not an object', () => {
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, 'x', () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, 1, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, [], () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, true, () => {})).toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, () => {}, () => {})).toThrowError(TypeError);

            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, NaN, () => {})).not.toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, null, () => {})).not.toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, undefined, () => {})).not.toThrowError(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, {}, () => {})).not.toThrowError(TypeError);
        });
    });

    describe('#.zclClusterAttrIdsReq', () => {
        test(
            'Throw TypeError if dstEp is not an Instance of Endpoint or Coordpoint class',
            () => {
                expect(() => af.zclClusterAttrIdsReq('x', 'genScenes', () => {})).toThrowError(TypeError);
                expect(() => af.zclClusterAttrIdsReq(1, 'genScenes', () => {})).toThrowError(TypeError);
                expect(() => af.zclClusterAttrIdsReq([], 'genScenes', () => {})).toThrowError(TypeError);
                expect(() => af.zclClusterAttrIdsReq({}, 'genScenes', () => {})).toThrowError(TypeError);
                expect(() => af.zclClusterAttrIdsReq(null, 'genScenes', () => {})).toThrowError(TypeError);
                expect(() => af.zclClusterAttrIdsReq(true, 'genScenes', () => {})).toThrowError(TypeError);
                expect(() => af.zclClusterAttrIdsReq(undefined, 'genScenes', () => {})).toThrowError(TypeError);
                expect(() => af.zclClusterAttrIdsReq(new Date(), 'genScenes', () => {})).toThrowError(TypeError);
                expect(() => af.zclClusterAttrIdsReq(() => {}, 'genScenes', () => {})).toThrowError(TypeError);

                expect(() => af.zclClusterAttrIdsReq(rmEp1, 5, () => {})).not.toThrowError(TypeError);
                expect(() => af.zclClusterAttrIdsReq(rmEp1, 'genScenes', () => {})).not.toThrowError(TypeError);
            }
        );
    
        test('Throw TypeError if cId is not a string or a number', () => {
            expect(() => af.zclClusterAttrIdsReq(rmEp1, [], () => {})).toThrowError(TypeError);
            expect(() => af.zclClusterAttrIdsReq(rmEp1, {}, () => {})).toThrowError(TypeError);
            expect(() => af.zclClusterAttrIdsReq(rmEp1, NaN, () => {})).toThrowError(TypeError);
            expect(() => af.zclClusterAttrIdsReq(rmEp1, null, () => {})).toThrowError(TypeError);
            expect(() => af.zclClusterAttrIdsReq(rmEp1, undefined, () => {})).toThrowError(TypeError);
            expect(() => af.zclClusterAttrIdsReq(rmEp1, true, () => {})).toThrowError(TypeError);
            expect(() => af.zclClusterAttrIdsReq(rmEp1, new Date(), () => {})).toThrowError(TypeError);
            expect(() => af.zclClusterAttrIdsReq(rmEp1, () => {}, () => {})).toThrowError(TypeError);

            expect(() => af.zclClusterAttrIdsReq(rmEp1, 5, () => {})).not.toThrowError(TypeError);
            expect(() => af.zclClusterAttrIdsReq(rmEp1, 'genScenes', () => {})).not.toThrowError(TypeError);
        });
    });

    describe('#.zclClusterAttrsReq', () => {
        test(
            'Throw TypeError if dstEp is not an Instance of Endpoint or Coordpoint class',
            () => {
                expect(() => af.zclClusterAttrsReq('x', 'genScenes', () => {})).toThrowError(TypeError);
                expect(() => af.zclClusterAttrsReq(1, 'genScenes', () => {})).toThrowError(TypeError);
                expect(() => af.zclClusterAttrsReq([], 'genScenes', () => {})).toThrowError(TypeError);
                expect(() => af.zclClusterAttrsReq({}, 'genScenes', () => {})).toThrowError(TypeError);
                expect(() => af.zclClusterAttrsReq(null, 'genScenes', () => {})).toThrowError(TypeError);
                expect(() => af.zclClusterAttrsReq(true, 'genScenes', () => {})).toThrowError(TypeError);
                expect(() => af.zclClusterAttrsReq(undefined, 'genScenes', () => {})).toThrowError(TypeError);
                expect(() => af.zclClusterAttrsReq(new Date(), 'genScenes', () => {})).toThrowError(TypeError);
                expect(() => af.zclClusterAttrsReq(() => {}, 'genScenes', () => {})).toThrowError(TypeError);

                expect(() => af.zclClusterAttrsReq(rmEp1, 5, () => {})).not.toThrowError(TypeError);
                expect(() => af.zclClusterAttrsReq(rmEp1, 'genScenes', () => {})).not.toThrowError(TypeError);
            }
        );

        test('Throw TypeError if cId is not a string or a number', () => {
            expect(() => af.zclClusterAttrsReq(rmEp1, [], () => {})).toThrowError(TypeError);
            expect(() => af.zclClusterAttrsReq(rmEp1, {}, () => {})).toThrowError(TypeError);
            expect(() => af.zclClusterAttrsReq(rmEp1, NaN, () => {})).toThrowError(TypeError);
            expect(() => af.zclClusterAttrsReq(rmEp1, null, () => {})).toThrowError(TypeError);
            expect(() => af.zclClusterAttrsReq(rmEp1, undefined, () => {})).toThrowError(TypeError);
            expect(() => af.zclClusterAttrsReq(rmEp1, true, () => {})).toThrowError(TypeError);
            expect(() => af.zclClusterAttrsReq(rmEp1, new Date(), () => {})).toThrowError(TypeError);
            expect(() => af.zclClusterAttrsReq(rmEp1, () => {}, () => {})).toThrowError(TypeError);

            expect(() => af.zclClusterAttrsReq(rmEp1, 5, () => {})).not.toThrowError(TypeError);
            expect(() => af.zclClusterAttrsReq(rmEp1, 'genScenes', () => {})).not.toThrowError(TypeError);
        });
    });

    describe('#.zclClustersReq', () => {
        test(
            'Throw TypeError if dstEp is not an Instance of Endpoint or Coordpoint class',
            () => {
                expect(() => af.zclClustersReq('x', () => {})).toThrowError(TypeError);
                expect(() => af.zclClustersReq(1, () => {})).toThrowError(TypeError);
                expect(() => af.zclClustersReq([], () => {})).toThrowError(TypeError);
                expect(() => af.zclClustersReq({}, () => {})).toThrowError(TypeError);
                expect(() => af.zclClustersReq(null, () => {})).toThrowError(TypeError);
                expect(() => af.zclClustersReq(true, () => {})).toThrowError(TypeError);
                expect(() => af.zclClustersReq(undefined, () => {})).toThrowError(TypeError);
                expect(() => af.zclClustersReq(new Date(), () => {})).toThrowError(TypeError);
                expect(() => af.zclClustersReq(() => {}, () => {})).toThrowError(TypeError);

                expect(() => af.zclClustersReq(rmEp1, () => {})).not.toThrowError(TypeError);
                expect(() => af.zclClustersReq(rmEp1, () => {})).not.toThrowError(TypeError);
            }
        );
    });
});

describe('Module Methods Check', () => {
    beforeAll(() => {
        af = afConstructor(controller);
    });

    describe('#.send - by delegator', () => {
        test('if srsp status !== 0, === 1, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 1 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(rmEp1, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(rsp).not.toBe(0);
                expect(rsp).not.toBe('SUCCESS');
                done();
            });

            requestStub.mockRestore();
        });

        test('if srsp status === 0, nothing happen', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(rmEp1, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(rsp.status).toBe(0);
                done();
            });
            fireFakeCnf(0, 1, transId);
            requestStub.mockRestore();
        });

        test('if srsp status === SUCCESS, nothing happen', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 'SUCCESS'});
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(rmEp1, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(rsp.status).toBe(0)
                done();
            });
            fireFakeCnf(0, 1, transId);
            requestStub.mockRestore();
        });

        test('if areq status === 0xcd, NWK_NO_ROUTE, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(rmEp1, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(err).toBeTruthy();
                done();
            });

            fireFakeCnf(0xcd, 1, transId);
            requestStub.mockRestore();
        });

        test('if areq status === 0xe9, MAC_NO_ACK, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(rmEp1, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(err).toBeTruthy();
                done();
            });

            fireFakeCnf(0xe9, 1, transId);
            requestStub.mockRestore();
        });

        test('if areq status === 0xb7, APS_NO_ACK, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(rmEp1, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(err).toBeTruthy();
                done();
            });

            fireFakeCnf(0xb7, 1, transId);
            requestStub.mockRestore();
        });

        test('if areq status === 0xf0, MAC_TRANSACTION_EXPIRED, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(rmEp1, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(err).toBeTruthy();
                done();
            });

            fireFakeCnf(0xf0, 1, transId);
            requestStub.mockRestore();
        });

        test('if areq status === 0xANY, UNKNOWN ERROR, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(rmEp1, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(err).toBeTruthy();
                done();
            });

            fireFakeCnf(0xEE, 1, transId);
            requestStub.mockRestore();
        });

        test('if srsp status === 0, apsAck = 0, resolve successfully', done => {
            af.send(rmEp1, rmEp1, 3, someBuffer, { options: 0 }, (err, rsp) => {
                expect(rsp.status).toBe(0)
                done();
            });
        });

        test('if srsp status === 0, resolve successfully', done => {
            af.send(rmEp1, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(rsp.status).toBe(0)
                done();
            });
            fireFakeCnf(0, 1, transId);
        });
    });

    describe('#.send - by local ep 8', () => {
        test('if srsp status !== 0, === 1, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 1 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(loEp8, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(rsp).not.toBe(0)
                expect(rsp).not.toBe('SUCCESS')
                done();
            });

            requestStub.mockRestore();
        });

        test('if srsp status === 0, nothing happen', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(loEp8, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(rsp.status).toBe(0)
                done();
            });
            fireFakeCnf(0, 8, transId);
            requestStub.mockRestore();
        });

        test('if srsp status === SUCCESS, nothing happen', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 'SUCCESS'});
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(loEp8, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(rsp.status).toBe(0)
                done();
            });
            fireFakeCnf(0, 8, transId);
            requestStub.mockRestore();
        });

        test('if areq status === 0xcd, NWK_NO_ROUTE, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(loEp8, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(err).toBeTruthy();
                done();
            });

            fireFakeCnf(0xcd, 8, transId);
            requestStub.mockRestore();
        });

        test('if areq status === 0xe9, MAC_NO_ACK, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(loEp8, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(err).toBeTruthy();
                done();
            });

            fireFakeCnf(0xe9, 8, transId);
            requestStub.mockRestore();
        });

        test('if areq status === 0xb7, APS_NO_ACK, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(loEp8, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(err).toBeTruthy();
                done();
            });

            fireFakeCnf(0xb7, 8, transId);
            requestStub.mockRestore();
        });

        test('if areq status === 0xf0, MAC_TRANSACTION_EXPIRED, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(loEp8, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(err).toBeTruthy();
                done();
            });

            fireFakeCnf(0xf0, 8, transId);
            requestStub.mockRestore();
        });

        test('if areq status === 0xANY, UNKNOWN ERROR, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(loEp8, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(err).toBeTruthy();
                done();
            });

            fireFakeCnf(0xEE, 8, transId);
            requestStub.mockRestore();
        });

        test('if srsp status === 0, apsAck = 0, resolve successfully', done => {
            af.send(loEp8, rmEp1, 3, someBuffer, { options: 0 }, (err, rsp) => {
                expect(rsp.status).toBe(0)
                done();
            });
        });

        test('if srsp status === 0, resolve successfully', done => {
            af.send(loEp8, rmEp1, 3, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(rsp.status).toBe(0)
                done();
            });
            fireFakeCnf(0, 8, transId);
        });
    });

    describe('#.sendExt', () => {
        test('if srsp status !== 0, === 1, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 1 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.sendExt(loEp8, 2, 3, 12, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(rsp).not.toBe(0)
                expect(rsp).not.toBe('SUCCESS')
                done();
            });

            requestStub.mockRestore();
        });

        test('if srsp status === 0, nothing happen', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.sendExt(loEp8, 2, 3, 12, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(rsp.status).toBe(0)
                done();
            });

            fireFakeCnf(0, 8, transId);
            requestStub.mockRestore();
        });

        test('if srsp status === SUCCESS, nothing happen', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 'SUCCESS'});
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.sendExt(loEp8, 2, 3, 12, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(rsp.status).toBe(0)
                done();
            });

            fireFakeCnf(0, 8, transId);
            requestStub.mockRestore();
        });

        test('if areq status === 0xcd, NWK_NO_ROUTE, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.sendExt(loEp8, 2, 3, 12, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(err).toBeTruthy();
                done();
            });

            fireFakeCnf(0xcd, 8, transId);
            requestStub.mockRestore();
        });

        test('if areq status === 0xe9, MAC_NO_ACK, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.sendExt(loEp8, 2, 3, 12, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(err).toBeTruthy();
                done();
            });

            fireFakeCnf(0xe9, 8, transId);
            requestStub.mockRestore();
        });

        test('if areq status === 0xb7, APS_NO_ACK, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.sendExt(loEp8, 2, 3, 12, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(err).toBeTruthy();
                done();
            });

            fireFakeCnf(0xb7, 8, transId);
            requestStub.mockRestore();
        });

        test('if areq status === 0xf0, MAC_TRANSACTION_EXPIRED, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.sendExt(loEp8, 2, 3, 12, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(err).toBeTruthy();
                done();
            });

            fireFakeCnf(0xf0, 8, transId);
            requestStub.mockRestore();
        });

        test('if areq status === 0xANY, UNKNOWN ERROR, reject', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.sendExt(loEp8, 2, 3, 12, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(err).toBeTruthy();
                done();
            });

            fireFakeCnf(0xEE, 8, transId);
            requestStub.mockRestore();
        });

        test('if srsp status === 0, apsAck = 0, resolve successfully', done => {
            af.sendExt(loEp8, 2, 3, 12, someBuffer, { options: 0 }, (err, rsp) => {
                expect(rsp.status).toBe(0)
                done();
            });
        });

        test('if srsp status === 0, resolve successfully', done => {
            af.sendExt(loEp8, 2, 3, 12, someBuffer, { timeout: 3000 }, (err, rsp) => {
                expect(rsp.status).toBe(0)
                done();
            });

            fireFakeCnf(0, 8, transId);
        });
    });

    describe('#.zclFoundation - by delegator', () => {
        test('zcl good send', done => {
            af.zclFoundation(rmEp1, rmEp1, 3, 'read', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], (err, zclMsg) => {
                if (!err && (zclMsg === fakeZclMsg))
                    done();
            });

            const fakeZclMsg = {
                seqNum: af._seq,
                frameCntl: {
                    frameType: 0,  // Command acts across the entire profile (foundation)
                    manufSpec: 0,
                    direction: 1,
                    disDefaultRsp: 0
                }
            };

            fireFakeZclRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), null, fakeZclMsg);
        });

        test('zcl bad send - unkown cId', done => {
            af.zclFoundation(rmEp1, rmEp1, 'xxx', 'read', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], (err, zclMsg) => {
                expect(err).toBeTruthy();
                done();
            });
        });

        test('zcl bad send - unkown cmd', done => {
            af.zclFoundation(rmEp1, rmEp1, 3, 'read333', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], (err, zclMsg) => {
                expect(err).toBeTruthy();
                done();
            });
        });
    });

    describe('#.zclFoundation - by loEp8', () => {
        test('zcl good send', done => {
            af.zclFoundation(loEp8, rmEp1, 3, 'read', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], { direction: 0 }, (err, zclMsg) => {
                if (!err && (zclMsg === fakeZclMsg))
                    done();
            });

            const fakeZclMsg = {
                seqNum: af._seq,
                frameCntl: {
                    frameType: 0,  // Command acts across the entire profile (foundation)
                    manufSpec: 0,
                    direction: 1,
                    disDefaultRsp: 0
                }
            };


            fireFakeZclRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), loEp8.getEpId(), fakeZclMsg);
        });

        test('zcl good send - rsp, no listen', done => {
            af.zclFoundation(loEp8, rmEp1, 3, 'readRsp', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], { direction: 1 }, (err, msg) => {
                if (!err && (msg.status === 0))
                    done();
            });

            fireFakeCnf(0, loEp8.getEpId(), transId);
        });

        test('zcl bad send - unkown cId', done => {
            af.zclFoundation(loEp8, rmEp1, 'xxx', 'read', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], (err, zclMsg) => {
                expect(err).toBeTruthy();
                done();
            });
        });

        test('zcl bad send - unkown cmd', done => {
            af.zclFoundation(loEp8, rmEp1, 3, 'read333', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], (err, zclMsg) => {
                expect(err).toBeTruthy();
                done();
            });
        });
    });

    describe('#.zclFunctional - by delegator', () => {
        test('zcl good send', done => {

            af.zclFunctional(rmEp1, rmEp1, 5, 'removeAll', { groupid: 1 }, { direction: 0 }, (err, zclMsg) => {
                if (!err && (zclMsg === fakeZclMsg))
                    done();
            });

            const fakeZclMsg = {
                seqNum: af._seq,
                frameCntl: {
                    frameType: 1,
                    manufSpec: 0,
                    direction: 1,
                    disDefaultRsp: 0
                }
            };

            fireFakeZclRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), null, fakeZclMsg);
        });

        test('zcl bad send - unkown cId', done => {
            af.zclFunctional(rmEp1, rmEp1, 'xxx', 'removeAll', { groupid: 1 }, { direction: 0 }, (err, zclMsg) => {
                expect(err).toBeTruthy();
                done();
            });
        });

        test('zcl bad send - unkown cmd', done => {
            af.zclFunctional(rmEp1, rmEp1, 5, 'removeAllxxx', { groupid: 1 }, { direction: 0 }, (err, zclMsg) => {
                expect(err).toBeTruthy();
                done();
            });
        });
    });

    describe('#.zclFunctional - by loEp8', () => {
        test('zcl good send', done => {

            af.zclFunctional(loEp8, rmEp1, 5, 'removeAll', { groupid: 1 }, { direction: 0 }, (err, zclMsg) => {
                if (!err && (zclMsg === fakeZclMsg))
                    done();
            });

            const fakeZclMsg = {
                seqNum: af._seq,
                frameCntl: {
                    frameType: 1,
                    manufSpec: 0,
                    direction: 1,
                    disDefaultRsp: 0
                }
            };

            fireFakeZclRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), loEp8.getEpId(), fakeZclMsg);
        });


        test('zcl good send - rsp, no listen', done => {

            af.zclFunctional(loEp8, rmEp1, 5, 'removeAllRsp', { status: 0, groupid: 1 }, { direction: 1 }, (err, zclMsg) => {
                if (!err )
                    done();
            });

            fireFakeCnf(0, loEp8.getEpId(), transId);
        });

        test('zcl bad send - unkown cId', done => {
            af.zclFunctional(loEp8, rmEp1, 'xxx', 'removeAll', { groupid: 1 }, { direction: 0 }, (err, zclMsg) => {
                expect(err).toBeTruthy();
                done();
            });
        });

        test('zcl bad send - unkown cmd', done => {
            af.zclFunctional(loEp8, rmEp1, 5, 'removeAllxxx', { groupid: 1 }, { direction: 0 }, (err, zclMsg) => {
                expect(err).toBeTruthy();
                done();
            });
        });
    });

    describe('#.zclFoundation - by delegator - rawZclRsp', () => {
        test('zcl good send', done => {
            af.zclFoundation(rmEp1, rmEp1, 3, 'read', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], (err, zclMsg) => {
                if (!err)
                    done();
            });

            const fakeZclRaw = Buffer.from([ 8, af._seq, 0, 10, 10]);
            fireFakeZclRawRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), null, fakeZclRaw);
        });
    });

    describe('#.zclFoundation - by loEp8', () => {
        test('zcl good send', done => {
            af.zclFoundation(loEp8, rmEp1, 3, 'read', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], { direction: 0 }, (err, zclMsg) => {
                if (!err)
                    done();
            });

            const fakeZclRaw = Buffer.from([ 8, af._seq, 0, 10, 10]);
            fireFakeZclRawRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), loEp8.getEpId(), fakeZclRaw);
        });
    });

    describe('#.zclFunctional - by delegator', () => {
        test('zcl good send', done => {

            af.zclFunctional(rmEp1, rmEp1, 5, 'removeAll', { groupid: 1 }, { direction: 0 }, (err, zclMsg) => {
                if (!err)
                    done();
            });

            const fakeZclRaw = Buffer.from([ 9, af._seq, 3, 10, 10, 10]);
            fireFakeZclRawRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), null, fakeZclRaw, 5);
        });
    });

    describe('#.zclFunctional - by loEp8', () => {
        test('zcl good send', done => {

            af.zclFunctional(loEp8, rmEp1, 5, 'removeAll', { groupid: 1 }, { direction: 0 }, (err, zclMsg) => {
                if (!err)
                    done();
            });
            const fakeZclRaw = Buffer.from([ 9, af._seq, 3, 10, 10, 10]);
            fireFakeZclRawRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), loEp8.getEpId(), fakeZclRaw, 5);
        });
    });


    describe('#.zclClusterAttrIdsReq', () => {
        test('zcl good send - only 1 rsp', done => {
            af.zclClusterAttrIdsReq(rmEp1, 6, (err, rsp) => {
                if (!err)
                    done();
            });

            const fakeZclMsg = {
                seqNum: af._seq,
                frameCntl: {
                    frameType: 0,  // Command acts across the entire profile (foundation)
                    manufSpec: 0,
                    direction: 1,
                    disDefaultRsp: 0
                },
                payload: {
                    discComplete: 1,
                    attrInfos: [ { attrId: 1, dataType: 0 } ]
                }
            };

            fireFakeZclRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), null, fakeZclMsg);
        });


        test('zcl good send - 3 rsps', done => {
            af.zclClusterAttrIdsReq(rmEp1, 6, (err, rsp) => {
                if (!err)
                    done();
            });

            const seqNum1 = af._seq;
            const seqNum2 = af._seq + 1;
            const seqNum3 = af._seq + 2;

            const fakeZclMsg = {
                seqNum: seqNum1,
                frameCntl: {
                    frameType: 0,  // Command acts across the entire profile (foundation)
                    manufSpec: 0,
                    direction: 1,
                    disDefaultRsp: 0
                },
                payload: {
                    discComplete: 0,
                    attrInfos: [ { attrId: 1, dataType: 0 } ]
                }
            };

            fireFakeZclRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), null, fakeZclMsg);

            setTimeout(() => {
                fakeZclMsg.seqNum = seqNum2;
                fakeZclMsg.payload.attrInfos = [ { attrId: 2, dataType: 0 }, { attrId: 3, dataType: 0 } ];
                fireFakeZclRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), null, fakeZclMsg);
            }, 20);

            setTimeout(() => {
                fakeZclMsg.seqNum = seqNum3;
                fakeZclMsg.payload.discComplete = 1;
                fakeZclMsg.payload.attrInfos = [ { attrId: 6, dataType: 0 }, { attrId: 7, dataType: 0 }, { attrId: 18, dataType: 0 } ];
                fireFakeZclRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), null, fakeZclMsg);
            }, 40);
        });
    });


    describe('#.zclClusterAttrsReq', () => {
        test('zcl good send - only 1 rsp', done => {
            af.zclClusterAttrsReq(rmEp1, 6, (err, rsp) => {
                if (!err)
                    done();
            });

            const fakeZclMsg = {
                seqNum: af._seq,
                frameCntl: {
                    frameType: 0,  // Command acts across the entire profile (foundation)
                    manufSpec: 0,
                    direction: 1,
                    disDefaultRsp: 0
                },
                payload: {
                    discComplete: 1,
                    attrInfos: [ { attrId: 16384, dataType: 0 }, { attrId: 16385, dataType: 0 } ]
                }
            };
            const seqNum2 = af._seq + 1;

            fireFakeZclRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), null, fakeZclMsg);
            setTimeout(() => {
                fakeZclMsg.seqNum = seqNum2;
                fakeZclMsg.payload = [ { attrId: 16384, status: 0, dataType: 0, attrData: 10 }, { attrId: 16385, status: 0, dataType: 0, attrData: 110 } ];
                // { attrId, status , dataType, attrData }
                fireFakeZclRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), null, fakeZclMsg);
            }, 20);
        });


        test('zcl good send - 3 rsps', done => {
            af.zclClusterAttrsReq(rmEp1, 6, (err, rsp) => {
                if (!err)
                    done();
            });

            const seqNum1 = af._seq;
            const seqNum2 = af._seq + 1;
            const seqNum3 = af._seq + 2;
            const seqNum4 = af._seq + 3;

            const fakeZclMsg = {
                seqNum: seqNum1,
                frameCntl: {
                    frameType: 0,  // Command acts across the entire profile (foundation)
                    manufSpec: 0,
                    direction: 1,
                    disDefaultRsp: 0
                },
                payload: {
                    discComplete: 0,
                    attrInfos: [ { attrId: 0, dataType: 0 } ]
                }
            };

            fireFakeZclRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), null, fakeZclMsg);

            setTimeout(() => {
                fakeZclMsg.seqNum = seqNum2;
                fakeZclMsg.payload.attrInfos = [ { attrId: 16384, dataType: 0 }, { attrId: 16385, dataType: 0 } ];
                fireFakeZclRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), null, fakeZclMsg);
            }, 20);

            setTimeout(() => {
                fakeZclMsg.seqNum = seqNum3;
                fakeZclMsg.payload.discComplete = 1;
                fakeZclMsg.payload.attrInfos = [ { attrId: 16386, dataType: 0 } ];
                fireFakeZclRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), null, fakeZclMsg);
            }, 40);

            setTimeout(() => {
                fakeZclMsg.seqNum = seqNum4;
                fakeZclMsg.payload = [
                    { attrId: 0, status: 0, dataType: 0, attrData: 'hi' }, { attrId: 16384, status: 0, dataType: 0, attrData: 10 },
                    { attrId: 16385, status: 0, dataType: 0, attrData: 110 }, { attrId: 16386, status: 0, dataType: 0, attrData: 'hello' }
                ];
                // { attrId, status , dataType, attrData }
                fireFakeZclRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), null, fakeZclMsg);
            }, 60);
        });
    });

    describe('#.zclClustersReq', () => {
        test('should resove for sequentially requests', done => {
            const rmEp1GetClusterListStub = jest.spyOn(rmEp1, 'getClusterList').mockReturnValue([ 1, 2, 3, 4, 5 ]);
            const rmEp1GetInClusterListStub = jest.spyOn(rmEp1, 'getInClusterList').mockReturnValue([ 1, 2, 3 ]);
            const rmEp1GetOutClusterListStub = jest.spyOn(rmEp1, 'getOutClusterList').mockReturnValue([ 1, 3, 4, 5 ]);

            const requestStub = jest.spyOn(af, 'zclClusterAttrsReq').mockImplementation((dstEp, cId, callback) => {
                    const deferred = Q.defer();
                    setTimeout(() => {
                        deferred.resolve({
                            x1: { value: 'hello' },
                            x2: { value: 'world' }
                        });
                    }, 10);
                    return deferred.promise.nodeify(callback);
            });

            af.zclClustersReq(rmEp1, (err, data) => {
                rmEp1GetClusterListStub.mockRestore();
                rmEp1GetInClusterListStub.mockRestore();
                rmEp1GetOutClusterListStub.mockRestore();
                requestStub.mockRestore();

                expect(data.genPowerCfg.dir).toBe(3);
                expect(data.genPowerCfg.attrs.x1.value).toBe('hello');
                expect(data.genPowerCfg.attrs.x2.value).toBe('world');

                expect(data.genDeviceTempCfg.dir).toBe(1);
                expect(data.genDeviceTempCfg.attrs.x1.value).toBe('hello');
                expect(data.genDeviceTempCfg.attrs.x2.value).toBe('world');

                expect(data.genIdentify.dir).toBe(3);
                expect(data.genIdentify.attrs.x1.value).toBe('hello');
                expect(data.genIdentify.attrs.x2.value).toBe('world');

                expect(data.genGroups.dir).toBe(2);
                expect(data.genGroups.attrs.x1.value).toBe('hello');
                expect(data.genGroups.attrs.x2.value).toBe('world');

                expect(data.genScenes.dir).toBe(2);
                expect(data.genScenes.attrs.x1.value).toBe('hello');
                expect(data.genScenes.attrs.x2.value).toBe('world');

                done();
            });
        });

       // it('should reject for sequentially requests when receiver bad', function (done) {
       //      var rmEp1GetClusterListStub = jest.spyOn(rmEp1, 'getClusterList').mockReturnValue([ 1, 2, 3, 4, 5 ]),
       //          rmEp1GetInClusterListStub = jest.spyOn(rmEp1, 'getInClusterList').mockReturnValue([ 1, 2, 3 ]),
       //          rmEp1GetOutClusterListStub = jest.spyOn(rmEp1, 'getOutClusterList').mockReturnValue([ 1, 3, 4, 5 ]);

       //      var requestStub = jest.spyOn(af, 'zclClusterAttrsReq').mockImplementation((dstEp, cId, callback) => {
       //              var deferred = Q.defer();
       //              setTimeout(() => {
       //                  if (cId !== 3) {
       //                      deferred.resolve({
       //                          x1: { value: 'hello' },
       //                          x2: { value: 'world' }
       //                      });
       //                  } else {
       //                      deferred.reject(new Error('TEST ERROR'));
       //                  }

       //              }, 10);
       //              return deferred.promise.nodeify(callback);
       //      });

       //      af.zclClustersReq(rmEp1, (err, data) => {
       //          rmEp1GetClusterListStub.mockRestore();
       //          rmEp1GetInClusterListStub.mockRestore();
       //          rmEp1GetOutClusterListStub.mockRestore();
       //          requestStub.mockRestore();

       //          expect(err).toBeTruthy();
       //          done();
       //      });
       // });
    });
});
