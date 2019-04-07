
const assert = require('assert');
const ServerResponseTransform = require('..').ServerResponseTransform;
const ServerResponseBuffer = require('./Buffer.js').ServerResponseBuffer;
const ServerResponsePassThrough = require('..').ServerResponsePassThrough;

describe('ServerResponsePassThrough', function(){
	describe('interface', function(){
		var iin, iout;
		beforeEach(function(){
			iin = new ServerResponsePassThrough;
			iout = new ServerResponsePassThrough;
			iin.pipe(iout);
		});
		it('hasHeader', function(){
			iin.setHeader('Content-Type', 'text/plain');
			assert(iin.hasHeader('Content-Type'));
			iin.end();
			assert(iout.hasHeader('Content-Type'));
		});
		it('getHeader', function(){
			iin.setHeader('Content-Type', 'text/plain');
			assert.equal(iin.getHeader('Content-Type'), 'text/plain');
			iin.end();
			assert.equal(iout.getHeader('Content-Type'), 'text/plain');
		});
		it('removeHeader', function(){
			iin.setHeader('Content-Type', 'text/plain');
			assert(iin.hasHeader('Content-Type'));
			iin.end();
			assert(iout.hasHeader('Content-Type'));
			iout.removeHeader('Content-Type');
			assert(!iout.hasHeader('Content-Type'));
		});
		it('getHeaders', function(){
			iin.setHeader('Content-Type', 'text/plain');
			iin.end();
			assert.equal(Object.keys(iin.getHeaders()).length, 1);
			assert.equal(Object.keys(iout.getHeaders()).length, 1);
		});
	});
});
