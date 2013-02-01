var elementClass = require('element-class')
var sandbox = require('browser-module-sandbox')
var qs = require('querystring')
var cookie = qs.parse(document.cookie)
var loggedIn = false
if (cookie && cookie['user-id']) loggedIn = true

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

var crosshair = document.querySelector('#crosshair')
var crosshairClass = elementClass(crosshair)

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
