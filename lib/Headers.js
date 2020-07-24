"use strict";

const assert = require('assert');

function HeaderError(code, message){
	var err = new Error(message);
	err.code = code;
	return err;
}

module.exports.Headers = Headers;

function Headers(from){
	// Flag if the headers (sent or received) are final, and so cannot be modified
	this._headerSent = false;
	this.statusCode = null;
	this.statusMessage = '';
	this._header = null;
	this._headerList = {};
	// this.rawHeaders = [];
	this._headerPipes = [];

	// Request options
	if(from && typeof from.method === 'string') this.method = from.method;
	// Different ways to specify the target...
	if(from && typeof from.target === 'string') this.target = from.target;
	else if(from && typeof from.path === 'string') this.target = from.path;

	// Response options
	if(from && typeof from.statusCode === 'number') this.statusCode = from.statusCode;
	if(from && typeof from.statusMessage === 'string') this.statusMessage = from.statusMessage;

	// Message headers
	if(from && typeof from.rawHeaders === 'object' && Array.isArray(from.rawHeaders)){
		this._rawHeaderList = [];
		for(var i=0; i<from.rawHeaders.length; i+=2){
			this.addHeader(from.rawHeaders[i], from.rawHeaders[i+1]);
		}
	}else if(from && typeof from.headers === 'object'){
		if(Array.isArray(from.headers)){
			this._rawHeaderList = [];
			for(var i=0; i<from.headers.length; i++){
				this.addHeader(from.headers[i][0], from.headers[i][1]);
			}
		}else{
			for(var k in from.headers){
				this.setHeader(k, from.headers[k]);
			}
		}
	}
}

Object.defineProperty(Headers.prototype, 'url', {
	get: function() { return this.target; },
	set: function(val) { this.target = val; },
});
Object.defineProperty(Headers.prototype, 'path', {
	get: function() { return this.target; },
	set: function(val) { this.target = val; },
});

Headers.validateNameRegExp = /^[\^_`a-zA-Z\-0-9!#$%&'*+.|~]+$/;
Headers.validateName = function validateName(name){
	if (typeof name !== 'string' || !name || !Headers.validateNameRegExp.test(name)) {
		throw HeaderError('ERR_INVALID_HTTP_TOKEN', 'Header name must be a valid HTTP token', name);
	}
};

Headers.prototype.pipeHeaders = function pipeHeaders(dst, opt){
	// Copy status code
	if(this.target) dst.target = this.target;
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
		throw HeaderError('ERR_HTTP_HEADERS_SENT', 'Cannot set headers after they are sent to the client', 'writeHead');
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
	if (this._headerSent) {
		throw HeaderError('ERR_HTTP_HEADERS_SENT', 'Cannot set headers after they are sent to the client', 'flushHeaders');
	}
	this._headerSent = readableSide._headerSent = true;
	// Copy header state to readable side
	readableSide._headerList = this._headerList;
	if(this.statusCode && readableSide.statusCode !== this.statusCode) readableSide.statusCode = this.statusCode;
	if(this.statusMessage && readableSide.statusMessage !== this.statusMessage) readableSide.statusMessage = this.statusMessage;
	if(this.target && readableSide.target !== this.target) readableSide.target = this.target;
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
	if(readableSide._readyCallback){
		readableSide._readyCallback(readableSide);
		readableSide._readyCallback = null;
	}
	if(typeof readableSide.emit==='function') readableSide.emit('headers');
};
 
Headers.prototype.setHeader = function setHeader(name, value){
	if (this._headerSent) {
		throw HeaderError('ERR_HTTP_HEADERS_SENT', 'Cannot set headers after they are sent to the client', 'setHeader');
	}
	Headers.validateName(name);
	if(typeof value!=='string' && typeof value!=='number' && !Array.isArray(value)) throw new Error('Expected string or array `value`');
	var self = this;
	self._headerList[name.toLowerCase()] = [name, value];
};

Headers.prototype.addHeader = function addHeader(name, value){
	if (this._headerSent) {
		throw HeaderError('ERR_HTTP_HEADERS_SENT', 'Cannot set headers after they are sent to the client', 'addHeader');
	}
	Headers.validateName(name);
	if(typeof value!=='string' && typeof value!=='number') throw new Error('Expected string `value`');
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
	if (this._headerSent) {
		throw HeaderError('ERR_HTTP_HEADERS_SENT', 'Cannot set headers after they are sent to the client', 'removeHeader');
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
