'use strict';

const srcVendor = {
    css: [
        './node_modules/bootstrap/dist/css/bootstrap.css',
    ],
    js: [
        './node_modules/jquery/dist/jquery.js',
        './node_modules/bootstrap/dist/js/bootstrap.js',
    ],
    fonts: [
        './node_modules/bootstrap/dist/fonts/**/*',
    ],
};

const src = {
    html: [
        './src/html/**/*.html',
    ],
    htmlIndex: './src/index.html',
    css: [
        './src/css/**/*.css',
    ],
    js: [
        './src/js/**/*.js',
    ],
    img: {
        perm: './src/img/perm/**/*.{png,jpg,svg,gif}',
        sprite: './src/img/sprite/**/*.{png,jpg,svg,gif}',
        temp: './src/img/temp/**/*.{png,jpg,svg,gif}',
    },
};

const dist = {
    root: './dist/',
    html: './dist/html/',
    css: './dist/css/',
    fonts: './dist/fonts/',
    js: './dist/js/',
    img: {
        root: './dist/img/',
        perm: './dist/img/perm/',
        // sprite: './dist/img/sprite/',
        temp: './dist/img/temp/',
    },
};

const gulp = require('gulp');
const runSequence = require('gulp-run-sequence');
const clean = require('gulp-clean');
const sourcemaps = require('gulp-sourcemaps');
const autoprefixer = require('gulp-autoprefixer');
const concat = require('gulp-concat');
const browserSync = require("browser-sync").create();
const cleancss = require('gulp-clean-css');
const cssmin = require('gulp-cssmin');
const rename = require('gulp-rename');
const minifyjs = require('gulp-js-minify');
const md5 = require("gulp-md5-plus");
const htmlminify = require("gulp-html-minify");
const replace = require('gulp-replace');
const imagemin = require('gulp-imagemin');
const spritesmith = require('gulp.spritesmith');
const buffer = require('vinyl-buffer');
const csso = require('gulp-csso');
const merge = require('merge-stream');
const zip = require('gulp-zip');

gulp.task('clean-dist', () => {
    return gulp.src(dist.root)
        .pipe(clean({force: true}));
});

gulp.task('build-vendor', () => {
    gulp.src(srcVendor.css)
        .pipe(concat('vendor.css'))
        .pipe(gulp.dest(dist.css));

    gulp.src(srcVendor.js)
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest(dist.js));

    return gulp.src(srcVendor.fonts)
        .pipe(gulp.dest(dist.fonts));

});

gulp.task('build-html', () => {
    gulp.src(src.htmlIndex)
        .pipe(gulp.dest(dist.root));

    return gulp.src(src.html)
        .pipe(gulp.dest(dist.html));
});

