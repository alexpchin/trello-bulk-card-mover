var http          = require('http');
var OAuth         = require('oauth').OAuth;
var url           = require('url');
var domain        = "127.0.0.1";
var port          = 6080;
var requestURL    = "https://trello.com/1/OAuthGetRequestToken";
var accessURL     = "https://trello.com/1/OAuthGetAccessToken";
var authorizeURL  = "https://trello.com/1/OAuthAuthorizeToken";
var appName       = "Bulk Card Mover";
var key           = process.env.TRELLO_KEY;
var secret        = process.env.TRELLO_SECRET;
var loginCallback = "http://" + domain + ":" + port + "/cb";
var oauth_secrets = {};
var oauth         = new OAuth(requestURL, accessURL, key, secret, "1.0", loginCallback, "HMAC-SHA1");

function login(req, res) {
  return oauth.getOAuthRequestToken((function(_this) {
    return function(error, token, tokenSecret, results) {
      oauth_secrets[token] = tokenSecret;
      res.writeHead(302, {
        'Location': authorizeURL + "?oauth_token=" + token + "&name=" + appName
      });
      return res.end();
    };
  })(this));
}

function cb(req, res) {
  var query, token, tokenSecret, verifier;
  query = url.parse(req.url, true).query;
  token = query.oauth_token;
  tokenSecret = oauth_secrets[token];
  verifier = query.oauth_verifier;
  return oauth.getOAuthAccessToken(token, tokenSecret, verifier, function(error, accessToken, accessTokenSecret, results) {
    return oauth.getProtectedResource("https://api.trello.com/1/members/me", "GET", accessToken, accessTokenSecret, function(error, data, response) {
      return res.end(data);
    });
  });
}

http.createServer(function(req, res) {
  if (/^\/login/.test(req.url)) {
    return login(req, res);
  } else if (/^\/cb/.test(req.url)) {
    return cb(req, res);
  } else {
    return res.end("Don't know about that");
  }
}).listen(port, domain);

console.log("Server running at " + domain + ":" + port + "; hit " + domain + ":" + port + "/login");
