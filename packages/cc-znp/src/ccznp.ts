import { EventEmitter } from 'events';

import Unpi = require('unpi');
import Serialport = require('@serialport/stream');
import * as _debug from 'debug';
const debug = _debug('cc-znp');
const logSreq = _debug('cc-znp:SREQ');
const logSrsp = _debug('cc-znp:SRSP');
const logAreq = _debug('cc-znp:AREQ');
import { parse, frame, getCommandData } from './zpiObject';

Serialport.Binding = require('@serialport/bindings');

import * as zmeta from './zmeta';

const MT = {
  CMDTYPE: zmeta.CmdType,
  SUBSYS: zmeta.Subsys,
  SYS: zmeta.SYS,
  MAC: zmeta.MAC,
  AF: zmeta.AF,
  ZDO: zmeta.ZDO,
  SAPI: zmeta.SAPI,
  UTIL: zmeta.UTIL,
  DBG: zmeta.DBG,
  APP: zmeta.APP,
  DEBUG: zmeta.DEBUG,
};

type cmdMetadata = ReturnType<typeof getCommandData>;

/*
    CcZnp Class
*/
class CcZnp extends EventEmitter {
  // export constant
  MT = MT; //TODO: static

  _init = false;
  _resetting = false;
  _sp?: Serialport;
  _unpi?: Unpi;
  _spinLock = false;
  _txQueue: (() => void)[] = [];
  _innerListeners = {
    spOpen: () => {
      debug(`The serialport ${this._sp.path} is opened.`);
      this.emit('_ready');
    },
    spErr: err => {
      this._sp.close();
    },
    spClose: () => {
      debug(`The serialport ${this._sp.path} is closed.`);
      this._txQueue = [];
      this._sp = null;
      this._unpi = null;
      this._init = false;
      this.emit('close');
    },
    parseMtIncomingData: result => {
      this._parseMtIncomingData(result);
    },
  };

  constructor() {
    super();

    this.on('_ready', () => {
      this._init = true;
      this.emit('ready');
    });
  }

  /*
    Public APIs
*/
  init(spCfg, callback = (err?) => {}) {
    if (typeof spCfg !== 'object' || Array.isArray(spCfg)) {
      throw new TypeError('spCfg should be a plain object.');
    }

    if (!spCfg.options) {
      spCfg.options = {
        autoOpen: false,
      };
    } else {
      spCfg.options.autoOpen = false;
    }

    const sp = (this._sp =
      this._sp instanceof Serialport
        ? this._sp
        : new Serialport(spCfg.path, spCfg.options));

    if (!sp) {
      throw new Error('Cannot initialize serial port.');
    }

    const unpi = (this._unpi =
      this._unpi instanceof Unpi
        ? this._unpi
        : new Unpi({
            lenBytes: 1,
            phy: sp,
          }));

    // Listeners for inner use
    const parseMtIncomingData = this._innerListeners.parseMtIncomingData;
    const spOpenLsn = this._innerListeners.spOpen;
    const spErrLsn = this._innerListeners.spErr;
    const spCloseLsn = this._innerListeners.spClose;

    if (!unpi) {
      throw new Error('Cannot initialize unpi.');
    }

    // remove all inner listeners were attached on last init
    unpi.removeListener('data', parseMtIncomingData);
    sp.removeListener('open', spOpenLsn);
    sp.removeListener('error', spErrLsn);
    sp.removeListener('close', spCloseLsn);

    // re-attach inner listeners
    unpi.on('data', parseMtIncomingData);
    sp.once('open', spOpenLsn);

    if (sp && sp instanceof Serialport && sp.isOpen) {
      debug('Initialize, serial port was already open');
      sp.on('error', spErrLsn);
      sp.on('close', spCloseLsn);
      return callback(null);
    }
    debug('Initialize, opening serial port');
    sp.open(err => {
      if (err) return callback(err);

      sp.on('error', spErrLsn);
      sp.on('close', spCloseLsn);
      callback(null);
    });
  }

  close(callback) {
    const self = this;

    if (this._init) {
      this._sp.flush(() => {
        self._sp.close(callback);
      });
    } else {
      callback(null);
    }
  }

  request(subsys, cmd, valObj, callback) {
    // subsys: String | Number, cmd: String | Number, valObj: Object | Array
    if (!this._init) {
      throw new Error('ccznp has not been initialized yet');
    }

    if (this._spinLock) {
      this._txQueue.push(() => {
        this.request(subsys, cmd, valObj, callback);
      });
      return;
    }

    // prepare for transmission
    this._spinLock = true;

    // validations
    if (!valObj || typeof valObj !== 'object')
      throw new TypeError('valObj should be an object');
    else if (typeof callback !== 'function' && typeof callback !== 'undefined')
      throw new TypeError('callback should be a function');
    const cmdMetadata = getCommandData(subsys, cmd);

    const type = zmeta.getType(subsys, cmd);

    if (type === 'SREQ') {
      logSreq(
        '--> %s, %o',
        `${cmdMetadata.subsysName}:${cmdMetadata.cmdName}`,
        valObj
      );
      return this._sendSREQ(valObj, cmdMetadata, callback);
    } else if (type === 'AREQ') {
      logAreq(
        '--> %s, %o',
        `${cmdMetadata.subsysName}:${cmdMetadata.cmdName}`,
        valObj
      );
      return this._sendAREQ(valObj, cmdMetadata, callback);
    }
  }

  sendCmd(type, subsys, cmdId, payload) {
    return this._unpi.send(type, subsys, cmdId, payload);
  }

