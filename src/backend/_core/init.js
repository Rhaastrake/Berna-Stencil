"use strict";

const fs = require("fs");
const path = require("path");

function loadConfig() {
  const backendRoot = path.join(__dirname, "..");
  const configPath = path.join(backendRoot, "config.js");
  const examplePath = path.join(backendRoot, "example.config.js");

  if (fs.existsSync(configPath)) {
    return require(configPath);
  }
  return require(examplePath);
}

/**
 * Turn any thrown error into a 500 response, mirroring set_exception_handler.
 * @param {Error} exception
 * @param {object} config
 * @param {object} Response request-bound helper
 */
function handleException(exception, config, Response) {
  const isDebug = (config.APP_ENV || "production") !== "production";
  Response.error(
    isDebug ? exception.message : "Internal server error",
    500,
    isDebug ? { stack: exception.stack } : null,
  );
}

module.exports = { loadConfig, handleException };
