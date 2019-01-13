const { expect } = require('chai')

const {
  profile,
  device,
  cluster,
  foundation,
  functional,
  _getCluster,
  getCmdRsp,
  attr,
  attrType,
  dataType,
  attrList
} = require('../src')

describe('#._getCluster', function() {
  it('should be a function', function() {
    expect(_getCluster).to.be.a('function')
  })
})

describe('#.profile', function() {
  it('should be a function', function() {
    expect(profile).to.be.a('function')
  })

  it('should throw TypeError if input profId is not a number and not a string', function() {
    expect(function() {
      return profile()
    }).to.throw(TypeError)
    expect(function() {
      return profile(undefined)
    }).to.throw(TypeError)
    expect(function() {
      return profile(null)
    }).to.throw(TypeError)
    expect(function() {
      return profile(NaN)
    }).to.throw(TypeError)
    expect(function() {
      return profile([])
    }).to.throw(TypeError)
    expect(function() {
      return profile({})
    }).to.throw(TypeError)
    expect(function() {
      return profile(true)
    }).to.throw(TypeError)
    expect(function() {
      return profile(new Date())
    }).to.throw(TypeError)
    expect(function() {
      return profile(function() {})
    }).to.throw(TypeError)

    expect(function() {
      return profile(260)
    }).not.to.throw(Error)
    expect(function() {
      return profile('260')
    }).not.to.throw(Error)
    expect(function() {
      return profile(0x0104)
    }).not.to.throw(Error)
    expect(function() {
      return profile('0x0104')
    }).not.to.throw(Error)
    expect(function() {
      return profile('HA')
    }).not.to.throw(Error)
  })
})

