const util = require('util')
const biathlon = require('../middlewares/biathlon')

const promisify = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }

      resolve(res);
    })
  )

class Tokens {
  constructor(app) {
    this.app = app;

  }

  routes() {

    //  return tokens and users
    this.app.route("/token/:id")
      .get(async(req, res) => {
        let token = await this.app.biathlon.get_token(req.params.id)
        let name = await  promisify(cb => token.name(cb))
        let standard = await promisify(c => token.standard(c))
        let symbol = await promisify(cb => token.symbol(cb))
        let totalsupply = await promisify(cb => token.totalSupply(cb))

        res.status(200).json({"address" : req.params.id, "name": name, "totalsupply": totalsupply, "standard": standard, "symbol": symbol})
      })

  }

}

exports.Tokens = Tokens