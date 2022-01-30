const { src, dest, watch, parallel, series } = require('gulp')

const sass 			= require('gulp-sass')(require('sass'));
const cleanCSS 	= require('gulp-clean-css');
const rename 		= require('gulp-rename');
const babel 		= require('gulp-babel');
const uglify 		= require('gulp-uglify');
const concat 		= require('gulp-concat');
const del 			= require('del');

const path = {
  scss: {
    src: 'src/scss/**/*.scss',
    dest: 'dist/css/'
  },
  scripts: {
    src: 'src/js/**/*.js',
    dest: 'dist/js/'
  }
}

function cleanDist() {
	return del('dist')
}

function styles() {
	return src(path.scss.src)
		.pipe(sass({ outputStyle: 'compressed' }))
		.pipe(cleanCSS())
		.pipe(rename({
			basename: 'styles',
			suffix: '.min'
		}))
		.pipe(dest(path.scss.dest))
}

function scripts() {
	return src(path.scripts.src, {
		sourcemaps: true
	})
	.pipe(babel())
	.pipe(uglify())
	.pipe(concat('main.min.js'))
	.pipe(dest(path.scripts.dest))
}

function watching() {
	watch(path.scss.src, styles);
	watch(path.scripts.src, scripts);
}

const build = series(cleanDist, parallel(styles, scripts), watching)

exports.cleanDist = cleanDist;
exports.styles = styles;
exports.watch = watching;
exports.scripts = scripts;
exports.build = build;

