var jsonp = require('jsonp')
var request = require('browser-request')

var parts = window.location.pathname.split('/')
var gistID = parts[2]

jsonp('https://api.github.com/gists/' + gistID, function(err, gist) {
  if (err) return console.log(err)
  var minified = gist.data.files['minified.js']
  if (!minified) {
    var unminified = gist.data.files['index.js']
    if (!unminified) return console.log('missing index.js')
    request({url: '/', method: 'POST', body: unminified.content, json: true}, function(err, resp, body) {
      if (err) return console.log(err)
      if (body.error) return console.log(body.error)
      eval(body.bundle)
    })
  } else {
    eval(minified.content)
  }
})
