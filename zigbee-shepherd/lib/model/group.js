/* jshint node: true */
'use strict';

class Group {
constructor(groupID) {
    this.groupID = groupID;

    this.isLocal = function () {
        return true;                      // this is a local endpoint, always return true
    };

    this.getEpId = function () {
        return 1;
    };
}

}

module.exports = Group;
