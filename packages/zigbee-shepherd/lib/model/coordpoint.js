/* jshint node: true */
'use strict';

const Endpoint = require('./endpoint');

class Coordpoint extends Endpoint {
constructor (coord, simpleDesc, isDelegator) {
    // simpleDesc = { profId, epId, devId, inClusterList, outClusterList }

    // coordpoint is a endpoint, but a 'LOCAL' endpoint
    // This class is used to create delegators, local applications

    super(coord, simpleDesc);

    this.isLocal = function () {
        return true;                      // this is a local endpoint, always return true
    };

    this.isDelegator = function () {
        return !!(isDelegator || false);  // this local endpoint maybe a delegator
    };
}

}

module.exports = Coordpoint;
