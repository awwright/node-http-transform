

var assert = require('assert');
var stream = require('stream');

var lib = require('..');

describe('makeRequestPair', function(){
	describe('streams', function(){
		var pair, clientWritableSide, serverReadableSide;
		beforeEach(function(){
			pair = lib.makeRequestPair();
			clientWritableSide = pair.clientWritableSide;
			serverReadableSide = pair.serverReadableSide;
		});
		it('method is read by server', function(){
			clientWritableSide.method = 'GET';
			assert.strictEqual(serverReadableSide.method, 'GET');
		});
		it('setHeader is read by server', function(){
			debugger;
			clientWritableSide.setHeader('Content-Type', 'text/plain; charset=UTF-8');
			assert.strictEqual(serverReadableSide.hasHeader('Content-Type'), true);
			assert.strictEqual(serverReadableSide.getHeader('Content-Type'), 'text/plain; charset=UTF-8');
		});
		it('removeHeader is read by server', function(){
			assert.strictEqual(clientWritableSide.hasHeader('Date'), true);
			clientWritableSide.removeHeader('Date');
			assert.strictEqual(serverReadableSide.hasHeader('Date'), true);
		});
		it('writes on server are read by server', function(){
			clientWritableSide.end('x');
			assert.strictEqual(serverReadableSide.read(1).toString(), 'x');
		});
		it('addTrailers on server are read by server', function(){
			clientWritableSide.addTrailers({'Foo': 'Bar'});
			clientWritableSide.end();
			assert.strictEqual(serverReadableSide.trailers, 'x');
		});
		it('close on server is read by server', function(done){
			clientWritableSide.write('x');
			clientWritableSide.end();
			serverReadableSide.resume();
			serverReadableSide.on('end', done);
		});
	});
	describe('clientWritableSide instanceof ClientRequest', function(){
		it('abort()');
		it('setTimeout()');
		it('clearTimeout()');
		it('setNoDelay()');
	});
	describe('clientWritableSide instanceof OutgoingMessage', function(){
		it('setHeader(name, value)');
		it('getHeader(name)');
		it('getHeaderNames()');
		it('getHeaders()');
		it('hasHeader()');
		it('removeHeader()');
		it('write()');
		it('addTrailers()');
		it('end()');
		it('flushHeaders()');
		it('pipe()');
	});
	describe('serverReadableSide instanceof IncomingMessage', function(){
		it('rawTrailers');
		it('trailers');
		it('statusCode');
		it('statusMessage');
		it('url');
		it('httpVersion');
		it('headers');
		it('complete');
		it('aborted');
		it('setTimeout(msecs, callback)');
		it('destroy(error)');
	});
});
