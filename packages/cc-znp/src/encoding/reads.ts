import { BufferWithPointer } from 'buffster';
import { readAddrString } from './readUtils';
import {
  readNetwork,
  readNeighborLqi,
  readRouting,
  readBinding,
  readBeacon,
} from './structs';
import { Uint16 } from './types';
export const readTable = {
  uint8: (r: BufferWithPointer) => r.uint8(),
  uint16: (r: BufferWithPointer) => r.uint16le(),
  uint32: (r: BufferWithPointer) => r.uint32le(),
  buffer: (r: BufferWithPointer) => r.rest(),
  buffer8: (r: BufferWithPointer) => r.buffer(8),
  buffer16: (r: BufferWithPointer) => r.buffer(16),
  buffer18: (r: BufferWithPointer) => r.buffer(18),
  buffer32: (r: BufferWithPointer) => r.buffer(32),
  buffer42: (r: BufferWithPointer) => r.buffer(42),
  buffer100: (r: BufferWithPointer) => r.buffer(100),
  _preLenUint8: (r: BufferWithPointer) => r.buffer(r.uint8()),
  _preLenUint16: (r: BufferWithPointer) => r.buffer(r.uint16le()),
  preLenUint8BufX2: (r: BufferWithPointer) => r.buffer(2 * r.uint8()),
  longaddr: (r: BufferWithPointer) => readAddrString(r),
  uint8ZdoInd: (r: BufferWithPointer) => {
    if (r.remaining() === 3) return { nwkaddr: r.uint16le(), val: r.uint8() };
    if (r.remaining() === 1) return { val: r.uint8() };
    // TODO: Should this throw if neither matched?
  },
  devlistbuffer: (r: BufferWithPointer) => {
    const list: number[] = [];
    while (r.remaining()) list.push(r.uint16le());
    return list;
  },
  networklist: (r: BufferWithPointer) => {
    const len = r.uint8();
    const list: ReturnType<typeof readNetwork>[] = new Array(len);
    for (let i = 0; i < len; i++) list[i] = readNetwork(r);
    return list;
  },
  neighborlqilist: (r: BufferWithPointer) => {
    const len = r.uint8();
    const list: ReturnType<typeof readNeighborLqi>[] = new Array(len);
    for (let i = 0; i < len; i++) list[i] = readNeighborLqi(r);
    return list;
  },
  routingtablelist: (r: BufferWithPointer) => {
    const len = r.uint8();
    const list: ReturnType<typeof readRouting>[] = new Array(len);
    for (let i = 0; i < len; i++) list[i] = readRouting(r);
    return list;
  },
  bindingtablelist: (r: BufferWithPointer) => {
    const len = r.uint8();
    const list: ReturnType<typeof readBinding>[] = new Array(len);
    for (let i = 0; i < len; i++) list[i] = readBinding(r);
    return list;
  },
  zdomsgcb: (r: BufferWithPointer) => r.rest(),
  preLenList: (r: BufferWithPointer) => {
    const len = r.uint8();
    return r.buffer(2 * len);
  },
  preLenBeaconlist: (r: BufferWithPointer) => {
    const len = r.uint8();
    const list: ReturnType<typeof readBeacon>[] = new Array(len);
    for (let i = 0; i < len; i++) list[i] = readBeacon(r);
    return list;
  },
  listbuffer: (r: BufferWithPointer) => {
    const len = r.uint8();
    const list: Uint16[] = new Array(len);
    for (let i = 0; i < len; i++) list[i] = r.uint16le();
    return list;
  },
  uint32be: (r: BufferWithPointer) => r.slice(4).readUInt32BE(0),
  varAddr8: (r: BufferWithPointer) => {
    const type = r.uint8();
    return {
      type,
      addr: type === 0x03 ? r.buffer(8) : (r.fwd(6), r.uint16le()),
    };
  },
  varAddr2: (r: BufferWithPointer) => {
    return { type: r.uint8(), addr: r.uint16le() };
  },
  varAddr2Rev: (r: BufferWithPointer) => {
    return { addr: r.uint16le(), type: r.uint8() };
  },
  varAddrVar: (r: BufferWithPointer) => {
    const type = r.uint8();
    return { type, addr: type === 0x03 ? r.buffer(8) : r.uint16le() };
  },
};
