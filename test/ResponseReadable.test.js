"use strict";

const assert = require('assert');
const ResponseReadable = require('..').ResponseReadable;

describe('ResponseReadable', function(){
	it('methods', function() {
		var t = new ResponseReadable();
		assert(t.read);
	});
});

