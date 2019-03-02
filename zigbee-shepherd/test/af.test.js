'use strict';
const EventEmitter = require('events');
const controller = new EventEmitter();
const sinon = require('sinon');
const expect = require('chai').expect;
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

// af is an inner module, don't have to check all the arguments things
describe('APIs Arguments Check for Throwing Error', () => {
    before(() => {
        af = afConstructor(controller);
    });

    describe('#.send', () => {
        it('should be a function', () => {
            expect(af.send).to.be.a('function');
        });

        it('Throw TypeError if srcEp is not an Endpoint or a Coorpoint', () => {
            expect(() => af.send('x', rmEp1, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(1, rmEp1, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send([], rmEp1, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send({}, rmEp1, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(undefined, rmEp1, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(null, rmEp1, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(NaN, rmEp1, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(new Date(), rmEp1, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(() => {}, rmEp1, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);

            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).not.to.throw(TypeError);
            expect(() => af.send(loEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).not.to.throw(TypeError);

        });

        it('Throw TypeError if dstEp is not an Endpoint or a Coorpoint', () => {
            expect(() => af.send(rmEp1, 'x', 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, 1, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, [], 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, {}, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, undefined, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, null, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, NaN, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, new Date(), 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, () => {}, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);

            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).not.to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp2, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).not.to.throw(TypeError);
            expect(() => af.send(rmEp1, loEp8, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).not.to.throw(TypeError);
        });

        it('Throw TypeError if cluster id is string, but not a valud id', done => {
            af.send(rmEp1, rmEp1, 'x', new Buffer([ 1, 2 ]), { options: 3000 }, err => {
                if (err)
                    done();
            });
        });

        it('Throw TypeError if cluster id is string, but a valud id', done => {
            af.send(rmEp1, rmEp1, 'genAlarms', new Buffer([ 1, 2 ]), { options: 3000 }, err => {
                if (!err)
                    done();
            });

            fireFakeCnf(0, 1, transId);
        });

        it('Throw TypeError if cluster id is not a number', () => {
            expect(() => af.send(rmEp1, rmEp1, {}, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, [], new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, NaN, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, undefined, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, null, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(
                rmEp1,
                rmEp1,
                new Date(),
                new Buffer([ 1, 2 ]),
                { options: 3000 },
                () => {}
            )).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, () => {}, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).not.to.throw(TypeError);
        });

        it('Throw TypeError if rawPayload is not a buffer', () => {
            expect(() => af.send(rmEp1, rmEp1, 3, 'x', { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, [], { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, {}, { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, 311, { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, NaN, { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Date(), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, () => {}, { options: 3000 }, () => {})).to.throw(TypeError);

            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).not.to.throw(TypeError);
        });

        it('if opt is given: should throw if opt.options is not a number', () => {
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { options: 'x' }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { options: [] }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { options: null }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { options: {} }, () => {})).to.throw(TypeError);
            expect(() => af.send(
                rmEp1,
                rmEp1,
                3,
                new Buffer([ 1, 2 ]),
                { options() {} },
                () => {}
            )).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { options: NaN }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).not.to.throw(TypeError);
        });

        it('if opt is given: should throw if opt.radius is not a number', () => {
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { radius: 'x' }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { radius: [] }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { radius: null }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { radius: {} }, () => {})).to.throw(TypeError);
            expect(() => af.send(
                rmEp1,
                rmEp1,
                3,
                new Buffer([ 1, 2 ]),
                { radius() {} },
                () => {}
            )).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { radius: NaN }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { radius: 3000 }, () => {})).not.to.throw(TypeError);
        });

        it('if opt is given: should throw if opt.timeout is not a number', () => {
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 'x' }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: [] }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: null }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: {} }, () => {})).to.throw(TypeError);
            expect(() => af.send(
                rmEp1,
                rmEp1,
                3,
                new Buffer([ 1, 2 ]),
                { timeout() {} },
                () => {}
            )).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: NaN }, () => {})).to.throw(TypeError);
            expect(() => af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, () => {})).not.to.throw(TypeError);
        });
    });

    describe('#.sendExt', () => {
        it('should be a function', () => {
            expect(af.sendExt).to.be.a('function');
        });

        it('Throw TypeError if srcEp is not an Instance of Endpoint or Coordpoint class', () => {
            expect(() => af.sendExt('x', 2, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(1, 2, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt([], 2, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt({}, 2, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(new Date(), 2, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(null, 2, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(undefined, 2, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(NaN, 2, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(() => {}, 2, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);

            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).not.to.throw(TypeError);
        });

        it('Throw TypeError if addrMode is not a number', () => {
            expect(() => af.sendExt(loEp8, 'x', 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, [], 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, {}, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, NaN, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(
                loEp8,
                new Date(),
                3,
                12,
                new Buffer([ 1, 2 ]),
                { options: 3000 },
                () => {}
            )).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, () => {}, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);

            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).not.to.throw(TypeError);
        });

        it('Throw TypeError if dstAddrOrGrpId is not a number for ADDR_16BIT(2)', () => {
            expect(() => af.sendExt(loEp8, 2, [], 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, {}, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, NaN, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(
                loEp8,
                2,
                new Date(),
                12,
                new Buffer([ 1, 2 ]),
                { options: 3000 },
                () => {}
            )).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, () => {}, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 'xxx', 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);

            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).not.to.throw(TypeError);
        });

        it('Throw TypeError if dstAddrOrGrpId is not a number for ADDR_GROUP(1)', () => {
            expect(() => af.sendExt(loEp8, 1, [], 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 1, {}, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 1, NaN, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(
                loEp8,
                1,
                new Date(),
                12,
                new Buffer([ 1, 2 ]),
                { options: 3000 },
                () => {}
            )).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 1, () => {}, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 1, 'xxx', 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);

            expect(() => af.sendExt(loEp8, 1, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).not.to.throw(TypeError);
        });

        it('Throw TypeError if dstAddrOrGrpId is not a string for ADDR_64BIT(1)', () => {
            expect(() => af.sendExt(loEp8, 3, [], 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 3, {}, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 3, NaN, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(
                loEp8,
                3,
                new Date(),
                12,
                new Buffer([ 1, 2 ]),
                { options: 3000 },
                () => {}
            )).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 3, () => {}, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 3, 1234, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);

            expect(() => af.sendExt(loEp8, 3, 'xxx', 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).not.to.throw(TypeError);
        });

        it('Throw TypeError if cluster id is string, but not a valud id', done => {
            af.sendExt(loEp8, 2, 3, 'x', new Buffer([ 1, 2 ]), { options: 3000 }, err => {
                if (err)
                    done();
            });
        });

        it('Throw TypeError if cluster id is string, but a valud id', done => {
            af.sendExt(loEp8, 2, 3, 'genAlarms', new Buffer([ 1, 2 ]), { options: 3000 }, err => {
                if (!err)
                    done();
            });

            fireFakeCnf(0, 8, transId);
        });

        it('Throw TypeError if cluster id is not a number', () => {
            expect(() => af.sendExt(loEp8, 2, 3, {}, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, [], new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, NaN, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, undefined, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, null, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, new Date(), new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, () => {}, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 3, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).not.to.throw(TypeError);
        });

        it('Throw TypeError if rawPayload is not a buffer', () => {
            expect(() => af.sendExt(loEp8, 2, 3, 12, 'x', { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, [], { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, {}, { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, 311, { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, NaN, { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Date(), { options: 3000 }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, () => {}, { options: 3000 }, () => {})).to.throw(TypeError);

            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).not.to.throw(TypeError);
        });

        it('if opt is given: should throw if opt.options is not a number', () => {
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { options: 'x' }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { options: [] }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { options: null }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { options: {} }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(
                loEp8,
                2,
                3,
                12,
                new Buffer([ 1, 2 ]),
                { options() {} },
                () => {}
            )).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { options: NaN }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { options: 3000 }, () => {})).not.to.throw(TypeError);
        });

        it('if opt is given: should throw if opt.radius is not a number', () => {
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { radius: 'x' }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { radius: [] }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { radius: null }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { radius: {} }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(
                loEp8,
                2,
                3,
                12,
                new Buffer([ 1, 2 ]),
                { radius() {} },
                () => {}
            )).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { radius: NaN }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { radius: 3000 }, () => {})).not.to.throw(TypeError);
        });

        it('if opt is given: should throw if opt.timeout is not a number', () => {
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { timeout: 'x' }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { timeout: [] }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { timeout: null }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { timeout: {} }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(
                loEp8,
                2,
                3,
                12,
                new Buffer([ 1, 2 ]),
                { timeout() {} },
                () => {}
            )).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { timeout: NaN }, () => {})).to.throw(TypeError);
            expect(() => af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { timeout: 3000 }, () => {})).not.to.throw(TypeError);
        });
    });

    describe('#.zclFoundation', () => {
        it('Throw TypeError if srcEp is not an Instance of Endpoint or Coordpoint class', () => {
            expect(() => af.zclFoundation(
                'x',
                rmEp1,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                1,
                rmEp1,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                [],
                rmEp1,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                {},
                rmEp1,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                null,
                rmEp1,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                true,
                rmEp1,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                undefined,
                rmEp1,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                new Date(),
                rmEp1,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                () => {},
                rmEp1,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);

            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).not.to.throw(TypeError);
        });

        it('Throw TypeError if dstEp is not an Instance of Endpoint or Coordpoint class', () => {
            expect(() => af.zclFoundation(
                rmEp1,
                'x',
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                1,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                [],
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                {},
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                null,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                true,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                undefined,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                new Date(),
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                () => {},
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);

            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).not.to.throw(TypeError);
        });

        it('Throw TypeError if cId is not a string and not a number', () => {
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                [],
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                {},
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                null,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                undefined,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                NaN,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                false,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                new Date(),
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                () => {},
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);

            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).not.to.throw(TypeError);
        });

        it('Throw TypeError if cmd is not a string and not a number', () => {
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                [],
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                {},
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                null,
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                undefined,
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                NaN,
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                false,
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                new Date(),
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);
            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                () => {},
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).to.throw(TypeError);

            expect(() => af.zclFoundation(
                rmEp1,
                rmEp1,
                3,
                'read',
                [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ],
                () => {}
            )).not.to.throw(TypeError);
        });

        it('Throw TypeError if zclData is with bad type', () => {
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', 'x', () => {})).to.throw(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', null, () => {})).to.throw(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', 3, () => {})).to.throw(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', true, () => {})).to.throw(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', NaN, () => {})).to.throw(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', undefined, () => {})).to.throw(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', () => {}, () => {})).to.throw(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', new Date(), () => {})).to.throw(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', {}, () => {})).to.throw(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', () => {}, () => {})).to.throw(TypeError);

            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], () => {})).not.to.throw(TypeError);
        });

        it('Throw TypeError if cfg is given but not an object', () => {
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], 'x', () => {})).to.throw(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], 1, () => {})).to.throw(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], [], () => {})).to.throw(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], true, () => {})).to.throw(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], () => {}, () => {})).to.throw(TypeError);

            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], NaN, () => {})).not.to.throw(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], null, () => {})).not.to.throw(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], undefined, () => {})).not.to.throw(TypeError);
            expect(() => af.zclFoundation(rmEp1, rmEp1, 3, 'read', [], {}, () => {})).not.to.throw(TypeError);
        });
    });
    describe('#.zclFunctional', () => {
        it('Throw TypeError if srcEp is not an Instance of Endpoint or Coordpoint class', () => {
            expect(() => af.zclFunctional('x', rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(1, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional([], rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional({}, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(null, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(true, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(undefined, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(new Date(), rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(() => {}, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);

            expect(() => af.zclFunctional(rmEp1, rmEp1, 5, 3, { groupid: 1 }, () => {})).not.to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).not.to.throw(TypeError);
        });

        it('Throw TypeError if dstEp is not an Instance of Endpoint or Coordpoint class', () => {
            expect(() => af.zclFunctional(rmEp1, 'x', 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, 1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, [], 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, {}, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, null, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, true, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, undefined, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, new Date(), 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, () => {}, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);

            expect(() => af.zclFunctional(rmEp1, rmEp1, 5, 3, { groupid: 1 }, () => {})).not.to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).not.to.throw(TypeError);
        });

        it('Throw TypeError if cId is not a string and not a number', () => {
            expect(() => af.zclFunctional(rmEp1, rmEp1, [], 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, {}, 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, null, 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, true, 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, undefined, 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, new Date(), 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, () => {}, 'removeAll', { groupid: 1 }, () => {})).to.throw(TypeError);

            expect(() => af.zclFunctional(rmEp1, rmEp1, 5, 3, { groupid: 1 }, () => {})).not.to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).not.to.throw(TypeError);
        });

        it('Throw TypeError if cmd is not a string and not a number', () => {
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', [], { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', {}, { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', null, { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', true, { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', undefined, { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', NaN, { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', new Date(), { groupid: 1 }, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', () => {}, { groupid: 1 }, () => {})).to.throw(TypeError);

            expect(() => af.zclFunctional(rmEp1, rmEp1, 5, 3, { groupid: 1 }, () => {})).not.to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', { groupid: 1 }, () => {})).not.to.throw(TypeError);
        });

        it('Throw TypeError if zclData is with bad type', () => {
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', 'x', () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', null, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', 3, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', true, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', NaN, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', undefined, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', () => {}, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', () => {}, () => {})).to.throw(TypeError);

            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, () => {})).not.to.throw(TypeError);
        });

        it('Throw TypeError if cfg is given but not an object', () => {
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, 'x', () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, 1, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, [], () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, true, () => {})).to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, () => {}, () => {})).to.throw(TypeError);

            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, NaN, () => {})).not.to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, null, () => {})).not.to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, undefined, () => {})).not.to.throw(TypeError);
            expect(() => af.zclFunctional(rmEp1, rmEp1, 'genScenes', 'removeAll', {}, {}, () => {})).not.to.throw(TypeError);
        });
    });

    describe('#.zclClusterAttrIdsReq', () => {
        it('Throw TypeError if dstEp is not an Instance of Endpoint or Coordpoint class', () => {
            expect(() => af.zclClusterAttrIdsReq('x', 'genScenes', () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrIdsReq(1, 'genScenes', () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrIdsReq([], 'genScenes', () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrIdsReq({}, 'genScenes', () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrIdsReq(null, 'genScenes', () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrIdsReq(true, 'genScenes', () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrIdsReq(undefined, 'genScenes', () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrIdsReq(new Date(), 'genScenes', () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrIdsReq(() => {}, 'genScenes', () => {})).to.throw(TypeError);

            expect(() => af.zclClusterAttrIdsReq(rmEp1, 5, () => {})).not.to.throw(TypeError);
            expect(() => af.zclClusterAttrIdsReq(rmEp1, 'genScenes', () => {})).not.to.throw(TypeError);
        });
    
        it('Throw TypeError if cId is not a string or a number', () => {
            expect(() => af.zclClusterAttrIdsReq(rmEp1, [], () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrIdsReq(rmEp1, {}, () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrIdsReq(rmEp1, NaN, () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrIdsReq(rmEp1, null, () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrIdsReq(rmEp1, undefined, () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrIdsReq(rmEp1, true, () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrIdsReq(rmEp1, new Date(), () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrIdsReq(rmEp1, () => {}, () => {})).to.throw(TypeError);

            expect(() => af.zclClusterAttrIdsReq(rmEp1, 5, () => {})).not.to.throw(TypeError);
            expect(() => af.zclClusterAttrIdsReq(rmEp1, 'genScenes', () => {})).not.to.throw(TypeError);
        });
    });

    describe('#.zclClusterAttrsReq', () => {
        it('Throw TypeError if dstEp is not an Instance of Endpoint or Coordpoint class', () => {
            expect(() => af.zclClusterAttrsReq('x', 'genScenes', () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrsReq(1, 'genScenes', () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrsReq([], 'genScenes', () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrsReq({}, 'genScenes', () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrsReq(null, 'genScenes', () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrsReq(true, 'genScenes', () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrsReq(undefined, 'genScenes', () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrsReq(new Date(), 'genScenes', () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrsReq(() => {}, 'genScenes', () => {})).to.throw(TypeError);

            expect(() => af.zclClusterAttrsReq(rmEp1, 5, () => {})).not.to.throw(TypeError);
            expect(() => af.zclClusterAttrsReq(rmEp1, 'genScenes', () => {})).not.to.throw(TypeError);
        });

        it('Throw TypeError if cId is not a string or a number', () => {
            expect(() => af.zclClusterAttrsReq(rmEp1, [], () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrsReq(rmEp1, {}, () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrsReq(rmEp1, NaN, () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrsReq(rmEp1, null, () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrsReq(rmEp1, undefined, () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrsReq(rmEp1, true, () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrsReq(rmEp1, new Date(), () => {})).to.throw(TypeError);
            expect(() => af.zclClusterAttrsReq(rmEp1, () => {}, () => {})).to.throw(TypeError);

            expect(() => af.zclClusterAttrsReq(rmEp1, 5, () => {})).not.to.throw(TypeError);
            expect(() => af.zclClusterAttrsReq(rmEp1, 'genScenes', () => {})).not.to.throw(TypeError);
        });
    });

    describe('#.zclClustersReq', () => {
        it('Throw TypeError if dstEp is not an Instance of Endpoint or Coordpoint class', () => {
            expect(() => af.zclClustersReq('x', () => {})).to.throw(TypeError);
            expect(() => af.zclClustersReq(1, () => {})).to.throw(TypeError);
            expect(() => af.zclClustersReq([], () => {})).to.throw(TypeError);
            expect(() => af.zclClustersReq({}, () => {})).to.throw(TypeError);
            expect(() => af.zclClustersReq(null, () => {})).to.throw(TypeError);
            expect(() => af.zclClustersReq(true, () => {})).to.throw(TypeError);
            expect(() => af.zclClustersReq(undefined, () => {})).to.throw(TypeError);
            expect(() => af.zclClustersReq(new Date(), () => {})).to.throw(TypeError);
            expect(() => af.zclClustersReq(() => {}, () => {})).to.throw(TypeError);

            expect(() => af.zclClustersReq(rmEp1, () => {})).not.to.throw(TypeError);
            expect(() => af.zclClustersReq(rmEp1, () => {})).not.to.throw(TypeError);
        });
    });
});

describe('Module Methods Check', () => {
    before(() => {
        af = afConstructor(controller);
    });

    describe('#.send - by delegator', () => {
        it('if srsp status !== 0, === 1, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 1 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (rsp !== 0 && rsp !== 'SUCCESS')
                    done();
            });

            requestStub.restore();
        });

        it('if srsp status === 0, nothing happen', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (rsp.status === 0)
                    done();
            });
            fireFakeCnf(0, 1, transId);
            requestStub.restore();
        });

        it('if srsp status === SUCCESS, nothing happen', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 'SUCCESS'});
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (rsp.status === 0)
                    done();
            });
            fireFakeCnf(0, 1, transId);
            requestStub.restore();
        });

        it('if areq status === 0xcd, NWK_NO_ROUTE, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (err) {
                    done();
                }
            });

            fireFakeCnf(0xcd, 1, transId);
            requestStub.restore();
        });

        it('if areq status === 0xe9, MAC_NO_ACK, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (err) {
                    done();
                }
            });

            fireFakeCnf(0xe9, 1, transId);
            requestStub.restore();
        });

        it('if areq status === 0xb7, APS_NO_ACK, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (err) {
                    done();
                }
            });

            fireFakeCnf(0xb7, 1, transId);
            requestStub.restore();
        });

        it('if areq status === 0xf0, MAC_TRANSACTION_EXPIRED, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (err) {
                    done();
                }
            });

            fireFakeCnf(0xf0, 1, transId);
            requestStub.restore();
        });

        it('if areq status === 0xANY, UNKNOWN ERROR, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (err) {
                    done();
                }
            });

            fireFakeCnf(0xEE, 1, transId);
            requestStub.restore();
        });

        it('if srsp status === 0, apsAck = 0, resolve successfully', done => {
            af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { options: 0 }, (err, rsp) => {
                if (rsp.status === 0)
                    done();
            });
        });

        it('if srsp status === 0, resolve successfully', done => {
            af.send(rmEp1, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (rsp.status === 0)
                    done();
            });
            fireFakeCnf(0, 1, transId);
        });
    });

    describe('#.send - by local ep 8', () => {
        it('if srsp status !== 0, === 1, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 1 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(loEp8, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (rsp !== 0 && rsp !== 'SUCCESS')
                    done();
            });

            requestStub.restore();
        });

        it('if srsp status === 0, nothing happen', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(loEp8, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (rsp.status === 0)
                    done();
            });
            fireFakeCnf(0, 8, transId);
            requestStub.restore();
        });

        it('if srsp status === SUCCESS, nothing happen', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 'SUCCESS'});
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(loEp8, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (rsp.status === 0)
                    done();
            });
            fireFakeCnf(0, 8, transId);
            requestStub.restore();
        });

        it('if areq status === 0xcd, NWK_NO_ROUTE, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(loEp8, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (err) {
                    done();
                }
            });

            fireFakeCnf(0xcd, 8, transId);
            requestStub.restore();
        });

        it('if areq status === 0xe9, MAC_NO_ACK, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(loEp8, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (err) {
                    done();
                }
            });

            fireFakeCnf(0xe9, 8, transId);
            requestStub.restore();
        });

        it('if areq status === 0xb7, APS_NO_ACK, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(loEp8, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (err) {
                    done();
                }
            });

            fireFakeCnf(0xb7, 8, transId);
            requestStub.restore();
        });

        it('if areq status === 0xf0, MAC_TRANSACTION_EXPIRED, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(loEp8, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (err) {
                    done();
                }
            });

            fireFakeCnf(0xf0, 8, transId);
            requestStub.restore();
        });

        it('if areq status === 0xANY, UNKNOWN ERROR, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.send(loEp8, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (err) {
                    done();
                }
            });

            fireFakeCnf(0xEE, 8, transId);
            requestStub.restore();
        });

        it('if srsp status === 0, apsAck = 0, resolve successfully', done => {
            af.send(loEp8, rmEp1, 3, new Buffer([ 1, 2 ]), { options: 0 }, (err, rsp) => {
                if (rsp.status === 0)
                    done();
            });
        });

        it('if srsp status === 0, resolve successfully', done => {
            af.send(loEp8, rmEp1, 3, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (rsp.status === 0)
                    done();
            });
            fireFakeCnf(0, 8, transId);
        });
    });

    describe('#.sendExt', () => {
        it('if srsp status !== 0, === 1, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 1 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (rsp !== 0 && rsp !== 'SUCCESS')
                    done();
            });

            requestStub.restore();
        });

        it('if srsp status === 0, nothing happen', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (rsp.status === 0)
                    done();
            });

            fireFakeCnf(0, 8, transId);
            requestStub.restore();
        });

        it('if srsp status === SUCCESS, nothing happen', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 'SUCCESS'});
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (rsp.status === 0)
                    done();
            });

            fireFakeCnf(0, 8, transId);
            requestStub.restore();
        });

        it('if areq status === 0xcd, NWK_NO_ROUTE, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (err)
                    done();
            });

            fireFakeCnf(0xcd, 8, transId);
            requestStub.restore();
        });

        it('if areq status === 0xe9, MAC_NO_ACK, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (err)
                    done();
            });

            fireFakeCnf(0xe9, 8, transId);
            requestStub.restore();
        });

        it('if areq status === 0xb7, APS_NO_ACK, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (err)
                    done();
            });

            fireFakeCnf(0xb7, 8, transId);
            requestStub.restore();
        });

        it('if areq status === 0xf0, MAC_TRANSACTION_EXPIRED, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (err)
                    done();
            });

            fireFakeCnf(0xf0, 8, transId);
            requestStub.restore();
        });

        it('if areq status === 0xANY, UNKNOWN ERROR, reject', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();
                    process.nextTick(() => {
                        deferred.resolve({ status: 0 });
                    });
                    return deferred.promise.nodeify(callback);
            });

            af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (err)
                    done();
            });

            fireFakeCnf(0xEE, 8, transId);
            requestStub.restore();
        });

        it('if srsp status === 0, apsAck = 0, resolve successfully', done => {
            af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { options: 0 }, (err, rsp) => {
                if (rsp.status === 0)
                    done();
            });
        });

        it('if srsp status === 0, resolve successfully', done => {
            af.sendExt(loEp8, 2, 3, 12, new Buffer([ 1, 2 ]), { timeout: 3000 }, (err, rsp) => {
                if (rsp.status === 0)
                    done();
            });

            fireFakeCnf(0, 8, transId);
        });
    });

    describe('#.zclFoundation - by delegator', () => {
        it('zcl good send', done => {
            let fakeZclMsg;
            af.zclFoundation(rmEp1, rmEp1, 3, 'read', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], (err, zclMsg) => {
                if (!err && (zclMsg === fakeZclMsg))
                    done();
            });

            fakeZclMsg = {
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

        it('zcl bad send - unkown cId', done => {
            af.zclFoundation(rmEp1, rmEp1, 'xxx', 'read', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], (err, zclMsg) => {
                if (err)
                    done();
            });
        });

        it('zcl bad send - unkown cmd', done => {
            af.zclFoundation(rmEp1, rmEp1, 3, 'read333', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], (err, zclMsg) => {
                if (err)
                    done();
            });
        });
    });

    describe('#.zclFoundation - by loEp8', () => {
        it('zcl good send', done => {
            let fakeZclMsg;
            af.zclFoundation(loEp8, rmEp1, 3, 'read', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], { direction: 0 }, (err, zclMsg) => {
                if (!err && (zclMsg === fakeZclMsg))
                    done();
            });

            fakeZclMsg = {
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

        it('zcl good send - rsp, no listen', done => {
            let fakeZclMsg;
            af.zclFoundation(loEp8, rmEp1, 3, 'readRsp', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], { direction: 1 }, (err, msg) => {
                if (!err && (msg.status === 0))
                    done();
            });

            fireFakeCnf(0, loEp8.getEpId(), transId);
        });

        it('zcl bad send - unkown cId', done => {
            af.zclFoundation(loEp8, rmEp1, 'xxx', 'read', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], (err, zclMsg) => {
                if (err)
                    done();
            });
        });

        it('zcl bad send - unkown cmd', done => {
            af.zclFoundation(loEp8, rmEp1, 3, 'read333', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], (err, zclMsg) => {
                if (err)
                    done();
            });
        });
    });

    describe('#.zclFunctional - by delegator', () => {
        it('zcl good send', done => {
            let fakeZclMsg;

            af.zclFunctional(rmEp1, rmEp1, 5, 'removeAll', { groupid: 1 }, { direction: 0 }, (err, zclMsg) => {
                if (!err && (zclMsg === fakeZclMsg))
                    done();
            });

            fakeZclMsg = {
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

        it('zcl bad send - unkown cId', done => {
            af.zclFunctional(rmEp1, rmEp1, 'xxx', 'removeAll', { groupid: 1 }, { direction: 0 }, (err, zclMsg) => {
                if (err)
                    done();
            });
        });

        it('zcl bad send - unkown cmd', done => {
            af.zclFunctional(rmEp1, rmEp1, 5, 'removeAllxxx', { groupid: 1 }, { direction: 0 }, (err, zclMsg) => {
                if (err)
                    done();
            });
        });
    });

    describe('#.zclFunctional - by loEp8', () => {
        it('zcl good send', done => {
            let fakeZclMsg;

            af.zclFunctional(loEp8, rmEp1, 5, 'removeAll', { groupid: 1 }, { direction: 0 }, (err, zclMsg) => {
                if (!err && (zclMsg === fakeZclMsg))
                    done();
            });

            fakeZclMsg = {
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


        it('zcl good send - rsp, no listen', done => {
            let fakeZclMsg;

            af.zclFunctional(loEp8, rmEp1, 5, 'removeAllRsp', { status: 0, groupid: 1 }, { direction: 1 }, (err, zclMsg) => {
                if (!err )
                    done();
            });

            fireFakeCnf(0, loEp8.getEpId(), transId);
        });

        it('zcl bad send - unkown cId', done => {
            af.zclFunctional(loEp8, rmEp1, 'xxx', 'removeAll', { groupid: 1 }, { direction: 0 }, (err, zclMsg) => {
                if (err)
                    done();
            });
        });

        it('zcl bad send - unkown cmd', done => {
            af.zclFunctional(loEp8, rmEp1, 5, 'removeAllxxx', { groupid: 1 }, { direction: 0 }, (err, zclMsg) => {
                if (err)
                    done();
            });
        });
    });

    describe('#.zclFoundation - by delegator - rawZclRsp', () => {
        it('zcl good send', done => {
            let fakeZclRaw;
            af.zclFoundation(rmEp1, rmEp1, 3, 'read', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], (err, zclMsg) => {
                if (!err)
                    done();
            });

            fakeZclRaw = new Buffer([ 8, af._seq, 0, 10, 10]);
            fireFakeZclRawRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), null, fakeZclRaw);
        });
    });

    describe('#.zclFoundation - by loEp8', () => {
        it('zcl good send', done => {
            let fakeZclRaw;
            af.zclFoundation(loEp8, rmEp1, 3, 'read', [ { attrId: 0 }, { attrId: 1 }, { attrId: 3 } ], { direction: 0 }, (err, zclMsg) => {
                if (!err)
                    done();
            });

            fakeZclRaw = new Buffer([ 8, af._seq, 0, 10, 10]);
            fireFakeZclRawRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), loEp8.getEpId(), fakeZclRaw);
        });
    });

    describe('#.zclFunctional - by delegator', () => {
        it('zcl good send', done => {
            let fakeZclRaw;

            af.zclFunctional(rmEp1, rmEp1, 5, 'removeAll', { groupid: 1 }, { direction: 0 }, (err, zclMsg) => {
                if (!err)
                    done();
            });

            fakeZclRaw = new Buffer([ 9, af._seq, 3, 10, 10, 10]);
            fireFakeZclRawRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), null, fakeZclRaw, 5);
        });
    });

    describe('#.zclFunctional - by loEp8', () => {
        it('zcl good send', done => {
            let fakeZclRaw;

            af.zclFunctional(loEp8, rmEp1, 5, 'removeAll', { groupid: 1 }, { direction: 0 }, (err, zclMsg) => {
                if (!err)
                    done();
            });
            fakeZclRaw = new Buffer([ 9, af._seq, 3, 10, 10, 10]);
            fireFakeZclRawRsp(rmEp1.getNwkAddr(), rmEp1.getEpId(), loEp8.getEpId(), fakeZclRaw, 5);
        });
    });


    describe('#.zclClusterAttrIdsReq', () => {
        it('zcl good send - only 1 rsp', done => {
            let fakeZclMsg;
            af.zclClusterAttrIdsReq(rmEp1, 6, (err, rsp) => {
                if (!err)
                    done();
            });

            fakeZclMsg = {
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


        it('zcl good send - 3 rsps', done => {
            let fakeZclMsg;
            let seqNum1;
            let seqNum2;
            let seqNum3;

            af.zclClusterAttrIdsReq(rmEp1, 6, (err, rsp) => {
                if (!err)
                    done();
            });

            seqNum1 = af._seq;
            seqNum2 = af._seq + 1;
            seqNum3 = af._seq + 2;

            fakeZclMsg = {
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
        it('zcl good send - only 1 rsp', done => {
            let fakeZclMsg;
            af.zclClusterAttrsReq(rmEp1, 6, (err, rsp) => {
                if (!err)
                    done();
            });

            fakeZclMsg = {
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


        it('zcl good send - 3 rsps', done => {
            let fakeZclMsg;
            let seqNum1;
            let seqNum2;
            let seqNum3;
            let seqNum4;

            af.zclClusterAttrsReq(rmEp1, 6, (err, rsp) => {
                if (!err)
                    done();
            });

            seqNum1 = af._seq;
            seqNum2 = af._seq + 1;
            seqNum3 = af._seq + 2;
            seqNum4 = af._seq + 3;

            fakeZclMsg = {
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
       it('should resove for sequentially requests', done => {
           const rmEp1GetClusterListStub = sinon.stub(rmEp1, 'getClusterList').returns([ 1, 2, 3, 4, 5 ]);
           const rmEp1GetInClusterListStub = sinon.stub(rmEp1, 'getInClusterList').returns([ 1, 2, 3 ]);
           const rmEp1GetOutClusterListStub = sinon.stub(rmEp1, 'getOutClusterList').returns([ 1, 3, 4, 5 ]);

           const requestStub = sinon.stub(af, 'zclClusterAttrsReq').callsFake((dstEp, cId, callback) => {
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
               rmEp1GetClusterListStub.restore();
               rmEp1GetInClusterListStub.restore();
               rmEp1GetOutClusterListStub.restore();
               requestStub.restore();

               let good = false;
               if (data.genPowerCfg.dir === 3 && data.genPowerCfg.attrs.x1.value === 'hello' && data.genPowerCfg.attrs.x2.value === 'world' )
                   good = true;

               if (data.genDeviceTempCfg.dir === 1 && data.genDeviceTempCfg.attrs.x1.value === 'hello' && data.genDeviceTempCfg.attrs.x2.value === 'world' )
                   good = good && true;

               if (data.genIdentify.dir === 3 && data.genIdentify.attrs.x1.value === 'hello' && data.genIdentify.attrs.x2.value === 'world' )
                   good = good && true;

               if (data.genGroups.dir === 2 && data.genGroups.attrs.x1.value === 'hello' && data.genGroups.attrs.x2.value === 'world' )
                   good = good && true;

               if (data.genScenes.dir === 2 && data.genScenes.attrs.x1.value === 'hello' && data.genScenes.attrs.x2.value === 'world' )
                   good = good && true;

               if (good)
                   done();
           });
       });

       // it('should reject for sequentially requests when receiver bad', function (done) {
       //      var rmEp1GetClusterListStub = sinon.stub(rmEp1, 'getClusterList').returns([ 1, 2, 3, 4, 5 ]),
       //          rmEp1GetInClusterListStub = sinon.stub(rmEp1, 'getInClusterList').returns([ 1, 2, 3 ]),
       //          rmEp1GetOutClusterListStub = sinon.stub(rmEp1, 'getOutClusterList').returns([ 1, 3, 4, 5 ]);

       //      var requestStub = sinon.stub(af, 'zclClusterAttrsReq', function (dstEp, cId, callback) {
       //              var deferred = Q.defer();
       //              setTimeout(function () {
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

       //      af.zclClustersReq(rmEp1, function (err, data) {
       //          rmEp1GetClusterListStub.restore();
       //          rmEp1GetInClusterListStub.restore();
       //          rmEp1GetOutClusterListStub.restore();
       //          requestStub.restore();

       //          if (err)
       //              done();
       //      });
       // });
    });
});
