"use strict";

const assert = require('assert');

function HeaderError(code, message){
	var err = new Error(message);
	err.code = code;
	return err;
}

module.exports.Headers = Headers;

function Headers(from){
	// Where the final headers (headers object and rawHeaders array) should be written to
	this._readableSide = this;
	// Flag if the headers (sent or received) are final, and so cannot be modified
	this._headerSent = false;
	this.statusCode = null;
	this.statusMessage = '';
	this._headersMap = {};
	this._headersList = [];
	this.headers = null;
	this.rawHeaders = null;
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
		for(var i=0; i<from.rawHeaders.length; i+=2){
			this.addHeader(from.rawHeaders[i], from.rawHeaders[i+1]);
		}
	}else if(from && typeof from.headers === 'object'){
		if(Array.isArray(from.headers)){
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
	const headers = this.getHeaders();
	for(var key in headers){
		const name = this._headersList[this._headersMap[key][0]][0];
		dst.setHeader(name, headers[key]);
	}
	return dst;
};

Headers.prototype.getHeader = function getHeader(name) {
	if(!this._headersMap || !this._headersList){
		throw new Error('Headers not yet received');
	}
	var entry = this._headersMap[name.toLowerCase()];
	if(!entry) return;
	const list = entry.map((i) => this._headersList[i][1]);
	return list.length===1 ? list[0] : list;
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

// flushHeaders makes `headers` and `rawHeaders` available on the readable side, and locks the headers for writing
Headers.prototype.flushHeaders = function flushHeaders(){
	// for PassThrough, this._readableSide will just be `this`
	const readableSide = this._readableSide;
	if (this._headerSent || this._readableSide._headerSent) {
		throw HeaderError('ERR_HTTP_HEADERS_SENT', 'Cannot set headers after they are sent to the client', 'flushHeaders');
	}
	this._headerSent = readableSide._headerSent = true;
	// Copy header state to readable side
	readableSide._headersMap = this._headersMap;
	readableSide._headersList = this._headersList;
	if(this.statusCode && readableSide.statusCode !== this.statusCode) readableSide.statusCode = this.statusCode;
	if(this.statusMessage && readableSide.statusMessage !== this.statusMessage) readableSide.statusMessage = this.statusMessage;
	if(this.target && readableSide.target !== this.target) readableSide.target = this.target;
	if(this.method && readableSide.method !== this.method) readableSide.method = this.method;
	readableSide.headers = {};
	for(const key in this._headersMap){
		assert(this._headersMap[key]);
		readableSide.headers[key] = this._headersMap[key].map((i)=>this._headersList[i][1]);
		if(readableSide.headers[key].length===1) readableSide.headers[key] = readableSide.headers[key][0];
	}
	readableSide.rawHeaders = this._headersList.flat();
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

// Returns true if headers are locked for writing
Headers.prototype.get_headersSent = function get_headersSent(){
	return this._headerSent;
}
 
Headers.prototype.setHeader = function setHeader(name, value){
	if (this._headerSent) {
		throw HeaderError('ERR_HTTP_HEADERS_SENT', 'Cannot set headers after they are sent to the client', 'setHeader');
	}
	Headers.validateName(name);
	if(typeof value!=='string' && typeof value!=='number' && !Array.isArray(value)) throw new Error('Expected string or array `value`');
	this.removeHeader(name);
	if(Array.isArray(value)){
		for(var i=0; i<value.length; i++){
			this.addHeader(name, value[i]);
		}
	}else{
		this.addHeader(name, value);
	}
};

Headers.prototype.addHeader = function addHeader(name, value){
	if (this._headerSent) {
		throw HeaderError('ERR_HTTP_HEADERS_SENT', 'Cannot set headers after they are sent to the client', 'addHeader');
	}
	Headers.validateName(name);
	if(typeof value!=='string' && typeof value!=='number') throw new Error('Expected string `value`');
	const key = name.toLowerCase();
	const newi = this._headersList.length;
	this._headersList[newi] = [name, value];
	const oldi = this._headersMap[key];
	if(oldi){
		oldi.push(newi);
	}else{
		this._headersMap[key] = [newi];
	}
};

Headers.prototype.removeHeader = function removeHeader(name){
	if (this._headerSent) {
		throw HeaderError('ERR_HTTP_HEADERS_SENT', 'Cannot set headers after they are sent to the client', 'removeHeader');
	}
	Headers.validateName(name);
	const key = name.toLowerCase();
	const oldi = this._headersMap[key];
	if(!oldi) return;
	for(var i=0; i<this._headersMap[key].length; i++){
		this._headersList.splice(this._headersMap[key][i] - i, 1);
	}
	delete this._headersMap[key];
};

Headers.prototype.getHeaderNames = function getHeaderNames() {
	if(!this._headersMap){
		throw new Error('Headers not yet received');
	}
	return this._headersMap !== null ? Object.keys(this._headersMap) : [];
};

Headers.prototype.getHeaders = function getHeaders() {
	if(!this._headersMap){
		throw new Error('Headers not yet received');
	}
	const headers = this._headersMap;
	const ret = Object.create(null);
	if (headers) {
		const keys = Object.keys(headers);
		for (var i = 0; i<keys.length; ++i) {
			ret[ keys[i] ] = this.getHeader(keys[i]);
		}
	}
	return ret;
};

Headers.prototype.hasHeader = function hasHeader(name) {
	if(!this._headersMap){
		throw new Error('Headers not yet received');
	}
	return !!this._headersMap[name.toLowerCase()];
};

Headers.prototype.toString = function toString(name) {
	return this._headersList.map(function(pair){
		return `${pair[0]}: ${pair[1]}\r\n`;
	}).join('');
};
