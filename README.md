# gulp-webfont
Generate custom icon webfonts from SVG files via Gulp. Copied from and inspired by [grunt-webfont](https://github.com/sapegin/grunt-webfont).

Only fontforge engine is supported

## Installation

This plugin requires Gulp 3.9. Note that `ttfautohint` is optional, but your generated font will not be properly hinted if it's not installed. And make sure you don't use `ttfautohint` 0.97 because that version won't work.

### OS X

```
brew install ttfautohint fontforge --with-python
npm install gulp-webfont --save-dev
```

*You may need to use `sudo` for `brew`, depending on your setup.*

## Usage
```
var gulp = require('gulp');
var webfont = require('gulp-webfont');

var webfont_config = {
    types:'eot,woff2,woff,ttf,svg',
    ligatures: true
};

gulp.task('default', function () {
  return gulp.src('test/*.svg')
    .pipe(webfont(webfont_config))
    .pipe(gulp.dest('dist'));
});
```