describe('#.device', function() {
  it('should be a function', function() {
    expect(device).to.be.a('function')
  })

  it('should throw TypeError if input profId is not a number and not a string', function() {
    expect(function() {
      return device()
    }).to.throw(TypeError)
    expect(function() {
      return device(undefined, 5)
    }).to.throw(TypeError)
    expect(function() {
      return device(null, 5)
    }).to.throw(TypeError)
    expect(function() {
      return device(NaN, 5)
    }).to.throw(TypeError)
    expect(function() {
      return device([], 5)
    }).to.throw(TypeError)
    expect(function() {
      return device({}, 5)
    }).to.throw(TypeError)
    expect(function() {
      return device(true, 5)
    }).to.throw(TypeError)
    expect(function() {
      return device(new Date(), 5)
    }).to.throw(TypeError)
    expect(function() {
      return device(function() {}, 5)
    }).to.throw(TypeError)

    expect(function() {
      return device()
    }).to.throw(TypeError)
    expect(function() {
      return device(undefined, '5')
    }).to.throw(TypeError)
    expect(function() {
      return device(null, '5')
    }).to.throw(TypeError)
    expect(function() {
      return device(NaN, '5')
    }).to.throw(TypeError)
    expect(function() {
      return device([], '5')
    }).to.throw(TypeError)
    expect(function() {
      return device({}, '5')
    }).to.throw(TypeError)
    expect(function() {
      return device(true, '5')
    }).to.throw(TypeError)
    expect(function() {
      return device(new Date(), '5')
    }).to.throw(TypeError)
    expect(function() {
      return device(function() {}, '5')
    }).to.throw(TypeError)

    expect(function() {
      return device()
    }).to.throw(TypeError)
    expect(function() {
      return device(undefined, 0x0005)
    }).to.throw(TypeError)
    expect(function() {
      return device(null, 0x0005)
    }).to.throw(TypeError)
    expect(function() {
      return device(NaN, 0x0005)
    }).to.throw(TypeError)
    expect(function() {
      return device([], 0x0005)
    }).to.throw(TypeError)
    expect(function() {
      return device({}, 0x0005)
    }).to.throw(TypeError)
    expect(function() {
      return device(true, 0x0005)
    }).to.throw(TypeError)
    expect(function() {
      return device(new Date(), 0x0005)
    }).to.throw(TypeError)
    expect(function() {
      return device(function() {}, 0x0005)
    }).to.throw(TypeError)

    expect(function() {
      return device()
    }).to.throw(TypeError)
    expect(function() {
      return device(undefined, 'CONFIGURATION_TOOL')
    }).to.throw(TypeError)
    expect(function() {
      return device(null, 'CONFIGURATION_TOOL')
    }).to.throw(TypeError)
    expect(function() {
      return device(NaN, 'CONFIGURATION_TOOL')
    }).to.throw(TypeError)
    expect(function() {
      return device([], 'CONFIGURATION_TOOL')
    }).to.throw(TypeError)
    expect(function() {
      return device({}, 'CONFIGURATION_TOOL')
    }).to.throw(TypeError)
    expect(function() {
      return device(true, 'CONFIGURATION_TOOL')
    }).to.throw(TypeError)
    expect(function() {
      return device(new Date(), 'CONFIGURATION_TOOL')
    }).to.throw(TypeError)
    expect(function() {
      return device(function() {}, 'CONFIGURATION_TOOL')
    }).to.throw(TypeError)

    expect(function() {
      return device(260, 5)
    }).not.to.throw(Error)
    expect(function() {
      return device(260, '5')
    }).not.to.throw(Error)
    expect(function() {
      return device(260, 0x0005)
    }).not.to.throw(Error)
    expect(function() {
      return device(260, 'CONFIGURATION_TOOL')
    }).not.to.throw(Error)
    expect(function() {
      return device('260', 5)
    }).not.to.throw(Error)
    expect(function() {
      return device('260', '5')
    }).not.to.throw(Error)
    expect(function() {
      return device('260', 0x0005)
    }).not.to.throw(Error)
    expect(function() {
      return device('260', 'CONFIGURATION_TOOL')
    }).not.to.throw(Error)
    expect(function() {
      return device(0x104, 5)
    }).not.to.throw(Error)
    expect(function() {
      return device(0x104, '5')
    }).not.to.throw(Error)
    expect(function() {
      return device(0x104, 0x0005)
    }).not.to.throw(Error)
    expect(function() {
      return device(0x104, 'CONFIGURATION_TOOL')
    }).not.to.throw(Error)
    expect(function() {
      return device('HA', 5)
    }).not.to.throw(Error)
    expect(function() {
      return device('HA', '5')
    }).not.to.throw(Error)
    expect(function() {
      return device('HA', 0x0005)
    }).not.to.throw(Error)
    expect(function() {
      return device('HA', 'CONFIGURATION_TOOL')
    }).not.to.throw(Error)
  })

  it('should throw TypeError if input devId is not a number and not a string', function() {
    expect(function() {
      return device()
    }).to.throw(TypeError)
    expect(function() {
      return device(260, undefined)
    }).to.throw(TypeError)
    expect(function() {
      return device(260, null)
    }).to.throw(TypeError)
    expect(function() {
      return device(260, NaN)
    }).to.throw(TypeError)
    expect(function() {
      return device(260, [])
    }).to.throw(TypeError)
    expect(function() {
      return device(260, {})
    }).to.throw(TypeError)
    expect(function() {
      return device(260, true)
    }).to.throw(TypeError)
    expect(function() {
      return device(260, new Date())
    }).to.throw(TypeError)
    expect(function() {
      return device(260, function() {})
    }).to.throw(TypeError)

    expect(function() {
      return device()
    }).to.throw(TypeError)
    expect(function() {
      return device('260', undefined)
    }).to.throw(TypeError)
    expect(function() {
      return device('260', null)
    }).to.throw(TypeError)
    expect(function() {
      return device('260', NaN)
    }).to.throw(TypeError)
    expect(function() {
      return device('260', [])
    }).to.throw(TypeError)
    expect(function() {
      return device('260', {})
    }).to.throw(TypeError)
    expect(function() {
      return device('260', true)
    }).to.throw(TypeError)
    expect(function() {
      return device('260', new Date())
    }).to.throw(TypeError)
    expect(function() {
      return device('260', function() {})
    }).to.throw(TypeError)

    expect(function() {
      return device()
    }).to.throw(TypeError)
    expect(function() {
      return device(0x0104, undefined)
    }).to.throw(TypeError)
    expect(function() {
      return device(0x0104, null)
    }).to.throw(TypeError)
    expect(function() {
      return device(0x0104, NaN)
    }).to.throw(TypeError)
    expect(function() {
      return device(0x0104, [])
    }).to.throw(TypeError)
    expect(function() {
      return device(0x0104, {})
    }).to.throw(TypeError)
    expect(function() {
      return device(0x0104, true)
    }).to.throw(TypeError)
    expect(function() {
      return device(0x0104, new Date())
    }).to.throw(TypeError)
    expect(function() {
      return device(0x0104, function() {})
    }).to.throw(TypeError)

    expect(function() {
      return device()
    }).to.throw(TypeError)
    expect(function() {
      return device('HA', undefined)
    }).to.throw(TypeError)
    expect(function() {
      return device('HA', null)
    }).to.throw(TypeError)
    expect(function() {
      return device('HA', NaN)
    }).to.throw(TypeError)
    expect(function() {
      return device('HA', [])
    }).to.throw(TypeError)
    expect(function() {
      return device('HA', {})
    }).to.throw(TypeError)
    expect(function() {
      return device('HA', true)
    }).to.throw(TypeError)
    expect(function() {
      return device('HA', new Date())
    }).to.throw(TypeError)
    expect(function() {
      return device('HA', function() {})
    }).to.throw(TypeError)

    expect(function() {
      return device(260, 5)
    }).not.to.throw(Error)
    expect(function() {
      return device(260, '5')
    }).not.to.throw(Error)
    expect(function() {
      return device(260, 0x0005)
    }).not.to.throw(Error)
    expect(function() {
      return device(260, 'CONFIGURATION_TOOL')
    }).not.to.throw(Error)
    expect(function() {
      return device('260', 5)
    }).not.to.throw(Error)
    expect(function() {
      return device('260', '5')
    }).not.to.throw(Error)
    expect(function() {
      return device('260', 0x0005)
    }).not.to.throw(Error)
    expect(function() {
      return device('260', 'CONFIGURATION_TOOL')
    }).not.to.throw(Error)
    expect(function() {
      return device(0x104, 5)
    }).not.to.throw(Error)
    expect(function() {
      return device(0x104, '5')
    }).not.to.throw(Error)
    expect(function() {
      return device(0x104, 0x0005)
    }).not.to.throw(Error)
    expect(function() {
      return device(0x104, 'CONFIGURATION_TOOL')
    }).not.to.throw(Error)
    expect(function() {
      return device('HA', 5)
    }).not.to.throw(Error)
    expect(function() {
      return device('HA', '5')
    }).not.to.throw(Error)
    expect(function() {
      return device('HA', 0x0005)
    }).not.to.throw(Error)
    expect(function() {
      return device('HA', 'CONFIGURATION_TOOL')
    }).not.to.throw(Error)
  })
})

describe('#.cluster', function() {
  it('should be a function', function() {
    expect(cluster).to.be.a('function')
  })

  it('should throw TypeError if input cId is not a number and not a string', function() {
    expect(function() {
      return cluster()
    }).to.throw(TypeError)
    expect(function() {
      return cluster(undefined)
    }).to.throw(TypeError)
    expect(function() {
      return cluster(null)
    }).to.throw(TypeError)
    expect(function() {
      return cluster(NaN)
    }).to.throw(TypeError)
    expect(function() {
      return cluster([])
    }).to.throw(TypeError)
    expect(function() {
      return cluster({})
    }).to.throw(TypeError)
    expect(function() {
      return cluster(true)
    }).to.throw(TypeError)
    expect(function() {
      return cluster(new Date())
    }).to.throw(TypeError)
    expect(function() {
      return cluster(function() {})
    }).to.throw(TypeError)

    expect(function() {
      return cluster(3)
    }).not.to.throw(Error)
    expect(function() {
      return cluster('3')
    }).not.to.throw(Error)
    expect(function() {
      return cluster(0x0003)
    }).not.to.throw(Error)
    expect(function() {
      return cluster('0x0003')
    }).not.to.throw(Error)
    expect(function() {
      return cluster('genIdentify')
    }).not.to.throw(Error)
  })
})

