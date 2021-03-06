# http-transform

An extension of the Node.js Transform stream that additionally supports the HTTP header interface.

* `RequestPair`: creates a pair of related streams, one writable, one readable; anything written to the `clientWritableSide` is readable on the `serverReadableSide`.
* `ResponsePair`:  creates a pair of related streams, one writable, one readable; anything written to the `serverWritableSide` is readable on the `clientReadableSide`.
* `ResponsePassThrough`: creates a Duplex stream that also stores HTTP headers; anything written to it becomes readable. Headers are passed through as exactly as possible. It should typically possible to pipe a response through a ResponsePassThrough instance with no change in behavior. This is typically used to programmatically create a response that's readable the same way a Node.js `req` object is, and can be piped to a `res` server response object.


## TODO

* `RequestPassThrough` — Request variation of `ResponsePassThrough`
* `RequestThroughOrigin` — subclass of RequestPair that applies header normalizations, as if the request is actually going through the network.
* `ResponseThroughOrigin` — subclass of ResponsePair that applies header normalizations, as if the response is actually going through the network.


## Features

Mock a readable response object:

```javascript
function makeResponse(){
	const res = new ResponsePassThrough;
	res.setHeader('Content-Type', 'text/plain')
	res.write('Line\r\n');
	return res.readableClientSide;
}
```

Add a Content-Type to a ReadableStream:

```javascript
const http = require('http');
const { createReadStream } = require('fs');
const { inherits } = require('util');
const { ResponseTransform } = require('.');
const { markdown } = require( "markdown" );

class MarkdownTransform extends ResponseTransform {
	constructor() {
		super();
		const [ input, output ] = this.makeStreams();
		output.setHeader('Content-Type', 'application/xhtml+xml');
		output.write('<!DOCTYPE html>');
		output.write('<html xmlns="http://www.w3.org/1999/xhtml" lang="en" dir="ltr">');
		output.write('	<head>');
		output.write('		<meta charset="UTF-8" />');
		output.write('		<title></title>');
		output.write('		<meta name="description" content="" />');
		output.write('	</head>');
		output.write('	<body>');
		output.write('		<main id="main-content">');
		input.once('readable', async function(){
			var source = '';
			for await(var chunk of input) source += chunk.toString();
			output.write(markdown.toHTML(this.sourceContents));
			output.write('		</main>');
			output.write('	</body>');
			output.write('</html>');
			output.end();
		});
	}
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

### ResponseTransform

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
* pipe(dst)

Additional methods:

* addHeader(name, value)
* pipeHeaders(dst) - copy status/message fields to `dst`
* pipeMessage(dst) - copy status, message fields, and pipe the stream to `dst`
