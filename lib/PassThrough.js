"use strict";

const IncomingMessage = require('http').IncomingMessage;
const Writable = require('stream').Writable;
const Readable = require('stream').Readable;
const Duplex = require('stream').Duplex;
const inherits = require('util').inherits;

const Headers = require('./Headers').Headers;

// Pipe through an HTTP request - can serve to merge two streams together, e.g. to set Content-Type
module.exports.ResponsePassThrough = ResponsePassThrough;
inherits(ResponsePassThrough, Duplex);
function ResponsePassThrough(opt, req){
	if(!(this instanceof ResponsePassThrough)) return new ResponsePassThrough(opt, req);
	// this.serverWritableSide = new ResponsePassThrough(this);
	// this.clientReadableSide = new ResponsePassThrough(this);
	Duplex.call(this);
	Headers.call(this);
	// IncomingMessage.call(this, null);
	this._headerPipes = [];
	this.headersReady = new Promise( (resolve)=>{ this._readyCallback = resolve; } );
}

// Header support

ResponsePassThrough.prototype.writeHead = Headers.prototype.writeHead;
ResponsePassThrough.prototype.setHeader = Headers.prototype.setHeader;
ResponsePassThrough.prototype.addHeader = Headers.prototype.addHeader;
ResponsePassThrough.prototype.hasHeader = Headers.prototype.hasHeader;
ResponsePassThrough.prototype.getHeader = Headers.prototype.getHeader;
ResponsePassThrough.prototype.removeHeader = Headers.prototype.removeHeader;
ResponsePassThrough.prototype.getHeaders = Headers.prototype.getHeaders;
ResponsePassThrough.prototype.getHeaderNames = Headers.prototype.getHeaderNames;
ResponsePassThrough.prototype.pipeHeaders = Headers.prototype.pipeHeaders;

// Writable components

ResponsePassThrough.prototype._write = function _write(chunk, enc, callback){
	if(this._readyCallback) this.flushHeaders();
	if(this._writeCallback) throw new Error;
	if(typeof callback==='function') this._writeCallback = callback;
	this.push(chunk);
};
ResponsePassThrough.prototype._final = function _final(callback){
	if(this._readyCallback) this.flushHeaders();
	this.on('end', callback);
	this.push(null);
};
ResponsePassThrough.prototype.abort = function abort() {
	if (this.aborted) return;
	this.aborted = true;
	process.nextTick(this.emit.bind(this, 'abort'));
	this.destroy();
};
ResponsePassThrough.prototype.flushHeaders = function flushHeaders(){
	const self = this;
	if(this._readyCallback===null){
		throw new Error('Already wrote headers');
	}
	if (self._headerSent) {
		throw new Error('Headers already written');
	}
	this._headerSent = true;
	// Copy header state to readable side
	this._headerList = this._headerList;
	if(this.path) this.url = this.path;
	this.headers = {};
	this.rawHeaders = self._header = [];
	var headers = this.getHeaders();
	for(var k in headers){
		this.headers[k] = self.getHeader(k);
		if(Array.isArray(this.headers[k])){
			for(var i=0; i<this.headers[k].length; i++){
				this.rawHeaders.push(k);
				this.rawHeaders.push(this.headers[k][i]);
			}
		}else{
			this.rawHeaders.push(k);
			this.rawHeaders.push(this.headers[k]);
		}
	}
	// Copy the headers to their final destination
	this._headerPipes.forEach(function(dst){
		self.pipeHeaders(dst);
	});
	this._readyCallback(this);
	this._readyCallback = null;
	this.emit('headers');
};

// Readable components

ResponsePassThrough.prototype._read = function _read(){
	// I have no clue why this is necessary but APPARENTLY IT IS
	// It's copied from lib/_http_incoming.js
	if (!this._consuming) {
		this._readableState.readingMore = false;
		this._consuming = true;
	}
	if(!this._writeCallback) return;
	const callback = this._writeCallback;
	this._writeCallback = null;
	callback();
};

