"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { createResponse, HALT } = require("./modules/Response");
const RateLimiter = require("./modules/RateLimiter");
const { loadConfig, handleException } = require("./init");

const CORE_PATH = __dirname;

const config = loadConfig();

const APP_ENV = config.APP_ENV || "production";

const DOCUMENT_ROOT =
  process.env.DOCUMENT_ROOT || path.join(CORE_PATH, "..", "..");

const basePublic = path.join(CORE_PATH, "..", "api", "public");
const baseProtected = path.join(CORE_PATH, "..", "api", "protected");

function hashEquals(known, given) {
  const a = Buffer.from(String(known));
  const b = Buffer.from(String(given));
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function send404(res) {
  res.statusCode = 404;
  const errorPage = DOCUMENT_ROOT ? path.join(DOCUMENT_ROOT, "404.html") : "";
  if (errorPage && fs.existsSync(errorPage)) {
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.end(fs.readFileSync(errorPage));
  } else {
    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.end(
      "<h1>404 Not Found</h1>The requested URL was not found on this server.",
    );
  }
}

function readBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw) return resolve({ raw: "", json: null });
      let json = null;
      try {
        json = JSON.parse(raw);
      } catch (e) {
        json = null;
      }
      resolve({ raw, json });
    });
    req.on("error", () => resolve({ raw: "", json: null }));
  });
}

async function handleRequest(req, res) {
  const Response = createResponse(res);

  try {
    const method = req.method;
    const parsedUrl = new URL(req.url, "http://localhost");
    let uri = parsedUrl.pathname;

    uri = uri.replace(/^\/api/, "");
    uri = uri.replace(/\/+$/, "");
    if (uri === "") uri = "/";

    const parts = uri.split("/").filter((p) => p !== "");

    for (const part of parts) {
      if (part === ".." || part === ".") {
        Response.error("Bad Request", 400);
      }
    }

    let endpointFile = null;
    let isProtected = false;

    const checkParts = parts.slice();
    const params = [];

    while (checkParts.length > 0) {
      const relativePath = checkParts.join("/") + ".js";

      const publicCandidate = path.join(basePublic, relativePath);
      if (fs.existsSync(publicCandidate)) {
        endpointFile = publicCandidate;
        isProtected = false;
        break;
      }

      const protectedCandidate = path.join(baseProtected, relativePath);
      if (fs.existsSync(protectedCandidate)) {
        endpointFile = protectedCandidate;
        isProtected = true;
        break;
      }

      params.unshift(checkParts.pop());
    }

    if (!endpointFile) {
      send404(res);
      return;
    }

    const base = isProtected ? baseProtected : basePublic;
    let endpointPath = endpointFile
      .split(path.sep)
      .join("/")
      .replace(base.split(path.sep).join("/"), "")
      .replace(/\.js$/, "")
      .replace(/^\//, "");

    res.setHeader("Content-Type", "application/json; charset=UTF-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    );
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Api-Key");

    const originsForEndpoint =
      (config.CUSTOM_ENDPOINT_ORIGINS &&
        config.CUSTOM_ENDPOINT_ORIGINS[endpointPath]) ||
      config.GENERAL_ALLOWED_ORIGINS ||
      [];

    const origin = req.headers["origin"] || "";

    if (origin !== "" && originsForEndpoint.includes(origin)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
    } else if (originsForEndpoint.includes("*")) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }

    if (method === "OPTIONS") {
      res.statusCode = 204;
      res.end();
      return;
    }

    // Rate limit: 60 requests / 60 seconds per IP
    const ip =
      (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
      req.socket.remoteAddress ||
      "";
    RateLimiter.check(ip, 60, 60, Response, res);

    if (isProtected) {
      const validKey =
        (config.CUSTOM_ENDPOINT_KEYS &&
          config.CUSTOM_ENDPOINT_KEYS[endpointPath]) ||
        config.GENERAL_API_KEY ||
        "";
      const apiKey = req.headers["x-api-key"] || "";

      if (validKey === "" || !hashEquals(validKey, apiKey)) {
        Response.error("Unauthorized. X_API_KEY is incorrect or missing", 403);
      }
    }

    const handler = require(endpointFile);

    const context = {
      method, // HTTP method
      requestParams: params, // leftover URL segments (route params)
      Response, // request-bound Response helper
      query: Object.fromEntries(parsedUrl.searchParams), // parsed query string
      body: body.json, // parsed JSON body (or null)
      rawBody: body.raw, // raw body string
      headers: req.headers,
      req,
      res,
      config,
      CORE_PATH,
    };

    await handler(context);

    if (!res.writableEnded) {
      res.end();
    }
  } catch (err) {
    if (err === HALT) {
      return;
    }
    try {
      handleException(err, config, Response);
    } catch (inner) {
      if (inner === HALT) return;
      if (!res.writableEnded) {
        res.statusCode = 500;
        res.end(
          JSON.stringify({
            status: "error",
            message: "Internal server error",
            code: 500,
          }),
        );
      }
    }
  }
}

const HOST = process.env.HOST || "127.0.0.1";
const PORT = parseInt(process.env.PORT || "3000", 10);

const server = http.createServer(handleRequest);

server.listen(PORT, HOST, () => {
  console.log(
    `[backend-node] listening on http://${HOST}:${PORT} (env: ${APP_ENV})`,
  );
});

module.exports = server;
