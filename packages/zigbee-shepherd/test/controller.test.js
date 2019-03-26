'use strict';
const Q = require('q');
const EventEmitter = require('events');
const znp = require('cc-znp').default;
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
    test('should has all correct members after new', () => {
        const controller = new Controller({zclId}, { path: '/dev/ttyUSB0' });

        expect(typeof controller._shepherd).toBe('object');
        expect(controller._coord).toBeNull();
        expect(typeof controller._zdo).toBe('object');
        expect(controller._cfg).toEqual({ path: '/dev/ttyUSB0' });
        expect(controller._resetting).toBe(false);
        expect(typeof controller.query).toBe('object');

        expect(controller._net).toEqual({
            state: null,
            channel: null,
            panId: null,
            extPanId: null,
            ieeeAddr: null,
            nwkAddr: null,
            joinTimeLeft: 0,
        });

        expect(typeof controller.nextTransId).toBe('function');
        expect(typeof controller.permitJoinCountdown).toBe('function');
        expect(typeof controller.isResetting).toBe('function');
    });

    test('should throw if cfg is not an object', () => {
        expect(() => new Controller({}, 'x')).toThrowError(TypeError);
        expect(() => new Controller({}, 1)).toThrowError(TypeError);
        expect(() => new Controller({}, [])).toThrowError(TypeError);
        expect(() => new Controller({}, undefined)).toThrowError(TypeError);
        expect(() => new Controller({}, null)).toThrowError(TypeError);
        expect(() => new Controller({}, NaN)).toThrowError(TypeError);
        expect(() => new Controller({}, true)).toThrowError(TypeError);
        expect(() => new Controller({}, new Date())).toThrowError(TypeError);
        expect(() => new Controller({}, () => {})).toThrowError(TypeError);

        expect(() => new Controller({}, {})).not.toThrowError(TypeError);
    });
});