describe('#.foundation', function() {
  it('should be a function', function() {
    expect(foundation).to.be.a('function')
  })

  it('should throw TypeError if input cmdId is not a number and not a string', function() {
    expect(function() {
      return foundation()
    }).to.throw(TypeError)
    expect(function() {
      return foundation(undefined)
    }).to.throw(TypeError)
    expect(function() {
      return foundation(null)
    }).to.throw(TypeError)
    expect(function() {
      return foundation(NaN)
    }).to.throw(TypeError)
    expect(function() {
      return foundation([])
    }).to.throw(TypeError)
    expect(function() {
      return foundation({})
    }).to.throw(TypeError)
    expect(function() {
      return foundation(true)
    }).to.throw(TypeError)
    expect(function() {
      return foundation(new Date())
    }).to.throw(TypeError)
    expect(function() {
      return foundation(function() {})
    }).to.throw(TypeError)

    expect(function() {
      return foundation(3)
    }).not.to.throw(Error)
    expect(function() {
      return foundation('3')
    }).not.to.throw(Error)
    expect(function() {
      return foundation(0x0003)
    }).not.to.throw(Error)
    expect(function() {
      return foundation('0x0003')
    }).not.to.throw(Error)
    expect(function() {
      return foundation('writeUndiv')
    }).not.to.throw(Error)
  })
})

