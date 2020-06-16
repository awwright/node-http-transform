

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
		var pair, clientWritableSide, serverReadableSide;
		beforeEach(function(){
			pair = lib.makeRequestPair();
			clientWritableSide = pair.clientWritableSide;
			serverReadableSide = pair.serverReadableSide;
		});
		// it('clientWritableSide instanceof OutgoingMessage', function(){
		// 	assert(clientWritableSide instanceof http.OutgoingMessage);
		// });
		it('setHeader(name, value)', function(){
			clientWritableSide.setHeader('Accept', 'GET, HEAD, POST');
			clientWritableSide.end();
			return serverReadableSide.ready.then(function(){
				assert.strictEqual(serverReadableSide.headers['accept'], 'GET, HEAD, POST');
			});
		});
		it('getHeader(name)', function(){
			clientWritableSide.setHeader('Accept', 'GET, HEAD, POST');
			assert.strictEqual(clientWritableSide.getHeader('ACCEPT'), 'GET, HEAD, POST');
		});
		it('getHeaderNames()', function(){
			clientWritableSide.setHeader('Accept', 'GET, HEAD, POST');
			clientWritableSide.setHeader('Content-Type', 'application/xhtml+xml');
			assert.deepStrictEqual(clientWritableSide.getHeaderNames(), ['accept', 'content-type']);
		});
		it('getHeaders()', function(){
			clientWritableSide.setHeader('Accept', 'GET, HEAD, POST');
			clientWritableSide.setHeader('Content-Type', 'application/xhtml+xml');
			const headers = clientWritableSide.getHeaders();
			// FIXME is this expecting [Object: null prototype] ?
			assert.deepStrictEqual(headers['accept'], 'GET, HEAD, POST');
			assert.deepStrictEqual(headers['content-type'], 'application/xhtml+xml');
		});
		it('hasHeader()', function(){
			clientWritableSide.setHeader('Accept', 'GET, HEAD, POST');
			assert.strictEqual(clientWritableSide.hasHeader('ACCEPT'), true);
			assert.strictEqual(clientWritableSide.hasHeader('Foo'), false);
		});
		it('removeHeader()', function(){
			clientWritableSide.setHeader('Accept', 'GET, HEAD, POST');
			clientWritableSide.removeHeader('Accept');
			assert.strictEqual(clientWritableSide.getHeader('Accept'), undefined);
			assert.strictEqual(clientWritableSide.getHeader('ACCEPT'), undefined);
			assert.strictEqual(clientWritableSide.hasHeader('Accept'), false);
		});
		it('flushHeaders()', function(){
			clientWritableSide.setHeader('Accept', 'GET, HEAD, POST');
			clientWritableSide.flushHeaders();
			return serverReadableSide.ready.then(function(){
				assert.strictEqual(serverReadableSide.headers['accept'], 'GET, HEAD, POST');
			});
		});
		it('write()', function(done){
			clientWritableSide.write('Content\r\n');
			serverReadableSide.setEncoding('UTF-8');
			serverReadableSide.on('readable', function(){
				assert.strictEqual(this.read(), 'Content\r\n');
				done();
			});
		});
		it('end()', function(done){
			clientWritableSide.end('Content\r\n');
			serverReadableSide.setEncoding('UTF-8');
			var data = '';
			serverReadableSide.on('readable', function(){
				for(var s; null !== (s=this.read());) data += s;
			});
			serverReadableSide.on('end', function(){
				assert.strictEqual(data, 'Content\r\n');
				done();
			});
		});
		it('addTrailers()');
		it('pipe()', function(done){
			clientWritableSide.method = 'POST';
			clientWritableSide.setHeader('Accept', 'GET, HEAD, POST');
			clientWritableSide.end('Content\r\n');

			const pipe = lib.makeRequestPair();
			serverReadableSide.pipe(pipe.clientWritableSide);

			var data = '';
			pipe.serverReadableSide.setEncoding('UTF-8');
			pipe.serverReadableSide.on('headers', function(){
				assert.strictEqual(pipe.serverReadableSide, this);
				assert.strictEqual(this.method, 'POST');
				assert.strictEqual(this.headers['accept'], 'GET, HEAD, POST');
			});
			pipe.serverReadableSide.on('readable', function(){
				assert.strictEqual(pipe.serverReadableSide, this);
				for(var s; null !== (s=this.read());) data += s;
			});
			pipe.serverReadableSide.on('end', function(){
				assert.strictEqual(pipe.serverReadableSide, this);
				assert.strictEqual(this.method, 'POST');
				assert.strictEqual(this.headers['accept'], 'GET, HEAD, POST');
				assert.strictEqual(data, 'Content\r\n');
				done();
			});
		});
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
