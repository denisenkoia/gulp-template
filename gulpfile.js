const gulp = require('gulp'),
  del = require('del'),
  sourcemaps = require('gulp-sourcemaps'),
  gutil = require('gulp-util'),
  runSequence = require('run-sequence'),
  nunjucksRender = require('gulp-nunjucks-render'),
  data = require('gulp-data'),
  htmlbeautify = require('gulp-html-beautify'),
  inline = require('gulp-inline-source'),
  sass = require('gulp-sass'),
  autoprefixer = require('gulp-autoprefixer'),
  browserify = require('browserify'),
  source = require('vinyl-source-stream'),
  babelify = require('babelify'),
  browserSync = require('browser-sync').create();


const projectSettings = {
  openPage: 'index.html',
  jsBundle: 'common.js',
  inlineAttribute: 'inline',
  src: {
    db: './src/db_data.json',
    html: './src/pages/**/*.html',
    watchHtml: ['./src/**/*.html', './src/db_data.json'],
    js: './src/js/common.js',
    watchJs: './src/js/**/*.js',
    scss: './src/scss/**/*.scss',
    assets: './src/assets/**/*',
    watchAssets: './src/assets/**/*.*'
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

gulp.task('build', ['clean'], function (callback) {

  gulp.task('html', function () {
    return gulp.src(projectSettings.src.html)
      .pipe(data(function () {
        return require(projectSettings.src.db)
      }))
      .pipe(nunjucksRender().on('error', function (err) {
        gutil.log(gutil.colors.red.bold('ERROR HTML: \n' + err));
      }))
      .pipe(inline({
        attribute: projectSettings.inlineAttribute
      }).on('error', function (err) {
        gutil.log(gutil.colors.red.bold('ERROR HTML Inline: \n' + err));
      }))
      .pipe(htmlbeautify({'max_preserve_newlines': 0}))
      .pipe(gulp.dest(projectSettings.dev.folder))
  });

  gulp.task('scss', function () {
    return gulp.src(projectSettings.src.scss)
      .pipe(sourcemaps.init())
      .pipe(sass({outputStyle: 'compressed'}))
      .pipe(autoprefixer())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(projectSettings.dev.css))
  });

  gulp.task('script', function () {
    return browserify({
      entries: projectSettings.src.js,
      debug: true
    })
      .transform(babelify, {
        "presets": ["es2015"]
      })
      .bundle().on('error', function (err) {
        gutil.log(gutil.colors.red.bold('ERROR SCRIPT: \n' + err));
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

gulp.task('watch', ['build'], function () {

  gulp.task('watch:scss', function () {
    gulp.src(projectSettings.src.scss)
      .pipe(sourcemaps.init())
      .pipe(sass({outputStyle: 'compressed'}).on('error', function (err) {
        gutil.log(gutil.colors.red.bold(err.message));
      }))
      .pipe(autoprefixer())
      .pipe(sourcemaps.write())
      .pipe(gulp.dest(projectSettings.dev.css))
      .on('end', function () {
        browserSync.reload();
      });
  });

  gulp.task('watch:script', function () {
    browserify({
      entries: projectSettings.src.js,
      debug: true
    })
      .transform(babelify, {
        "presets": ["es2015"]
      })
      .bundle().on('error', function (err) {
      gutil.log(gutil.colors.red.bold('ERROR SCRIPT: \n' + err));
    })
      .pipe(source(projectSettings.jsBundle))
      .pipe(gulp.dest(projectSettings.dev.js))
      .on('end', function () {
        browserSync.reload();
      });
  });

  gulp.task('watch:html', function () {
    gulp.src(projectSettings.src.html)
      .pipe(data(function () {
        return require(projectSettings.src.db)
      }))
      .pipe(nunjucksRender().on('error', function (err) {
        gutil.log(gutil.colors.red.bold('ERROR HTML: \n' + err));
      }))
      .pipe(inline({
        attribute: projectSettings.inlineAttribute
      }).on('error', function (err) {
        gutil.log(gutil.colors.red.bold('ERROR HTML Inline: \n' + err));
      }))
      .pipe(htmlbeautify({'max_preserve_newlines': 0}))
      .pipe(gulp.dest(projectSettings.dev.folder))
      .on('end', function () {
        browserSync.reload();
      });
  });

  gulp.task('watch:assets', function () {
    gulp.src(projectSettings.src.watchAssets)
      .pipe(gulp.dest(projectSettings.dev.assets))
      .on('end', function () {
        browserSync.reload();
      });
  });

  gulp.watch(projectSettings.src.watchHtml, ['watch:html']);
  gulp.watch(projectSettings.src.scss, ['watch:scss']);
  gulp.watch(projectSettings.src.watchJs, ['watch:script']);
  gulp.watch(projectSettings.src.assets, ['watch:assets']);

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