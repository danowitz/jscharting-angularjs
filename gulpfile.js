/**
 * JSCharting AngularJS Wrapper - Build Configuration
 *
 * Tasks:
 *   gulp build      - Development build with source maps
 *   gulp build:prod - Production build (minified)
 *   gulp watch      - Watch for changes and rebuild
 *   gulp clean      - Clean dist folder
 */

const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const sourcemaps = require('gulp-sourcemaps');
const rename = require('gulp-rename');
const header = require('gulp-header');
const del = require('del');

const pkg = require('./package.json');

// Banner for distribution files
const banner = `/**
 * ${pkg.name} v${pkg.version}
 * ${pkg.description}
 *
 * Copyright (c) ${new Date().getFullYear()}
 * License: ${pkg.license}
 */
`;

// Source files in correct concatenation order
const sourceFiles = [
  // Core module must come first
  'src/core/module.js',

  // Core services and providers
  'src/core/performance.service.js',
  'src/core/module-loader.provider.js',
  'src/core/config.provider.js',
  'src/core/chart-factory.provider.js',
  'src/core/data.service.js',
  'src/core/config-builder.service.js',
  'src/core/event.service.js',

  // Core directive
  'src/core/chart.directive.js',

  // Widgets module
  'src/widgets/module.js',
  'src/widgets/linear.directive.js',
  'src/widgets/circular.directive.js',
  'src/widgets/bar-column.directive.js',

  // Maps module
  'src/maps/module.js',
  'src/maps/map.directive.js',

  // Grid module
  'src/grid/module.js',
  'src/grid/grid.directive.js',

  // Type-specific directives
  'src/types/organizational.directive.js',
  'src/types/calendar.directive.js',
  'src/types/gantt.directive.js',
  'src/types/radar.directive.js',

  // Main entry point (registers the combined module)
  'src/jscharting-angularjs.js'
];

// Clean dist folder
function clean() {
  return del(['dist/*']);
}

// Development build with source maps
function buildDev() {
  return gulp.src(sourceFiles, { allowEmpty: true })
    .pipe(sourcemaps.init())
    .pipe(concat('jscharting-angularjs.js'))
    .pipe(header(banner))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('dist'));
}

// Production build (minified)
function buildProd() {
  return gulp.src(sourceFiles, { allowEmpty: true })
    .pipe(concat('jscharting-angularjs.js'))
    .pipe(header(banner))
    .pipe(gulp.dest('dist'))
    .pipe(uglify({
      output: {
        comments: /^!/
      }
    }))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest('dist'));
}

// Watch for changes
function watchFiles() {
  gulp.watch('src/**/*.js', buildDev);
}

// Export tasks
exports.clean = clean;
exports.build = gulp.series(clean, buildDev);
exports['build:prod'] = gulp.series(clean, buildProd);
exports.watch = gulp.series(buildDev, watchFiles);
exports.default = exports.build;
