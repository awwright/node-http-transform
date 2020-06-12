"use strict";

var assert = require('assert');
var http = require('http');
var inherits = require('util').inherits;

var lib = require('..');

// inherits(StreamAgent, Agent);
// function StreamAgent(){

// }

function generateNodejsPair(){
	var serverHandler = new http.Server();
	serverHandler.listen(0);
	var clientWritableSide = http.request({
		method: 'POST',
		host: serverHandler.address().host,
		port: serverHandler.address().port,
	});
	var pair = {
		client: {
			req: clientWritableSide,
			res: null,
			final: new Promise(function(resolve){
				clientWritableSide.on('response', function(res){
					pair.client.res = res;
					return void resolve(pair.client);
				});
			}),
		},
		server: {
			req: null,
			res: null,
			final: new Promise(function(resolve){
				serverHandler.once('request', function(req, res){
					pair.server.req = req;
					pair.server.res = res;
					res.once('finish', function(){
						serverHandler.close();
					})
					return void resolve(pair.server);
				});
			}),
		},
	};
	return pair;
}

function generateMessagePair(){
	var pair = lib.makeMessagePairs();
	return {
		client: {
			req: pair.client.req,
			res: pair.client.res,
			final: pair.client.res.ready.then(function(){ return pair.client; }),
		},
		server: {
			req: pair.server.req,
			res: pair.server.res,
			final: pair.server.req.ready.then(function(){ return pair.server; }),
		},
	};
}

describe('makeMessagePairs', function(){
	describe('makeMessagePairs', function(){
		generateTests(generateMessagePair);
	});
	describe('It works this way in Node.js right?', function(){
		generateTests(generateNodejsPair);
	});
});

function generateTests(makeMessagePairs){
	var pair, client;
	beforeEach(function(){
		pair = makeMessagePairs();
	});
	it('method is read by server', function(){
		pair.client.req.method = 'POST';
		pair.client.req.end();
		return pair.server.final.then(function(server){
			server.res.end();
			assert.equal(server.req.method, 'POST');
			return pair.client.final;
		});
	});
	it('status read by client', function(){
		pair.client.req.end();
		pair.server.final.then(function(server){
			server.res.statusCode = 400;
			server.res.statusMessage = 'Status Message';
			server.res.end();
		});
		return pair.client.final.then(function(client){
			assert.equal(client.res.statusCode, 400);
			assert.equal(client.res.statusMessage, 'Status Message');
			client.res.resume();
		});
	});
	it('client setHeader is read by server', function(){
		pair.client.req.setHeader('Content-Type', 'text/plain; charset=UTF-8');
		pair.client.req.end();
		return pair.server.final.then(function(server){
			assert.strictEqual(server.req.headers['content-type'], 'text/plain; charset=UTF-8');
			server.res.end();
			return pair.client.final;
		});
	});
	// it('removeHeader is read by server (meta)', function(){
	// 	// Verify that headers added by Node.js by default indeed exists by default
	// 	pair.client.req.end();
	// 	return pair.server.final.then(function(server){
	// 		assert(server.req.headers['host']);
	// 		server.res.end();
	// 		return pair.client.final;
	// 	});
	// });
	// it('removeHeader is read by server (Host header)', function(){
	// 	// Verify the header added by default (this is tested in test above) can be removed
	// 	pair.client.req.removeHeader('Host');
	// 	pair.client.req.end();
	// 	return pair.server.final.then(function(server){
	// 		assert(!server.req.headers['host']);
	// 		server.res.end();
	// 		return pair.client.final;
	// 	});
	// });
	it('writes on client are read by server', function(done){
		// this doesn't actually work on Node.js unless specified during init, ugh
		// pair.client.req.method = 'POST';
		pair.client.req.write('x');
		pair.server.final.then(function(server){
			server.req.on('data', function(data){
				assert.equal(data.toString(), 'x');
				server.res.end();
				done();
			});
		});
	});
	// it('addTrailers on server are read by server', function(){
	// 	pair.clientWritableSide.addTrailers({'Foo': 'Bar'});
	// 	pair.clientWritableSide.end();
	// 	assert.strictEqual(pair.serverReadableSide.trailers, 'x');
	// });
	it('close on client is read by server', function(done){
		pair.client.req.write('x');
		pair.client.req.end();
		pair.server.final.then(function(server){
			server.res.end();
		});
		pair.client.final.then(function(client){
			client.res.resume();
			client.res.once('end', done);
		});
	});
}
