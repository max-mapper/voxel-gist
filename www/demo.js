var elementClass = require('element-class')
var sandbox = require('browser-module-sandbox')
var qs = require('querystring')
var url = require('url')
var request = require('browser-request')
var jsonp = require('jsonp')
var cookie = require('cookie')
var cookies = cookie.parse(document.cookie)
var loggedIn = false
if (cookies && cookies['user-id']) loggedIn = true

var parsedURL = url.parse(window.location.href, true)
var gistID = parsedURL.path.match(/^\/(\d+)$/)
if (gistID) gistID = gistID[1]

var loadingClass = elementClass(document.querySelector('.loading'))

function loadCode(cb) {
  if (gistID) {
    loadingClass.remove('hidden')
    return jsonp('https://api.github.com/gists/' + gistID, function(err, gist) {
      loadingClass.add('hidden')
      if (err) return cb(err)
      var json = gist.data
      if (!json.files || !json.files['index.js']) return cb({error: 'no index.js in this gist', json: json})
      cb(false, json.files['index.js'].content)
    })
  }
  
  var stored = localStorage.getItem('code')
  if (stored) return cb(false, stored)
  
  // todo read from template/file/server
  var defaultGame = "var createGame = require('voxel-engine')\n\n" +
  "window.game = createGame()\n\n" +
  "// rotate camera to look straight down\n" +
  "game.controls.pitchObject.rotation.x = -1.5\n\n" + 
  "var container = document.body\n" +
  "game.appendTo(container)\n" + 
  "game.setupPointerLock(container)\n"
  cb(false, defaultGame)
}

loadCode(function(err, code) {
  if (err) return alert(err)
  
  var gameCreator = sandbox({
    iframeHead: "<script type='text/javascript' src='http://cdnjs.cloudflare.com/ajax/libs/three.js/r54/three.min.js'></script>",
    codemirrorOptions: { lineWrapping: true},
    defaultCode: code,
    output: document.querySelector('#play'),
    controls: document.querySelector('#controls'),
    editor: document.querySelector('#edit'),
  })

  if (parsedURL.query.save) return saveGist(gistID)

  var howTo = document.querySelector('#howto')
  var crosshair = document.querySelector('#crosshair')
  var crosshairClass = elementClass(crosshair)

  gameCreator.controls.on('select', function(item) {
    if (item === "edit") elementClass(howTo).add('hidden')
    if (item === "howto") elementClass(howTo).remove('hidden')
    if (item === "save") {
      if (loggedIn) return saveGist(gistID)
      loadingClass.remove('hidden')
      window.location.href = "/login"
    }
  })

  gameCreator.on('bundleStart', function() {
    crosshairClass.add('spinning')
  })

  gameCreator.on('bundleEnd', function() {
    crosshairClass.remove('spinning')
  })

  gameCreator.on('edit', function() {
    if (typeof game !== "undefined") game = undefined
    var canvas = gameCreator.outputEl.querySelector('canvas')
    if (canvas) gameCreator.outputEl.removeChild(canvas)
  })
  
  if (!gistID) {
    gameCreator.editor.on("change", function() {
      var code = gameCreator.editor.editor.getValue()
      localStorage.setItem('code', code)
    })
  }
  
  function saveGist(id) {
    var saveURL = '/save'
    if (id) saveURL = saveURL += '/' + id
    loadingClass.remove('hidden')
    request({url: saveURL, method: "POST", body: gameCreator.editor.editor.getValue()}, function(err, resp, body) {
      loadingClass.add('hidden')
      var json = JSON.parse(body)
      if (json.error) return alert(JSON.stringify(json.error))
      window.location.href = "/" + json.id
    })
  }
})
