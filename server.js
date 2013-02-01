var snuggie = require('snuggie')
var ecstatic = require('ecstatic')('./www')
var uglify = require('uglify-js')
var zlib = require('zlib')

var http = require('http').createServer(function(req, res) {
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
}).listen(8080)
