/* jshint node: true */
'use strict';

const Q = require('q');
const debug = require('debug')('zigbee-shepherd:init');
const af = require('../components/af');
const loader = require('../components/loader');

const init = {};

init.setupShepherd = function (shepherd, callback) {
    const deferred = Q.defer();
    const controller = shepherd.controller;
    let netInfo;

    debug('zigbee-shepherd booting...');

    controller.start().then(() => {
        shepherd.af = af(shepherd.zclId)(controller);
        return controller.request('ZDO', 'mgmtPermitJoinReq', { addrmode: 0x02, dstaddr: 0 , duration: 0, tcsignificance: 0 });
    }).then(() => shepherd._registerDev(controller._coord)).then(() => // reload all devices from database
    loader.reload(shepherd)).then(() => {
    debug('Loading devices from database done.');
    }).done(deferred.resolve, deferred.reject);

    return deferred.promise.nodeify(callback);
};

module.exports = init;
