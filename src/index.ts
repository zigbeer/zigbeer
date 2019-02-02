import Concentrate = require("concentrate")
import dissolveChunks = require("dissolve-chunks")
import { ZclID } from "zcl-id"
import { foundPayloadFactory } from "./foundation"
import { funcPayloadFactory } from "./functional"
import { Callback } from "./typeUtils"

interface ZclFrameObject {
  frameCntl: {
    frameType: number
    manufSpec: number
    direction: number
    disDefaultRsp: number
  }
  manufCode: number
  seqNum: number
  cmdId: number
  payload: Buffer
}

function zclFactory(zclId: ZclID) {
  const ru = dissolveChunks().Rule()

  const FoundPayload = foundPayloadFactory(zclId)
  const FuncPayload = funcPayloadFactory(zclId)

  class ZclFrame {
    parse(buf: Buffer, callback: (result: any) => void) {
      const parser = dissolveChunks()
        .join(ru.zclFrame(buf.length))
        .compile({ once: true })

      parser.once("parsed", callback)

      parser.end(buf)
    }

    frame(
      frameCntl: ZclFrameObject["frameCntl"],
      manufCode: ZclFrameObject["manufCode"],
      seqNum: ZclFrameObject["seqNum"],
      cmdId: ZclFrameObject["cmdId"],
      payload: ZclFrameObject["payload"]
    ) {
      if (!isNumber(manufCode))
        throw new TypeError("manufCode should be a number")
      if (!isNumber(seqNum)) throw new TypeError("seqNum should be a number")

      const frameCntlOctet =
        (frameCntl.frameType & 0x03) |
        ((frameCntl.manufSpec << 2) & 0x04) |
        ((frameCntl.direction << 3) & 0x08) |
        ((frameCntl.disDefaultRsp << 4) & 0x10)
      const c = new Concentrate()

      c.uint8(frameCntlOctet)

      if (frameCntl.manufSpec === 1) {
        c.uint16le(manufCode)
      }

      c.uint8(seqNum)
        .uint8(cmdId)
        .buffer(payload)

      return c.result()
    }
  }

  /*
        Add Parsing Rules to DChunks
    */
  ru.clause("zclFrame", function(bufLen) {
    this.uint8("frameCntl").tap(function() {
      const val = this.vars.frameCntl

      const frameType = val & 0x03
      const manufSpec = (val & 0x04) >> 2
      const direction = (val & 0x08) >> 3
      const disDefaultRsp = (val & 0x10) >> 4
      const frameCntl = {
        frameType,
        manufSpec,
        direction,
        disDefaultRsp
      }
      this.vars.frameCntl = frameCntl

      if (manufSpec) {
        this.uint16("manufCode")
      } else {
        this.vars.manufCode = 0
      }

      this.uint8("seqNum")
        .uint8("cmdId")
        .buffer("payload", bufLen - (manufSpec ? 5 : 3))
    })
  })

  function isNumber(param) {
    if (typeof param !== "number") {
      return false
    }
    if (typeof param === "number") {
      return !isNaN(param)
    }
    return true
  }

  function parse(zclBuf: Buffer, callback: Callback<any>): void
  function parse(
    zclBuf: Buffer,
    clusterId: string | number,
    callback: Callback<any>
  ): void
  function parse(
    zclBuf: Buffer,
    arg2: string | number | Callback<any>,
    arg3?: Callback<any>
  ): void {
    let zclObj
    const zclFrame = new ZclFrame()

    const callback = (arg3 ? arg3 : arg2) as Callback<any>
    const clusterId = (arg3 ? arg2 : undefined) as string | number | undefined

    if (!Buffer.isBuffer(zclBuf)) {
      return callback(new TypeError("zclBuf should be a buffer."))
    }

    zclFrame.parse(zclBuf, function(data) {
      // data = { frameCntl: { frameType, manufSpec, direction, disDefaultRsp }, manufCode, seqNum, cmdId, payload }
      if (data.frameCntl.frameType === 0) {
        zclObj = new FoundPayload(data.cmdId)
      } else if (data.frameCntl.frameType === 1) {
        if (!clusterId) {
          return callback(new TypeError("clusterId should be given."))
        }

        zclObj = new FuncPayload(
          clusterId,
          data.frameCntl.direction,
          data.cmdId
        )
      }

      // make sure data.cmdId will be string
      data.cmdId = zclObj.cmd

      zclObj.parse(data.payload, (err, payload) => {
        if (err) {
          return callback(err)
        }

        data.payload = payload
        callback(null, data)
      })
    })
  }

  const zcl = {
    parse,

    frame(frameCntl, manufCode, seqNum, cmd, zclPayload, clusterId) {
      // frameCntl: Object, manufCode: Number, seqNum: Number, cmd: String | Number, zclPayload: Object | Array, clusterId: String | Number
      let zclObj
      const zclFrame = new ZclFrame()

      if (typeof frameCntl !== "object" || Array.isArray(frameCntl)) {
        throw new TypeError("frameCntl should be an object")
      }
      if (typeof zclPayload !== "object" || zclPayload === null) {
        throw new TypeError("zclPayload should be an object or an array")
      }

      if (frameCntl.frameType === 0) {
        zclObj = new FoundPayload(cmd)
      } else if (frameCntl.frameType === 1) {
        if (!clusterId) throw new TypeError("clusterId should be given.")

        zclObj = new FuncPayload(clusterId, frameCntl.direction, cmd)
      }

      return zclFrame.frame(
        frameCntl,
        manufCode,
        seqNum,
        zclObj.cmdId as any,
        zclObj.frame(zclPayload) as any
      )
    },

    header(buf: Buffer) {
      if (!Buffer.isBuffer(buf))
        throw new TypeError("header should be a buffer.")
      let i = 0
      const headByte = buf.readUInt8(0)
      i++
      const frameCntl = {
        frameType: headByte & 0x03,
        manufSpec: (headByte >> 2) & 0x01,
        direction: (headByte >> 3) & 0x01,
        disDefaultRsp: (headByte >> 4) & 0x01
      }

      const manufSpec = frameCntl.manufSpec === 1
      let manufCode: number | null
      if (manufSpec) {
        manufCode = buf.readUInt16LE(i)
        i += 2
      } else manufCode = null

      const seqNum = buf.readUInt8(i)
      i++
      const cmdId = buf.readUInt8(i)

      if (frameCntl.frameType < 0x02 && cmdId < 0x80) {
        return {
          frameCntl,
          manufCode,
          seqNum,
          cmdId
        }
      }
    }
  }

  return zcl
}

export { zclFactory }
