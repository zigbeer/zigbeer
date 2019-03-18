import { BufferBuilder } from 'buffster';
import * as zmeta from './zmeta';
import Unpi = require('unpi');
const DChunks = Unpi.DChunks;
const ru = DChunks().Rule();

const writeBuffer = (c: BufferBuilder, value: number[] | Buffer) =>
  c.buffer(Buffer.from(value as number[])); // TODO: only accept Buffer
const writeDataTable = {
  uint8: (c: BufferBuilder, value: number) => c.uint8(value),
  uint16: (c: BufferBuilder, value: number) => c.uint16le(value),
  uint32: (c: BufferBuilder, value: number) => c.uint32le(value),
  buffer: writeBuffer,
  dynbuffer: writeBuffer,
  longaddr: (c: BufferBuilder, value: string | Buffer) => {
    if (Buffer.isBuffer(value)) {
      if (value.length !== 8)
        throw new TypeError(`Expected Buffer of length 8, got ${value.length}`);

      c.buffer(value);
    }
    // TODO: only accept Buffer
    if (typeof value === 'string') {
      const buf = Buffer.from(value.slice(2), 'hex');
      buf.reverse();
      if (buf.length !== 8)
        throw new TypeError(
          `Expected hex string of length 8, got ${buf.length}`
        );
      c.buffer(buf);
    }
  },
  listbuffer: (c: BufferBuilder, value: number[]) => {
    for (const uint16le of value) {
      c.uint16le(uint16le);
    }
  },
};

/**
 * 1. Provides command framer (SREQ)
 * 2. Provides parser (SRSP, AREQ)
 *
 * args is optional, and can be an array or a value-object if given
 */
class ZpiObject {
  type: string;
  subsys: string;
  cmd: string;
  cmdId: number;
  args?: { name: string; type: string; value: any }[];
  constructor(subsys, cmd, args) {
    const subsystem = zmeta.Subsys.get(subsys);
    let command;
    let reqParams;

    if (!subsystem) {
      throw new Error('Unrecognized subsystem');
    }

    this.subsys = subsystem.key;
    command = zmeta[this.subsys].get(cmd);

    if (!command) {
      throw new Error('Unrecognized command');
    }

    this.cmd = command.key;
    this.cmdId = command.value;

    this.type = zmeta.getType(this.subsys, this.cmd);

    if (!this.type) {
      throw new Error('Unrecognized type');
    }

    // if args is given, this is for REQ transmission
    // otherwise, maybe just for parsing RSP packet
    if (args) {
      // [ { name, type }, ... ]
      reqParams = zmeta.getReqParams(this.subsys, this.cmd);
    }

    if (reqParams) {
      if (Array.isArray(args)) {
        // arg: { name, type } -> { name, type, value }
        reqParams.forEach((arg, idx) => {
          arg.value = args[idx];
        });
      } else if (typeof args === 'object') {
        reqParams.forEach((arg, idx) => {
          if (!args.hasOwnProperty(arg.name)) {
            throw new Error('The argument object has incorrect properties');
          } else {
            arg.value = args[arg.name];
          }
        });
      }

      // [ { name, type, value }, ... ]
      this.args = reqParams;
    }
  }

  parse(type, bufLen, zBuf, callback) {
    let err;
    let rspParams;
    let parser;
    let parseTimeout;

    // SRSP
    if (type === 'SRSP' || type === 3) {
      rspParams = zmeta.getRspParams(this.subsys, this.cmd);

      // AREQ
    } else if (type === 'AREQ' || type === 2) {
      rspParams = zmeta.getReqParams(this.subsys, this.cmd);
    }

    // [ { name, type }, ... ]
    if (!rspParams)
      return callback(new Error('Response parameter definitions not found.'));

    let chunkRules;

    chunkRules = rspParams.map(arg => {
      let rule = ru[arg.type];
      if (!rule) throw new Error(`Parsing rule for ${arg.type} is not found.`);
      return rule(arg.name, bufLen);
    });

    if (!err) {
      if (chunkRules.length === 0) {
        callback(null, {});
        return;
      }

      parser = DChunks()
        .join(chunkRules)
        .compile();

      parseTimeout = setTimeout(() => {
        if (parser.listenerCount('parsed')) {
          parser.emit('parsed', '__timeout__');
        }

        parseTimeout = null;
      }, 3000);

      parser.once('parsed', result => {
        if (parseTimeout) {
          clearTimeout(parseTimeout);
          parseTimeout = null;
        }

        parser = null;

        if (result === '__timeout__') {
          callback(new Error('parse timeout'));
        } else {
          callback(null, result);
        }
      });
    }

    // error occurs, no parser created
    if (!parser) {
      callback(err);
    } else {
      parser.end(zBuf);
    }
  }

