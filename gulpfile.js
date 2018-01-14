const gulp = require('gulp'),
  fs = require('fs'),
  del = require('del'),
  sourcemaps = require('gulp-sourcemaps'),
  gutil = require('gulp-util'),
  watch = require('gulp-watch'),
  runSequence = require('run-sequence'),
  nunjucksRender = require('gulp-nunjucks-render'),
  htmlbeautify = require('gulp-html-beautify'),
  inline = require('gulp-inline-source'),
  sass = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  browserify = require('browserify'),
  source = require('vinyl-source-stream'),
  babelify = require('babelify'),
  vueify = require('vueify'),
  uglify = require('gulp-uglifyjs'),
  browserSync = require('browser-sync').create();


const projectSettings = {
  openPage: 'index.html',
  jsBundle: 'common.js',
  inlineAttribute: 'inline',
  src: {
    html: './src/pages/**/*.html',
    watchHtml: './src/**/*.html',
    js: './src/js/common.js',
    watchJs: ['./src/js/**/*.js', './src/js/**/*.vue'],
    scss: './src/scss/**/*.scss',
    assets: './src/assets/**/*',
    watchAssets: './src/assets/**/*'
  },
  dev: {
    folder: './dev',
    js: './dev/assets/js',
    css: './dev/assets/css',
    assets: './dev/assets'
  }
};


gulp.task('clean', function () {
  return del(projectSettings.dev.folder)
});

gulp.task('build:dev', ['clean'], function (callback) {

  gulp.task('html', function () {
    var filePath;
    return gulp.src(projectSettings.src.html)
      .on('data', function (file) {
        filePath = file.path;
      })
      .pipe(nunjucksRender().on('error', function (err) {
        gutil.log(gutil.colors.red.bold('ERROR HTML: \n' + err + '\n FILE: ' + filePath));
      }))
      .pipe(inline({
        attribute: projectSettings.inlineAttribute
      }).on('error', function (err) {
        gutil.log(gutil.colors.red.bold('ERROR HTML Inline: \n' + err.message + '\n FILE: ' + filePath));
      }))
      .pipe(htmlbeautify({'max_preserve_newlines': 0}))
      .pipe(gulp.dest(projectSettings.dev.folder))
  });

  gulp.task('scss', function () {
    return gulp.src(projectSettings.src.scss)
      .pipe(sourcemaps.init())
      .pipe(sass())
      .pipe(autoprefixer())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(projectSettings.dev.css))
  });

  gulp.task('script', function () {
    var filePath;
    var $browserify = browserify({
      entries: projectSettings.src.js,
      debug: true
    })
    $browserify.pipeline.on('file', function (file) {
      filePath = file;
    })
    return $browserify.bundle()
      .on('error', function (err) {
      gutil.log(gutil.colors.red.bold('ERROR SCRIPT: \n' + err + '\nFILE: ' + filePath));
      })
      .pipe(source(projectSettings.jsBundle))
      .pipe(gulp.dest(projectSettings.dev.js))
  });

  gulp.task('assets', function () {
    return gulp.src(projectSettings.src.assets)
      .pipe(gulp.dest(projectSettings.dev.assets))
  });

  runSequence('html', 'scss', 'script', 'assets', callback);

});

