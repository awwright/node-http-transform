
var makeRequestPair = require('./RequestPair.js').makeRequestPair;
var makeResponsePair = require('./ResponsePair.js').makeResponsePair;

module.exports.makeMessagePairs = function makeMessagePairs(){
	var request = makeRequestPair();
	var response = makeResponsePair();
	return {
		client: {
			req: request.clientWritableSide,
			res: response.clientReadableSide,

		},
		server: {
			req: request.serverReadableSide,
			res: response.serverWritableSide,
		},
	};
}
