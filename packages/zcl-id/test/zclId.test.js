'use strict';
const _common = require("../src/definitions/common.json")

const { zclId } = require("./zclId")

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

describe("Module Methods Check", () => {
  describe("#.profile", () => {
    it("should get right item by profId string", () => {
      profIdKeys.forEach(pkey => {
        const hitA = zclId.profile(pkey);
        const hitB = zclId.profileId.get(pkey);

        expect(hitA).not.toBeUndefined()
        expect(hitA.key).toEqual(hitB.key)
        expect(hitA.value).toEqual(hitB.value)
      })
    })

    it("should get right item by profId number", () => {
      profIdVals.forEach(pval => {
        const hitA = zclId.profile(pval);
        const hitB = zclId.profileId.get(pval);

        expect(hitA).not.toBeUndefined()
        expect(hitA.key).toEqual(hitB.key)
        expect(hitA.value).toEqual(hitB.value)
      })
    })

    it("should get undefined if profId not found", () => {
      expect(zclId.profile("xxx")).toBeUndefined()
      expect(zclId.profile(12345)).toBeUndefined()
    })
  })

  describe("#.device", () => {
    it("should get right item by profId string and devId string", () => {
      profIdKeys.forEach(pkey => {
        if (!devIdKeys[pkey]) return

        devIdKeys[pkey].forEach(dkey => {
          const hitA = zclId.device(pkey, dkey);
          const hitB = zclId.deviceId[pkey].get(dkey);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get right item by profId string and devId number", () => {
      profIdKeys.forEach(pkey => {
        if (!devIdKeys[pkey]) return

        devIdVals[pkey].forEach(dval => {
          const hitA = zclId.device(pkey, dval);
          const hitB = zclId.deviceId[pkey].get(dval);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get right item by profId number and devId string", () => {
      profIdVals.forEach(pval => {
        const profId = zclId.profile(pval)

        if (!devIdKeys[profId.key]) return

        devIdKeys[profId.key].forEach(dkey => {
          const hitA = zclId.device(pval, dkey);
          const hitB = zclId.deviceId[profId.key].get(dkey);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get right item by profId number and devId number", () => {
      profIdVals.forEach(pval => {
        const profId = zclId.profile(pval)

        if (!devIdKeys[profId.key]) return

        devIdVals[profId.key].forEach(dval => {
          const hitA = zclId.device(pval, dval);
          const hitB = zclId.deviceId[profId.key].get(dval);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get undefined if target not found", () => {
      expect(zclId.device("HA", "dddd")).toBeUndefined()
      expect(zclId.device("HA", 12345)).toBeUndefined()
      expect(zclId.device(3, "dddd")).toBeUndefined()
      expect(zclId.device(3, 12345)).toBeUndefined()
    })

    it("should get an item if target is found", () => {
      expect(zclId.device("HA", "doorLock")).not.toBeUndefined()
      expect(zclId.device("HA", 4)).not.toBeUndefined()
      expect(zclId.device(260, "doorLock")).not.toBeUndefined()
      expect(zclId.device(260, 4)).not.toBeUndefined()
    })
  })

  describe("#.cluster", () => {
    it("should get right item by cId string", () => {
      cIdKeys.forEach(ckey => {
        const hitA = zclId.cluster(ckey);
        const hitB = zclId.clusterId.get(ckey);

        expect(hitA).not.toBeUndefined()
        expect(hitA.key).toEqual(hitB.key)
        expect(hitA.value).toEqual(hitB.value)
      })
    })

    it("should get right item by cId number", () => {
      cIdVals.forEach(cval => {
        const hitA = zclId.cluster(cval);
        const hitB = zclId.clusterId.get(cval);

        expect(hitA).not.toBeUndefined()
        expect(hitA.key).toEqual(hitB.key)
        expect(hitA.value).toEqual(hitB.value)
      })
    })

    it("should get undefined if cId not found", () => {
      expect(zclId.cluster("xxx")).toBeUndefined()
      expect(zclId.cluster(12345)).toBeUndefined()
    })
  })

  describe("#.foundation", () => {
    it("should get right item by cmdId string", () => {
      foundKeys.forEach(fkey => {
        const hitA = zclId.foundation(fkey);
        const hitB = zclId.foundationId.get(fkey);

        expect(hitA).not.toBeUndefined()
        expect(hitA.key).toEqual(hitB.key)
        expect(hitA.value).toEqual(hitB.value)
      })
    })

    it("should get right item by cmdId number", () => {
      foundVals.forEach(fval => {
        const hitA = zclId.foundation(fval);
        const hitB = zclId.foundationId.get(fval);

        expect(hitA).not.toBeUndefined()
        expect(hitA.key).toEqual(hitB.key)
        expect(hitA.value).toEqual(hitB.value)
      })
    })

    it("should get undefined if cmdId not found", () => {
      expect(zclId.foundation("xxx")).toBeUndefined()
      expect(zclId.foundation(12345)).toBeUndefined()
    })
  })

  describe("#.functional", () => {
    it("should get right item by cId string and cmdId string", () => {
      cIdKeys.forEach(ckey => {
        if (!clusterDefs[ckey]) return

        const cmdIdKeys = []

        for (const k in clusterDefs[ckey].cmd) {
          cmdIdKeys.push(k)
        }

        cmdIdKeys.forEach(cmdkey => {
          const hitA = zclId.functional(ckey, cmdkey);
          const hitB = zclId._getCluster(ckey).cmd.get(cmdkey);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get right item by cId string and cmdId number", () => {
      cIdKeys.forEach(ckey => {
        if (!clusterDefs[ckey]) return

        const cmdIdVals = []

        for (const k in clusterDefs[ckey].cmd) {
          cmdIdVals.push(clusterDefs[ckey].cmd[k])
        }

        cmdIdVals.forEach(cmdval => {
          const hitA = zclId.functional(ckey, cmdval);
          const hitB = zclId._getCluster(ckey).cmd.get(cmdval);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get right item by cId number and cmdId string", () => {
      cIdVals.forEach(cval => {
        const cId = zclId.cluster(cval)

        if (!clusterDefs[cId.key]) return

        const cmdIdKeys = []

        for (const k in clusterDefs[cId.key].cmd) {
          cmdIdKeys.push(k)
        }

        cmdIdKeys.forEach(cmdkey => {
          const hitA = zclId.functional(cval, cmdkey);
          const hitB = zclId._getCluster(cId.key).cmd.get(cmdkey);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get right item by cId number and cmdId number", () => {
      cIdVals.forEach(cval => {
        const cId = zclId.cluster(cval)

        if (!clusterDefs[cId.key]) return

        const cmdIdVals = []

        for (const k in clusterDefs[cId.key].cmd) {
          cmdIdVals.push(clusterDefs[cId.key].cmd[k])
        }

        cmdIdVals.forEach(cmdval => {
          const hitA = zclId.functional(cval, cmdval);
          const hitB = zclId._getCluster(cId.key).cmd.get(cmdval);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get undefined if target not found", () => {
      expect(zclId.functional("genOnOff", "dddd")).toBeUndefined()
      expect(zclId.functional("genOnOff", 12345)).toBeUndefined()
      expect(zclId.functional(3, "dddd")).toBeUndefined()
      expect(zclId.functional(3, 12345)).toBeUndefined()
    })

    it("should get an item if target is found", () => {
      expect(zclId.functional("genOnOff", "toggle")).not.toBeUndefined()
      expect(zclId.functional("genOnOff", 2)).not.toBeUndefined()
      expect(zclId.functional(6, "toggle")).not.toBeUndefined()
      expect(zclId.functional(6, 2)).not.toBeUndefined()
    })
  })

  describe("#.getCmdRsp", () => {
    it("should get right item by cId string and cmdId string", () => {
      cIdKeys.forEach(ckey => {
        if (!clusterDefs[ckey]) return

        const cmdIdKeys = []

        for (const k in clusterDefs[ckey].cmdRsp) {
          cmdIdKeys.push(k)
        }

        cmdIdKeys.forEach(cmdkey => {
          const hitA = zclId.getCmdRsp(ckey, cmdkey);
          const hitB = zclId._getCluster(ckey).cmdRsp.get(cmdkey);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get right item by cId string and cmdId number", () => {
      cIdKeys.forEach(ckey => {
        if (!clusterDefs[ckey]) return

        const cmdIdVals = []

        for (const k in clusterDefs[ckey].cmdRsp) {
          cmdIdVals.push(clusterDefs[ckey].cmdRsp[k])
        }

        cmdIdVals.forEach(cmdval => {
          const hitA = zclId.getCmdRsp(ckey, cmdval);
          const hitB = zclId._getCluster(ckey).cmdRsp.get(cmdval);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get right item by cId number and cmdId string", () => {
      cIdVals.forEach(cval => {
        const cId = zclId.cluster(cval)

        if (!clusterDefs[cId.key]) return

        const cmdIdKeys = []

        for (const k in clusterDefs[cId.key].cmdRsp) {
          cmdIdKeys.push(k)
        }

        cmdIdKeys.forEach(cmdkey => {
          const hitA = zclId.getCmdRsp(cval, cmdkey);
          const hitB = zclId._getCluster(cId.key).cmdRsp.get(cmdkey);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get right item by cId number and cmdId number", () => {
      cIdVals.forEach(cval => {
        const cId = zclId.cluster(cval)

        if (!clusterDefs[cId.key]) return

        const cmdIdVals = []

        for (const k in clusterDefs[cId.key].cmdRsp) {
          cmdIdVals.push(clusterDefs[cId.key].cmdRsp[k])
        }

        cmdIdVals.forEach(cmdval => {
          const hitA = zclId.getCmdRsp(cval, cmdval);
          const hitB = zclId._getCluster(cId.key).cmdRsp.get(cmdval);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get undefined if target not found", () => {
      expect(zclId.getCmdRsp("ssIasZone", "dddd")).toBeUndefined()
      expect(zclId.getCmdRsp("ssIasZone", 12345)).toBeUndefined()
      expect(zclId.getCmdRsp(1280, "dddd")).toBeUndefined()
      expect(zclId.getCmdRsp(1280, 12345)).toBeUndefined()
    })

    it("should get an item if target is found", () => {
      expect(zclId.getCmdRsp("ssIasZone", "enrollReq")).not.toBeUndefined()
      expect(zclId.getCmdRsp("ssIasZone", 1)).not.toBeUndefined()
      expect(zclId.getCmdRsp(1280, "enrollReq")).not.toBeUndefined()
      expect(zclId.getCmdRsp(1280, 1)).not.toBeUndefined()
    })
  })

  describe("#.attr", () => {
    it("should get right item by cId string and attrId string", () => {
      cIdKeys.forEach(ckey => {
        if (!clusterDefs[ckey]) return

        const attrIdKeys = []

        for (const k in clusterDefs[ckey].attrId) {
          attrIdKeys.push(k)
        }

        attrIdKeys.forEach(akey => {
          const hitA = zclId.attr(ckey, akey);
          const hitB = zclId._getCluster(ckey).attr.get(akey);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get right item by cId string and attrId number", () => {
      cIdKeys.forEach(ckey => {
        if (!clusterDefs[ckey]) return

        const attrIdVals = []

        for (const k in clusterDefs[ckey].attrId) {
          attrIdVals.push(clusterDefs[ckey].attrId[k].id)
        }

        attrIdVals.forEach(aval => {
          const hitA = zclId.attr(ckey, aval);
          const hitB = zclId._getCluster(ckey).attr.get(aval);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get right item by cId number and attrId string", () => {
      cIdVals.forEach(cval => {
        const cId = zclId.cluster(cval)

        if (!clusterDefs[cId.key]) return

        const attrIdKeys = []

        for (const k in clusterDefs[cId.key].attrId) {
          attrIdKeys.push(k)
        }

        attrIdKeys.forEach(akey => {
          const hitA = zclId.attr(cval, akey);
          const hitB = zclId._getCluster(cId.key).attr.get(akey);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get right item by cId number and attrId number", () => {
      cIdVals.forEach(cval => {
        const cId = zclId.cluster(cval)

        if (!clusterDefs[cId.key]) return

        const attrIdVals = []

        for (const k in clusterDefs[cId.key].attrId) {
          attrIdVals.push(clusterDefs[cId.key].attrId[k].id)
        }

        attrIdVals.forEach(aval => {
          const hitA = zclId.attr(cval, aval);
          const hitB = zclId._getCluster(cId.key).attr.get(aval);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get undefined if target not found", () => {
      expect(zclId.attr("genBasic", "dddd")).toBeUndefined()
      expect(zclId.attr("genBasic", 12345)).toBeUndefined()
      expect(zclId.attr(3, "dddd")).toBeUndefined()
      expect(zclId.attr(3, 12345)).toBeUndefined()
    })

    it("should get an item if target is found", () => {
      expect(zclId.attr("genBasic", "zclVersion")).not.toBeUndefined()
      expect(zclId.attr("genBasic", 0)).not.toBeUndefined()
      expect(zclId.attr(0, "zclVersion")).not.toBeUndefined()
      expect(zclId.attr(0, 0)).not.toBeUndefined()
    })
  })

  describe("#.attrType", () => {
    it("should get right item by cId string and attrId string", () => {
      cIdKeys.forEach(ckey => {
        if (!clusterDefs[ckey]) return

        const attrIdKeys = []

        for (const k in clusterDefs[ckey].attrId) {
          attrIdKeys.push(k)
        }

        attrIdKeys.forEach(akey => {
          const dataType = zclId._getCluster(ckey).attrType.get(akey);
          const hitA = zclId.attrType(ckey, akey);
          const hitB = zclId.dataType(dataType.value);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get right item by cId string and attrId number", () => {
      cIdKeys.forEach(ckey => {
        if (!clusterDefs[ckey]) return

        const attrIdVals = []

        for (const k in clusterDefs[ckey].attrId) {
          attrIdVals.push(clusterDefs[ckey].attrId[k].id)
        }

        attrIdVals.forEach(aval => {
          const attrId = zclId.attr(ckey, aval);
          const dataType = zclId._getCluster(ckey).attrType.get(attrId.key);
          const hitA = zclId.attrType(ckey, aval);
          const hitB = zclId.dataType(dataType.value);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get right item by cId number and attrId string", () => {
      cIdVals.forEach(cval => {
        const cId = zclId.cluster(cval)

        if (!clusterDefs[cId.key]) return

        const attrIdKeys = []

        for (const k in clusterDefs[cId.key].attrId) {
          attrIdKeys.push(k)
        }

        attrIdKeys.forEach(akey => {
          const dataType = zclId._getCluster(cId.key).attrType.get(akey);
          const hitA = zclId.attrType(cval, akey);
          const hitB = zclId.dataType(dataType.value);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get right item by cId number and attrId number", () => {
      cIdVals.forEach(cval => {
        const cId = zclId.cluster(cval)

        if (!clusterDefs[cId.key]) return

        const attrIdVals = []

        for (const k in clusterDefs[cId.key].attrId) {
          attrIdVals.push(clusterDefs[cId.key].attrId[k].id)
        }

        attrIdVals.forEach(aval => {
          const attrId = zclId.attr(cval, aval);
          const dataType = zclId._getCluster(cId.key).attrType.get(attrId.key);
          const hitA = zclId.attrType(cval, aval);
          const hitB = zclId.dataType(dataType.value);

          expect(hitA).not.toBeUndefined()
          expect(hitA.key).toEqual(hitB.key)
          expect(hitA.value).toEqual(hitB.value)
        })
      })
    })

    it("should get undefined if target not found", () => {
      expect(zclId.attrType("genBasic", "dddd")).toBeUndefined()
      expect(zclId.attrType("genBasic", 12345)).toBeUndefined()
      expect(zclId.attrType(3, "dddd")).toBeUndefined()
      expect(zclId.attrType(3, 12345)).toBeUndefined()
    })

    it("should get an item if target is found", () => {
      expect(zclId.attr("genBasic", "zclVersion")).not.toBeUndefined()
      expect(zclId.attr("genBasic", 0)).not.toBeUndefined()
      expect(zclId.attr(0, "zclVersion")).not.toBeUndefined()
      expect(zclId.attr(0, 0)).not.toBeUndefined()
    })
  })

  describe("#.dataType", () => {
    it("should get right item by type string", () => {
      dataTypeKeys.forEach(dkey => {
        const hitA = zclId.dataType(dkey);
        const hitB = zclId.dataTypeId.get(dkey);

        expect(hitA).not.toBeUndefined()
        expect(hitA.key).toEqual(hitB.key)
        expect(hitA.value).toEqual(hitB.value)
      })
    })

    it("should get right item by type number", () => {
      dataTypeVals.forEach(dval => {
        const hitA = zclId.dataType(dval);
        const hitB = zclId.dataTypeId.get(dval);

        expect(hitA).not.toBeUndefined()
        expect(hitA.key).toEqual(hitB.key)
        expect(hitA.value).toEqual(hitB.value)
      })
    })

    it("should get undefined if type not found", () => {
      expect(zclId.dataType("xxx")).toBeUndefined()
      expect(zclId.dataType(12345)).toBeUndefined()
    })
  })

  describe("#.status", () => {
    it("should get right item by type string", () => {
      statusKeys.forEach(dkey => {
        const hitA = zclId.status(dkey);
        const hitB = zclId.statusId.get(dkey);

        expect(hitA).not.toBeUndefined()
        expect(hitA.key).toEqual(hitB.key)
        expect(hitA.value).toEqual(hitB.value)
      })
    })

    it("should get right item by type number", () => {
      statusVals.forEach(dval => {
        const hitA = zclId.status(dval);
        const hitB = zclId.statusId.get(dval);

        expect(hitA).not.toBeUndefined()
        expect(hitA.key).toEqual(hitB.key)
        expect(hitA.value).toEqual(hitB.value)
      })
    })

    it("should get undefined if type not found", () => {
      expect(zclId.status("xxx")).toBeUndefined()
      expect(zclId.status(12345)).toBeUndefined()
    })
  })

  describe("#.attrList", () => {
    it("should get right list by zclId.cluster string id", () => {
      expect(zclId.attrList("genDeviceTempCfg")).toEqual([
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

    it("should get right list by cluster numeric id", () => {
      expect(zclId.attrList(2)).toEqual([
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

    it("should be undefined if cluster not found", () => {
      expect(zclId.attrList("genDeviceTempCfgxx")).toBeUndefined()
    })
  })
})
