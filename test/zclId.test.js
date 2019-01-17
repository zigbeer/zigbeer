const { expect } = require("chai")

const _common = require("../src/definitions/common.json")

const zclId = require("../src/legacy")

const clusterDefs = require("../src/definitions/cluster_defs.json")

const profIdKeys = []
const profIdVals = []
const cIdKeys = []
const cIdVals = []
const foundKeys = []
const foundVals = []
const dataTypeKeys = []
const dataTypeVals = []
const statusKeys = []
const statusVals = []
const devIdKeys = {
  HA: []
}
const devIdVals = {
  HA: []
}

for (const k in _common.profileId) {
  profIdKeys.push(k)
  profIdVals.push(_common.profileId[k])
}

for (const k in _common.clusterId) {
  cIdKeys.push(k)
  cIdVals.push(_common.clusterId[k])
}

for (const k in _common.foundation) {
  foundKeys.push(k)
  foundVals.push(_common.foundation[k])
}

for (const k in _common.dataType) {
  dataTypeKeys.push(k)
  dataTypeVals.push(_common.dataType[k])
}

for (const k in _common.status) {
  statusKeys.push(k)
  statusVals.push(_common.status[k])
}

for (const k in _common.haDevId) {
  devIdKeys.HA.push(k)
  devIdVals.HA.push(_common.haDevId[k])
}

