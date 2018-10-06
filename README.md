# http-transform

An extension of the Node.js Transform stream that additionally supports the HTTP header interface.


## Features

Add a Content-Type to a ReadableStream:

```javascript
const { inherits } = require('util');
const { ServerResponseTransform } = require('http-transform');
const { markdown } = require( "markdown" );

inherits(Markdown, ServerResponseTransform);
function Markdown(){
	if(!(this instanceof Markdown)) return new Markdown();
	ServerResponseTransform.call(this);
	this.sourceContents = '';
	this.push('<!DOCTYPE html>');
	this.push('<html xmlns="http://www.w3.org/1999/xhtml" lang="en" dir="ltr">');
	this.push('	<head>');
	//this.push('		<meta charset="UTF-8" />');
	this.push('		<title></title>');
	this.push('		<meta name="description" content="" />');
	this.push('	</head>');
	this.push('	<body>');
	this.push('		<main id="main-content">');
};
Markdown.prototype.name = 'Markdown';
Markdown.prototype._transformContentType = function _transformContentType(value, callback){
	callback(null, 'application/xhtml+xml');
};
Markdown.prototype._transformHeader = function _transformHeader(name, value, callback){
	callback(null, name, value);
};
Markdown.prototype._transform = function _transform(data, encoding, callback){
	// Buffer incoming Markdown data
	this.sourceContents += data;
	callback(null);
};
Markdown.prototype._flush = function _flush(callback){
	// Render the Markdown to HTML and push out trailers
	this.push(markdown.toHTML(this.sourceContents));
	this.push('		</main>');
	this.push('	</body>');
	this.push('</html>');
	callback();
};
```

## API

### ServerResponseTransform

A subclass of the Node.js Transform that also transforms HTTP headers and status code.

### PassThrough

Accepts input and passes it to the write target(s).

This can be used to convert a typical ReadableStream into one that produces HTTP headers.
