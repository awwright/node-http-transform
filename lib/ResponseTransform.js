"use strict";

const { ReadableSide, WritableSide } = require('./Pair.js');
const { SimplexPair, ResponsePassThrough } = require('./PassThrough.js');

class ResponseWritable extends WritableSide {
	#readableSide = null;
	#init = 0;
	constructor(options) {
		super();
		this.#readableSide = new this.ReadableSide(options);
		this._readableSide = this.#readableSide;
	}

	ReadableSide = ReadableSide;

	makeReadableSide() {
		if(this.#init++) throw new Error('Already initialized readableSide');
		return this.#readableSide;
	}

	// Readable implementor API
	push(...args) {
		return this.push(...args);
	}
}

class ResponseReadable extends ReadableSide {
	#writableSide = null;
	#init = 0;

	constructor(options) {
		super();
		this.#writableSide = new this.WritableSide(this);
	}

	WritableSide = WritableSide;

	makeWritableSide() {
		if(this.#init++) throw new Error('Already initialized writableSide');
		return this.#writableSide;
	}

	// Readable implementor API
	push(...args) {
		return this.push(...args);
	}
}

class ResponseTransform extends SimplexPair {
	#input = null;
	#output = null;
	#init = 0;

	constructor(options) {
		super();
		const input = new ResponsePassThrough;
		const output = new ResponsePassThrough;
		this.writableSide = input.writableSide;
		this.#input = input.readableSide;
		this.#output = output.writableSide;
		this.readableSide = output.readableSide;
		if(typeof options === 'function'){
			this.#init++;
			options.call(this, this.#input, this.#output);
		}
	}

	get clientReadableSide() {
		return this.readableSide;
	}

	get serverWritableSide() {
		return this.writableSide;
	}

	ReadableSide = ReadableSide;
	WritableSide = WritableSide;

	makeStreams() {
		if(this.#init++) throw new Error('Already initialized innerSide');
		return [ this.#input, this.#output ];
	}

	// Readable implementor API
	push(...args) {
		return this.readableSide.push(...args);
	}
}

module.exports.ResponseWritable = ResponseWritable;
module.exports.ResponseReadable = ResponseReadable;
module.exports.ResponseTransform = ResponseTransform;
