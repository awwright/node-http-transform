"use strict";

const IncomingMessage = require('http').IncomingMessage;
const Writable = require('stream').Writable;
const Headers = require('./Headers').Headers;
const inherits = require('util').inherits;

// Make a pair of streams for a request message:
// an IncomingMessage that's passed through to a ServerResponse
// what's written to clientWritableSide is readable from serverReadableSide

module.exports.makeRequestPair = makeRequestPair;
function makeRequestPair(opt, req) {
	return new RequestPair(opt, req);
}

module.exports.RequestPair = RequestPair;
function RequestPair(opt, req){
	this.clientWritableSide = new WritableSide;
	this.serverReadableSide = new ReadableSide;
	this.clientWritableSide._readableSide = this.serverReadableSide;

	if(req && req.path){
		this.clientWritableSide.path = req.path;
	}
	if(req && req.method){
		this.clientWritableSide.method = req.method;
	}else if(this.clientWritableSide.method===undefined){
		this.clientWritableSide.method = 'GET';
	}
	if(req && req.headers){
		if(Array.isArray(req.headers)){
			for(var i=0; i<req.headers.length; i++){
				this.clientWritableSide.addHeader(req.headers[i][0], req.headers[i][1]);
			}
		}else if(typeof req.headers==='object'){
			for(var n in req.headers){
				if(n.toLowerCase()==='cookie' && Array.isArray(req.headers[n])){
					this.clientWritableSide.setHeader(n, req.headers[n].join('; '));
				}else{
					this.clientWritableSide.setHeader(n, req.headers[n]);
				}
			}
		}
	}
}
module.exports.makeResponsePair = makeResponsePair;
function makeResponsePair(opt, req) {
	return new ResponsePair(opt, req);
}

module.exports.ResponsePair = ResponsePair;
function ResponsePair(opt, req){
	this.serverWritableSide = new WritableSide;
	this.clientReadableSide = new ReadableSide;
	this.serverWritableSide._readableSide = this.clientReadableSide;
}

module.exports.WritableSide = WritableSide;
inherits(WritableSide, Writable);
function WritableSide(_readableSide){
	Writable.call(this);
	Headers.call(this);
	if(_readableSide) this._readableSide = _readableSide;
}

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
WritableSide.prototype.abort = function abort() {
	if (this.aborted) return;
	this.aborted = true;
	process.nextTick(this.emit.bind(this, 'abort'));
	this.destroy();
};

module.exports.ReadableSide = ReadableSide;
inherits(ReadableSide, IncomingMessage);
function ReadableSide(){
	IncomingMessage.call(this, null);
	this._headerPipes = [];
	this.headersReady = new Promise( (resolve)=>{ this._readyCallback = resolve; } );
}

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

ReadableSide.prototype.pipe = function pipe(dst, opt){
	const index = this._headerPipes.indexOf(dst);
	if(index < 0) this._headerPipes.push(dst);
	// Send headers if flushHeaders has already been called
	if(this._headerSent && dst.setHeader) this.pipeHeaders(dst);
	IncomingMessage.prototype.pipe.call(this, dst, opt);
	return dst;
};

ReadableSide.prototype.pipeMessage = function pipeMessage(dst, opt){
	const index = this._headerPipes.indexOf(dst);
	if(index < 0) this._headerPipes.push(dst);
	// Send headers if flushHeaders has already been called
	if(this._headerSent && dst.setHeader) this.pipeHeaders(dst);
	IncomingMessage.prototype.pipe.call(this, dst, opt);
	return dst;
};

ReadableSide.prototype.unpipe = function unpipe(dst){
	const index = this._headerPipes.indexOf(dst);
	if (index >= 0) this._headerPipes.splice(index, 1);
	return IncomingMessage.prototype.unpipe.call(this, dst);
};
