'use strict';

/***********************************************************************************************************************
 * Path and file naming settings
 **********************************************************************************************************************/

var build_dir = '../public';
var src_dir = '../resources/assets';

var scss_main_file_name = 'style.scss';
var css_main_file_name = 'style.css';
var sprite_img_file_name = '../img/sprites/sprite.png';
var sprite_scss_file_name = '_sprite.scss';
var zip_file_name = 'build.zip';

var path = {
    build: {
        css: build_dir + '/css/',
        js: build_dir + '/js/',
        img: build_dir + '/img/',
        fonts: build_dir + '/fonts/',
        sprite_scss: src_dir + '/sass/4_common',
        zip: build_dir + '/',
    },
    src: {
        css: src_dir + '/sass/' + scss_main_file_name,
        img: src_dir + '/img/**/*.*',
        fonts: src_dir + '/fonts/*.ttf',
        sprites: src_dir + '/img/sprites/*.*',
        zip: [build_dir + '/**', '!' + build_dir + '/_gulp-builder/node_modules/**', '!' + build_dir + '/_gulp-builder/bower_components/**'],
    },
    watch: {
        css: src_dir + '/sass/**/*.*',
        img: src_dir + '/img/**/*.*',
        fonts: src_dir + '/fonts/**/*.*',
        sprite: src_dir + '/img/sprites/*.*'
    },
    clean: build_dir + '/'
};

/***********************************************************************************************************************
 * Plugins
 **********************************************************************************************************************/

var gulp = require('gulp');
// var Server = require('karma').Server;
var webpack = require('gulp-webpack');
var plugins = {
    'rename': require('gulp-rename'),
    'sourcemaps': require('gulp-sourcemaps'),
    'sass': require('gulp-ruby-sass'),
    'prefixer': require('gulp-autoprefixer'),
    'cssmin': require('gulp-minify-css'),
    'imagemin': require('gulp-imagemin'),
    'pngquant': require('imagemin-pngquant'),
    'uglify': require('gulp-uglify'),
    'watch': require('gulp-watch'),
    'browserSync': require("browser-sync"),
    'rimraf': require('rimraf'),
    'plumber': require('gulp-plumber'),
    'zip': require('gulp-zip'),
    'spritesmith': require('gulp.spritesmith'),
    'ttf2woff': require('gulp-ttf2woff'),
    'ttf2eot': require('gulp-ttf2eot'),
};

/***********************************************************************************************************************
 * Server config
 **********************************************************************************************************************/

var serv_config = {
    server: {
        baseDir: build_dir + "/"
    },
    tunnel: true,
    host: 'localhost',
    port: 9000,
    logPrefix: "Frontend_Devil"
};

var reload = plugins.browserSync.reload;

/***********************************************************************************************************************
 * Tasks registration
 **********************************************************************************************************************/

/***********************************************************************************************************************
 * Task: Sprite
 ***********************************************************************************************************************
 *
 * Concatenates images in one sprite image and generate .scss file sprite mixins
 *
 **********************************************************************************************************************/

gulp.task('sprite', function() {
    var spriteData = gulp.src(path.src.sprites).pipe(plugins.spritesmith({
        imgName: sprite_img_file_name,
        cssName: sprite_scss_file_name,
        cssVarMap: function(sprite) {
            sprite.name = 's-' + sprite.name
        }
    }));
    spriteData.css.pipe(gulp.dest(path.build.sprite_scss));
    spriteData.img.pipe(gulp.dest(path.build.img));
});

/***********************************************************************************************************************
 * Task: CSS
 ***********************************************************************************************************************
 *
 * Compiles .scss files to css. Adds vendor prefixes and minimizes
 *
 **********************************************************************************************************************/

