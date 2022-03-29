const { merge } = require('webpack-merge')
const common = require('./webpack.config.common')
const webpack = require('webpack')
require('dotenv').config({ path: './.env.development' })

module.exports = merge(common, {
	mode: 'development',
	devtool: 'source-map',
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
