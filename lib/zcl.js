'use strict';

const Concentrate = require('concentrate');
const DChunks = require('dissolve-chunks');

function zclFactory(zclId) {

const ru = DChunks().Rule();

const FoundPayload = require('./foundation')(zclId);
const FuncPayload = require('./functional')(zclId);

    class ZclFrame {
        parse(buf, callback) {
            let parser;

            parser = DChunks().join(ru.zclFrame(buf.length)).compile();

            parser.once('parsed', function (result) {
                parser = null;
                callback(result);
            });

            parser.end(buf);
        }

        frame(frameCntl, manufCode, seqNum, cmdId, payload) {
            if (!isNumber(manufCode)) throw new TypeError('manufCode should be a number');
            if (!isNumber(seqNum)) throw new TypeError('seqNum should be a number');

            const frameCntlOctet = (frameCntl.frameType & 0x03) | ((frameCntl.manufSpec << 2) & 0x04) | ((frameCntl.direction << 3) & 0x08) | ((frameCntl.disDefaultRsp << 4) & 0x10);
            let dataBuf = Concentrate().uint8(frameCntlOctet);

            if (frameCntl.manufSpec === 1) {
                dataBuf = dataBuf.uint16(manufCode);
            }

            dataBuf = dataBuf.uint8(seqNum).uint8(cmdId).buffer(payload);

            return dataBuf.result();
        }
    }

    /*
        Add Parsing Rules to DChunks
    */
    ru.clause('zclFrame', function (bufLen) {
        let manufSpec;

        this.uint8('frameCntl').tap(function () {
            const filedValue = this.vars.frameCntl;

            this.vars.frameCntl = {
                frameType: (filedValue & 0x03),
                manufSpec: (filedValue & 0x04) >> 2,
                direction: (filedValue & 0x08) >> 3,
                disDefaultRsp: (filedValue & 0x10) >> 4,
            };
            manufSpec = this.vars.frameCntl.manufSpec;
        }).tap(function () {
            if (!manufSpec) {
                this.vars.manufCode = 0;
            } else {
                this.uint16('manufCode');
            }
        }).tap(function () {
            this.uint8('seqNum').uint8('cmdId');
        }).tap(function () {
            if (!manufSpec) {
                this.buffer('payload', bufLen - 3);
            } else {
                this.buffer('payload', bufLen - 5);
            }
        });
    });

    function isNumber(param) {
        if (typeof param !== 'number') {
            return false;
        } 
        if (typeof param === 'number') {
            return !isNaN(param);
        }
        return true;
    }

    const zcl = {
        parse(zclBuf, clusterId, callback) {
            let zclObj;
            const zclFrame = new ZclFrame();

            if (!Buffer.isBuffer(zclBuf)) {
                return callback(new TypeError('zclBuf should be a buffer.'));
            }

        if (arguments.length === 2) {
            callback = clusterId;
            clusterId = null;
        }

            zclFrame.parse(zclBuf, function (data) {
            // data = { frameCntl: { frameType, manufSpec, direction, disDefaultRsp }, manufCode, seqNum, cmdId, payload }
            if (data.frameCntl.frameType === 0) {
                zclObj = new FoundPayload(data.cmdId);
            } else if (data.frameCntl.frameType === 1) {
                    if (!clusterId) {
                        return callback(new TypeError('clusterId should be given.'));
                    }

                zclObj = new FuncPayload(clusterId, data.frameCntl.direction, data.cmdId);
            }

                // make sure data.cmdId will be string
                data.cmdId = zclObj.cmd;

                zclObj.parse(data.payload, function (err, payload) {
                if (err) {
                        return callback(err);
                    }

                    data.payload = payload;
                    callback(null, data);
            });
        });
        },

        frame(frameCntl, manufCode, seqNum, cmd, zclPayload, clusterId) {
        // frameCntl: Object, manufCode: Number, seqNum: Number, cmd: String | Number, zclPayload: Object | Array, clusterId: String | Number
            let zclObj;
            const zclFrame = new ZclFrame();

            if (typeof frameCntl !== 'object' || Array.isArray(frameCntl)) {
                throw new TypeError('frameCntl should be an object');
            }
            if (typeof zclPayload !== 'object' || zclPayload === null) {
                throw new TypeError('zclPayload should be an object or an array');
            }

        if (frameCntl.frameType === 0) {
            zclObj = new FoundPayload(cmd);
        } else if (frameCntl.frameType === 1) {
            if (!clusterId)
                throw new TypeError('clusterId should be given.');

            zclObj = new FuncPayload(clusterId, frameCntl.direction, cmd);
        }

        return zclFrame.frame(frameCntl, manufCode, seqNum, zclObj.cmdId, zclObj.frame(zclPayload));
        },

        header(buf) {
        if (!Buffer.isBuffer(buf)) throw new TypeError('header should be a buffer.');
        
        const headByte = buf.readUInt8(0);
        const header = {
            frameCntl: {
                frameType: (headByte & 0x03),
                manufSpec: ((headByte >> 2) & 0x01),
                direction: ((headByte >> 3) & 0x01),
                disDefaultRsp: ((headByte >> 4) & 0x01),
            },
            manufCode: null,
            seqNum: null,
            cmdId: null,
        };

        let i = 0;

        i += 1; // first byte, frameCntl, has parsed

        if (header.frameCntl.manufSpec === 1) {
            header.manufCode = buf.readUInt16LE(i);
            i += 2;
        } else if (header.frameCntl.manufSpec === 0) {
            header.manufCode = null;
        }

        header.seqNum = buf.readUInt8(i);
        i += 1;
        header.cmdId = buf.readUInt8(i);

            if (header.frameCntl.frameType < 0x02 && header.cmdId < 0x80) {
            return header;
        }
        },
    };


    return zcl;
    
}

module.exports = zclFactory;
