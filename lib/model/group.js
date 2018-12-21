/* jshint node: true */
'use strict';

var _ = require('busyman');

function Group(groupID) {
    this.groupID = groupID;

    this.isLocal = function () {
        return true;                      // this is a local endpoint, always return true
    };

    this.getEpId = function () {
        return 1;
    };
}

/*************************************************************************************************/
/*** Public Methods                                                                            ***/
/*************************************************************************************************/
Group.prototype.getGroupID = function () {
    return this.groupID;
};

module.exports = Group;