describe('#.functional', function() {
  it('should be a function', function() {
    expect(functional).to.be.a('function')
  })

  it('should throw TypeError if input cId is not a number and not a string', function() {
    expect(function() {
      return functional()
    }).to.throw(TypeError)
    expect(function() {
      return functional(undefined, 5)
    }).to.throw(TypeError)
    expect(function() {
      return functional(null, 5)
    }).to.throw(TypeError)
    expect(function() {
      return functional(NaN, 5)
    }).to.throw(TypeError)
    expect(function() {
      return functional([], 5)
    }).to.throw(TypeError)
    expect(function() {
      return functional({}, 5)
    }).to.throw(TypeError)
    expect(function() {
      return functional(true, 5)
    }).to.throw(TypeError)
    expect(function() {
      return functional(new Date(), 5)
    }).to.throw(TypeError)
    expect(function() {
      return functional(function() {}, 5)
    }).to.throw(TypeError)

    expect(function() {
      return functional()
    }).to.throw(TypeError)
    expect(function() {
      return functional(undefined, '5')
    }).to.throw(TypeError)
    expect(function() {
      return functional(null, '5')
    }).to.throw(TypeError)
    expect(function() {
      return functional(NaN, '5')
    }).to.throw(TypeError)
    expect(function() {
      return functional([], '5')
    }).to.throw(TypeError)
    expect(function() {
      return functional({}, '5')
    }).to.throw(TypeError)
    expect(function() {
      return functional(true, '5')
    }).to.throw(TypeError)
    expect(function() {
      return functional(new Date(), '5')
    }).to.throw(TypeError)
    expect(function() {
      return functional(function() {}, '5')
    }).to.throw(TypeError)

    expect(function() {
      return functional()
    }).to.throw(TypeError)
    expect(function() {
      return functional(undefined, 0x0005)
    }).to.throw(TypeError)
    expect(function() {
      return functional(null, 0x0005)
    }).to.throw(TypeError)
    expect(function() {
      return functional(NaN, 0x0005)
    }).to.throw(TypeError)
    expect(function() {
      return functional([], 0x0005)
    }).to.throw(TypeError)
    expect(function() {
      return functional({}, 0x0005)
    }).to.throw(TypeError)
    expect(function() {
      return functional(true, 0x0005)
    }).to.throw(TypeError)
    expect(function() {
      return functional(new Date(), 0x0005)
    }).to.throw(TypeError)
    expect(function() {
      return functional(function() {}, 0x0005)
    }).to.throw(TypeError)

    expect(function() {
      return functional()
    }).to.throw(TypeError)
    expect(function() {
      return functional(undefined, 'writeNoRsp')
    }).to.throw(TypeError)
    expect(function() {
      return functional(null, 'writeNoRsp')
    }).to.throw(TypeError)
    expect(function() {
      return functional(NaN, 'writeNoRsp')
    }).to.throw(TypeError)
    expect(function() {
      return functional([], 'writeNoRsp')
    }).to.throw(TypeError)
    expect(function() {
      return functional({}, 'writeNoRsp')
    }).to.throw(TypeError)
    expect(function() {
      return functional(true, 'writeNoRsp')
    }).to.throw(TypeError)
    expect(function() {
      return functional(new Date(), 'writeNoRsp')
    }).to.throw(TypeError)
    expect(function() {
      return functional(function() {}, 'writeNoRsp')
    }).to.throw(TypeError)

    expect(function() {
      return functional(5, 5)
    }).not.to.throw(Error)
    expect(function() {
      return functional(5, '5')
    }).not.to.throw(Error)
    expect(function() {
      return functional(5, 0x05)
    }).not.to.throw(Error)
    expect(function() {
      return functional(5, 'recall')
    }).not.to.throw(Error)
    expect(function() {
      return functional('5', 5)
    }).not.to.throw(Error)
    expect(function() {
      return functional('5', '5')
    }).not.to.throw(Error)
    expect(function() {
      return functional('5', 0x05)
    }).not.to.throw(Error)
    expect(function() {
      return functional('5', 'recall')
    }).not.to.throw(Error)
    expect(function() {
      return functional(0x0005, 5)
    }).not.to.throw(Error)
    expect(function() {
      return functional(0x0005, '5')
    }).not.to.throw(Error)
    expect(function() {
      return functional(0x0005, 0x05)
    }).not.to.throw(Error)
    expect(function() {
      return functional(0x0005, 'recall')
    }).not.to.throw(Error)
    expect(function() {
      return functional('genScenes', 5)
    }).not.to.throw(Error)
    expect(function() {
      return functional('genScenes', '5')
    }).not.to.throw(Error)
    expect(function() {
      return functional('genScenes', 0x05)
    }).not.to.throw(Error)
    expect(function() {
      return functional('genScenes', 'recall')
    }).not.to.throw(Error)
  })

  it('should throw TypeError if input cmdId is not a number and not a string', function() {
    expect(function() {
      return functional()
    }).to.throw(TypeError)
    expect(function() {
      return functional(5, undefined)
    }).to.throw(TypeError)
    expect(function() {
      return functional(5, null)
    }).to.throw(TypeError)
    expect(function() {
      return functional(5, NaN)
    }).to.throw(TypeError)
    expect(function() {
      return functional(5, [])
    }).to.throw(TypeError)
    expect(function() {
      return functional(5, {})
    }).to.throw(TypeError)
    expect(function() {
      return functional(5, true)
    }).to.throw(TypeError)
    expect(function() {
      return functional(5, new Date())
    }).to.throw(TypeError)
    expect(function() {
      return functional(5, function() {})
    }).to.throw(TypeError)

    expect(function() {
      return functional()
    }).to.throw(TypeError)
    expect(function() {
      return functional('5', undefined)
    }).to.throw(TypeError)
    expect(function() {
      return functional('5', null)
    }).to.throw(TypeError)
    expect(function() {
      return functional('5', NaN)
    }).to.throw(TypeError)
    expect(function() {
      return functional('5', [])
    }).to.throw(TypeError)
    expect(function() {
      return functional('5', {})
    }).to.throw(TypeError)
    expect(function() {
      return functional('5', true)
    }).to.throw(TypeError)
    expect(function() {
      return functional('5', new Date())
    }).to.throw(TypeError)
    expect(function() {
      return functional('5', function() {})
    }).to.throw(TypeError)

    expect(function() {
      return functional()
    }).to.throw(TypeError)
    expect(function() {
      return functional(0x0005, undefined)
    }).to.throw(TypeError)
    expect(function() {
      return functional(0x0005, null)
    }).to.throw(TypeError)
    expect(function() {
      return functional(0x0005, NaN)
    }).to.throw(TypeError)
    expect(function() {
      return functional(0x0005, [])
    }).to.throw(TypeError)
    expect(function() {
      return functional(0x0005, {})
    }).to.throw(TypeError)
    expect(function() {
      return functional(0x0005, true)
    }).to.throw(TypeError)
    expect(function() {
      return functional(0x0005, new Date())
    }).to.throw(TypeError)
    expect(function() {
      return functional(0x0005, function() {})
    }).to.throw(TypeError)

    expect(function() {
      return functional()
    }).to.throw(TypeError)
    expect(function() {
      return functional('genScenes', undefined)
    }).to.throw(TypeError)
    expect(function() {
      return functional('genScenes', null)
    }).to.throw(TypeError)
    expect(function() {
      return functional('genScenes', NaN)
    }).to.throw(TypeError)
    expect(function() {
      return functional('genScenes', [])
    }).to.throw(TypeError)
    expect(function() {
      return functional('genScenes', {})
    }).to.throw(TypeError)
    expect(function() {
      return functional('genScenes', true)
    }).to.throw(TypeError)
    expect(function() {
      return functional('genScenes', new Date())
    }).to.throw(TypeError)
    expect(function() {
      return functional('genScenes', function() {})
    }).to.throw(TypeError)

    expect(function() {
      return functional(5, 5)
    }).not.to.throw(Error)
    expect(function() {
      return functional(5, '5')
    }).not.to.throw(Error)
    expect(function() {
      return functional(5, 0x05)
    }).not.to.throw(Error)
    expect(function() {
      return functional(5, 'recall')
    }).not.to.throw(Error)
    expect(function() {
      return functional('5', 5)
    }).not.to.throw(Error)
    expect(function() {
      return functional('5', '5')
    }).not.to.throw(Error)
    expect(function() {
      return functional('5', 0x05)
    }).not.to.throw(Error)
    expect(function() {
      return functional('5', 'recall')
    }).not.to.throw(Error)
    expect(function() {
      return functional(0x0005, 5)
    }).not.to.throw(Error)
    expect(function() {
      return functional(0x0005, '5')
    }).not.to.throw(Error)
    expect(function() {
      return functional(0x0005, 0x05)
    }).not.to.throw(Error)
    expect(function() {
      return functional(0x0005, 'recall')
    }).not.to.throw(Error)
    expect(function() {
      return functional('genScenes', 5)
    }).not.to.throw(Error)
    expect(function() {
      return functional('genScenes', '5')
    }).not.to.throw(Error)
    expect(function() {
      return functional('genScenes', 0x05)
    }).not.to.throw(Error)
    expect(function() {
      return functional('genScenes', 'recall')
    }).not.to.throw(Error)
  })
})

