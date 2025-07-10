import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import puppeteer from 'puppeteer';
import { minify } from 'html-minifier-terser';
import { JSDOM } from 'jsdom';
import { pagesToCrawl } from './pagesToCrawl.js';

// const baseUrl = 'http://localhost:3000';
const baseUrl = 'https://playhex.org';

const outputFolder = 'pre-rendered';

/**
 * Returns a template filename from path:
 * "/en/landing-test", "body.html" => "en_landing-test__body.html"
 */
const createFilenameFromPath = (path, part) => {
    return path
        .replace(/^\//, '') // trim beginning slash
        .replace(/\//g, '_') // replace others slashes by underscores
        + '__' + part // add part at the end
    ;
};

(async () => {
    rmSync(outputFolder, { force: true, recursive: true });
    mkdirSync(outputFolder);

    /**
     * {
     *  '/en/landing': {
     *    optimize: true,
     *    templatesParts: {
     *      lang: 'en',
     *      head: 'pre-rendered/en_landing__head.html',
     *      body: 'pre-rendered/en_landing__body.html'
     *    }
     *  },
     *  ...
     * }
     */
    const manifest = {};

    const browser = await puppeteer.launch({
        headless: false, // headless true is making a page timeout
    });

    // Keep an open page on lobby to prevent blinking "Online players" section with this browser player
    const homePage = await browser.newPage();
    await homePage.goto(baseUrl);

    let i = 0;

    for (const { path, locale, optimize } of pagesToCrawl) {
        ++i;
        console.log(`Progression: ${i} / ${pagesToCrawl.length}...`);
        console.log('page ' + path);
        console.log('    open page...');

        const page = await browser.newPage();

        await page.evaluateOnNewDocument(locale => {
            Object.defineProperty(navigator, 'language', {
                get: function() {
                    return locale;
                }
            });
            Object.defineProperty(navigator, 'languages', {
                get: function() {
                    return [locale, locale.split('-').shift()];
                }
            });
        }, locale ?? 'en-US');

        await page.goto(baseUrl + path);

        console.log('    wait until fully loaded...');

        await page.waitForNetworkIdle();

        let htmlContent = await page.content();

        htmlContent = await minify(htmlContent, {
            removeComments: true,
            minifyJS: true,
            minifyCSS: true,
            useShortDoctype: true,
        });

        const { document } = new JSDOM(htmlContent).window;

        const templateParts = {
            lang: document.querySelector('html').getAttribute('lang'),
            head: outputFolder + '/' + createFilenameFromPath(path, 'head.html'),
            body: outputFolder + '/' + createFilenameFromPath(path, 'body.html'),
        };

        writeFileSync(templateParts.head, document.querySelector('head').innerHTML);
        writeFileSync(templateParts.body, document.querySelector('#vue-app').innerHTML);

        manifest[path] = {
            templateParts,
            optimize,
        };

        console.log('    saved to ' + Object.values(templateParts).join(', '));

        await page.close();

        console.log('    closed.');
    }

    await browser.close();

    writeFileSync(outputFolder + '/manifest.json', JSON.stringify(manifest, undefined, 4));

    console.log('manifest exported.');
    console.log('done');
})();
