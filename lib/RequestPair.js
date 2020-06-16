"use strict";

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
function makeRequestPair(opt, req) {
	var writeCallback, readyCallback;
	const clientWritableSide = new WritableClientRequest;
	clientWritableSide._write = function _write(chunk, enc, callback){
		if(readyCallback) this.flushHeaders();
		if(writeCallback) throw new Error;
		if(typeof callback==='function') writeCallback = callback;
		serverReadableSide.push(chunk);
	};
	clientWritableSide._final = function _final(callback){
		if(readyCallback) this.flushHeaders();
		serverReadableSide.on('end', callback);
		serverReadableSide.push(null);
	};
	clientWritableSide.flushHeaders = function flushHeaders(){
		const self = this;
		if(readyCallback===null) throw new Error('Already wrote headers');
		if (self._headerSent) {
			throw new Error('flushHeaders');
		}
		serverReadableSide.headers = {};
		serverReadableSide.rawHeaders = self._header = [];
		var headers = this.getHeaders();
		for(var k in headers){
			serverReadableSide.headers[k] = self.getHeader(k);
			if(Array.isArray(serverReadableSide.headers[k])){
				for(var i=0; i<serverReadableSide.headers[k].length; i++){
					serverReadableSide.rawHeaders.push(k);
					serverReadableSide.rawHeaders.push(serverReadableSide.headers[k][i]);
				}
			}else{
				serverReadableSide.rawHeaders.push(k);
				serverReadableSide.rawHeaders.push(serverReadableSide.headers[k]);
			}

		}
		serverReadableSide._headerPipes.forEach(function(dst){
			serverReadableSide.pipeHeaders(dst);
		});

		readyCallback();
		readyCallback = null;
		serverReadableSide.emit('headers');
	};

	const serverReadableSide = new IncomingMessage;
	serverReadableSide._headerPipes = [];
	serverReadableSide._read = function _read(){
		if(!writeCallback) return;
		var callback = writeCallback;
		writeCallback = null;
		callback();
	};
	serverReadableSide.pipeHeaders = Headers.prototype.pipeHeaders;
	serverReadableSide.pipe = function pipe(dst, opt){
		const index = this._headerPipes.indexOf(dst);
		if(index < 0) this._headerPipes.push(dst);
		// Send headers if flushHeaders has already been called
		if(clientWritableSide._header) this.pipeHeaders(dst);
		IncomingMessage.prototype.pipe.call(this, dst, opt);
		return dst;
	};
	serverReadableSide.unpipe = function unpipe(dst){
		const index = this._headerPipes.indexOf(dst);
		if (index >= 0) this._headerPipes.splice(index, 1);
		return IncomingMessage.prototype.unpipe.call(this, dst);
	};
	Object.defineProperty(serverReadableSide, 'url', { get: function(){ return clientWritableSide.path; } });
	Object.defineProperty(serverReadableSide, 'method', { get: function(){ return clientWritableSide.method; } });
	// Object.defineProperty(serverReadableSide, 'headers', { get: function(){ return clientWritableSide.getHeaders(); } });
	Object.defineProperty(serverReadableSide, '_headerList', { get: function(){ return clientWritableSide._headerList; } });
	serverReadableSide.hasHeader = clientWritableSide.hasHeader.bind(clientWritableSide);
	serverReadableSide.getHeader = clientWritableSide.getHeader.bind(clientWritableSide);
	serverReadableSide.getHeaders = clientWritableSide.getHeaders.bind(clientWritableSide);
	serverReadableSide.getHeaderNames = clientWritableSide.getHeaderNames.bind(clientWritableSide);
	serverReadableSide.ready = new Promise(function(resolve){ readyCallback = resolve; });

	if(req && req.path){
		clientWritableSide.path = req.path;
	}
	if(req && req.method){
		clientWritableSide.method = req.method;
	}else if(clientWritableSide.method===undefined){
		clientWritableSide.method = 'GET';
	}
	if(req && req.headers){
		if(Array.isArray(req.headers)){
			for(var i=0; i<req.headers.length; i++){
				req.headers.addHeader(req.headers[i][0], req.headers[i][1]);
			}
		}else if(typeof req.headers==='object'){
			for(var n in req.headers){
				if(n.toLowerCase()==='cookie' && Array.isArray(req.headers[n])){
					clientWritableSide.setHeader(n, req.headers[n].join('; '));
				}else{
					clientWritableSide.setHeader(n, req.headers[n]);
				}
			}
		}
	}

	return { clientWritableSide, serverReadableSide };
}
module.exports.makeRequestPair = makeRequestPair;
