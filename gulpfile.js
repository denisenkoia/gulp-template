const gulp = require('gulp'),
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
    watchify = require('watchify'),
    source = require('vinyl-source-stream'),
    babelify = require('babelify'),
    vueify = require('vueify'),
    buffer = require('vinyl-buffer'),
    uglify = require('gulp-uglifyjs'),
    browserSync = require('browser-sync').create();


const projectSettings = {
    openPage: 'index.html',
    jsBundle: 'common.js',
    inlineAttribute: 'inline',
    src: {
        html: './src/pages/**/*.html',
        watchHtml: ['!./src/js/**/*.html', './src/**/*.html'],
        js: ['./src/js/common.js'],
        scss: './src/scss/**/*.scss',
        assets: './src/assets/**/*'
    },
    dev: {
        folder: './dev',
        js: './dev/assets/js',
        css: './dev/assets/css',
        assets: './dev/assets'
    }
};


gulp.task('clean', () => {
    return del(projectSettings.dev.folder)
});


gulp.task('html', () => {
    let filePath;
    gulp.src(projectSettings.src.html)
        .on('data', (file) => {
            filePath = file.path;
        })
        .pipe(nunjucksRender().on('error', (err) => {
            gutil.log(gutil.colors.red.bold('ERROR HTML: \n' + err + '\n FILE: ' + filePath));
        }))
        .pipe(inline({
            attribute: projectSettings.inlineAttribute
        }).on('error', (err) => {
            gutil.log(gutil.colors.red.bold('ERROR HTML Inline: \n' + err.message + '\n FILE: ' + filePath));
        }))
        .pipe(htmlbeautify({'max_preserve_newlines': 0}))
        .pipe(gulp.dest(projectSettings.dev.folder))
        .on('end', () => {
            browserSync.reload();
        });
})


gulp.task('script', () => {
    let filePath;
    let $browserify = browserify({
        entries: projectSettings.src.js,
        debug: !gutil.env.production,
        transform: [babelify, vueify],
        cache: {},
        packageCache: {},
        plugin: [watchify]
    })
    $browserify.pipeline.on('file', (file) => {
        filePath = file;
    })

    if ( !gutil.env.production ) {
        $browserify.on('update', bundleJs)
    }

    return bundleJs();

    function bundleJs() {
        let start = new Date();
        console.log('Starting script bundle ...');
        return $browserify.bundle()
        .on('error', (err) => {
            gutil.log(gutil.colors.red.bold('ERROR SCRIPT: \n' + err + '\nFILE: ' + filePath));
        })
        .pipe(source(projectSettings.jsBundle))
        .pipe(gutil.env.production ? buffer() : gutil.noop())
        .pipe(gutil.env.production ? uglify() : gutil.noop())
        .pipe(gulp.dest(projectSettings.dev.js))
        .on('end', () => {
            let finish = new Date();
            let time = ((finish - start)/1000) + ' s';
            console.log('Finished script script bundle', time);
            browserSync.reload();
        });
    }
})


gulp.task('scss', () => {
    gulp.src(projectSettings.src.scss)
        .pipe(gutil.env.production ? gutil.noop() : sourcemaps.init())
        .pipe(sass({outputStyle: (gutil.env.production) ? 'compressed' : ''}).on('error', (err) => {
            gutil.log(gutil.colors.red.bold(err.message));
        }))
        .pipe(autoprefixer())
        .pipe(gutil.env.production ? gutil.noop() : sourcemaps.write())
        .pipe(gulp.dest(projectSettings.dev.css))
        .on('end', () => {
            browserSync.reload();
        });
});


gulp.task('assets', () => {
    gulp.src(projectSettings.src.assets)
        .pipe(gulp.dest(projectSettings.dev.assets))
        .on('end', () => {
            browserSync.reload();
        });
});


gulp.task('watch', () => {

    watch(projectSettings.src.watchHtml, () => {
        gulp.start('html');
    });

    watch(projectSettings.src.scss, () => {
        gulp.start('scss');
    });

    watch(projectSettings.src.assets, () => {
        gulp.start('assets');
    });

});


gulp.task('server', () => {
    browserSync.init({
        server: {
            baseDir: projectSettings.dev.folder,
            index: projectSettings.openPage
        },
        port: 8080
    });
})


// dev build "gulp or gulp default"
// production build "gulp --production or gulp default --production"
gulp.task('default', ['clean'], (callback) => {

    if (gutil.env.production) {
        runSequence('html', 'script', 'scss', 'assets', callback);
    }
    else {
        runSequence('html', 'script', 'scss', 'assets', 'watch', 'server', callback);
    }

});