const nodes = require('../controllers/nodes')
const accounts = require("../controllers/accounts")

class Routes {
  constructor(app) {

    new nodes.Nodes(app).routes()
    new accounts.Accounts(app).routes()
    app.get("/", (req, res) => {
      res.json({
        msg: "Biathlon status API",
      });
    });
    app.get("*", (req, res) => {
      res.status(404).json({
        msg: "Route not found",
      });
    });
  }
}

exports.Routes = Routes