"use strict"

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
	var writeCallback;
	const serverWritableSide = new WritableServerResponse();
	serverWritableSide._write = function _write(chunk, enc, callback){
		if(writeCallback) throw new Error;
		if(typeof callback==='function') writeCallback = callback;
		clientReadableSide.push(chunk);
	}
	serverWritableSide._final = function _final(callback){
		clientReadableSide.on('end', callback);
		clientReadableSide.push(null);
	}

	const clientReadableSide = new IncomingMessage;
	clientReadableSide._read = function _read(){
		if(!writeCallback) return;
		var callback = writeCallback;
		writeCallback = null;
		callback();
	}
	Object.defineProperty(clientReadableSide, 'statusCode', { get: function(){ return serverWritableSide.statusCode; } });
	Object.defineProperty(clientReadableSide, 'statusMessage', { get: function(){ return serverWritableSide.statusMessage; } });
	clientReadableSide.hasHeader = serverWritableSide.hasHeader.bind(serverWritableSide);
	clientReadableSide.getHeader = serverWritableSide.getHeader.bind(serverWritableSide);
	clientReadableSide.getHeaders = serverWritableSide.getHeaders.bind(serverWritableSide);
	clientReadableSide.getHeaderNames = serverWritableSide.getHeaderNames.bind(serverWritableSide);
	return { clientReadableSide, serverWritableSide };
}
module.exports.makeResponsePair = makeResponsePair;
