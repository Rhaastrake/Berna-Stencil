const esbuild = require("esbuild");
const glob = require("glob");
const Image = require("@11ty/eleventy-img");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = "out";

module.exports = function (eleventyConfig) {

  function copyRecursiveSync(src, dest) {
    if (!fs.existsSync(src)) return;
    if (src.includes('.git')) return;
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      for (const child of fs.readdirSync(src)) {
        copyRecursiveSync(path.join(src, child), path.join(dest, child));
      }
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }

  eleventyConfig.on("eleventy.before", () => {
    copyRecursiveSync("src/backend", `${OUTPUT_DIR}/backend`);
  });

  eleventyConfig.addPassthroughCopy("src/frontend/.htaccess");
  eleventyConfig.addPassthroughCopy("src/frontend/web.config");
  eleventyConfig.addPassthroughCopy("src/frontend/assets");
  eleventyConfig.addPassthroughCopy("src/frontend/robots.txt");

  eleventyConfig.addPassthroughCopy({
    "node_modules/bootstrap/dist/js/bootstrap.bundle.min.js": "js/bootstrap.bundle.min.js",
    "node_modules/bootstrap-icons/font/fonts": "css/fonts",

    // Foundation
    // "node_modules/foundation-sites/dist/js/foundation.min.js": "js/foundation.min.js",

    // UIkit
    // "node_modules/uikit/dist/js/uikit.min.js": "js/uikit.min.js",
    // "node_modules/uikit/dist/js/uikit-icons.min.js": "js/uikit-icons.min.js",

    // Bulma — CSS only, no JS passthrough needed
  });

  eleventyConfig.addShortcode("image", async function (src, alt) {
    let metadata = await Image(src, {
      widths: [320, 480, 720, 1280, 1920, 2048, 2560, 3840, 4096, 7680],
      formats: ["webp", "jpeg"],
      outputDir: `${OUTPUT_DIR}/assets/images/`,
      urlPath: "/assets/images/",
    });

    return Image.generateHTML(metadata, {
      alt,
      sizes: "(max-width: 768px) 100vw, 50vw",
      loading: "lazy",
      decoding: "async",
    });
  });

  eleventyConfig.addWatchTarget("./src/frontend/scss");
  eleventyConfig.addWatchTarget("./src/frontend/routes");
  eleventyConfig.addWatchTarget("./src/frontend/data");

  eleventyConfig.setServerOptions({
  watch: [`${OUTPUT_DIR}/js/**/*.js`]
  });

  return {
    dir: {
      input: "src/frontend",
      output: OUTPUT_DIR,
      includes: "components",
      layouts: "layouts",
      data: "data",
    },
  };
};