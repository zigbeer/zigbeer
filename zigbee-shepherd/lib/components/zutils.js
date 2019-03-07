/* jshint node: true */
'use strict';

const {has, get, set} = require('busyman');
const proving = require('proving');

const zutils = {};

zutils.toHexString = function (val, type) {
    let string;
    const niplen = parseInt(type.slice(4)) / 4;

    string = val.toString(16);

    while (string.length !== niplen) {
        string = `0${string}`;
    }

    return `0x${string}`;
};

zutils.toLongAddrString = function (addr) {
    let longAddr;

    if (typeof addr === "string")
        longAddr = (addr.startsWith('0x') || addr.startsWith('0X')) ? addr.slice(2, addr.length).toLowerCase() : addr.toLowerCase();
    else if (typeof addr === "number")
        longAddr = addr.toString(16);
    else
        throw new TypeError('Address can only be a number or a string.');

    for (let i = longAddr.length; i < 16; i++) {
        longAddr = `0${longAddr}`;
    }

    return `0x${longAddr}`;
};

zutils.dotPath = function (path) {
    proving.string(path, 'Input path should be a string.');

    path = path.replace(/\//g, '.');  // tranform slash notation into dot notation

    if (path[0] === '.')              // if the first char of topic is '.', take it off
        path = path.slice(1);

    if (path[path.length-1] === '.')  // if the last char of topic is '.', take it off
        path = path.slice(0, path.length - 1);

    return path;
};

zutils.buildPathValuePairs = function (rootPath, obj) {
    let result = {};
    rootPath = zutils.dotPath(rootPath);

    if (obj && typeof obj === 'object') {
        if (rootPath !== undefined && rootPath !== '' && rootPath !== '.' && rootPath !== '/')
            rootPath = `${rootPath}.`;

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const n = obj[key];

                if (n && typeof n === 'object')
                    result = Object.assign(result, zutils.buildPathValuePairs(rootPath + key, n));
                else
                    result[rootPath + key] = n;
            }
        }
    } else {
        result[rootPath] = obj;
    }

    return result;
};

zutils.objectDiff = function (oldObj, newObj) {
    const pvp = zutils.buildPathValuePairs('/', newObj);
    const diff = {};

    Object.entries(pvp).forEach(([path, val]) => {
        if (!has(oldObj, path) || get(oldObj, path) !== val)
            set(diff, path, val);
    });

    return diff;
};

module.exports = zutils;