describe('Signature Check', () => {
    const controller = new Controller({zclId}, { path: '/dev/ttyUSB0' });

    controller._coord = coordDev;

    describe('#.reset', () => {
        test('should be a function', () => {
            expect(typeof controller.reset).toBe('function');
        });

        test('should throw if mode is not a number and not a string', () => {
            expect(() => controller.reset([], () => {})).toThrowError(TypeError);
            expect(() => controller.reset({}, () => {})).toThrowError(TypeError);
            expect(() => controller.reset(undefined, () => {})).toThrowError(TypeError);
            expect(() => controller.reset(null, () => {})).toThrowError(TypeError);
            expect(() => controller.reset(NaN, () => {})).toThrowError(TypeError);
            expect(() => controller.reset(true, () => {})).toThrowError(TypeError);
            expect(() => controller.reset(new Date(), () => {})).toThrowError(TypeError);
            expect(() => controller.reset(() => {}, () => {})).toThrowError(TypeError);

            expect(() => controller.reset(1, () => {})).not.toThrowError(TypeError);
            expect(() => controller.reset('soft', () => {})).not.toThrowError(TypeError);
        });
    });

    describe('#.request', () => {
        test('should be a function', () => {
            expect(typeof controller.request).toBe('function');
        });

        test('should throw if subsys is not a number and not a string', () => {
            expect(() => controller.request([], 'ping', {}, () => {})).toThrowError(TypeError);
            expect(() => controller.request({}, 'ping', {}, () => {})).toThrowError(TypeError);
            expect(() => controller.request(undefined, 'ping', {}, () => {})).toThrowError(TypeError);
            expect(() => controller.request(null, 'ping', {}, () => {})).toThrowError(TypeError);
            expect(() => controller.request(NaN, 'ping', {}, () => {})).toThrowError(TypeError);
            expect(() => controller.request(true, 'ping', {}, () => {})).toThrowError(TypeError);
            expect(() => controller.request(new Date(), 'ping', {}, () => {})).toThrowError(TypeError);
            expect(() => controller.request(() => {}, 'ping', {}, () => {})).toThrowError(TypeError);

            expect(() => controller.request(5, 'ping', {}, () => {})).not.toThrowError(TypeError);
            expect(() => controller.request('ZDO', 'ping', {}, () => {})).not.toThrowError(TypeError);
        });

        test('should throw if cmdId is not a number and not a string', () => {
            expect(() => controller.request('ZDO', [], {}, () => {})).toThrowError(TypeError);
            expect(() => controller.request('ZDO', {}, {}, () => {})).toThrowError(TypeError);
            expect(() => controller.request('ZDO', undefined, {}, () => {})).toThrowError(TypeError);
            expect(() => controller.request('ZDO', null, {}, () => {})).toThrowError(TypeError);
            expect(() => controller.request('ZDO', NaN, {}, () => {})).toThrowError(TypeError);
            expect(() => controller.request('ZDO', true, {}, () => {})).toThrowError(TypeError);
            expect(() => controller.request('ZDO', new Date(), {}, () => {})).toThrowError(TypeError);
            expect(() => controller.request('ZDO', () => {}, {}, () => {})).toThrowError(TypeError);

            expect(() => controller.request('ZDO', 10, {}, () => {})).not.toThrowError(TypeError);
            expect(() => controller.request('ZDO', 'ping', {}, () => {})).not.toThrowError(TypeError);
        });

        test('should throw if valObj is not an object and not an array', () => {
            expect(() => controller.request('ZDO', 'ping', 'x', () => {})).toThrowError(TypeError);
            expect(() => controller.request('ZDO', 'ping', 1, () => {})).toThrowError(TypeError);
            expect(() => controller.request('ZDO', 'ping', undefined, () => {})).toThrowError(TypeError);
            expect(() => controller.request('ZDO', 'ping', null, () => {})).toThrowError(TypeError);
            expect(() => controller.request('ZDO', 'ping', NaN, () => {})).toThrowError(TypeError);
            expect(() => controller.request('ZDO', 'ping', true, () => {})).toThrowError(TypeError);
            expect(() => controller.request('ZDO', 'ping', new Date(), () => {})).toThrowError(TypeError);
            expect(() => controller.request('ZDO', 'ping', () => {}, () => {})).toThrowError(TypeError);

            expect(() => controller.request('ZDO', 'ping', {}, () => {})).not.toThrowError(TypeError);
            expect(() => controller.request('ZDO', 'ping', [], () => {})).not.toThrowError(TypeError);
        });
    });

    describe('#.permitJoin', () => {
        test('should be a function', () => {
            expect(typeof controller.permitJoin).toBe('function');
        });

        test('should throw if joinTime is not a number', () => {
            expect(() => controller.permitJoin('x', 'coord', () => {})).toThrowError(TypeError);
            expect(() => controller.permitJoin([], 'coord', () => {})).toThrowError(TypeError);
            expect(() => controller.permitJoin({}, 'coord', () => {})).toThrowError(TypeError);
            expect(() => controller.permitJoin(undefined, 'coord', () => {})).toThrowError(TypeError);
            expect(() => controller.permitJoin(null, 'coord', () => {})).toThrowError(TypeError);
            expect(() => controller.permitJoin(NaN, 'coord', () => {})).toThrowError(TypeError);
            expect(() => controller.permitJoin(true, 'coord', () => {})).toThrowError(TypeError);
            expect(() => controller.permitJoin(new Date(), 'coord', () => {})).toThrowError(TypeError);
            expect(() => controller.permitJoin(() => {}, 'coord', () => {})).toThrowError(TypeError);

            expect(() => controller.permitJoin(10, 'coord', () => {})).not.toThrowError(TypeError);
        });

        test('should throw if joinType is not a number and not a string', () => {
            expect(() => controller.permitJoin(10, [], () => {})).toThrowError(TypeError);
            expect(() => controller.permitJoin(10, {}, () => {})).toThrowError(TypeError);
            expect(() => controller.permitJoin(10, undefined, () => {})).toThrowError(TypeError);
            expect(() => controller.permitJoin(10, null, () => {})).toThrowError(TypeError);
            expect(() => controller.permitJoin(10, NaN, () => {})).toThrowError(TypeError);
            expect(() => controller.permitJoin(10, true, () => {})).toThrowError(TypeError);
            expect(() => controller.permitJoin(10, new Date(), () => {})).toThrowError(TypeError);
            expect(() => controller.permitJoin(10, () => {}, () => {})).toThrowError(TypeError);

            expect(() => controller.permitJoin(10, 1, () => {})).not.toThrowError(TypeError);
            expect(() => controller.permitJoin(10, 'coord', () => {})).not.toThrowError(TypeError);
        });
    });

    describe('#.simpleDescReq', () => {
        test('should be a function', () => {
            expect(typeof controller.simpleDescReq).toBe('function');
        });

        test('should throw if nwkAddr is not a number', () => {
            expect(() => controller.simpleDescReq('x', '0x0123456789abcdef', () => {})).toThrowError(TypeError);
            expect(() => controller.simpleDescReq([], '0x0123456789abcdef', () => {})).toThrowError(TypeError);
            expect(() => controller.simpleDescReq({}, '0x0123456789abcdef', () => {})).toThrowError(TypeError);
            expect(() => controller.simpleDescReq(undefined, '0x0123456789abcdef', () => {})).toThrowError(TypeError);
            expect(() => controller.simpleDescReq(null, '0x0123456789abcdef', () => {})).toThrowError(TypeError);
            expect(() => controller.simpleDescReq(NaN, '0x0123456789abcdef', () => {})).toThrowError(TypeError);
            expect(() => controller.simpleDescReq(true, '0x0123456789abcdef', () => {})).toThrowError(TypeError);
            expect(() => controller.simpleDescReq(new Date(), '0x0123456789abcdef', () => {})).toThrowError(TypeError);
            expect(() => controller.simpleDescReq(() => {}, '0x0123456789abcdef', () => {})).toThrowError(TypeError);

            expect(() => controller.simpleDescReq(12345, '0x0123456789abcdef', () => {})).not.toThrowError(TypeError);
        });

        test('should throw if ieeeAddr is not a string', () => {
            expect(() => controller.simpleDescReq(12345, 1, () => {})).toThrowError(TypeError);
            expect(() => controller.simpleDescReq(12345, [], () => {})).toThrowError(TypeError);
            expect(() => controller.simpleDescReq(12345, {}, () => {})).toThrowError(TypeError);
            expect(() => controller.simpleDescReq(12345, undefined, () => {})).toThrowError(TypeError);
            expect(() => controller.simpleDescReq(12345, null, () => {})).toThrowError(TypeError);
            expect(() => controller.simpleDescReq(12345, NaN, () => {})).toThrowError(TypeError);
            expect(() => controller.simpleDescReq(12345, true, () => {})).toThrowError(TypeError);
            expect(() => controller.simpleDescReq(12345, new Date(), () => {})).toThrowError(TypeError);
            expect(() => controller.simpleDescReq(12345, () => {}, () => {})).toThrowError(TypeError);

            expect(() => controller.simpleDescReq(12345, '0x0123456789abcdef', () => {})).not.toThrowError(TypeError);
        });
    });

    describe('#.registerEp', () => {
        test('should be a function', () => {
            expect(typeof controller.registerEp).toBe('function');
        });

        test('should throw if loEp is not a Coorpoint', () => {
            expect(() => controller.registerEp('x', () => {})).toThrowError(TypeError);
            expect(() => controller.registerEp(1, () => {})).toThrowError(TypeError);
            expect(() => controller.registerEp([], () => {})).toThrowError(TypeError);
            expect(() => controller.registerEp({}, () => {})).toThrowError(TypeError);
            expect(() => controller.registerEp(undefined, () => {})).toThrowError(TypeError);
            expect(() => controller.registerEp(null, () => {})).toThrowError(TypeError);
            expect(() => controller.registerEp(NaN, () => {})).toThrowError(TypeError);
            expect(() => controller.registerEp(true, () => {})).toThrowError(TypeError);
            expect(() => controller.registerEp(new Date(), () => {})).toThrowError(TypeError);
            expect(() => controller.registerEp(() => {}, () => {})).toThrowError(TypeError);
            expect(() => controller.registerEp(rmEp1, () => {})).toThrowError(TypeError);
            expect(() => controller.registerEp(rmEp2, () => {})).toThrowError(TypeError);

            expect(() => controller.registerEp(loEp1, () => {})).not.toThrowError(TypeError);
            expect(() => controller.registerEp(loEp8, () => {})).not.toThrowError(TypeError);
        });
    });

    describe('#.deregisterEp', () => {
        test('should be a function', () => {
            expect(typeof controller.deregisterEp).toBe('function');
        });

        test('should throw if loEp is not a Coorpoint', () => {
            expect(() => controller.deregisterEp('x', () => {})).toThrowError(TypeError);
            expect(() => controller.deregisterEp(1, () => {})).toThrowError(TypeError);
            expect(() => controller.deregisterEp([], () => {})).toThrowError(TypeError);
            expect(() => controller.deregisterEp({}, () => {})).toThrowError(TypeError);
            expect(() => controller.deregisterEp(undefined, () => {})).toThrowError(TypeError);
            expect(() => controller.deregisterEp(null, () => {})).toThrowError(TypeError);
            expect(() => controller.deregisterEp(NaN, () => {})).toThrowError(TypeError);
            expect(() => controller.deregisterEp(true, () => {})).toThrowError(TypeError);
            expect(() => controller.deregisterEp(new Date(), () => {})).toThrowError(TypeError);
            expect(() => controller.deregisterEp(() => {}, () => {})).toThrowError(TypeError);
            expect(() => controller.deregisterEp(rmEp1, () => {})).toThrowError(TypeError);
            expect(() => controller.deregisterEp(rmEp2, () => {})).toThrowError(TypeError);

            expect(() => controller.deregisterEp(loEp1, () => {})).not.toThrowError(TypeError);
            expect(() => controller.deregisterEp(loEp8, () => {})).not.toThrowError(TypeError);
        });
    });

    describe('#.reRegisterEp', () => {
        test('should be a function', () => {
            expect(typeof controller.reRegisterEp).toBe('function');
        });

        test('should throw if loEp is not a Coorpoint', () => {
            expect(() => controller.reRegisterEp('x', () => {})).toThrowError(TypeError);
            expect(() => controller.reRegisterEp(1, () => {})).toThrowError(TypeError);
            expect(() => controller.reRegisterEp([], () => {})).toThrowError(TypeError);
            expect(() => controller.reRegisterEp({}, () => {})).toThrowError(TypeError);
            expect(() => controller.reRegisterEp(undefined, () => {})).toThrowError(TypeError);
            expect(() => controller.reRegisterEp(null, () => {})).toThrowError(TypeError);
            expect(() => controller.reRegisterEp(NaN, () => {})).toThrowError(TypeError);
            expect(() => controller.reRegisterEp(true, () => {})).toThrowError(TypeError);
            expect(() => controller.reRegisterEp(new Date(), () => {})).toThrowError(TypeError);
            expect(() => controller.reRegisterEp(() => {}, () => {})).toThrowError(TypeError);
            expect(() => controller.reRegisterEp(rmEp1, () => {})).toThrowError(TypeError);
            expect(() => controller.reRegisterEp(rmEp2, () => {})).toThrowError(TypeError);

            expect(() => controller.reRegisterEp(loEp1, () => {})).not.toThrowError(TypeError);
            expect(() => controller.reRegisterEp(loEp8, () => {})).not.toThrowError(TypeError);
        });
    });

    describe('#.bind', () => {
        test('should be a function', () => {
            expect(typeof controller.bind).toBe('function');
        });

        test('should throw if srcEp is not an Endpoint or a Coorpoint', () => {
            expect(() => controller.bind('x', rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(1, rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind([], rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind({}, rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(undefined, rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(null, rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(NaN, rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(true, rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(new Date(), rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(() => {}, rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
        });

        test('should throw if dstEp is not an Endpoint or a Coorpoint', () => {
            expect(() => controller.bind(loEp1, 'x', 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, 1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, [], 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, {}, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, undefined, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, null, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, NaN, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, true, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, new Date(), 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, () => {}, 'genOnOff', null, () => {})).toThrowError(TypeError);
        });

        test('should throw if cId is not a number and not a string', () => {
            expect(() => controller.bind(loEp1, rmEp1, [], null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, {}, null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, undefined, null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, null, null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, NaN, null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, true, null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, new Date(), null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, () => {}, null, () => {})).toThrowError(TypeError);
        });

        test('should throw if grpId is not a number', () => {
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', 'x', () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', [], () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', {}, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', undefined, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', NaN, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', true, () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', new Date(), () => {})).toThrowError(TypeError);
            expect(() => controller.bind(loEp1, rmEp1, 'genOnOff', () => {}, () => {})).toThrowError(TypeError);
        });
    });

    describe('#.unbind', () => {
        test('should be a function', () => {
            expect(typeof controller.unbind).toBe('function');
        });

        test('should throw if srcEp is not an Endpoint or a Coorpoint', () => {
            expect(() => controller.unbind('x', rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(1, rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind([], rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind({}, rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(undefined, rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(null, rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(NaN, rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(true, rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(new Date(), rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(() => {}, rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
        });

        test('should throw if dstEp is not an Endpoint or a Coorpoint', () => {
            expect(() => controller.unbind(loEp1, 'x', 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, 1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, [], 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, {}, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, undefined, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, null, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, NaN, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, true, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, new Date(), 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, () => {}, 'genOnOff', null, () => {})).toThrowError(TypeError);
        });

        test('should throw if cId is not a number and not a string', () => {
            expect(() => controller.unbind(loEp1, rmEp1, [], null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, {}, null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, undefined, null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, null, null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, NaN, null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, true, null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, new Date(), null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, () => {}, null, () => {})).toThrowError(TypeError);
        });

        test('should throw if grpId is not a number', () => {
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', 'x', () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', [], () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', {}, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', undefined, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', null, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', NaN, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', true, () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', new Date(), () => {})).toThrowError(TypeError);
            expect(() => controller.unbind(loEp1, rmEp1, 'genOnOff', () => {}, () => {})).toThrowError(TypeError);
        });
    });

    describe('#.remove', () => {
        test('should be a function', () => {
            expect(typeof controller.remove).toBe('function');
        });

        test('should throw if dev is not a Device', () => {
            expect(() => controller.remove('x', {}, () => {})).toThrowError(TypeError);
            expect(() => controller.remove(1, {}, () => {})).toThrowError(TypeError);
            expect(() => controller.remove([], {}, () => {})).toThrowError(TypeError);
            expect(() => controller.remove({}, {}, () => {})).toThrowError(TypeError);
            expect(() => controller.remove(undefined, {}, () => {})).toThrowError(TypeError);
            expect(() => controller.remove(null, {}, () => {})).toThrowError(TypeError);
            expect(() => controller.remove(NaN, {}, () => {})).toThrowError(TypeError);
            expect(() => controller.remove(true, {}, () => {})).toThrowError(TypeError);
            expect(() => controller.remove(new Date(), {}, () => {})).toThrowError(TypeError);
            expect(() => controller.remove(() => {}, {}, () => {})).toThrowError(TypeError);
        });

        test('should throw if cfg is not an object', () => {
            expect(() => controller.remove(remoteDev, 'x', () => {})).toThrowError(TypeError);
            expect(() => controller.remove(remoteDev, 1, () => {})).toThrowError(TypeError);
            expect(() => controller.remove(remoteDev, [], () => {})).toThrowError(TypeError);
            expect(() => controller.remove(remoteDev, undefined, () => {})).toThrowError(TypeError);
            expect(() => controller.remove(remoteDev, null, () => {})).toThrowError(TypeError);
            expect(() => controller.remove(remoteDev, NaN, () => {})).toThrowError(TypeError);
            expect(() => controller.remove(remoteDev, true, () => {})).toThrowError(TypeError);
            expect(() => controller.remove(remoteDev, new Date(), () => {})).toThrowError(TypeError);
            expect(() => controller.remove(remoteDev, () => {}, () => {})).toThrowError(TypeError);
        });
    });
});

describe('Functional Check', () => {
    let controller;

    beforeAll(() => {
        const shepherd = new EventEmitter();

        shepherd._findDevByAddr = function () {
            return;
        };

        shepherd.zclId = zclId;

        controller = new Controller(shepherd, { path: '/dev/ttyACM0' });
        controller._coord = coordDev;
    });

    describe('#.start', () => {
        test('should init znp', done => {
            const initStub = jest.spyOn(znp, 'init').mockImplementation((spCfg, callback) => {
                setImmediate(() => {
                    callback(null);
                    controller.emit('ZNP:INIT');
                });
            });

            controller.start(err => {
                if (!err) {
                    initStub.mockRestore();
                    done();
                }
            });
        });
    });

    describe('#.close', () => {
        test('should close znp', done => {
            const closeStub = jest.spyOn(znp, 'close').mockImplementation(callback => {
                setImmediate(() => {
                    callback(null);
                    controller.emit('ZNP:CLOSE');
                });
            });

            controller.close(err => {
                if (!err) {
                    closeStub.mockRestore();
                    done();
                }
            });
        });
    });

    describe('#.reset', () => {
        test('soft reset', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
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
                    requestStub.mockRestore();
                    done();
                }
            });
        });

        test('hard reset', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
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
                    requestStub.mockRestore();
                    done();
                }
            });
        });
    });

    describe('#.request', () => {
        test('request ZDO command', done => {
            const _zdoRequestStub = jest.spyOn(controller._zdo, 'request').mockImplementation((cmdId, valObj, callback) => {
                expect(cmdId).toBe('nodeDescReq');

                setImmediate(() => {
                    callback(null, { status: 0 });
                });
            });

            controller.request('ZDO', 'nodeDescReq', { dstaddr: 100, nwkaddrofinterest: 100 }, err => {
                if (!err) {
                    _zdoRequestStub.mockRestore();
                    done();
                }
            });
        });

        test('request SYS command', done => {
            const _znpRequestStub = jest.spyOn(znp, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                expect(subsys).toBe('SYS');
                expect(cmdId).toBe('resetReq');

                setImmediate(() => {
                    callback(null, { status: 0 });
                });
            });

            controller.request('SYS', 'resetReq', { type: 0x01 }, err => {
                if (!err) {
                    _znpRequestStub.mockRestore();
                    done();
                }
            });
        });
    });

    describe('#.permitJoin', () => {
        test('only permit devices join the network through the coordinator', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                const deferred = Q.defer();

                expect(valObj.addrmode).toBe(0x02);
                expect(valObj.dstaddr).toBe(0x0000);

                setImmediate(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            });

            controller.once('permitJoining', permitJoinTime => {
                expect(permitJoinTime).toBe(60);
            });

            controller.permitJoin(60, 'coord', err => {
                if (!err) {
                    requestStub.mockRestore();
                    done();
                }
            });
        });

        test(
            'permit devices join the network through the coordinator or routers',
            done => {
                const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();

                    expect(valObj.addrmode).toBe(0x0F);
                    expect(valObj.dstaddr).toBe(0xFFFC);

                    setImmediate(() => {
                        deferred.resolve({ status: 0 });
                    });

                    return deferred.promise.nodeify(callback);
                });

                controller.once('permitJoining', permitJoinTime => {
                    expect(permitJoinTime).toBe(60);
                });

                controller.permitJoin(60, 'all', err => {
                    if (!err) {
                        requestStub.mockRestore();
                        done();
                    }
                });
            }
        );
    });

    describe('#.remove', () => {
        test('remove device', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                const deferred = Q.defer();

                expect(valObj.deviceaddress).toBe('0x123456789abcdef');

                setImmediate(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            });

            controller.remove(remoteDev, {}, err => {
                if (!err) {
                    requestStub.mockRestore();
                    done();
                }
            });
        });
    });

    describe('#.registerEp', () => {
        test('register loEp1', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                const deferred = Q.defer();

                expect(cmdId).toBe('register');

                setImmediate(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            });

            controller.registerEp(loEp1, err => {
                if (!err){
                    requestStub.mockRestore();
                    done();
                }
            });
        });
    });

    describe('#.deregisterEp', () => {
        test('delete loEp1', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                const deferred = Q.defer();

                expect(cmdId).toBe('delete');

                setImmediate(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            });

            controller._coord.endpoints[1] = loEp1;

            controller.deregisterEp(loEp1, err => {
                if (!err){
                    requestStub.mockRestore();
                    done();
                }
            });
        });
    });

    describe('#.reRegisterEp', () => {
        test('reRegister loEp1', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                const deferred = Q.defer();

                setImmediate(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            });

            const deregisterEpStub = jest.spyOn(controller, 'deregisterEp').mockImplementation((loEp, callback) => {
                const deferred = Q.defer();

                setImmediate(() => {
                    deferred.resolve();
                });

                return deferred.promise.nodeify(callback);
            });

            controller.reRegisterEp(loEp1, err => {
                if (!err){
                    requestStub.mockRestore();
                    deregisterEpStub.mockRestore();
                    done();
                }
            });
        });
    });

    describe('#.simpleDescReq', () => {
        test('get remoteDev simple description', done => {
            const deviceWithEndpointsStub = jest.spyOn(controller.query, 'deviceWithEndpoints').mockImplementation((nwkAddr, ieeeAddr, callback) => {
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
                expect(devInfo.ieeeAddr).toBe('0x123456789abcdef');

                if (!err){
                    deviceWithEndpointsStub.mockRestore();
                    done();
                }
            });
        });
    });

    describe('#.bind', () => {
        test('bind loEp1 and rmEp1', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                const deferred = Q.defer();

                expect(cmdId).toBe('bindReq');

                setImmediate(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            });

            controller.bind(loEp1, 'genOnOff', rmEp1, err => {
                if (!err){
                    requestStub.mockRestore();
                    done();
                }
            });
        });
    });

    describe('#.unbind', () => {
        test('unbind loEp1 and rmEp1', done => {
            const requestStub = jest.spyOn(controller, 'request').mockImplementation((subsys, cmdId, valObj, callback) => {
                const deferred = Q.defer();

                expect(cmdId).toBe('unbindReq');

                setImmediate(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            });

            controller.unbind(loEp1, 'genOnOff', rmEp1, err => {
                if (!err){
                    requestStub.mockRestore();
                    done();
                }
            });
        });
    });

    describe('#.endDeviceAnnceHdlr', () => {
        test('unbind loEp1 and rmEp1', done => {
            const simpleDescReqStub = jest.spyOn(controller, 'simpleDescReq').mockImplementation((nwkAddr, ieeeAddr, callback) => {
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
                controller.emit(`ind:incoming:${devInfo.ieeeaddr}`);

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
