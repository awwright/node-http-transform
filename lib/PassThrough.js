"use strict";

const { Stream } = require('stream');
const ObjectDefineProperty = Object.defineProperty;

const Headers = require('./Headers').Headers;
const { ReadableSide, WritableSide } = require('./Pair.js');

class ResponsePassThrough extends Stream {
	constructor(options) {
		super();
		const self = this;
		this.readableSide = new this.ReadableSide(options);
		this.writableSide = new this.WritableSide(options);
		this.readableSide.allowHalfOpen = true;
		this.readableSide._readableState.sync = false;
		ObjectDefineProperty(this.writableSide, '_readableState', {
			get: function() { return self.readableSide._readableState; },
		});
		// this.writableSide._readableState = this.readableSide._readableState;
		this.writableSide._readableSide = this.readableSide;
		Headers.call(this);
	}

	get clientReadableSide() {
		return this.readableSide;
	}

	get serverWritableSide() {
		return this.writableSide;
	}

	ReadableSide = ReadableSide;
	WritableSide = WritableSide;

	// Header support
	writeHead(...args) {
		this.writableSide.writeHead(...args);
	}
	flushHeaders(...args) {
		this.writableSide.flushHeaders(...args);
	}
	setHeader(...args) {
		this.writableSide.setHeader(...args);
	}
	addHeader(...args) {
		this.writableSide.addHeader(...args);
	}
	hasHeader(...args) {
		return this.writableSide.hasHeader(...args);
	}
	removeHeader(...args) {
		this.writableSide.removeHeader(...args);
	}
	getHeader(...args) {
		return this.writableSide.getHeader(...args);
	}
	getHeaders(...args) {
		return this.writableSide.getHeaders(...args);
	}
	getHeaderNames(...args) {
		return this.writableSide.getHeaderNames(...args);
	}
	pipeHeaders(...args) {
		return this.writableSide.pipeHeaders(...args);
	}

	// HTTP Writable methods
	abort() {
		return this.writableSide.abort();
	};
	get statusCode() {
		return this.writableSide.statusCode;
	}
	set statusCode(val) {
		this.writableSide.statusCode = val;
	}
	get statusMessage() {
		return this.writableSide.statusMessage;
	}
	set statusMessage(val) {
		this.writableSide.statusMessage = val;
	}

	// HTTP Readable methods
	pipeMessage(...args) {
		return this.readableSide.pipeMessage(...args);
	}
	get headersSent() {
		return this.readableSide._headerSent;
	}
	get headersReady() {
		return this.readableSide.headersReady;
	}
	get headers() {
		return this.readableSide.headers;
	}
	get rawHeaders() {
		return this.readableSide.rawHeaders;
	}

	// Writable Events
	// Event: 'close'
	// Event: 'drain'
	// Event: 'error'
	// Event: 'finish'
	// Event: 'pipe'
	// Event: 'unpipe'

	// Readable events
	// Event: 'close'
	// Event: 'data'
	// Event: 'end'
	// Event: 'error'
	// Event: 'pause'
	// Event: 'readable'
	// Event: 'resume'
	// [Symbol.asyncIterator]

	on(event, listener) {
		switch (event) {
			case 'close':
			case 'error':
				this.writableSide.on(event, listener);
				this.readableSide.on(event, listener);
				return;
			case 'drain':
			case 'finish':
			case 'pipe':
			case 'unpipe':
				return this.writableSide.on(event, listener);
			case 'data':
			case 'end':
			case 'pause':
			case 'readable':
			case 'resume':
				return this.readableSide.on(event, listener);
		}
	}

	off(event, listener) {
		switch (event) {
			case 'close':
			case 'error':
				this.writableSide.off(event, listener);
				this.readableSide.off(event, listener);
				return;
			case 'drain':
			case 'finish':
			case 'pipe':
			case 'unpipe':
				return this.writableSide.off(event, listener);
			case 'data':
			case 'end':
			case 'pause':
			case 'readable':
			case 'resume':
				return this.readableSide.off(event, listener);
		}
	}

	once(event, listener) {
		switch (event) {
			case 'close':
			case 'error':
				this.writableSide.once(event, listener);
				this.readableSide.once(event, listener);
				return;
			case 'drain':
			case 'finish':
			case 'pipe':
			case 'unpipe':
				return this.writableSide.once(event, listener);
			case 'data':
			case 'end':
			case 'pause':
			case 'readable':
			case 'resume':
				return this.readableSide.once(event, listener);
		}
	}

	addListener(event, listener) {
		switch (event) {
			case 'close':
			case 'error':
				this.writableSide.addListener(event, listener);
				this.readableSide.addListener(event, listener);
				return;
			case 'drain':
			case 'finish':
			case 'pipe':
			case 'unpipe':
				return this.writableSide.addListener(event, listener);
			case 'data':
			case 'end':
			case 'pause':
			case 'readable':
			case 'resume':
				return this.readableSide.addListener(event, listener);
		}
	}

	removeListener(event, listener) {
		switch (event) {
			case 'close':
			case 'error':
				this.writableSide.removeListener(event, listener);
				this.readableSide.removeListener(event, listener);
				return;
			case 'drain':
			case 'finish':
			case 'pipe':
			case 'unpipe':
				return this.writableSide.removeListener(event, listener);
			case 'data':
			case 'end':
			case 'pause':
			case 'readable':
			case 'resume':
				return this.readableSide.removeListener(event, listener);
		}
	}

