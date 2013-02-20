all: bundle

bundle:
	node_modules/browserify/bin/cmd.js www/index.js -o www/bundle.js
	node_modules/browserify/bin/cmd.js www/embed.js -o www/embed-bundle.js
