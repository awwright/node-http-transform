"use strict";

var assert = require('assert');
var http = require('http');

var { RequestPair } = require('..');

describe('RequestPair', function(){
	describe('clientWritableSide', function(){
		describe('WritableSide', function(){
			var clientWritableSide, serverReadableSide;
			beforeEach(function(){
				const pair = new RequestPair();
				clientWritableSide = pair.clientWritableSide;
				serverReadableSide = pair.serverReadableSide;
			});
			it('addHeader()', function (){
				clientWritableSide.addHeader('Link', '<http://example.com/>;rel=up');
				clientWritableSide.addHeader('Link', '<http://example.com/page/2>;rel=next');
				clientWritableSide.addHeader('Link', '<http://example.com/page/0>;rel=prev');
				clientWritableSide.flushHeaders();
				return serverReadableSide.headersReady.then(function(){
					assert.strictEqual(serverReadableSide.headers['link'][0], '<http://example.com/>;rel=up');
					assert.strictEqual(serverReadableSide.headers['link'][1], '<http://example.com/page/2>;rel=next');
					assert.strictEqual(serverReadableSide.headers['link'][2], '<http://example.com/page/0>;rel=prev');
					assert.strictEqual(serverReadableSide.headers['link'].length, 3);
				});
			});
		});
		describe('implements ClientRequest', function(){
			it('abort()');
			it('setTimeout()');
			it('clearTimeout()');
			it('setNoDelay()');
		});
		describe('implements OutgoingMessage', function(){
			var clientWritableSide, serverReadableSide;
			beforeEach(function(){
				const pair = new RequestPair();
				clientWritableSide = pair.clientWritableSide;
				serverReadableSide = pair.serverReadableSide;
			});
			it.skip('clientWritableSide instanceof OutgoingMessage', function(){
				assert(clientWritableSide instanceof http.OutgoingMessage);
			});
			it('setHeader(name, value)', function(){
				clientWritableSide.setHeader('Accept', 'GET, HEAD, POST');
				clientWritableSide.end();
				return serverReadableSide.headersReady.then(function(){
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
				return serverReadableSide.headersReady.then(function(){
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

				const pipe = new RequestPair();
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
	});
	describe('serverReadableSide', function(){
		describe('ReadableSide', function(){
			var clientWritableSide, serverReadableSide;
			beforeEach(function(){
				const pair = new RequestPair({}, {
					path: '/foo',
					method: 'POST',
					headers: {Accept: 'text/plain, application/json'},
				});
				serverReadableSide = pair.serverReadableSide;
				clientWritableSide = pair.clientWritableSide;
				clientWritableSide.end('Content\r\n');
			});
			it('pipeHeaders()', function(done){
				const through = new RequestPair();
				serverReadableSide.pipeMessage(through.clientWritableSide);
				through.serverReadableSide.setEncoding('UTF-8');
				through.serverReadableSide.on('headers', function(){
					assert(through.serverReadableSide === this);
					assert.strictEqual(this.url, '/foo');
					assert.strictEqual(this.method, 'POST');
					assert.strictEqual(this.headers['accept'], 'text/plain, application/json');
					done();
				});
			});
			it('pipeMessage()', function(done){
				const through = new RequestPair();
				serverReadableSide.pipeMessage(through.clientWritableSide);

				var data = '';
				through.serverReadableSide.setEncoding('UTF-8');
				through.serverReadableSide.on('headers', function(){
					assert.strictEqual(through.serverReadableSide, this);
					assert.strictEqual(this.url, '/foo');
					assert.strictEqual(this.method, 'POST');
					assert.strictEqual(this.headers['accept'], 'text/plain, application/json');
				});
				through.serverReadableSide.on('readable', function(){
					assert.strictEqual(through.serverReadableSide, this);
					for(var s; null !== (s=this.read());) data += s;
				});
				through.serverReadableSide.on('end', function(){
					assert.strictEqual(through.serverReadableSide, this);
					assert.strictEqual(this.url, '/foo');
					assert.strictEqual(this.method, 'POST');
					assert.strictEqual(this.headers['accept'], 'text/plain, application/json');
					assert.strictEqual(data, 'Content\r\n');
					done();
				});
			});
		});
		describe('instanceof IncomingMessage', function(){
			var clientWritableSide, serverReadableSide;
			beforeEach(function(){
				const pair = new RequestPair({}, {
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
				return serverReadableSide.headersReady.then(function(){
					assert.strictEqual(serverReadableSide.statusCode, null);
				});
			});
			it('statusMessage', function(){
				return serverReadableSide.headersReady.then(function(){
					assert.strictEqual(serverReadableSide.statusMessage, null);
				});
			});
			it('url', function(){
				return serverReadableSide.headersReady.then(function(){
					assert.strictEqual(serverReadableSide.url, '/foo');
				});
			});
			it('httpVersion');
			it('headers', function(){
				return serverReadableSide.headersReady.then(function(){
					// FIXME maybe test it is [Object: null prototype]
					assert.strictEqual(serverReadableSide.headers['accept'], 'text/plain, application/json');
				});
			});
			it('complete');
			it('aborted');
			it('setTimeout(msecs, callback)');
			it('destroy(error)');
		});
		describe('implements Readable', function(){
			it('destroy()');
			it('pipe()');
			it('pause()');
			it('resume()');
		});
	});
});
