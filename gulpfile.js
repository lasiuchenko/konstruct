const { src, dest, watch, parallel, series } = require('gulp')
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const browserSync = require('browser-sync').create();
const fileInclude = require('gulp-file-include');
const svgSprite = require('gulp-svg-sprite');
const ttf2woff2 = require('gulp-ttf2woff2');
const fs = require('fs');
const del           = require('del');
const babel 		    = require('gulp-babel');
const uglify 		    = require('gulp-uglify');
const concat        = require('gulp-concat');
const imagemin = require('gulp-imagemin');
const cheerio       = require('gulp-cheerio');
const replace       = require('gulp-replace');

function browsersync() {
    browserSync.init({
        server: {
            baseDir: 'src/'
        },
        notify: false
    })
}

const styles = () => {
  return src('src/scss/style.scss')
    .pipe(sass({ outputStyle: 'compressed' }))
    .pipe(concat('style.min.css'))
    .pipe(autoprefixer({
      overrideBrowserslist: ['last 10 versions'],
      grid: true
    }))
    .pipe(dest('src/css'))
    .pipe(browserSync.stream())
}

function scripts() {
  return src('src/js/main.js')
  .pipe(babel({
    presets: ['@babel/env']
  }))
    .pipe(concat('main.min.js'))
  .pipe(uglify())
  .pipe(dest('src/js'))
  .pipe(browserSync.stream())
}

const htmlInclude = () => {
  return src(['src/html/*.html'])		
  .pipe(fileInclude({
    prefix: '@',
    basepath: '@file',
  }))
  .pipe(dest('src'))
  .pipe(browserSync.stream());
}

const images = () => {
  return src('src/images/**./*.*')
    .pipe(imagemin([
	    imagemin.gifsicle({interlaced: true}),
	    imagemin.mozjpeg({quality: 75, progressive: true}),
	    imagemin.optipng({optimizationLevel: 5}),
	    imagemin.svgo({
		    plugins: [
			    {removeViewBox: true},
			    {cleanupIDs: false}
		    ]
	    })
    ]))
    .pipe(dest('dist/images'))
}

const svgSprites = () => {
  return src('src/images/icons/**/*.svg')
    .pipe(cheerio({
      run: ($) => {
        $("[fill]").removeAttr("fill");
        $("[stroke]").removeAttr("stroke");
        $("[style]").removeAttr("style");
      },
        parserOptions: { xmlMode: true },
      })
    )
    .pipe(replace('&gt;','>'))
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: '../sprite.svg',
          },
        },
      })
    )
    .pipe(dest('src/images'))
}

const fonts = () => {
  return src('./src/fonts/**.ttf')
    .pipe(ttf2woff2())
    .pipe(dest('src/fonts'))
}

const checkWeight = (fontname) => {
  let weigth = 400;
  switch (true) {
    case /Thin/.test(fontname):
      weigth = 100;
      break;
    case /ExtraLight/.test(fontname):
      weigth = 200;
      break;
    case /Light/.test(fontname):
      weigth = 300;
      break;
    case /Regular/.test(fontname):
      weigth = 400;
      break;
    case /Medium/.test(fontname):
      weigth = 500;
      break;
    case /SemiBold/.test(fontname):
      weigth = 600;
      break;
    case /Bold/.test(fontname):
      weigth = 700;
      break;
    case /ExtraBold/.test(fontname):
      weigth = 800;
      break;
    case /Heavy/.test(fontname):
      weigth = 700;
      break;
    case /Black/.test(fontname):
      weigth = 900;
      break;
    default:
      weigth = 400
  }
  return weigth;
}

const cb = () => {}
let srcFonts = 'src/scss/_fonts.scss';
let appFonts = 'src/fonts/';

const fontsStyle = (done) => {
  let file_content = fs.readFileSync(srcFonts);

  fs.writeFile(srcFonts, '', cb);
  fs.readdir(appFonts, function (err, items) {
    if (items) {
      let c_fontname;
      for (var i = 0; i < items.length; i++) {
        let fontname = items[i].split('.');
        fontname = fontname[0];
        let font = fontname.split('-')[0];
        let weigth = checkWeight(fontname);

        if (c_fontname != fontname) {
          fs.appendFile(srcFonts, '@include font-face("' + font + '", "' + fontname + '", ' + weigth +');\r\n', cb);
        }
        c_fontname = fontname;
      }
    }
  })
  done();
}

const watching = () => {
  watch(['src/scss/**/*.scss'], styles)
  watch(['src/html/**/*.html'], htmlInclude)
  watch(['src/images/**/*.*'], images)
  watch(['src/**/*.html']).on('change', browserSync.reload)
  watch(['src/images/**.svg'], svgSprites)
  watch(['src/js/**/*.js', '!src/js/main.min.js'], scripts)
  watch(['src/fonts/**.ttf'], fonts)
  watch(['src/fonts/**.ttf'], fontsStyle)
}

exports.styles = styles;
exports.htmlInclude = htmlInclude;
exports.watching = watching;

exports.default = parallel(htmlInclude, scripts, fonts, svgSprites, fontsStyle, styles, browsersync, watching)


// const stylesBuild = () => {
//   return src('./src/scss/**/*.scss')
//     .pipe(sass({ outputStyle: 'compressed' }).on('error', notify.onError()))
//     .pipe(rename({
//       suffix: '.min'
//     }))
//     .pipe(autoprefixer({
//       cascade: false,
//     }))
//     .pipe(cleanCSS({
//       level: 2
//     }))
//     .pipe(dest('./app/css'))
// }
// 
// function scriptsBuild() {
//   return src('./src/js/main.js')
//   .pipe(babel({
//     presets: ['@babel/env']
//   }))
//   .pipe(uglify())
//   .pipe(concat('main.min.js'))
//   .pipe(dest('./app/js/'))
// }

function build() {
    return src([
        'src/**/*.html',
        'src/css/style.min.css',
        'src/js/main.min.js',
        'src/fonts/',
    ], {base: 'src'})
    .pipe(dest('dist'))
}

function cleanDist() {
    return del('dist')
}


exports.build = series(cleanDist, images, build)
