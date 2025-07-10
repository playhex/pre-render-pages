Pre-render some content PlayHex page to try to enhance SEO.

This project will:

Crawl a list of PlayHex pages, dump html content to files with a manifest.

Then we can export it to PlayHex project,
and render this static content directly to the browser instead of an empty page for vuejs.

Vuejs will still load and refresh content.

## Usage

PlayHex must be served (any mode, dev or prod, same result):

``` bash
cd ../hex
yarn serve
```

Then in this project:

Run crawling:

``` bash
node index.js
```

Will export to `pre-rendered/`.

Assuming PlayHex is in same folder, copy fresh templates:

``` bash
rm -fr ../hex/views/pre-rendered && cp -r pre-rendered ../hex/views/
```

PlayHex should be restarted to load these new templates into memory.

Pages are split into 3 sections because PlayHex needs to keep the layout structure,
with last js bundle to the end (not the js bundle from when we crawled).
