"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

class RateLimiter {
  /**
   * @param {string} ip
   * @param {number} maxRequests
   * @param {number} windowSeconds
   * @param {object} Response  request-bound helper from createResponse(res)
   * @param {object} res       raw http response (to set Retry-After)
   */
  static check(ip, maxRequests = 60, windowSeconds = 60, Response, res) {
    const cacheDir = path.join(__dirname, "..", "..", "cache");

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true, mode: 0o755 });
    }

    const hash = crypto.createHash("md5").update(ip).digest("hex");
    const cacheFile = path.join(cacheDir, "rl_" + hash + ".json");
    const now = Math.floor(Date.now() / 1000);
    let data = [];

    if (fs.existsSync(cacheFile)) {
      try {
        data = JSON.parse(fs.readFileSync(cacheFile, "utf8")) || [];
      } catch (e) {
        data = [];
      }
    }

    data = data.filter((ts) => ts > now - windowSeconds);
    data.push(now);

    fs.writeFileSync(cacheFile, JSON.stringify(data));

    if (data.length > maxRequests) {
      res.setHeader("Retry-After", String(windowSeconds));
      Response.error("Too Many Requests", 429);
    }
  }
}

module.exports = RateLimiter;
