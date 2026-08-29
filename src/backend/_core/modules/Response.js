"use strict";

const HALT = Symbol("RESPONSE_HALT");

function jsonEncode(obj) {
  return JSON.stringify(obj);
}

function createResponse(res) {
  return {
    success(data = null, code = 200) {
      res.statusCode = code;
      res.setHeader("Content-Type", "application/json; charset=UTF-8");
      res.end(
        jsonEncode({
          status: "success",
          data: data,
        }),
      );
      throw HALT;
    },

    error(message, code = 400, details = null) {
      res.statusCode = code;
      res.setHeader("Content-Type", "application/json; charset=UTF-8");
      const body = {
        status: "error",
        message: message,
        code: code,
      };
      if (details !== null) {
        body.details = details;
      }
      res.end(jsonEncode(body));
      throw HALT;
    },

    noContent() {
      res.statusCode = 204;
      res.end();
      throw HALT;
    },
  };
}

module.exports = { createResponse, HALT };
