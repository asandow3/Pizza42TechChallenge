const express = require("express");
const { join } = require("path");
const app = express();
const jwt = require("express-jwt");
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require("jwks-rsa");
const authConfig = require("./auth_config.json");

//Permission to access OrderPizza API.  Should be in the access token scope
const checkScopes = jwtAuthz([ 'create:PizzaOrder' ]);

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithms: ["RS256"]
});

// Serve static assets from the /public folder
app.use(express.static(join(__dirname, "public")));

// This route doesn't need authentication
/*app.get('/api/public', function(req, res) {
  res.json({
    message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
  });
});*/

// This route needs authentication
/*app.get('/api/private', checkJwt, function(req, res) {
  res.json({
    message: 'Hello from a private endpoint! You need to be authenticated to see this.'
  });
});*/

//endpoint checks for required scope; Passes in API parameters
app.get('/api/private-scoped', checkJwt, checkScopes, function(req, res) {
  res.json({
    message: 'You are authenticated with a verified email and have a scope of create:PizzaOrder.  Your Pizza is ordered.'
  });
});

//external endpoint
/*app.get("/api/external", checkJwt, (req, res) => {
  res.send({
    msg: "Your access token was successfully validated!"
  });
});*/

// Endpoint to serve the configuration file
app.get("/auth_config.json", (req, res) => {
  res.sendFile(join(__dirname, "auth_config.json"));
});

// Serve the index page for all other requests
app.get("/*", (_, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

app.use(function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token" });
  }

  next(err, req, res);
});

// Listen on port 3000 when local and PORT variable when Heroku
let port = process.env.PORT;
if (port == null || port == ""){
	port = 3000
}	
app.listen(port, () => console.log("Application running on port "+port));