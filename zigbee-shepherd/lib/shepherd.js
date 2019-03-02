/* jshint node: true */
'use strict';

const util = require('util');
const EventEmitter = require('events');
const Q = require('q');
const _ = require('busyman');
const proving = require('proving');
const Objectbox = require('objectbox');
const debug = { shepherd: require('debug')('zigbee-shepherd') };
const init = require('./initializers/init_shepherd');
const zutils = require('./components/zutils');
const Controller = require('./components/controller');
const eventHandlers = require('./components/event_handlers');
const Device = require('./model/device');
const Coordinator = require('./model/coord');
const Group = require('./model/group');
const Coordpoint = require('./model/coordpoint');

/*************************************************************************************************/
/*** ZShepherd Class                                                                           ***/
/*************************************************************************************************/
function ZShepherd(path, opts) {
    // opts: { sp: {}, net: {}, dbPath: 'xxx', zclId: ZclID }
    const self = this;

    const spCfg = {};

    EventEmitter.call(this);

    opts = opts || {};

    proving.string(path, 'path should be a string.');
    proving.object(opts, 'opts should be an object if gieven.');

    spCfg.path = path;
    spCfg.options = opts.hasOwnProperty('sp') ? opts.sp : { baudrate: 115200, rtscts: true };

    /***************************************************/
    /*** Protected Members                           ***/
    /***************************************************/
    this._startTime = 0;
    this._enabled = false;
    this._zApp = [];
    this._mounting = false;
    this._mountQueue = [];
    this.controller = new Controller(this, spCfg);    // controller is the main actor
    this.controller.setNvParams(opts.net);
    this.af = null;
    this.zclId = opts.zclId;

    this._dbPath = opts.dbPath;

    if (!this._dbPath) {    // use default
        throw new Error('dbPath must be specified')
    }

    this._devbox = new Objectbox(this._dbPath);

    this.acceptDevIncoming = function (devInfo, callback) {  // Override at will.
        setImmediate(() => {
            const accepted = true;
            callback(null, accepted);
        });
    };

    /***************************************************/
    /*** Event Handlers (Ind Event Bridges)          ***/
    /***************************************************/
    eventHandlers.attachEventHandlers(this);

    this.controller.on('permitJoining', time => {
        self.emit('permitJoining', time);
    });

    this.on('_ready', () => {
        self._startTime = Math.floor(Date.now()/1000);
        setImmediate(() => {
            self.emit('ready');
        });
    });

    this.on('ind:incoming', dev => {
        const endpoints = [];

        _.forEach(dev.epList, epId => {
            endpoints.push(dev.getEndpoint(epId));
        });

        self.emit('ind', { type: 'devIncoming', endpoints: endpoints, data: dev.getIeeeAddr() });
    });

    this.on('ind:interview', (dev, status) => {
        self.emit('ind', { type: 'devInterview', status: status, data: dev });
    });

    this.on('ind:leaving', (epList, ieeeAddr) => {
        self.emit('ind', { type: 'devLeaving', endpoints: epList, data: ieeeAddr });
    });

    this.on('ind:changed', (ep, notifData) => {
        self.emit('ind', { type: 'devChange', endpoints: [ ep ], data: notifData });
    });

    this.on('ind:cmd', (ep, cId, payload, cmdId, msg) => {
        const cIdString = self.zclId.cluster(cId);
        const type = `cmd${cmdId.charAt(0).toUpperCase() + cmdId.substr(1)}`;
        const notifData = {};

        notifData.cid = cIdString ? cIdString.key : cId;
        notifData.data = payload;

        self.emit('ind', { type: type, endpoints: [ ep ], data: notifData, linkquality: msg.linkquality });
    });

    this.on('ind:statusChange', (ep, cId, payload, msg) => {
        let cIdString = self.zclId.cluster(cId);

        const notifData = {
            cid: '',
            zoneStatus: null
        };

        cIdString = cIdString ? cIdString.key : cId;
        notifData.cid = cIdString;
        notifData.zoneStatus = payload.zonestatus;

        self.emit('ind', { type: 'statusChange', endpoints: [ ep ], data: notifData, linkquality: msg.linkquality });
    });

    this.on('ind:reported', (ep, cId, attrs, msg) => {
        let cIdString = self.zclId.cluster(cId);

        const notifData = {
            cid: '',
            data: {}
        };

        self._updateFinalizer(ep, cId, attrs, true);

        cIdString = cIdString ? cIdString.key : cId;
        notifData.cid = cIdString;

        _.forEach(attrs, rec => {  // { attrId, dataType, attrData }
            let attrIdString = self.zclId.attr(cIdString, rec.attrId);
            attrIdString = attrIdString ? attrIdString.key : rec.attrId;

            notifData.data[attrIdString] = rec.attrData;
        });

        self.emit('ind', { type: 'attReport', endpoints: [ ep ], data: notifData, linkquality: msg.linkquality });
    });

    this.on('ind:status', (dev, status) => {
        const endpoints = [];

        _.forEach(dev.epList, epId => {
            endpoints.push(dev.getEndpoint(epId));
        });

        self.emit('ind', { type: 'devStatus', endpoints: endpoints, data: status });
    });
}

