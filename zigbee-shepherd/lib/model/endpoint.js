/* jshint node: true */
'use strict';

const {cloneDeep} = require('busyman');

class Endpoint {
constructor(device, simpleDesc) {
    // simpleDesc = { profId, epId, devId, inClusterList, outClusterList }

    this.isLocal = function () {
        return false;    // this is a remote endpoint, always return false
    };

    this.device = device;                               // bind to device
    this.profId = simpleDesc.profId;
    this.epId = simpleDesc.epId;
    this.devId = simpleDesc.devId;
    this.inClusterList = simpleDesc.inClusterList;      // numbered cluster ids
    this.outClusterList = simpleDesc.outClusterList;    // numbered cluster ids

    this.clusters = null;    // instance of ziee

    // this.clusters.dumpSync()
    // {
    //     genBasic: {
    //         dir: { value: 1 },  // 0: 'unknown', 1: 'in', 2: 'out', 3: 'in' and 'out'
    //         attrs: {
    //             hwVersion: 0,
    //             zclVersion: 1
    //         }
    //     }
    // }

    this.onAfDataConfirm = null;
    this.onAfReflectError = null;
    this.onAfIncomingMsg = null;
    this.onAfIncomingMsgExt = null;
    this.onZclFoundation = null;
    this.onZclFunctional = null;
}

/*************************************************************************************************/
/*** Public Methods                                                                            ***/
/*************************************************************************************************/
getSimpleDesc() {
    return {
        profId: this.profId,
        epId: this.epId,
        devId: this.devId,
        inClusterList: cloneDeep(this.inClusterList),
        outClusterList: cloneDeep(this.outClusterList),
    };
};

getIeeeAddr() {
    return this.getDevice().getIeeeAddr();
};

getNwkAddr() {
    return this.getDevice().getNwkAddr();
};

dump() {
    const dumped = this.getSimpleDesc();

    dumped.clusters = this.clusters.dumpSync();

    return dumped;
};

// zcl and binding methods will be attached in shepherd
// endpoint.foundation = function (cId, cmd, zclData[, cfg], callback) {};
// endpoint.functional = function (cId, cmd, zclData[, cfg], callback) {};
// endpoint.read = function (cId, attrId, callback) {};
// endpoint.bind = function (cId, dstEpOrGrpId[, callback]) {};
// endpoint.unbind = function (cId, dstEpOrGrpId[, callback]) {};

/*************************************************************************************************/
/*** Protected Methods                                                                         ***/
/*************************************************************************************************/
isZclSupported() {
    let zclSupport = false;

    if (this.profId < 0x8000 && this.devId < 0xc000)
        zclSupport = true;

    this.isZclSupported = function () {
        return zclSupport;
    };

    return zclSupport;
};

getDevice() {
    return this.device;
};

getProfId() {
    return this.profId;
};

getEpId() {
    return this.epId;
};

getDevId() {
    return this.devId;
};

getInClusterList() {
    return cloneDeep(this.inClusterList);
};

getOutClusterList() {
    return cloneDeep(this.outClusterList);
};

getClusterList() {
    const clusterList = this.getInClusterList();

    this.getOutClusterList().forEach(cId => {
        if (!clusterList.includes(cId)) 
            clusterList.push(cId);
    });

    return clusterList.sort((a, b) => a - b);
};

getClusters() {
    return this.clusters;
};

getManufId() {
    return this.getDevice().getManufId();
};

update(simpleDesc) {
    const self = this;
    const descKeys = [ 'profId', 'epId', 'devId','inClusterList', 'outClusterList' ];

    Object.entries(simpleDesc).forEach(([key, val]) => {
        if (descKeys.includes(key))
            self[key] = val;
    });
};

}

module.exports = Endpoint;
