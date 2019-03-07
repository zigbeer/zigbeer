/* jshint node: true */
'use strict';

const Q = require('q');
const Ziee = require('ziee');
const Device = require('../model/device');
const Endpoint = require('../model/endpoint');

const loader = {};

loader.reloadSingleDev = function (shepherd, devRec, callback) {
    const deferred = Q.defer();
    const dev = shepherd._devbox.get(devRec.id);

    if (dev && isSameDevice(dev, devRec)) {
        deferred.resolve(null);  // same dev exists, do not reload
        return deferred.promise.nodeify(callback);
    } else if (dev) {
        devRec.id = null;        // give new id to devRec
    }

    const recoveredDev = new Device(devRec);

    Object.entries(devRec.endpoints).forEach(([epId, epRec]) => {
        const recoveredEp = new Endpoint(recoveredDev, epRec);

        recoveredEp.clusters = new Ziee();

        Object.entries(epRec.clusters).forEach(([cid, cInfo]) => {
            recoveredEp.clusters.init(cid, 'dir', cInfo.dir);
            recoveredEp.clusters.init(cid, 'attrs', cInfo.attrs, false);
        });

        shepherd._attachZclMethods(recoveredEp);
        recoveredDev.endpoints[epId] = recoveredEp;
    });

    recoveredDev._recoverFromRecord(devRec);
    return shepherd._registerDev(recoveredDev, callback);    // return (err, id)
};

loader.reloadDevs = function (shepherd, callback) {
    const deferred = Q.defer();
    const recoveredIds = [];

    Q.ninvoke(shepherd._devbox, 'findFromDb', {}).then(devRecs => {
        let total = devRecs.length;

        devRecs.forEach(devRec => {
            if (devRec.nwkAddr === 0) {  // coordinator
                total -= 1;
                if (total === 0)         // all done
                    deferred.resolve(recoveredIds);
            } else {
                loader.reloadSingleDev(shepherd, devRec).then(id => {
                    recoveredIds.push(id);
                }).fail(err => {
                    recoveredIds.push(null);
                }).done(() => {
                    total -= 1;
                    if (total === 0)     // all done
                        deferred.resolve(recoveredIds);
                });
            }
        });
    }).fail(err => {
        deferred.reject(err);
    }).done();

    return deferred.promise.nodeify(callback);
};

loader.reload = function (shepherd, callback) {
    const deferred = Q.defer();

    loader.reloadDevs(shepherd).then(devIds => {
        loader.syncDevs(shepherd, () => {
            deferred.resolve();  // whether sync or not, return success
        });
    }).fail(err => {
        deferred.reject(err);
    }).done();

    return deferred.promise.nodeify(callback);
};

loader.syncDevs = function (shepherd, callback) {
    const deferred = Q.defer();
    const idsNotInBox = [];

    Q.ninvoke(shepherd._devbox, 'findFromDb', {}).then(devRecs => {
        devRecs.forEach(devRec => {
            if (!shepherd._devbox.get(devRec.id))
                idsNotInBox.push(devRec.id);
        });

        if (idsNotInBox.length) {
            let ops = devRecs.length;
            idsNotInBox.forEach(id => {
                setImmediate(() => {
                    shepherd._devbox.remove(id, () => {
                        ops -= 1;
                        if (ops === 0)
                            deferred.resolve();
                    });
                });
            });
        } else {
            deferred.resolve();
        }
    }).fail(err => {
        deferred.reject(err);
    }).done();

    return deferred.promise.nodeify(callback);
};

function isSameDevice(dev, devRec) {
    return (dev.getIeeeAddr() === devRec.ieeeAddr) ? true : false;
}

module.exports = loader;
