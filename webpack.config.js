const path = require('path');
const webpack = require('webpack');
// 环境
var ENV = process.env.NODE_ENV || 'development';
// 压缩
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
// 模版
const HtmlWebpackPlugin = require('html-webpack-plugin');
// 合并
const ExtractTextPlugin = require('extract-text-webpack-plugin');
// 监控
const DashboardPlugin = require('webpack-dashboard/plugin');
// 拷贝
const CopyWebpackPlugin = require('copy-webpack-plugin');
// 文件路径
const ROOT_PATH = path.resolve(__dirname);
const APP_PATH = path.resolve(ROOT_PATH, 'src');
const BUILD_PATH = path.resolve(ROOT_PATH, 'dist');
const NODE_MODULES_PATH = path.resolve(ROOT_PATH, 'node_modules');

const config = {
	// devtool: ENV === 'develop' ? 'source-map' : false,
	externals: {
		jquery: 'window.jQuery',
	},
	context: ROOT_PATH,
	// 入口
	entry: {
		index: './src/index.js',
	},
	// 出口
	output: {
		filename: '[name].[chunkHash:5].js',
		// 指定非入口块文件输出的名字，动态加载的模块
		chunkFilename: '[name].bundle.js',
		path: BUILD_PATH,
		publicPath: '',
	},
	resolve: {
		// 解析模块时应该搜索的目录
		modules: [APP_PATH, 'node_modules'],
		// 自动解析确定的扩展
		extensions: ['.js', '.jsx'],
		// 优先引入的文件名
		mainFiles: ['index'],
		// 模块别名列表
		alias: {
			common: path.join(ROOT_PATH, 'src/common'),
		},
	},
	// 模块
	module: {
		rules: [
			{
				test: /\.(js|jsx)(\?.+)?$/,
				use: [
					{
						loader: 'babel-loader',
						options: {cacheDirectory: true},
					},
				],
				include: [APP_PATH],
				exclude: [NODE_MODULES_PATH],
			},
			{
				test: /\.(css|less)(\?.+)?$/,
				use: ExtractTextPlugin.extract({
					fallback: 'style-loader',
					use: ['css-loader', 'postcss-loader', 'less-loader'],
				}),
			},
			{
				test: /\.(png|jpg|jpeg|gif|eot|ttf|woff|woff2|svg|svgz)(\?.+)?$/,
				use: {
					loader: 'url-loader',
					options: {
						limit: 10000,
					},
				},
			},
		],
	},
	// server
	devServer: {
		disableHostCheck: true,
		host: '0.0.0.0',
		port: 9000,
		contentBase: [BUILD_PATH, ROOT_PATH],
		publicPath: '/',
		quiet: true,
		proxy: {
			'/api/*': {
				changeOrigin: true,
				target: 'http://www.xxxx.com',
				secure: false,
			},
		},
		overlay: {
			warnings: true,
			errors: true,
		},
	},
	// 插件
	plugins: [
		// 从js文件中分离css出来
		new ExtractTextPlugin('[name].css'),
		new HtmlWebpackPlugin({
			title: '首页',
			filename: './index.html',
			template: 'src/index.html',
			chunks: ['index'],
		}),
		// 定义全局变量,打包时替换
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': '"production"',
		}),
	],
};
if (ENV !== 'production') {
	// 监控
	config.plugins.push(new DashboardPlugin());
} else {
	// 压缩
	config.plugins.push(new UglifyJSPlugin());
	config.plugins.push(new CopyWebpackPlugin([{from: './data.json', to: 'data.json'}]));
}
module.exports = config;
