'use strict';
const Q = require('q');
const sinon = require('sinon');
const expect = require('chai').expect;
const EventEmitter = require('events');
const znp = require('cc-znp');
const Device  = require('../lib/model/device');
const Endpoint  = require('../lib/model/endpoint');
const Controller = require('../lib/components/controller');
const Coord  = require('../lib/model/coord');
const Coordpoint  = require('../lib/model/coordpoint');

const zclId = require('zcl-id/dist/legacy');

const remoteDev = new Device({
    type: 1,
    ieeeAddr: '0x123456789abcdef',
    nwkAddr: 100,
    status: 2,
    joinTime: 1469528821,
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
    ieeeAddr: '0x0abcdef123456789',
    nwkAddr: 0,
    status: 2,
    joinTime: 1469528238,
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

describe('Constructor Check', () => {
    it('should has all correct members after new', () => {
        const controller = new Controller({zclId}, { path: '/dev/ttyUSB0' });

        expect(controller._shepherd).to.be.an('object');
        expect(controller._coord).to.be.null;
        expect(controller._zdo).to.be.an('object');
        expect(controller._cfg).to.be.deep.equal({ path: '/dev/ttyUSB0' });
        expect(controller._resetting).to.be.false;
        expect(controller.query).to.be.an('object');

        expect(controller._net).to.be.deep.equal({
            state: null,
            channel: null,
            panId: null,
            extPanId: null,
            ieeeAddr: null,
            nwkAddr: null,
            joinTimeLeft: 0,
        });

        expect(controller.nextTransId).to.be.a('function');
        expect(controller.permitJoinCountdown).to.be.a('function');
        expect(controller.isResetting).to.be.a('function');
    });

    it('should throw if cfg is not an object', () => {
        expect(() => new Controller({}, 'x')).to.throw(TypeError);
        expect(() => new Controller({}, 1)).to.throw(TypeError);
        expect(() => new Controller({}, [])).to.throw(TypeError);
        expect(() => new Controller({}, undefined)).to.throw(TypeError);
        expect(() => new Controller({}, null)).to.throw(TypeError);
        expect(() => new Controller({}, NaN)).to.throw(TypeError);
        expect(() => new Controller({}, true)).to.throw(TypeError);
        expect(() => new Controller({}, new Date())).to.throw(TypeError);
        expect(() => new Controller({}, () => {})).to.throw(TypeError);

        expect(() => new Controller({}, {})).not.to.throw(TypeError);
    });
});

describe('Signature Check', () => {
    const controller = new Controller({zclId}, { path: '/dev/ttyUSB0' });

    controller._coord = coordDev;

    describe('#.reset', () => {
        it('should be a function', () => {
            expect(controller.reset).to.be.a('function');
        });

        it('should throw if mode is not a number and not a string', () => {
            expect(() => controller.reset([], () => {})).to.throw(TypeError);
            expect(() => controller.reset({}, () => {})).to.throw(TypeError);
            expect(() => controller.reset(undefined, () => {})).to.throw(TypeError);
            expect(() => controller.reset(null, () => {})).to.throw(TypeError);
            expect(() => controller.reset(NaN, () => {})).to.throw(TypeError);
            expect(() => controller.reset(true, () => {})).to.throw(TypeError);
            expect(() => controller.reset(new Date(), () => {})).to.throw(TypeError);
            expect(() => controller.reset(() => {}, () => {})).to.throw(TypeError);

            expect(() => controller.reset(1, () => {})).not.to.throw(TypeError);
            expect(() => controller.reset('soft', () => {})).not.to.throw(TypeError);
        });
    });

    describe('#.request', () => {
        it('should be a function', () => {
            expect(controller.request).to.be.a('function');
        });

        it('should throw if subsys is not a number and not a string', () => {
            expect(() => controller.request([], 'ping', {}, () => {})).to.throw(TypeError);
            expect(() => controller.request({}, 'ping', {}, () => {})).to.throw(TypeError);
            expect(() => controller.request(undefined, 'ping', {}, () => {})).to.throw(TypeError);
            expect(() => controller.request(null, 'ping', {}, () => {})).to.throw(TypeError);
            expect(() => controller.request(NaN, 'ping', {}, () => {})).to.throw(TypeError);
            expect(() => controller.request(true, 'ping', {}, () => {})).to.throw(TypeError);
            expect(() => controller.request(new Date(), 'ping', {}, () => {})).to.throw(TypeError);
            expect(() => controller.request(() => {}, 'ping', {}, () => {})).to.throw(TypeError);

            expect(() => controller.request(5, 'ping', {}, () => {})).not.to.throw(TypeError);
            expect(() => controller.request('ZDO', 'ping', {}, () => {})).not.to.throw(TypeError);
        });

        it('should throw if cmdId is not a number and not a string', () => {
            expect(() => controller.request('ZDO', [], {}, () => {})).to.throw(TypeError);
            expect(() => controller.request('ZDO', {}, {}, () => {})).to.throw(TypeError);
            expect(() => controller.request('ZDO', undefined, {}, () => {})).to.throw(TypeError);
            expect(() => controller.request('ZDO', null, {}, () => {})).to.throw(TypeError);
            expect(() => controller.request('ZDO', NaN, {}, () => {})).to.throw(TypeError);
            expect(() => controller.request('ZDO', true, {}, () => {})).to.throw(TypeError);
            expect(() => controller.request('ZDO', new Date(), {}, () => {})).to.throw(TypeError);
            expect(() => controller.request('ZDO', () => {}, {}, () => {})).to.throw(TypeError);

            expect(() => controller.request('ZDO', 10, {}, () => {})).not.to.throw(TypeError);
            expect(() => controller.request('ZDO', 'ping', {}, () => {})).not.to.throw(TypeError);
        });

        it('should throw if valObj is not an object and not an array', () => {
            expect(() => controller.request('ZDO', 'ping', 'x', () => {})).to.throw(TypeError);
            expect(() => controller.request('ZDO', 'ping', 1, () => {})).to.throw(TypeError);
            expect(() => controller.request('ZDO', 'ping', undefined, () => {})).to.throw(TypeError);
            expect(() => controller.request('ZDO', 'ping', null, () => {})).to.throw(TypeError);
            expect(() => controller.request('ZDO', 'ping', NaN, () => {})).to.throw(TypeError);
            expect(() => controller.request('ZDO', 'ping', true, () => {})).to.throw(TypeError);
            expect(() => controller.request('ZDO', 'ping', new Date(), () => {})).to.throw(TypeError);
            expect(() => controller.request('ZDO', 'ping', () => {}, () => {})).to.throw(TypeError);

            expect(() => controller.request('ZDO', 'ping', {}, () => {})).not.to.throw(TypeError);
            expect(() => controller.request('ZDO', 'ping', [], () => {})).not.to.throw(TypeError);
        });
    });

    describe('#.permitJoin', () => {
        it('should be a function', () => {
            expect(controller.permitJoin).to.be.a('function');
        });

        it('should throw if joinTime is not a number', () => {
            expect(() => controller.permitJoin('x', 'coord', () => {})).to.throw(TypeError);
            expect(() => controller.permitJoin([], 'coord', () => {})).to.throw(TypeError);
            expect(() => controller.permitJoin({}, 'coord', () => {})).to.throw(TypeError);
            expect(() => controller.permitJoin(undefined, 'coord', () => {})).to.throw(TypeError);
            expect(() => controller.permitJoin(null, 'coord', () => {})).to.throw(TypeError);
            expect(() => controller.permitJoin(NaN, 'coord', () => {})).to.throw(TypeError);
            expect(() => controller.permitJoin(true, 'coord', () => {})).to.throw(TypeError);
            expect(() => controller.permitJoin(new Date(), 'coord', () => {})).to.throw(TypeError);
            expect(() => controller.permitJoin(() => {}, 'coord', () => {})).to.throw(TypeError);

            expect(() => controller.permitJoin(10, 'coord', () => {})).not.to.throw(TypeError);
        });

        it('should throw if joinType is not a number and not a string', () => {
            expect(() => controller.permitJoin(10, [], () => {})).to.throw(TypeError);
            expect(() => controller.permitJoin(10, {}, () => {})).to.throw(TypeError);
            expect(() => controller.permitJoin(10, undefined, () => {})).to.throw(TypeError);
            expect(() => controller.permitJoin(10, null, () => {})).to.throw(TypeError);
            expect(() => controller.permitJoin(10, NaN, () => {})).to.throw(TypeError);
            expect(() => controller.permitJoin(10, true, () => {})).to.throw(TypeError);
            expect(() => controller.permitJoin(10, new Date(), () => {})).to.throw(TypeError);
            expect(() => controller.permitJoin(10, () => {}, () => {})).to.throw(TypeError);

            expect(() => controller.permitJoin(10, 1, () => {})).not.to.throw(TypeError);
            expect(() => controller.permitJoin(10, 'coord', () => {})).not.to.throw(TypeError);
        });
    });

    describe('#.simpleDescReq', () => {
        it('should be a function', () => {
            expect(controller.simpleDescReq).to.be.a('function');
        });

        it('should throw if nwkAddr is not a number', () => {
            expect(() => controller.simpleDescReq('x', '0x0123456789abcdef', () => {})).to.throw(TypeError);
            expect(() => controller.simpleDescReq([], '0x0123456789abcdef', () => {})).to.throw(TypeError);
            expect(() => controller.simpleDescReq({}, '0x0123456789abcdef', () => {})).to.throw(TypeError);
            expect(() => controller.simpleDescReq(undefined, '0x0123456789abcdef', () => {})).to.throw(TypeError);
            expect(() => controller.simpleDescReq(null, '0x0123456789abcdef', () => {})).to.throw(TypeError);
            expect(() => controller.simpleDescReq(NaN, '0x0123456789abcdef', () => {})).to.throw(TypeError);
            expect(() => controller.simpleDescReq(true, '0x0123456789abcdef', () => {})).to.throw(TypeError);
            expect(() => controller.simpleDescReq(new Date(), '0x0123456789abcdef', () => {})).to.throw(TypeError);
            expect(() => controller.simpleDescReq(() => {}, '0x0123456789abcdef', () => {})).to.throw(TypeError);

            expect(() => controller.simpleDescReq(12345, '0x0123456789abcdef', () => {})).not.to.throw(TypeError);
        });

        it('should throw if ieeeAddr is not a string', () => {
            expect(() => controller.simpleDescReq(12345, 1, () => {})).to.throw(TypeError);
            expect(() => controller.simpleDescReq(12345, [], () => {})).to.throw(TypeError);
            expect(() => controller.simpleDescReq(12345, {}, () => {})).to.throw(TypeError);
            expect(() => controller.simpleDescReq(12345, undefined, () => {})).to.throw(TypeError);
            expect(() => controller.simpleDescReq(12345, null, () => {})).to.throw(TypeError);
            expect(() => controller.simpleDescReq(12345, NaN, () => {})).to.throw(TypeError);
            expect(() => controller.simpleDescReq(12345, true, () => {})).to.throw(TypeError);
            expect(() => controller.simpleDescReq(12345, new Date(), () => {})).to.throw(TypeError);
            expect(() => controller.simpleDescReq(12345, () => {}, () => {})).to.throw(TypeError);

            expect(() => controller.simpleDescReq(12345, '0x0123456789abcdef', () => {})).not.to.throw(TypeError);
        });
    });

    describe('#.registerEp', () => {
        it('should be a function', () => {
            expect(controller.registerEp).to.be.a('function');
        });

        it('should throw if loEp is not a Coorpoint', () => {
            expect(() => controller.registerEp('x', () => {})).to.throw(TypeError);
            expect(() => controller.registerEp(1, () => {})).to.throw(TypeError);
            expect(() => controller.registerEp([], () => {})).to.throw(TypeError);
            expect(() => controller.registerEp({}, () => {})).to.throw(TypeError);
            expect(() => controller.registerEp(undefined, () => {})).to.throw(TypeError);
            expect(() => controller.registerEp(null, () => {})).to.throw(TypeError);
            expect(() => controller.registerEp(NaN, () => {})).to.throw(TypeError);
            expect(() => controller.registerEp(true, () => {})).to.throw(TypeError);
            expect(() => controller.registerEp(new Date(), () => {})).to.throw(TypeError);
            expect(() => controller.registerEp(() => {}, () => {})).to.throw(TypeError);
            expect(() => controller.registerEp(rmEp1, () => {})).to.throw(TypeError);
            expect(() => controller.registerEp(rmEp2, () => {})).to.throw(TypeError);

            expect(() => controller.registerEp(loEp1, () => {})).not.to.throw(TypeError);
            expect(() => controller.registerEp(loEp8, () => {})).not.to.throw(TypeError);
        });
    });

    describe('#.deregisterEp', () => {
        it('should be a function', () => {
            expect(controller.deregisterEp).to.be.a('function');
        });

        it('should throw if loEp is not a Coorpoint', () => {
            expect(() => controller.deregisterEp('x', () => {})).to.throw(TypeError);
            expect(() => controller.deregisterEp(1, () => {})).to.throw(TypeError);
            expect(() => controller.deregisterEp([], () => {})).to.throw(TypeError);
            expect(() => controller.deregisterEp({}, () => {})).to.throw(TypeError);
            expect(() => controller.deregisterEp(undefined, () => {})).to.throw(TypeError);
            expect(() => controller.deregisterEp(null, () => {})).to.throw(TypeError);
            expect(() => controller.deregisterEp(NaN, () => {})).to.throw(TypeError);
            expect(() => controller.deregisterEp(true, () => {})).to.throw(TypeError);
            expect(() => controller.deregisterEp(new Date(), () => {})).to.throw(TypeError);
            expect(() => controller.deregisterEp(() => {}, () => {})).to.throw(TypeError);
            expect(() => controller.deregisterEp(rmEp1, () => {})).to.throw(TypeError);
            expect(() => controller.deregisterEp(rmEp2, () => {})).to.throw(TypeError);

            expect(() => controller.deregisterEp(loEp1, () => {})).not.to.throw(TypeError);
            expect(() => controller.deregisterEp(loEp8, () => {})).not.to.throw(TypeError);
        });
    });

    describe('#.reRegisterEp', () => {
        it('should be a function', () => {
            expect(controller.reRegisterEp).to.be.a('function');
        });

        it('should throw if loEp is not a Coorpoint', () => {
            expect(() => controller.reRegisterEp('x', () => {})).to.throw(TypeError);
            expect(() => controller.reRegisterEp(1, () => {})).to.throw(TypeError);
            expect(() => controller.reRegisterEp([], () => {})).to.throw(TypeError);
            expect(() => controller.reRegisterEp({}, () => {})).to.throw(TypeError);
            expect(() => controller.reRegisterEp(undefined, () => {})).to.throw(TypeError);
            expect(() => controller.reRegisterEp(null, () => {})).to.throw(TypeError);
            expect(() => controller.reRegisterEp(NaN, () => {})).to.throw(TypeError);
            expect(() => controller.reRegisterEp(true, () => {})).to.throw(TypeError);
            expect(() => controller.reRegisterEp(new Date(), () => {})).to.throw(TypeError);
            expect(() => controller.reRegisterEp(() => {}, () => {})).to.throw(TypeError);
            expect(() => controller.reRegisterEp(rmEp1, () => {})).to.throw(TypeError);
            expect(() => controller.reRegisterEp(rmEp2, () => {})).to.throw(TypeError);

            expect(() => controller.reRegisterEp(loEp1, () => {})).not.to.throw(TypeError);
            expect(() => controller.reRegisterEp(loEp8, () => {})).not.to.throw(TypeError);
        });
    });

    describe('#.bind', () => {
        it('should be a function', () => {
            expect(controller.bind).to.be.a('function');
        });

        it('should throw if srcEp is not an Endpoint or a Coorpoint', () => {
            expect(() => controller.bind('x', rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(1, rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind([], rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind({}, rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(undefined, rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(null, rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(NaN, rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(true, rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(new Date(), rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(() => {}, rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
        });

        it('should throw if dstEp is not an Endpoint or a Coorpoint', () => {
            expect(() => controller.bind(loEp1, 'x', 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, 1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, [], 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, {}, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, undefined, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, null, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, NaN, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, true, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, new Date(), 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, () => {}, 'genOnOff', null, () => {})).to.throw(TypeError);
        });

        it('should throw if cId is not a number and not a string', () => {
            expect(() => controller.bind(loEp1, rmEp1, [], null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, {}, null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, undefined, null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, null, null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, NaN, null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, true, null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, new Date(), null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, () => {}, null, () => {})).to.throw(TypeError);
        });

        it('should throw if grpId is not a number', () => {
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', 'x', () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', [], () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', {}, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', undefined, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', NaN, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', true, () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', new Date(), () => {})).to.throw(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', () => {}, () => {})).to.throw(TypeError);
        });
    });

    describe('#.unbind', () => {
        it('should be a function', () => {
            expect(controller.unbind).to.be.a('function');
        });

        it('should throw if srcEp is not an Endpoint or a Coorpoint', () => {
            expect(() => controller.unbind('x', rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(1, rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind([], rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind({}, rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(undefined, rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(null, rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(NaN, rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(true, rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(new Date(), rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(() => {}, rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
        });

        it('should throw if dstEp is not an Endpoint or a Coorpoint', () => {
            expect(() => controller.unbind(loEp1, 'x', 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, 1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, [], 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, {}, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, undefined, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, null, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, NaN, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, true, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, new Date(), 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, () => {}, 'genOnOff', null, () => {})).to.throw(TypeError);
        });

        it('should throw if cId is not a number and not a string', () => {
            expect(() => controller.unbind(loEp1, rmEp1, [], null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, {}, null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, undefined, null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, null, null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, NaN, null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, true, null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, new Date(), null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, () => {}, null, () => {})).to.throw(TypeError);
        });

        it('should throw if grpId is not a number', () => {
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', 'x', () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', [], () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', {}, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', undefined, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', null, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', NaN, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', true, () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', new Date(), () => {})).to.throw(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', () => {}, () => {})).to.throw(TypeError);
        });
    });

    describe('#.remove', () => {
        it('should be a function', () => {
            expect(controller.remove).to.be.a('function');
        });

        it('should throw if dev is not a Device', () => {
            expect(() => controller.remove('x', {}, () => {})).to.throw(TypeError);
            expect(() => controller.remove(1, {}, () => {})).to.throw(TypeError);
            expect(() => controller.remove([], {}, () => {})).to.throw(TypeError);
            expect(() => controller.remove({}, {}, () => {})).to.throw(TypeError);
            expect(() => controller.remove(undefined, {}, () => {})).to.throw(TypeError);
            expect(() => controller.remove(null, {}, () => {})).to.throw(TypeError);
            expect(() => controller.remove(NaN, {}, () => {})).to.throw(TypeError);
            expect(() => controller.remove(true, {}, () => {})).to.throw(TypeError);
            expect(() => controller.remove(new Date(), {}, () => {})).to.throw(TypeError);
            expect(() => controller.remove(() => {}, {}, () => {})).to.throw(TypeError);
        });

        it('should throw if cfg is not an object', () => {
            expect(() => controller.remove(remoteDev, 'x', () => {})).to.throw(TypeError);
            expect(() => controller.remove(remoteDev, 1, () => {})).to.throw(TypeError);
            expect(() => controller.remove(remoteDev, [], () => {})).to.throw(TypeError);
            expect(() => controller.remove(remoteDev, undefined, () => {})).to.throw(TypeError);
            expect(() => controller.remove(remoteDev, null, () => {})).to.throw(TypeError);
            expect(() => controller.remove(remoteDev, NaN, () => {})).to.throw(TypeError);
            expect(() => controller.remove(remoteDev, true, () => {})).to.throw(TypeError);
            expect(() => controller.remove(remoteDev, new Date(), () => {})).to.throw(TypeError);
            expect(() => controller.remove(remoteDev, () => {}, () => {})).to.throw(TypeError);
        });
    });
});

describe('Functional Check', () => {
    let controller;

    before(() => {
        const shepherd = new EventEmitter();

        shepherd._findDevByAddr = function () {
            return;
        };

        shepherd.zclId = zclId;

        controller = new Controller(shepherd, { path: '/dev/ttyACM0' });
        controller._coord = coordDev;
    });

    describe('#.start', () => {
        it('should init znp', done => {
            const initStub = sinon.stub(znp, 'init').callsFake((spCfg, callback) => {
                setImmediate(() => {
                    callback(null);
                    controller.emit('ZNP:INIT');
                });
            });

            controller.start(err => {
                if (!err) {
                    initStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.close', () => {
        it('should close znp', done => {
            const closeStub = sinon.stub(znp, 'close').callsFake(callback => {
                setImmediate(() => {
                    callback(null);
                    controller.emit('ZNP:CLOSE');
                });
            });

            controller.close(err => {
                if (!err) {
                    closeStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.reset', () => {
        it('soft reset', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                const deferred = Q.defer();

                setImmediate(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            });

            controller.once('SYS:resetInd', msg => {
                if (msg === '_reset')
                    controller.emit('_reset');
            });

            controller.reset('soft', err => {
                if (!err) {
                    requestStub.restore();
                    done();
                }
            });
        });

        it('hard reset', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                const deferred = Q.defer();

                setImmediate(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            });

            controller.once('SYS:resetInd', msg => {
                if (msg === '_reset')
                    controller.emit('_reset');
            });

            controller.reset('hard', err => {
                if (!err) {
                    requestStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.request', () => {
        it('request ZDO command', done => {
            const _zdoRequestStub = sinon.stub(controller._zdo, 'request').callsFake((cmdId, valObj, callback) => {
                expect(cmdId).to.be.equal('nodeDescReq');

                setImmediate(() => {
                    callback(null, { status: 0 });
                });
            });

            controller.request('ZDO', 'nodeDescReq', { dstaddr: 100, nwkaddrofinterest: 100 }, err => {
                if (!err) {
                    _zdoRequestStub.restore();
                    done();
                }
            });
        });

        it('request SYS command', done => {
            const _znpRequestStub = sinon.stub(znp, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                expect(subsys).to.be.equal('SYS');
                expect(cmdId).to.be.equal('resetReq');

                setImmediate(() => {
                    callback(null, { status: 0 });
                });
            });

            controller.request('SYS', 'resetReq', { type: 0x01 }, err => {
                if (!err) {
                    _znpRequestStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.permitJoin', () => {
        it('only permit devices join the network through the coordinator', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                const deferred = Q.defer();

                expect(valObj.addrmode).to.be.equal(0x02);
                expect(valObj.dstaddr).to.be.equal(0x0000);

                setImmediate(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            });

            controller.once('permitJoining', permitJoinTime => {
                expect(permitJoinTime).to.be.equal(60);
            });

            controller.permitJoin(60, 'coord', err => {
                if (!err) {
                    requestStub.restore();
                    done();
                }
            });
        });

        it('permit devices join the network through the coordinator or routers', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                const deferred = Q.defer();

                expect(valObj.addrmode).to.be.equal(0x0F);
                expect(valObj.dstaddr).to.be.equal(0xFFFC);

                setImmediate(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            });

            controller.once('permitJoining', permitJoinTime => {
                expect(permitJoinTime).to.be.equal(60);
            });

            controller.permitJoin(60, 'all', err => {
                if (!err) {
                    requestStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.remove', () => {
        it('remove device', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                const deferred = Q.defer();

                expect(valObj.deviceaddress).to.be.equal('0x123456789abcdef');

                setImmediate(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            });

            controller.remove(remoteDev, {}, err => {
                if (!err) {
                    requestStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.registerEp', () => {
        it('register loEp1', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                const deferred = Q.defer();

                expect(cmdId).to.be.equal('register');

                setImmediate(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            });

            controller.registerEp(loEp1, err => {
                if (!err){
                    requestStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.deregisterEp', () => {
        it('delete loEp1', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                const deferred = Q.defer();

                expect(cmdId).to.be.equal('delete');

                setImmediate(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            });

            controller._coord.endpoints[1] = loEp1;

            controller.deregisterEp(loEp1, err => {
                if (!err){
                    requestStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.reRegisterEp', () => {
        it('reRegister loEp1', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                const deferred = Q.defer();

                setImmediate(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            });

            const deregisterEpStub = sinon.stub(controller, 'deregisterEp').callsFake((loEp, callback) => {
                const deferred = Q.defer();

                setImmediate(() => {
                    deferred.resolve();
                });

                return deferred.promise.nodeify(callback);
            });

            controller.reRegisterEp(loEp1, err => {
                if (!err){
                    requestStub.restore();
                    deregisterEpStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.simpleDescReq', () => {
        it('get remoteDev simple description', done => {
            const deviceWithEndpointsStub = sinon.stub(controller.query, 'deviceWithEndpoints').callsFake((nwkAddr, ieeeAddr, callback) => {
                const deferred = Q.defer();

                setImmediate(() => {
                    deferred.resolve({
                        type: 1,
                        ieeeAddr: '0x123456789abcdef',
                        nwkAddr: 100,
                        manufId: 10,
                        epList: [ 1, 2 ]
                    });
                });

                return deferred.promise.nodeify(callback);
            });

            controller.simpleDescReq(10, '0x123456789abcdef', (err, devInfo) => {
                expect(devInfo.ieeeAddr).to.be.equal('0x123456789abcdef');

                if (!err){
                    deviceWithEndpointsStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.bind', () => {
        it('bind loEp1 and rmEp1', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                const deferred = Q.defer();

                expect(cmdId).to.be.equal('bindReq');

                setImmediate(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            });

            controller.bind(loEp1, 'genOnOff', rmEp1, err => {
                if (!err){
                    requestStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.unbind', () => {
        it('unbind loEp1 and rmEp1', done => {
            const requestStub = sinon.stub(controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                const deferred = Q.defer();

                expect(cmdId).to.be.equal('unbindReq');

                setImmediate(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            });

            controller.unbind(loEp1, 'genOnOff', rmEp1, err => {
                if (!err){
                    requestStub.restore();
                    done();
                }
            });
        });
    });

    describe('#.endDeviceAnnceHdlr', () => {
        it('unbind loEp1 and rmEp1', done => {
            const simpleDescReqStub = sinon.stub(controller, 'simpleDescReq').callsFake((nwkAddr, ieeeAddr, callback) => {
                const deferred = Q.defer();

                setImmediate(() => {
                    deferred.resolve({
                        type: 1,
                        nwkaddr: nwkAddr,
                        ieeeaddr: ieeeAddr,
                        manufId: 10,
                        epList: [],
                        endpoints: []
                    });
                });

                return deferred.promise.nodeify(callback);
            });

            let dev_1;
            let dev_2;

            controller.on('ZDO:devIncoming', devInfo => {
                controller.emit('ind:incoming' + ':' + devInfo.ieeeaddr);

                if (devInfo.ieeeaddr === '0x123456789abcdef')
                    dev_1 = true;
                else if (devInfo.ieeeaddr === '0x00124b000159168')
                    dev_2 = true;

                if (dev_1 && dev_2)
                    done();
            });

            controller.emit('ZDO:endDeviceAnnceInd', {
                nwkaddr: 100,
                ieeeaddr: '0x123456789abcdef'
            });
            controller.emit('ZDO:endDeviceAnnceInd', {
                nwkaddr: 200,
                ieeeaddr: '0x00124b000159168'
            });
        });
    });
});
