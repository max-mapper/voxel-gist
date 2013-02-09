all: bundle

bundle:
	browserify www/index.js -o www/bundle.js
	browserify www/embed.js -o www/embed-bundle.js
