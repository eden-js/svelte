
// Require dependencies
const fs         = require('fs-extra');
const os         = require('os');
const gulp       = require('gulp');
const gulpRename = require('gulp-rename');

// require dependencies
const glob   = require('@edenjs/glob');
const config = require('config');
const svelte = require('svelte/compiler');

/**
 * Build svelte task class
 *
 * @task     svelte
 * @after    javascript
 * @priority 1
 */
class SvelteTask {
  /**
   * Construct svelte task class
   *
   * @param {gulp} gulp
   */
  constructor(runner) {
    // Set private variables
    this._runner = runner;

    // Bind methods
    this.run = this.run.bind(this);
    this.watch = this.watch.bind(this);

    // Bind private methods
    this._views = this._views.bind(this);
  }

  /**
   * Run svelte task
   *
   * @return {Promise}
   */
  async run(files) {
    // Create header
    let head      = ['// AUTOMATICALLY GENERATED EDENJS VIEW ENGINE //', ''];
    const include = config.get('view.include') || {};

    // Loop include
    Object.keys(include).forEach((key) => {
      // push require head
      head.push(`const ${key} = require('${include[key]}');`);
    });

    // join head
    head = head.join(os.EOL);

    // Await views
    await this._views(files);

    // get files
    const entries = await glob([
      `${global.appRoot}/data/cache/svelte/js/**/*.js`,
      `${global.appRoot}/data/cache/svelte/**/*.svelte`,
      `!${global.appRoot}/data/cache/svelte/email/**/*.svelte`,
    ]);

    // ems require
    // can be removed with --experimental-modules flag
    const esmRequire = require('esm')(module);

    // map files
    const compiledFiles = (await Promise.all(entries.map(async (entry) => {
      // compile if svelte
      if (entry.includes('.svelte')) {
        // read file
        const item = await fs.readFile(entry, 'utf8');

        // code/map
        const { js, css } = await svelte.compile(item, {
          filename   : entry,
          hydratable : true,
        });

        // write compiled
        await fs.writeFile(`${entry}.js`, js.code);
        await fs.writeFile(`${entry}.map`, js.map);

        // return compiled
        return {
          orig : entry,
          name : esmRequire(`${entry}.js`).default.name, // todo this sucks
          file : `${entry}.js`,
        };
      }

      // return entry
      return null;
    }))).filter(e => e);

    console.log(compiledFiles);
  }

  /**
   * Watch task
   *
   * @return {Array}
   */
  watch() {
    // Return files
    return ['views/js/**/*', 'views/**/*.svelte'];
  }

  /**
   * Run svelte views
   *
   * @param {Array} files
   *
   * @return {Promise}
   * @private
   */
  async _views(files) {
    // Remove views cache directory
    await fs.remove(`${global.appRoot}/data/cache/svelte`);

    // Run gulp
    let job = gulp.src(files);

    // pipe rename
    job = job.pipe(gulpRename((filePath) => {
      // Get amended
      let amended = filePath.dirname.replace(/\\/g, '/').split('bundles/');

      // Correct path
      amended = amended.pop();
      amended = amended.split('views');
      amended.shift();
      amended = amended.join('views');

      // Alter amended
      filePath.dirname = amended; // eslint-disable-line no-param-reassign
    }));

    // pipe to svelte folder
    job = job.pipe(gulp.dest(`${global.appRoot}/data/cache/svelte`));

    // Wait for job to end
    await new Promise((resolve, reject) => {
      job.once('end', resolve);
      job.once('error', reject);
    });
  }
}

/**
 * Export svelte task
 *
 * @type {SvelteTask}
 */
module.exports = SvelteTask;
