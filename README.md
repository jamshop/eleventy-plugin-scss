# Eleventy Plugin - SCSS

Install:

```
npm install @jamshop/eleventy-plugin-scss
```

## Usage

In you main config `.eleventy.js`: 
```js
const pluginSCSS = require("@jamshop/eleventy-plugin-scss");

module.exports = (eleventyConfig) => {
  eleventyConfig.addPlugin(pluginSCSS, {
    entryPoints: {
      main: "src/scss/main.scss"
    }
    output: "_site/css"
  });
  // and the rest of your config
};
```

This will transpile SCSS in`src/scss/main.scss` to `_site/css/main.css`. 

Their are 2 options, `entryPoints` which is required and should contain a set of key/value pairs. The key represents the output file name (without file extensions) and the value is the path to the source file. 

The second option `output` is optional although required in most situations. This is the output directory for the compiled CSS. The generated file path will be a combination of the key and the `output` option.

The plugin will take note of any files changed and add them to the watcher. It's smart about re-building only changed files.

## Bonus

It also comes with a shortcode:

```js
const pluginSCSS = require("@jamshop/eleventy-plugin-scss");

module.exports = (eleventyConfig) => {
  eleventyConfig.addPairedShortcode("scss", pluginSCSS.scssShortcode)
  // and the rest of your config
};
```

Get your scss on in templates with a shortcode (this example uses handlebars):

```
{{#scss}}  
  body {
    background: lighten(red, 40);
  }
{{/scss}}
```

## Todo: 

 - Add a transform
