/* jshint node: true */
'use strict';

const Device = require('./device');

class Coordinator extends Device {
constructor(devInfo) {
    // devInfo = { type, ieeeAddr, nwkAddr, manufId, epList }

    super(devInfo);

    this.status = 'online';
}

getDelegator(profId) {
    return Object.values(this.endpoints).find(ep => ep.isDelegator() && ep.getProfId() === profId);
};

}

module.exports = Coordinator;
