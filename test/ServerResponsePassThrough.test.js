
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
			iin.addHeader('link', '<http://example.com/c>');
			assert.equal(iin.getHeader('Link').length, 3);
			iin.end();
			assert.equal(iout.getHeader('Link').length, 3);
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
		it('getHeaderNames (empty)', function(){
			iin.end();
			assert.equal(iin.getHeaderNames().length, 0);
			assert.equal(iout.getHeaderNames().length, 0);
		});
		it('getHeaderNames', function(){
			iin.setHeader('Content-Type', 'text/plain');
			iin.end();
			assert.equal(iin.getHeaderNames().length, 1);
			assert.equal(iout.getHeaderNames().length, 1);
			// Node.js seems to normalize the names of the headers to lowercase for this function
			assert.equal(iin.getHeaderNames()[0], 'content-type');
			assert.equal(iout.getHeaderNames()[0], 'content-type');
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