  frame() {
    // no args, cannot build frame
    if (!Array.isArray(this.args)) {
      return null;
    }
    const c = new BufferBuilder();
    for (const { type, value } of this.args) {
      const fn = writeDataTable[type];
      if (!fn) throw new TypeError(`Unknown argument type: ${type}`);
      fn(c, value);
    }
    return c.result();
  }
}

/*
    Add Parsing Rules to DChunks
*/
const rules = [
  'buffer8',
  'buffer16',
  'buffer18',
  'buffer32',
  'buffer42',
  'buffer100',
  '_preLenUint8',
  '_preLenUint16',
];

rules.forEach(function(ruName) {
  ru.clause(ruName, function(name) {
    let needTap = true;
    let bufLen;

    if (ruName === '_preLenUint8') {
      this.uint8(name);
    } else if (ruName === '_preLenUint16') {
      this.uint16(name);
    } else {
      needTap = false;
      bufLen = parseInt(ruName.slice(6));
      this.buffer(name, bufLen);
    }

    if (needTap) {
      this.tap(function() {
        this.buffer('preLenData', this.vars[name]);
      });
    }
  });
});

ru.clause('longaddr', function(name) {
  this.buffer(name, 8).tap(function() {
    const addrBuf = this.vars[name];
    this.vars[name] = addrBuf2Str(addrBuf);
  });
});

ru.clause('uint8ZdoInd', function(name, bufLen) {
  if (bufLen === 3) {
    this.uint16('nwkaddr').uint8(name);
  } else if (bufLen === 1) {
    this.uint8(name);
  }
});

ru.clause('devlistbuffer', function(name, bufLen) {
  this.buffer(name, bufLen - 13).tap(function() {
    this.vars[name] = bufToArray(this.vars[name], 'uint16');
  });
});

ru.clause('nwklistbuffer', function(name, bufLen) {
  this.buffer(name, bufLen - 6).tap(function() {
    const buf = this.vars[name];
    const list: ReturnType<typeof getList>[] = [];
    let listcount;
    let getList;
    let start = 0;
    let end;
    let len;
    let i;

    if (name === 'networklist') {
      listcount = this.vars.networklistcount;
      end = len = 12;
      getList = networkList;
    } else if (name === 'neighborlqilist') {
      listcount = this.vars.neighborlqilistcount;
      end = len = 22;
      getList = neighborLqiList;
    } else if (name === 'routingtablelist') {
      listcount = this.vars.routingtablelistcount;
      end = len = 5;
      getList = routingTableList;
    } else {
      listcount = this.vars.bindingtablelistcount;
      this.vars[name] = bindTableList(buf, listcount);
      return;
    }

    for (i = 0; i < listcount; i += 1) {
      list.push(getList(buf.slice(start, end)));
      start = start + len;
      end = end + len;
    }

    this.vars[name] = list;
  });
});

ru.clause('zdomsgcb', function(name, bufLen) {
  this.buffer(name, bufLen - 9);
});

ru.clause('preLenList', function(name) {
  this.uint8(name).tap(function() {
    this.buffer('preLenData', 2 * this.vars[name]);
  });
});

ru.clause('preLenBeaconlist', function(name) {
  this.uint8(name).tap(function() {
    this.buffer('preLenData', 21 * this.vars[name]).tap(function() {
      const buf = this.vars.preLenData;
      const list: ReturnType<typeof beaconList>[] = [];
      let len = 21;
      let start = 0;
      let end = 21;
      let i;

      for (i = 0; i < this.vars[name]; i += 1) {
        list.push(beaconList(buf.slice(start, end)));
        start = start + len;
        end = end + len;
      }

      this.vars.preLenData = list;
    });
  });
});

ru.clause('dynbuffer', function(name) {
  this.tap(function() {
    this.vars[name] = this.vars.preLenData;
    delete this.vars.preLenData;
  });
});

function networkList(buf) {
  let i = 0;

  const neightborPanId = buf.readUInt16LE(i);
  i += 2 + 6;
  const logicalChannel = buf.readUInt8(i);
  i += 1;
  const stackProfile = buf.readUInt8(i) & 0x0f;
  const zigbeeVersion = (buf.readUInt8(i) & 0xf0) >> 4;
  i += 1;
  const beaconOrder = buf.readUInt8(i) & 0x0f;
  const superFrameOrder = (buf.readUInt8(i) & 0xf0) >> 4;
  i += 1;
  const permitJoin = buf.readUInt8(i);
  i += 1;

  return {
    neightborPanId,
    logicalChannel,
    stackProfile,
    zigbeeVersion,
    beaconOrder,
    superFrameOrder,
    permitJoin,
  };
}