gulp.task('css:build', function() {
    gulp.src(path.src.css)
        .pipe(plugins.plumber());
    return plugins.sass(path.src.css)
        .pipe(plugins.prefixer())
        .pipe(plugins.rename('dist.' + css_main_file_name))
        .pipe(gulp.dest(path.build.css))
        .pipe(plugins.cssmin())
        .pipe(plugins.rename(css_main_file_name))
        .pipe(gulp.dest(path.build.css))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('css:dev', function() {
    gulp.src(path.src.css)
        .pipe(plugins.plumber());
    return plugins.sass(path.src.css, {
            sourcemap: true
        })
        .pipe(plugins.cssmin())
        .pipe(plugins.prefixer())
        .pipe(plugins.sourcemaps.write('map'))
        .pipe(gulp.dest(path.build.css))
        .pipe(reload({
            stream: true
        }));
});

/***********************************************************************************************************************
 * Task: Webpack
 ***********************************************************************************************************************
 *
 * Run webpack
 *
 **********************************************************************************************************************/

gulp.task('webpack', function() {
return gulp.src('src/entry.js')
  .pipe(webpack( require('./webpack.config.js') ))
  .pipe(gulp.dest(path.build.js));
});

gulp.task('webpack:watch', function() {
return gulp.src('src/entry.js')
  .pipe(webpack( require('./webpack.config.js'),{watch: true} ))
  .pipe(gulp.dest(path.build.js));
});

/***********************************************************************************************************************
 * Task: Test by karma
 ***********************************************************************************************************************
 *
 * Run test files
 *
 **********************************************************************************************************************/
/**
 * Run test once and exit
 */
// gulp.task('test', function (done) {
//   new Server({
//     configFile: __dirname + '/karma.config.js',
//     singleRun: true
//   }, done).start();
// });


/***********************************************************************************************************************
 * Task: Img
 ***********************************************************************************************************************
 *
 * Compress .png and .jpg files
 *
 **********************************************************************************************************************/

gulp.task('img:build', function() {
    gulp.src([path.src.img, '!' + path.src.sprites])
        .pipe(plugins.plumber())
        .pipe(plugins.imagemin({
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            use: [plugins.pngquant()],
            interlaced: true
        }))
        .pipe(gulp.dest(path.build.img))
        .pipe(reload({
            stream: true
        }));
});

gulp.task('img:dev', function() {
    gulp.src([path.src.img, '!' + path.src.sprites])
        .pipe(gulp.dest(path.build.img))
        .pipe(reload({
            stream: true
        }));
});

/***********************************************************************************************************************
 * Task: Fonts
 ***********************************************************************************************************************
 *
 * Generate .eot and .woff files frome one .ttf file.
 * Reacts on .ttf only
 *
 **********************************************************************************************************************/

gulp.task('fonts', function() {
    gulp.src(path.src.fonts)
        .pipe(gulp.dest(path.build.fonts))
        .pipe(plugins.ttf2eot())
        .pipe(gulp.dest(path.build.fonts));
    gulp.src(path.src.fonts)
        .pipe(plugins.ttf2woff())
        .pipe(gulp.dest(path.build.fonts));
});

/***********************************************************************************************************************
 * Task: Jshint
 ***********************************************************************************************************************
 *
 * Сhecks js code for correctness 
 * 
 *
 **********************************************************************************************************************/


// gulp.task('lint', function() {
//   return gulp.src(path.src.lint)
//     .pipe(plugins.jshint())
//     .pipe(plugins.jshint.reporter(plugins.stylish));
// });



/***********************************************************************************************************************
 * Task: ZIP
 ***********************************************************************************************************************
 *
 * Compress build path in .zip file.
 * Use for deploying preparing
 *
 **********************************************************************************************************************/

gulp.task('zip', function() {
    return gulp.src(path.src.zip)
        .pipe(plugins.plumber())
        .pipe(plugins.zip(zip_file_name))
        .pipe(gulp.dest(path.build.zip));
});

/***********************************************************************************************************************
 * Task: Webserver
 ***********************************************************************************************************************
 *
 * Show pages with auto-reload
 *
 **********************************************************************************************************************/

gulp.task('serv', function() {
    plugins.browserSync(serv_config);
});

/***********************************************************************************************************************
 * Task: Clean
 ***********************************************************************************************************************
 *
 * Cleans build directory
 *
 **********************************************************************************************************************/

gulp.task('clean', function(cb) {
    plugins.rimraf(path.clean, cb);
});

/***********************************************************************************************************************
 * Task: Build
 ***********************************************************************************************************************
 *
 * Run all task in build mode. Prepare all for production
 *
 **********************************************************************************************************************/

gulp.task('build', [
    'sprite',
    'webpack',
    'css:build',
    'fonts',
    'img:build',
]);

/***********************************************************************************************************************
 * Task: Build
 ***********************************************************************************************************************
 *
 * Run all task in development mode. Quick use for developing process
 *
 **********************************************************************************************************************/

gulp.task('dev', [
    'sprite',
    'webpack',
    'css:dev',
    'fonts',
    'img:dev',
    // 'lint'
]);

/***********************************************************************************************************************
 * Task: Watch
 ***********************************************************************************************************************
 *
 * Watch all files and start needed tasks when changes happen
 *
 **********************************************************************************************************************/

gulp.task('watch', function() {
    plugins.watch([path.watch.css], function(event, cb) {
        gulp.start('css:dev');
    });
    plugins.watch([path.watch.sprite], function(event, cb) {
        gulp.start('sprite');
    });

    gulp.start('webpack');

    plugins.watch([path.watch.img], function(event, cb) {
        gulp.start('img:dev');
    });
    plugins.watch([path.watch.fonts], function(event, cb) {
        gulp.start('fonts');
    });
});

/***********************************************************************************************************************
 * Task: Watch
 ***********************************************************************************************************************
 *
 * Run all tasks in dev mode and than run watch task
 *
 **********************************************************************************************************************/

gulp.task('default', ['dev', 'watch']);