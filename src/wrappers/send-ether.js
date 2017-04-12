"use strict";

var abi = require("augur-abi");
var transact = require("../transact/transact");

function sendEther(to, value, from, onSent, onSuccess, onFailed) {
  return function (dispatch) {
    if (to && to.constructor === Object) {
      value = to.value;
      from = to.from;
      if (to.onSent) onSent = to.onSent;
      if (to.onSuccess) onSuccess = to.onSuccess;
      if (to.onFailed) onFailed = to.onFailed;
      to = to.to;
    }
    return dispatch(transact({
      from: from,
      to: to,
      value: abi.fix(value, "hex"),
      returns: "null",
      gas: "0xcf08"
    }, onSent, onSuccess, onFailed));
  };
}

module.exports = sendEther;
