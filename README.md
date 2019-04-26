# http-transform

An extension of the Node.js Transform stream that additionally supports the HTTP header interface.


## Features

Add a Content-Type to a ReadableStream:

```javascript
const http = require('http');
const { createReadStream } = require('fs');
const { inherits } = require('util');
const { ServerResponseTransform } = require('.');
const { markdown } = require( "markdown" );

inherits(MarkdownTransform, ServerResponseTransform);
function MarkdownTransform(){
	if(!(this instanceof MarkdownTransform)) return new MarkdownTransform();
	ServerResponseTransform.call(this);
	this.sourceContents = '';
	this.push('<!DOCTYPE html>');
	this.push('<html xmlns="http://www.w3.org/1999/xhtml" lang="en" dir="ltr">');
	this.push('	<head>');
	this.push('		<meta charset="UTF-8" />');
	this.push('		<title></title>');
	this.push('		<meta name="description" content="" />');
	this.push('	</head>');
	this.push('	<body>');
	this.push('		<main id="main-content">');
};
MarkdownTransform.prototype._transformHead = function _transformHead(headers){
	headers.setHeader('Content-Type', 'application/xhtml+xml');
	return headers;
};
MarkdownTransform.prototype._transform = function _transform(data, encoding, callback){
	// Buffer incoming MarkdownTransform data
	this.sourceContents += data;
	callback(null);
};
MarkdownTransform.prototype._flush = function _flush(callback){
	// Render the MarkdownTransform to HTML and push out trailers
	this.push(markdown.toHTML(this.sourceContents));
	this.push('		</main>');
	this.push('	</body>');
	this.push('</html>');
	callback();
};

const server = http.createServer(function(req, res) {
	if(req.url!=='/'){
		res.statusCode = 404;
		res.end('404 Not Found\n');
		return;
	}
	if(req.method!=='GET'){
		res.statusCode = 501;
		res.setHeader('Allow', 'GET');
		res.end('501 Not Implemented\n');
		return;
	}
	createReadStream('README.md').pipe(new MarkdownTransform).pipe(res);
});
server.listen(8080);
```

## API

### ServerResponseTransform

A subclass of the Node.js Transform that also transforms HTTP headers and status code.

Properties/methods:

* headersReady - A promise that resolves when headers have been committed and are ready to be read

### PassThrough

Accepts input and passes it to the write target(s).

This can be used to convert a typical ReadableStream into one that produces HTTP headers.

### Headers

Headers is a simple container for HTTP headers. Its methods and properties are imported into ServerResponseTransform.

Properties/methods, as implemented in Node.js:

* statusCode
* statusMessage
* getHeader(name)
* setHeader(name, value)
* removeHeader(name)
* getHeaderNames()
* getHeaders()
* hasHeader(name)

Additional methods:

* addHeader(name, value)
* pipeHeaders(dst) - set status code/message, and call setHeader on supplied destination
