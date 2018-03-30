const util = require('util')
const biathlon = require('../middlewares/biathlon')

const promisify = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }

      resolve(res);
    })
  )

class Nodes {
  constructor(app) {
    this.app = app;

  }

  async node_tokens(node) {
    let tokens = node.RegisterToken({}, {fromBlock: 0, toBlock: 'latest'})
    let all_tokens = []    
    return new Promise(async(resolve, reject) => {
      await tokens.get(async (error, e) => {
        await e.forEach(async (token) => {

          await all_tokens.push(token.args)
        })
        resolve(all_tokens)
      })
    })
  }

  routes() {

    this.app.route("/nodes")
      .get(async(req, res) => {
        let nodelist = await this.app.biathlon.get_nodelist() //req.session.nodelist
        let newnodes = nodelist.RegisterBiathlonNode({}, {fromBlock: 0, toBlock: 'latest'})
        let all_nodes = []
        return new Promise(async(resolve, reject) => {
          await newnodes.get(async(error, e) => {
            await e.forEach(async(node) => {

              await all_nodes.push(node.args.addr)
            })
            resolve(all_nodes)
          })

        })
        .then(async(node_addresses) => {
          let full_nodes = []
          for(let i = 0; i < node_addresses.length; i++) {
            let n = await this.app.biathlon.get_node(node_addresses[i])
            let name = await  promisify(cb => n.name(cb))
            let tokens = await this.node_tokens(n)
            let location = await promisify(cb => n.location(cb))
            await full_nodes.push({"name": name, "location": location, "address" : node_addresses[i], "tokens": tokens})

          }

          return full_nodes
        })
        .then((nodes) => {

          res.status(200).json(nodes)
        })
      })
    
    //  return tokens and users
    this.app.route("/node/:id")
      .get(async(req, res) => {
        // let nodelist = req.session.nodelist
        let node = await this.app.biathlon.get_node(req.params.id)
        let tokens = await this.node_tokens(node)
        let name = await  promisify(cb => node.name(cb))
        let location = await promisify(cb => node.location(cb))
        // let url = await promisify(cb => node.url(cb))

        res.status(200).json({"address" : req.params.id, "name": name, "location" : location,  "tokens" : tokens})
      })

    this.app.route("/node/:id/token/:token_id/transactions")
      .get(async(req, res) => {
        let node = await this.app.biathlon.get_node(req.params.id)
        let token = await this.app.biathlon.get_token(req.params.token_id)
      })

    this.app.route("/node/:id/users")
      .get(async(req, res) => {
      
        let nodelist = req.session.nodelist
        let regUser = nodelist.RegisterBiathlonUser({}, {fromBlock: 0, toBlock: 'latest'})
        let all_users = []
        return new Promise(async(resolve, reject) => {
          await regUser.get(async (error, e) => {
            
            await e.forEach(async (user) => {
              console.log(util.inspect(user))
              await all_users.push(user.args.addr)
            })
            console.log(all_users.length)
            resolve(all_users)
          })
        })
        .then((users) => {
          res.status(200).json(users)
        })        
      })
      
  }

}

exports.Nodes = Nodes;
    