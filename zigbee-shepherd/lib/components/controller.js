/* jshint node: true */
'use strict';

const util = require('util');
const EventEmitter = require('events');
const Q = require('q');
const _ = require('busyman');
const znp = require('cc-znp');
const proving = require('proving');
const ZSC = require('zstack-constants');

const debug = {
    shepherd: require('debug')('zigbee-shepherd'),
    init: require('debug')('zigbee-shepherd:init'),
    request: require('debug')('zigbee-shepherd:request'),
    response: require('debug')('zigbee-shepherd:response')
};

const Zdo = require('./zdo');
const query = require('./query');
const bridge = require('./event_bridge.js');
var init = require('../initializers/init_controller');
const nvParams = require('../config/nv_start_options.js');
const Device = require('../model/device');
const Coordpoint = require('../model/coordpoint');

function Controller(shepherd, cfg) {
    // cfg is serial port config
    const self = this;

    let transId = 0;

    EventEmitter.call(this);

    if (!_.isPlainObject(cfg))
        throw new TypeError('cfg should be an object.');

    /***************************************************/
    /*** Protected Members                           ***/
    /***************************************************/
    this._shepherd = shepherd;
    this._coord = null;
    this._znp = znp; // required sometimes
    this._cfg = cfg;
    this._zdo = new Zdo(this);
    this._resetting = false;
    this._spinLock = false;
    this._joinQueue = [];
    this._permitJoinTime = 0;
    this._permitJoinInterval;

    this._net = {
        state: null,
        channel: null,
        panId: null,
        extPanId: null,
        ieeeAddr: null,
        nwkAddr: null,
        joinTimeLeft: 0
    };

    this._firmware = {
        version: null,
        revision: null
    };

    this._joinWaitList = {}

    /***************************************************/
    /*** Public Members                              ***/
    /***************************************************/
    this.query = query(this);

    this.nextTransId = function () {  // zigbee transection id
        if (++transId > 0xff)
            transId = 1;
        return transId;
    };

    this.permitJoinCountdown = function () {
        return self._permitJoinTime -= 1;
    };

    this.isResetting = function () {
        return self._resetting;
    };

    /***************************************************/
    /*** Event Handlers                              ***/
    /***************************************************/
    znp.on('ready', () => {
        init.setupCoord(self).then(() => {
            self.emit('ZNP:INIT');
        }).fail(err => {
            self.emit('ZNP:INIT', err);
            debug.init('Coordinator initialize had an error:', err);
        }).done();
    });

    znp.on('close', () => {
        self.emit('ZNP:CLOSE');
    });

    znp.on('AREQ', msg => {
        bridge._areqEventBridge(self, msg);
    });

    this.on('ZDO:tcDeviceInd', tcData => {
        if(tcData.parentaddr == 0){
            return
        }
        const data = {srcaddr: tcData.nwkaddr, nwkaddr: tcData.nwkaddr, ieeeaddr: tcData.extaddr, capabilities: {}};
        if (self._spinLock) {
            self._joinQueue.push({
                func() {
                    self.endDeviceAnnceHdlr(data);
                },
                ieeeAddr: data.ieeeaddr
            });
        } else {
            self._spinLock = true;
            self.endDeviceAnnceHdlr(data);
        }
    });

    this.on('ZDO:endDeviceAnnceInd', data => {
        debug.shepherd('spinlock:', self._spinLock, self._joinQueue);
        if (self._spinLock) {
            // Check if joinQueue already has this device
            for (let i = 0; i < self._joinQueue.length; i++) {
                if (self._joinQueue[i].ieeeAddr == data.ieeeaddr) {
                    debug.shepherd(`Device: ${self._joinQueue[i].ieeeAddr} already in joinqueue`);
                    return;
                }
            }

            self._joinQueue.push({
                func() {
                    self.endDeviceAnnceHdlr(data);
                },
                ieeeAddr: data.ieeeaddr
            });
        } else {
            self._spinLock = true;
            self.endDeviceAnnceHdlr(data);
        }
    });
}

