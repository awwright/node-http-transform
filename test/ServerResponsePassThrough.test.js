
const assert = require('assert');
const ServerResponsePassThrough = require('..').ServerResponsePassThrough;
const PassThrough = require('stream').PassThrough;

describe('ServerResponsePassThrough', function(){
	describe('interface', function(){
		var iin, iout;
		beforeEach(function(){
			iin = new ServerResponsePassThrough;
			iout = new ServerResponsePassThrough;
			iin.pipe(iout);
		});
		it('statusCode', function(){
			iin.statusCode = 500;
			assert.equal(iin.statusCode, 500);
			iin.end();
			assert.equal(iout.statusCode, 500);
		});
		it('addHeader', function(){
			iin.addHeader('Link', '<http://example.com/a>');
			iin.addHeader('link', '<http://example.com/b>');
			assert.equal(iin.getHeader('Link').length, 2);
			iin.end();
			assert.equal(iout.getHeader('Link').length, 2);
		});
		it('statusMessage', function(){
			iin.statusMessage = 'Server Error';
			assert.equal(iin.statusMessage, 'Server Error');
			iin.end();
			assert.equal(iout.statusMessage, 'Server Error');
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
		it('headersReady', function(){
			iin.setHeader('Content-Type', 'text/plain');
			iin.end();
			return iout.headersReady;
		});
	});
	describe('pipe (merging streams)', function(){
		it('statusCode', function(){
			var iin = new ServerResponsePassThrough;
			var stream = new PassThrough;
			var iout = new ServerResponsePassThrough;
			iin.statusCode = 404;
			iin.setHeader('Content-Type', 'text/plain');
			stream.pipe(iin);

			stream.write('File contents');
			stream.end();

			iin.pipe(iout);

			return iout.headersReady.then(function(){
				assert.equal(iout.statusCode, 404);
			});
		});
	});
});