gulp.task('build-css', () => {
    return gulp.src(src.css)
        .pipe(sourcemaps.init())
        .pipe(autoprefixer())
        .pipe(concat('style.css'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(dist.css));
});

gulp.task('build-js', () => {
    return gulp.src(src.js)
        .pipe(sourcemaps.init())
        .pipe(concat('main.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(dist.js));
});

gulp.task('build-img', () => {
    gulp.src([src.img.perm, src.img.temp])
        .pipe(gulp.dest(dist.img.perm));
    return gulp.src([src.img.perm, src.img.temp])
        .pipe(gulp.dest(dist.img.temp));
});

gulp.task('build-sprite', () => {
    // Generate our spritesheet
    const spriteData = gulp.src(src.img.sprite).pipe(spritesmith({
        imgName: 'sprite.png',
        cssName: 'sprite.css',
        // retinaImgName: 'sprite@2x.png',
        padding: 2, // Exaggerated for visibility, normal usage is 1 or 2
    }));

    // Pipe image stream through image optimizer and onto disk
    const imgStream = spriteData.img
    // DEV: We must buffer our stream into a Buffer for `imagemin`
        .pipe(buffer())
        .pipe(gulp.dest(dist.css));

    // Pipe CSS stream through CSS optimizer and onto disk
    const cssStream = spriteData.css
        .pipe(csso())
        .pipe(gulp.dest(dist.css));

    // Return a merged stream to handle both `end` events
    return merge(imgStream, cssStream);
});

gulp.task('watch-file', () => {
    gulp.watch([...src.html, src.htmlIndex], ['build-html']);
    gulp.watch(src.css, ['build-css']);
    gulp.watch(src.js, ['build-js']);
    gulp.watch(src.img.temp, ['build-img']);
    gulp.watch(src.img.perm, ['build-img']);
});

gulp.task('browser-sync', () => {
    const config = {
        server: {
            baseDir: dist.root,
        },
        port: 28088,
        logConnections: true,
        logFileChanges: true,
        notify: false,
        open: "external",
        ghostMode: {
            clicks: true,
            forms: true,
            scroll: true,
        },
        https: false,
    };
    return browserSync.init(dist.root, config);
});

gulp.task('default', () => {
    return runSequence(
        'clean-dist',
        'build-vendor',
        'build-sprite',
        ['build-html', 'build-css', 'build-js', 'build-img'],
        'watch-file',
        'browser-sync',
    );
});


gulp.task('build-html-prod', () => {
    gulp.src(src.htmlIndex)
    // .pipe(replace('<link rel="stylesheet" href="css/vendor.css">', '<link rel="stylesheet" href="css/vendor.min.css">'))
    // .pipe(replace('<link rel="stylesheet" href="css/style.css">', '<link rel="stylesheet" href="css/style.min.css">'))
    // .pipe(replace('<script src="js/vendor.js"></script>', '<script src="js/vendor.min.js"></script>'))
    // .pipe(replace('<script src="js/main.js"></script>', '<script src="js/main.min.js"></script>'))
        .pipe(htmlminify())
        .pipe(gulp.dest(dist.root));

    return gulp.src(src.html)
        .pipe(htmlminify())
        .pipe(gulp.dest(dist.html));
});

gulp.task('build-vendor-prod', () => {
    gulp.src(srcVendor.css)
        .pipe(concat('vendor.css'))
        .pipe(cssmin())
        // .pipe(rename({suffix: '.min'}))
        .pipe(md5(10, './dist/index.html'))
        .pipe(gulp.dest(dist.css));

    gulp.src(srcVendor.js)
        .pipe(concat('vendor.js'))
        .pipe(minifyjs())
        // .pipe(rename({suffix: '.min'}))
        .pipe(md5(10, './dist/index.html'))
        .pipe(gulp.dest(dist.js));

    return gulp.src(srcVendor.fonts)
        .pipe(gulp.dest(dist.fonts));
});


gulp.task('build-css-prod', () => {
    return gulp.src(src.css)
        .pipe(autoprefixer())
        .pipe(concat('style.css'))
        .pipe(cssmin())
        // .pipe(rename({suffix: '.min'}))
        .pipe(md5(10, './dist/index.html'))
        .pipe(gulp.dest(dist.css));
});

gulp.task('build-js-prod', () => {
    return gulp.src(src.js)
        .pipe(concat('main.js'))
        .pipe(minifyjs())
        // .pipe(rename({suffix: '.min'}))
        .pipe(md5(10, './dist/index.html'))
        .pipe(gulp.dest(dist.js));
});

gulp.task('build-img-prod', () => {
    return gulp.src(src.img.perm)
        .pipe(imagemin())
        .pipe(gulp.dest(dist.img.perm));
});

gulp.task('build-sprite-prod', () => {
    // Generate our spritesheet
    const spriteData = gulp.src(src.img.sprite).pipe(spritesmith({
        imgName: 'sprite.png',
        cssName: 'sprite.css',
        // retinaImgName: 'sprite@2x.png',
        // padding: 20, // Exaggerated for visibility, normal usage is 1 or 2
    }));

    // Pipe image stream through image optimizer and onto disk
    const imgStream = spriteData.img
    // DEV: We must buffer our stream into a Buffer for `imagemin`
        .pipe(buffer())
        .pipe(imagemin())
        .pipe(gulp.dest(dist.css));

    // Pipe CSS stream through CSS optimizer and onto disk
    const cssStream = spriteData.css
        .pipe(csso())
        .pipe(md5(10, './dist/index.html'))
        .pipe(gulp.dest(dist.css));

    // Return a merged stream to handle both `end` events
    return merge(imgStream, cssStream);
});

gulp.task('zip', () => {
    return gulp.src(dist.root + '**/*')
        .pipe(zip('dist.zip'))
        .pipe(gulp.dest('./'));
});

gulp.task('prod', () => {
    return runSequence(
        'clean-dist',
        'build-html-prod',
        'build-vendor-prod',
        'build-sprite-prod',
        ['build-js-prod', 'build-css-prod'],
        'build-img-prod',
        'zip',
        // 'clean-dist',
    );
});