util.inherits(Controller, EventEmitter);

/*************************************************************************************************/
/*** Public ZigBee Utility APIs                                                                ***/
/*************************************************************************************************/
Controller.prototype.getFirmwareInfo = function () {
    const firmware = _.cloneDeep(this._firmware);

    return firmware;
};

Controller.prototype.getNetInfo = function () {
    const net = _.cloneDeep(this._net);

    if (net.state === ZSC.ZDO.devStates.ZB_COORD)
        net.state = 'Coordinator';

    net.joinTimeLeft = this._permitJoinTime;

    return net;
};

Controller.prototype.setNetInfo = function (netInfo) {
    const self = this;

    _.forEach(netInfo, (val, key) => {
        if (_.has(self._net, key))
            self._net[key] = val;
    });
};

/*************************************************************************************************/
/*** Mandatory Public APIs                                                                     ***/
/*************************************************************************************************/
Controller.prototype.start = function (callback) {
    const self = this;
    const deferred = Q.defer();
    let readyLsn;

    readyLsn = function (err) {
        return err ? deferred.reject(err) : deferred.resolve();
    };

    this.once('ZNP:INIT', readyLsn);

    Q.ninvoke(znp, 'init', this._cfg).fail(err => {
        self.removeListener('ZNP:INIT', readyLsn);
        deferred.reject(err);
    }).done();

    return deferred.promise.nodeify(callback);
};

Controller.prototype.close = function (callback) {
    const self = this;
    const deferred = Q.defer();
    let closeLsn;

    closeLsn = function () {
        deferred.resolve();
    };

    this.once('ZNP:CLOSE', closeLsn);

    Q.ninvoke(znp, 'close').fail(err => {
        self.removeListener('ZNP:CLOSE', closeLsn);
        deferred.reject(err);
    }).done();

    return deferred.promise.nodeify(callback);
};

Controller.prototype.reset = function (mode, callback) {
    const self = this;
    const deferred = Q.defer();
    const startupOption = nvParams.startupOption.value[0];

    proving.stringOrNumber(mode, 'mode should be a number or a string.');

    Q.fcall(() => {
        if (mode === 'soft' || mode === 1) {
            debug.shepherd('Starting a software reset...');
            self._resetting = true;

            return self.request('SYS', 'resetReq', { type: 0x01 });
        } else if (mode === 'hard' || mode === 0) {
            debug.shepherd('Starting a hardware reset...');
            self._resetting = true;

            if (self._nvChanged && startupOption !== 0x02)
                nvParams.startupOption.value[0] = 0x02;

            const steps = [
                function () { return self.request('SYS', 'resetReq', { type: 0x01 }).delay(0); },
                function () { return self.request('SAPI', 'writeConfiguration', nvParams.startupOption).delay(10); },
                function () { return self.request('SYS', 'resetReq', { type: 0x01 }).delay(10); },
                function () { return self.request('SAPI', 'writeConfiguration', nvParams.panId).delay(10); },
                function () { return self.request('SAPI', 'writeConfiguration', nvParams.extPanId).delay(10); },
                function () { return self.request('SAPI', 'writeConfiguration', nvParams.channelList).delay(10); },
                function () { return self.request('SAPI', 'writeConfiguration', nvParams.logicalType).delay(10); },
                function () { return self.request('SAPI', 'writeConfiguration', nvParams.precfgkey).delay(10); },
                function () { return self.request('SAPI', 'writeConfiguration', nvParams.precfgkeysEnable).delay(10); },
                function () { return self.request('SYS', 'osalNvWrite', nvParams.securityMode).delay(10); },
                function () { return self.request('SAPI', 'writeConfiguration', nvParams.zdoDirectCb).delay(10); },
                function () { return self.request('SYS', 'osalNvItemInit', nvParams.znpCfgItem).delay(10).fail(err => // Success, item created and initialized
                err.message === 'rsp error: 9' ? null : Q.reject(err)); },
                function () { return self.request('SYS', 'osalNvWrite', nvParams.znpHasConfigured).delay(10); }
            ];

            return steps.reduce((soFar, fn) => soFar.then(fn), Q(0));
        } else {
            return Q.reject(new Error('Unknown reset mode.'));
        }
    }).then(() => {
        self._resetting = false;
        if (self._nvChanged) {
            nvParams.startupOption.value[0] = startupOption;
            self._nvChanged = false;
            deferred.resolve();
        } else {
            self.once('_reset', err => err ? deferred.reject(err) : deferred.resolve());
            self.emit('SYS:resetInd', '_reset');
        }
    }).fail(err => {
        deferred.reject(err);
    }).done();

    return deferred.promise.nodeify(callback);
};

