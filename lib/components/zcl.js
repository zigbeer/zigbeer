/* jshint node: true */
"use strict"

const { zclFactory } = require("zcl-packet")

module.exports = zclId => {
  const { frame, parse, header } = zclFactory(zclId)
  return {
    frame,
    parse,
    header // TODO: Notify when frameType or other values is weird, don't just silently eat it
  }
}