gulp.task('build:prod', ['clean'], function (callback) {

  gulp.task('html', function () {
    var filePath;
    return gulp.src(projectSettings.src.html)
      .on('data', function (file) {
        filePath = file.path;
      })
      .pipe(nunjucksRender().on('error', function (err) {
        gutil.log(gutil.colors.red.bold('ERROR HTML: \n' + err + '\n FILE: ' + filePath));
      }))
      .pipe(inline({
        attribute: projectSettings.inlineAttribute
      }).on('error', function (err) {
        gutil.log(gutil.colors.red.bold('ERROR HTML Inline: \n' + err.message + '\n FILE: ' + filePath));
      }))
      .pipe(htmlbeautify({'max_preserve_newlines': 0}))
      .pipe(gulp.dest(projectSettings.dev.folder))
  });

  gulp.task('scss', function () {
    return gulp.src(projectSettings.src.scss)
      .pipe(sass({outputStyle: 'compressed'}))
      .pipe(autoprefixer())
      .pipe(gulp.dest(projectSettings.dev.css))
  });

  gulp.task('script', function () {
    var filePath;
    var $browserify = browserify({
      entries: projectSettings.src.js,
      debug: false
    })
    $browserify.pipeline.on('file', function (file) {
      filePath = file;
    })
    return $browserify.bundle()
      .on('error', function (err) {
      gutil.log(gutil.colors.red.bold('ERROR SCRIPT: \n' + err + '\nFILE: ' + filePath));
      })
      .pipe(source(projectSettings.jsBundle))
      .pipe(uglify())
      .pipe(gulp.dest(projectSettings.dev.js))
  });

  gulp.task('assets', function () {
    return gulp.src(projectSettings.src.assets)
      .pipe(gulp.dest(projectSettings.dev.assets))
  });

  runSequence('html', 'scss', 'script', 'assets', callback);

});

gulp.task('watch', ['build:dev'], function () {

  watch(projectSettings.src.scss, function () {
    gutil.log('Starting [watch:scss] ...');
    gulp.src(projectSettings.src.scss)
      .pipe(sourcemaps.init())
      .pipe(sass({outputStyle: 'compressed'}).on('error', function (err) {
        gutil.log(gutil.colors.red.bold(err.message));
      }))
      .pipe(autoprefixer())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(projectSettings.dev.css))
      .on('end', function () {
        gutil.log('Finished [watch:scss]');
        browserSync.reload();
      });
  });

  watch(projectSettings.src.watchJs, function () {
    gutil.log('Starting [watch:script] ...');
    var filePath;
    var $browserify = browserify({
      entries: projectSettings.src.js,
      debug: true
    })
    $browserify.pipeline.on('file', function (file) {
      filePath = file;
    })
    $browserify.bundle()
    .on('error', function (err) {
      gutil.log(gutil.colors.red.bold('ERROR SCRIPT: \n' + err + '\nFILE: ' + filePath));
    })
    .pipe(source(projectSettings.jsBundle))
    .pipe(gulp.dest(projectSettings.dev.js))
    .on('end', function () {
      gutil.log('Finished [watch:script]');
      browserSync.reload();
    });
  });

  watch(projectSettings.src.watchHtml, function () {
    gutil.log('Starting [watch:html] ...');
    var filePath;
    gulp.src(projectSettings.src.html)
      .on('data', function (file) {
        filePath = file.path;
      })
      .pipe(nunjucksRender().on('error', function (err) {
        gutil.log(gutil.colors.red.bold('ERROR HTML: \n' + err + '\n FILE: ' + filePath));
      }))
      .pipe(inline({
        attribute: projectSettings.inlineAttribute
      }).on('error', function (err) {
        gutil.log(gutil.colors.red.bold('ERROR HTML Inline: \n' + err.message + '\n FILE: ' + filePath));
      }))
      .pipe(htmlbeautify({'max_preserve_newlines': 0}))
      .pipe(gulp.dest(projectSettings.dev.folder))
      .on('end', function () {
        gutil.log('Finished [watch:html]');
        browserSync.reload();
      });
  })

  watch(projectSettings.src.assets, function () {
    gutil.log('Starting [watch:assets] ...');
    gulp.src(projectSettings.src.watchAssets)
      .pipe(gulp.dest(projectSettings.dev.assets))
      .on('end', function () {
        gutil.log('Finished [watch:assets]');
        browserSync.reload();
      });
  });

});

gulp.task('default', ['watch'], function () {
  browserSync.init({
    server: {
      baseDir: projectSettings.dev.folder,
      index: projectSettings.openPage
    },
    port: 8080
  });
});