Controller.prototype.request = function (subsys, cmdId, valObj, callback) {
    const deferred = Q.defer();
    let rspHdlr;

    proving.stringOrNumber(subsys, 'subsys should be a number or a string.');
    proving.stringOrNumber(cmdId, 'cmdId should be a number or a string.');

    if (!_.isPlainObject(valObj) && !_.isArray(valObj))
        throw new TypeError('valObj should be an object or an array.');

    if (_.isString(subsys))
        subsys = subsys.toUpperCase();

    rspHdlr = function (err, rsp) {
        if (subsys !== 'ZDO' && subsys !== 5) {
            if (rsp && rsp.hasOwnProperty('status'))
                debug.request('RSP <-- %s, status: %d', subsys + ':' + cmdId, rsp.status);
            else
                debug.request('RSP <-- %s', subsys + ':' + cmdId);
        }

        if (err)
            deferred.reject(err);
        else if ((subsys !== 'ZDO' && subsys !== 5) && rsp && rsp.hasOwnProperty('status') && rsp.status !== 0)  // unsuccessful
            deferred.reject(new Error('rsp error: ' + rsp.status));
        else
            deferred.resolve(rsp);
    };

    if ((subsys === 'AF' || subsys === 4) && valObj.hasOwnProperty('transid'))
        debug.request('REQ --> %s, transId: %d', subsys + ':' + cmdId, valObj.transid);
    else
        debug.request('REQ --> %s', subsys + ':' + cmdId);

    if (subsys === 'ZDO' || subsys === 5)
        this._zdo.request(cmdId, valObj, rspHdlr);          // use wrapped zdo as the exported api
    else
        znp.request(subsys, cmdId, valObj, rspHdlr);  // SREQ has timeout inside znp

    return deferred.promise.nodeify(callback);
};

Controller.prototype.permitJoin = function (time, type, callback) {
    // time: seconds, 0x00 disable, 0xFF always enable
    // type: 0 (coord) / 1 (all) / router addr if > 1
    const self = this;

    let addrmode;
    let dstaddr;

    proving.number(time, 'time should be a number.');
    proving.stringOrNumber(type, 'type should be a number or a string.');

    return Q.fcall(() => {
        if (type === 0 || type === 'coord') {
            addrmode = 0x02;
            dstaddr = 0x0000;
        } else if (type === 1 || type === 'all') {
            addrmode = 0x0F;
            dstaddr = 0xFFFC;   // all coord and routers
        } else if (typeof type === "number") {
            addrmode = 0x02; // address mode
            dstaddr = type; // router address
        } else {
            return Q.reject(new Error('Not a valid type.'));
        }
    }).then(() => {
        if (time > 0xff || time < 0)
            return Q.reject(new Error('Jointime can only range from  0 to 0xff.'));
        else
            self._permitJoinTime = Math.floor(time);
    }).then(() => self.request(
        'ZDO',
        'mgmtPermitJoinReq',
        { addrmode, dstaddr , duration: time, tcsignificance: 0 }
    )).then(rsp => {
        self.emit('permitJoining', self._permitJoinTime, dstaddr);

        if (time !== 0 && time !== 0xff) {
            clearInterval(self._permitJoinInterval);
            self._permitJoinInterval = setInterval(() => {
                if (self.permitJoinCountdown() === 0)
                    clearInterval(self._permitJoinInterval);
                self.emit('permitJoining', self._permitJoinTime, dstaddr);
            }, 1000);
        }
       return rsp;
    }).nodeify(callback);
};

