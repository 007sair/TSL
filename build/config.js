var webpack = require('webpack');
var HtmlWebpackPlugin = require('html-webpack-plugin')
var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
var uglifyJsPlugin = webpack.optimize.UglifyJsPlugin;

var config = {
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'src/index.html',
            chunks: ['index']
        }),
        new uglifyJsPlugin({
            compress: {
                warnings: false
            }
        })
    ]
};


module.exports = config;