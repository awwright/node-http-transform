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
