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

    controller.start().then(function () {
        shepherd.af = af(shepherd.zclId)(controller);
        return controller.request('ZDO', 'mgmtPermitJoinReq', { addrmode: 0x02, dstaddr: 0 , duration: 0, tcsignificance: 0 });
    }).then(function () {
        return shepherd._registerDev(controller._coord);
    }).then(function () {
        return loader.reload(shepherd);    // reload all devices from database
    }).then(function() {
    debug('Loading devices from database done.');
    }).done(deferred.resolve, deferred.reject);

    return deferred.promise.nodeify(callback);
};

module.exports = init;