ResponsePassThrough.prototype.pipe = function pipe(dst, opt){
	const index = this._headerPipes.indexOf(dst);
	if(index < 0) this._headerPipes.push(dst);
	// Send headers if flushHeaders has already been called
	if(this._header && dst.setHeader) this.pipeHeaders(dst);
	IncomingMessage.prototype.pipe.call(this, dst, opt);
	return dst;
};

ResponsePassThrough.prototype.unpipe = function unpipe(dst){
	const index = this._headerPipes.indexOf(dst);
	if (index >= 0) this._headerPipes.splice(index, 1);
	return IncomingMessage.prototype.unpipe.call(this, dst);
};

// Pipe only the message body, if any
ResponsePassThrough.prototype.pipeBody = function pipeBody(dst, opt){
	return Duplex.prototype.pipe.call(this, dst, opt);
};

Object.defineProperty(ResponsePassThrough.prototype, 'headersSent', {get: function (){ return this._headerSent; }});

Object.defineProperty(ResponsePassThrough.prototype, 'serverWritableSide', {get: function makeWritableSide(){
	const self = this;
	return Object.create(Writable, {
		on: {value: this.on.bind(this)},
		once: {value: this.once.bind(this)},
		write: {value: this.write.bind(this)},
		cork: {value: this.cork.bind(this)},
		uncork: {value: this.uncork.bind(this)},
		end: {value: this.end.bind(this)},
		abort: {value: this.abort.bind(this)},
		destroy: {value: this.destroy.bind(this)},
		writeHead: {value: this.writeHead.bind(this)},
		setHeader: {value: this.setHeader.bind(this)},
		addHeader: {value: this.addHeader.bind(this)},
		hasHeader: {value: this.hasHeader.bind(this)},
		getHeader: {value: this.getHeader.bind(this)},
		removeHeader: {value: this.removeHeader.bind(this)},
		getHeaders: {value: this.getHeaders.bind(this)},
		getHeaderNames: {value: this.getHeaderNames.bind(this)},
		flushHeaders: {value: this.flushHeaders.bind(this)},
		pipeHeaders: {value: this.pipeHeaders.bind(this)},
		statusCode: {get: function(){ return self.statusCode; }, set: function(v){ self.statusCode = v; }},
		statusMessage: {get: function(){ return self.statusMessage; }, set: function(v){ self.statusMessage = v; }},
		headersSent: {get: function(){ return self._headerSent; }},
		// functions to unset
		_read: {value: null},
		_push: {value: null},
		_flush: {value: null},
	});
}});

Object.defineProperty(ResponsePassThrough.prototype, 'clientReadableSide', {get: function makeReadableSide(){
	const self = this;
	return Object.create(Readable, {
		on: {value: this.on.bind(this)},
		once: {value: this.once.bind(this)},
		setEncoding: {value: this.setEncoding.bind(this)},
		read: {value: this.read.bind(this)},
		pipe: {value: this.pipe.bind(this)},
		unpipe: {value: this.unpipe.bind(this)},
		resume: {value: this.resume.bind(this)},
		hasHeader: {value: this.hasHeader.bind(this)},
		getHeader: {value: this.getHeader.bind(this)},
		getHeaders: {value: this.getHeaders.bind(this)},
		getHeaderNames: {value: this.getHeaderNames.bind(this)},
		pipeHeaders: {value: this.pipeHeaders.bind(this)},
		headersReady: {get: function(){ return self.headersReady; }},
		statusCode: {get: function(){ return self.statusCode; }},
		statusMessage: {get: function(){ return self.statusMessage; }},
		headers: {get: function(){ return self.headers; }},
		rawHeaders: {get: function(){ return self.rawHeaders; }},
		headersSent: {get: function(){ return self._headerSent; }},
		// functions to unset
		_read: {value: null},
		_push: {value: null},
		_flush: {value: null},
	});
}});
