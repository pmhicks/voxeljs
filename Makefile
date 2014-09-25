
HTML_FILES = index.html
JS_MIN_FILES = jquery.hotkeys.min.js perfnow_shim.min.js voxeljs.min.js
ZIP_FILE = voxeljs.zip

all:
	sed 's/\.js/\.min\.js/g' index-dev.html > index.html
	curl -X POST -s --data-urlencode 'input@voxeljs.js' http://javascript-minifier.com/raw > voxeljs.min.js
	curl -X POST -s --data-urlencode 'input@perfnow_shim.js' http://javascript-minifier.com/raw > perfnow_shim.min.js
	curl -X POST -s --data-urlencode 'input@jquery.hotkeys.js' http://javascript-minifier.com/raw > jquery.hotkeys.min.js

run:
	python -m SimpleHTTPServer 8000

zip: clean all
	zip $(ZIP_FILE) $(HTML_FILES) $(JS_MIN_FILES) map/*.raw

clean:
	rm -f $(ZIP_FILE)
	rm -f $(HTML_FILES)
	rm -f $(JS_MIN_FILES)
