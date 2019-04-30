"use strict";

const Transform = require('stream').Transform;
const util = require('util');

const { Headers } = require('./Headers.js');

module.exports.ServerResponseTransform = ServerResponseTransform;
util.inherits(ServerResponseTransform, Transform);
function ServerResponseTransform(options){
	var self = this;
	Transform.call(this, options);
	Headers.call(this);
	options = options || {};
	if(options.transformHead) this._transformHead = options.transformHead;
	this.headersReady = new Promise(function(resolve, reject){
		self._resolveHeadersReady = resolve;
		self._resolveHeadersError = reject;
	});
	this._headerPipes = [];
}

ServerResponseTransform.prototype._onHeadersReady = function _onHeadersReady(){
	var self = this;
	this.emit('headersReady');
	if(typeof this._resolveHeadersReady==='function') this._resolveHeadersReady(this);
	self._headerPipes.forEach(function(dst){ self._headers.pipeHeaders(dst); });
}

ServerResponseTransform.prototype.pipe = function pipe(dst, opt){
	this.pipeHeaders(dst);
	Transform.prototype.pipe.call(this, dst, opt);
	return dst;
}

ServerResponseTransform.prototype.unpipe = function unpipe(dst){
	const index = this._headerPipes.indexOf(dst);
	if (index>=0){
		this._headerPipes.splice(index, 1);
	}
	return Transform.prototype.unpipe.call(this, dst);
}

ServerResponseTransform.prototype.pipeHeaders = function pipeHeaders(dst, opt){
	var self = this;
	// Copy status code
	if(self.statusCode) dst.statusCode = self.statusCode;
	if(self.statusMessage) dst.statusMessage = self.statusMessage;
	// Copy headers
	for(var k in this._headerList){
		dst.setHeader(self._headerList[k][0], self._headerList[k][1]);
	}
	// Add to list of destinations to pipe headers to
	if(this._headerPipes.indexOf(dst) < 0){
		this._headerPipes.push(dst);
	}
	return dst;
}

// Pipe only the message body, if any
ServerResponseTransform.prototype.pipeBody = function pipeBody(dst, opt){
	return Transform.prototype.pipe.call(this, dst, opt);
}

// Pipe the message headers, then the body
ServerResponseTransform.prototype.pipeMessage = function pipeMessage(dst, opt){
	this.pipeHeaders(dst);
	Transform.prototype.pipe.call(this, dst, opt);
	return dst;
}

ServerResponseTransform.prototype.push = function push(chunk, encoding){
	var self = this;
	if(!this._headers){
		var headers = new Headers();
		this.pipeHeaders(headers);
		if(this._transformHead) this._headers = this._transformHead(headers);
		if(!this._headers) this._headers = headers;
		else if(!(this._headers instanceof Headers)) throw new Error('Expected return value to be instanceof Headers');
		self._onHeadersReady();
	}
	Transform.prototype.push.call(self, chunk, encoding);
}

ServerResponseTransform.prototype.setHeader = Headers.prototype.setHeader;
ServerResponseTransform.prototype.addHeader = Headers.prototype.addHeader;
ServerResponseTransform.prototype.hasHeader = Headers.prototype.hasHeader;
ServerResponseTransform.prototype.getHeader = Headers.prototype.getHeader;
ServerResponseTransform.prototype.removeHeader = Headers.prototype.removeHeader;
ServerResponseTransform.prototype.getHeaders = Headers.prototype.getHeaders;
ServerResponseTransform.prototype.getHeaderNames = Headers.prototype.getHeaderNames;