describe('#.getCmdRsp', function() {
  it('should be a function', function() {
    expect(getCmdRsp).to.be.a('function')
  })

  it('should throw TypeError if input cId is not a number and not a string', function() {
    expect(function() {
      return getCmdRsp()
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(undefined, 0)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(null, 0)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(NaN, 0)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp([], 0)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp({}, 0)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(true, 0)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(new Date(), 0)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(function() {}, 0)
    }).to.throw(TypeError)

    expect(function() {
      return getCmdRsp()
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(undefined, '0')
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(null, '0')
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(NaN, '0')
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp([], '0')
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp({}, '0')
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(true, '0')
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(new Date(), '0')
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(function() {}, '0')
    }).to.throw(TypeError)

    expect(function() {
      return getCmdRsp()
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(undefined, 0x00)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(null, 0x00)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(NaN, 0x00)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp([], 0x00)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp({}, 0x00)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(true, 0x00)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(new Date(), 0x00)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(function() {}, 0x00)
    }).to.throw(TypeError)

    expect(function() {
      return getCmdRsp()
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(undefined, 'Rsp')
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(null, 'Rsp')
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(NaN, 'Rsp')
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp([], 'Rsp')
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp({}, 'Rsp')
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(true, 'Rsp')
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(new Date(), 'Rsp')
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(function() {}, 'Rsp')
    }).to.throw(TypeError)

    expect(function() {
      return getCmdRsp(5, 0)
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp(5, '0')
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp(5, 0x00)
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp(5, 'Rsp')
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp('5', 0)
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp('5', '0')
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp('5', 0x00)
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp('5', 'Rsp')
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp(0x0005, 0)
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp(0x0005, '0')
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp(0x0005, 0x00)
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp(0x0005, 'Rsp')
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp('genScenes', 0)
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp('genScenes', '0')
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp('genScenes', 0x00)
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp('genScenes', 'Rsp')
    }).not.to.throw(Error)
  })

  it('should throw TypeError if input rspId is not a number and not a string', function() {
    expect(function() {
      return getCmdRsp()
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(5, undefined)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(5, null)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(5, NaN)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(5, [])
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(5, {})
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(5, true)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(5, new Date())
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(5, function() {})
    }).to.throw(TypeError)

    expect(function() {
      return getCmdRsp()
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp('5', undefined)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp('5', null)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp('5', NaN)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp('5', [])
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp('5', {})
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp('5', true)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp('5', new Date())
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp('5', function() {})
    }).to.throw(TypeError)

    expect(function() {
      return getCmdRsp()
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(0x0005, undefined)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(0x0005, null)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(0x0005, NaN)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(0x0005, [])
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(0x0005, {})
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(0x0005, true)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(0x0005, new Date())
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp(0x0005, function() {})
    }).to.throw(TypeError)

    expect(function() {
      return getCmdRsp()
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp('genScenes', undefined)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp('genScenes', null)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp('genScenes', NaN)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp('genScenes', [])
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp('genScenes', {})
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp('genScenes', true)
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp('genScenes', new Date())
    }).to.throw(TypeError)
    expect(function() {
      return getCmdRsp('genScenes', function() {})
    }).to.throw(TypeError)

    expect(function() {
      return getCmdRsp(5, 0)
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp(5, '0')
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp(5, 0x00)
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp(5, 'Rsp')
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp('5', 0)
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp('5', '0')
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp('5', 0x00)
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp('5', 'Rsp')
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp(0x0005, 0)
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp(0x0005, '0')
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp(0x0005, 0x00)
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp(0x0005, 'Rsp')
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp('genScenes', 0)
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp('genScenes', '0')
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp('genScenes', 0x00)
    }).not.to.throw(Error)
    expect(function() {
      return getCmdRsp('genScenes', 'Rsp')
    }).not.to.throw(Error)
  })
})

describe('#.attrList', function() {
  it('should be a function', function() {
    expect(attrList).to.be.a('function')
  })

  it('should throw TypeError if input cId is not a number and not a string', function() {
    expect(function() {
      return attrList()
    }).to.throw(TypeError)
    expect(function() {
      return attrList(undefined)
    }).to.throw(TypeError)
    expect(function() {
      return attrList(null)
    }).to.throw(TypeError)
    expect(function() {
      return attrList(NaN)
    }).to.throw(TypeError)
    expect(function() {
      return attrList([])
    }).to.throw(TypeError)
    expect(function() {
      return attrList({})
    }).to.throw(TypeError)
    expect(function() {
      return attrList(true)
    }).to.throw(TypeError)
    expect(function() {
      return attrList(new Date())
    }).to.throw(TypeError)
    expect(function() {
      return attrList(function() {})
    }).to.throw(TypeError)

    expect(function() {
      return attrList(3)
    }).not.to.throw(Error)
    expect(function() {
      return attrList('3')
    }).not.to.throw(Error)
    expect(function() {
      return attrList(0x0003)
    }).not.to.throw(Error)
    expect(function() {
      return attrList('0x0003')
    }).not.to.throw(Error)
    expect(function() {
      return attrList('genIdentify')
    }).not.to.throw(Error)
  })
})

