import Chance = require('chance');
import {
  Beacon,
  Network,
  NeighborLqi,
  Routing,
  Binding,
} from '../src/encoding/structs';
const chance = new Chance();
let preBufLen;

const randomValidUint8 = () => chance.integer({ min: 0, max: 0xfe });
const randomValidUint16le = () => chance.integer({ min: 0, max: 0xfffe });

const randomBuf = len => {
  const buf = Buffer.allocUnsafe(len);
  for (let i = 0; i < len; i++) buf[i] = chance.integer({ min: 0, max: 0xff });
  return buf;
};
const randomLongAddrStr = () => '0x' + randomBuf(8).toString('hex');

export const randomArg = (type, name) => {
  let bufLen;
  let testBuf;
  let k;

  switch (type) {
    case 'uint8':
    case 'uint8ZdoInd':
      return chance.integer({ min: 0, max: 255 });
    case 'uint16':
      return chance.integer({ min: 0, max: 65535 });
    case 'uint32':
    case 'uint32be':
      return chance.integer({ min: 0, max: 4294967295 });
    case 'buffer8':
    case 'buffer16':
    case 'buffer18':
    case 'buffer32':
    case 'buffer42':
    case 'buffer100':
      bufLen = parseInt(type.slice(6));
      testBuf = Buffer.alloc(bufLen);
      for (k = 0; k < bufLen; k += 1) {
        testBuf[k] = chance.integer({ min: 0, max: 255 });
      }
      return testBuf;
    case 'buffer': {
      // MT CMD Max 256bytes
      const len = chance.integer({ min: 0, max: 256 });
      const buf = randomBuf(5 || len);
      return buf;
    }
    case 'longaddr':
      return '0x00124b00019c2ee9';
    case 'listbuffer': {
      const len = 3;
      const testArr: number[] = new Array(len);
      for (k = 0; k < len; k += 1) {
        testArr[k] = chance.integer({ min: 0, max: 0xfffe });
      }
      return testArr;
    }
    case 'devlistbuffer': {
      // MT CMD Max 256bytes
      const len = chance.integer({ min: 0, max: 128 });
      const arr = new Array(len);
      for (let i = 0; i < len; i++)
        arr[i] = chance.integer({ min: 0, max: 0xffff });
      return arr;
    }
    case 'zdomsgcb':
      // MT CMD Max 256bytes
      bufLen = chance.integer({ min: 0, max: 200 });
      testBuf = Buffer.alloc(bufLen);
      for (k = 0; k < bufLen; k += 1) {
        testBuf[k] = chance.integer({ min: 0, max: 255 });
      }
      return testBuf;
    case '_preLenUint8':
      return randomBuf(10 || randomValidUint8());
    case '_preLenUint16':
      return randomBuf(10 || randomValidUint16le());
    case 'preLenList':
      preBufLen = chance.integer({ min: 1, max: 100 }) * 2;
      return preBufLen / 2;
    case 'preLenBeaconlist': {
      const len = 4 || randomValidUint8();
      const arr: Beacon[] = new Array(len);
      for (let i = 0; i < len; i++)
        arr[i] = {
          srcAddr: randomValidUint16le(),
          padId: randomValidUint16le(),
          logicalChannel: randomValidUint8(),
          permitJoin: randomValidUint8(),
          routerCapacity: randomValidUint8(),
          deviceCapacity: randomValidUint8(),
          protocolVersion: randomValidUint8(),
          stackProfile: randomValidUint8(),
          lqi: randomValidUint8(),
          depth: randomValidUint8(),
          updateId: randomValidUint8(),
          extPandId: randomLongAddrStr(),
        };
      return arr;
    }
    case 'networklist': {
      const len = 4 || randomValidUint8();
      const arr: Network[] = new Array(len);
      for (let i = 0; i < len; i++)
        arr[i] = {
          neighborPanId: randomValidUint16le(),
          logicalChannel: randomValidUint8(),
          stackProfile: chance.integer({ min: 0, max: 0x0f }),
          zigbeeVersion: chance.integer({ min: 0, max: 0x0f }),
          beaconOrder: chance.integer({ min: 0, max: 0x0f }),
          superFrameOrder: chance.integer({ min: 0, max: 0x0f }),
          permitJoin: chance.integer({ min: 0, max: 0xff }), //TODO: probably actually a boolean
        };
      return arr;
    }
    case 'neighborlqilist': {
      const len = 4 || randomValidUint8();
      const arr: NeighborLqi[] = new Array(len);
      for (let i = 0; i < len; i++)
        arr[i] = {
          extPandId: randomLongAddrStr(),
          extAddr: randomLongAddrStr(),
          nwkAddr: randomValidUint16le(),
          deviceType: chance.integer({ min: 0, max: 0x03 }),
          rxOnWhenIdle: chance.integer({ min: 0, max: 0x03 }),
          relationship: chance.integer({ min: 0, max: 0x7 }),
          permitJoin: chance.integer({ min: 0, max: 1 }),
          depth: randomValidUint8(),
          lqi: randomValidUint8(),
        };
      return arr;
    }
    case 'routingtablelist': {
      const len = 4 || randomValidUint8();
      const arr: Routing[] = new Array(len);
      for (let i = 0; i < len; i++)
        arr[i] = {
          destNwkAddr: randomValidUint16le(),
          routeStatus: chance.integer({ min: 0, max: 0x07 }),
          nextHopNwkAddr: randomValidUint16le(),
        };
      return arr;
    }
    case 'bindingtablelist': {
      const len = 4 || randomValidUint8();
      const arr: Binding<0x03>[] = new Array(len);
      const dstAddrMode = 0x03; // TODO: also handle mode 0x01
      for (let i = 0; i < len; i++)
        arr[i] = {
          srcAddr: randomLongAddrStr(),
          srcEp: randomValidUint8(),
          clusterId: randomValidUint16le(),
          dstAddrMode,
          dstAddr: randomLongAddrStr(),
          dstEp: randomValidUint8(),
        };
      return arr;
    }
    case 'preLenUint8BufX2':
      return randomBuf(2 * randomValidUint8());
    case 'varAddr8':
      return chance.pickone([
        { type: 0x03, addr: Buffer.from('00124b00019c2ee9', 'hex') },
        { type: 0x02, addr: 0x2ee9 },
      ]);
    case 'varAddr2':
    case 'varAddr2Rev':
      return chance.pickone([
        { type: 0x00, addr: 0x1010 },
        { type: 0x02, addr: 0x2ee9 },
      ]);
    case 'varAddrVar':
      return chance.pickone([
        { type: 0x03, addr: Buffer.from('00124b00019c2ee9', 'hex') },
        { type: 0x02, addr: 0x2ee9 },
      ]);
  }
  throw new Error(`Unimplemented random ${type} for arg ${name}`);
};
