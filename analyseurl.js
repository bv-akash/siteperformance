var http = require('http');
const puppeteer = require('puppeteer');
const PuppeteerHar = require('puppeteer-har');
const util1  = require('util');
var files, dict,
	prefix = '',
	harContent = '',
	stdin = process.stdin,
	fs = require('fs'),
	http = require('http'),
	url = require('url'),
	YSLOW = require('yslow').YSLOW,
	jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { document } = (new JSDOM('')).window;
global.document = document;
var program = require('commander');
var util = YSLOW.util;

const server = http.createServer();
server.on('request',async (req, res) => {
	console.log("start"); 

	try{ 
		res.setHeader('Content-Type','application/json');
		if(req.headers.file){
			var result = runYSlow(JSON.parse(req.headers.file));			
			var cache = [];
			res.end(JSON.stringify(result, function(key, value) {
				if (typeof value === 'object' && value !== null) {
					if (cache.indexOf(value) !== -1) {
						return { "url": value["url"]};
					}
					cache.push(value);
				}
				return value;
			}));
			cache = null; 
		}
		else{	
			const buffer =  await generate_screenshot_har(req.headers.link);	
			var result = JSON.stringify({ a : buffer["a"], b : buffer["b"], c : buffer["c"] });
			res.end(result);
		}
	}catch(err){
		console.log(err);
		res.writeHead(404);
		res.end("ERROR");
	}
	console.log("Done");
});
server.listen(8080);





async function generate_screenshot_har(link) {

	const browser = await puppeteer.launch({headless:true,slowmo:0,ignoreHTTPSErrors: true });
	const page = await browser.newPage();
	await page.setExtraHTTPHeaders({'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8'});
	const har = new PuppeteerHar(page);
	await har.start();
	await page.goto(link,{ networkIdle2Timeout:5000, waitUntil: 'load', timeout: 40000 });
	await page.setViewport({
		width: 1366,
		height: 768
	});
	data  =  await har.stop();
	const fullpagescreenshot = await page.screenshot({fullPage: true});
	const screenshot = await page.screenshot('png');
	browser.close();
	return {a : JSON.stringify(data), b : screenshot, c : fullpagescreenshot};

}



function runYSlow(har) {

	var result, content;
	if (!har) {
		return;
	}
	try {
		result = YSLOW.harImporter.run(document, har, program.ruleset);
	} catch (err) {
		console.log(err);
	}         
	return result;
}



