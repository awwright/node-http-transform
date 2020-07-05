"use strict";

const assert = require('assert');

const lib = require('..');

describe('interface', function(){
	it('ServerResponseTransform', function(){
		assert(lib.ServerResponseTransform);
	});
	it('ServerResponsePassThrough', function(){
		assert(lib.ServerResponsePassThrough);
	});
	it('PassThrough', function(){
		assert(lib.PassThrough);
	});
	it.skip('RequestPassThrough', function(){
		assert(typeof lib.RequestPassThrough === 'function');
	});
	it('ResponsePassThrough', function(){
		assert(typeof lib.ResponsePassThrough === 'function');
	});
	it('Headers', function(){
		assert(lib.Headers);
	});
	it('ResponsePair', function(){
		assert(typeof lib.ResponsePair === 'function');
	});
	it('RequestPair', function(){
		assert(typeof lib.RequestPair === 'function');
	});
});