function neighborLqiList(buf) {
  let i = 0;

  const extPandId = addrBuf2Str(buf.slice(0, 8));
  i += 8;
  const extAddr = addrBuf2Str(buf.slice(8, 16));
  i += 8;
  const nwkAddr = buf.readUInt16LE(i);
  i += 2;
  const deviceType = buf.readUInt8(i) & 0x03;
  const rxOnWhenIdle = (buf.readUInt8(i) & 0x0c) >> 2;
  const relationship = (buf.readUInt8(i) & 0x70) >> 4;
  i += 1;
  const permitJoin = buf.readUInt8(i) & 0x03;
  i += 1;
  const depth = buf.readUInt8(i);
  i += 1;
  const lqi = buf.readUInt8(i);
  i += 1;

  return {
    extPandId,
    extAddr,
    nwkAddr,
    deviceType,
    rxOnWhenIdle,
    relationship,
    permitJoin,
    depth,
    lqi,
  };
}

function routingTableList(buf) {
  let i = 0;

  const destNwkAddr = buf.readUInt16LE(i);
  i += 2;
  const routeStatus = buf.readUInt8(i) & 0x07;
  i += 1;
  const nextHopNwkAddr = buf.readUInt16LE(i);
  i += 2;

  return { destNwkAddr, routeStatus, nextHopNwkAddr };
}

function bindTableList(buf, listcount) {
  function getList(buf) {
    let thisItemLen = 21;
    let i = 0;

    const srcAddr = addrBuf2Str(buf.slice(0, 8));
    i += 8;
    const srcEp = buf.readUInt8(i);
    i += 1;
    const clusterId = buf.readUInt16LE(i);
    i += 2;
    const dstAddrMode = buf.readUInt8(i);
    i += 1;
    const dstAddr = addrBuf2Str(buf.slice(12, 20));
    i += 8;

    // 'Addr64Bit'
    if (dstAddrMode === 3) {
      const dstEp = buf.readUInt8(i);
      i += 1;
      return {
        item: { srcAddr, srcEp, clusterId, dstAddrMode, dstAddr, dstEp },
        thisItemLen,
      };
    }
    thisItemLen = thisItemLen - 1;

    return {
      item: { srcAddr, srcEp, clusterId, dstAddrMode, dstAddr },
      thisItemLen,
    };
  }

  const list: ReturnType<typeof getList>['item'][] = [];
  const len = 21;
  let start = 0;
  let end = len;
  for (let i = 0; i < listcount; i += 1) {
    const itemObj = getList(buf.slice(start, end));
    list.push(itemObj.item);

    start = start + itemObj.thisItemLen;

    // for the last item, we don't know the length of bytes
    // so, assign 'end' by the buf length to avoid memory leak.
    // for each item, take 21 bytes from buf to parse
    if (i === listcount - 2) {
      end = buf.length;
    } else {
      end = start + len;
    }
  }

  return list;
}

function beaconList(buf) {
  let i = 0;

  const srcAddr = buf.readUInt16LE(i);
  i += 2;
  const padId = buf.readUInt16LE(i);
  i += 2;
  const logicalChannel = buf.readUInt8(i);
  i += 1;
  const permitJoin = buf.readUInt8(i);
  i += 1;
  const routerCapacity = buf.readUInt8(i);
  i += 1;
  const deviceCapacity = buf.readUInt8(i);
  i += 1;
  const protocolVersion = buf.readUInt8(i);
  i += 1;
  const stackProfile = buf.readUInt8(i);
  i += 1;
  const lqi = buf.readUInt8(i);
  i += 1;
  const depth = buf.readUInt8(i);
  i += 1;
  const updateId = buf.readUInt8(i);
  i += 1;
  const extPandId = addrBuf2Str(buf.slice(13));
  i += 8;

  return {
    srcAddr,
    padId,
    logicalChannel,
    permitJoin,
    routerCapacity,
    deviceCapacity,
    protocolVersion,
    stackProfile,
    lqi,
    depth,
    updateId,
    extPandId,
  };
}

function addrBuf2Str(buf) {
  const bufLen = buf.length;
  let val;
  let strChunk = '0x';

  for (let i = 0; i < bufLen; i += 1) {
    val = buf.readUInt8(bufLen - i - 1);
    if (val <= 15) {
      strChunk += `0${val.toString(16)}`;
    } else {
      strChunk += val.toString(16);
    }
  }

  return strChunk;
}

function bufToArray(buf, nip) {
  const nipArr: number[] = [];

  if (nip === 'uint8') {
    for (let i = 0; i < buf.length; i += 1) {
      nipArr.push(buf.readUInt8(i));
    }
  } else if (nip === 'uint16') {
    for (let i = 0; i < buf.length; i += 2) {
      nipArr.push(buf.readUInt16LE(i));
    }
  }
  return nipArr;
}

module.exports = ZpiObject;
