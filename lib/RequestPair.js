"use strict"

const IncomingMessage = require('http').IncomingMessage;
const Writable = require('stream').Writable;
const Headers = require('./Headers').Headers;
const inherits = require('util').inherits;

inherits(WritableClientRequest, Writable);
function WritableClientRequest(){
	Writable.call(this);
	Headers.call(this);
}
WritableClientRequest.prototype.setHeader = Headers.prototype.setHeader;
WritableClientRequest.prototype.addHeader = Headers.prototype.addHeader;
WritableClientRequest.prototype.hasHeader = Headers.prototype.hasHeader;
WritableClientRequest.prototype.getHeader = Headers.prototype.getHeader;
WritableClientRequest.prototype.removeHeader = Headers.prototype.removeHeader;
WritableClientRequest.prototype.getHeaders = Headers.prototype.getHeaders;
WritableClientRequest.prototype.getHeaderNames = Headers.prototype.getHeaderNames;

// Make a pair of streams for a request message:
// an IncomingMessage that's passed through to a ServerResponse
// what's written to clientWritableSide is readable from serverReadableSide
function makeRequestPair() {
	var writeCallback;
	const clientWritableSide = new WritableClientRequest;
	clientWritableSide._write = function _write(chunk, enc, callback){
		if(writeCallback) throw new Error;
		if(typeof callback==='function') writeCallback = callback;
		serverReadableSide.push(chunk);
	};
	clientWritableSide._final = function _final(callback){
		serverReadableSide.on('end', callback);
		serverReadableSide.push(null);
	};

	const serverReadableSide = new IncomingMessage;
	serverReadableSide._read = function _read(){
		if(!writeCallback) return;
		var callback = writeCallback;
		writeCallback = null;
		callback();
	}
	Object.defineProperty(serverReadableSide, 'method', { get: function(){ return clientWritableSide.method; } });
	serverReadableSide.hasHeader = clientWritableSide.hasHeader.bind(clientWritableSide);
	serverReadableSide.getHeader = clientWritableSide.getHeader.bind(clientWritableSide);
	serverReadableSide.getHeaders = clientWritableSide.getHeaders.bind(clientWritableSide);
	serverReadableSide.getHeaderNames = clientWritableSide.getHeaderNames.bind(clientWritableSide);
	return { clientWritableSide, serverReadableSide };
}
module.exports.makeRequestPair = makeRequestPair;


