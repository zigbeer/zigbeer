import { ZclID } from "zcl-id"
import { FoundPayload } from "./foundation"
import { FuncPayload } from "./functional"
import { Callback } from "./typeUtils"
import { BufferBuilder, BufferWithPointer } from "./buffer"

interface FrameControl {
  frameType: number
  manufSpec: number
  direction: number
  disDefaultRsp: number
}

interface ZclFrameObject {
  frameCntl: FrameControl
  manufCode: number
  seqNum: number
  cmdId: number
  payload: Buffer
}

const specialReads = {
  header: (r: BufferWithPointer) => {
    const frameCntlByte = r.uint8()
    const frameCntl = {
      frameType: frameCntlByte & 0x03,
      manufSpec: (frameCntlByte & 0x04) >> 2,
      direction: (frameCntlByte & 0x08) >> 3,
      disDefaultRsp: (frameCntlByte & 0x10) >> 4
    }
    // TODO: Should do something if frameType > 0x01 || direction > 0x01 || cmdId > 0x7f
    return {
      frameCntl,
      manufCode: frameCntl.manufSpec ? r.uint16le() : 0, // TODO: change to `undefined`, in framer too
      seqNum: r.uint8(),
      cmdId: r.uint8()
    }
  }
}
const assertNumber = (name: string, param: any): param is number => {
  if (typeof param !== "number") {
    throw new TypeError(`${name} should be a number, got ${param} instead`)
  }
  if (isNaN(param)) {
    throw new TypeError(`${name} is NaN`)
  }
  return true
}
const assertNumberOrString = (
  name: string,
  param: any
): typeof param extends string | number ? void : never => {
  if (typeof param === "string") return

  if (typeof param !== "number")
    throw new TypeError(
      `${name} should be a number or string, got ${param} instead`
    )

  if (isNaN(param)) throw new TypeError(`${name} is NaN`)
}
const specialWrites = {
  header(
    c: BufferBuilder,
    frameCntl: ZclFrameObject["frameCntl"],
    manufCode: ZclFrameObject["manufCode"],
    seqNum: ZclFrameObject["seqNum"],
    cmdId: ZclFrameObject["cmdId"]
  ) {
    assertNumber("frameType", frameCntl.frameType)
    assertNumber("manufSpec", frameCntl.manufSpec)
    assertNumber("direction", frameCntl.direction)
    assertNumber("disDefaultRsp", frameCntl.disDefaultRsp)
    assertNumber("manufCode", manufCode)
    assertNumber("seqNum", seqNum)
    assertNumber("cmdId", cmdId)

    const frameCntlOctet =
      (frameCntl.frameType & 0x03) |
      ((frameCntl.manufSpec << 2) & 0x04) |
      ((frameCntl.direction << 3) & 0x08) |
      ((frameCntl.disDefaultRsp << 4) & 0x10)
    c.uint8(frameCntlOctet)

    if (frameCntl.manufSpec === 1) {
      c.uint16le(manufCode)
    }

    c.uint8(seqNum).uint8(cmdId)
  }
}

const zclFactory = (zclId: ZclID) => {
  function parse(buf: Buffer, clusterId?: string | number) {
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError("buf should be a buffer.")
    }
    const r = new BufferWithPointer(buf)
    const data = specialReads.header(r)
    const { frameCntl, manufCode, seqNum, cmdId } = data
    const { frameType, direction } = frameCntl
    const zclObj = getPayloadInstance(
      zclId,
      frameType,
      cmdId,
      direction,
      clusterId
    )
    const payload = zclObj.parse(r)
    return {
      frameCntl,
      manufCode,
      seqNum,
      // to make sure data.cmdId will be string
      cmdId: zclObj.cmd,
      payload
    }
  }

  const zcl = {
    parse,
    frame(
      frameCntl: ZclFrameObject["frameCntl"],
      manufCode: number,
      seqNum: number,
      cmd: string | number,
      zclPayload: Record<string, any> | any[],
      clusterId?: string | number
    ) {
      // frameCntl: Object, manufCode: Number, seqNum: Number, cmd: String | Number, zclPayload: Object | Array, clusterId: String | Number
      if (typeof frameCntl !== "object" || Array.isArray(frameCntl)) {
        throw new TypeError("frameCntl should be an object")
      }
      if (typeof zclPayload !== "object" || zclPayload === null) {
        throw new TypeError("zclPayload should be an object or an array")
      }

      const zclObj = getPayloadInstance(
        zclId,
        frameCntl.frameType,
        cmd,
        frameCntl.direction,
        clusterId
      )

      const c = new BufferBuilder()
      specialWrites.header(c, frameCntl, manufCode, seqNum, zclObj.cmdId)
      zclObj.frame(c, zclPayload)
      return c.result()
    },

    header(buf: Buffer) {
      if (!Buffer.isBuffer(buf))
        throw new TypeError("header should be a buffer.")

      const headerObj = specialReads.header(new BufferWithPointer(buf))
      if (headerObj.frameCntl.frameType > 0x01 || headerObj.cmdId > 0x7f) return // TODO: Maybe this should throw.
      return headerObj
    }
  }

  return zcl

  function getPayloadInstance(
    zclId: ZclID,
    frameType: number,
    cmd: string | number,
    direction?: 0 | 1 | number,
    clusterId?: string | number
  ) {
    switch (frameType) {
      case 0:
        return new FoundPayload(cmd, zclId)
      case 1:
        switch (direction) {
          case 0:
          case 1:
            assertNumberOrString("clusterId", clusterId)
            return new FuncPayload(clusterId!, direction, cmd, zclId)
          default:
            throw new TypeError(`Reserved direction: ${direction}`)
        }
      default:
        throw new TypeError(`Reserved frameType: ${frameType}`)
    }
  }
}

export { zclFactory }
