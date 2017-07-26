/**
 * 脚手架项目
 * created by lc
 */
var gulp = require('gulp'),
    os = require('os'),
    path = require('path'),
    gutil = require('gulp-util'),
    sass = require('gulp-sass'),
    concat = require('gulp-concat'),
    gulpOpen = require('gulp-open'),
    uglify = require('gulp-uglify'),
    cleanCSS = require('gulp-clean-css'),
    spriter = require('gulp-css-spriter'),
    webpack = require('webpack'),
    webpackConfig = require('./build/webpack.config.js'),
    connect = require('gulp-connect');
    require('shelljs/global'),
    rev = require('gulp-rev'),
    revCollector = require('gulp-rev-collector'),
    gulpSequence = require('gulp-sequence'),  //- gulp串行任务   //gulpSequence：圆括号串行，中括号并行
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    sourcemaps = require('gulp-sourcemaps'),
    spritesmith = require('gulp.spritesmith'),
    imagemin = require('gulp-imagemin');

var processors = [
	autoprefixer({
		browsers: ['ie >= 9', 'Chrome >= 20', 'Android >= 3.0', 'Firefox >= 10']
	})
];

var prod = gutil.env._[0] == 'dev' ? true : false;

var host = {
    path: 'dist/',
    port: 3000,
    html: 'index.html'
};

//mac chrome: "Google chrome"
var browser = os.platform() === 'linux' ? 'Google chrome' : (
  os.platform() === 'darwin' ? 'Google chrome' : (
  os.platform() === 'win32' ? 'chrome' : 'firefox'));
var pkg = require('./package.json');

//压缩合并css 生成环境生成为md5的文件
gulp.task('sassmin', function () {
    if (prod) { //dev
        return gulp.src(['src/css/*.scss', 'src/css/**/*.css'], {base: 'src/css/'})
            .pipe(sourcemaps.init())
            .pipe(sass({
                precision: 4 //保留小数点后几位 #https://github.com/sass/node-sass#precision
            }).on('error', sass.logError))
            .pipe(postcss(processors))
            .pipe(cleanCSS({
                format:{
                    breaks:{//控制在哪里插入断点
                      afterAtRule: true,
                      afterBlockEnds:true,//控制在一个块结束后是否有换行符,默认为`false`
                      afterRuleEnds:true,//控制在规则结束后是否有换行符;默认为`false`
                    }
                }
            }))
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest('dist/css/'))
            .pipe(connect.reload())
    } else {
        return gulp.src(['src/css/*.scss', 'src/css/**/*.css'])
            .pipe(sass())
            .pipe(postcss(processors))
            .pipe(cleanCSS())
            .pipe(rev())
            .pipe(gulp.dest('./dist/css/'))
            .pipe(rev.manifest('css-version.json'))
            .pipe(gulp.dest('./rev'))
    }
});

//修改css在html中的引用路径，该动作依赖build-js sassmin
gulp.task('rev:css', ['build-js', 'sassmin'], function(done) {
    return gulp.src(['./rev/*.json', './dist/**/*.html'])     //- 读取 rev-manifest.json 文件以及需要进行css名替换的文件
        .pipe(revCollector())                                 //- 执行文件内css名的替换
        .pipe(gulp.dest('dist/'))                             //- 替换后的文件输出的目录
    done()
});

//引用webpack对js进行操作 生成带有hash的html页
var myDevConfig = Object.create(webpackConfig);
var devCompiler = webpack(myDevConfig);
gulp.task("build-js", function(callback) {
    devCompiler.run(function(err, stats) {
        if(err) throw new gutil.PluginError("webpack:build-js", err);
        gutil.log("[webpack:build-js]", stats.toString({
            colors: true
        }));
        callback();
    });
});

gulp.task('copy:images', function (done) {
    rm('-rf', 'dist/images/');
    gulp.src(['src/images/**/*'])
        .pipe(gulp.dest('dist/images'))
        .on('end', done);
});

gulp.task('sprites', function() {
    var spriteData = gulp.src('src/images/sprites/*.png')
        .pipe(spritesmith({
            cssName: '_sprites.scss',
            cssFormat: 'scss',
            imgName: 'icon-sprite.png',
            imgPath: '../images/icon-sprite.png',
            padding: 20
        }));
    spriteData.img
        .pipe(imagemin())
        .pipe(gulp.dest('dist/images'));
    spriteData.css
        .pipe(gulp.dest('src/css'));
});

gulp.task('clean', function (done) {
    rm('-rf', 'dist/')
    rm('-rf', 'rev/')
    mkdir('-p', 'dist/')
    done();
});

gulp.task('watch', function (done) {
    gulp.watch('src/**/*.scss', ['sassmin']).on('change', function(event){
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });
    gulp.watch(['src/**/*.html', 'src/**/*.js'], ['build-js']).on('change', function(event){
        gulp.src(['src/**/*.html', 'src/**/*.js']).pipe(connect.reload())
        console.log('File ' + event.path + ' was ' + event.type + ', running tasks...');
    });
    gulp.watch('src/images/**', ['copy:images', 'sprites']).on('change', function(event) {

    });
    done()
});

gulp.task('connect', function (done) {
    connect.server({
        root: host.path,
        port: host.port,
        livereload: true
    });
    done()
});

gulp.task('open', function (done) {
    gulp.src('')
        .pipe(gulpOpen({
            app: browser,
            uri: 'http://localhost:3000/'
        }))
    done()
});


//发布
gulp.task('build', ['clean'], function(cb) {
    gulpSequence('copy:images', 'sprites', 'rev:css', 'connect', 'open', cb);
});

//开发
gulp.task('dev', ['clean'], function(cb) {
    gulpSequence('build-js', 'sprites', ['copy:images', 'sassmin', 'connect', 'open'], 'watch', cb);
});