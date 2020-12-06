const sass = require("sass");
const CleanCSS = require("clean-css");
require("css.escape");
const path = require("path");
const { outputFileSync } = require("fs-extra");
const addCachedGlobalData = require("./addCachedGlobalData");
const CSSErrorOverlay = require("./errorOverlay");

const pathRel = (file) => path.relative(process.cwd(), file);

const minifyCSS = (css) => {
  const minified = new CleanCSS().minify(css);
  if (!minified.styles) {
    // At any point where we return CSS if it
    // errors we try to show an overlay.
    console.error("Error minifying stylesheet.");
    console.log(minified.errors);
    return CSSErrorOverlay(minified.errors[0]);
  }
  return minified.styles;
};

// The input can be anything accepted by renderSync. E.g.
// {data: "css { ... }"} OR { file: "path/to.css" }
const compileScss = (options) => {
  let result;
  try {
    result = sass.renderSync(options);
  } catch (error) {
    result = error;
  }

  if (!result || !result.css) {
    console.error("Error compiling stylesheet.");
    // We're using the same shape returned by renderSync
    // if css is a string result.css.toString() will still work
    return {
      ...result,
      error: result && result.message,
      css: CSSErrorOverlay(
        (result && result.message) || "Error compiling stylesheet."
      ),
    };
  }
  return result;
};

const compileScssEntryPoints = (
  eleventyConfig,
  { entryPoints = {}, output, ...options } = {}
) => {
  let watchPaths = [];
  if (Object.entries(entryPoints).length === 0) {
    if (eleventyConfig.addGlobalData) {
      // If the plugin is used a key may be expected by the theme
      // return an empty object if no scss
      eleventyConfig.addGlobalData("scss", {});
    }
    console.log(`No scss entryPoints found.`);
    console.log(
      `Plugin expects data to be in the shape: { entryPoints: { name: "path/to/file.scss"} }`
    );
    return;
  }
  const data = {};
  const keys = Object.keys(entryPoints);
  for (let index = 0; index < keys.length; index++) {
    const key = keys[index];
    const result = compileScss({ file: entryPoints[key], ...options });
    let css = result.css.toString();
    css = minifyCSS(css);
    if (output) {
      let outfile = path.join(output, `${key}.css`);
      outputFileSync(outfile, css);
    }

    // We are getting the includedFiles from the SCSS renderSync result
    // We use this to add watch paths to 11ty because the CSS files
    // might be outside the project root
    // We want to capture all files use to compile scss not just the entry
    if (result && result.stats) {
      watchPaths = [
        ...watchPaths,
        ...result.stats.includedFiles.map((file) => pathRel(file)),
      ];
    } else if (result && result.file) {
      watchPaths = [...watchPaths, pathRel(result.file)];
    }
    data[key] = css;
  }

  watchPaths.forEach((watchPath) => {
    eleventyConfig.addWatchTarget(watchPath);
  });

  return { data, watchPaths };
};

const scssShortcode = (content) => {
  const result = compileScss({ data: content });
  const minified = minifyCSS(result.css.toString());
  return minified;
};

const scssPlugin = (eleventyConfig, options) => {
  let watchedPaths = [];

  if (eleventyConfig.addGlobalData) {
    addCachedGlobalData(
      eleventyConfig,
      () => {
        const { data, watchPaths } = compileScssEntryPoints(
          eleventyConfig,
          options
        );
        watchedPaths = [...new Set([...watchedPaths, ...watchPaths])];
        return data;
      },
      "scss"
    );
  } else {
    const { watchPaths } = compileScssEntryPoints(eleventyConfig, options);
    watchedPaths = [...new Set([...watchedPaths, ...watchPaths])];
  }

  eleventyConfig.on("beforeWatch", (changedFiles) => {
    console.log({ watchedPaths, changedFiles: changedFiles.map((file) => pathRel(file)) });

    // Run me before --watch or --serve re-runs
    if (
      watchedPaths.some((watchPath) =>
        changedFiles.map((file) => pathRel(file)).includes(watchPath)
      )
    ) {
      const { watchPaths } = compileScssEntryPoints(eleventyConfig, options);
      watchedPaths = [...new Set([...watchedPaths, ...watchPaths])];
    }
  });

  eleventyConfig.addPairedShortcode("scss", scssShortcode);
};

scssPlugin.scssShortcode = scssShortcode;
module.exports = scssPlugin;
