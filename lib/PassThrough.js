"use strict";

const IncomingMessage = require('http').IncomingMessage;
const Duplex = require('stream').Duplex;
const inherits = require('util').inherits;

const Headers = require('./Headers').Headers;
const makeSide = require('./makeSide.js');

// Pipe through an HTTP request - can serve to merge two streams together, e.g. to set Content-Type
module.exports.ResponsePassThrough = ResponsePassThrough;
inherits(ResponsePassThrough, Duplex);
function ResponsePassThrough(opt, req){
	if(!(this instanceof ResponsePassThrough)) return new ResponsePassThrough(opt, req);
	Duplex.call(this);
	Headers.call(this);
	// IncomingMessage.call(this, null);
	this._readableSide = this; // Used by Headers#flushHeaders
	this._headerPipes = [];
	this.headersReady = new Promise( (resolve)=>{ this._readyCallback = resolve; } );
}

// Header support

ResponsePassThrough.prototype.writeHead = Headers.prototype.writeHead;
ResponsePassThrough.prototype.flushHeaders = Headers.prototype.flushHeaders;
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
Object.defineProperty(ResponsePassThrough.prototype, 'serverWritableSide', {get: makeSide.makeWritableSide});
Object.defineProperty(ResponsePassThrough.prototype, 'clientReadableSide', {get: makeSide.makeReadableSide});