describe("Module Methods Check", function() {
  describe("#.profile", function() {
    it("should get right item by profId string", function() {
      profIdKeys.forEach(function(pkey) {
        const hitA = zclId.profile(pkey),
          hitB = zclId.profileId.get(pkey)

        expect(hitA).not.to.be.undefined
        expect(hitA.key).to.be.eql(hitB.key)
        expect(hitA.value).to.be.eql(hitB.value)
      })
    })

    it("should get right item by profId number", function() {
      profIdVals.forEach(function(pval) {
        const hitA = zclId.profile(pval),
          hitB = zclId.profileId.get(pval)

        expect(hitA).not.to.be.undefined
        expect(hitA.key).to.be.eql(hitB.key)
        expect(hitA.value).to.be.eql(hitB.value)
      })
    })

    it("should get undefined if profId not found", function() {
      expect(zclId.profile("xxx")).to.be.undefined
      expect(zclId.profile(12345)).to.be.undefined
    })
  })

  describe("#.device", function() {
    it("should get right item by profId string and devId string", function() {
      profIdKeys.forEach(function(pkey) {
        if (!devIdKeys[pkey]) return

        devIdKeys[pkey].forEach(function(dkey) {
          const hitA = zclId.device(pkey, dkey),
            hitB = zclId.deviceId[pkey].get(dkey)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get right item by profId string and devId number", function() {
      profIdKeys.forEach(function(pkey) {
        if (!devIdKeys[pkey]) return

        devIdVals[pkey].forEach(function(dval) {
          const hitA = zclId.device(pkey, dval),
            hitB = zclId.deviceId[pkey].get(dval)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get right item by profId number and devId string", function() {
      profIdVals.forEach(function(pval) {
        const profId = zclId.profile(pval)

        if (!devIdKeys[profId.key]) return

        devIdKeys[profId.key].forEach(function(dkey) {
          const hitA = zclId.device(pval, dkey),
            hitB = zclId.deviceId[profId.key].get(dkey)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get right item by profId number and devId number", function() {
      profIdVals.forEach(function(pval) {
        const profId = zclId.profile(pval)

        if (!devIdKeys[profId.key]) return

        devIdVals[profId.key].forEach(function(dval) {
          const hitA = zclId.device(pval, dval),
            hitB = zclId.deviceId[profId.key].get(dval)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get undefined if target not found", function() {
      expect(zclId.device("HA", "dddd")).to.be.undefined
      expect(zclId.device("HA", 12345)).to.be.undefined
      expect(zclId.device(3, "dddd")).to.be.undefined
      expect(zclId.device(3, 12345)).to.be.undefined
    })

    it("should get an item if target is found", function() {
      expect(zclId.device("HA", "doorLock")).not.to.be.undefined
      expect(zclId.device("HA", 4)).not.to.be.undefined
      expect(zclId.device(260, "doorLock")).not.to.be.undefined
      expect(zclId.device(260, 4)).not.to.be.undefined
    })
  })

  describe("#.cluster", function() {
    it("should get right item by cId string", function() {
      cIdKeys.forEach(function(ckey) {
        const hitA = zclId.cluster(ckey),
          hitB = zclId.clusterId.get(ckey)

        expect(hitA).not.to.be.undefined
        expect(hitA.key).to.be.eql(hitB.key)
        expect(hitA.value).to.be.eql(hitB.value)
      })
    })

    it("should get right item by cId number", function() {
      cIdVals.forEach(function(cval) {
        const hitA = zclId.cluster(cval),
          hitB = zclId.clusterId.get(cval)

        expect(hitA).not.to.be.undefined
        expect(hitA.key).to.be.eql(hitB.key)
        expect(hitA.value).to.be.eql(hitB.value)
      })
    })

    it("should get undefined if cId not found", function() {
      expect(zclId.cluster("xxx")).to.be.undefined
      expect(zclId.cluster(12345)).to.be.undefined
    })
  })

  describe("#.foundation", function() {
    it("should get right item by cmdId string", function() {
      foundKeys.forEach(function(fkey) {
        const hitA = zclId.foundation(fkey),
          hitB = zclId.foundationId.get(fkey)

        expect(hitA).not.to.be.undefined
        expect(hitA.key).to.be.eql(hitB.key)
        expect(hitA.value).to.be.eql(hitB.value)
      })
    })

    it("should get right item by cmdId number", function() {
      foundVals.forEach(function(fval) {
        const hitA = zclId.foundation(fval),
          hitB = zclId.foundationId.get(fval)

        expect(hitA).not.to.be.undefined
        expect(hitA.key).to.be.eql(hitB.key)
        expect(hitA.value).to.be.eql(hitB.value)
      })
    })

    it("should get undefined if cmdId not found", function() {
      expect(zclId.foundation("xxx")).to.be.undefined
      expect(zclId.foundation(12345)).to.be.undefined
    })
  })

  describe("#.functional", function() {
    it("should get right item by cId string and cmdId string", function() {
      cIdKeys.forEach(function(ckey) {
        if (!clusterDefs[ckey]) return

        const cmdIdKeys = []

        for (const k in clusterDefs[ckey].cmd) {
          cmdIdKeys.push(k)
        }

        cmdIdKeys.forEach(function(cmdkey) {
          const hitA = zclId.functional(ckey, cmdkey),
            hitB = zclId._getCluster(ckey).cmd.get(cmdkey)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get right item by cId string and cmdId number", function() {
      cIdKeys.forEach(function(ckey) {
        if (!clusterDefs[ckey]) return

        const cmdIdVals = []

        for (const k in clusterDefs[ckey].cmd) {
          cmdIdVals.push(clusterDefs[ckey].cmd[k])
        }

        cmdIdVals.forEach(function(cmdval) {
          const hitA = zclId.functional(ckey, cmdval),
            hitB = zclId._getCluster(ckey).cmd.get(cmdval)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get right item by cId number and cmdId string", function() {
      cIdVals.forEach(function(cval) {
        const cId = zclId.cluster(cval)

        if (!clusterDefs[cId.key]) return

        const cmdIdKeys = []

        for (const k in clusterDefs[cId.key].cmd) {
          cmdIdKeys.push(k)
        }

        cmdIdKeys.forEach(function(cmdkey) {
          const hitA = zclId.functional(cval, cmdkey),
            hitB = zclId._getCluster(cId.key).cmd.get(cmdkey)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get right item by cId number and cmdId number", function() {
      cIdVals.forEach(function(cval) {
        const cId = zclId.cluster(cval)

        if (!clusterDefs[cId.key]) return

        const cmdIdVals = []

        for (const k in clusterDefs[cId.key].cmd) {
          cmdIdVals.push(clusterDefs[cId.key].cmd[k])
        }

        cmdIdVals.forEach(function(cmdval) {
          const hitA = zclId.functional(cval, cmdval),
            hitB = zclId._getCluster(cId.key).cmd.get(cmdval)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get undefined if target not found", function() {
      expect(zclId.functional("genOnOff", "dddd")).to.be.undefined
      expect(zclId.functional("genOnOff", 12345)).to.be.undefined
      expect(zclId.functional(3, "dddd")).to.be.undefined
      expect(zclId.functional(3, 12345)).to.be.undefined
    })

    it("should get an item if target is found", function() {
      expect(zclId.functional("genOnOff", "toggle")).not.to.be.undefined
      expect(zclId.functional("genOnOff", 2)).not.to.be.undefined
      expect(zclId.functional(6, "toggle")).not.to.be.undefined
      expect(zclId.functional(6, 2)).not.to.be.undefined
    })
  })

  describe("#.getCmdRsp", function() {
    it("should get right item by cId string and cmdId string", function() {
      cIdKeys.forEach(function(ckey) {
        if (!clusterDefs[ckey]) return

        const cmdIdKeys = []

        for (const k in clusterDefs[ckey].cmdRsp) {
          cmdIdKeys.push(k)
        }

        cmdIdKeys.forEach(function(cmdkey) {
          const hitA = zclId.getCmdRsp(ckey, cmdkey),
            hitB = zclId._getCluster(ckey).cmdRsp.get(cmdkey)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get right item by cId string and cmdId number", function() {
      cIdKeys.forEach(function(ckey) {
        if (!clusterDefs[ckey]) return

        const cmdIdVals = []

        for (const k in clusterDefs[ckey].cmdRsp) {
          cmdIdVals.push(clusterDefs[ckey].cmdRsp[k])
        }

        cmdIdVals.forEach(function(cmdval) {
          const hitA = zclId.getCmdRsp(ckey, cmdval),
            hitB = zclId._getCluster(ckey).cmdRsp.get(cmdval)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get right item by cId number and cmdId string", function() {
      cIdVals.forEach(function(cval) {
        const cId = zclId.cluster(cval)

        if (!clusterDefs[cId.key]) return

        const cmdIdKeys = []

        for (const k in clusterDefs[cId.key].cmdRsp) {
          cmdIdKeys.push(k)
        }

        cmdIdKeys.forEach(function(cmdkey) {
          const hitA = zclId.getCmdRsp(cval, cmdkey),
            hitB = zclId._getCluster(cId.key).cmdRsp.get(cmdkey)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get right item by cId number and cmdId number", function() {
      cIdVals.forEach(function(cval) {
        const cId = zclId.cluster(cval)

        if (!clusterDefs[cId.key]) return

        const cmdIdVals = []

        for (const k in clusterDefs[cId.key].cmdRsp) {
          cmdIdVals.push(clusterDefs[cId.key].cmdRsp[k])
        }

        cmdIdVals.forEach(function(cmdval) {
          const hitA = zclId.getCmdRsp(cval, cmdval),
            hitB = zclId._getCluster(cId.key).cmdRsp.get(cmdval)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get undefined if target not found", function() {
      expect(zclId.getCmdRsp("ssIasZone", "dddd")).to.be.undefined
      expect(zclId.getCmdRsp("ssIasZone", 12345)).to.be.undefined
      expect(zclId.getCmdRsp(1280, "dddd")).to.be.undefined
      expect(zclId.getCmdRsp(1280, 12345)).to.be.undefined
    })

    it("should get an item if target is found", function() {
      expect(zclId.getCmdRsp("ssIasZone", "enrollReq")).not.to.be.undefined
      expect(zclId.getCmdRsp("ssIasZone", 1)).not.to.be.undefined
      expect(zclId.getCmdRsp(1280, "enrollReq")).not.to.be.undefined
      expect(zclId.getCmdRsp(1280, 1)).not.to.be.undefined
    })
  })

  describe("#.attr", function() {
    it("should get right item by cId string and attrId string", function() {
      cIdKeys.forEach(function(ckey) {
        if (!clusterDefs[ckey]) return

        const attrIdKeys = []

        for (const k in clusterDefs[ckey].attrId) {
          attrIdKeys.push(k)
        }

        attrIdKeys.forEach(function(akey) {
          const hitA = zclId.attr(ckey, akey),
            hitB = zclId._getCluster(ckey).attr.get(akey)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get right item by cId string and attrId number", function() {
      cIdKeys.forEach(function(ckey) {
        if (!clusterDefs[ckey]) return

        const attrIdVals = []

        for (const k in clusterDefs[ckey].attrId) {
          attrIdVals.push(clusterDefs[ckey].attrId[k].id)
        }

        attrIdVals.forEach(function(aval) {
          const hitA = zclId.attr(ckey, aval),
            hitB = zclId._getCluster(ckey).attr.get(aval)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get right item by cId number and attrId string", function() {
      cIdVals.forEach(function(cval) {
        const cId = zclId.cluster(cval)

        if (!clusterDefs[cId.key]) return

        const attrIdKeys = []

        for (const k in clusterDefs[cId.key].attrId) {
          attrIdKeys.push(k)
        }

        attrIdKeys.forEach(function(akey) {
          const hitA = zclId.attr(cval, akey),
            hitB = zclId._getCluster(cId.key).attr.get(akey)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get right item by cId number and attrId number", function() {
      cIdVals.forEach(function(cval) {
        const cId = zclId.cluster(cval)

        if (!clusterDefs[cId.key]) return

        const attrIdVals = []

        for (const k in clusterDefs[cId.key].attrId) {
          attrIdVals.push(clusterDefs[cId.key].attrId[k].id)
        }

        attrIdVals.forEach(function(aval) {
          const hitA = zclId.attr(cval, aval),
            hitB = zclId._getCluster(cId.key).attr.get(aval)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get undefined if target not found", function() {
      expect(zclId.attr("genBasic", "dddd")).to.be.undefined
      expect(zclId.attr("genBasic", 12345)).to.be.undefined
      expect(zclId.attr(3, "dddd")).to.be.undefined
      expect(zclId.attr(3, 12345)).to.be.undefined
    })

    it("should get an item if target is found", function() {
      expect(zclId.attr("genBasic", "zclVersion")).not.to.be.undefined
      expect(zclId.attr("genBasic", 0)).not.to.be.undefined
      expect(zclId.attr(0, "zclVersion")).not.to.be.undefined
      expect(zclId.attr(0, 0)).not.to.be.undefined
    })
  })

  describe("#.attrType", function() {
    it("should get right item by cId string and attrId string", function() {
      cIdKeys.forEach(function(ckey) {
        if (!clusterDefs[ckey]) return

        const attrIdKeys = []

        for (const k in clusterDefs[ckey].attrId) {
          attrIdKeys.push(k)
        }

        attrIdKeys.forEach(function(akey) {
          const dataType = zclId._getCluster(ckey).attrType.get(akey),
            hitA = zclId.attrType(ckey, akey),
            hitB = zclId.dataType(dataType.value)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get right item by cId string and attrId number", function() {
      cIdKeys.forEach(function(ckey) {
        if (!clusterDefs[ckey]) return

        const attrIdVals = []

        for (const k in clusterDefs[ckey].attrId) {
          attrIdVals.push(clusterDefs[ckey].attrId[k].id)
        }

        attrIdVals.forEach(function(aval) {
          const attrId = zclId.attr(ckey, aval),
            dataType = zclId._getCluster(ckey).attrType.get(attrId.key),
            hitA = zclId.attrType(ckey, aval),
            hitB = zclId.dataType(dataType.value)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get right item by cId number and attrId string", function() {
      cIdVals.forEach(function(cval) {
        const cId = zclId.cluster(cval)

        if (!clusterDefs[cId.key]) return

        const attrIdKeys = []

        for (const k in clusterDefs[cId.key].attrId) {
          attrIdKeys.push(k)
        }

        attrIdKeys.forEach(function(akey) {
          const dataType = zclId._getCluster(cId.key).attrType.get(akey),
            hitA = zclId.attrType(cval, akey),
            hitB = zclId.dataType(dataType.value)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get right item by cId number and attrId number", function() {
      cIdVals.forEach(function(cval) {
        const cId = zclId.cluster(cval)

        if (!clusterDefs[cId.key]) return

        const attrIdVals = []

        for (const k in clusterDefs[cId.key].attrId) {
          attrIdVals.push(clusterDefs[cId.key].attrId[k].id)
        }

        attrIdVals.forEach(function(aval) {
          const attrId = zclId.attr(cval, aval),
            dataType = zclId._getCluster(cId.key).attrType.get(attrId.key),
            hitA = zclId.attrType(cval, aval),
            hitB = zclId.dataType(dataType.value)

          expect(hitA).not.to.be.undefined
          expect(hitA.key).to.be.eql(hitB.key)
          expect(hitA.value).to.be.eql(hitB.value)
        })
      })
    })

    it("should get undefined if target not found", function() {
      expect(zclId.attrType("genBasic", "dddd")).to.be.undefined
      expect(zclId.attrType("genBasic", 12345)).to.be.undefined
      expect(zclId.attrType(3, "dddd")).to.be.undefined
      expect(zclId.attrType(3, 12345)).to.be.undefined
    })

    it("should get an item if target is found", function() {
      expect(zclId.attr("genBasic", "zclVersion")).not.to.be.undefined
      expect(zclId.attr("genBasic", 0)).not.to.be.undefined
      expect(zclId.attr(0, "zclVersion")).not.to.be.undefined
      expect(zclId.attr(0, 0)).not.to.be.undefined
    })
  })

  describe("#.dataType", function() {
    it("should get right item by type string", function() {
      dataTypeKeys.forEach(function(dkey) {
        const hitA = zclId.dataType(dkey),
          hitB = zclId.dataTypeId.get(dkey)

        expect(hitA).not.to.be.undefined
        expect(hitA.key).to.be.eql(hitB.key)
        expect(hitA.value).to.be.eql(hitB.value)
      })
    })

    it("should get right item by type number", function() {
      dataTypeVals.forEach(function(dval) {
        const hitA = zclId.dataType(dval),
          hitB = zclId.dataTypeId.get(dval)

        expect(hitA).not.to.be.undefined
        expect(hitA.key).to.be.eql(hitB.key)
        expect(hitA.value).to.be.eql(hitB.value)
      })
    })

    it("should get undefined if type not found", function() {
      expect(zclId.dataType("xxx")).to.be.undefined
      expect(zclId.dataType(12345)).to.be.undefined
    })
  })

  describe("#.status", function() {
    it("should get right item by type string", function() {
      statusKeys.forEach(function(dkey) {
        const hitA = zclId.status(dkey),
          hitB = zclId.statusId.get(dkey)

        expect(hitA).not.to.be.undefined
        expect(hitA.key).to.be.eql(hitB.key)
        expect(hitA.value).to.be.eql(hitB.value)
      })
    })

    it("should get right item by type number", function() {
      statusVals.forEach(function(dval) {
        const hitA = zclId.status(dval),
          hitB = zclId.statusId.get(dval)

        expect(hitA).not.to.be.undefined
        expect(hitA.key).to.be.eql(hitB.key)
        expect(hitA.value).to.be.eql(hitB.value)
      })
    })

    it("should get undefined if type not found", function() {
      expect(zclId.status("xxx")).to.be.undefined
      expect(zclId.status(12345)).to.be.undefined
    })
  })

  describe("#.attrList", function() {
    it("should get right list by zclId.cluster string id", function() {
      expect(zclId.attrList("genDeviceTempCfg")).to.be.deep.equal([
        { attrId: 0, dataType: 41 },
        { attrId: 1, dataType: 41 },
        { attrId: 2, dataType: 41 },
        { attrId: 3, dataType: 33 },
        { attrId: 16, dataType: 24 },
        { attrId: 17, dataType: 41 },
        { attrId: 18, dataType: 41 },
        { attrId: 19, dataType: 34 },
        { attrId: 20, dataType: 34 }
      ])
    })

    it("should get right list by cluster numeric id", function() {
      expect(zclId.attrList(2)).to.be.deep.equal([
        { attrId: 0, dataType: 41 },
        { attrId: 1, dataType: 41 },
        { attrId: 2, dataType: 41 },
        { attrId: 3, dataType: 33 },
        { attrId: 16, dataType: 24 },
        { attrId: 17, dataType: 41 },
        { attrId: 18, dataType: 41 },
        { attrId: 19, dataType: 34 },
        { attrId: 20, dataType: 34 }
      ])
    })

    it("should be undefined if cluster not found", function() {
      expect(zclId.attrList("genDeviceTempCfgxx")).to.be.undefined
    })
  })
})