Controller.prototype.remove = function (dev, cfg, callback) {
    // cfg: { reJoin, rmChildren }
    const self = this;

    let reqArgObj;
    let rmChildren_reJoin = 0x00;

    if (!(dev instanceof Device))
        throw new TypeError('dev should be an instance of Device class.');
    else if (!_.isPlainObject(cfg))
        throw new TypeError('cfg should be an object.');

    cfg.reJoin = cfg.hasOwnProperty('reJoin') ? !!cfg.reJoin : true;               // defaults to true
    cfg.rmChildren = cfg.hasOwnProperty('rmChildren') ? !!cfg.rmChildren : false;  // defaults to false

    rmChildren_reJoin = cfg.reJoin ? (rmChildren_reJoin | 0x01) : rmChildren_reJoin;
    rmChildren_reJoin = cfg.rmChildren ? (rmChildren_reJoin | 0x02) : rmChildren_reJoin;

    reqArgObj = {
        dstaddr: dev.getNwkAddr(),
        deviceaddress: dev.getIeeeAddr(),
        removechildren_rejoin: rmChildren_reJoin
    };

    return this.request('ZDO', 'mgmtLeaveReq', reqArgObj).then(rsp => {
        if (rsp.status !== 0 && rsp.status !== 'SUCCESS')
            return Q.reject(rsp.status);
    }).nodeify(callback);
};

Controller.prototype.registerEp = function (loEp, callback) {
    const self = this;

    if (!(loEp instanceof Coordpoint))
        throw new TypeError('loEp should be an instance of Coordpoint class.');

    return this.request('AF', 'register', makeRegParams(loEp)).then(rsp => rsp).fail(err => err.message === 'rsp error: 184' ? self.reRegisterEp(loEp) : Q.reject(err)).nodeify(callback);
};

Controller.prototype.deregisterEp = function (loEp, callback) {
    const self = this;
    const coordEps = this._coord.endpoints;

    if (!(loEp instanceof Coordpoint))
        throw new TypeError('loEp should be an instance of Coordpoint class.');

    return Q.fcall(() => {
        if (!_.includes(coordEps, loEp))
            return Q.reject(new Error('Endpoint not maintained by Coordinator, cannot be removed.'));
        else
            return self.request('AF', 'delete', { endpoint: loEp.getEpId() });
    }).then(rsp => {
        delete coordEps[loEp.getEpId()];
        return rsp;
    }).nodeify(callback);
};

Controller.prototype.reRegisterEp = function (loEp, callback) {
    const self = this;

    return this.deregisterEp(loEp).then(() => self.request('AF', 'register', makeRegParams(loEp))).nodeify(callback);
};

Controller.prototype.simpleDescReq = function (nwkAddr, ieeeAddr, callback) {
    return this.query.deviceWithEndpoints(nwkAddr, ieeeAddr, callback);
};

Controller.prototype.bind = function (srcEp, cId, dstEpOrGrpId, callback) {
    return this.query.setBindingEntry('bind', srcEp, cId, dstEpOrGrpId, callback, this._shepherd.zclId);
};

Controller.prototype.unbind = function (srcEp, cId, dstEpOrGrpId, callback) {
    return this.query.setBindingEntry('unbind', srcEp, cId, dstEpOrGrpId, callback, this._shepherd.zclId);
};

Controller.prototype.findEndpoint = function (addr, epId) {
    return this._shepherd.find(addr, epId);
};

