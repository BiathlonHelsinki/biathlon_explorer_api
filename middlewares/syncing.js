"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util = require('util')
const promise = require('bluebird')
const config = require('node-yaml-config').load('./config.yaml')
const web3options = {
  debug: true,
  // host: '/Users/fail/geth.ipc',
  host: config.ipcpath,
  ipc: true,
  personal: true,
  admin: true,
}
const Web3 = require('web3');
const web3 = new Web3();
const net = require('net')
web3.setProvider(new web3.providers.IpcProvider(web3options.host, net))
var async = require('async');

web3.eth = promise.promisifyAll(web3.eth);

const mae = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }

    resolve(res);
  })
)


class Syncer {

  constructor(app) {
      this.app = app;

      this.app.use(async (req, res, next) => {

        let sync = await web3.eth.isSyncing()


        if (sync.lastSyncState === true) {
          console.log('still syncing')

          res.status(401).json({"error": "Blockchain is not synced, try again later"})
        } else {  


          next()
        }
      })
  }
}

exports.Syncer = Syncer;
