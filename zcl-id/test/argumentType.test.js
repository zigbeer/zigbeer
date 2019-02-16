const { zclId } = require("./zclId")

describe("#._getCluster", function() {
  it("should be a function", function() {
    expect(typeof zclId._getCluster).toBe("function")
  })
})

describe("#.profile", function() {
  it("should be a function", function() {
    expect(typeof zclId.profile).toBe("function")
  })

  it("should throw TypeError if input profId is not a number and not a string", function() {
    expect(function() {
      return zclId.profile()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.profile(undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.profile(null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.profile(NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.profile([])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.profile({})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.profile(true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.profile(new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.profile(function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.profile(260)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.profile("260")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.profile(0x0104)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.profile("0x0104")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.profile("HA")
    }).not.toThrowError(Error)
  })
})

describe("#.device", function() {
  it("should be a function", function() {
    expect(typeof zclId.device).toBe("function")
  })

  it("should throw TypeError if input profId is not a number and not a string", function() {
    expect(function() {
      return zclId.device()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(undefined, 5)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(null, 5)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(NaN, 5)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device([], 5)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device({}, 5)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(true, 5)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(new Date(), 5)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(function() {}, 5)
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.device()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(undefined, "5")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(null, "5")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(NaN, "5")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device([], "5")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device({}, "5")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(true, "5")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(new Date(), "5")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(function() {}, "5")
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.device()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(undefined, 0x0005)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(null, 0x0005)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(NaN, 0x0005)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device([], 0x0005)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device({}, 0x0005)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(true, 0x0005)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(new Date(), 0x0005)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(function() {}, 0x0005)
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.device()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(undefined, "CONFIGURATION_TOOL")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(null, "CONFIGURATION_TOOL")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(NaN, "CONFIGURATION_TOOL")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device([], "CONFIGURATION_TOOL")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device({}, "CONFIGURATION_TOOL")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(true, "CONFIGURATION_TOOL")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(new Date(), "CONFIGURATION_TOOL")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(function() {}, "CONFIGURATION_TOOL")
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.device(260, 5)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device(260, "5")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device(260, 0x0005)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device(260, "CONFIGURATION_TOOL")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device("260", 5)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device("260", "5")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device("260", 0x0005)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device("260", "CONFIGURATION_TOOL")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device(0x104, 5)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device(0x104, "5")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device(0x104, 0x0005)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device(0x104, "CONFIGURATION_TOOL")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device("HA", 5)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device("HA", "5")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device("HA", 0x0005)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device("HA", "CONFIGURATION_TOOL")
    }).not.toThrowError(Error)
  })

  it("should throw TypeError if input devId is not a number and not a string", function() {
    expect(function() {
      return zclId.device()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(260, undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(260, null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(260, NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(260, [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(260, {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(260, true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(260, new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(260, function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.device()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device("260", undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device("260", null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device("260", NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device("260", [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device("260", {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device("260", true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device("260", new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device("260", function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.device()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(0x0104, undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(0x0104, null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(0x0104, NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(0x0104, [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(0x0104, {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(0x0104, true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(0x0104, new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device(0x0104, function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.device()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device("HA", undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device("HA", null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device("HA", NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device("HA", [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device("HA", {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device("HA", true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device("HA", new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.device("HA", function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.device(260, 5)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device(260, "5")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device(260, 0x0005)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device(260, "CONFIGURATION_TOOL")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device("260", 5)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device("260", "5")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device("260", 0x0005)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device("260", "CONFIGURATION_TOOL")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device(0x104, 5)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device(0x104, "5")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device(0x104, 0x0005)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device(0x104, "CONFIGURATION_TOOL")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device("HA", 5)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device("HA", "5")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device("HA", 0x0005)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.device("HA", "CONFIGURATION_TOOL")
    }).not.toThrowError(Error)
  })
})

describe("#.cluster", function() {
  it("should be a function", function() {
    expect(typeof zclId.cluster).toBe("function")
  })

  it("should throw TypeError if input cId is not a number and not a string", function() {
    expect(function() {
      return zclId.cluster()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.cluster(undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.cluster(null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.cluster(NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.cluster([])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.cluster({})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.cluster(true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.cluster(new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.cluster(function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.cluster(3)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.cluster("3")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.cluster(0x0003)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.cluster("0x0003")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.cluster("genIdentify")
    }).not.toThrowError(Error)
  })
})

describe("#.foundation", function() {
  it("should be a function", function() {
    expect(typeof zclId.foundation).toBe("function")
  })

  it("should throw TypeError if input cmdId is not a number and not a string", function() {
    expect(function() {
      return zclId.foundation()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.foundation(undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.foundation(null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.foundation(NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.foundation([])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.foundation({})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.foundation(true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.foundation(new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.foundation(function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.foundation(3)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.foundation("3")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.foundation(0x0003)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.foundation("0x0003")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.foundation("writeUndiv")
    }).not.toThrowError(Error)
  })
})

describe("#.functional", function() {
  it("should be a function", function() {
    expect(typeof zclId.functional).toBe("function")
  })

  it("should throw TypeError if input cId is not a number and not a string", function() {
    expect(function() {
      return zclId.functional()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(undefined, 5)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(null, 5)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(NaN, 5)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional([], 5)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional({}, 5)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(true, 5)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(new Date(), 5)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(function() {}, 5)
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.functional()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(undefined, "5")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(null, "5")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(NaN, "5")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional([], "5")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional({}, "5")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(true, "5")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(new Date(), "5")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(function() {}, "5")
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.functional()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(undefined, 0x0005)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(null, 0x0005)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(NaN, 0x0005)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional([], 0x0005)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional({}, 0x0005)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(true, 0x0005)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(new Date(), 0x0005)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(function() {}, 0x0005)
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.functional()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(undefined, "writeNoRsp")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(null, "writeNoRsp")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(NaN, "writeNoRsp")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional([], "writeNoRsp")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional({}, "writeNoRsp")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(true, "writeNoRsp")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(new Date(), "writeNoRsp")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(function() {}, "writeNoRsp")
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.functional(5, 5)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional(5, "5")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional(5, 0x05)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional(5, "recall")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional("5", 5)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional("5", "5")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional("5", 0x05)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional("5", "recall")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional(0x0005, 5)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional(0x0005, "5")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional(0x0005, 0x05)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional(0x0005, "recall")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional("genScenes", 5)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional("genScenes", "5")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional("genScenes", 0x05)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional("genScenes", "recall")
    }).not.toThrowError(Error)
  })

  it("should throw TypeError if input cmdId is not a number and not a string", function() {
    expect(function() {
      return zclId.functional()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(5, undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(5, null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(5, NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(5, [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(5, {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(5, true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(5, new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(5, function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.functional()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional("5", undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional("5", null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional("5", NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional("5", [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional("5", {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional("5", true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional("5", new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional("5", function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.functional()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(0x0005, undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(0x0005, null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(0x0005, NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(0x0005, [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(0x0005, {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(0x0005, true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(0x0005, new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional(0x0005, function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.functional()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional("genScenes", undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional("genScenes", null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional("genScenes", NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional("genScenes", [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional("genScenes", {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional("genScenes", true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional("genScenes", new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.functional("genScenes", function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.functional(5, 5)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional(5, "5")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional(5, 0x05)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional(5, "recall")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional("5", 5)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional("5", "5")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional("5", 0x05)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional("5", "recall")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional(0x0005, 5)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional(0x0005, "5")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional(0x0005, 0x05)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional(0x0005, "recall")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional("genScenes", 5)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional("genScenes", "5")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional("genScenes", 0x05)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.functional("genScenes", "recall")
    }).not.toThrowError(Error)
  })
})

describe("#.getCmdRsp", function() {
  it("should be a function", function() {
    expect(typeof zclId.getCmdRsp).toBe("function")
  })

  it("should throw TypeError if input cId is not a number and not a string", function() {
    expect(function() {
      return zclId.getCmdRsp()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(undefined, 0)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(null, 0)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(NaN, 0)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp([], 0)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp({}, 0)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(true, 0)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(new Date(), 0)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(function() {}, 0)
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.getCmdRsp()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(undefined, "0")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(null, "0")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(NaN, "0")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp([], "0")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp({}, "0")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(true, "0")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(new Date(), "0")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(function() {}, "0")
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.getCmdRsp()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(undefined, 0x00)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(null, 0x00)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(NaN, 0x00)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp([], 0x00)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp({}, 0x00)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(true, 0x00)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(new Date(), 0x00)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(function() {}, 0x00)
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.getCmdRsp()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(undefined, "Rsp")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(null, "Rsp")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(NaN, "Rsp")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp([], "Rsp")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp({}, "Rsp")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(true, "Rsp")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(new Date(), "Rsp")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(function() {}, "Rsp")
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.getCmdRsp(5, 0)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp(5, "0")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp(5, 0x00)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp(5, "Rsp")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp("5", 0)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp("5", "0")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp("5", 0x00)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp("5", "Rsp")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp(0x0005, 0)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp(0x0005, "0")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp(0x0005, 0x00)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp(0x0005, "Rsp")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp("genScenes", 0)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp("genScenes", "0")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp("genScenes", 0x00)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp("genScenes", "Rsp")
    }).not.toThrowError(Error)
  })

  it("should throw TypeError if input rspId is not a number and not a string", function() {
    expect(function() {
      return zclId.getCmdRsp()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(5, undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(5, null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(5, NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(5, [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(5, {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(5, true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(5, new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(5, function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.getCmdRsp()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp("5", undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp("5", null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp("5", NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp("5", [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp("5", {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp("5", true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp("5", new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp("5", function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.getCmdRsp()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(0x0005, undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(0x0005, null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(0x0005, NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(0x0005, [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(0x0005, {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(0x0005, true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(0x0005, new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp(0x0005, function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.getCmdRsp()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp("genScenes", undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp("genScenes", null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp("genScenes", NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp("genScenes", [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp("genScenes", {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp("genScenes", true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp("genScenes", new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.getCmdRsp("genScenes", function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.getCmdRsp(5, 0)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp(5, "0")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp(5, 0x00)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp(5, "Rsp")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp("5", 0)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp("5", "0")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp("5", 0x00)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp("5", "Rsp")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp(0x0005, 0)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp(0x0005, "0")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp(0x0005, 0x00)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp(0x0005, "Rsp")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp("genScenes", 0)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp("genScenes", "0")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp("genScenes", 0x00)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.getCmdRsp("genScenes", "Rsp")
    }).not.toThrowError(Error)
  })
})

describe("#.attrList", function() {
  it("should be a function", function() {
    expect(typeof zclId.attrList).toBe("function")
  })

  it("should throw TypeError if input cId is not a number and not a string", function() {
    expect(function() {
      return zclId.attrList()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrList(undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrList(null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrList(NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrList([])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrList({})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrList(true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrList(new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrList(function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.attrList(3)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrList("3")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrList(0x0003)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrList("0x0003")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrList("genIdentify")
    }).not.toThrowError(Error)
  })
})

describe("#.attr", function() {
  it("should be a function", function() {
    expect(typeof zclId.attr).toBe("function")
  })

  it("should throw TypeError if input cId is not a number and not a string", function() {
    expect(function() {
      return zclId.attr()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(undefined, 2)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(null, 2)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(NaN, 2)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr([], 2)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr({}, 2)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(true, 2)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(new Date(), 2)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(function() {}, 2)
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.attr()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(undefined, "2")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(null, "2")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(NaN, "2")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr([], "2")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr({}, "2")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(true, "2")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(new Date(), "2")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(function() {}, "2")
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.attr()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(undefined, 0x0002)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(null, 0x0002)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(NaN, 0x0002)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr([], 0x0002)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr({}, 0x0002)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(true, 0x0002)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(new Date(), 0x0002)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(function() {}, 0x0002)
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.attr()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(undefined, "currentGroup")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(null, "currentGroup")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(NaN, "currentGroup")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr([], "currentGroup")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr({}, "currentGroup")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(true, "currentGroup")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(new Date(), "currentGroup")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(function() {}, "currentGroup")
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.attr(5, 2)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr(5, "2")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr(5, 0x0002)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr(5, "currentGroup")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr("5", 2)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr("5", "2")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr("5", 0x0002)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr("5", "currentGroup")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr(0x0005, 2)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr(0x0005, "2")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr(0x0005, 0x0002)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr(0x0005, "currentGroup")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr("genScenes", 2)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr("genScenes", "2")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr("genScenes", 0x0002)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr("genScenes", "currentGroup")
    }).not.toThrowError(Error)
  })

  it("should throw TypeError if input attrId is not a number and not a string", function() {
    expect(function() {
      return zclId.attr()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(5, undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(5, null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(5, NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(5, [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(5, {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(5, true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(5, new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(5, function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.attr()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr("5", undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr("5", null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr("5", NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr("5", [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr("5", {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr("5", true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr("5", new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr("5", function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.attr()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(0x0005, undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(0x0005, null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(0x0005, NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(0x0005, [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(0x0005, {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(0x0005, true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(0x0005, new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr(0x0005, function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.attr()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr("genScenes", undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr("genScenes", null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr("genScenes", NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr("genScenes", [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr("genScenes", {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr("genScenes", true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr("genScenes", new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attr("genScenes", function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.attr(5, 2)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr(5, "2")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr(5, 0x0002)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr(5, "currentGroup")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr("5", 2)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr("5", "2")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr("5", 0x0002)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr("5", "currentGroup")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr(0x0005, 2)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr(0x0005, "2")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr(0x0005, 0x0002)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr(0x0005, "currentGroup")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr("genScenes", 2)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr("genScenes", "2")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr("genScenes", 0x0002)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attr("genScenes", "currentGroup")
    }).not.toThrowError(Error)
  })
})

describe("#.attrType", function() {
  it("should be a function", function() {
    expect(typeof zclId.attrType).toBe("function")
  })

  it("should throw TypeError if input cId is not a number and not a string", function() {
    expect(function() {
      return zclId.attrType()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(undefined, 2)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(null, 2)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(NaN, 2)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType([], 2)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType({}, 2)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(true, 2)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(new Date(), 2)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(function() {}, 2)
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.attrType()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(undefined, "2")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(null, "2")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(NaN, "2")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType([], "2")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType({}, "2")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(true, "2")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(new Date(), "2")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(function() {}, "2")
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.attrType()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(undefined, 0x0002)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(null, 0x0002)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(NaN, 0x0002)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType([], 0x0002)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType({}, 0x0002)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(true, 0x0002)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(new Date(), 0x0002)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(function() {}, 0x0002)
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.attrType()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(undefined, "currentGroup")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(null, "currentGroup")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(NaN, "currentGroup")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType([], "currentGroup")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType({}, "currentGroup")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(true, "currentGroup")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(new Date(), "currentGroup")
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(function() {}, "currentGroup")
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.attrType(5, 2)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType(5, "2")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType(5, 0x0002)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType(5, "currentGroup")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType("5", 2)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType("5", "2")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType("5", 0x0002)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType("5", "currentGroup")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType(0x0005, 2)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType(0x0005, "2")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType(0x0005, 0x0002)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType(0x0005, "currentGroup")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType("genScenes", 2)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType("genScenes", "2")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType("genScenes", 0x0002)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType("genScenes", "currentGroup")
    }).not.toThrowError(Error)
  })

  it("should throw TypeError if input attrId is not a number and not a string", function() {
    expect(function() {
      return zclId.attrType()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(5, undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(5, null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(5, NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(5, [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(5, {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(5, true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(5, new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(5, function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.attrType()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType("5", undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType("5", null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType("5", NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType("5", [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType("5", {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType("5", true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType("5", new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType("5", function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.attrType()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(0x0005, undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(0x0005, null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(0x0005, NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(0x0005, [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(0x0005, {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(0x0005, true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(0x0005, new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType(0x0005, function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.attrType()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType("genScenes", undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType("genScenes", null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType("genScenes", NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType("genScenes", [])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType("genScenes", {})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType("genScenes", true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType("genScenes", new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.attrType("genScenes", function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.attrType(5, 2)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType(5, "2")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType(5, 0x0002)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType(5, "currentGroup")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType("5", 2)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType("5", "2")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType("5", 0x0002)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType("5", "currentGroup")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType(0x0005, 2)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType(0x0005, "2")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType(0x0005, 0x0002)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType(0x0005, "currentGroup")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType("genScenes", 2)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType("genScenes", "2")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType("genScenes", 0x0002)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.attrType("genScenes", "currentGroup")
    }).not.toThrowError(Error)
  })
})

describe("#.dataType", function() {
  it("should be a function", function() {
    expect(typeof zclId.dataType).toBe("function")
  })

  it("should throw TypeError if input type is not a number and not a string", function() {
    expect(function() {
      return zclId.dataType()
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.dataType(undefined)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.dataType(null)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.dataType(NaN)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.dataType([])
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.dataType({})
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.dataType(true)
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.dataType(new Date())
    }).toThrowError(TypeError)
    expect(function() {
      return zclId.dataType(function() {})
    }).toThrowError(TypeError)

    expect(function() {
      return zclId.dataType(11)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.dataType("11")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.dataType(0x0b)
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.dataType("0x0b")
    }).not.toThrowError(Error)
    expect(function() {
      return zclId.dataType("DATA32")
    }).not.toThrowError(Error)
  })
})