	emit(event, listener) {
		switch (event) {
			case 'close':
			case 'error':
				this.writableSide.emit(event, listener);
				this.readableSide.emit(event, listener);
				return;
			case 'drain':
			case 'finish':
			case 'pipe':
			case 'unpipe':
				return this.writableSide.emit(event, listener);
			case 'data':
			case 'end':
			case 'pause':
			case 'readable':
			case 'resume':
				return this.readableSide.emit(event, listener);
		}
	}

	listenerCount(event) {
		switch (event) {
			case 'close':
			case 'error':
				// The numbers should be the same from either
				return this.writableSide.listenerCount(event);
			case 'drain':
			case 'finish':
			case 'pipe':
			case 'unpipe':
				return this.writableSide.listenerCount(event);
			case 'data':
			case 'end':
			case 'pause':
			case 'readable':
			case 'resume':
				return this.readableSide.listenerCount(event);
		}
		return 0;
	}

	// Both APIs
	// writable.destroy([error])
	// readable.destroy([error])
	destroy(...args) {
		this.readableSide.destroy(...args);
		return this;
	}
	// writable.destroyed
	// readable.destroyed
	get destroyed() {
		return this.writableSide.destroyed && this.readableSide.destroyed;
	}
	set destroyed(val) {
		this.writableSide.destroyed = val;
		this.readableSide.destroyed = val;
	}

	// Writable API
	// writable.cork()
	cork(...args) {
		return this.writableSide.cork(...args);
	}
	// writable.end([chunk[, encoding]][, callback])
	end(...args) {
		this.writableSide.end(...args);
		return this;
	}
	// writable.setDefaultEncoding(encoding)
	setDefaultEncoding(...args) {
		this.writableSide.setDefaultEncoding(...args);
		return this;
	}
	// writable.uncork()
	uncork(...args) {
		return this.writableSide.uncork(...args);
	}
	// writable.writable
	get writable() {
		return this.writableSide.writable;
	}
	// writable.writableEnded
	get writableEnded() {
		return this.writableSide.writableEnded;
	}
	// writable.writableCorked
	get writableCorked() {
		return this.writableSide.writableCorked;
	}
	// writable.writableFinished
	get writableFinished() {
		return this.writableSide.writableFinished;
	}
	// writable.writableHighWaterMark
	get writableHighWaterMark() {
		return this.writableSide.writableHighWaterMark;
	}
	// writable.writableLength
	get writableLength() {
		return this.writableSide.writableLength;
	}
	// writable.writableObjectMode
	get writableObjectMode() {
		return this.writableSide.writableObjectMode;
	}
	// writable.write(chunk[, encoding][, callback])
	write(...args) {
		return this.writableSide.write(...args);
	}

	// Readable API

	// readable.isPaused()
	isPaused(...args) {
		return this.readableSide.isPaused(...args);
	}
	// readable.pause()
	pause(...args) {
		this.readableSide.pause(...args);
		return this;
	}
	// readable.pipe(destination[, options])
	pipe(...args) {
		return this.readableSide.pipe(...args);
	}
	// readable.read([size])
	read(...args) {
		return this.readableSide.read(...args);
	}
	// readable.readable
	get readable() {
		return this.readableSide.readable;
	}
	set readable(val) {
		this.readableSide.readable = val;
	}
	// readable.readableEncoding
	get readableEncoding() {
		return this.readableSide.readableEncoding;
	}
	// readable.readableEnded
	get readableEnded() {
		return this.readableSide.readableEnded;
	}
	// readable.readableFlowing
	get readableFlowing() {
		return this.readableSide.readableFlowing;
	}
	// readable.readableHighWaterMark
	get readableHighWaterMark() {
		return this.readableSide.readableHighWaterMark;
	}
	// readable.readableLength
	get readableLength() {
		return this.readableSide.readableLength;
	}
	// readable.readableObjectMode
	get readableObjectMode() {
		return this.readableSide.readableObjectMode;
	}
	// readable.resume()
	resume(...args) {
		this.readableSide.resume(...args);
		return this;
	}
	// readable.setEncoding(encoding)
	setEncoding(...args) {
		this.readableSide.setEncoding(...args);
		return this;
	}
	// readable.unpipe([destination])
	unpipe(...args) {
		this.readableSide.unpipe(...args);
		return this;
	}
	// readable.unshift(chunk[, encoding])
	unshift(...args) {
		return this.readableSide.unshift(...args);
	}
	// readable.wrap(stream)
	wrap(...args) {
		this.readableSide.wrap(...args);
		return this;
	}

	// readable[Symbol.asyncIterator]()
	[Symbol.asyncIterator](...args) {
		return this.readableSide[Symbol.asyncIterator](...args);
	}

	// Hidden Readable API
	get allowHalfOpen() {
		return this.readableSide.allowHalfOpen;
	}
	set allowHalfOpen(val) {
		this.readableSide.allowHalfOpen = val;
	}
	get _readableState() {
		return this.readableSide._readableState;
	}
	get _writableState() {
		return this.writableSide._writableState;
	}

	// Readable implementor API
	push(...args) {
		return this.readableSide.push(...args);
	}
}

module.exports.ResponsePassThrough = ResponsePassThrough;
