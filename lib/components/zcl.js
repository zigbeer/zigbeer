/* jshint node: true */
"use strict"

const { zclFactory } = require("zcl-packet")

module.exports = zclId => {
  const zclPacket = zclFactory(zclId)
  return {
    frame: zclPacket.frame,
    parse: zclPacket.parse,
    header: function(rawBuf) {
      const header = zclPacket.header(rawBuf)

      if (!header) return
      else if (header.frameCntl.frameType > 1)
        // 2, 3 are reserved
        return

      return header
    }
  }
}
