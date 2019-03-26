import { BufferBuilder, BufferWithPointer } from 'buffster';
import { readAddrString } from './readUtils';
import { writeAddrString } from './writeUtils';
import { Uint16, Uint8, AddrStr } from './types';
export interface Network {
  neighborPanId: Uint16;
  logicalChannel: Uint8;
  stackProfile: number;
  zigbeeVersion: number;
  beaconOrder: number;
  superFrameOrder: number;
  permitJoin: number;
}
export const readNetwork = (r: BufferWithPointer): Network => {
  const neighborPanId = r.uint16le();
  r.fwd(6);
  const logicalChannel = r.uint8();
  const byte1 = r.uint8();
  const stackProfile = byte1 & 0x0f;
  const zigbeeVersion = (byte1 & 0xf0) >> 4;
  const byte2 = r.uint8();
  const beaconOrder = byte2 & 0x0f;
  const superFrameOrder = (byte2 & 0xf0) >> 4;
  const permitJoin = r.uint8();
  return {
    neighborPanId,
    logicalChannel,
    stackProfile,
    zigbeeVersion,
    beaconOrder,
    superFrameOrder,
    permitJoin,
  };
};
export const writeNetwork = (c: BufferBuilder, net: Network) => {
  c.uint16le(net.neighborPanId);
  c.uintle(0, 6); //TODO: What actually goes here?
  c.uint8(net.logicalChannel);
  const byte1 = net.stackProfile + (net.zigbeeVersion << 4);
  c.uint8(byte1);
  const byte2 = net.beaconOrder + (net.superFrameOrder << 4);
  c.uint8(byte2);
  c.uint8(net.permitJoin);
};
export interface NeighborLqi {
  extPandId: AddrStr;
  extAddr: AddrStr;
  nwkAddr: Uint16;
  /**
   * Bits 1-0
   */
  deviceType: number;
  /**
   * Bits 3-2
   */
  rxOnWhenIdle: number;
  /**
   * Bits 6-4
   */
  relationship: number;
  permitJoin: number;
  depth: Uint8;
  lqi: Uint8;
}
export const readNeighborLqi = (r: BufferWithPointer): NeighborLqi => {
  const extPandId = readAddrString(r);
  const extAddr = readAddrString(r);
  const nwkAddr = r.uint16le();
  const byte = r.uint8(); // TODO: Make sure this isn't backwards
  const deviceType = byte & 0x03;
  const rxOnWhenIdle = (byte & 0x0c) >> 2;
  const relationship = (byte & 0x70) >> 4;
  const permitJoin = r.uint8() & 0x03;
  const depth = r.uint8();
  const lqi = r.uint8();
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
};
export const writeNeighborLqi = (c: BufferBuilder, value: NeighborLqi) => {
  writeAddrString(c, value.extPandId);
  writeAddrString(c, value.extAddr);
  c.uint16le(value.nwkAddr);
  const byte =
    value.deviceType + (value.rxOnWhenIdle << 2) + (value.relationship << 4); // TODO: Make sure this isn't backwards
  c.uint8(byte)
    .uint8(value.permitJoin)
    .uint8(value.depth)
    .uint8(value.lqi);
};
export interface Routing {
  destNwkAddr: Uint16;
  routeStatus: Uint8;
  nextHopNwkAddr: Uint16;
}
export const readRouting = (r: BufferWithPointer): Routing => ({
  destNwkAddr: r.uint16le(),
  routeStatus: r.uint8() & 0x07,
  nextHopNwkAddr: r.uint16le(),
});
export const writeRouting = (c: BufferBuilder, value: Routing) =>
  c
    .uint16le(value.destNwkAddr)
    .uint8(value.routeStatus)
    .uint16le(value.nextHopNwkAddr);
export interface Binding<M extends 0x01 | 0x03> {
  srcAddr: AddrStr;
  srcEp: Uint8;
  clusterId: Uint16;
  /**
   * The addressing mode for the destination address used in this command.
   * This field can take one of the non-reserved values from the following list:
   * - 0x00 = reserved
   * - 0x01 = 16-bit group address for DstAddress and DstEndp not present
   * - 0x02 = reserved
   * - 0x03 = 64-bit extended address for DstAddress and DstEndp present
   * - 0x04 – 0xff = reserved
   */
  dstAddrMode: M;
  dstAddr: {
    0x01: Uint16;
    0x03: AddrStr;
  }[M];
  dstEp: {
    0x01: undefined;
    0x03: Uint8;
  }[M];
}
export const readBinding = (r: BufferWithPointer): Binding<any> => {
  const srcAddr = readAddrString(r);
  const srcEp = r.uint8();
  const clusterId = r.uint16le();
  const dstAddrMode = r.uint8();
  // Addr64Bit
  if (dstAddrMode === 0x03)
    return {
      srcAddr,
      srcEp,
      clusterId,
      dstAddrMode,
      dstAddr: readAddrString(r),
      dstEp: r.uint8(),
    };
  if (dstAddrMode === 0x01)
    return {
      srcAddr,
      srcEp,
      clusterId,
      dstAddrMode,
      dstAddr: r.uint16le(),
      dstEp: undefined,
    };
  throw new Error(`Reserved dstAddrMode ${dstAddrMode}`);
};
export const writeBinding = (c: BufferBuilder, value: Binding<any>) => {
  writeAddrString(c, value.srcAddr);
  c.uint8(value.srcEp)
    .uint16le(value.clusterId)
    .uint8(value.dstAddrMode);
  if (value.dstAddrMode === 0x03) {
    writeAddrString(c, value.dstAddr);
    c.uint8(value.dstEp);
    return;
  }
  if (value.dstAddrMode === 0x01) {
    c.uint16le(value.dstAddr);
    return;
  }
  throw new Error(`Reserved dstAddrMode ${value.dstAddrMode}`);
};
export interface Beacon {
  srcAddr: Uint16;
  padId: Uint16;
  logicalChannel: Uint8;
  permitJoin: Uint8;
  routerCapacity: Uint8;
  deviceCapacity: Uint8;
  protocolVersion: Uint8;
  stackProfile: Uint8;
  lqi: Uint8;
  depth: Uint8;
  updateId: Uint8;
  extPandId: AddrStr;
}
export const readBeacon = (r: BufferWithPointer): Beacon => ({
  srcAddr: r.uint16le(),
  padId: r.uint16le(),
  logicalChannel: r.uint8(),
  permitJoin: r.uint8(),
  routerCapacity: r.uint8(),
  deviceCapacity: r.uint8(),
  protocolVersion: r.uint8(),
  stackProfile: r.uint8(),
  lqi: r.uint8(),
  depth: r.uint8(),
  updateId: r.uint8(),
  extPandId: readAddrString(r),
});
export const writeBeacon = (c: BufferBuilder, beac: Beacon) => {
  c.uint16le(beac.srcAddr)
    .uint16le(beac.padId)
    .uint8(beac.logicalChannel)
    .uint8(beac.permitJoin)
    .uint8(beac.routerCapacity)
    .uint8(beac.deviceCapacity)
    .uint8(beac.protocolVersion)
    .uint8(beac.stackProfile)
    .uint8(beac.lqi)
    .uint8(beac.depth)
    .uint8(beac.updateId);
  writeAddrString(c, beac.extPandId);
};
