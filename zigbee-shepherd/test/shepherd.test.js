'use strict';
const Q = require('q');
const fs = require('fs');
const path = require('path');
const Zive = require('zive');
const Ziee = require('ziee');
const chai = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const expect = chai.expect;
const Shepherd = require('../index.js');
const Coord  = require('../lib/model/coord');
const Device  = require('../lib/model/device');

chai.use(sinonChai);

const coordinator = new Coord({
    type: 0,
    ieeeAddr: '0x00124b00019c2ee9',
    nwkAddr: 0,
    manufId: 10,
    epList: [ 1, 2]
});

const dev1 = new Device({
    type: 1,
    ieeeAddr: '0x00137a00000161f2',
    nwkAddr: 100,
    manufId: 10,
    epList: [ 1 ]
});

const zApp = new Zive({ profId: 0x0104, devId: 6 }, new Ziee());

describe('Top Level of Tests', function () {
    before(done => {
        let unlink1 = false;
        let unlink2 = false;

        fs.stat('./test/database/dev.db', (err, stats) => {
            if (err) {
                fs.stat('./test/database', (err, stats) => {
                    if (err) {
                        fs.mkdir('./test/database', () => {
                            unlink1 = true;
                            if (unlink1 && unlink2)
                                done();
                        });
                    } else {
                        unlink1 = true;
                        if (unlink1 && unlink2)
                            done();
                    }
                });
            } else if (stats.isFile()) {
                fs.unlink(path.resolve('./test/database/dev.db'), () => {
                    unlink1 = true;
                    if (unlink1 && unlink2)
                        done();
                });
            }
        });

        fs.stat('./test/database/dev1.db', (err, stats) => {
            if (err) {
                fs.stat('./test/database', (err, stats) => {
                    if (err) {
                        fs.mkdir('./test/database', () => {
                            unlink2 = true;
                            if (unlink1 && unlink2)
                                done();
                        });
                    } else {
                        unlink2 = true;
                        if (unlink1 && unlink2)
                            done();
                    }
                });
            } else if (stats.isFile()) {
                fs.unlink(path.resolve('./test/database/dev1.db'), () => {
                    unlink2 = true;
                    if (unlink1 && unlink2)
                        done();
                });
            }
        });
    });

    describe('Constructor Check', () => {
        const dbPath = `${__dirname}/database/dev.db`
        const justDbPath = { dbPath }

        let shepherd;
        before(() => {
            shepherd = new Shepherd('/dev/ttyUSB0', justDbPath);
        });

        it('should has all correct members after new', () => {
            expect(shepherd._startTime).to.be.equal(0);
            expect(shepherd._enabled).to.be.false;
            expect(shepherd._zApp).to.be.an('array');
            expect(shepherd.controller).to.be.an('object');
            expect(shepherd.af).to.be.null;
            expect(shepherd._dbPath).to.be.equal(dbPath);
            expect(shepherd._devbox).to.be.an('object');
        });

        it('should throw if path is not a string', () => {
            expect(() => new Shepherd({}, justDbPath)).to.throw(TypeError);
            expect(() => new Shepherd([], justDbPath)).to.throw(TypeError);
            expect(() => new Shepherd(1, justDbPath)).to.throw(TypeError);
            expect(() => new Shepherd(true, justDbPath)).to.throw(TypeError);
            expect(() => new Shepherd(NaN, justDbPath)).to.throw(TypeError);

            expect(() => new Shepherd('xxx', justDbPath)).not.to.throw(Error);
        });

        it('should throw if opts is given but not an object', () => {
            expect(() => new Shepherd('xxx', [])).to.throw(TypeError);
            expect(() => new Shepherd('xxx', 1)).to.throw(TypeError);
            expect(() => new Shepherd('xxx', true)).to.throw(TypeError);

            expect(() => new Shepherd('xxx', justDbPath)).not.to.throw(Error);
        });
    });

    describe('Signature Check', () => {
        let shepherd;
        before(() => {
            shepherd = new Shepherd('/dev/ttyUSB0', { dbPath: `${__dirname}/database/dev.db` });
            shepherd._enabled = true;
        });

        describe('#.reset', () => {
            it('should throw if mode is not a number and not a string', () => {
                expect(() => { shepherd.reset({}); }).to.throw(TypeError);
                expect(() => { shepherd.reset(true); }).to.throw(TypeError);
            });
        });

        describe('#.permitJoin', () => {
            it('should throw if time is not a number', () => {
                expect(() => { shepherd.permitJoin({}); }).to.throw(TypeError);
                expect(() => { shepherd.permitJoin(true); }).to.throw(TypeError);
            });

            it('should throw if type is given but not a number and not a string', () => {
                expect(() => { shepherd.permitJoin({}); }).to.throw(TypeError);
                expect(() => { shepherd.permitJoin(true); }).to.throw(TypeError);
            });
        });

        describe('#.mount', () => {
            it('should throw if zApp is not an object', () => {
                expect(() => { shepherd.mount(true); }).to.throw(TypeError);
                expect(() => { shepherd.mount('ceed'); }).to.throw(TypeError);
            });
        });

        describe('#.list', () => {
            it('should throw if ieeeAddrs is not an array of strings', () => {
                expect(() => { shepherd.list({}); }).to.throw(TypeError);
                expect(() => { shepherd.list(true); }).to.throw(TypeError);
                expect(() => { shepherd.list([ 'ceed', {} ]); }).to.throw(TypeError);

                expect(() => { shepherd.list('ceed'); }).not.to.throw(Error);
                expect(() => { shepherd.list([ 'ceed', 'xxx' ]); }).not.to.throw(Error);
            });
        });

        describe('#.find', () => {
            it('should throw if addr is not a number and not a string', () => {
                expect(() => { shepherd.find({}, 1); }).to.throw(TypeError);
                expect(() => { shepherd.find(true, 1); }).to.throw(TypeError);
            });

            it('should throw if epId is not a number', () => {
                expect(() => { shepherd.find(1, {}); }).to.throw(TypeError);
                expect(() => { shepherd.find(1, true); }).to.throw(TypeError);
            });
        });

        describe('#.lqi', () => {
            it('should throw if ieeeAddr is not a string', () => {
                expect(() => { shepherd.lqi({}); }).to.throw(TypeError);
                expect(() => { shepherd.lqi(true); }).to.throw(TypeError);
                expect(() => { shepherd.lqi('ceed'); }).not.to.throw(TypeError);
            });
        });

        describe('#.remove', () => {
            it('should throw if ieeeAddr is not a string', () => {
                expect(() => { shepherd.remove({}); }).to.throw(TypeError);
                expect(() => { shepherd.remove(true); }).to.throw(TypeError);
                expect(() => { shepherd.remove('ceed'); }).not.to.throw(TypeError);
            });
        });
    });

    describe.skip('Functional Check', function () {
        let shepherd;
        before(() => {
            shepherd = new Shepherd('/dev/ttyUSB0', { dbPath: `${__dirname}/database/dev1.db` });

            shepherd.controller.request = function (subsys, cmdId, valObj, callback) {
                const deferred = Q.defer();

                process.nextTick(() => {
                    deferred.resolve({ status: 0 });
                });

                return deferred.promise.nodeify(callback);
            };
        });

        describe('#.permitJoin', () => {
            it('should not throw if shepherd is not enabled when permitJoin invoked - shepherd is disabled.', done => {
                shepherd.permitJoin(3).fail(err => {
                    if (err.message === 'Shepherd is not enabled.')
                        done();
                }).done();
            });

            it('should trigger permitJoin counter and event when permitJoin invoked - shepherd is enabled.', done => {
                shepherd._enabled = true;
                shepherd.once('permitJoining', joinTime => {
                    shepherd._enabled = false;
                    if (joinTime === 3)
                        done();
                });
                shepherd.permitJoin(3);
            });
        });

        describe('#.start', function () {
            this.timeout(6000);

            it('should start ok, _ready and ready should be fired, _enabled,', done => {
                let _readyCbCalled = false;
                let readyCbCalled = false;
                let startCbCalled = false;

                const startStub = sinon.stub(shepherd, 'start').callsFake(callback => {
                    const deferred = Q.defer();

                    shepherd._enabled = true;
                    shepherd.controller._coord = coordinator;
                    deferred.resolve();

                    setTimeout(() => {
                        shepherd.emit('_ready');
                    }, 50);

                    return deferred.promise.nodeify(callback);
                });

                function leave () {
                    if (_readyCbCalled && readyCbCalled && startCbCalled && shepherd._enabled)
                        setTimeout(() => {
                            startStub.restore();
                            done();
                        }, 200);
                }

                shepherd.once('_ready', () => {
                    _readyCbCalled = true;
                    leave();
                });

                shepherd.once('ready', () => {
                    readyCbCalled = true;
                    leave();
                });

                shepherd.start(err => {
                    startCbCalled = true;
                    leave();
                });
            });
        });

        describe('#.info', () => {
            it('should get correct info about the shepherd', () => {
                const getNwkInfoStub = sinon.stub(shepherd.controller, 'getNetInfo').returns({
                        state: 'Coordinator',
                        channel: 11,
                        panId: '0x7c71',
                        extPanId: '0xdddddddddddddddd',
                        ieeeAddr: '0x00124b0001709887',
                        nwkAddr: 0,
                        joinTimeLeft: 49
                    });

                const shpInfo = shepherd.info();

                expect(shpInfo.enabled).to.be.true;
                expect(shpInfo.net).to.be.deep.equal({ state: 'Coordinator', channel: 11, panId: '0x7c71', extPanId: '0xdddddddddddddddd', ieeeAddr: '0x00124b0001709887', nwkAddr: 0 });
                expect(shpInfo.joinTimeLeft).to.be.equal(49);
                getNwkInfoStub.restore();
            });
        });

        describe('#.mount', () => {
            it('should mount zApp', done => {
                const coordStub = sinon.stub(shepherd.controller.query, 'coordInfo').callsFake(callback => Q({}).nodeify(callback));

                const syncStub = sinon.stub(shepherd._devbox, 'sync').callsFake((id, callback) => Q({}).nodeify(callback));

                shepherd.mount(zApp, (err, epId) => {
                    if (!err) {
                        coordStub.restore();
                        syncStub.restore();
                        done();
                    }
                });
            });
        });

        describe('#.list', function () {
            this.timeout(5000);

            it('should list one devices', done => {
                shepherd._registerDev(dev1).then(() => {
                    const devList = shepherd.list();
                    expect(devList.length).to.be.equal(1);
                    expect(devList[0].type).to.be.equal(1);
                    expect(devList[0].ieeeAddr).to.be.equal('0x00137a00000161f2');
                    expect(devList[0].nwkAddr).to.be.equal(100);
                    expect(devList[0].manufId).to.be.equal(10);
                    expect(devList[0].epList).to.be.deep.equal([ 1 ]);
                    expect(devList[0].status).to.be.equal('offline');
                    done();
                }).fail(err => {
                    console.log(err);
                }).done();
            });
        });

        describe('#.find', () => {
            it('should find nothing', () => {
                expect(shepherd.find('nothing', 1)).to.be.undefined;
            });
        });

        describe('#.lqi', () => {
            it('should get lqi of the device', done => {
                const requestStub = sinon.stub(shepherd.controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();

                    process.nextTick(() => {
                        deferred.resolve({
                            srcaddr: 100,
                            status: 0,
                            neighbortableentries: 1,
                            startindex: 0,
                            neighborlqilistcount: 1,
                            neighborlqilist: [
                                {
                                    extPandId: '0xdddddddddddddddd',
                                    extAddr: '0x0123456789abcdef',
                                    nwkAddr: 200,
                                    deviceType: 1,
                                    rxOnWhenIdle: 0,
                                    relationship: 0,
                                    permitJoin: 0,
                                    depth: 1,
                                    lqi: 123
                                }
                            ]
                        });
                    });

                    return deferred.promise.nodeify(callback);
                });

                shepherd.lqi('0x00137a00000161f2', (err, data) => {
                    if (!err) {
                        expect(data[0].ieeeAddr).to.be.equal('0x0123456789abcdef');
                        expect(data[0].lqi).to.be.equal(123);
                        requestStub.restore();
                        done();
                    }
                });
            });
        });

        describe('#.remove', () => {
            it('should remove the device', done => {
                const requestStub = sinon.stub(shepherd.controller, 'request').callsFake((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();

                    process.nextTick(() => {
                        deferred.resolve({ srcaddr: 100, status: 0 });
                    });

                    return deferred.promise.nodeify(callback);
                });

                shepherd.remove('0x00137a00000161f2', err => {
                    if (!err) {
                        requestStub.restore();
                        done();
                    }
                });
            });
        });

        describe('#.acceptDevIncoming', function () {
            this.timeout(60000);

            it('should fire incoming message and get a new device', done => {
                const acceptDevIncomingStub = sinon.stub(shepherd, 'acceptDevIncoming').callsFake((devInfo, cb) => {
                    setTimeout(() => {
                        const accepted = true;
                        cb(null, accepted);
                    }, 6000);
                });

                shepherd.once('ind:incoming', dev => {
                    acceptDevIncomingStub.restore();
                    if (dev.getIeeeAddr() === '0x00124b000bb55881')
                        done();
                });

                shepherd.controller.emit('ZDO:devIncoming', {
                    type: 1,
                    ieeeAddr: '0x00124b000bb55881',
                    nwkAddr: 100,
                    manufId: 10,
                    epList: [],
                    endpoints: []
                });
            });
        });

        describe('#.reset', function () {
            this.timeout(20000);
            it('should reset - soft', done => {
                const stopStub = sinon.stub(shepherd, 'stop').callsFake(callback => {
                        const deferred = Q.defer();
                        deferred.resolve();
                        return deferred.promise.nodeify(callback);
                    });

                const startStub = sinon.stub(shepherd, 'start').callsFake(callback => {
                    const deferred = Q.defer();
                    deferred.resolve();
                    return deferred.promise.nodeify(callback);
                });

                shepherd.controller.once('SYS:resetInd', () => {
                    setTimeout(() => {
                        stopStub.restore();
                        startStub.restore();
                        done();
                    }, 100);
                });

                shepherd.reset('soft').done();
            });

            it('should reset - hard', done => {
                const stopStub = sinon.stub(shepherd, 'stop').callsFake(callback => {
                        const deferred = Q.defer();
                        deferred.resolve();
                        return deferred.promise.nodeify(callback);
                    });

                const startStub = sinon.stub(shepherd, 'start').callsFake(callback => {
                    const deferred = Q.defer();
                    deferred.resolve();
                    return deferred.promise.nodeify(callback);
                });

                shepherd.controller.once('SYS:resetInd', () => {
                    setTimeout(() => {
                        stopStub.restore();
                        startStub.restore();
                        done();
                    }, 100);
                });

                shepherd.reset('hard').done();
            });
        });

        describe('#.stop', () => {
            it('should stop ok, permitJoin 0 should be fired, _enabled should be false', done => {
                let joinFired = false;
                let stopCalled = false;

                const closeStub = sinon.stub(shepherd.controller, 'close').callsFake(callback => {
                    const deferred = Q.defer();

                    deferred.resolve();

                    return deferred.promise.nodeify(callback);
                });

                shepherd.once('permitJoining', joinTime => {
                    joinFired = true;
                    if (joinTime === 0 && !shepherd._enabled && stopCalled && joinFired){
                        closeStub.restore();
                        done();
                    }
                });

                shepherd.stop(err => {
                    stopCalled = true;
                    if (!err && !shepherd._enabled && stopCalled && joinFired) {
                        closeStub.restore();
                        done();
                    }
                });
            });
        });
    });
});