util.inherits(ZShepherd, EventEmitter);

/*************************************************************************************************/
/*** Public Methods                                                                            ***/
/*************************************************************************************************/
ZShepherd.prototype.start = function (callback) {
    const self = this;

    return init.setupShepherd(this).then(() => {
        self._enabled = true;   // shepherd is enabled
        self.emit('_ready');    // if all done, shepherd fires '_ready' event for inner use
        debug.shepherd('zigbee-shepherd is _ready and _enabled');
    }).nodeify(callback);
};

ZShepherd.prototype.stop = function (callback) {
    const self = this;
    const devbox = this._devbox;
    debug.shepherd('zigbee-shepherd is stopping.');

    return Q.fcall(() => {
        if (self._enabled) {
            self.permitJoin(0x00, 'all');
            _.forEach(devbox.exportAllIds(), id => {
                devbox.removeElement(id);
            });
            return self.controller.close();
        }
    }).then(() => {
        self._enabled = false;
        self._zApp = null;
        self._zApp = [];
        debug.shepherd('zigbee-shepherd is stopped.');
    }).nodeify(callback);
};

ZShepherd.prototype.reset = function (mode, callback) {
    const self = this;
    const devbox = this._devbox;
    const removeDevs = [];

    proving.stringOrNumber(mode, 'mode should be a number or a string.');

    if (mode === 'hard' || mode === 0) {
        // clear database
        if (devbox) {
            _.forEach(devbox.exportAllIds(), id => {
                removeDevs.push(Q.ninvoke(devbox, 'remove', id));
            });

            Q.all(removeDevs).then(() => {
                if (devbox.isEmpty())
                    debug.shepherd('Database cleared.');
                else
                    debug.shepherd('Database not cleared.');
            }).fail(err => {
                debug.shepherd(err);
            }).done();
        } else {
            self._devbox = new Objectbox(this._dbPath);
        }
    }

    return this.controller.reset(mode, callback);
};

ZShepherd.prototype.permitJoin = function (time, type, callback) {
    if (_.isFunction(type) && !_.isFunction(callback)) {
        callback = type;
        type = 'all';
    } else {
        type = type || 'all';
    }

    if (!this._enabled)
        return Q.reject(new Error('Shepherd is not enabled.')).nodeify(callback);
    else
        return this.controller.permitJoin(time, type, callback);
};

ZShepherd.prototype.info = function () {
    const net = this.controller.getNetInfo();
    const firmware = this.controller.getFirmwareInfo();

    return {
        enabled: this._enabled,
        net: {
            state: net.state,
            channel: net.channel,
            panId: net.panId,
            extPanId: net.extPanId,
            ieeeAddr: net.ieeeAddr,
            nwkAddr: net.nwkAddr,
        },
        firmware: firmware,
        startTime: this._startTime,
        joinTimeLeft: net.joinTimeLeft
    };
};

