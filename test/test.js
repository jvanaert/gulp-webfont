var gulp = require("gulp");
var webfont = require("../index.js");
var mocha = require("mocha");
var assert = require("assert");
var fs = require("fs");

/* define a task to generate the fonts */
gulp.task("default", function() {
  return gulp
    .src("./test/icons/*.svg")
    .pipe(
      webfont({
        types: "woff,ttf",
        ligatures: true,
        normalize: true
      })
    )
    .pipe(gulp.dest("./test"));
});

// this will run the gulp task.
// after the task, a ttf file and wof file shoud exist
it("generates a font", function(done) {
  gulp.run(function(err) {
    // no errors should be returned
    assert.equal(err, null);

    // two icons files should be generated
    assert(fs.existsSync("./test/icons.ttf"), true);
    assert(fs.existsSync("./test/icons.woff"), true);

    done();
  });
});

gulp.run();
