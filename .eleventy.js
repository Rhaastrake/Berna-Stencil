const esbuild = require("esbuild");
const glob = require("glob");

module.exports = function (eleventyConfig) {
  eleventyConfig.on(
    "eleventy.before",
    async () => {
      const entryPoints = glob.sync(
        "src/js/pages/*.js",
      );

      await esbuild.build({
        entryPoints,
        bundle: true,
        outdir: "_site/js/pages",
        minify: true,
      });
    },
  );

  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addWatchTarget("src/scss");
  eleventyConfig.addPassthroughCopy(
    "src/php/!(configExample.php)",
  );
  eleventyConfig.addPassthroughCopy({
    "node_modules/bootstrap-icons/font/fonts":
      "css/fonts",
  });

  return {
    dir: {
      input: "src",
      includes: "partials",
      layouts: "layouts",
    },
  };
};