ZShepherd.prototype.mount = function (zApp, callback) {
    const self = this;
    const deferred = (callback && Q.isPromise(callback.promise)) ? callback : Q.defer();
    const coord = this.controller._coord;
    let mountId;
    let loEp;

    if (zApp.constructor.name !== 'Zive')
        throw new TypeError('zApp should be an instance of Zive class.');

    if (this._mounting) {
        this._mountQueue.push(() => {
            self.mount(zApp, deferred);
        });
        return deferred.promise.nodeify(callback);
    }

    this._mounting = true;

    Q.fcall(() => {
        _.forEach(self._zApp, app => {
            if (app === zApp)
                throw new  Error('zApp already exists.');
        });
        self._zApp.push(zApp);
    }).then(() => {
        if (coord) {
            mountId = Math.max.apply(null, coord.epList);
            zApp._simpleDesc.epId = mountId > 10 ? mountId + 1 : 11;  // epId 1-10 are reserved for delegator
            loEp = new Coordpoint(coord, zApp._simpleDesc);
            loEp.clusters = zApp.clusters;
            coord.endpoints[loEp.getEpId()] = loEp;
            zApp._endpoint = loEp;
        } else {
            throw new Error('Coordinator has not been initialized yet.');
        }
    }).then(() => self.controller.registerEp(loEp).then(() => {
        debug.shepherd('Register zApp, epId: %s, profId: %s ', loEp.getEpId(), loEp.getProfId());
    })).then(() => self.controller.query.coordInfo().then(coordInfo => {
        coord.update(coordInfo);
        return Q.ninvoke(self._devbox, 'sync', coord._getId());
    })).then(() => {
        self._attachZclMethods(loEp);
        self._attachZclMethods(zApp);

        loEp.onZclFoundation = function (msg, remoteEp) {
            setImmediate(() => zApp.foundationHandler(msg, remoteEp));
        };
        loEp.onZclFunctional = function (msg, remoteEp) {
            setImmediate(() => zApp.functionalHandler(msg, remoteEp));
        };

        deferred.resolve(loEp.getEpId());
    }).fail(err => {
        deferred.reject(err);
    }).done(() => {
        self._mounting = false;
        if (self._mountQueue.length)
            process.nextTick(() => {
                self._mountQueue.shift()();
            });
    });

    if (!(callback && Q.isPromise(callback.promise)))
        return deferred.promise.nodeify(callback);
};

ZShepherd.prototype.list = function (ieeeAddrs) {
    const self = this;
    let foundDevs;

    if (_.isString(ieeeAddrs))
        ieeeAddrs = [ ieeeAddrs ];
    else if (!_.isUndefined(ieeeAddrs) && !_.isArray(ieeeAddrs))
        throw new TypeError('ieeeAddrs should be a string or an array of strings if given.');
    else if (!ieeeAddrs)
        ieeeAddrs = _.map(this._devbox.exportAllObjs(), dev => // list all
        dev.getIeeeAddr());

    foundDevs = _.map(ieeeAddrs, ieeeAddr => {
        proving.string(ieeeAddr, 'ieeeAddr should be a string.');

        let devInfo;
        const found = self._findDevByAddr(ieeeAddr);

        if (found)
            devInfo = _.omit(found.dump(), [ 'id', 'endpoints' ]);

        return devInfo;  // will push undefined to foundDevs array if not found
    });

    return foundDevs;
};

ZShepherd.prototype.getGroup = function (groupID) {
    proving.number(groupID, 'groupID should be a number.');
    const group = new Group(groupID);
    this._attachZclMethods(group);
    return group;
};

ZShepherd.prototype.find = function (addr, epId) {
    proving.number(epId, 'epId should be a number.');

    const dev = this._findDevByAddr(addr);
    return dev ? dev.getEndpoint(epId) : undefined;
};

