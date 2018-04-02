const haml = require('hamljs')
const fs = require('fs')
const config = require('node-yaml-config').load('./config.yaml');
const express = require('express')
const cookieSession = require('cookie-session')
const promise = require("bluebird");
const util = require('util')
const morgan = require("morgan");
const syncer = require("./middlewares/syncing")
const biathlon = require("./middlewares/biathlon")
const routes = require('./config/routes')
const https = require('https');
const http = require('http');
const privateKey  = config.private_key
const certificate = config.sslcert
const sslOptions = {}

const initOptions = {
    promiseLib: promise
}
const hstore = require('pg-hstore')();

const pgp = require('pg-promise')(initOptions);

class App {
  constructor(NODE_ENV = 'development', PORT = 3009) {
    process.env.NODE_ENV = process.env.NODE_ENV || NODE_ENV;
    /**
     * Setting port number
     */
    process.env.PORT = process.env.PORT || String(PORT);


    this.app = express();
    this.app.db = pgp(config.pgconnection);
    this.app.db.connect()
      .then(obj => {

          obj.done(); // success, release the connection;
      })
      .catch(error => {
          console.log('ERROR:', error.message || error);
      });
    
    this.app.use(cookieSession({
      name: 'session',
      keys: ['sgsgsdgsdg'],
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }))

    if (process.env.NODE_ENV === "development") {
      this.app.use(morgan("dev")); // log every request to the console
      http.createServer(this.app).listen(8000);
    } else {
      sslOptions.key= fs.readFileSync(privateKey, 'utf8')
      sslOptions.cert = fs.readFileSync(certificate, 'utf8')

      https.createServer(sslOptions, this.app).listen(process.env.PORT)

    }
    this.app.use(function (req, res, next) {

      // Website you wish to allow to connect
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Request methods you wish to allow
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

      // Request headers you wish to allow
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

      // Set to true if you need the website to include cookies in the requests sent
      // to the API (e.g. in case you use sessions)
      res.setHeader('Access-Control-Allow-Credentials', true);

      // Pass to next layer of middleware
      next();
    })

    new syncer.Syncer(this.app);

    this.app.biathlon = new biathlon.Biathlon();

    new routes.Routes(this.app);
  
    this.server = this.app.listen(process.env.PORT, function () {
      console.log('The server is running in port localhost: ', process.env.PORT);
    });

    this.app.use(function (err, req, res, next) {
      console.error(err.stack);
      res.status(500).send('Something broke!');
    });

  }

}
exports.App = App;