Controller.prototype.setNvParams = function (net) {
    // net: { panId, extPanId, channelList, precfgkey, precfgkeysEnable, startoptClearState }
    net = net || {};
    proving.object(net, 'opts.net should be an object.');

    _.forEach(net, (val, param) => {
        switch (param) {
            case 'panId':
                proving.number(val, 'net.panId should be a number.');
                nvParams.panId.value = [ val & 0xFF, (val >> 8) & 0xFF ];
                break;
            case 'extPanId':
                if (val && (!_.isArray(val) || val.length !== 8))
                    throw new TypeError('net.extPanId should be an array with 8 uint8 integers.');
                if (val) {
                    nvParams.extPanId.value = val;
                }
                break;
            case 'precfgkey':
                if (!_.isArray(val) || val.length !== 16)
                    throw new TypeError('net.precfgkey should be an array with 16 uint8 integers.');
                nvParams.precfgkey.value = val;
                break;
            case 'precfgkeysEnable':
                proving.boolean(val, 'net.precfgkeysEnable should be a bool.');
                nvParams.precfgkeysEnable.value = val ? [ 0x01 ] : [ 0x00 ];
                break;
            case 'startoptClearState':
                proving.boolean(val, 'net.startoptClearState should be a bool.');
                nvParams.startupOption.value = val ? [ 0x02 ] : [ 0x00 ];
                break;
            case 'channelList':
                proving.array(val, 'net.channelList should be an array.');
                let chList = 0;

                _.forEach(val, ch => {
                    if (ch >= 11 && ch <= 26)
                        chList = chList | ZSC.ZDO.channelMask['CH' + ch];
                });

                nvParams.channelList.value = [ chList & 0xFF, (chList >> 8) & 0xFF, (chList >> 16) & 0xFF, (chList >> 24) & 0xFF ];
                break;
            default:
                throw new TypeError('Unkown argument: ' + param + '.');
        }
    });
};

Controller.prototype.checkNvParams = function (callback) {
    const self = this;
    let steps;

    function bufToArray(buf) {
        const arr = [];

        for (let i = 0; i < buf.length; i += 1) {
            arr.push(buf.readUInt8(i));
        }

        return arr;
    }

    steps = [
        function () { return self.request('SYS', 'osalNvRead', nvParams.znpHasConfigured).delay(10).then(rsp => {
            if (!_.isEqual(bufToArray(rsp.value), nvParams.znpHasConfigured.value)) return Q.reject('reset');
        }); },
        function () { return self.request('SAPI', 'readConfiguration', nvParams.panId).delay(10).then(rsp => {
            if (!_.isEqual(bufToArray(rsp.value), nvParams.panId.value)) return Q.reject('reset');
        }); },
        function () { return self.request('SAPI', 'readConfiguration', nvParams.extPanId).delay(10).then(rsp => {
            if (!_.isEqual(bufToArray(rsp.value), nvParams.extPanId.value)) return Q.reject('reset');
        }); },
        function () { return self.request('SAPI', 'readConfiguration', nvParams.channelList).delay(10).then(rsp => {
            if (!_.isEqual(bufToArray(rsp.value), nvParams.channelList.value)) return Q.reject('reset');
        }); },
        function () { return self.request('SAPI', 'readConfiguration', nvParams.precfgkey).delay(10).then(rsp => {
            if (!_.isEqual(bufToArray(rsp.value), nvParams.precfgkey.value)) return Q.reject('reset');
        }); },
        function () { return self.request('SAPI', 'readConfiguration', nvParams.precfgkeysEnable).delay(10).then(rsp => {
            if (!_.isEqual(bufToArray(rsp.value), nvParams.precfgkeysEnable.value)) return Q.reject('reset');
        }); }
    ];

    return steps.reduce((soFar, fn) => soFar.then(fn), Q(0)).fail(err => {
        if (err === 'reset' || err.message === 'rsp error: 2') {
            self._nvChanged = true;
            debug.init('Non-Volatile memory is changed.');
            return self.reset('hard');
        } else {
            return Q.reject(err);
        }
    }).nodeify(callback);
};

