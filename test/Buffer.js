"use strict";

const { ResponseWritable } = require('../lib/ResponseTransform.js');

class ResponseBuffer extends ResponseWritable {
	constructor() {
		super();
		const self = this;
		self.body = '';
		const input = this.makeReadableSide();
		input.once('readable', async function(){
			for await(var chunk of input) self.body += chunk.toString();
			self.emit('end');
		});
	}
}

module.exports.ResponseBuffer = ResponseBuffer;
