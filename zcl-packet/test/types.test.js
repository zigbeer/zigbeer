'use strict';
const zclId = require("zcl-id/dist/legacy")
const zcl = require("../src").zclFactory(zclId)

describe("APIs Arguments Check for Throwing Error", () => {
  describe("#.frame", () => {
    const frameCntl = {
      frameType: 1,
      manufSpec: 0,
      direction: 0,
      disDefaultRsp: 1
    }

    it("should be a function", () => {
      expect(typeof zcl.frame).toBe("function")
    })

    it("should throw TypeError if input frameCntl is not an object", () => {
      expect(() =>
        zcl.frame(undefined, 0, 0, "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(null, 0, 0, "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() => zcl.frame(NaN, 0, 0, "toggle", {}, "genOnOff")).toThrowError(
        TypeError
      )
      expect(() => zcl.frame([], 0, 0, "toggle", {}, "genOnOff")).toThrowError(
        TypeError
      )
      expect(() =>
        zcl.frame(true, 0, 0, "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(new Date(), 0, 0, "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(() => {}, 0, 0, "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)

      expect(() =>
        zcl.frame(frameCntl, 0, 0, "toggle", {}, "genOnOff")
      ).not.toThrowError(TypeError)
    })

    it("should throw TypeError if input manufCode is not a number", () => {
      expect(() =>
        zcl.frame(frameCntl, undefined, 0, "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, null, 0, "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, NaN, 0, "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, [], 0, "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, true, 0, "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, new Date(), 0, "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, () => {}, 0, "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
    })

    it("should throw TypeError if input seqNum is not a number", () => {
      expect(() =>
        zcl.frame(frameCntl, 0, undefined, "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, 0, null, "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, 0, NaN, "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, 0, [], "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, 0, true, "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, 0, new Date(), "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, 0, () => {}, "toggle", {}, "genOnOff")
      ).toThrowError(TypeError)
    })

    it("should throw TypeError if input cmd is not a number and not a string", () => {
      expect(() =>
        zcl.frame(frameCntl, 0, 0, undefined, {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, 0, 0, null, {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, 0, 0, NaN, {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() => zcl.frame(frameCntl, 0, 0, [], {}, "genOnOff")).toThrowError(
        TypeError
      )
      expect(() =>
        zcl.frame(frameCntl, 0, 0, true, {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, 0, 0, new Date(), {}, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, 0, 0, () => {}, {}, "genOnOff")
      ).toThrowError(TypeError)

      expect(() =>
        zcl.frame(frameCntl, 0, 0, "toggle", {}, "genOnOff")
      ).not.toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, 0, 0, 2, {}, "genOnOff")
      ).not.toThrowError(TypeError)
    })

    it("should throw TypeError if input zclPayload is not an object and not an array", () => {
      expect(() =>
        zcl.frame(frameCntl, 0, 0, "toggle", undefined, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, 0, 0, "toggle", null, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, 0, 0, "toggle", NaN, "genOnOff")
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, 0, 0, "toggle", true, "genOnOff")
      ).toThrowError(TypeError)

      expect(() =>
        zcl.frame(frameCntl, 0, 0, "toggle", {}, "genOnOff")
      ).not.toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, 0, 0, "toggle", [], "genOnOff")
      ).not.toThrowError(TypeError)
    })

    it("should throw TypeError if input clusterId is not a number and not a string", () => {
      expect(() =>
        zcl.frame(frameCntl, 0, 0, "toggle", {}, undefined)
      ).toThrowError(TypeError)
      expect(() => zcl.frame(frameCntl, 0, 0, "toggle", {}, null)).toThrowError(
        TypeError
      )
      expect(() => zcl.frame(frameCntl, 0, 0, "toggle", {}, NaN)).toThrowError(
        TypeError
      )
      expect(() => zcl.frame(frameCntl, 0, 0, "toggle", {}, [])).toThrowError(
        TypeError
      )
      expect(() => zcl.frame(frameCntl, 0, 0, "toggle", {}, true)).toThrowError(
        TypeError
      )
      expect(() =>
        zcl.frame(frameCntl, 0, 0, "toggle", {}, new Date())
      ).toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, 0, 0, "toggle", {}, () => {})
      ).toThrowError(TypeError)

      expect(() =>
        zcl.frame(frameCntl, 0, 0, "toggle", {}, "genOnOff")
      ).not.toThrowError(TypeError)
      expect(() =>
        zcl.frame(frameCntl, 0, 0, "toggle", {}, 6)
      ).not.toThrowError(TypeError)
    })
  })

  describe("#.parse", () => {
    const buf = Buffer.from([0x11, 0x00, 0x02])

    const rethrow = err => {
      if (err) throw err
    }

    it("should be a function", () => {
      expect(typeof zcl.parse).toBe("function")
    })

    it("should throw TypeError if input buf is not a buffer", () => {
      expect(() => zcl.parse(undefined, 0, rethrow)).toThrowError(TypeError)
      expect(() => zcl.parse(null, 0, rethrow)).toThrowError(TypeError)
      expect(() => zcl.parse(NaN, 0, rethrow)).toThrowError(TypeError)
      expect(() => zcl.parse([], 0, rethrow)).toThrowError(TypeError)
      expect(() => zcl.parse(true, 0, rethrow)).toThrowError(TypeError)
      expect(() => zcl.parse(new Date(), 0, rethrow)).toThrowError(TypeError)
      expect(() => zcl.parse(() => {}, 0, rethrow)).toThrowError(TypeError)
    })

    it("should throw TypeError if input clusterId is not a number and not a string", () => {
      expect(() => zcl.parse(buf, undefined, rethrow)).toThrowError(TypeError)
      expect(() => zcl.parse(buf, null, rethrow)).toThrowError(TypeError)
      expect(() => zcl.parse(buf, NaN, rethrow)).toThrowError(TypeError)
      expect(() => zcl.parse(buf, [], rethrow)).toThrowError(TypeError)
      expect(() => zcl.parse(buf, true, rethrow)).toThrowError(TypeError)
      expect(() => zcl.parse(buf, new Date(), rethrow)).toThrowError(TypeError)
      expect(() => zcl.parse(buf, () => {}, rethrow)).toThrowError(
        TypeError
      )

      expect(() => zcl.parse(buf, "genOnOff", () => {})).not.toThrowError(
        TypeError
      )
      expect(() => zcl.parse(buf, 6, () => {})).not.toThrowError(TypeError)
    })
  })

  describe("#.header", () => {
    it("should be a function", () => {
      expect(typeof zcl.header).toBe("function")
    })

    it("should throw TypeError if input buf is not a buffer", () => {
      expect(() => zcl.header(undefined)).toThrowError(TypeError)
      expect(() => zcl.header(null)).toThrowError(TypeError)
      expect(() => zcl.header(NaN)).toThrowError(TypeError)
      expect(() => zcl.header([])).toThrowError(TypeError)
      expect(() => zcl.header(true)).toThrowError(TypeError)
      expect(() => zcl.header(new Date())).toThrowError(TypeError)
      expect(() => zcl.header(() => {})).toThrowError(TypeError)
    })
  })
})
