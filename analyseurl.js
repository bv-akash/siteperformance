var http = require('http');
var fs = require('fs');
const puppeteer = require('puppeteer');
const PuppeteerHar = require('puppeteer-har');
var formidable = require('formidable');
var YSLOW = require('yslow').YSLOW,
   	jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { document } = (new JSDOM('')).window;
global.document = document;
var program = require('commander');
const server = http.createServer();
server.on('request',async (req, res) => 
{  try
	 {
	  	if(req.method == 'POST')
	    { 
		   var form = new formidable.IncomingForm();
		   var content ='';
		   form.parse(req, function (err, fields, files)
		   {
				  fs.readFile(files.upload.path, function read(err, data)
				  {
				    if (err) {	throw err; }
				    content = data;
				    var result = runyslow(JSON.parse(content.toString('utf-8')));
				    res.setHeader('Content-Type','application/json');
				    var cache = [];
				    res.end(JSON.stringify(result, function(key, value)
				    {
					     if (typeof value === 'object' && value !== null)
					     {
					 	     if (cache.indexOf(value) !== -1)
						     {
						      	return { "url": value["url"] };
					       }
					 	     cache.push(value);
					     }
					     return value;
				    }));
				    cache = null;
			    });
	      });
	     }
	     else
	     {
		    console.log("Screenshot");
			  const buffer =  await generate_screenshot_har(req.headers.link);
			  var result = JSON.stringify({ a : buffer["a"], b : buffer["b"], c : buffer["c"] });
			  res.end(result);
  	   } 
   }
	 catch(err)
	 {
		  console.log(err);
		  res.end("ERROR");
	 }
	
	 console.log("Done");

}).listen(8080);



async function generate_screenshot_har(link)
{

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

function runyslow(har) 
{
 	var result, content;
	if (!har) 
	{
		return;
	}
	try
	{
			result = YSLOW.harImporter.run(document, har, program.ruleset);
	} 
	catch (err) 
	{
			console.log(err);
	}         
	return result;
}



