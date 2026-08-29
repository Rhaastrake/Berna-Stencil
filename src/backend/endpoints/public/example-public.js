"use strict";

module.exports = ({ method, requestParams, Response }) => {
  if (method !== "GET") {
    Response.error("Method not allowed", 405);
  }

  //
  // Your endpoint logic here. You can access route parameters in requestParams
  //

  Response.success({
    message: "Public endpoint is working",
    params: requestParams,
  });
};
