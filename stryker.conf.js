/**
 * @type {import('@stryker-mutator/api/core').StrykerOptions}
 */
module.exports = {
	mutator: {
		name: 'javascript',
		plugins: ['asyncGenerators', 'bigInt', 'classProperties', 'classPrivateProperties', 'dynamicImport', 'flow', 'jsx', 'objectRestSpread'],
		excludedMutations: ['BooleanSubstitution', 'StringLiteral']
  },
	packageManager: "yarn",
	reporters: ["html", "clear-text", "progress"],
	testRunner: "mocha",
	transpilers: [],
	testFramework: "mocha",
	coverageAnalysis: "perTest",
};