describe('#.attr', function() {
  it('should be a function', function() {
    expect(attr).to.be.a('function')
  })

  it('should throw TypeError if input cId is not a number and not a string', function() {
    expect(function() {
      return attr()
    }).to.throw(TypeError)
    expect(function() {
      return attr(undefined, 2)
    }).to.throw(TypeError)
    expect(function() {
      return attr(null, 2)
    }).to.throw(TypeError)
    expect(function() {
      return attr(NaN, 2)
    }).to.throw(TypeError)
    expect(function() {
      return attr([], 2)
    }).to.throw(TypeError)
    expect(function() {
      return attr({}, 2)
    }).to.throw(TypeError)
    expect(function() {
      return attr(true, 2)
    }).to.throw(TypeError)
    expect(function() {
      return attr(new Date(), 2)
    }).to.throw(TypeError)
    expect(function() {
      return attr(function() {}, 2)
    }).to.throw(TypeError)

    expect(function() {
      return attr()
    }).to.throw(TypeError)
    expect(function() {
      return attr(undefined, '2')
    }).to.throw(TypeError)
    expect(function() {
      return attr(null, '2')
    }).to.throw(TypeError)
    expect(function() {
      return attr(NaN, '2')
    }).to.throw(TypeError)
    expect(function() {
      return attr([], '2')
    }).to.throw(TypeError)
    expect(function() {
      return attr({}, '2')
    }).to.throw(TypeError)
    expect(function() {
      return attr(true, '2')
    }).to.throw(TypeError)
    expect(function() {
      return attr(new Date(), '2')
    }).to.throw(TypeError)
    expect(function() {
      return attr(function() {}, '2')
    }).to.throw(TypeError)

    expect(function() {
      return attr()
    }).to.throw(TypeError)
    expect(function() {
      return attr(undefined, 0x0002)
    }).to.throw(TypeError)
    expect(function() {
      return attr(null, 0x0002)
    }).to.throw(TypeError)
    expect(function() {
      return attr(NaN, 0x0002)
    }).to.throw(TypeError)
    expect(function() {
      return attr([], 0x0002)
    }).to.throw(TypeError)
    expect(function() {
      return attr({}, 0x0002)
    }).to.throw(TypeError)
    expect(function() {
      return attr(true, 0x0002)
    }).to.throw(TypeError)
    expect(function() {
      return attr(new Date(), 0x0002)
    }).to.throw(TypeError)
    expect(function() {
      return attr(function() {}, 0x0002)
    }).to.throw(TypeError)

    expect(function() {
      return attr()
    }).to.throw(TypeError)
    expect(function() {
      return attr(undefined, 'currentGroup')
    }).to.throw(TypeError)
    expect(function() {
      return attr(null, 'currentGroup')
    }).to.throw(TypeError)
    expect(function() {
      return attr(NaN, 'currentGroup')
    }).to.throw(TypeError)
    expect(function() {
      return attr([], 'currentGroup')
    }).to.throw(TypeError)
    expect(function() {
      return attr({}, 'currentGroup')
    }).to.throw(TypeError)
    expect(function() {
      return attr(true, 'currentGroup')
    }).to.throw(TypeError)
    expect(function() {
      return attr(new Date(), 'currentGroup')
    }).to.throw(TypeError)
    expect(function() {
      return attr(function() {}, 'currentGroup')
    }).to.throw(TypeError)

    expect(function() {
      return attr(5, 2)
    }).not.to.throw(Error)
    expect(function() {
      return attr(5, '2')
    }).not.to.throw(Error)
    expect(function() {
      return attr(5, 0x0002)
    }).not.to.throw(Error)
    expect(function() {
      return attr(5, 'currentGroup')
    }).not.to.throw(Error)
    expect(function() {
      return attr('5', 2)
    }).not.to.throw(Error)
    expect(function() {
      return attr('5', '2')
    }).not.to.throw(Error)
    expect(function() {
      return attr('5', 0x0002)
    }).not.to.throw(Error)
    expect(function() {
      return attr('5', 'currentGroup')
    }).not.to.throw(Error)
    expect(function() {
      return attr(0x0005, 2)
    }).not.to.throw(Error)
    expect(function() {
      return attr(0x0005, '2')
    }).not.to.throw(Error)
    expect(function() {
      return attr(0x0005, 0x0002)
    }).not.to.throw(Error)
    expect(function() {
      return attr(0x0005, 'currentGroup')
    }).not.to.throw(Error)
    expect(function() {
      return attr('genScenes', 2)
    }).not.to.throw(Error)
    expect(function() {
      return attr('genScenes', '2')
    }).not.to.throw(Error)
    expect(function() {
      return attr('genScenes', 0x0002)
    }).not.to.throw(Error)
    expect(function() {
      return attr('genScenes', 'currentGroup')
    }).not.to.throw(Error)
  })

  it('should throw TypeError if input attrId is not a number and not a string', function() {
    expect(function() {
      return attr()
    }).to.throw(TypeError)
    expect(function() {
      return attr(5, undefined)
    }).to.throw(TypeError)
    expect(function() {
      return attr(5, null)
    }).to.throw(TypeError)
    expect(function() {
      return attr(5, NaN)
    }).to.throw(TypeError)
    expect(function() {
      return attr(5, [])
    }).to.throw(TypeError)
    expect(function() {
      return attr(5, {})
    }).to.throw(TypeError)
    expect(function() {
      return attr(5, true)
    }).to.throw(TypeError)
    expect(function() {
      return attr(5, new Date())
    }).to.throw(TypeError)
    expect(function() {
      return attr(5, function() {})
    }).to.throw(TypeError)

    expect(function() {
      return attr()
    }).to.throw(TypeError)
    expect(function() {
      return attr('5', undefined)
    }).to.throw(TypeError)
    expect(function() {
      return attr('5', null)
    }).to.throw(TypeError)
    expect(function() {
      return attr('5', NaN)
    }).to.throw(TypeError)
    expect(function() {
      return attr('5', [])
    }).to.throw(TypeError)
    expect(function() {
      return attr('5', {})
    }).to.throw(TypeError)
    expect(function() {
      return attr('5', true)
    }).to.throw(TypeError)
    expect(function() {
      return attr('5', new Date())
    }).to.throw(TypeError)
    expect(function() {
      return attr('5', function() {})
    }).to.throw(TypeError)

    expect(function() {
      return attr()
    }).to.throw(TypeError)
    expect(function() {
      return attr(0x0005, undefined)
    }).to.throw(TypeError)
    expect(function() {
      return attr(0x0005, null)
    }).to.throw(TypeError)
    expect(function() {
      return attr(0x0005, NaN)
    }).to.throw(TypeError)
    expect(function() {
      return attr(0x0005, [])
    }).to.throw(TypeError)
    expect(function() {
      return attr(0x0005, {})
    }).to.throw(TypeError)
    expect(function() {
      return attr(0x0005, true)
    }).to.throw(TypeError)
    expect(function() {
      return attr(0x0005, new Date())
    }).to.throw(TypeError)
    expect(function() {
      return attr(0x0005, function() {})
    }).to.throw(TypeError)

    expect(function() {
      return attr()
    }).to.throw(TypeError)
    expect(function() {
      return attr('genScenes', undefined)
    }).to.throw(TypeError)
    expect(function() {
      return attr('genScenes', null)
    }).to.throw(TypeError)
    expect(function() {
      return attr('genScenes', NaN)
    }).to.throw(TypeError)
    expect(function() {
      return attr('genScenes', [])
    }).to.throw(TypeError)
    expect(function() {
      return attr('genScenes', {})
    }).to.throw(TypeError)
    expect(function() {
      return attr('genScenes', true)
    }).to.throw(TypeError)
    expect(function() {
      return attr('genScenes', new Date())
    }).to.throw(TypeError)
    expect(function() {
      return attr('genScenes', function() {})
    }).to.throw(TypeError)

    expect(function() {
      return attr(5, 2)
    }).not.to.throw(Error)
    expect(function() {
      return attr(5, '2')
    }).not.to.throw(Error)
    expect(function() {
      return attr(5, 0x0002)
    }).not.to.throw(Error)
    expect(function() {
      return attr(5, 'currentGroup')
    }).not.to.throw(Error)
    expect(function() {
      return attr('5', 2)
    }).not.to.throw(Error)
    expect(function() {
      return attr('5', '2')
    }).not.to.throw(Error)
    expect(function() {
      return attr('5', 0x0002)
    }).not.to.throw(Error)
    expect(function() {
      return attr('5', 'currentGroup')
    }).not.to.throw(Error)
    expect(function() {
      return attr(0x0005, 2)
    }).not.to.throw(Error)
    expect(function() {
      return attr(0x0005, '2')
    }).not.to.throw(Error)
    expect(function() {
      return attr(0x0005, 0x0002)
    }).not.to.throw(Error)
    expect(function() {
      return attr(0x0005, 'currentGroup')
    }).not.to.throw(Error)
    expect(function() {
      return attr('genScenes', 2)
    }).not.to.throw(Error)
    expect(function() {
      return attr('genScenes', '2')
    }).not.to.throw(Error)
    expect(function() {
      return attr('genScenes', 0x0002)
    }).not.to.throw(Error)
    expect(function() {
      return attr('genScenes', 'currentGroup')
    }).not.to.throw(Error)
  })
})

