"use strict";

function HeaderError(code, message){
	var err = new Error(message);
	err.code = code;
	return err;
}

module.exports.Headers = Headers;

function Headers(from){
	this.statusCode = null;
	this.statusMessage = '';
	this._headerSent = false;
	this._header = null;
	this._headerList = {};
	// this.rawHeaders = [];
}

Headers.validateNameRegExp = /^[\^_`a-zA-Z\-0-9!#$%&'*+.|~]+$/;
Headers.validateName = function validateName(name){
	if (typeof name !== 'string' || !name || !Headers.validateNameRegExp.test(name)) {
		throw HeaderError('ERR_INVALID_HTTP_TOKEN', 'Header name must be a valid HTTP token', name);
	}
};

Headers.prototype.pipeHeaders = function pipeHeaders(dst, opt){
	// Copy status code
	if(this.url) dst.path = this.url;
	if(this.method) dst.method = this.method;
	if(this.statusCode) dst.statusCode = this.statusCode;
	if(this.statusMessage) dst.statusMessage = this.statusMessage;
	// Copy headers
	for(var k in this._headerList){
		dst.setHeader(this._headerList[k][0], this._headerList[k][1]);
	}
	return dst;
};

Headers.prototype.getHeader = function getHeader(name) {
	if(!this._headerList){
		throw new Error('Headers not yet received');
	}
	var entry = this._headerList[name.toLowerCase()];
	return entry && entry[1];
};

Headers.prototype.writeHead = function writeHead(code, message, headers){
	if (this._headerSent) {
		throw new Error('writeHead');
	}
	this.statusCode = code;
	if(typeof message==='string'){
		this.statusMessage = message;
	}else{
		headers = message;
	}
	for(var n in headers) this.setHeader(n, headers[n]);
	this.flushHeaders();
};

Headers.prototype.flushHeaders = function flushHeaders(){
	// for PassThrough, this._readableSide will just be `this`
	const readableSide = this._readableSide;
	if(readableSide._readyCallback===null){
		throw new Error('Already wrote headers');
	}
	if (this._headerSent) {
		throw new Error('Headers already written');
	}
	this._headerSent = readableSide._headerSent = true;
	// Copy header state to readable side
	readableSide._headerList = this._headerList;
	if(this.statusCode && readableSide.statusCode !== this.statusCode) readableSide.statusCode = this.statusCode;
	if(this.statusMessage && readableSide.statusMessage !== this.statusMessage) readableSide.statusMessage = this.statusMessage;
	if(this.path && readableSide.url !== this.path) readableSide.url = this.path;
	if(this.method && readableSide.method !== this.method) readableSide.method = this.method;
	readableSide.headers = {};
	readableSide.rawHeaders = this._header = [];
	var headers = this.getHeaders();
	for(var k in headers){
		const val = headers[k];
		readableSide.headers[k] = val;
		if(Array.isArray(val)){
			for(var i=0; i<val.length; i++){
				readableSide.rawHeaders.push(k);
				readableSide.rawHeaders.push(val[i]);
			}
		}else{
			readableSide.rawHeaders.push(k);
			readableSide.rawHeaders.push(val);
		}
	}
	// Copy the headers to their final destination
	readableSide._headerPipes.forEach(function(dst){
		readableSide.pipeHeaders(dst);
	});
	readableSide._readyCallback(readableSide);
	readableSide._readyCallback = null;
	readableSide.emit('headers');
};
 
Headers.prototype.setHeader = function setHeader(name, value){
	if (this._headerSent) {
		throw HeaderError('ERR_HTTP_HEADERS_SENT', 'Cannot set headers after they are sent to the client');
	}
	Headers.validateName(name);
	if(typeof value!=='string' && typeof value!=='number' && !Array.isArray(value)) throw new Error('Expected string `value`');
	var self = this;
	self._headerList[name.toLowerCase()] = [name, value];
};

Headers.prototype.addHeader = function addHeader(name, value){
	if (this._header) {
		throw new Error('addHeader');
	}
	Headers.validateName(name);
	if(typeof value!=='string' && typeof value!=='number' && !Array.isArray(value)) throw new Error('Expected string `value`');
	var self = this;
	var old = this.getHeader(name);
	if(Array.isArray(old)){
		self._headerList[name.toLowerCase()] = [name, old.concat(value)];
	}else if(typeof old==='string'){
		self._headerList[name.toLowerCase()] = [name, [old, value]];
	}else if(old===undefined){
		self._headerList[name.toLowerCase()] = [name, value];
	}else{
		throw new Error('Unknown existing value');
	}
};

Headers.prototype.removeHeader = function removeHeader(name){
	if (this._header) {
		throw HeaderError('ERR_HTTP_HEADERS_SENT', 'Cannot remove headers after they are sent to the client');
	}
	Headers.validateName(name);
	var self = this;
	var key = name.toLowerCase();
	delete self._headerList[key];
};

Headers.prototype.getHeaderNames = function getHeaderNames() {
	if(!this._headerList){
		throw new Error('Headers not yet received');
	}
	return this._headerList !== null ? Object.keys(this._headerList) : [];
};

Headers.prototype.getHeaders = function getHeaders() {
	if(!this._headerList){
		throw new Error('Headers not yet received');
	}
	const headers = this._headerList;
	const ret = Object.create(null);
	if (headers) {
		const keys = Object.keys(headers);
		for (var i = 0; i<keys.length; ++i) {
			ret[ keys[i] ] = headers[keys[i]][1];
		}
	}
	return ret;
};

Headers.prototype.hasHeader = function hasHeader(name) {
	if(!this._headerList){
		throw new Error('Headers not yet received');
	}
	return this._headerList !== null && !!this._headerList[name.toLowerCase()];
};

Headers.prototype.toString = function toString(name) {
	var list = this._headerList;
	return this.getHeaderNames().map(function(name){
		var pair = list[name];
		if(typeof pair[1]==='string') return pair[0] + ': ' + pair[1] + '\r\n';
		return pair[1].map(function(v){
			return pair[0] + ': ' + v + '\r\n';
		}).join('');
	}).join('');
};
