"use strict";

var encodeArray = require("./abi/encode-array");
var encodePrimitive = require("./abi/encode-primitive");

var numRequests = 1;

var makeRequestPayload = function (command, params, prefix) {
  var payload, action;
  if (prefix === "null" || prefix === null) {
    action = command.toString();
  } else {
    action = (prefix || "eth_") + command.toString();
  }
  payload = {
    id: numRequests++,
    jsonrpc: "2.0",
    method: action
  };
  if (params === undefined || params === null) params = [];
  // if (this.debug.broadcast && params.debug) {
  //   payload.debug = clone(params.debug);
  //   delete params.debug;
  // }
  payload.params = (params instanceof Array) ? encodeArray(params) : [encodePrimitive(params)];
  return payload;
};

module.exports = makeRequestPayload;
