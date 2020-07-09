"use strict";

const assert = require('assert');
const { ResponseWritable } = require('..');

describe('ResponseWritable', function(){
	it('methods', function() {
		var t = new ResponseWritable();
		assert(t.write);
		assert(t.end);
	});
});
