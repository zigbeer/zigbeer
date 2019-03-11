'use strict';
const ccznp = require('../index.js');

const spCfg = {
    path: '/dev/ttyACM0',
    options: {
        baudRate: 115200,
        rtscts: true,
    },
};

ccznp.on('ready', () => {
    ccznp.sysRequest('ping', {}, (err, result) => {
        if (err) console.log(err);
        else console.log(result);
    });

    ccznp.sysRequest('version', {}, (err, result) => {
        if (err) console.log(err);
        else console.log(result);
    });
});

ccznp.on('AREQ', result => {
    console.log(result);
});

ccznp.init(spCfg, err => {
    if (err) console.log(err);
});
