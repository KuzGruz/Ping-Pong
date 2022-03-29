const { merge } = require('webpack-merge')
const common = require('./webpack.config.common')
const webpack = require('webpack')
require('dotenv').config({ path: './.env' })

module.exports = merge(common, {
	mode: 'production',
	devServer: {
		open: true,
		compress: true,
		hot: true,
		port: 4200
	},
	plugins: [
		new webpack.DefinePlugin({ 'process.env': JSON.stringify(process.env) })
	]
})
