/**
 * Basic JSON RPC methods for Ethereum
 * @author Jack Peterson (jack@tinybike.net)
 */

"use strict";

var NODE_JS = (typeof module !== "undefined") && process && !process.browser;

if (NODE_JS) {
    var request = require("sync-request");
    var XHR2 = require("xhr2");
}
var BigNumber = require("bignumber.js");
var abi = require("augur-abi");

BigNumber.config({ MODULO_MODE: BigNumber.EUCLID });

// asynchronous loop
function loop(list, iterator) {
    var n = list.length;
    var i = -1;
    var calls = 0;
    var looping = false;
    var iterate = function (quit, breaker) {
        calls -= 1;
        i += 1;
        if (i === n || quit) {
            if (breaker) {
                return breaker();
            } else {
                return;
            }
        }
        iterator(list[i], next);
    };
    var runloop = function () {
        if (looping) return;
        looping = true;
        while (calls > 0) iterate();
        looping = false;
    };
    var next = function (quit, breaker) {
        calls += 1;
        if (typeof setTimeout === "undefined") {
            runloop();
        } else {
            setTimeout(function () { iterate(quit, breaker); }, 1);
        }
    };
    next();
}

module.exports = {

    bignumbers: true,

    nodes: ["http://eth1.augur.net:8545"],

    requests: 1,

    unmarshal: function (string, returns, stride, init) {
        var elements, array, position;
        if (string.length >= 66) {
            stride = stride || 64;
            elements = Math.ceil((string.length - 2) / stride);
            array = new Array(elements);
            position = init || 2;
            for (var i = 0; i < elements; ++i) {
                array[i] = abi.prefix_hex(
                    string.slice(position, position + stride)
                );
                position += stride;
            }
            if (array.length) {
                if (parseInt(array[0]) === array.length - 1) {
                    array.splice(0, 1);
                } else if (parseInt(array[1]) === array.length - 2 ||
                    parseInt(array[1]) / 32 === array.length - 2) {
                    array.splice(0, 2);
                }
            }
            for (i = 0; i < array.length; ++i) {
                if (returns === "hash[]" && this.bignumbers) {
                    array[i] = abi.bignum(array[i]);
                } else {
                    if (returns === "number[]") {
                        array[i] = abi.bignum(array[i]).toFixed();
                    } else if (returns === "unfix[]") {
                        if (this.bignumbers) {
                            array[i] = abi.unfix(array[i]);
                        } else {
                            array[i] = abi.unfix(array[i], "string");
                        }
                    }
                }
            }
            return array;
        } else {
            return string;
        }
    },

    applyReturns: function (returns, result) {
        returns = returns.toLowerCase();
        if (result && result !== "0x") {
            if (returns && returns.slice(-2) === "[]") {
                result = this.unmarshal(result, returns);
            } else if (returns === "string") {
                result = abi.decode_hex(result, true);
            } else {
                if (this.bignumbers) {
                    if (returns === "unfix") {
                        result = abi.unfix(result);
                    }
                    if (result.constructor !== BigNumber) {
                        result = abi.bignum(result);
                    }
                } else {
                    if (returns === "number") {
                        result = abi.bignum(result).toFixed();
                    } else if (returns === "bignumber") {
                        result = abi.bignum(result);
                    } else if (returns === "unfix") {
                        result = abi.unfix(result, "string");
                    }
                }
            }
        }
        return result;
    },

    parse: function (response, returns, callback) {
        var results, len;
        try {
            if (response !== undefined) {
                response = JSON.parse(response);
                if (response.error) {
                    response = {
                        error: response.error.code,
                        message: response.error.message
                    };
                    if (callback) {
                        callback(response);
                    } else {
                        return response;
                    }
                } else if (response.result !== undefined) {
                    if (returns) {
                        response.result = this.applyReturns(returns, response.result);
                    } else {
                        if (response.result && response.result.length > 2 &&
                            response.result.slice(0,2) === "0x")
                        {
                            response.result = abi.remove_leading_zeros(response.result);
                            response.result = abi.prefix_hex(response.result);
                        }
                    }
                    if (callback) {
                        callback(response.result);
                    } else {
                        return response.result;
                    }
                } else if (response.constructor === Array && response.length) {
                    len = response.length;
                    results = new Array(len);
                    for (var i = 0; i < len; ++i) {
                        results[i] = response[i].result;
                        if (response.error) {
                            console.error(
                                "[" + response.error.code + "]",
                                response.error.message
                            );
                        } else if (response[i].result !== undefined) {
                            if (returns[i]) {
                                results[i] = this.applyReturns(returns[i], response[i].result);
                            } else {
                                results[i] = abi.remove_leading_zeros(results[i]);
                                results[i] = abi.prefix_hex(results[i]);
                            }
                        }
                    }
                    if (callback) {
                        callback(results);
                    } else {
                        return results;
                    }
                // no result or error field
                } else {
                    if (callback) {
                        callback(response);
                    } else {
                        return response;
                    }
                }
            }
        } catch (e) {
            if (callback) {
                callback(e);
            } else {
                return e;
            }
        }
    },

    stripReturns: function (tx) {
        var returns;
        if (tx.params !== undefined && tx.params.length &&
            tx.params[0] && tx.params[0].returns)
        {
            returns = tx.params[0].returns;
            delete tx.params[0].returns;
        }
        return returns;
    },

    postSync: function (rpc_url, command, returns) {
        var req = null;
        if (NODE_JS) {
            return this.parse(request('POST', rpc_url, {
                json: command
            }).getBody().toString(), returns);
        } else {
            if (window.XMLHttpRequest) {
                req = new window.XMLHttpRequest();
            } else {
                req = new window.ActiveXObject("Microsoft.XMLHTTP");
            }
            req.open("POST", rpc_url, false);
            req.setRequestHeader("Content-type", "application/json");
            req.send(command);
            return this.parse(req.responseText, returns);
        }
    },

    post: function (rpc_url, command, returns, callback) {
        var req = null;
        if (NODE_JS) {
            req = new XHR2();
        } else {
            if (window.XMLHttpRequest) {
                req = new window.XMLHttpRequest();
            } else {
                req = new window.ActiveXObject("Microsoft.XMLHTTP");
            }
        }
        req.onreadystatechange = function () {
            if (req.readyState === 4) {
                this.parse(req.responseText, returns, callback);
            }
        }.bind(this);
        req.open("POST", rpc_url, true);
        req.setRequestHeader("Content-type", "application/json");
        req.send(command);
    },

    // Post JSON-RPC command to all Ethereum nodes
    broadcast: function (command, callback) {
        var i, j, num_nodes, num_commands, returns, result, complete;

        // parse batched commands and strip "returns" fields
        if (command.constructor === Array) {
            num_commands = command.length;
            returns = new Array(num_commands);
            for (i = 0; i < num_commands; ++i) {
                returns[i] = this.stripReturns(command[i]);
            }
        } else {
            returns = this.stripReturns(command);
        }

        // asynchronous request if callback exists
        if (callback && callback.constructor === Function) {
            command = JSON.stringify(command);
            loop(this.nodes, function (node, next) {
                this.post(node, command, returns, function (result) {
                    if (result !== undefined && result !== "0x") {
                        complete = true;
                    } else if (result !== undefined && result.error) {
                        complete = true;
                    }
                    next(complete, function () { callback(result); });
                });
            }.bind(this));

        // use synchronous http if no callback provided
        } else {
            if (!NODE_JS) command = JSON.stringify(command);
            num_nodes = this.nodes.length;
            for (j = 0; j < num_nodes; ++j) {
                result = this.postSync(this.nodes[j], command, returns);
                if (result && result !== "0x") return result;
            }
        }
    },

    marshal: function (command, params, prefix) {
        var payload = {
            id: this.requests++,
            jsonrpc: "2.0"
        };
        if (prefix === "null") {
            payload.method = command.toString();
        } else {
            payload.method = (prefix || "eth_") + command.toString();
        }
        if (params !== undefined && params !== null) {
            if (params.constructor === Array) {
                payload.params = params;
            } else {
                payload.params = [params];
            }
        } else {
            payload.params = [];
        }
        return payload;
    }

};
