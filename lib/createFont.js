var crypto = require('crypto');
var md5 = crypto.createHash('md5');
var _ = require('lodash');
var path = require('path');
var wf = require('./util');
var fs = require('fs');
var async = require('async');
var mkdirp = require('mkdirp');
var chalk = require('chalk');
var ttf2woff2 = require('ttf2woff2');


var createFont = function (options, files, allDone)  {
  
  //var allDone = this.async();
  
  /**
   * Calculate hash to flush browser cache.
   * Hash is based on source SVG files contents, task options and grunt-webfont version.
   *
   * @return {String}
   */
  function getHash() {
  	// Source SVG files contents
  	o.files.forEach(function(file) {
  		md5.update(fs.readFileSync(file, 'utf8'));
  	});

  	// Options
  	md5.update(JSON.stringify(o));

  	// grunt-webfont version
  	var packageJson = require('../package.json');
  	md5.update(packageJson.version);

  	// Templates
  	if (o.template) {
  		md5.update(fs.readFileSync(o.template, 'utf8'));
  	}
  	if (o.htmlDemoTemplate) {
  		md5.update(fs.readFileSync(o.htmlDemoTemplate, 'utf8'));
  	}

  	return md5.digest('hex');
  }
  
  /**
		 * Find next unused codepoint.
		 *
		 * @return {Integer}
		 */
		function getNextCodepoint() {
			while (_.includes(o.codepoints, currentCodepoint)) {
				currentCodepoint++;
			}
			return currentCodepoint;
		}
    
    /**
		 * Save hash to cache file.
		 *
		 * @param {String} name Task name (webfont).
		 * @param {String} target Task target name.
		 * @param {String} hash Hash.
		 */
		function saveHash(name, target, hash) {
			var filepath = getHashPath(name, target);
			mkdirp.sync(path.dirname(filepath));
			fs.writeFileSync(filepath, hash);
		}
    
  /**
  	 * Read hash from cache file or `null` if file don’t exist.
  	 *
  	 * @param {String} name Task name (webfont).
  	 * @param {String} target Task target name.
  	 * @return {String}
  	 */
  	function readHash(name, target) {
      var filepath = getHashPath(name, target);
      
      return null;
  		if (fs.existsSync(filepath)) {
  			return fs.readFileSync(filepath, 'utf8');
  		}
  		return null;
  	}

  	/**
  	 * Return path to cache file.
  	 *
  	 * @param {String} name Task name (webfont).
  	 * @param {String} target Task target name.
  	 * @return {String}
  	 */
  	function getHashPath(name, target) {
  		return path.join(o.cache, name, target, 'hash');
  	}
    
    /**
		 * Generate font using selected engine
		 *
		 * @param {Function} done
		 */
		function generateFont(done) {
			var engine = require('./engines/' + o.engine);
			engine(o, function(result) {
				if (result === false) {
					// Font was not created, exit
					completeTask();
					return;
				}

				if (result) {
					o = _.extend(o, result);
				}

				done();
			});
		}
    
    /**
		 * Converts TTF font to WOFF2.
		 *
		 * @param {Function} done
		 */
		function generateWoff2Font(done) {
			if (!has(o.types, 'woff2')) {
				done();
				return;
			}

			// Read TTF font
			var ttfFontPath = wf.getFontPath(o, 'ttf');
			var ttfFont = fs.readFileSync(ttfFontPath);

			// Remove TTF font if not needed
			if (!has(o.types, 'ttf')) {
				fs.unlinkSync(ttfFontPath);
			}

			// Convert to WOFF2
			var woffFont = ttf2woff2(ttfFont);

			// Save
			var woff2FontPath = wf.getFontPath(o, 'woff2');
			fs.writeFile(woff2FontPath, woffFont, done);
		}
    
    /**
		 * Print log
		 *
		 * @param {Function} done
		 */
		function printDone(done) {
			console.log('Font ' + chalk.cyan(o.fontName) + ' with ' + o.glyphs.length + ' glyphs created.');
			done();
		}
    
    /**
		 * Call callback function if it was specified in the options.
		 */
		function completeTask() {
			if (o && _.isFunction(o.callback)) {
				o.callback(o.fontName, o.types, o.glyphs, o.hash);
			}
			allDone(o);
		}
  
  // Options
		var o = {
      name: 'webfont',
      target: 'target',
			fontBaseName: options.font || 'icons',
			//destCss: options.destCss || params.destCss || params.dest,
			dest: "dist",
			relativeFontPath: options.relativeFontPath,
			addHashes: options.hashes !== false,
			addLigatures: options.ligatures === true,
			template: options.template,
			syntax: options.syntax || 'bem',
			templateOptions: options.templateOptions || {},
			stylesheet: options.stylesheet || path.extname(options.template || '').replace(/^\./, '') || 'css',
			htmlDemo: options.htmlDemo !== false,
			htmlDemoTemplate: options.htmlDemoTemplate,
			htmlDemoFilename: options.htmlDemoFilename,
			styles: optionToArray(options.styles, 'font,icon'),
			types: optionToArray(options.types, 'eot,woff,ttf'),
			order: optionToArray(options.order, wf.fontFormats),
			embed: options.embed === true ? ['woff'] : optionToArray(options.embed, false),
			rename: options.rename || path.basename,
			engine: options.engine || 'fontforge',
			autoHint: options.autoHint !== false,
			codepoints: options.codepoints,
			codepointsFile: options.codepointsFile,
			startCodepoint: options.startCodepoint || wf.UNICODE_PUA_START,
			ie7: options.ie7 === true,
			normalize: options.normalize === true,
			round: options.round !== undefined ? options.round : 10e12,
			fontHeight: options.fontHeight !== undefined ? options.fontHeight : 512,
			descent: options.descent !== undefined ? options.descent : 64,
			cache: options.cache || path.join(__dirname, '..', '.cache'),
			callback: options.callback,
			customOutputs: options.customOutputs
		};

		o = _.extend(o, {
			fontName: o.fontBaseName,
			destHtml: options.destHtml || o.destCss,
			fontfaceStyles: has(o.styles, 'font'),
			baseStyles: has(o.styles, 'icon'),
			extraStyles: has(o.styles, 'extra'),
			files: files,
			glyphs: []
		});
    
    o.hash = getHash();
		o.fontFilename = template(options.fontFilename || o.fontBaseName, o);

		// “Rename” files
		o.glyphs = o.files.map(function(file) {
			return o.rename(file).replace(path.extname(file), '');
		});
    // Check or generate codepoints
		// @todo Codepoint can be a Unicode code or character.
		var currentCodepoint = o.startCodepoint;
		if (!o.codepoints) o.codepoints = {};
		if (o.codepointsFile) o.codepoints = readCodepointsFromFile();
		o.glyphs.forEach(function(name) {
			if (!o.codepoints[name]) {
				o.codepoints[name] = getNextCodepoint();
			}
		});
		if (o.codepointsFile) saveCodepointsToFile();

    // Check if we need to generate font
		var previousHash = readHash(o.name, o.target);
		//console.log('New hash:', o.hash, '- previous hash:', previousHash);
		if (o.hash === previousHash) {
			console.log('Config and source files weren’t changed since last run, checking resulting files...');
			var regenerationNeeded = false;

			var generatedFiles = wf.generatedFontFiles(o);
			if (!generatedFiles.length){
				regenerationNeeded = true;
			}
			else {
				generatedFiles.push(getDemoFilePath());
				generatedFiles.push(getCssFilePath());

				regenerationNeeded = _.some(generatedFiles, function(filename) {
					if (!filename) return false;
					if (!fs.existsSync(filename)) {
						console.log('File', filename, ' is missed.');
						return true;
					}
					return false;
				});
			}
			if (!regenerationNeeded) {
				console.log('Font ' + chalk.cyan(o.fontName) + ' wasn’t changed since last run.');
				completeTask();
				return;
			}
		}

		// Save new hash and run
		saveHash(o.name, o.target, o.hash);
		async.waterfall([
			//createOutputDirs,
			//cleanOutputDir,
			generateFont,
			generateWoff2Font,
			//generateStylesheet,
			//generateDemoHtml,
			//generateCustomOutputs,
			printDone
		], completeTask);
    
    return null;
}

/**
 * Convert a string of comma separated words into an array
 *
 * @param {String} val Input string
 * @param {String} defVal Default value
 * @return {Array}
 */
function optionToArray(val, defVal) {
	if (val === undefined) {
		val = defVal;
	}
	if (!val) {
		return [];
	}
	if (typeof val !== 'string') {
		return val;
	}
	return val.split(',').map(_.trim);
}

/**
 * Check if a value exists in an array
 *
 * @param {Array} haystack Array to find the needle in
 * @param {Mixed} needle Value to find
 * @return {Boolean} Needle was found
 */
function has(haystack, needle) {
	return haystack.indexOf(needle) !== -1;
}
/**
 * Basic template function: replaces {variables}
 *
 * @param {Template} tmpl Template code
 * @param {Object} context Values object
 * @return {String}
 */
function template(tmpl, context) {
	return tmpl.replace(/\{([^\}]+)\}/g, function(m, key) {
		return context[key];
	});
}


module.exports.createFont = createFont;