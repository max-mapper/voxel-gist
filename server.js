var snuggie = require('snuggie')
var ecstatic = require('ecstatic')('./www')
var uglify = require('uglify-js')
var zlib = require('zlib')
var githubOAuth = require('github-oauth')
var uuid = require('hat')
var url = require('url')
var concat = require('concat-stream')
var qs = require('querystring')
var request = require('request')

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
  sessions[id] = token.access_token
  res.statusCode = 302
  res.setHeader('location', '/?save=true')
  res.end()
})

function saveGist(req, res) {
  var id = req.url.match(/^\/save\/(\d+)$/)
  if (id) id = id[1]
  req.pipe(concat(function(err, funcString) {
    if (err) return res.end(JSON.stringify({error: err}))
    var cookies = qs.parse(req.headers.cookie)
    if (!cookies['user-id']) return res.end(JSON.stringify({error: 'not logged in'}))
    var token = sessions[cookies['user-id']]
    var gist = {
      "description": "voxel.js game",
      "public": true,
      "files": {
        "index.js": {
          "content": funcString.toString()
        }
      }
    }
    var headers = {
      'Authorization': 'token ' + token
    }
    var reqOpts = {json: gist, url: 'https://api.github.com/gists', headers: headers, method: "POST"}
    if (id) { 
      reqOpts.method = "PATCH"
      reqOpts.url = reqOpts.url + '/' + id
    }
    request(reqOpts, function(err, resp, body) {
      if (err) return res.end(JSON.stringify({error: err}))
      if (resp.statusCode > 399) return res.end(JSON.stringify({error: body}))
      res.end(JSON.stringify({ id: body.id }))
    })    
  }))
}

function setUserID(res) {
  var id = uuid()
  var cookie = 'user-id=' + id + '; path=/'
  res.setHeader('set-cookie', cookie)
  return id
}

function checkSession(req, res) {
  if (!req.headers.cookie) return
  var cookies = qs.parse(req.headers.cookie)
  var token = cookies['user-id']
  if (token && !sessions[token]) res.setHeader('set-cookie', 'user-id=; path=/')
}

var http = require('http').createServer(function(req, res) {
  // make sure everyone has a user-id cookie
  checkSession(req, res)

  // matches foo.com/324839425 (gist id)
  // treat these as if they were /
  var gistID = req.url.match(/^\/(\d+)$/)
  if (gistID) req.url = req.url.replace(gistID[1], '')
  
  // github login
  if (req.url.match(/\/login/)) return github.login(req, res)
  if (req.url.match(/\/callback/)) return github.callback(req, res)
  
  // gist saving
  if (req.url.match(/\/save/)) return saveGist(req, res)
  
  // rules: all GET are static
  if (req.method === "GET") return ecstatic(req, res)

  // for everything else there's snuggie
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