describe('#.attrType', function() {
  it('should be a function', function() {
    expect(attrType).to.be.a('function')
  })

  it('should throw TypeError if input cId is not a number and not a string', function() {
    expect(function() {
      return attrType()
    }).to.throw(TypeError)
    expect(function() {
      return attrType(undefined, 2)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(null, 2)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(NaN, 2)
    }).to.throw(TypeError)
    expect(function() {
      return attrType([], 2)
    }).to.throw(TypeError)
    expect(function() {
      return attrType({}, 2)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(true, 2)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(new Date(), 2)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(function() {}, 2)
    }).to.throw(TypeError)

    expect(function() {
      return attrType()
    }).to.throw(TypeError)
    expect(function() {
      return attrType(undefined, '2')
    }).to.throw(TypeError)
    expect(function() {
      return attrType(null, '2')
    }).to.throw(TypeError)
    expect(function() {
      return attrType(NaN, '2')
    }).to.throw(TypeError)
    expect(function() {
      return attrType([], '2')
    }).to.throw(TypeError)
    expect(function() {
      return attrType({}, '2')
    }).to.throw(TypeError)
    expect(function() {
      return attrType(true, '2')
    }).to.throw(TypeError)
    expect(function() {
      return attrType(new Date(), '2')
    }).to.throw(TypeError)
    expect(function() {
      return attrType(function() {}, '2')
    }).to.throw(TypeError)

    expect(function() {
      return attrType()
    }).to.throw(TypeError)
    expect(function() {
      return attrType(undefined, 0x0002)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(null, 0x0002)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(NaN, 0x0002)
    }).to.throw(TypeError)
    expect(function() {
      return attrType([], 0x0002)
    }).to.throw(TypeError)
    expect(function() {
      return attrType({}, 0x0002)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(true, 0x0002)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(new Date(), 0x0002)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(function() {}, 0x0002)
    }).to.throw(TypeError)

    expect(function() {
      return attrType()
    }).to.throw(TypeError)
    expect(function() {
      return attrType(undefined, 'currentGroup')
    }).to.throw(TypeError)
    expect(function() {
      return attrType(null, 'currentGroup')
    }).to.throw(TypeError)
    expect(function() {
      return attrType(NaN, 'currentGroup')
    }).to.throw(TypeError)
    expect(function() {
      return attrType([], 'currentGroup')
    }).to.throw(TypeError)
    expect(function() {
      return attrType({}, 'currentGroup')
    }).to.throw(TypeError)
    expect(function() {
      return attrType(true, 'currentGroup')
    }).to.throw(TypeError)
    expect(function() {
      return attrType(new Date(), 'currentGroup')
    }).to.throw(TypeError)
    expect(function() {
      return attrType(function() {}, 'currentGroup')
    }).to.throw(TypeError)

    expect(function() {
      return attrType(5, 2)
    }).not.to.throw(Error)
    expect(function() {
      return attrType(5, '2')
    }).not.to.throw(Error)
    expect(function() {
      return attrType(5, 0x0002)
    }).not.to.throw(Error)
    expect(function() {
      return attrType(5, 'currentGroup')
    }).not.to.throw(Error)
    expect(function() {
      return attrType('5', 2)
    }).not.to.throw(Error)
    expect(function() {
      return attrType('5', '2')
    }).not.to.throw(Error)
    expect(function() {
      return attrType('5', 0x0002)
    }).not.to.throw(Error)
    expect(function() {
      return attrType('5', 'currentGroup')
    }).not.to.throw(Error)
    expect(function() {
      return attrType(0x0005, 2)
    }).not.to.throw(Error)
    expect(function() {
      return attrType(0x0005, '2')
    }).not.to.throw(Error)
    expect(function() {
      return attrType(0x0005, 0x0002)
    }).not.to.throw(Error)
    expect(function() {
      return attrType(0x0005, 'currentGroup')
    }).not.to.throw(Error)
    expect(function() {
      return attrType('genScenes', 2)
    }).not.to.throw(Error)
    expect(function() {
      return attrType('genScenes', '2')
    }).not.to.throw(Error)
    expect(function() {
      return attrType('genScenes', 0x0002)
    }).not.to.throw(Error)
    expect(function() {
      return attrType('genScenes', 'currentGroup')
    }).not.to.throw(Error)
  })

  it('should throw TypeError if input attrId is not a number and not a string', function() {
    expect(function() {
      return attrType()
    }).to.throw(TypeError)
    expect(function() {
      return attrType(5, undefined)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(5, null)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(5, NaN)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(5, [])
    }).to.throw(TypeError)
    expect(function() {
      return attrType(5, {})
    }).to.throw(TypeError)
    expect(function() {
      return attrType(5, true)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(5, new Date())
    }).to.throw(TypeError)
    expect(function() {
      return attrType(5, function() {})
    }).to.throw(TypeError)

    expect(function() {
      return attrType()
    }).to.throw(TypeError)
    expect(function() {
      return attrType('5', undefined)
    }).to.throw(TypeError)
    expect(function() {
      return attrType('5', null)
    }).to.throw(TypeError)
    expect(function() {
      return attrType('5', NaN)
    }).to.throw(TypeError)
    expect(function() {
      return attrType('5', [])
    }).to.throw(TypeError)
    expect(function() {
      return attrType('5', {})
    }).to.throw(TypeError)
    expect(function() {
      return attrType('5', true)
    }).to.throw(TypeError)
    expect(function() {
      return attrType('5', new Date())
    }).to.throw(TypeError)
    expect(function() {
      return attrType('5', function() {})
    }).to.throw(TypeError)

    expect(function() {
      return attrType()
    }).to.throw(TypeError)
    expect(function() {
      return attrType(0x0005, undefined)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(0x0005, null)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(0x0005, NaN)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(0x0005, [])
    }).to.throw(TypeError)
    expect(function() {
      return attrType(0x0005, {})
    }).to.throw(TypeError)
    expect(function() {
      return attrType(0x0005, true)
    }).to.throw(TypeError)
    expect(function() {
      return attrType(0x0005, new Date())
    }).to.throw(TypeError)
    expect(function() {
      return attrType(0x0005, function() {})
    }).to.throw(TypeError)

    expect(function() {
      return attrType()
    }).to.throw(TypeError)
    expect(function() {
      return attrType('genScenes', undefined)
    }).to.throw(TypeError)
    expect(function() {
      return attrType('genScenes', null)
    }).to.throw(TypeError)
    expect(function() {
      return attrType('genScenes', NaN)
    }).to.throw(TypeError)
    expect(function() {
      return attrType('genScenes', [])
    }).to.throw(TypeError)
    expect(function() {
      return attrType('genScenes', {})
    }).to.throw(TypeError)
    expect(function() {
      return attrType('genScenes', true)
    }).to.throw(TypeError)
    expect(function() {
      return attrType('genScenes', new Date())
    }).to.throw(TypeError)
    expect(function() {
      return attrType('genScenes', function() {})
    }).to.throw(TypeError)

    expect(function() {
      return attrType(5, 2)
    }).not.to.throw(Error)
    expect(function() {
      return attrType(5, '2')
    }).not.to.throw(Error)
    expect(function() {
      return attrType(5, 0x0002)
    }).not.to.throw(Error)
    expect(function() {
      return attrType(5, 'currentGroup')
    }).not.to.throw(Error)
    expect(function() {
      return attrType('5', 2)
    }).not.to.throw(Error)
    expect(function() {
      return attrType('5', '2')
    }).not.to.throw(Error)
    expect(function() {
      return attrType('5', 0x0002)
    }).not.to.throw(Error)
    expect(function() {
      return attrType('5', 'currentGroup')
    }).not.to.throw(Error)
    expect(function() {
      return attrType(0x0005, 2)
    }).not.to.throw(Error)
    expect(function() {
      return attrType(0x0005, '2')
    }).not.to.throw(Error)
    expect(function() {
      return attrType(0x0005, 0x0002)
    }).not.to.throw(Error)
    expect(function() {
      return attrType(0x0005, 'currentGroup')
    }).not.to.throw(Error)
    expect(function() {
      return attrType('genScenes', 2)
    }).not.to.throw(Error)
    expect(function() {
      return attrType('genScenes', '2')
    }).not.to.throw(Error)
    expect(function() {
      return attrType('genScenes', 0x0002)
    }).not.to.throw(Error)
    expect(function() {
      return attrType('genScenes', 'currentGroup')
    }).not.to.throw(Error)
  })
})

