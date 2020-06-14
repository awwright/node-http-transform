"use strict";

const IncomingMessage = require('http').IncomingMessage;
const Writable = require('stream').Writable;
const Headers = require('./Headers').Headers;
const inherits = require('util').inherits;

inherits(WritableServerResponse, Writable);
function WritableServerResponse(){
	Writable.call(this);
	Headers.call(this);
}
WritableServerResponse.prototype.setHeader = Headers.prototype.setHeader;
WritableServerResponse.prototype.addHeader = Headers.prototype.addHeader;
WritableServerResponse.prototype.hasHeader = Headers.prototype.hasHeader;
WritableServerResponse.prototype.getHeader = Headers.prototype.getHeader;
WritableServerResponse.prototype.removeHeader = Headers.prototype.removeHeader;
WritableServerResponse.prototype.getHeaders = Headers.prototype.getHeaders;
WritableServerResponse.prototype.getHeaderNames = Headers.prototype.getHeaderNames;

// Make a pair of streams for a response message:
// a ServerResponse that is read from an IncomingMessage
// what's written to serverWritableSide is readable from clientReadableSide
function makeResponsePair() {
	var writeCallback, readyCallback;
	const serverWritableSide = new WritableServerResponse();
	serverWritableSide._write = function _write(chunk, enc, callback){
		if(readyCallback) this.flushHeaders();
		if(chunk.length === 0){
			process.nextTick(callback);
		}else{
			clientReadableSide.push(chunk);
			writeCallback = callback;
		}
	};
	serverWritableSide._final = function _final(callback){
		if(readyCallback) this.flushHeaders();
		clientReadableSide.on('end', callback);
		clientReadableSide.push(null);
	};
	serverWritableSide.writeHead = function writeHead(code, message, headers){
		if (this._headerSent) {
			throw new Error('writeHead');
		}
		serverWritableSide.statusCode = code;
		if(typeof message==='string'){
			serverWritableSide.statusMessage = message;
		}else{
			headers = message;
		}
		for(var n in headers) serverWritableSide.setHeader(n, headers[n]);
		this.flushHeaders();
	};
	serverWritableSide.flushHeaders = function flushHeaders(){
		const self = this;
		// Finalize the headers, compute what the readable side will see, and flush them to the readable side.
		if (self._headerSent) {
			throw new Error('flushHeaders');
		}
		clientReadableSide.headers = {};
		clientReadableSide.rawHeaders = self._header = [];
		var headers = self.getHeaders();
		for(var k in headers){
			clientReadableSide.headers[k] = self.getHeader(k);
			if(Array.isArray(clientReadableSide.headers[k])){
				for(var i=0; i<clientReadableSide.headers[k].length; i++){
					clientReadableSide.rawHeaders.push(k);
					clientReadableSide.rawHeaders.push(clientReadableSide.headers[k][i]);
				}
			}else{
				clientReadableSide.rawHeaders.push(k);
				clientReadableSide.rawHeaders.push(clientReadableSide.headers[k]);
			}
		}
		clientReadableSide._headerPipes.forEach(function(dst){
			clientReadableSide.pipeHeaders(dst);
		});
		const callback = readyCallback;
		readyCallback = null;
		callback();
		clientReadableSide.emit('headers');
	};

	const clientReadableSide = new IncomingMessage;
	clientReadableSide._headerPipes = [];
	clientReadableSide._read = function _read(){
		// I have no clue why this is necessary but APPARENTLY IT IS
		// It's copied from lib/_http_incoming.js
		if (!this._consuming) {
			this._readableState.readingMore = false;
			this._consuming = true;
		 }
		const callback = writeCallback;
		if (callback) {
			writeCallback = null;
			callback();
		}
	};
	clientReadableSide.pipeHeaders = Headers.prototype.pipeHeaders;
	clientReadableSide.pipe = function pipe(dst, opt){
		const index = this._headerPipes.indexOf(dst);
		if(index < 0) this._headerPipes.push(dst);
		// Send headers if flushHeaders has already been called
		if(serverWritableSide._header) this.pipeHeaders(dst);
		IncomingMessage.prototype.pipe.call(this, dst, opt);
		return dst;
	};
	clientReadableSide.unpipe = function unpipe(dst){
		const index = this._headerPipes.indexOf(dst);
		if (index >= 0) this._headerPipes.splice(index, 1);
		return IncomingMessage.prototype.unpipe.call(this, dst);
	};
	Object.defineProperty(clientReadableSide, 'statusCode', { get: function(){ return serverWritableSide.statusCode; } });
	Object.defineProperty(clientReadableSide, 'statusMessage', { get: function(){ return serverWritableSide.statusMessage; } });
	Object.defineProperty(clientReadableSide, '_headerList', { get: function(){ return serverWritableSide._headerList; } });
	clientReadableSide.hasHeader = serverWritableSide.hasHeader.bind(serverWritableSide);
	clientReadableSide.getHeader = serverWritableSide.getHeader.bind(serverWritableSide);
	clientReadableSide.getHeaders = serverWritableSide.getHeaders.bind(serverWritableSide);
	clientReadableSide.getHeaderNames = serverWritableSide.getHeaderNames.bind(serverWritableSide);
	clientReadableSide.ready = new Promise(function(resolve){ readyCallback = resolve; });
	return { clientReadableSide, serverWritableSide };
}
module.exports.makeResponsePair = makeResponsePair;
