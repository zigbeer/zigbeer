import { ZclID } from "zcl-id"
import { zclFactory } from "../src"

const zclId: ZclID = require("zcl-id/dist/legacy")
const zcl = zclFactory(zclId)

describe("Module Methods Check", function() {
  describe("zcl foundation #.frame and #.parse Check", function() {
    const zclFrames = [
      {
        frameCntl: {
          frameType: 0,
          manufSpec: 0,
          direction: 0,
          disDefaultRsp: 1
        },
        manufCode: 0,
        seqNum: 0,
        cmdId: "writeUndiv",
        payload: [
          { attrId: 0x1234, dataType: 0x41, attrData: "hello" },
          { attrId: 0xabcd, dataType: 0x24, attrData: 0x6400000966 },
          { attrId: 0x1234, dataType: 0x08, attrData: 60 }
        ]
      },
      {
        frameCntl: {
          frameType: 0,
          manufSpec: 1,
          direction: 0,
          disDefaultRsp: 1
        },
        manufCode: 0xaaaa,
        seqNum: 1,
        cmdId: "configReport",
        payload: [
          {
            direction: 0,
            attrId: 0x0001,
            dataType: 0x20,
            minRepIntval: 500,
            maxRepIntval: 1000,
            repChange: 10
          },
          { direction: 1, attrId: 0x0001, timeout: 999 },
          {
            direction: 0,
            attrId: 0x0001,
            dataType: 0x43,
            minRepIntval: 100,
            maxRepIntval: 200
          }
        ]
      },
      {
        frameCntl: {
          frameType: 0,
          manufSpec: 0,
          direction: 1,
          disDefaultRsp: 1
        },
        manufCode: 0,
        seqNum: 2,
        cmdId: "writeStruct",
        payload: [
          {
            attrId: 0x0011,
            selector: { indicator: 3, indexes: [0x0101, 0x0202, 0x0303] },
            dataType: 0x21,
            attrData: 60000
          },
          {
            attrId: 0x0022,
            selector: { indicator: 0 },
            dataType: 0x50,
            attrData: { elmType: 0x20, numElms: 3, elmVals: [1, 2, 3] }
          },
          {
            attrId: 0x0033,
            selector: { indicator: 1, indexes: [0x0101] },
            dataType: 0x4c,
            attrData: {
              numElms: 0x01,
              structElms: [{ elmType: 0x20, elmVal: 1 }]
            }
          }
        ]
      }
    ]

    zclFrames.forEach(zclFrame => {
      let buf

      it("should frame and parse foundation/" + zclFrame.cmdId, () => {
        buf = zcl.frame(
          zclFrame.frameCntl,
          zclFrame.manufCode,
          zclFrame.seqNum,
          zclFrame.cmdId,
          zclFrame.payload
        )
        expect.assertions(1)
        return new Promise((resolve, reject) => {
          zcl.parse(buf, ((err, result) => {
            if (err) reject(err)
            expect(result).toEqual(zclFrame)
            resolve()
          }) as any)
        })
      })
    })
  })

  describe("zcl functional #.frame and #.parse Check", function() {
    const zclFrames = [
      {
        frameCntl: {
          frameType: 1,
          manufSpec: 0,
          direction: 0,
          disDefaultRsp: 1
        },
        manufCode: 0,
        seqNum: 0,
        cmdId: "add",
        payload: {
          groupid: 0x1234,
          sceneid: 0x08,
          transtime: 0x2468,
          scenename: "genscenes",
          extensionfieldsets: [
            { clstId: 0x0006, len: 0x3, extField: [0x01, 0x02, 0x03] },
            {
              clstId: 0x0009,
              len: 0x5,
              extField: [0x05, 0x04, 0x03, 0x02, 0x01]
            }
          ]
        }
      },
      {
        frameCntl: {
          frameType: 1,
          manufSpec: 1,
          direction: 1,
          disDefaultRsp: 0
        },
        manufCode: 0xaaaa,
        seqNum: 1,
        cmdId: "addRsp",
        payload: {
          status: 0x26,
          groupId: 0xffff,
          sceneId: 0x06
        }
      },
      {
        frameCntl: {
          frameType: 1,
          manufSpec: 0,
          direction: 1,
          disDefaultRsp: 1
        },
        manufCode: 0,
        seqNum: 2,
        cmdId: "getSceneMembershipRsp",
        payload: {
          status: 0x01,
          capacity: 0x02,
          groupid: 0x2468,
          scenecount: 3,
          scenelist: [0x22, 0x33, 0x56]
        }
      }
    ]

    zclFrames.forEach(zclFrame => {
      it(
        "should frame and parse " + "<clusterName>" + "/" + zclFrame.cmdId,
        function() {
          const buf = zcl.frame(
            zclFrame.frameCntl,
            zclFrame.manufCode,
            zclFrame.seqNum,
            zclFrame.cmdId,
            zclFrame.payload,
            0x0005
          )

          expect.assertions(1)
          return new Promise((resolve, reject) => {
            zcl.parse(buf, 0x0005, ((err, result) => {
              if (err) reject(err)
              if (result.cmdId === "add") {
                result.frameCntl.direction = 0
              } else {
                result.frameCntl.direction = 1
              }

              expect(result).toEqual(zclFrame)
              resolve()
            }) as any)
          })
        }
      )
    })
  })

  describe("zcl #.header Check", function() {
    const headers = [
      {
        buf: new Buffer([0x00, 0x00, 0x00]),
        obj: {
          frameCntl: {
            frameType: 0,
            manufSpec: 0,
            direction: 0,
            disDefaultRsp: 0
          },
          manufCode: 0,
          seqNum: 0,
          cmdId: 0
        }
      },
      {
        buf: new Buffer([0x1d, 0x34, 0x12, 0xff, 0x01]),
        obj: {
          frameCntl: {
            frameType: 1,
            manufSpec: 1,
            direction: 1,
            disDefaultRsp: 1
          },
          manufCode: 0x1234,
          seqNum: 0xff,
          cmdId: 0x01
        }
      }
    ]

    headers.forEach(function(header) {
      const result = zcl.header(header.buf)

      it("zcl header Check", function() {
        expect(result).toEqual(header.obj)
      })
    })
  })

  describe("zcl #.header Check - Bad command", function() {
    var headers = [
      {
        buf: new Buffer([0x1e, 0x34, 0x12, 0xff, 0x01])
      },
      {
        buf: new Buffer([0x1f, 0x34, 0x12, 0xff, 0x01])
      }
    ]

    headers.forEach(function(header) {
      var result = zcl.header(header.buf)
      it("zcl header Check", function() {
        expect(result).toBeUndefined()
      })
    })
  })
})
