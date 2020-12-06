const test = require("ava");
const pluginSCSS = require("../index");
const TemplateConfig = require("@11ty/eleventy/src/TemplateConfig");
const defaultConfig = require("@11ty/eleventy/src/defaultConfig.js");
const eleventyConfig = require("@11ty/eleventy/src/EleventyConfig");
const TemplateRender = require("@11ty/eleventy/src/TemplateRender");
const EleventyExtensionMap = require("@11ty/eleventy/src/EleventyExtensionMap");

test("does not thow if missing data for plugin", (t) => {
  t.notThrows(function() {
    eleventyConfig.addPlugin(pluginSCSS);
  });
});

function getNewTemplateRender(name, inputDir) {
  let tr = new TemplateRender(name, inputDir);
  tr.extensionMap = new EleventyExtensionMap();
  return tr;
}

test("pluginSCSS global data matches snapshot", (t) => {
  eleventyConfig.addPlugin(pluginSCSS, {
    entryPoints: { main: require.resolve("./test.scss") },
  });
  let cfg = new TemplateConfig(defaultConfig, "./config.js").getConfig();
  if(cfg.globalData) {
    t.not(Object.keys(cfg.globalData).indexOf("scss"), -1);
    t.snapshot(cfg.globalData);
  } else {
    t.pass();
  }
});

test("Handlebars SCSS Shortcode", async (t) => {
  let tr = getNewTemplateRender("hbs");
  tr.engine.addPairedShortcodes({
    scss: pluginSCSS.scssShortcode,
  });

  let fn = await tr.getCompiledTemplate(
    `{{#scss}}  
      $color: purple;
      body {
        background: $color;
      }
    {{/scss}}`
  );

  t.snapshot(await fn());
});

test("pluginSCSS error overlay in scssShortcode", (t) => {
  const result = pluginSCSS.scssShortcode("This is not valid SCSS");
  t.snapshot(result);
});
