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
// const web3 = new Web3();
const net = require('net')

var async = require('async');



class Biathlon {

  async get_nodelist() {
   
    return await this.web3.eth.contract(JSON.parse(config.nodelist_abi)).at(config.nodelist_contract)
   
  }

  async get_token(a) {
    return await this.web3.eth.contract(JSON.parse(config.token_abi)).at(a) 
  }

  async get_node(a) {

    return await this.web3.eth.contract(JSON.parse(config.node_abi)).at(a)
   
  }


  constructor() {
    // this.app = app;

    this.web3 = new Web3()
    this.web3.setProvider(new this.web3.providers.IpcProvider(web3options.host, net))
    this.web3.eth = promise.promisifyAll(this.web3.eth);

    
    // this.app.use(async(req, res, next) => { 
    //   let n = await this.get_nodelist()
    //   req.session.nodelist = n
    //   req.session.token = await this.get_token()
    //   // console.log('node list is ' + util.inspect(this.nodelist))
    //   let regEvent =  n.RegisterBiathlonNode({}, {fromBlock: 0, toBlock: 'latest'})
    //   let all_nodes = []

      // return new Promise(async(resolve, reject) =>  {
      //   await regEvent.get(async(error, e) => {
      //     await e.forEach(async(n) => {
      //       console.log(n.args.addr)
      //       await all_nodes.push(n.args.addr)
      //     })
      //     resolve(all_nodes)
      //   })
      // })
      // .then(() => {
      //   let regUser = nodelist.RegisterBiathlonUser({}, {fromBlock: 0, toBlock: 'latest'})
      //   let all_users = []
      //   return new Promise(async(resolve, reject) => {
      //     await regUser.get(async (error, e) => {
            
      //       await e.forEach(async (user) => {
      //         console.log(util.inspect(user))
      //         await all_users.push(user.args.addr)
      //       })
      //       console.log(all_users.length)
      //       resolve(all_users)
      //     })
      //   })
      // }).then((users) => {
      //   console.log('async:' + users.length)
      // res.status(200).send('Nodes: ' + util.inspect(all_nodes) + ' and users: ' + util.inspect(users))
      // })

    //   next()
    // })
  }
}
exports.Biathlon = Biathlon;

