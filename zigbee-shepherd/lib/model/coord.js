/* jshint node: true */
'use strict';

const _ = require('busyman');
const Device = require('./device');

class Coordinator extends Device {
constructor(devInfo) {
    // devInfo = { type, ieeeAddr, nwkAddr, manufId, epList }

    super(devInfo);

    this.status = 'online';
}

getDelegator(profId) {
    return _.find(this.endpoints, ep => ep.isDelegator() && ep.getProfId() === profId);
};

}

module.exports = Coordinator;
