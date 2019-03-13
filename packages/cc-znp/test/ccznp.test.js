'use strict';

const ccznp = require('../src/ccznp');

describe('Signature Check', () => {
  test('ccznp.init(spCfg[, callback])', () => {
    expect(() =>
      ccznp.init({
        path: 'xxx',
      })
    ).not.toThrowError();

    ccznp._sp = null;
    expect(() => ccznp.init({})).toThrowError();
    ccznp._sp = null;
    expect(() => ccznp.init([])).toThrowError();
    ccznp._sp = null;
    expect(() => ccznp.init('xxx')).toThrowError();
    ccznp._sp = null;
    expect(() => ccznp.init(123)).toThrowError();
    ccznp._sp = null;
    expect(() => ccznp.init(false)).toThrowError();
    ccznp._sp = null;
    expect(() => ccznp.init(undefined)).toThrowError();
    ccznp._sp = null;
    expect(() => ccznp.init(null)).toThrowError();
  });

  test('ccznp.request(subsys, cmdId, valObj, callback)', () => {
    ccznp._init = true;

    ccznp._spinLock = false;
    expect(() => ccznp.request({}, 'ping', [], () => {})).toThrowError(
      'Unrecognized subsystem'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request([], 'ping', [], () => {})).toThrowError(
      'Unrecognized subsystem'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request('xxx', 'ping', [], () => {})).toThrowError(
      'Unrecognized subsystem'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request(123, 'ping', [], () => {})).toThrowError(
      'Unrecognized subsystem'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request(false, 'ping', [], () => {})).toThrowError(
      'Unrecognized subsystem'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request(undefined, 'ping', [], () => {})).toThrowError(
      'Unrecognized subsystem'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request(null, 'ping', [], () => {})).toThrowError(
      'Unrecognized subsystem'
    );

    ccznp._spinLock = false;
    expect(() => ccznp.request('SYS', {}, [], () => {})).toThrowError(
      'Unrecognized command'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request('SYS', [], [], () => {})).toThrowError(
      'Unrecognized command'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request('SYS', 'xxx', [], () => {})).toThrowError(
      'Unrecognized command'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request('SYS', 123, [], () => {})).toThrowError(
      'Unrecognized command'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request('SYS', false, [], () => {})).toThrowError(
      'Unrecognized command'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request('SYS', undefined, [], () => {})).toThrowError(
      'Unrecognized command'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request('SYS', null, [], () => {})).toThrowError(
      'Unrecognized command'
    );

    ccznp._spinLock = false;
    expect(() => ccznp.request('SYS', 'ping', 'xxx', () => {})).toThrowError(
      'valObj should be an object'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request('SYS', 'ping', 123, () => {})).toThrowError(
      'valObj should be an object'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request('SYS', 'ping', false, () => {})).toThrowError(
      'valObj should be an object'
    );
    ccznp._spinLock = false;
    expect(() =>
      ccznp.request('SYS', 'ping', undefined, () => {})
    ).toThrowError('valObj should be an object');
    ccznp._spinLock = false;
    expect(() => ccznp.request('SYS', 'ping', null, () => {})).toThrowError(
      'valObj should be an object'
    );

    ccznp._spinLock = false;
    expect(() => ccznp.request('SYS', 'ping', [], {})).toThrowError(
      'callback should be a function'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request('SYS', 'ping', [], [])).toThrowError(
      'callback should be a function'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request('SYS', 'ping', [], 'xxx')).toThrowError(
      'callback should be a function'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request('SYS', 'ping', [], 123)).toThrowError(
      'callback should be a function'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request('SYS', 'ping', [], false)).toThrowError(
      'callback should be a function'
    );
    ccznp._spinLock = false;
    expect(() => ccznp.request('SYS', 'ping', [], null)).toThrowError(
      'callback should be a function'
    );
    ccznp._spinLock = false;
  });
});

describe('Functional Check', () => {
  test('ccznp.init()', done => {
    ccznp.on('ready', () => {
      if (ccznp._init === true) {
        done();
      }
    });
    ccznp.init(
      {
        path: 'xxx',
      },
      err => {
        ccznp._sp.open = callback => {
          callback(null);
        };
        ccznp.init(
          {
            path: 'xxx',
          },
          err => {
            if (!err) {
              ccznp.emit('_ready');
            }
          }
        );
      }
    );
  });

  test('ccznp.request() - timeout', done => {
    ccznp._unpi.send = () => {};
    ccznp.request('SYS', 'ping', {}, (err, result) => {
      if (err.message === 'request timeout') {
        done();
      }
    });
  }, 4000);

  test('ccznp.request()', done => {
    const rsp = {
      status: 0,
    };

    ccznp._unpi.send = () => {};
    ccznp.request('SYS', 'ping', {}, (err, result) => {
      if (err) {
        throw err;
      } else if (result === rsp && ccznp._spinLock === false) {
        done();
      }
    });
    ccznp.emit('SRSP:SYS:ping', rsp);
  });

  test('event: data', done => {
    const data = {
      sof: 254,
      len: 5,
      type: 3,
      subsys: 1,
      cmd: 2,
      payload: Buffer.from([0, 1, 2, 3, 4, 5, 0, 0, 0]),
      fcs: 100,
      csum: 100,
    };
    let dataEvtFlag = false;

    ccznp.on('data', msg => {
      if (msg === data) {
        dataEvtFlag = true;
      }
    });
    ccznp.on('SRSP:SYS:version', result => {
      let flag = true;
      const parsedResult = {
        transportrev: 0,
        product: 1,
        majorrel: 2,
        minorrel: 3,
        maintrel: 4,
        revision: 5,
      };

      for (const key in result) {
        if (parsedResult[key] !== result[key]) flag = false;
      }

      if (dataEvtFlag && flag) {
        done();
      }
    });

    ccznp._unpi.emit('data', data);
  });

  test('event: AREQ', done => {
    const data = {
      sof: 254,
      len: 3,
      type: 2,
      subsys: 4,
      cmd: 128,
      payload: Buffer.from([0, 8, 30]),
      fcs: 100,
      csum: 100,
    };

    let dataEvtFlag = false;

    ccznp.on('data', msg => {
      if (msg === data) {
        dataEvtFlag = true;
      }
    });

    ccznp.on('AREQ', result => {
      let flag = true;
      const parsedResult = {
        subsys: 'AF',
        ind: 'dataConfirm',
        data: {
          status: 0,
          endpoint: 8,
          transid: 30,
        },
      };

      for (let key in result) {
        if (key !== 'data' && parsedResult[key] !== result[key]) {
          flag = false;
        }
      }

      for (let field in result[data]) {
        if (parsedResult.data[field] !== result.data[field]) {
          flag = false;
        }
      }

      if (dataEvtFlag && flag) {
        done();
      }
    });

    ccznp._unpi.emit('data', data);
  });
});
