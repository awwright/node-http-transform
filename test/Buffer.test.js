"use strict";

const assert = require('assert');
const { ResponseBuffer } = require('./Buffer.js');

describe('ResponseBuffer', function(){
	it('methods', function(done) {
		var t = new ResponseBuffer();
		t.end('Foo\r\n');
		t.on('end', function(){
			assert.strictEqual(t.body, 'Foo\r\n');
			done();
		});
	});
});
