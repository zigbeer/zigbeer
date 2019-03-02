/* jshint node: true */
'use strict';

const Q = require('q');
const _ = require('busyman');
const Ziee = require('ziee');
const debug = require('debug')('zigbee-shepherd:init');
const Coordinator = require('../model/coord');
const Coordpoint = require('../model/coordpoint');

const init = {};

/*************************************************************************************************/
/*** Public APIs                                                                               ***/
/*************************************************************************************************/
init.setupCoord = function (controller, callback) {
    return controller.checkNvParams().then(() => init._bootCoordFromApp(controller)).then(netInfo => init._registerDelegators(controller, netInfo)).nodeify(callback);
};

/*************************************************************************************************/
/*** Private APIs                                                                              ***/
/*************************************************************************************************/
init._bootCoordFromApp = function (controller) {
    return controller.query.coordState().then(state => {
        if (state !== 'ZB_COORD' && state !== 0x09) {
            debug('Start the ZNP as a coordinator...');
            return init._startupCoord(controller);
        }
    }).then(() => {
        debug('Now the ZNP is a coordinator.');
    }).then(() => controller.query.firmware()
        .then(firmwareInfo => {
            controller._firmware = firmwareInfo;
        })).then(() => controller.query.network()
        .then(netInfo => {
            // netInfo: { state, channel, panId, extPanId, ieeeAddr, nwkAddr }
            controller.setNetInfo(netInfo);
            return netInfo;
        }));
};

init._startupCoord = function (controller) {
    const deferred = Q.defer();
    let stateChangeHdlr;

    stateChangeHdlr = function (data) {
        if (data.state === 9) {
            deferred.resolve();
            controller.removeListener('ZDO:stateChangeInd', stateChangeHdlr);
        }
    };

    controller.on('ZDO:stateChangeInd', stateChangeHdlr);
    controller.request('ZDO', 'startupFromApp', { startdelay: 100 });

    return deferred.promise;
};

init._registerDelegators = function (controller, netInfo) {
    let coord = controller._coord;

    const dlgInfos =  [
        { profId: 0x0104, epId: 1 }, { profId: 0x0101, epId: 2 }, { profId: 0x0105, epId: 3 },
        { profId: 0x0107, epId: 4 }, { profId: 0x0108, epId: 5 }, { profId: 0x0109, epId: 6 }
    ];

    return controller.simpleDescReq(0, netInfo.ieeeAddr).then(devInfo => {
        const deregisterEps = [];

        _.forEach(devInfo.epList, epId => {
            if (epId > 10) {
                deregisterEps.push(() => controller.request('AF', 'delete', { endpoint: epId }).delay(10).then(() => {
                    debug('Deregister endpoint, epId: %s', epId);
                }));
            }
        });

        if (!deregisterEps.length) {
            return devInfo;
        } else {
            return deregisterEps.reduce((soFar, fn) => soFar.then(fn), Q(0)).then(() => devInfo);
        }
    }).then(devInfo => {
        const registerDlgs = [];

        if (!coord)
            coord = controller._coord = new Coordinator(devInfo);
        else
            coord.endpoints = {};

        _.forEach(dlgInfos, dlgInfo => {
            const dlgDesc = { profId: dlgInfo.profId, epId: dlgInfo.epId, devId: 0x0005, inClusterList: [], outClusterList: [] };
            const dlgEp = new Coordpoint(coord, dlgDesc, true);
            let simpleDesc;

            dlgEp.clusters = new Ziee();
            coord.endpoints[dlgEp.getEpId()] = dlgEp;

            simpleDesc = _.find(devInfo.endpoints, ep => ep.epId === dlgInfo.epId);

            if (!_.isEqual(dlgDesc, simpleDesc)) {
                registerDlgs.push(() => controller.registerEp(dlgEp).delay(10).then(() => {
                    debug('Register delegator, epId: %s, profId: %s ', dlgEp.getEpId(), dlgEp.getProfId());
                }));
            }
        });

        return registerDlgs.reduce((soFar, fn) => soFar.then(fn), Q(0));
    }).then(() => controller.query.coordInfo().then(coordInfo => {
        coord.update(coordInfo);
    }));
};

module.exports = init;
