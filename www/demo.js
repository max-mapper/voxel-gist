var elementClass = require('element-class')
var sandbox = require('browser-module-sandbox')
var qs = require('querystring')
var cookie = qs.parse(document.cookie)
var loggedIn = false
if (cookie && cookie['user-id']) loggedIn = true

if (loggedIn) changeLoginButtonToSave()

// todo read from template/file
var defaultGame = "var createGame = require('voxel-engine')\n\n" +
"window.game = createGame()\n\n" +
"// rotate camera to look straight down\n" +
"game.controls.pitchObject.rotation.x = -1.5\n\n" + 
"var container = document.querySelector('#play')\n" +
"game.appendTo(container)\n" + 
"game.setupPointerLock(container)\n"

var gameCreator = sandbox({
  defaultCode: defaultGame,
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
  if (item === "save") window.location.href="/save"
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

function changeLoginButtonToSave() {
  var loginButton = document.querySelector('#login')
  var label = loginButton.querySelector('div')
  label.setAttribute('data-id', 'save')
  label.innerHTML = 'Save'
  loginButton.querySelector('img').setAttribute('src', 'icons/noun_project_10208.png')
}