  sysRequest(cmdId, valObj, callback) {
    return this.request('SYS', cmdId, valObj, callback);
  }
  macRequest(cmdId, valObj, callback) {
    return this.request('MAC', cmdId, valObj, callback);
  }
  nwkRequest(cmdId, valObj, callback) {
    return this.request('NWK', cmdId, valObj, callback);
  }
  afRequest(cmdId, valObj, callback) {
    return this.request('AF', cmdId, valObj, callback);
  }
  zdoRequest(cmdId, valObj, callback) {
    return this.request('ZDO', cmdId, valObj, callback);
  }
  sapiRequest(cmdId, valObj, callback) {
    return this.request('SAPI', cmdId, valObj, callback);
  }
  utilRequest(cmdId, valObj, callback) {
    return this.request('UTIL', cmdId, valObj, callback);
  }
  dbgRequest(cmdId, valObj, callback) {
    return this.request('DBG', cmdId, valObj, callback);
  }
  appRequest(cmdId, valObj, callback) {
    return this.request('APP', cmdId, valObj, callback);
  }
  debugRequest(cmdId, valObj, callback) {
    return this.request('DEBUG', cmdId, valObj, callback);
  }

  /*
        Protected Methods
    */
  _sendSREQ(valObj, cmdMetadata: cmdMetadata, callback) {
    // subsys: String, cmd: String
    const self = this;
    const payload = frame('SREQ', cmdMetadata, valObj);
    let sreqTimeout;
    const srspEvt = `SRSP:${cmdMetadata.subsysName}:${cmdMetadata.cmdName}`;

    if (!payload) {
      callback(new Error('Fail to build frame'));
      return;
    }

    sreqTimeout = setTimeout(() => {
      if (self.listenerCount(srspEvt)) {
        self.emit(srspEvt, '__timeout__');
      }

      sreqTimeout = null;
    }, 1500);

    // attach response listener
    this.once(srspEvt, result => {
      self._spinLock = false;

      // clear timeout controller if it is there
      if (sreqTimeout) {
        clearTimeout(sreqTimeout);
        sreqTimeout = null;
      }

      // schedule next transmission if something in txQueue
      self._scheduleNextSend();

      // check if this event is fired by timeout controller
      if (result === '__timeout__') {
        logSrsp(
          '<-- %s, __timeout__',
          `${cmdMetadata.subsysName}:${cmdMetadata.cmdName}`
        );
        callback(new Error('request timeout'));
      } else {
        self._resetting = false;
        callback(null, result);
      }
    });

    this._unpi.send('SREQ', cmdMetadata.subsysName, cmdMetadata.cmdId, payload);
  }

  _sendAREQ(valObj, cmdMetadata: cmdMetadata, callback) {
    // subsys: String, cmd: String
    const payload = frame('AREQ', cmdMetadata, valObj);

    if (!payload) {
      callback(new Error('Fail to build frame'));
      return;
    }

    if (
      cmdMetadata.cmdName === 'resetReq' ||
      cmdMetadata.cmdName === 'systemReset'
    ) {
      this._resetting = true;
      // clear all pending requests, since the system is reset
      this._txQueue = [];

      this.once('AREQ:SYS:RESET', () => {
        // hold the lock until coordinator reset completed
        this._resetting = false;
        this._spinLock = false;
        callback(null);
      });

      // if AREQ:SYS:RESET does not return in 30 sec
      // release the lock to avoid the requests from enqueuing
      setTimeout(() => {
        if (this._resetting) {
          this._spinLock = false;
        }
      }, 30000);
    } else {
      this._spinLock = false;
      this._scheduleNextSend();
      callback(null);
    }

    this._unpi.send('AREQ', cmdMetadata.subsysName, cmdMetadata.cmdId, payload);
  }

  _scheduleNextSend() {
    const txQueue = this._txQueue;

    if (txQueue.length) {
      setImmediate(() => {
        txQueue.shift()!();
      });
    }
  }

  _parseMtIncomingData(data) {
    // data = { sof, len, type, subsys, cmd, payload, fcs, csum }
    this.emit('data', data);

    if (data.fcs !== data.csum) {
      throw new Error('Invalid checksum');
    }

    try {
      const cmdMetadata = getCommandData(data.subsys, data.cmd);
      // make sure data.type will be string
      const type = zmeta.CmdType.get(data.type)!.key;
      // make sure data.subsys will be string
      const subsysName = cmdMetadata.subsysName;
      // make sure data.cmd will be string
      const cmdName = cmdMetadata.cmdName;

      const result = parse(data.type, cmdMetadata, data.payload);
      const newData = {
        sof: data.sof,
        type,
        subsysName,
        cmdName,
        result,
      };
      this._mtIncomingDataHdlr(newData);
    } catch (err) {
      debug(err); // just print out. do nothing if incoming data is invalid
    }
  }

  _mtIncomingDataHdlr({ type, subsysName, cmdName, result }) {
    // data = { type, subsysName, cmdName, result }
    if (type === 'SRSP') {
      logSrsp('<-- %s, %o', `${subsysName}:${cmdName}`, result);
      this.emit(`SRSP:${subsysName}:${cmdName}`, result);
      return;
    }
    if (type === 'AREQ') {
      logAreq('<-- %s, %o', `${subsysName}:${cmdName}`, result);

      this.emit('AREQ', {
        subsys: subsysName,
        ind: cmdName,
        data: result,
      });

      if (subsysName === 'SYS' && cmdName === 'resetInd') {
        this.emit('AREQ:SYS:RESET', result);
      }
    }
  }
}

/*
    Export as a singleton
*/
export default new CcZnp();
