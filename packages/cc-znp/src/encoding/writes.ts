import { BufferBuilder } from 'buffster';
import { writeAddrString } from './writeUtils';
import {
  Beacon,
  writeBeacon,
  Network,
  writeNetwork,
  NeighborLqi,
  writeNeighborLqi,
  Routing,
  writeRouting,
  Binding,
  writeBinding,
} from './structs';
import { DevList, Uint16 } from './types';
const writeBuffer = (c: BufferBuilder, value: number[] | Buffer) =>
  c.buffer(Buffer.from(value as number[])); // TODO: only accept Buffer
interface ShortVarAddr {
  type: 0x00 | 0x01 | 0x02 | 0xff;
  addr: Uint16;
}
type VarAddr = ShortVarAddr | { type: 0x03; addr: Buffer };
export const writeDataTable = {
  uint8: (c: BufferBuilder, value: number) => c.uint8(value),
  uint16: (c: BufferBuilder, value: number) => c.uint16le(value),
  uint32: (c: BufferBuilder, value: number) => c.uint32le(value),
  uint32be: (c: BufferBuilder, value: number) => c.uint32be(value),
  buffer: writeBuffer,
  buffer8: writeBuffer,
  buffer16: writeBuffer,
  buffer18: writeBuffer,
  buffer32: writeBuffer,
  buffer42: writeBuffer,
  buffer100: writeBuffer,
  zdomsgcb: writeBuffer,
  devlistbuffer: (c: BufferBuilder, value: DevList) => {
    for (const uint16 of value) c.uint16le(uint16);
  },
  preLenList: (c: BufferBuilder, value: Buffer) => {
    c.uint8(value.length / 2);
    // c.buffer(value); //TODO: Write it here
  },
  _preLenUint8: (c: BufferBuilder, value: Buffer) =>
    c.uint8(value.length).buffer(value),
  _preLenUint16: (c: BufferBuilder, value: Buffer) =>
    c.uint16le(value.length).buffer(value),
  preLenUint8BufX2: (c: BufferBuilder, value: Buffer) =>
    c.uint8(value.length / 2).buffer(value),
  preLenBeaconlist: (c: BufferBuilder, value: Beacon[]) => {
    c.uint8(value.length);
    for (const beac of value) writeBeacon(c, beac);
  },
  networklist: (c: BufferBuilder, value: Network[]) => {
    c.uint8(value.length);
    for (const net of value) writeNetwork(c, net);
  },
  neighborlqilist: (c: BufferBuilder, value: NeighborLqi[]) => {
    c.uint8(value.length);
    for (const neighbor of value) writeNeighborLqi(c, neighbor);
  },
  routingtablelist: (c: BufferBuilder, value: Routing[]) => {
    c.uint8(value.length);
    for (const routing of value) writeRouting(c, routing);
  },
  bindingtablelist: (c: BufferBuilder, value: Binding<any>[]) => {
    c.uint8(value.length);
    for (const bind of value) writeBinding(c, bind);
  },
  uint8ZdoInd: (c: BufferBuilder, value: number) => c.uint8(value),
  longaddr: (c: BufferBuilder, value: string | Buffer) => {
    if (Buffer.isBuffer(value)) {
      if (value.length !== 8)
        throw new TypeError(`Expected Buffer of length 8, got ${value.length}`);
      c.buffer(value);
    }
    // TODO: only accept Buffer
    if (typeof value === 'string') writeAddrString(c, value);
  },
  listbuffer: (c: BufferBuilder, value: number[]) => {
    c.uint8(value.length);
    for (const uint16le of value) c.uint16le(uint16le);
  },
  varAddr8: (c: BufferBuilder, value: VarAddr) => {
    c.uint8(value.type);
    if (value.type === 0x03) c.buffer(value.addr);
    else c.uintle(0, 6).uint16le(value.addr);
  },
  varAddr2: (c: BufferBuilder, value: ShortVarAddr) => {
    c.uint8(value.type).uint16le(value.addr);
  },
  varAddr2Rev: (c: BufferBuilder, value: ShortVarAddr) => {
    c.uint16le(value.addr).uint8(value.type);
  },
  varAddrVar: (c: BufferBuilder, value: VarAddr) => {
    c.uint8(value.type);
    if (value.type === 0x03) c.buffer(value.addr);
    else c.uint16le(value.addr);
  },
};
