"use strict";

var assign = require("lodash.assign");

var initialState = {
  connect: false,
  tx: false,
  broadcast: false,
  nonce: false,
  sync: false
};

module.exports = function (debug, action) {
  var debugOptions;
  if (typeof debug === "undefined") {
    return initialState;
  }
  switch (action.type) {
    case "SET_DEBUG_OPTIONS":
      return assign({}, debug, action.options);
    case "RESET_DEBUG_OPTIONS":
      return initialState;
    default:
      return debug;
  }
};