Controller.prototype.checkOnline = function (dev, callback) {
    const self = this;
    const nwkAddr = dev.getNwkAddr();
    const ieeeAddr = dev.getIeeeAddr();
    const deferred = Q.defer();

    Q.fcall(() => self.request('ZDO', 'nodeDescReq', { dstaddr: nwkAddr, nwkaddrofinterest: nwkAddr }).timeout(5000).fail(
        () => self.request('ZDO', 'nodeDescReq', { dstaddr: nwkAddr, nwkaddrofinterest: nwkAddr }).timeout(5000)
    )).then(() => {
        if (dev.status === 'offline') {
            self.emit('ZDO:endDeviceAnnceInd', { srcaddr: nwkAddr, nwkaddr: nwkAddr, ieeeaddr: ieeeAddr, capabilities: {} });
        }
        return deferred.resolve();
    }).fail(err => deferred.reject(err)).done();

    return deferred.promise.nodeify(callback);
};

Controller.prototype.endDeviceAnnceHdlr = function (data) {
    const self = this;
    let joinTimeout;
    const joinEvent = 'ind:incoming' + ':' + data.ieeeaddr;
    const dev = this._shepherd._findDevByAddr(data.ieeeaddr);

    if (dev && dev.status === 'online'){  // Device has already joined, do next item in queue
        debug.shepherd(`Device: ${dev.getIeeeAddr()} already in network`);

        if (self._joinQueue.length) {
            const next = self._joinQueue.shift();

            if (next) {
                debug.shepherd('next item in joinqueue');
                setImmediate(() => {
                    next.func();
                });
            } else {
                debug.shepherd('no next item in joinqueue');
                self._spinLock = false;
            }
        } else {
            self._spinLock = false;
        }

        return;
    }

    joinTimeout = setTimeout(() => {
        if (self.listenerCount(joinEvent)) {
            self.emit(joinEvent, '__timeout__');
            self._shepherd.emit('joining', { type: 'timeout', ieeeAddr: data.ieeeaddr });
        }

        joinTimeout = null;
    }, 30000);

    this.once(joinEvent, () => {
        if (joinTimeout) {
            clearTimeout(joinTimeout);
            joinTimeout = null;
        }

        if (self._joinQueue.length) {
            const next = self._joinQueue.shift();

            if (next){
                setImmediate(() => {
                    next.func();
                });
            } else {
                self._spinLock = false;
            }
        } else {
            self._spinLock = false;
        }
    });

    this._shepherd.emit('joining', { type: 'associating', ieeeAddr: data.ieeeaddr });

    this.simpleDescReq(data.nwkaddr, data.ieeeaddr).then(devInfo => devInfo).fail(() => self.simpleDescReq(data.nwkaddr, data.ieeeaddr)).then(devInfo => {
        // Now that we have the simple description of the device clear joinTimeout
        if (joinTimeout) {
            clearTimeout(joinTimeout);
            joinTimeout = null;
        }

        // Defer a promise to wait for the controller to complete the ZDO:devIncoming event!
        const processIncoming = Q.defer();
        self.emit('ZDO:devIncoming', devInfo, processIncoming.resolve, processIncoming.reject);
        return processIncoming.promise;
    }).then(() => {
        self.emit(joinEvent, '__timeout__');
    }).fail(err => {
        self._shepherd.emit('error', 'Cannot get the Node Descriptor of the Device: ' + data.ieeeaddr + ' ('+err+')');
        self._shepherd.emit('joining', { type: 'error', ieeeAddr: data.ieeeaddr });
        self.emit(joinEvent, '__timeout__');
    }).done();
};

/*************************************************************************************************/
/*** Private Functions                                                                         ***/
/*************************************************************************************************/
function makeRegParams(loEp) {
    return {
        endpoint: loEp.getEpId(),
        appprofid: loEp.getProfId(),
        appdeviceid: loEp.getDevId(),
        appdevver: 0,
        latencyreq: ZSC.AF.networkLatencyReq.NO_LATENCY_REQS,
        appnuminclusters: loEp.inClusterList.length,
        appinclusterlist: loEp.inClusterList,
        appnumoutclusters: loEp.outClusterList.length,
        appoutclusterlist: loEp.outClusterList
    };
}

module.exports = Controller;
