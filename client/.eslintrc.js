module.exports = {
	parser: '@babel/eslint-parser',
	env: {
		browser: true,
		es2021: true
	},
	extends: [
		'standard'
	],
	parserOptions: {
		ecmaVersion: 'latest',
		sourceType: 'module',
		requireConfigFile: false
	},
	rules: {
		indent: ['error', 'tab'],
		'no-tabs': 0,
		'no-mixed-spaces-and-tabs': 0,
		'no-new': 0
	}
}
