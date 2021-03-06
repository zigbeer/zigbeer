/* jshint node: true */
'use strict';

const Q = require('q');
const proving = require('proving');
const ZSC = require('zstack-constants');
const Endpoint  = require('../model/endpoint');
const Coordpoint  = require('../model/coordpoint');
const zutils = require('./zutils');
let controller;
const query = {};

/*************************************************************************************************/
/*** Public APIs                                                                               ***/
/*************************************************************************************************/
query.coordInfo = function (callback) {
    const info = controller.getNetInfo();
    return query.device(info.ieeeAddr, info.nwkAddr, callback);
};

query.coordState = function (callback) {
    return query.network('DEV_STATE', callback);
};

query.network = function (param, callback) {
    if (typeof param === "function") {
        callback = param;
        param = null;
    }

    if (param)
        return query._network(param, callback);    // return value
    else
        return query._networkAll(callback);        // return { state, channel, panId, extPanId, ieeeAddr, nwkAddr }
};

query.firmware = function(){
    return controller.request('SYS', 'version', {})
        .then(rsp => ({
        transportrev: rsp.transportrev,
        product: rsp.product,
        version: `${rsp.majorrel}.${rsp.minorrel}.${rsp.maintrel}`,
        revision: rsp.revision
    })).fail(() => ({
        error: "Unable to get firmware version"
    }));
}

query.device = function (ieeeAddr, nwkAddr, callback) {
    const devInfo = {
            type: null,
            ieeeAddr,
            nwkAddr,
            manufId: null,
            epList: null
        };

    proving.string(ieeeAddr, 'ieeeAddr should be a string.');
    proving.number(nwkAddr, 'nwkAddr should be a number.');

    return controller.request('ZDO', 'nodeDescReq', { dstaddr: nwkAddr, nwkaddrofinterest: nwkAddr }).then(rsp => {
        // rsp: { srcaddr, status, nwkaddr, logicaltype_cmplxdescavai_userdescavai, ..., manufacturercode, ... }
        devInfo.type = devType(rsp.logicaltype_cmplxdescavai_userdescavai & 0x07);  // logical type: bit0-2
        devInfo.manufId = rsp.manufacturercode;
        return controller.request('ZDO', 'activeEpReq', { dstaddr: nwkAddr, nwkaddrofinterest: nwkAddr });
    }).then(rsp => {
        // rsp: { srcaddr, status, nwkaddr, activeepcount, activeeplist }
        devInfo.epList = bufToArray(rsp.activeeplist, 'uint8');
        return devInfo;
    }).nodeify(callback);
};

query.endpoint = function (nwkAddr, epId, callback) {
    proving.number(nwkAddr, 'nwkAddr should be a number.');

    return controller.request('ZDO', 'simpleDescReq', { dstaddr: nwkAddr, nwkaddrofinterest: nwkAddr, endpoint: epId }).then(rsp => // rsp: { ..., endpoint, profileid, deviceid, deviceversion, numinclusters, inclusterlist, numoutclusters, outclusterlist }
    ({
        profId: rsp.profileid || 0,
        epId: rsp.endpoint,
        devId: rsp.deviceid || 0,
        inClusterList: bufToArray(rsp.inclusterlist, 'uint16'),
        outClusterList: bufToArray(rsp.outclusterlist, 'uint16')
    })).nodeify(callback);
};

query.deviceWithEndpoints = function (nwkAddr, ieeeAddr, callback) {
    const deferred = Q.defer();
    const epQueries = [];
    let fullDev;

    query.device(ieeeAddr, nwkAddr).then(devInfo => {
        fullDev = devInfo;

        fullDev.epList.forEach(epId => {
            const epQuery = {func: query.endpoint, nwkAddr, epId};
            epQueries.push(epQuery);
        });

        let result = Q();
        const resultArray = [];
        epQueries.forEach(f => {
            result = result.then(() => f.func(f.nwkAddr, f.epId).then(res => resultArray.push(res)));
        });
        return result.then(() => resultArray);
    }).then(epInfos => {
        fullDev.endpoints = epInfos;
        deferred.resolve(fullDev);
    }).fail(err => {
        deferred.reject(err);
    }).done();

    return deferred.promise.nodeify(callback);
};

