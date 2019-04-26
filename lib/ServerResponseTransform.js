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
}
ServerResponseTransform.prototype._destinations = function _destinations(){
	if(this._readableState.pipesCount==0) return [];
	if(this._readableState.pipesCount==1) return [this._readableState.pipes];
	return this._readableState.pipes;
}
ServerResponseTransform.prototype._onHeadersReady = function _onHeadersReady(){
	var self = this;
	this.emit('headersReady');
	if(typeof this._resolveHeadersReady==='function') this._resolveHeadersReady();
	self._destinations().forEach(function(dst){ self._headers.pipeHeaders(dst); });
}
ServerResponseTransform.prototype.pipe = function pipe(dst, opt){
	var self = this;
	// First copy metadata to dst:
	if(self._headers) self._headers.pipeHeaders(dst);
	Transform.prototype.pipe.call(self, dst, opt);
	return dst;
}

ServerResponseTransform.prototype.pipeHeaders = function pipeHeaders(dst, opt){
	var self = this;
	// Copy status code
	dst.statusCode = self.statusCode;
	dst.statusMessage = self.statusMessage;
	// Copy headers
	for(var k in this._headerList){
		dst.setHeader(self._headerList[k][0], self._headerList[k][1]);
	}
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
ServerResponseTransform.prototype.hasHeader = Headers.prototype.hasHeader;
ServerResponseTransform.prototype.getHeader = Headers.prototype.getHeader;
ServerResponseTransform.prototype.removeHeader = Headers.prototype.removeHeader;
ServerResponseTransform.prototype.getHeaders = Headers.prototype.getHeaders;
ServerResponseTransform.prototype.getHeaderNames = Headers.prototype.getHeaderNames;
