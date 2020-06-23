"use strict";

const IncomingMessage = require('http').IncomingMessage;
const Writable = require('stream').Writable;
const Readable = require('stream').Readable;
const Duplex = require('stream').Duplex;
const inherits = require('util').inherits;

const ResponseTransform = require('./ResponseTransform.js').ResponseTransform;
const Headers = require('./Headers').Headers;

// Pipe through an HTTP request - can serve to merge two streams together, e.g. to set Content-Type
module.exports.ResponsePassThrough = ResponsePassThrough;
inherits(ResponsePassThrough, Duplex);
function ResponsePassThrough(){
	if (!(this instanceof ResponsePassThrough)){
		return new ResponsePassThrough();
	}
	ResponseTransform.apply(this, arguments);
}

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
	this.ready = new Promise( (resolve)=>{ this._readyCallback = resolve; } );
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
	this._headerPipes.forEach(function(dst){
		self.pipeHeaders(dst);
	});
	this._readyCallback();
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

Object.defineProperty(ResponsePassThrough.prototype, 'writableServerSide', function makeWritableSide(){
	return Object.assign(Object.create(Writable), {
		on: this.on.bind(this),
		once: this.once.bind(this),
		write: this.write.bind(this),
		end: this.end.bind(this),
		_read: null,
		_push: null,
		_flush: null,
	});
});

Object.defineProperty(ResponsePassThrough.prototype, 'readableClientSide', function makeReadableSide(){
	return Object.assign(Object.create(Readable), {
		on: this.on.bind(this),
		once: this.once.bind(this),
		read: this.read.bind(this),
		pipe: this.pipe.bind(this),
		unpipe: this.unpipe.bind(this),
		writeHead: this.writeHead.bind(this),
		setHeader: this.setHeader.bind(this),
		addHeader: this.addHeader.bind(this),
		hasHeader: this.hasHeader.bind(this),
		getHeader: this.getHeader.bind(this),
		removeHeader: this.removeHeader.bind(this),
		getHeaders: this.getHeaders.bind(this),
		getHeaderNames: this.getHeaderNames.bind(this),
		pipeHeaders: this.pipeHeaders.bind(this),
		_read: null,
		_push: null,
		_flush: null,
	});
});