query.setBindingEntry = function (bindMode, srcEp, cId, dstEpOrGrpId, callback, zclId) {
    const deferred = Q.defer();
    const cIdItem = zclId.cluster(cId);
    let bindParams;
    let dstEp;
    let grpId;
    let req;

    if (!((srcEp instanceof Endpoint) || (srcEp instanceof Coordpoint)))
        throw new TypeError('srcEp should be an instance of Endpoint class.');

    proving.defined(cIdItem, `Invalid cluster id: ${cId}.`);

    if (typeof dstEpOrGrpId === "number" && !isNaN(dstEpOrGrpId))
        grpId = dstEpOrGrpId;
    else if (dstEpOrGrpId instanceof Endpoint || dstEpOrGrpId instanceof Coordpoint)
        dstEp = dstEpOrGrpId;
    else
        throw new TypeError('dstEpOrGrpId should be an instance of Endpoint class or a number of group id.');

    bindParams = {
        dstaddr: srcEp.getNwkAddr(),
        srcaddr: srcEp.getIeeeAddr(),
        srcendpoint: srcEp.getEpId(),
        clusterid: cIdItem.value,
        dstaddrmode: dstEp ? ZSC.AF.addressMode.ADDR_64BIT : ZSC.AF.addressMode.ADDR_GROUP,
        addr_short_long: dstEp ? dstEp.getIeeeAddr() : zutils.toLongAddrString(grpId),
        dstendpoint: dstEp ? dstEp.getEpId() : 0xFF
    };

    if (bindMode === 0 || bindMode === 'bind') {
        req = function () { return controller.request('ZDO', 'bindReq', bindParams); };
    } else if (bindMode === 1 || bindMode === 'unbind') {
        req = function () { return controller.request('ZDO', 'unbindReq', bindParams); };
    }

    (function performReq(retryAttempts) {
        if (typeof retryAttempts === 'undefined') retryAttempts = 0;
        req().then(rsp => {
            deferred.resolve();
        }).fail(err => {
            if(retryAttempts >= 4) return deferred.reject(err);
            else performReq(++retryAttempts);
        }).done();
    })();

    return deferred.promise.nodeify(callback);
};

/*************************************************************************************************/
/*** Protected Methods                                                                         ***/
/*************************************************************************************************/
query._network = function (param, callback) {
    const prop = ZSC.SAPI.zbDeviceInfo[param];

    return Q.fcall(() => {
        if (prop == null)
            return Q.reject(new Error('Unknown network property.'));
        else
            return controller.request('SAPI', 'getDeviceInfo', { param: prop });
    }).then(rsp => {
        switch (param) {
            case 'DEV_STATE':
            case 'CHANNEL':
                return rsp.value.readUInt8(0);
            case 'IEEE_ADDR':
            case 'PARENT_IEEE_ADDR':
            case 'EXT_PAN_ID':
                return addrBuf2Str(rsp.value);
            case 'SHORT_ADDR':
            case 'PARENT_SHORT_ADDR':
                return rsp.value.readUInt16LE(0);
            case 'PAN_ID':
                return zutils.toHexString(rsp.value.readUInt16LE(0), 'uint16');
        }
    }).nodeify(callback);
};

query._networkAll = function (callback) {
    const paramsInfo = [
            { param: 'DEV_STATE',  name: 'state'   }, { param: 'IEEE_ADDR',  name: 'ieeeAddr' },
            { param: 'SHORT_ADDR', name: 'nwkAddr' }, { param: 'CHANNEL',    name: 'channel'  },
            { param: 'PAN_ID',     name: 'panId'   }, { param: 'EXT_PAN_ID', name: 'extPanId' }
        ];

    const net = {
        state: null,
        channel: null,
        panId: null,
        extPanId: null,
        ieeeAddr: null,
        nwkAddr: null
    };

    const steps = [];

    paramsInfo.forEach(paramInfo => {
        steps.push(net => query._network(paramInfo.param).then(value => {
            net[paramInfo.name] = value;
            return net;
        }));
    });

    return steps.reduce((soFar, fn) => soFar.then(fn), Q(net)).nodeify(callback);
};

function devType(type) {
    const DEVTYPE = ZSC.ZDO.deviceLogicalType;

    switch (type) {
        case DEVTYPE.COORDINATOR:
            return 'Coordinator';
        case DEVTYPE.ROUTER:
            return 'Router';
        case DEVTYPE.ENDDEVICE:
            return 'EndDevice';
        case DEVTYPE.COMPLEX_DESC_AVAIL:
            return 'ComplexDescAvail';
        case DEVTYPE.USER_DESC_AVAIL:
            return 'UserDescAvail';
        default:
            break;
    }
}

function addrBuf2Str(buf) {
    let val;
    const bufLen = buf.length;
    let strChunk = '0x';

    for (let i = 0; i < bufLen; i += 1) {
        val = buf.readUInt8(bufLen - i - 1);

        if (val <= 15)
            strChunk += `0${val.toString(16)}`;
        else
            strChunk += val.toString(16);
    }

    return strChunk;
}

function bufToArray(buf, nip) {
    let i;
    const nipArr = [];

    if (nip === 'uint8') {
        for (i = 0; i < buf.length; i += 1) {
            nipArr.push(buf.readUInt8(i));
        }
    } else if (nip === 'uint16') {
        for (i = 0; i < buf.length; i += 2) {
            nipArr.push(buf.readUInt16LE(i));
        }
    }

    return nipArr.sort((a, b) => a - b);
}

module.exports = function (cntl) {
    controller = cntl;
    return query;
};