ZShepherd.prototype.lqi = function (ieeeAddr, callback) {
    proving.string(ieeeAddr, 'ieeeAddr should be a string.');

    const self = this;
    const dev = this._findDevByAddr(ieeeAddr);

    return Q.fcall(() => {
        if (dev)
            return self.controller.request('ZDO', 'mgmtLqiReq', { dstaddr: dev.getNwkAddr(), startindex: 0 });
        else
            return Q.reject(new Error('device is not found.'));
    }).then(rsp => {   // { srcaddr, status, neighbortableentries, startindex, neighborlqilistcount, neighborlqilist }
        if (rsp.status === 0)  // success
            return _.map(rsp.neighborlqilist, neighbor => ({
                ieeeAddr: neighbor.extAddr,
                nwkAddr: neighbor.nwkAddr,
                lqi: neighbor.lqi
            }));
    }).nodeify(callback);
};

ZShepherd.prototype.remove = function (ieeeAddr, cfg, callback) {
    proving.string(ieeeAddr, 'ieeeAddr should be a string.');

    const dev = this._findDevByAddr(ieeeAddr);

    if (_.isFunction(cfg) && !_.isFunction(callback)) {
        callback = cfg;
        cfg = {};
    } else {
        cfg = cfg || {};
    }

    if (!dev)
        return Q.reject(new Error('device is not found.')).nodeify(callback);
    else
        return this.controller.remove(dev, cfg, callback);
};

ZShepherd.prototype.lqiScan = function (ieeeAddr) {
    const info = this.info();
    const self = this;
    const noDuplicate = {};

    const processResponse = function(parent){
        return function(data){
            let chain = Q();
            data.forEach(devinfo => {
                const ieeeAddr = devinfo.ieeeAddr;
                if (ieeeAddr == "0x0000000000000000") return;
                let dev = self._findDevByAddr(ieeeAddr);
                devinfo.parent = parent;
                devinfo.status = dev ? dev.status : "offline";
                const dedupKey = parent + '|' + ieeeAddr;
                if (dev && dev.type == "Router" && !noDuplicate[dedupKey]) {
                    chain = chain.then(() => self.lqi(ieeeAddr).then(processResponse(ieeeAddr)));
                }
                noDuplicate[dedupKey] = devinfo;
            });
            return chain;
        };
    }

    if(!ieeeAddr){
        ieeeAddr = info.net.ieeeAddr;
    }

    return self.lqi(ieeeAddr)
        .timeout(1000)
        .then(processResponse(ieeeAddr))
        .then(() => Object.values(noDuplicate))
        .catch(() => Object.values(noDuplicate));
};

/*************************************************************************************************/
/*** Protected Methods                                                                         ***/
/*************************************************************************************************/
ZShepherd.prototype._findDevByAddr = function (addr) {
    // addr: ieeeAddr(String) or nwkAddr(Number)
    proving.stringOrNumber(addr, 'addr should be a number or a string.');

    return this._devbox.find(dev => _.isString(addr) ? dev.getIeeeAddr() === addr : dev.getNwkAddr() === addr);
};

ZShepherd.prototype._registerDev = function (dev, callback) {
    const devbox = this._devbox;
    let oldDev;

    if (!(dev instanceof Device) && !(dev instanceof Coordinator))
        throw new TypeError('dev should be an instance of Device class.');

    oldDev = _.isNil(dev._getId()) ? undefined : devbox.get(dev._getId());

    return Q.fcall(() => {
        if (oldDev) {
            throw new Error('dev exists, unregister it first.');
        } else if (dev._recovered) {
            return Q.ninvoke(devbox, 'set', dev._getId(), dev).then(id => {
                dev._recovered = false;
                delete dev._recovered;
                return id;
            });
        } else {
            dev.update({ joinTime: Math.floor(Date.now()/1000) });
            return Q.ninvoke(devbox, 'add', dev).then(id => {
                dev._setId(id);
                return id;
            });
        }
    }).nodeify(callback);
};

