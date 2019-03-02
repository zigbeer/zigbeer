'use strict';
const Q = require('q');
const fs = require('fs');
const path = require('path');
const Zive = require('zive');
const Ziee = require('ziee');
const Shepherd = require('../index.js');
const Coord  = require('../lib/model/coord');
const Device  = require('../lib/model/device');

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

describe('Top Level of Tests', () => {
    beforeAll(done => {
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
        beforeAll(() => {
            shepherd = new Shepherd('/dev/ttyUSB0', justDbPath);
        });

        test('should has all correct members after new', () => {
            expect(shepherd._startTime).toBe(0);
            expect(shepherd._enabled).toBe(false);
            expect(Array.isArray(shepherd._zApp)).toBe(true);
            expect(typeof shepherd.controller).toBe('object');
            expect(shepherd.af).toBeNull();
            expect(shepherd._dbPath).toBe(dbPath);
            expect(typeof shepherd._devbox).toBe('object');
        });

        test('should throw if path is not a string', () => {
            expect(() => new Shepherd({}, justDbPath)).toThrowError(TypeError);
            expect(() => new Shepherd([], justDbPath)).toThrowError(TypeError);
            expect(() => new Shepherd(1, justDbPath)).toThrowError(TypeError);
            expect(() => new Shepherd(true, justDbPath)).toThrowError(TypeError);
            expect(() => new Shepherd(NaN, justDbPath)).toThrowError(TypeError);

            expect(() => new Shepherd('xxx', justDbPath)).not.toThrowError(Error);
        });

        test('should throw if opts is given but not an object', () => {
            expect(() => new Shepherd('xxx', [])).toThrowError(TypeError);
            expect(() => new Shepherd('xxx', 1)).toThrowError(TypeError);
            expect(() => new Shepherd('xxx', true)).toThrowError(TypeError);

            expect(() => new Shepherd('xxx', justDbPath)).not.toThrowError(Error);
        });
    });

    describe('Signature Check', () => {
        let shepherd;
        beforeAll(() => {
            shepherd = new Shepherd('/dev/ttyUSB0', { dbPath: `${__dirname}/database/dev.db` });
            shepherd._enabled = true;
        });

        describe('#.reset', () => {
            test('should throw if mode is not a number and not a string', () => {
                expect(() => { shepherd.reset({}); }).toThrowError(TypeError);
                expect(() => { shepherd.reset(true); }).toThrowError(TypeError);
            });
        });

        describe('#.permitJoin', () => {
            test('should throw if time is not a number', () => {
                expect(() => { shepherd.permitJoin({}); }).toThrowError(TypeError);
                expect(() => { shepherd.permitJoin(true); }).toThrowError(TypeError);
            });

            test('should throw if type is given but not a number and not a string', () => {
                expect(() => { shepherd.permitJoin({}); }).toThrowError(TypeError);
                expect(() => { shepherd.permitJoin(true); }).toThrowError(TypeError);
            });
        });

        describe('#.mount', () => {
            test('should throw if zApp is not an object', () => {
                expect(() => { shepherd.mount(true); }).toThrowError(TypeError);
                expect(() => { shepherd.mount('ceed'); }).toThrowError(TypeError);
            });
        });

        describe('#.list', () => {
            test('should throw if ieeeAddrs is not an array of strings', () => {
                expect(() => { shepherd.list({}); }).toThrowError(TypeError);
                expect(() => { shepherd.list(true); }).toThrowError(TypeError);
                expect(() => { shepherd.list([ 'ceed', {} ]); }).toThrowError(TypeError);

                expect(() => { shepherd.list('ceed'); }).not.toThrowError(Error);
                expect(() => { shepherd.list([ 'ceed', 'xxx' ]); }).not.toThrowError(Error);
            });
        });

        describe('#.find', () => {
            test('should throw if addr is not a number and not a string', () => {
                expect(() => { shepherd.find({}, 1); }).toThrowError(TypeError);
                expect(() => { shepherd.find(true, 1); }).toThrowError(TypeError);
            });

            test('should throw if epId is not a number', () => {
                expect(() => { shepherd.find(1, {}); }).toThrowError(TypeError);
                expect(() => { shepherd.find(1, true); }).toThrowError(TypeError);
            });
        });

        describe('#.lqi', () => {
            test('should throw if ieeeAddr is not a string', () => {
                expect(() => { shepherd.lqi({}); }).toThrowError(TypeError);
                expect(() => { shepherd.lqi(true); }).toThrowError(TypeError);
                expect(() => { shepherd.lqi('ceed'); }).not.toThrowError(TypeError);
            });
        });

        describe('#.remove', () => {
            test('should throw if ieeeAddr is not a string', () => {
                expect(() => { shepherd.remove({}); }).toThrowError(TypeError);
                expect(() => { shepherd.remove(true); }).toThrowError(TypeError);
                expect(() => { shepherd.remove('ceed'); }).not.toThrowError(TypeError);
            });
        });
    });

    describe.skip('Functional Check', function () {
        let shepherd;
        beforeAll(() => {
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
            test(
                'should not throw if shepherd is not enabled when permitJoin invoked - shepherd is disabled.',
                done => {
                    shepherd.permitJoin(3).fail(err => {
                        if (err.message === 'Shepherd is not enabled.')
                            done();
                    }).done();
                }
            );

            test(
                'should trigger permitJoin counter and event when permitJoin invoked - shepherd is enabled.',
                done => {
                    shepherd._enabled = true;
                    shepherd.once('permitJoining', joinTime => {
                        shepherd._enabled = false;
                        if (joinTime === 3)
                            done();
                    });
                    shepherd.permitJoin(3);
                }
            );
        });

        describe('#.start', () => {
            this.timeout(6000);

            test('should start ok, _ready and ready should be fired, _enabled,', done => {
                let _readyCbCalled = false;
                let readyCbCalled = false;
                let startCbCalled = false;

                const startStub = jest.spyOn(callback => {
                    const deferred = Q.defer();

                    shepherd._enabled = true;
                    shepherd.controller._coord = coordinator;
                    deferred.resolve();

                    setTimeout(() => {
                        shepherd.emit('_ready');
                    }, 50);

                    return deferred.promise.nodeify(callback);
                }).mockReturnValue(undefined);

                function leave () {
                    if (_readyCbCalled && readyCbCalled && startCbCalled && shepherd._enabled)
                        setTimeout(() => {
                            startStub.mockReturnValue();
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
            test('should get correct info about the shepherd', () => {
                const getNwkInfoStub = jest.spyOn(shepherd.controller, 'getNetInfo').mockReturnValue({
                        state: 'Coordinator',
                        channel: 11,
                        panId: '0x7c71',
                        extPanId: '0xdddddddddddddddd',
                        ieeeAddr: '0x00124b0001709887',
                        nwkAddr: 0,
                        joinTimeLeft: 49
                    });

                const shpInfo = shepherd.info();

                expect(shpInfo.enabled).toBe(true);
                expect(shpInfo.net).toEqual(
                    { state: 'Coordinator', channel: 11, panId: '0x7c71', extPanId: '0xdddddddddddddddd', ieeeAddr: '0x00124b0001709887', nwkAddr: 0 }
                );
                expect(shpInfo.joinTimeLeft).toBe(49);
                getNwkInfoStub.mockReturnValue();
            });
        });

        describe('#.mount', () => {
            test('should mount zApp', done => {
                const coordStub = jest.spyOn(callback => Q({}).nodeify(callback)).mockReturnValue(undefined);

                const syncStub = jest.spyOn((id, callback) => Q({}).nodeify(callback)).mockReturnValue(undefined);

                shepherd.mount(zApp, (err, epId) => {
                    if (!err) {
                        coordStub.mockReturnValue();
                        syncStub.mockReturnValue();
                        done();
                    }
                });
            });
        });

        describe('#.list', () => {
            this.timeout(5000);

            test('should list one devices', done => {
                shepherd._registerDev(dev1).then(() => {
                    const devList = shepherd.list();
                    expect(devList.length).toBe(1);
                    expect(devList[0].type).toBe(1);
                    expect(devList[0].ieeeAddr).toBe('0x00137a00000161f2');
                    expect(devList[0].nwkAddr).toBe(100);
                    expect(devList[0].manufId).toBe(10);
                    expect(devList[0].epList).toEqual([ 1 ]);
                    expect(devList[0].status).toBe('offline');
                    done();
                }).fail(err => {
                    console.log(err);
                }).done();
            });
        });

        describe('#.find', () => {
            test('should find nothing', () => {
                expect(shepherd.find('nothing', 1)).toBeUndefined();
            });
        });

        describe('#.lqi', () => {
            test('should get lqi of the device', done => {
                const requestStub = jest.spyOn((subsys, cmdId, valObj, callback) => {
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
                }).mockReturnValue(undefined);

                shepherd.lqi('0x00137a00000161f2', (err, data) => {
                    if (!err) {
                        expect(data[0].ieeeAddr).toBe('0x0123456789abcdef');
                        expect(data[0].lqi).toBe(123);
                        requestStub.mockReturnValue();
                        done();
                    }
                });
            });
        });

        describe('#.remove', () => {
            test('should remove the device', done => {
                const requestStub = jest.spyOn((subsys, cmdId, valObj, callback) => {
                    const deferred = Q.defer();

                    process.nextTick(() => {
                        deferred.resolve({ srcaddr: 100, status: 0 });
                    });

                    return deferred.promise.nodeify(callback);
                }).mockReturnValue(undefined);

                shepherd.remove('0x00137a00000161f2', err => {
                    if (!err) {
                        requestStub.mockReturnValue();
                        done();
                    }
                });
            });
        });

        describe('#.acceptDevIncoming', () => {
            this.timeout(60000);

            test('should fire incoming message and get a new device', done => {
                const acceptDevIncomingStub = jest.spyOn((devInfo, cb) => {
                    setTimeout(() => {
                        const accepted = true;
                        cb(null, accepted);
                    }, 6000);
                }).mockReturnValue(undefined);

                shepherd.once('ind:incoming', dev => {
                    acceptDevIncomingStub.mockReturnValue();
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

        describe('#.reset', () => {
            this.timeout(20000);
            test('should reset - soft', done => {
                const stopStub = jest.spyOn(callback => {
                        const deferred = Q.defer();
                        deferred.resolve();
                        return deferred.promise.nodeify(callback);
                    }).mockReturnValue(undefined);

                const startStub = jest.spyOn(callback => {
                    const deferred = Q.defer();
                    deferred.resolve();
                    return deferred.promise.nodeify(callback);
                }).mockReturnValue(undefined);

                shepherd.controller.once('SYS:resetInd', () => {
                    setTimeout(() => {
                        stopStub.mockReturnValue();
                        startStub.mockReturnValue();
                        done();
                    }, 100);
                });

                shepherd.reset('soft').done();
            });

            test('should reset - hard', done => {
                const stopStub = jest.spyOn(callback => {
                        const deferred = Q.defer();
                        deferred.resolve();
                        return deferred.promise.nodeify(callback);
                    }).mockReturnValue(undefined);

                const startStub = jest.spyOn(callback => {
                    const deferred = Q.defer();
                    deferred.resolve();
                    return deferred.promise.nodeify(callback);
                }).mockReturnValue(undefined);

                shepherd.controller.once('SYS:resetInd', () => {
                    setTimeout(() => {
                        stopStub.mockReturnValue();
                        startStub.mockReturnValue();
                        done();
                    }, 100);
                });

                shepherd.reset('hard').done();
            });
        });

        describe('#.stop', () => {
            test(
                'should stop ok, permitJoin 0 should be fired, _enabled should be false',
                done => {
                    let joinFired = false;
                    let stopCalled = false;

                    const closeStub = jest.spyOn(callback => {
                        const deferred = Q.defer();

                        deferred.resolve();

                        return deferred.promise.nodeify(callback);
                    }).mockReturnValue(undefined);

                    shepherd.once('permitJoining', joinTime => {
                        joinFired = true;
                        if (joinTime === 0 && !shepherd._enabled && stopCalled && joinFired){
                            closeStub.mockReturnValue();
                            done();
                        }
                    });

                    shepherd.stop(err => {
                        stopCalled = true;
                        if (!err && !shepherd._enabled && stopCalled && joinFired) {
                            closeStub.mockReturnValue();
                            done();
                        }
                    });
                }
            );
        });
    });
});
