"use strict";

const Writable = require('stream').Writable;
const Readable = require('stream').Readable;

// Functions to split a Duplex stream into a Writable or Readable stream

module.exports.makeWritableSide = makeWritableSide;
function makeWritableSide(){
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
}

module.exports.makeReadableSide = makeReadableSide;
function makeReadableSide(){
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
}