ZShepherd.prototype._unregisterDev = function (dev, callback) {
    return Q.ninvoke(this._devbox, 'remove', dev._getId()).nodeify(callback);
};

ZShepherd.prototype._attachZclMethods = function (ep) {
    const self = this;

    if (ep.constructor.name === 'Zive') {
        const zApp = ep;
        zApp.foundation = function (dstAddr, dstEpId, cId, cmd, zclData, cfg, callback) {
            const dstEp = self.find(dstAddr, dstEpId);

            if (typeof cfg === 'function') {
                callback = cfg;
                cfg = {};
            }

            if (!dstEp)
                return Q.reject(new Error('dstEp is not found.')).nodeify(callback);
            else
                return self._foundation(zApp._endpoint, dstEp, cId, cmd, zclData, cfg, callback);
        };

        zApp.functional = function (dstAddr, dstEpId, cId, cmd, zclData, cfg, callback) {
            const dstEp = self.find(dstAddr, dstEpId);

            if (typeof cfg === 'function') {
                callback = cfg;
                cfg = {};
            }

            if (!dstEp)
                return Q.reject(new Error('dstEp is not found.')).nodeify(callback);
            else
                return self._functional(zApp._endpoint, dstEp, cId, cmd, zclData, cfg, callback);
        };
    } else if (ep instanceof Group) {
        ep.functional = function (cId, cmd, zclData, cfg, callback) {
            return self._functional(ep, ep, cId, cmd, zclData, cfg, callback);
        };
    } else {
        ep.foundation = function (cId, cmd, zclData, cfg, callback) {
            return self._foundation(ep, ep, cId, cmd, zclData, cfg, callback);
        };
        ep.functional = function (cId, cmd, zclData, cfg, callback) {
            return self._functional(ep, ep, cId, cmd, zclData, cfg, callback);
        };
        ep.bind = function (cId, dstEpOrGrpId, callback) {
            return self.controller.bind(ep, cId, dstEpOrGrpId, callback);
        };
        ep.unbind = function (cId, dstEpOrGrpId, callback) {
            return self.controller.unbind(ep, cId, dstEpOrGrpId, callback);
        };
        ep.read = function (cId, attrId, callback) {
            const deferred = Q.defer();
            let attr = self.zclId.attr(cId, attrId);

            attr = attr ? attr.value : attrId;

            self._foundation(ep, ep, cId, 'read', [{ attrId: attr }]).then(readStatusRecsRsp => {
                const rec = readStatusRecsRsp[0];

                if (rec.status === 0)
                    deferred.resolve(rec.attrData);
                else
                    deferred.reject(new Error('request unsuccess: ' + rec.status));
            }).catch(err => {
                deferred.reject(err);
            });

            return deferred.promise.nodeify(callback);
        };
        ep.write = function (cId, attrId, data, callback) {
            const deferred = Q.defer();
            const attr = self.zclId.attr(cId, attrId);
            const attrType = self.zclId.attrType(cId, attrId).value;

            self._foundation(ep, ep, cId, 'write', [{ attrId: attr.value, dataType: attrType, attrData: data }]).then(writeStatusRecsRsp => {
                const rec = writeStatusRecsRsp[0];

                if (rec.status === 0)
                    deferred.resolve(data);
                else
                    deferred.reject(new Error('request unsuccess: ' + rec.status));
            }).catch(err => {
                deferred.reject(err);
            });

            return deferred.promise.nodeify(callback);
        };
        ep.report = function (cId, attrId, minInt, maxInt, repChange, callback) {
            const deferred = Q.defer();
            const coord = self.controller._coord;
            const dlgEp = coord.getDelegator(ep.getProfId());
            let cfgRpt = true;
            let cfgRptRec;
            let attrIdVal;
            let attrTypeVal;

            if (arguments.length === 1) {
                cfgRpt = false;
            } else if (arguments.length === 2) {
                callback = attrId;
                cfgRpt = false;
            } else if (arguments.length === 5 && _.isFunction(repChange)) {
                callback = repChange;
            }

            if (cfgRpt) {
                attrIdVal = self.zclId.attr(cId, attrId);
                cfgRptRec = {
                    direction : 0,
                    attrId: attrIdVal ? attrIdVal.value : attrId,
                    dataType : self.zclId.attrType(cId, attrId).value,
                    minRepIntval : minInt,
                    maxRepIntval : maxInt,
                    repChange: repChange
                };
            }

            Q.fcall(() => {
                if (dlgEp) {
                    return ep.bind(cId, dlgEp).then(() => {
                        if (cfgRpt)
                            return ep.foundation(cId, 'configReport', [ cfgRptRec ]).then(rsp => {
                                const status = rsp[0].status;
                                if (status !== 0)
                                    deferred.reject(self.zclId.status(status).key);
                            });
                    });
                } else {
                    return Q.reject(new Error('Profile: ' + ep.getProfId() + ' is not supported.'));
                }
            }).then(() => {
                deferred.resolve();
            }).fail(err => {
                deferred.reject(err);
            }).done();

            return deferred.promise.nodeify(callback);
        };
    }
};

