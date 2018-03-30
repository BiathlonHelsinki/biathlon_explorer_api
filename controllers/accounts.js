const util = require('util')
const nodes = require("./nodes")
var _ = require('lodash');


const promisify = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }

      resolve(res);
    })
  )


class Accounts {
  constructor(app) {
    this.app = app;
  }

  async get_accounts(nodelist) {
    let accountEvent = nodelist.RegisterBiathlonUser({}, {fromBlock: 0, toBlock: 'latest'})
    let accounts = []
    return new Promise(async(resolve, reject) => {
      await accountEvent.get(async (error, e) => {
        await e.forEach(async (account) => {
          await accounts.push(account)
        })
       resolve(accounts)
      })
    })
  }


  async get_spending(token, account) {
    let spend = token.Burn({from: account}, {fromBlock: 0, toBlock: 'latest'})
    let spends = []
    return new Promise(async(resolve, reject) => {
      await spend.get(async (error, e) => {
        await e.forEach(async (spend) => {
          await spends.push(spend)
        })
       resolve(spends)
      })
    })
  }

  async add_identities(account) {
    let pgt = await this.app.db.any('SELECT holder_type, holder_id from accounts WHERE address = ${hash}', {hash: account})
    let get_identity
    if (pgt[0]) {
      
      if (pgt[0].holder_type == 'User') {
        get_identity = await this.app.db.any('SELECT username, avatar, id, latest_balance, website FROM users WHERE id = ${user_id}', {user_id: pgt[0].holder_id})
        get_identity[0].account_class = 'user'
      } else {
        get_identity = await this.app.db.any('SELECT id, name as username, avatar, slug, website, latest_balance FROM groups WHERE id = ${group_id}', {group_id: pgt[0].holder_id})
        get_identity[0].account_class = 'group'
      }
      get_identity = get_identity[0]
    } 
    return get_identity

  }

  async kuusi_palaa(tx) {
    let pgt = await this.app.db.any('SELECT * from ethtransactions WHERE txaddress = ${hash}', {hash: tx.transactionHash})

    if (pgt[0]) {
      let has_activity = await this.app.db.any('SELECT * from activities WHERE ethtransaction_id = ${eid}', {eid: pgt[0].id})
      if (has_activity[0]) {
        if (has_activity[0].item_type == 'Instance') {
          let pgi = await this.app.db.any("SELECT i.open_time, i.id, i.slug, e.image, e.id as event_id, 'event' as image_class, it.name from instances i, events e, instance_translations it WHERE i.id = it.instance_id and it.locale = 'en' and i.event_id = e.id and i.id = ${instance_id}", {instance_id: has_activity[0].item_id })
          if (pgi[0]) {
            tx.kp = pgi[0]
          }
          else {
            tx.kp = has_activity[0]

          }
        }
        else if (has_activity[0].item_type == 'Idea') {
          let pgi = await this.app.db.any("SELECT name, id, image, 'idea' as image_class, id as event_id FROM ideas WHERE id = ${idea_id}", {idea_id: has_activity[0].item_id})
          if (pgi[0]) {

            tx.kp = pgi[0]
          }
          else {
            tx.kp = has_activity[0]
          }
        } 
        else if (has_activity[0].item_type == 'Stake') {
          let pgs = await this.app.db.any("SELECT 'Stake' as item_type, amount, paid_at, id FROM stakes where id = ${stake_id}", {stake_id: has_activity[0].item_id})
          if (pgs[0]) {
            tx.kp = pgs[0]
          }          
          else {
            tx.kp = has_activity[0]
          }
        }
        //  no activity we can figure out
        else {
          tx.kp = has_activity[0]                              
        }  
        tx.kp.when = has_activity[0].created_at    
      } 
      else {
        tx.kp = {"error" : 'no activity found ' }
      }
    } 
    else {
      tx.kp = {"error": 'not in our database'}
    }
    let datetime =  await promisify(cb => this.app.biathlon.web3.eth.getBlock(tx.blockNumber, cb))
    tx.when = datetime.timestamp
    return tx
  }


  async get_minting(token, account) {

  }

  async get_transfers(token, account) {

  }
  routes() {
    this.app.route("/accounts")
      .get(async(req, res) => {
        let nodelist = await this.app.biathlon.get_nodelist()
        return new Promise(async(resolve, reject) => {
          let accounts = await this.get_accounts(nodelist)
          resolve(accounts)
        })
        .then(async(accounts) => {
          let new_accounts = []
          for (let t of accounts) {
            let identity = await this.add_identities(t.args.addr)
            if (identity) {
              t.identity = identity
              await new_accounts.push(t)
            }
          }

          return new_accounts
        }).then((na) => {
          res.status(200).json(na.sort((a, b) => parseInt(b.identity.latest_balance) - parseFloat(a.identity.latest_balance)))
        })
      })

    this.app.route("/accounts/:id/token/:token_id/transactions")
      .get(async(req, res) => {
        let token =  await this.app.biathlon.get_token(req.params.token_id)
        let mint = token.Mint({to: req.params.id}, {fromBlock: 0, toBlock: 'latest'})
        let transfers = token.Transfer({from: req.params.id}, {fromBlock: 0, toBlock: 'latest'})
        let all_transactions = await this.get_spending(token, req.params.id)
        let identity = await this.add_identities(req.params.id)
        return new Promise(async(resolve, reject) => {
          await mint.get(async (error, e) => {
            await e.forEach(async (spend) => {
              await all_transactions.push(spend)
            })
           resolve(all_transactions)
          })
        })
        .then(async (transactions) => {
          let new_transactions = []          
          for (let t of transactions) {
            await new_transactions.push(await this.kuusi_palaa(t))
          }
          return new_transactions
        })
        .then((tt) => {

          res.status(200).json({"identity": identity, "transactions" : tt.sort((a,b) => parseInt(b.when) - parseInt(a.when))})
        })
      })

      
  }

}

exports.Accounts = Accounts;
    