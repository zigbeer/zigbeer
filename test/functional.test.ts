import Chance = require("chance")
const chance = new Chance()
import { ZclID } from "zcl-id"
const zclId: ZclID = require("zcl-id/dist/legacy")
import { getStdType } from "../src/definition"
import { FuncPayload } from "../src/functional"
import { BufferWithPointer, BufferBuilder } from "../src/buffer"

const clusterIds = Object.keys(
  require("zcl-id/src/definitions/common.json").clusterId
)

describe("Functional Cmd framer and parser Check", function() {
  for (const cluster of clusterIds) {
    const cInfo = zclId._getCluster(cluster)

    if (!cInfo || !cInfo.cmd) continue

    const cmdIds = cInfo.cmd.enums.map(cmdObj => cmdObj.key)

    for (const cmd of cmdIds) {
      const reqParams = zclId.zclmeta.functional.getParams(cluster, cmd)

      if (!reqParams) continue

      const args = {}
      for (const param of reqParams) {
        args[param.name] = randomArg(param.type)
      }

      it(`${cmd} frame() and parse()`, () => {
        const funcObj = new FuncPayload(cluster, 0, cmd, zclId)
        const c = new BufferBuilder()
        funcObj.frame(c, args)
        const result = funcObj.parse(new BufferWithPointer(c.result()))
        expect(result).toEqual(args)
      })
    }
  }
})

describe("Functional CmdRsp framer and parser Check", function() {
  for (const cluster of clusterIds) {
    const cInfo = zclId._getCluster(cluster)

    if (!cInfo || !cInfo.cmdRsp) continue

    const cmdRspIds = cInfo.cmdRsp.enums.map(cmdObj => cmdObj.key)

    for (const cmdRsp of cmdRspIds) {
      if (["reportRssiMeas"].includes(cmdRsp)) continue

      const reqParams = zclId.zclmeta.functional.getParams(cluster, cmdRsp)

      if (!reqParams) continue

      const args = {}
      for (const param of reqParams) {
        args[param.name] = randomArg(param.type)
      }

      it(`${cmdRsp} frame() and parse()`, () => {
        const funcObj = new FuncPayload(cluster, 1, cmdRsp, zclId)
        const c = new BufferBuilder()
        funcObj.frame(c, args)

        const result = funcObj.parse(new BufferWithPointer(c.result()))
        expect(result).toEqual(args)
      })
    }
  }
})

function tryRandomArg(type) {
  switch (type) {
    case "uint8":
      return chance.integer({ min: 0, max: 0xff })
    case "uint16":
      return chance.integer({ min: 0, max: 0xffff })
    case "uint32":
      return chance.integer({ min: 0, max: 0xffffffff })
    case "int8":
      return chance.integer({ min: -0x80, max: 0x7f })
    case "int16":
      return chance.integer({ min: -0x8000, max: 0x7fff })
    case "int32":
      return chance.integer({ min: -0x80000000, max: 0x7fffffff })
    case "floatle":
      return chance.floating({ min: 0, max: 0xffffffff })
    case "ieeeAddr":
      return Buffer.from("00124b00019c2ee9", "hex")
    case "strPreLenUint8":
      const length = chance.integer({ min: 0, max: 0xff })
      return chance.string({ length })
    case "preLenUint8":
    case "preLenUint16":
    case "preLenUint32":
      return 10
    case "dynUint8":
    case "dynUint16":
    case "dynUint24":
    case "dynUint32": {
      const testArr: number[] = []
      for (let k = 0; k < 10; k += 1) {
        if (type === "dynUint8") {
          testArr[k] = chance.integer({ min: 0, max: 0xff })
        } else if (type === "dynUint16") {
          testArr[k] = chance.integer({ min: 0, max: 0xffff })
        } else if (type === "dynUint24") {
          testArr[k] = chance.integer({ min: 0, max: 0xffffff })
        } else if (type === "dynUint32") {
          testArr[k] = chance.integer({ min: 0, max: 0xffffffff })
        }
      }
      return testArr
    }
    case "neighborsInfo":
      const testBuf = new Buffer(16)
      for (let k = 0; k < 16; k += 1) {
        testBuf[k] = chance.integer({ min: 0, max: 0xff })
      }
      return testBuf
    case "zonebuffer":
      const testArr: number[] = []
      for (let k = 0; k < 20; k += 2) {
        testArr[k] = chance.integer({ min: 0, max: 0xff })
        testArr[k + 1] = chance.integer({ min: 0, max: 0xffff })
      }
      return testArr
    case "extfieldsets":
      return [
        { clstId: 0x0006, len: 0x3, extField: [0x01, 0x02, 0x03] },
        { clstId: 0x0009, len: 0x5, extField: [0x05, 0x04, 0x03, 0x02, 0x01] }
      ]
    default:
      break
  }
}

function randomArg(type) {
  const arg = tryRandomArg(type)
  if (typeof arg !== "undefined") return arg
  return tryRandomArg(getStdType(type))
}
