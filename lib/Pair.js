"use strict";

const IncomingMessage = require('http').IncomingMessage;
const Writable = require('stream').Writable;
const Readable = require('stream').Readable;
const Headers = require('./Headers').Headers;
const inherits = require('util').inherits;

// Make a pair of streams for a request message:
// an IncomingMessage that's passed through to a ServerResponse
// what's written to clientWritableSide is readable from serverReadableSide

module.exports.RequestPair = RequestPair;
function RequestPair(req){
	this.serverReadableSide = new ReadableSide;
	this.clientWritableSide = new WritableSide(req, this.serverReadableSide);
}

module.exports.ResponsePair = ResponsePair;
function ResponsePair(opt, req){
	this.serverWritableSide = new WritableSide;
	this.clientReadableSide = new ReadableSide;
	this.serverWritableSide._readableSide = this.clientReadableSide;
}

module.exports.WritableSide = WritableSide;
inherits(WritableSide, Writable);
function WritableSide(opts, _readableSide){
	Writable.call(this);
	Headers.call(this, opts);
	if(_readableSide) this._readableSide = _readableSide;
}

// Aliases for "target"
Object.defineProperty(WritableSide.prototype, 'path', {
	get: function() { return this.target; },
	set: function(val) { this.target = val; },
});

WritableSide.prototype.writeHead = Headers.prototype.writeHead;
WritableSide.prototype.flushHeaders = Headers.prototype.flushHeaders;
WritableSide.prototype.setHeader = Headers.prototype.setHeader;
WritableSide.prototype.addHeader = Headers.prototype.addHeader;
WritableSide.prototype.hasHeader = Headers.prototype.hasHeader;
WritableSide.prototype.getHeader = Headers.prototype.getHeader;
WritableSide.prototype.removeHeader = Headers.prototype.removeHeader;
WritableSide.prototype.getHeaders = Headers.prototype.getHeaders;
WritableSide.prototype.getHeaderNames = Headers.prototype.getHeaderNames;

WritableSide.prototype._write = function _write(chunk, enc, callback){
	if(this._readableSide._readyCallback) this.flushHeaders();
	if(this._readableSide._writeCallback) throw new Error;
	if(typeof callback==='function') this._readableSide._writeCallback = callback;
	this._readableSide.push(chunk);
};
WritableSide.prototype._final = function _final(callback){
	if(this._readableSide._readyCallback) this.flushHeaders();
	this._readableSide.on('end', callback);
	this._readableSide.push(null);
};
Object.defineProperty(WritableSide.prototype, 'destroyed', {
	get: function() {
		return this._readableSide.destroyed;
	},
	set: function(val) {
		this._readableSide.destroyed = val;
	},
});
WritableSide.prototype.destroy = function destroy(error){
	this._readableSide.destroy(error);
};

module.exports.ReadableSide = ReadableSide;
inherits(ReadableSide, IncomingMessage);
function ReadableSide(){
	IncomingMessage.call(this, null);
	this._headerPipes = [];
	this.headersReady = new Promise( (resolve)=>{ this._readyCallback = resolve; } );
}

// Aliases for "target"
Object.defineProperty(ReadableSide.prototype, 'url', {
	get: function() { return this.target; },
	set: function(val) { this.target = val; },
});

ReadableSide.prototype._read = function _read(){
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

ReadableSide.prototype.pipeHeaders = Headers.prototype.pipeHeaders;
ReadableSide.prototype.hasHeader = Headers.prototype.hasHeader;
ReadableSide.prototype.getHeader = Headers.prototype.getHeader;
ReadableSide.prototype.getHeaders = Headers.prototype.getHeaders;
ReadableSide.prototype.getHeaderNames = Headers.prototype.getHeaderNames;

ReadableSide.prototype.pipeMessage = function pipeMessage(dst, opt){
	const index = this._headerPipes.indexOf(dst);
	if(index < 0) this._headerPipes.push(dst);
	// Send headers if flushHeaders has already been called
	if(this._headerSent && dst.setHeader) this.pipeHeaders(dst);
	this.pipe(dst, opt);
	return dst;
};

ReadableSide.prototype.unpipe = function unpipe(dst){
	const index = this._headerPipes.indexOf(dst);
	if (index >= 0) this._headerPipes.splice(index, 1);
	return IncomingMessage.prototype.unpipe.call(this, dst);
};

ReadableSide.prototype.destroy = Readable.prototype.destroy;