describe('#.dataType', function() {
  it('should be a function', function() {
    expect(dataType).to.be.a('function')
  })

  it('should throw TypeError if input type is not a number and not a string', function() {
    expect(function() {
      return dataType()
    }).to.throw(TypeError)
    expect(function() {
      return dataType(undefined)
    }).to.throw(TypeError)
    expect(function() {
      return dataType(null)
    }).to.throw(TypeError)
    expect(function() {
      return dataType(NaN)
    }).to.throw(TypeError)
    expect(function() {
      return dataType([])
    }).to.throw(TypeError)
    expect(function() {
      return dataType({})
    }).to.throw(TypeError)
    expect(function() {
      return dataType(true)
    }).to.throw(TypeError)
    expect(function() {
      return dataType(new Date())
    }).to.throw(TypeError)
    expect(function() {
      return dataType(function() {})
    }).to.throw(TypeError)

    expect(function() {
      return dataType(11)
    }).not.to.throw(Error)
    expect(function() {
      return dataType('11')
    }).not.to.throw(Error)
    expect(function() {
      return dataType(0x0b)
    }).not.to.throw(Error)
    expect(function() {
      return dataType('0x0b')
    }).not.to.throw(Error)
    expect(function() {
      return dataType('DATA32')
    }).not.to.throw(Error)
  })
})
