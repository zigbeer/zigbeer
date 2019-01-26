'use strict';

const Enum = require('enum');

const Direction = new Enum(require('./defs/zcl_defs.json').Direction);

function zclmetaFactory(zclId) {

    const zclMeta = require('zcl-id/src/definitions/zcl_meta.json') // TODO: replace this dependency


    function cloneParamsWithNewFormat(params) {
        const output = params.map(item=> {
            const name = Object.keys(item)[0];
            return {
                name,
                // type is a number
                type: item[name],
            }
        });

        return output;
    }

    const foundation = {
        get(cmd) {
            const meta = zclMeta.foundation;
            return meta ? meta[cmd] : undefined;
        },

        getParams(cmd) {
            const meta = this.get(cmd);
            // [ { name: type }, .... ]
            const params = meta ? meta.params : meta;

            if (params) {
                return cloneParamsWithNewFormat(params);
            }
        },
    };

    const functional = {
        get(cluster, cmd) {
            const meta = zclMeta.functional[cluster];
            return meta ? meta[cmd] : undefined;
            // return: {
            //  dir,
            //  params: [ { name: type }, ... ]
            // }
        },

        getCommand(cluster, dir, cmd) {
            if (dir === 0) {
                // client to server, cmd
                return zclId.functional(cluster, cmd);
            }

            if (dir === 1) {
                // server to client, cmdRsp
                return zclId.getCmdRsp(cluster, cmd);
            }
        },

        getDirection(cluster, cmd) {
            let meta = this.get(cluster, cmd);
            if (meta) {
                meta = Direction.get(meta.dir);
            }

            // return: "Client To Server", "Server To Client"
            return meta ? meta.key : undefined;
        },

        getParams(cluster, cmd) {
            const meta = this.get(cluster, cmd);
            // [ { name: type }, .... ]
            const params = meta ? meta.params : meta;

            if (params) {
                return cloneParamsWithNewFormat(params);
            }
        },
    };

    return {
        foundation,
        functional,
        Direction,
    };

}

module.exports = zclmetaFactory;
