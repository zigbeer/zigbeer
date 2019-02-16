# Hacks

This document addresses the usecases that need to be supported which are currently implemented through hacks to the core modules that violate the separation of concerns and compliance with the Zigbee specifications.

If you know of any hacks that aren't listed here, please submit a PR to this document.

1. [@splitice] adding his proprietary `"zeaker": 2540` cluster for HalleyAssist https://github.com/Koenkk/zcl-id/pull/2

   **Solution**: `extend` hook before `.json`s are processed.

1. [@kirovilya] adding Xiaomi struct parsing to attribute `65281`.
   **Description**: Xiaomi devices send packed multi-value data as type `string` (aka Character string, 0x42, 62) which `zcl-packet` makes the mistake of parsing with the `string` parser of the `"dissolve"` module, which calls `.toString("utf8")` on the underlying `Buffer`. This would coincidentally be fine, since Zigbee specifies ISO 646 ASCII character encoding for this datatype. (Although the correct encoding would have been `"ascii"`)

   **However**, actual devices in the wild, eg the Xiaomi mentioned, send bytes in the full range `0x00..0xFF`. Parsing these as as `"utf"` causes invalid characters, and parsing as `"ascii"` drops the high bit, in both cases losing data and necessitating intervention into `zcl-packet`.

   **Solution**:

   1. Revert commits:

   - https://github.com/zigbeer/zcl-packet/commit/d5128f0fb2f1adf707e582a7b469af6dfed37426
   - https://github.com/zigbeer/zcl-packet/commit/0c23e47b383428e48a84db586f24d19c3e94bb30#commitcomment-31959124

   2. Parse the buffers as `"latin1"`(aka `"binary"`), which is a whole-byte encoding, a strict superset of `"ascii"`, and fully equivalent to [this code](https://github.com/open-zigbee/zigbee-bridge-packet/commit/dc2e8711a336020c18da0545144e666de7903718) by [@itsmepetrov]:

   ```js
   function bufToAscii(buffer) {
     const data = []
     for (let i = 0; i < buffer.length; i++) {
       data.push(String.fromCharCode(buffer[i]))
     }

     return data.join("")
   }
   ```

   3. Implement a Xiaomi buffer parser based on [@itsmepetrov's code here](https://github.com/itsmepetrov/homebridge-zigbee/blob/10cee93e40f875180c1d884feaea296457ea37c8/lib/utils/xiaomi.js#L4-L16) and [@kirovilya's code here](https://github.com/zigbeer/zcl-packet/blob/3dca38f46e97768d377496768f75158b84aed592/lib/foundation.js#L648-L675), probably as a separate package.

1. [@koenkk] adding group commands that are issued by a tradfri remote to the `"genScenes": 5` cluster.
   Commands:

   ```json
   "tradfriArrowSingle": 7,
   "tradfriArrowHold": 8,
   "tradfriArrowRelease": 9
   ```

   Payloads:

   ```json
   "tradfriArrowSingle":{
     "params":[
       {"value":"uint16"}
     ],
     "dir":1},
   "tradfriArrowHold":{
     "params":[
       {"value":"uint16"}
     ],
     "dir":1},
   "tradfriArrowRelease":{
     "params":[
       {"value":"uint16"}
     ],
     "dir":1}
   ```

   **Solution**:

   1. Revert commits:

   - https://github.com/zigbeer/zcl-packet/pull/10/commits/9fdecf5d684fb664b416bde982436c4a22187062
   - https://github.com/Koenkk/zcl-id/commit/9a27ea86063627c5e36f529d7f9113702a18662b

   2. Enable adding these commands with `extend` hook.
   3. Ask IKEA what the meaning of these command IDs is, and why they are in this cluster.
   4. Follow up with issue https://github.com/Koenkk/zigbee2mqtt/issues/102

1. [@kirovilya] copying [`this.vars.attrData = this.vars.structElms`](https://github.com/ZigBeans/zcl-packet/commit/a2b39c1b5239317bf8cd58ebf665319a5c039456) in the `attrValStruct` parser

   This is allegedly necessitated by [`notifData.data[attrIdString] = rec.attrData` here](https://github.com/zigbeer/zigbee-shepherd/blob/b536bcdc4fe89b6433c58a8ba09672c88b0002c6/lib/shepherd.js#L131), wherein only the attrData is put on the event object. If this is the case, `attrVal` parser would also fail to report its `elmVals` field.

   However, [parsing-framing tests](https://github.com/zigbeer/zcl-packet/blob/351c4204ab64a21668b01f8da68063a50835fe9c/test/zcl.test.js#L175-L177) suggest that these fields end up in an object under the `attrData` field, and so should be accessible on the event without this modification.

   **Solution**:

   1. Revert commit https://github.com/ZigBeans/zcl-packet/commit/a2b39c1b5239317bf8cd58ebf665319a5c039456#diff-9f0b814c660e5e38b20eed3e82ba2512R731
   2. Try to access this value in the event handler.

1. [@splitice] added multiple zcl_meta entries for the same command, `imageBlockRsp`
   ```json
   "imageBlockRspSuccess": {
     "params": [
       { "status": "uint8" },
       { "manufacturerCode": "uint16" },
       { "imageType": "uint16" },
       { "fileVersion": "uint32" },
       { "fileOffset": "uint32" },
       { "dataLen": "preLenUint8" },
       { "data": "dynUint8" }
     ],
     "dir": 1
   },
   "imageBlockRspAbort": {
     "params": [{ "status": "uint8" }],
     "dir": 1
   },
   ```
   **Solution**:
   Make the structure of `params` suitable for variable data shapes.

[@splitice]: https://github.com/splitice
[@kirovilya]: https://github.com/kirovilya
[@itsmepetrov]: https://github.com/itsmepetrov
[@koenkk]: https://github.com/Koenkk
