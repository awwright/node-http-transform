

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
		it.skip('removeHeader is read by server', function(done){
			// assert.strictEqual(clientWritableSide.hasHeader('Date'), true);
			clientWritableSide.removeHeader('Date');
			assert.strictEqual(serverReadableSide.hasHeader('Date'), true);
		});
		it('writes on server are read by server', function(){
			clientWritableSide.end('x');
			assert.strictEqual(serverReadableSide.read(1).toString(), 'x');
		});
		it.skip('addTrailers on server are read by server', function(){
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
		var pair, clientWritableSide, serverReadableSide;
		beforeEach(function(){
			pair = lib.makeRequestPair({}, {
				path: '/foo',
				method: 'POST',
				headers: {Accept: 'text/plain, application/json'},
			});
			serverReadableSide = pair.serverReadableSide;
			clientWritableSide = pair.clientWritableSide;
			// clientWritableSide.writeHead(400, 'Message', {Accept: 'text/plain, application/json'});
			// clientWritableSide.flushHeaders();
			clientWritableSide.end('Content\r\n');
		});
		// it('serverReadableSide instanceof IncomingMessage', function(){
		// 	assert(serverReadableSide instanceof http.IncomingMessage);
		// });
		it('rawTrailers');
		it('trailers');
		it('statusCode', function(){
			return serverReadableSide.ready.then(function(){
				assert.strictEqual(serverReadableSide.statusCode, null);
			});
		});
		it('statusMessage', function(){
			return serverReadableSide.ready.then(function(){
				assert.strictEqual(serverReadableSide.statusMessage, null);
			});
		});
		it('url', function(){
			return serverReadableSide.ready.then(function(){
				assert.strictEqual(serverReadableSide.url, '/foo');
			});
		});
		it('httpVersion');
		it('headers', function(){
			return serverReadableSide.ready.then(function(){
				// FIXME maybe test it is [Object: null prototype]
				assert.strictEqual(serverReadableSide.headers['accept'], 'text/plain, application/json');
			});
		});
		it('complete');
		it('aborted');
		it('setTimeout(msecs, callback)');
		it('destroy(error)');
	});
});