ZShepherd.prototype._foundation = function (srcEp, dstEp, cId, cmd, zclData, cfg, callback) {
    const self = this;

    if (_.isFunction(cfg) && !_.isFunction(callback)) {
        callback = cfg;
        cfg = {};
    } else {
        cfg = cfg || {};
    }

    return this.af.zclFoundation(srcEp, dstEp, cId, cmd, zclData, cfg).then(msg => {
        let cmdString = self.zclId.foundation(cmd);
        cmdString = cmdString ? cmdString.key : cmd;

        if (cmdString === 'read')
            self._updateFinalizer(dstEp, cId, msg.payload);
        else if (cmdString === 'write' || cmdString === 'writeUndiv' || cmdString === 'writeNoRsp')
            self._updateFinalizer(dstEp, cId);

        return msg.payload;
    }).nodeify(callback);
};

ZShepherd.prototype._functional = function (srcEp, dstEp, cId, cmd, zclData, cfg, callback) {
    const self = this;

    if (_.isFunction(cfg) && !_.isFunction(callback)) {
        callback = cfg;
        cfg = {};
    } else {
        cfg = cfg || {};
    }

    return this.af.zclFunctional(srcEp, dstEp, cId, cmd, zclData, cfg).then(msg => {
        self._updateFinalizer(dstEp, cId);
        return msg.payload;
    }).nodeify(callback);
};

ZShepherd.prototype._updateFinalizer = function (ep, cId, attrs, reported) {
    // Some eps don't have clusters, e.g. a Group
    if (!ep.getClusters) {
        return;
    }

    const self = this;
    let cIdString = self.zclId.cluster(cId);
    const clusters = ep.getClusters().dumpSync();

    cIdString = cIdString ? cIdString.key : cId;

    Q.fcall(() => {
        if (attrs) {
            const newAttrs = {};

            _.forEach(attrs, rec => {  // { attrId, status, dataType, attrData }
                let attrIdString = self.zclId.attr(cId, rec.attrId);
                attrIdString = attrIdString ? attrIdString.key : rec.attrId;

                if (reported)
                    newAttrs[attrIdString] = rec.attrData;
                else
                    newAttrs[attrIdString] = (rec.status === 0) ? rec.attrData : null;
            });

            return newAttrs;
        } else {
            return self.af.zclClusterAttrsReq(ep, cId);
        }
    }).then(newAttrs => {
        const oldAttrs = clusters[cIdString].attrs;
        const diff = zutils.objectDiff(oldAttrs, newAttrs);

        if (!_.isEmpty(diff)) {
            _.forEach(diff, (val, attrId) => {
                ep.getClusters().set(cIdString, 'attrs', attrId, val);
            });

            self.emit('ind:changed', ep, { cid: cIdString, data: diff });
        }
    }).fail(() => {}).done();
};

module.exports = ZShepherd;
