var elementClass = require('element-class')
var sandbox = require('browser-module-sandbox')
var qs = require('querystring')
var url = require('url')
var request = require('browser-request')
var cookie = require('cookie')
var cookies = cookie.parse(document.cookie)
var loggedIn = false
if (cookies && cookies['user-id']) loggedIn = true

var parsedURL = url.parse(window.location.href)
var gistID = parsedURL.path.match(/^\/(\d+)$/)
if (gistID) gistID = gistID[1]

if (loggedIn) changeLoginButtonToSave()

function loadCode(cb) {
  if (gistID) {
    return request({url: '/gist/' + gistID}, function(err, resp, gist) {
      cb(err, gist)
    })
  }
  
  var stored = localStorage.getItem('code')
  if (stored) return cb(false, stored)
  
  // todo read from template/file/server
  var defaultGame = "var createGame = require('voxel-engine')\n\n" +
  "window.game = createGame()\n\n" +
  "// rotate camera to look straight down\n" +
  "game.controls.pitchObject.rotation.x = -1.5\n\n" + 
  "var container = document.querySelector('#play')\n" +
  "game.appendTo(container)\n" + 
  "game.setupPointerLock(container)\n"
  cb(false, defaultGame)
}

loadCode(function(err, code) {
  if (err) return alert(err)
  
  var gameCreator = sandbox({
    defaultCode: code,
    output: document.querySelector('#play'),
    controls: document.querySelector('#controls'),
    editor: document.querySelector('#edit'),
  })

  var howTo = document.querySelector('#howto')
  var crosshair = document.querySelector('#crosshair')
  var crosshairClass = elementClass(crosshair)

  gameCreator.controls.on('select', function(item) {
    if (item === "edit") elementClass(howTo).add('hidden')
    if (item === "howto") elementClass(howTo).remove('hidden')
    if (item === "login") window.location.href="/login"
    if (item === "save") saveGist(gistID)
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
      var code = gameCreator.editor.getValue()
      localStorage.setItem('code', code)
    })
  }
  
  function saveGist(id) {
    var saveURL = '/save'
    if (id) saveURL = saveURL += '/' + id
    request({url: saveURL, method: "POST", body: gameCreator.editor.getValue()}, function(err, resp, gistID) {
      window.location.href = "/" + gistID
    })
  }
})

function changeLoginButtonToSave() {
  var loginButton = document.querySelector('#login')
  var label = loginButton.querySelector('div')
  label.setAttribute('data-id', 'save')
  label.innerHTML = 'Save'
  loginButton.querySelector('img').setAttribute('src', 'icons/noun_project_10208.png')
}