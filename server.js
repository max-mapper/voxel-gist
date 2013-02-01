var snuggie = require('snuggie')
var ecstatic = require('ecstatic')('./www')
var uglify = require('uglify-js')
var zlib = require('zlib')
var githubOAuth = require('github-oauth')
var uuid = require('hat')
var url = require('url')

// sessions are just used for publishing gists
var sessions = {}

var github = githubOAuth({
  githubClient: process.env['GITHUB_CLIENT'],
  githubSecret: process.env['GITHUB_SECRET'],
  baseURL: process.env['VHOST'],
  loginURI: '/login',
  callbackURI: '/github/callback',
  scope: 'user,gist'
})

github.on('error', function(err, res) {
  console.error('there was a login error', err)
  res.end(JSON.stringify(err))
})

github.on('token', function(token, res) {
  var id = setUserID(res)
  sessions[id] = token
  res.statusCode = 302
  res.setHeader('location', '/')
  res.end()
})

function setUserID(res) {
  var id = uuid()
  var cookie = 'user-id=' + id + '; path=/'
  res.setHeader('set-cookie', cookie)
  return id
}

var http = require('http').createServer(function(req, res) {
  // github login
  if (req.url.match(/login/)) return github.login(req, res)
  if (req.url.match(/callback/)) return github.callback(req, res)
  
  // rules: all GET are static, for everything else there's snuggie
  if (req.method === "GET") return ecstatic(req, res)

  snuggie.handler(req, function(err, bundle) {
    if (err) return snuggie.respond(res, JSON.stringify(err))
    var minified = uglify.minify(bundle, {fromString: true}).code
    var body = JSON.stringify({bundle: minified})
    var accept = req.headers['accept-encoding']
    if (!accept || !accept.match('gzip')) return snuggie.respond(res, body)
    zlib.gzip(body, function(err, buffer) {
      res.setHeader('Content-Encoding', 'gzip')
      snuggie.respond(res, buffer)
    })
  })
}).listen(80)
