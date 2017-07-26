var HtmlWebpackPlugin = require('html-webpack-plugin')
var CommonsChunkPlugin = require("webpack/lib/optimize/CommonsChunkPlugin");
var path = require('path');
var webpack = require('webpack');
var fs = require('fs');
var uglifyJsPlugin = webpack.optimize.UglifyJsPlugin;
var gutil = require('gulp-util');
var srcDir = path.resolve(process.cwd(), 'src');
var prod = gutil.env._[0] == 'dev' ? true : false;
var config = require('./config.js');

//获取多页面的每个入口文件，用于配置中的entry
function getEntry() {
    var jsPath = path.resolve(srcDir, 'js');
    var dirs = fs.readdirSync(jsPath);
    var matchs = [], files = {};
    dirs.forEach(function (item) {
        matchs = item.match(/(.+)\.js$/);
        if (matchs) {
            files[matchs[1]] = path.resolve(srcDir, 'js', item);
        }
    });
    // console.log(JSON.stringify(files));
    return files;
}

var webpackConfig = {
    cache: true,
    devtool: prod ? "source-map" : '',
    entry: getEntry(),
    output: {
        path: path.join(process.cwd(), "dist/"),
        publicPath: "",
        filename: prod ? 'js/[name].js' : 'js/[name].[chunkhash:10].js',
        chunkFilename: "js/[name].js"
    },
    plugins: []
};

webpackConfig.plugins = [].concat(config.plugins);

module.exports = webpackConfig;