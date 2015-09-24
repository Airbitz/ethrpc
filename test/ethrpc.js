/**
 * ethrpc unit tests
 * @author Jack Peterson (jack@tinybike.net)
 */

"use strict";

var assert = require("chai").assert;
var async = require("async");
var contracts = require("augur-contracts")['7'];
var abi = require("augur-abi");
var rpc = require("../");
var errors = require("../errors");

require('it-each')({ testPerIteration: true });

var TIMEOUT = 360000;
var SAMPLES = 25;
var COINBASE = "0xaff9cb4dcb19d13b84761c040c91d21dc6c991ec";
var SHA3_INPUT = "boom!";
var SHA3_DIGEST = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470";
var PROTOCOL_VERSION = "61";

var requests = 0;
rpc.reset();
var HOSTED_NODES = rpc.nodes.hosted.slice();

rpc.balancer = false;

describe("marshal", function () {

    var test = function (t) {
        it(t.prefix + t.command + " -> " + JSON.stringify(t.expected), function () {
            var actual = rpc.marshal(t.command, t.params || [], t.prefix);
            actual.id = t.expected.id;
            assert.deepEqual(actual, t.expected);
        });
    };

    test({
        prefix: "eth_",
        command: "coinbase",
        expected: {
            id: ++requests,
            jsonrpc: "2.0",
            method: "eth_coinbase",
            params: []
        }
    });
    test({
        prefix: "web3_",
        command: "sha3",
        params: "boom!",
        expected: {
            id: ++requests,
            jsonrpc: "2.0",
            method: "web3_sha3",
            params: ["boom!"]
        }
    });
    test({
        prefix: "net_",
        command: "listening",
        expected: {
            id: ++requests,
            jsonrpc: "2.0",
            method: "net_listening",
            params: []
        }
    });
    test({
        prefix: "eth_",
        command: "protocolVersion",
        expected: {
            id: ++requests,
            jsonrpc: "2.0",
            method: "eth_protocolVersion",
            params: []
        }
    });

});

describe("broadcast", function () {

    var test = function (t) {
        it(JSON.stringify(t.command) + " -> " + t.expected, function (done) {
            this.timeout(TIMEOUT);

            // synchronous
            var response = rpc.broadcast(t.command);
            if (response.error) {
                done(response);
            } else {
                assert.strictEqual(response, t.expected);

                // asynchronous
                rpc.broadcast(t.command, function (res) {
                    if (res.error) {
                        done(res);
                    } else {
                        assert.strictEqual(res, t.expected);
                        done();
                    }
                });
            }
        });
    };

    test({
        command: {
            id: ++requests,
            jsonrpc: "2.0",
            method: "eth_coinbase",
            params: []
        },
        expected: COINBASE
    });
    test({
        command: {
            id: ++requests,
            jsonrpc: "2.0",
            method: "web3_sha3",
            params: [SHA3_INPUT]
        },
        expected: SHA3_DIGEST
    });
    test({
        command: {
            id: ++requests,
            jsonrpc: "2.0",
            method: "net_listening",
            params: []
        },
        expected: true
    });
    test({
        command: {
            id: ++requests,
            jsonrpc: "2.0",
            method: "eth_protocolVersion",
            params: []
        },
        expected: PROTOCOL_VERSION
    });

});

describe("post", function () {

    var test = function (t) {
        it(JSON.stringify(t.command) + " -> " + t.expected, function (done) {
            this.timeout(TIMEOUT);
            rpc.post(t.node, t.command, t.returns, function (res) {
                if (res.error) {
                    done(res);
                } else {
                    assert.strictEqual(res, t.expected);
                    done();
                }
            });
        });
    };

    test({
        node: "http://eth1.augur.net",
        command: {
            id: ++requests,
            jsonrpc: "2.0",
            method: "eth_coinbase",
            params: []
        },
        expected: COINBASE
    });
    test({
        node: "http://eth1.augur.net",
        command: {
            id: ++requests,
            jsonrpc: "2.0",
            method: "web3_sha3",
            params: [SHA3_INPUT]
        },
        expected: SHA3_DIGEST
    });
    test({
        node: "http://eth1.augur.net",
        command: {
            id: ++requests,
            jsonrpc: "2.0",
            method: "net_listening",
            params: []
        },
        expected: true
    });
    test({
        node: "http://eth1.augur.net",
        command: {
            id: ++requests,
            jsonrpc: "2.0",
            method: "eth_protocolVersion",
            params: []
        },
        expected: PROTOCOL_VERSION
    });

});

describe("postSync", function () {

    var test = function (t) {
        it(JSON.stringify(t.command) + " -> " + t.expected, function (done) {
            this.timeout(TIMEOUT);
            var res = rpc.postSync(t.node, t.command, t.returns);
            if (res.error) {
                done(res.error);
            } else {
                assert.strictEqual(res, t.expected);
                done();
            }
        });
    };

    test({
        node: "http://eth1.augur.net",
        command: {
            id: ++requests,
            jsonrpc: "2.0",
            method: "eth_coinbase",
            params: []
        },
        expected: COINBASE
    });
    test({
        node: "http://eth1.augur.net",
        command: {
            id: ++requests,
            jsonrpc: "2.0",
            method: "web3_sha3",
            params: [SHA3_INPUT]
        },
        expected: SHA3_DIGEST
    });
    test({
        node: "http://eth1.augur.net",
        command: {
            id: ++requests,
            jsonrpc: "2.0",
            method: "net_listening",
            params: []
        },
        expected: true
    });
    test({
        node: "http://eth1.augur.net",
        command: {
            id: ++requests,
            jsonrpc: "2.0",
            method: "eth_protocolVersion",
            params: []
        },
        expected: PROTOCOL_VERSION
    });

});

describe("listening", function () {

    var test = function (t) {
        it(t.node + " -> " + t.listening, function (done) {
            this.timeout(TIMEOUT);
            rpc.reset();
            rpc.nodes.hosted = [t.node];
            assert.strictEqual(rpc.listening(), t.listening);
            rpc.listening(function (listening) {
                assert.strictEqual(listening, t.listening);
                done();
            });
        });
    };

    test({
        node: "http://eth1.augur.net",
        listening: true
    });
    test({
        node: "http://eth1.augur.net:8545",
        listening: true
    });
    test({
        node: "http://eth3.augur.net",
        listening: true
    });
    test({
        node: "http://eth3.augur.net:8545",
        listening: true
    });
    test({
        node: "http://eth4.augur.net",
        listening: true
    });
    test({
        node: "http://eth4.augur.net:8545",
        listening: true
    });
    test({
        node: "http://eth5.augur.net",
        listening: true
    });
    test({
        node: "http://eth5.augur.net:8545",
        listening: true
    });
    test({
        node: "",
        listening: false
    });
    test({
        node: null,
        listening: false
    });
    test({
        node: undefined,
        listening: false
    });
    test({
        node: NaN,
        listening: false
    });

});

describe("version (network ID)", function () {

    var test = function (t) {
        it(t.node + " -> " + t.version, function (done) {
            this.timeout(TIMEOUT);
            rpc.reset();
            rpc.nodes.hosted = [t.node];
            assert.strictEqual(rpc.version(), t.version);
            rpc.version(function (version) {
                assert.strictEqual(version, t.version);
                done();
            });
        });
    };

    test({
        node: "http://eth1.augur.net",
        version: "7"
    });
    test({
        node: "http://eth1.augur.net:8545",
        version: "7"
    });
    test({
        node: "http://eth3.augur.net",
        version: "7"
    });
    test({
        node: "http://eth3.augur.net:8545",
        version: "7"
    });
    test({
        node: "http://eth4.augur.net",
        version: "7"
    });
    test({
        node: "http://eth4.augur.net:8545",
        version: "7"
    });
    test({
        node: "http://eth5.augur.net",
        version: "7"
    });
    test({
        node: "http://eth5.augur.net:8545",
        version: "7"
    });

});

describe("unlocked", function () {

    var test = function (t) {
        it(t.node + " -> " + t.unlocked, function () {
            this.timeout(TIMEOUT);
            rpc.reset();
            rpc.nodes.hosted = [t.node];
            assert.strictEqual(rpc.unlocked(t.account), t.unlocked);
        });
    };

    test({
        node: "http://eth1.augur.net",
        account: COINBASE,
        unlocked: true
    });
    test({
        node: "http://eth1.augur.net:8545",
        account: COINBASE,
        unlocked: true
    });
    test({
        node: "http://eth1.augur.net:8545",
        account: COINBASE,
        unlocked: true
    });
    test({
        node: "http://eth3.augur.net",
        account: COINBASE,
        unlocked: true
    });
    test({
        node: "http://eth3.augur.net",
        account: COINBASE,
        unlocked: true
    });
    test({
        node: "http://eth3.augur.net:8545",
        account: COINBASE,
        unlocked: true
    });
    test({
        node: "http://eth3.augur.net:8545",
        account: COINBASE,
        unlocked: true
    });
    test({
        node: "http://eth4.augur.net",
        account: COINBASE,
        unlocked: true
    });
    test({
        node: "http://eth4.augur.net:8545",
        account: COINBASE,
        unlocked: true
    });
    test({
        node: "http://eth4.augur.net:8545",
        account: COINBASE,
        unlocked: true
    });
    test({
        node: "http://eth5.augur.net",
        account: COINBASE,
        unlocked: true
    });
    test({
        node: "http://eth5.augur.net:8545",
        account: COINBASE,
        unlocked: true
    });
    test({
        node: null,
        account: COINBASE,
        unlocked: false
    });
    test({
        node: undefined,
        account: COINBASE,
        unlocked: false
    });
    test({
        node: NaN,
        account: COINBASE,
        unlocked: false
    });

});

describe("batch", function () {

    var test = function (res) {
        assert.isArray(res);
        assert.strictEqual(res.length, 2);
        assert(parseInt(res[0]) === 1 || parseInt(res[0]) === -1);
        assert(parseInt(res[1]) === 1 || parseInt(res[1]) === -1);
    };

    var txList = [{
        to: contracts.faucets,
        method: "cashFaucet",
        returns: "number",
        send: false
    }, {
        to: contracts.faucets,
        method: "reputationFaucet",
        signature: "i",
        params: "0xf69b5",
        returns: "number",
        send: false
    }];

    it("sync: return and match separate calls", function () {
        rpc.reset();
        test(rpc.batch(txList));
    });

    it("async: callback on whole array", function (done) {
        rpc.reset();
        rpc.batch(txList, function (r) {
            test(r); done();
        });
    });

});

describe("multicast", function () {

    var command = {
        id: ++requests,
        jsonrpc: "2.0",
        method: "eth_protocolVersion",
        params: []
    };

    rpc.reset();

    it.each(
        rpc.nodes.hosted,
        "[sync] post " + command.method + " RPC to %s",
        ["element"],
        function (element, next) {
            this.timeout(TIMEOUT);
            assert.strictEqual(rpc.postSync(element, command), PROTOCOL_VERSION);
            next();
        }
    );

    it.each(
        rpc.nodes.hosted,
        "[async] post " + command.method + " RPC to %s",
        ["element"],
        function (element, next) {
            this.timeout(TIMEOUT);
            rpc.post(element, command, null, function (response) {
                assert.strictEqual(response, PROTOCOL_VERSION);
                next();
            });
        }
    );

    it("call back after first asynchronous response", function (done) {
        this.timeout(TIMEOUT);
        rpc.broadcast(command, function (response) {
            assert.strictEqual(response, PROTOCOL_VERSION);
            done();
        });
    }); 

    it("return after first synchronous response", function (done) {
        assert.strictEqual(rpc.broadcast(command), PROTOCOL_VERSION);
        done();
    });

});

describe("clear", function () {

    it("delete cached network/notification/transaction data", function (done) {
        this.timeout(TIMEOUT);
        rpc.reset();
        rpc.latency["0x1"] = "junk";
        rpc.samples["0x1"] = "junk";
        rpc.txs["0x1"] = { junk: "junk" };
        rpc.notifications["0x1"] = setTimeout(function () { done(1); }, 1500);
        rpc.clear();
        assert.deepEqual(rpc.latency, {});
        assert.deepEqual(rpc.samples, {});
        assert.deepEqual(rpc.txs, {});
        assert.deepEqual(rpc.notifications, {});
        setTimeout(done, 2000);
    });

});

describe("reset", function () {

    it("revert to default node list", function () {
        rpc.nodes.hosted = ["http://eth0.augur.net"];
        assert.isArray(rpc.nodes.hosted);
        assert.strictEqual(rpc.nodes.hosted.length, 1);
        assert.strictEqual(rpc.nodes.hosted[0], "http://eth0.augur.net");
        assert.isNull(rpc.nodes.local);
        rpc.nodes.local = "http://127.0.0.1:8545";
        assert.strictEqual(rpc.nodes.local, "http://127.0.0.1:8545");
        rpc.reset();
        assert.isNull(rpc.nodes.local);
        assert.isArray(rpc.nodes.hosted);
        assert.strictEqual(rpc.nodes.hosted.length, HOSTED_NODES.length);
        assert.deepEqual(rpc.nodes.hosted, HOSTED_NODES);
        rpc.reset();
        assert.isNull(rpc.nodes.local);
        assert.isArray(rpc.nodes.hosted);
        assert.strictEqual(rpc.nodes.hosted.length, HOSTED_NODES.length);
        assert.deepEqual(rpc.nodes.hosted, HOSTED_NODES);
    });  

});

describe("Ethereum bindings", function () {

    it("raw('eth_coinbase')", function () {
        assert.strictEqual(rpc.raw("eth_coinbase"), COINBASE);
    });

    it("eth('coinbase')", function () {
        assert.strictEqual(COINBASE, rpc.eth("coinbase"));
    });

    it("eth('protocolVersion')", function () {
        assert.strictEqual(rpc.eth("protocolVersion"), "61");
    });

    it("web3_sha3('" + SHA3_INPUT + "')", function () {
        assert.strictEqual(rpc.web3("sha3", SHA3_INPUT), SHA3_DIGEST);
        assert.strictEqual(rpc.sha3(SHA3_INPUT), SHA3_DIGEST);
    });

    it("leveldb('putString')", function () {
        assert.isTrue(
            rpc.leveldb("putString", ["augur_test_DB", "boomkey", "boom!"])
        );
    });

    it("leveldb('getString')", function () {
        rpc.leveldb("putString", ["augur_test_DB", "boomkey", "boom!"]);
        assert.strictEqual(
            rpc.leveldb("getString", ["augur_test_DB", "boomkey"]), "boom!"
        );
    });

    it("gasPrice", function () {
        assert(parseInt(rpc.gasPrice()) >= 0);
    });

    it("blockNumber", function () {
        assert(parseFloat(rpc.blockNumber()) >= 0);
    });

    it("balance", function () {
        assert(parseInt(rpc.balance(COINBASE)) >= 0);
    });

    it("txCount", function () {
        assert(parseInt(rpc.txCount(COINBASE)) >= 0);
    });

    it("peerCount", function () {
        this.timeout(TIMEOUT);
        assert(parseInt(rpc.peerCount()) >= 0);
    });

    it("hashrate", function () {
        this.timeout(TIMEOUT);
        assert(parseInt(rpc.hashrate()) >= 0);
    });

    it("mining", function () {
        this.timeout(TIMEOUT);
        assert.isTrue(rpc.mining());
    });

    it("clientVersion", function () {
        this.timeout(TIMEOUT);
        var clientVersion = rpc.clientVersion();
        assert.isString(clientVersion);
        assert.strictEqual(clientVersion.split('/')[0], "Geth");
    });

});

describe("getBlock", function () {

    var asserts = function (t, block) {
        assert.property(block, "number");
        assert.property(block, "parentHash");
        assert.property(block, "hash");
        assert.property(block, "nonce");
        assert.property(block, "sha3Uncles");
        assert.property(block, "logsBloom");
        assert.property(block, "transactionsRoot");
        assert.property(block, "stateRoot");
        assert.property(block, "miner");
        assert.property(block, "difficulty");
        assert.property(block, "totalDifficulty");
        assert.property(block, "size");
        assert.property(block, "extraData");
        assert.property(block, "gasLimit");
        assert.property(block, "gasUsed");
        assert.property(block, "timestamp");
        assert.property(block, "transactions");
        assert.property(block, "uncles");
        assert.isAbove(parseInt(block.number), 0);
        assert.isAbove(parseInt(block.hash), 0);
        assert.isAbove(parseInt(block.parentHash), 0);
        assert.isAbove(parseInt(block.nonce), 0);
        assert.isAbove(parseInt(block.sha3Uncles), 0);
        assert.isAbove(parseInt(block.transactionsRoot), 0);
        assert.isAbove(parseInt(block.stateRoot), 0);
        assert.isAbove(parseInt(block.miner), 0);
        assert.isAbove(parseInt(block.difficulty), 0);
        assert.isAbove(parseInt(block.totalDifficulty), 0);
        assert.isAbove(parseInt(block.gasLimit), 0);
        assert.isAbove(parseInt(block.timestamp), 0);
        assert.isAbove(parseInt(block.number), 0);
        assert.isArray(block.transactions);
        assert.isArray(block.uncles);
        assert.strictEqual(parseInt(block.number), parseInt(t.blockNumber));
        assert.strictEqual(block.hash, t.blockHash);
    };

    var test = function (t) {
        it("[sync]  " + t.blockNumber + " -> " + t.blockHash, function () {
            this.timeout(TIMEOUT);
            asserts(t, rpc.getBlock(t.blockNumber));
        });
        it("[async] " + t.blockNumber + " -> " + t.blockHash, function (done) {
            this.timeout(TIMEOUT);
            rpc.getBlock(t.blockNumber, true, function (block) {
                asserts(t, block);
                done();
            });
        });
    };

    // expected block hashes for network 7
    test({
        blockNumber: "0x1",
        blockHash: "0x74aa258b2f71168b97d7d0c72ec8ff501ec15e4e2adc8c663a0f7b01a1025d88"
    });
    test({
        blockNumber: "0x1b4",
        blockHash: "0x721a93982fbbe858aa190476be937ea2052408d7f8ff6fb415cc969aaacaa045"
    });
    test({
        blockNumber: "0x24f2",
        blockHash: "0x9272764416f772a63b945e1c1c6ca449f8d07dc4378f6b589244b1f48fef86bf"
    });
});

describe("getBlockByHash", function () {

    var asserts = function (t, block) {
        assert.property(block, "number");
        assert.property(block, "parentHash");
        assert.property(block, "hash");
        assert.property(block, "nonce");
        assert.property(block, "sha3Uncles");
        assert.property(block, "logsBloom");
        assert.property(block, "transactionsRoot");
        assert.property(block, "stateRoot");
        assert.property(block, "miner");
        assert.property(block, "difficulty");
        assert.property(block, "totalDifficulty");
        assert.property(block, "size");
        assert.property(block, "extraData");
        assert.property(block, "gasLimit");
        assert.property(block, "gasUsed");
        assert.property(block, "timestamp");
        assert.property(block, "transactions");
        assert.property(block, "uncles");
        assert.isAbove(parseInt(block.number), 0);
        assert.isAbove(parseInt(block.hash), 0);
        assert.isAbove(parseInt(block.parentHash), 0);
        assert.isAbove(parseInt(block.nonce), 0);
        assert.isAbove(parseInt(block.sha3Uncles), 0);
        assert.isAbove(parseInt(block.transactionsRoot), 0);
        assert.isAbove(parseInt(block.stateRoot), 0);
        assert.isAbove(parseInt(block.miner), 0);
        assert.isAbove(parseInt(block.difficulty), 0);
        assert.isAbove(parseInt(block.totalDifficulty), 0);
        assert.isAbove(parseInt(block.gasLimit), 0);
        assert.isAbove(parseInt(block.timestamp), 0);
        assert.isAbove(parseInt(block.number), 0);
        assert.isArray(block.transactions);
        assert.isArray(block.uncles);
        assert.strictEqual(parseInt(block.number), parseInt(t.blockNumber));
        assert.strictEqual(block.hash, t.blockHash);
    };

    var test = function (t) {
        it("[sync]  " + t.blockHash + " -> " + t.blockNumber, function () {
            this.timeout(TIMEOUT);
            asserts(t, rpc.getBlockByHash(t.blockHash));
        });
        it("[async] " + t.blockHash + " -> " + t.blockNumber, function (done) {
            this.timeout(TIMEOUT);
            rpc.getBlockByHash(t.blockHash, true, function (block) {
                asserts(t, block);
                done();
            });
        });
    };

    test({
        blockHash: "0x74aa258b2f71168b97d7d0c72ec8ff501ec15e4e2adc8c663a0f7b01a1025d88",
        blockNumber: "0x1"
    });
    test({
        blockHash: "0x721a93982fbbe858aa190476be937ea2052408d7f8ff6fb415cc969aaacaa045",
        blockNumber: "0x1b4"
    });
    test({
        blockHash: "0x9272764416f772a63b945e1c1c6ca449f8d07dc4378f6b589244b1f48fef86bf",
        blockNumber: "0x24f2"
    });
});

describe("sendEther", function () {

    var etherValue = "1";
    var recipient = "0x639b41c4d3d399894f2a57894278e1653e7cd24c";

    it("send " + etherValue + " ether to " + recipient, function (done) {
        this.timeout(TIMEOUT*4);
        var start_balance = abi.bignum(rpc.balance(recipient)).dividedBy(rpc.ETHER);
        rpc.reset();
        rpc.sendEther({
            to: recipient,
            value: etherValue,
            from: COINBASE,
            onSent: function (res) {
                assert.isNotNull(res);
                assert.property(res, "txHash");
                assert.property(res, "callReturn");
                assert.isNotNull(res.txHash);
                assert.strictEqual(res.txHash.length, 66);
                assert.isNull(res.callReturn);
            },
            onSuccess: function (res) {
                assert.strictEqual(res.from, COINBASE);
                assert.strictEqual(res.to, recipient);
                assert.strictEqual(abi.bignum(res.value).dividedBy(rpc.ETHER).toFixed(), etherValue);
                var final_balance = rpc.balance(recipient);
                final_balance = abi.bignum(final_balance).dividedBy(rpc.ETHER);
                assert.strictEqual(final_balance.sub(start_balance).toFixed(), etherValue);
                done();
            },
            onFailed: function (err) {
                done(err);
            }
        });
    });

});

describe("invoke", function () {

    var test = function (tx, expected, apply) {
        tx.send = false;
        if (tx && expected) {
            var res = rpc.invoke(tx);
            if (res) {
                if (apply) {
                    if (res && res.constructor === Array) {
                        assert.deepEqual(apply(res), apply(expected));
                    } else {
                        assert.strictEqual(apply(res), apply(expected));
                    }
                } else {
                    if (res && res.constructor === Array) {
                        assert.deepEqual(res, expected);
                    } else {
                        assert.strictEqual(res, expected);
                    }
                }
            } else {
                throw new Error("no or incorrect response: " + JSON.stringify(res));
            }
        }
    };

    var coinbase = rpc.coinbase();
    var encodedParams = "0x7a66d7ca"+
        "00000000000000000000000000000000000000000000000000000000000f69b5";
    var returns = "number";

    var cashFaucet = {
        to: contracts.faucets,
        from: COINBASE,
        method: "cashFaucet",
        send: false
    };

    it("[sync] invoke == call == broadcast", function () {
        this.timeout(TIMEOUT);
        var invokeResult = rpc.invoke({
            to: contracts.branches,
            from: coinbase,
            method: "getVotePeriod",
            signature: "i",
            returns: returns,
            params: "0x0f69b5"
        });
        var callResult = rpc.call({
            from: coinbase,
            to: contracts.branches,
            data: encodedParams,
            returns: returns
        });
        var broadcastResult = rpc.broadcast({
            id: ++requests,
            jsonrpc: "2.0",
            method: "eth_call",
            params: [{
                from: coinbase,
                to: contracts.branches,
                data: encodedParams,
                returns: returns
            }]
        });
        assert.strictEqual(invokeResult, callResult);
        assert.strictEqual(invokeResult, broadcastResult);
    });

    it("[async] invoke == call == broadcast", function (done) {
        this.timeout(TIMEOUT);
        rpc.invoke({
            to: contracts.branches,
            from: coinbase,
            method: "getVotePeriod",
            signature: "i",
            returns: returns,
            params: "0x0f69b5"
        }, function (invokeResult) {
            rpc.call({
                from: coinbase,
                to: contracts.branches,
                data: encodedParams,
                returns: returns
            }, function (callResult) {
                rpc.broadcast({
                    id: ++requests,
                    jsonrpc: "2.0",
                    method: "eth_call",
                    params: [{
                        from: coinbase,
                        to: contracts.branches,
                        data: encodedParams,
                        returns: returns
                    }]
                }, function (broadcastResult) {
                    assert.strictEqual(invokeResult, callResult);
                    assert.strictEqual(invokeResult, broadcastResult);
                    done();
                }); // broadcast
            }); // call
        }); // invoke
    });

    it("cashFaucet -> raw", function () {
        assert.include([
            "0x01",
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff"
        ], rpc.invoke(cashFaucet));
    });

    it("cashFaucet -> number", function () {
        cashFaucet.returns = "number";
        assert.include(["1", "-1"], rpc.invoke(cashFaucet));
    });

    it("getMarkets(1010101) -> hash[]", function () {
        test({
            to: contracts.branches,
            from: COINBASE,
            method: "getMarkets",
            signature: "i",
            returns: "hash[]",
            params: 1010101
        }, ["0xe8", "0xe8"], function (a) {
            a.slice(1, 2);
        });
    });

});

describe("exciseNode", function () {

    it("remove node 2", function () {
        var nodes = HOSTED_NODES.slice();
        rpc.reset();
        assert.strictEqual(rpc.nodes.hosted.length, HOSTED_NODES.length);
        assert.deepEqual(rpc.nodes.hosted, nodes);
        rpc.exciseNode(null, nodes[2]);
        nodes.splice(2, 1);
        assert.strictEqual(rpc.nodes.hosted.length, HOSTED_NODES.length - 1);
        assert.deepEqual(rpc.nodes.hosted, nodes);
    });

    it("remove nodes 1 and 3", function () {
        var nodes = HOSTED_NODES.slice();
        rpc.reset();
        assert.strictEqual(rpc.nodes.hosted.length, HOSTED_NODES.length);
        assert.deepEqual(rpc.nodes.hosted, nodes);
        rpc.exciseNode(null, nodes[1]);
        rpc.exciseNode(null, nodes[3]);
        nodes.splice(3, 1);
        nodes.splice(1, 1);
        assert.strictEqual(rpc.nodes.hosted.length, HOSTED_NODES.length - 2);
        assert.deepEqual(rpc.nodes.hosted, nodes);
    });

    it("remove nodes 1, 2 and 3", function () {
        var nodes = HOSTED_NODES.slice();
        rpc.reset();
        assert.strictEqual(rpc.nodes.hosted.length, HOSTED_NODES.length);
        assert.deepEqual(rpc.nodes.hosted, nodes);
        rpc.exciseNode(null, nodes[1]);
        rpc.exciseNode(null, nodes[2]);
        rpc.exciseNode(null, nodes[3]);
        nodes.splice(3, 1);
        nodes.splice(2, 1);
        nodes.splice(1, 1);
        assert.strictEqual(rpc.nodes.hosted.length, HOSTED_NODES.length - 3);
        assert.deepEqual(rpc.nodes.hosted, nodes);
    });

    it("throw error 411 if all hosted nodes removed", function () {
        rpc.reset();
        assert.strictEqual(rpc.nodes.hosted.length, HOSTED_NODES.length);
        assert.deepEqual(rpc.nodes.hosted, HOSTED_NODES);
        rpc.exciseNode(null, HOSTED_NODES[0]);
        rpc.exciseNode(null, HOSTED_NODES[1]);
        rpc.exciseNode(null, HOSTED_NODES[2]);
        assert.throws(function () {
            rpc.exciseNode(null, HOSTED_NODES[3]);
        }, Error, /411/);
    });

});

describe("Backup nodes", function () {

    it("[sync] graceful failover to eth1.augur.net", function () {
        this.timeout(TIMEOUT);
        rpc.nodes.hosted = ["http://lol.lol.lol", "http://eth1.augur.net"];
        assert.strictEqual(rpc.nodes.hosted.length, 2);
        assert.strictEqual(rpc.version(), "7");
        assert.strictEqual(rpc.nodes.hosted.length, 1);
        assert.strictEqual(rpc.nodes.hosted[0], "http://eth1.augur.net");
    });

    it("[async] graceful failover to eth1.augur.net", function (done) {
        this.timeout(TIMEOUT);
        rpc.nodes.hosted = ["http://lol.lol.lol", "http://eth1.augur.net"];
        assert.strictEqual(rpc.nodes.hosted.length, 2);
        rpc.version(function (version) {
            assert.strictEqual(version, "7");
            assert.strictEqual(rpc.nodes.hosted.length, 1);
            assert.strictEqual(rpc.nodes.hosted[0], "http://eth1.augur.net");
            done();
        });
    });

    it("[sync] graceful failover to eth[1,3,4].augur.net", function () {
        this.timeout(TIMEOUT);
        rpc.nodes.hosted = [
            "http://lol.lol.lol",
            "http://eth1.augur.net",
            "http://eth3.augur.net",
            "http://eth4.augur.net"
        ];
        assert.strictEqual(rpc.nodes.hosted.length, 4);
        assert.strictEqual(rpc.version(), "7");
        assert.strictEqual(rpc.nodes.hosted.length, 3);
        assert.strictEqual(rpc.nodes.hosted[0], "http://eth1.augur.net");
        assert.strictEqual(rpc.nodes.hosted[1], "http://eth3.augur.net");
        assert.strictEqual(rpc.nodes.hosted[2], "http://eth4.augur.net");
    });

    it("[async] graceful failover to eth[1,3,4].augur.net", function (done) {
        this.timeout(TIMEOUT);
        rpc.nodes.hosted = [
            "http://lol.lol.lol",
            "http://eth1.augur.net",
            "http://eth3.augur.net",
            "http://eth4.augur.net"
        ];
        assert.strictEqual(rpc.nodes.hosted.length, 4);
        rpc.version(function (version) {
            assert.strictEqual(version, "7");
            assert.strictEqual(rpc.nodes.hosted.length, 3);
            assert.strictEqual(rpc.nodes.hosted[0], "http://eth1.augur.net");
            assert.strictEqual(rpc.nodes.hosted[1], "http://eth3.augur.net");
            assert.strictEqual(rpc.nodes.hosted[2], "http://eth4.augur.net");
            done();
        });
    });

    it("[sync] hosted node failure", function () {
        rpc.nodes.hosted = ["http://lol.lol.lol", "http://not.a.node"];
        assert.strictEqual(rpc.nodes.hosted.length, 2);
        assert.throws(function () {
            rpc.broadcast({
                id: ++requests,
                jsonrpc: "2.0",
                method: "eth_coinbase",
                params: []
            });
        }, Error, /411/);
    });

    it("[async] hosted node failure", function (done) {
        this.timeout(TIMEOUT);
        rpc.nodes.hosted = ["http://lol.lol.lol", "http://not.a.node"];
        assert.strictEqual(rpc.nodes.hosted.length, 2);
        rpc.broadcast({
            id: ++requests,
            jsonrpc: "2.0",
            method: "eth_coinbase",
            params: []
        }, function (err) {
            assert.isNotNull(err);
            assert.property(err, "error");
            assert.property(err, "message");
            assert.strictEqual(err.error, 411);
            done();
        });
    });

});

describe("useHostedNode", function () {

    it("switch to hosted node(s)", function () {
        rpc.reset();
        assert.isNull(rpc.nodes.local);
        rpc.setLocalNode("http://127.0.0.1:8545");
        assert.strictEqual(rpc.nodes.local, "http://127.0.0.1:8545");
        rpc.useHostedNode();
        assert.isNull(rpc.nodes.local);
    });

});

describe("setLocalNode", function () {

    var test = function (command) {

        it("[sync] local node failure", function () {
            this.timeout(TIMEOUT);
            rpc.reset();
            rpc.setLocalNode("http://127.0.0.0");
            assert.strictEqual(rpc.nodes.local, "http://127.0.0.0");
            assert.deepEqual(rpc.nodes.hosted, HOSTED_NODES);
            assert.throws(function () { rpc.broadcast(command); }, Error, /410/);
        });

        it("[async] local node failure", function (done) {
            this.timeout(TIMEOUT);
            rpc.reset();
            rpc.setLocalNode("http://127.0.0.0");
            assert.strictEqual(rpc.nodes.local, "http://127.0.0.0");
            assert.deepEqual(rpc.nodes.hosted, HOSTED_NODES);
            rpc.broadcast(command, function (err) {
                assert.isNotNull(err);
                assert.property(err, "error");
                assert.property(err, "message");
                assert.strictEqual(err.error, 410);
                done();
            });
        });

    };

    test({
        id: ++requests,
        jsonrpc: "2.0",
        method: "eth_coinbase",
        params: []
    });
    test({
        id: ++requests,
        jsonrpc: "2.0",
        method: "net_version",
        params: []
    });
    test({
        id: ++requests,
        jsonrpc: "2.0",
        method: "eth_gasPrice",
        params: []
    });

});

describe("Load balancer", function () {

    it("network latency snapshot", function (done) {
        this.timeout(TIMEOUT);
        rpc.balancer = true;
        rpc.reset(true);
        async.each([
            "http://eth1.augur.net",
            "http://eth3.augur.net",
            "http://eth4.augur.net",
            "http://eth5.augur.net"
        ], function (node, nextNode) {
            rpc.nodes.hosted = [node];
            rpc.version(function (version) {
                assert.strictEqual(version, "7");
                assert.property(rpc.latency, node);
                assert.property(rpc.samples, node);
                assert.isAbove(rpc.latency[node], 0);
                assert.strictEqual(rpc.samples[node], 1);
                nextNode();
            });
        }, function (err) {
            assert.isNull(err);
            assert.strictEqual(Object.keys(rpc.latency).length, 4);
            assert.strictEqual(Object.keys(rpc.samples).length, 4);
            done();
        });
    });

    it("single-node mean latency: " + SAMPLES + " samples", function (done) {
        this.timeout(TIMEOUT*4);
        rpc.balancer = false;
        rpc.excision = false;
        rpc.reset(true);
        var node = rpc.nodes.hosted[0];
        var count = 0;
        async.whilst(function () {
            return count < SAMPLES;
        }, function (callback) {
            rpc.version(function (version) {
                assert.strictEqual(version, "7");
                assert.property(rpc.latency, node);
                assert.property(rpc.samples, node);
                assert.isAbove(rpc.latency[node], 0);
                assert.strictEqual(rpc.samples[node], ++count);
                callback();
            });
        }, function (err) {
            assert.isNull(err);
            assert.strictEqual(rpc.samples[node], SAMPLES);
            assert.strictEqual(Object.keys(rpc.latency).length, 1);
            assert.strictEqual(Object.keys(rpc.samples).length, 1);
            done();
        });
    });

    it("mean latency profile: " + SAMPLES*10 + " samples", function (done) {
        this.timeout(TIMEOUT*10);
        rpc.balancer = true;
        rpc.excision = false;
        rpc.reset(true);
        var count = 0;
        async.whilst(function () {
            return ++count < SAMPLES*10;
        }, function (callback) {
            rpc.version(function (version) {
                assert.strictEqual(version, "7");
                callback();
            });
        }, function (err) {
            assert.isNull(err);
            assert.strictEqual(Object.keys(rpc.latency).length, 4);
            assert.strictEqual(Object.keys(rpc.samples).length, 4);
            var total = 0;
            for (var node in rpc.samples) {
                if (!rpc.samples.hasOwnProperty(node)) continue;
                total += rpc.samples[node];
                assert.isAbove(rpc.latency[node], 0);
            }
            assert.strictEqual(total, count - 1);
            done();
        });
    });

});

var callbacks = {
    onSent: function (res) {
        assert.property(res, "txHash");
        assert.property(res, "callReturn");
        assert.strictEqual(res.txHash.length, 66);
    },
    onSuccess: function (res) {
        assert.property(res, "txHash");
        assert.property(res, "callReturn");
        assert.property(res, "blockHash");
        assert.property(res, "blockNumber");
        assert.property(res, "nonce");
        assert.property(res, "transactionIndex");
        assert.property(res, "gas");
        assert.property(res, "gasPrice");
        assert.property(res, "input");
        assert.strictEqual(res.txHash.length, 66);
        assert.strictEqual(res.callReturn, "1");
        assert.isAbove(parseInt(res.blockNumber), 0);
        assert.isAbove(parseInt(res.nonce), 0);
        assert.strictEqual(res.from, COINBASE);
        assert.strictEqual(res.to, contracts.faucets);
        assert.strictEqual(abi.number(res.value), 0);
    }
};

describe("errorCodes", function () {

    var test = function (t) {
        it(t.itx.method, function () {
            var actual = rpc.errorCodes(t.itx, t.response);
            assert.strictEqual(actual, t.expected);
        });
    };

    test({
        itx: {
            to: contracts.faucets,
            from: COINBASE,
            method: "reputationFaucet",
            signature: "i",
            params: "0xf69b5",
            returns: "number"
        },
        response: "1",
        expected: "1"
    });


});

describe("encodeResult", function () {

    var test = function (t) {
        it(t.result + "," + t.returns + " -> " + t.expected, function () {
            var actual = rpc.encodeResult(t.result, t.returns);
            assert.strictEqual(actual, t.expected);
        });
    };

    test({
        result: "1",
        returns: "number",
        expected: "1"
    });

});

describe("fire", function () {

    var test = function (t) {
        it(t.itx.method, function (done) {
            this.timeout(TIMEOUT);
            rpc.fire(t.itx, function (res) {
                assert.strictEqual(res, t.expected);
                done();
            });
        });
    };

    test({
        itx: {
            to: contracts.faucets,
            from: COINBASE,
            method: "reputationFaucet",
            signature: "i",
            params: "0xf69b5",
            returns: "number"
        },
        expected: "1"
    });

});

describe("checkBlockHash", function () {

    var test = function (t) {
        it(t.itx.method, function (done) {
            this.timeout(TIMEOUT);
            rpc.txs[t.txhash] = {
                hash: t.txhash,
                tx: t.tx,
                count: 0,
                status: "pending"
            };
            rpc.checkBlockHash(
                t.tx,
                t.callreturn,
                t.itx,
                t.txhash,
                t.returns,
                function (res) {
                    callbacks.onSent(res);
                    assert.strictEqual(res.callReturn, t.callreturn);
                },
                function (res) {
                    callbacks.onSuccess(res);
                    assert.strictEqual(abi.encode(t.itx), res.input);
                    assert.strictEqual(rpc.txs[t.txhash].status, "confirmed");
                    assert.strictEqual(rpc.txs[t.txhash].count, 1);
                    done();
                },
                done
            );
        });
    };

    test({
        tx: {
            nonce: "0xf22",
            blockHash: "0x043d7f980beb3c59b3335d90c4b14794f4577a71ff591c80858fac8a2f99dc39",
            blockNumber: "0x2f336",
            transactionIndex: "0x0",
            from: "0xaff9cb4dcb19d13b84761c040c91d21dc6c991ec",
            to: "0xd403f1657106c138843ea831bd99cbd2a4b8d648",
            value: "0x0",
            gas: "0x2fd618",
            gasPrice: "0xba43b7400",
            input: "0x988445fe00000000000000000000000000000000000000000000000000000000000f69b5",
            callReturn: "1",
            hash: "0xb47930faa3946f0e2ea64d3dbf479a4ac3b12e6eb59d7a6be402baa3f53f993d"
        },
        callreturn: "1",
        itx: {
            to: contracts.faucets,
            from: COINBASE,
            method: "reputationFaucet",
            signature: "i",
            params: "0xf69b5"
        },
        txhash: "0xb47930faa3946f0e2ea64d3dbf479a4ac3b12e6eb59d7a6be402baa3f53f993d",
        returns: "number"
    });

});

describe("txNotify", function () {

    var test = function (t) {
        it(t.itx.method, function (done) {
            this.timeout(TIMEOUT);
            rpc.txs[t.txhash] = {
                hash: t.txhash,
                tx: t.itx,
                count: 0,
                status: "pending"
            };
            rpc.txNotify(
                t.callreturn,
                t.itx,
                t.txhash,
                t.returns,
                function (res) {
                    callbacks.onSent(res);
                    assert.strictEqual(res.callReturn, t.callreturn);
                },
                function (res) {
                    callbacks.onSuccess(res);
                    assert.notProperty(rpc.notifications, t.txhash);
                    assert.strictEqual(abi.encode(t.itx), res.input);
                    assert.strictEqual(rpc.txs[t.txhash].status, "confirmed");
                    assert.strictEqual(rpc.txs[t.txhash].count, 1);
                    done();
                },
                done
            );
        });
        it("trailing timeout check", function (done) {
            this.timeout(TIMEOUT);
            rpc.TX_POLL_MAX = 2;
            rpc.TX_POLL_INTERVAL = 1;
            rpc.txs[t.txhash] = {
                hash: t.txhash,
                tx: t.itx,
                count: 0,
                status: "pending"
            };
            rpc.txNotify(
                t.callreturn,
                t.itx,
                t.txhash,
                t.returns,
                function (res) {
                    callbacks.onSent(res);
                    assert.strictEqual(res.callReturn, t.callreturn);
                },
                function (res) {
                    callbacks.onSuccess(res);
                    assert.notProperty(rpc.notifications, t.txhash);
                    assert.strictEqual(abi.encode(t.itx), res.input);
                    assert.strictEqual(rpc.txs[t.txhash].status, "confirmed");
                    assert.isTrue(false);
                },
                function (res) {
                    assert.strictEqual(rpc.txs[t.txhash].count, rpc.TX_POLL_MAX);
                    assert.strictEqual(rpc.txs[t.txhash].status, "unconfirmed");
                    assert.deepEqual(res, errors.TRANSACTION_NOT_CONFIRMED);
                    done();
                }
            );
        });
    };

    test({
        callreturn: "1",
        itx: {
            to: contracts.faucets,
            from: COINBASE,
            method: "reputationFaucet",
            signature: "i",
            params: "0xf69b5"
        },
        txhash: "0xb47930faa3946f0e2ea64d3dbf479a4ac3b12e6eb59d7a6be402baa3f53f993d",
        returns: "number"
    });

});

describe("confirmTx", function () {

    var test = function (t) {
        it(t.tx.method, function (done) {
            this.timeout(TIMEOUT);
            delete rpc.txs[t.txhash];
            rpc.confirmTx(
                t.tx,
                t.txhash,
                t.returns,
                function (res) {
                    callbacks.onSent(res);
                    assert.strictEqual(res.callReturn, t.expected);
                },
                function (res) {
                    callbacks.onSuccess(res);
                    assert.strictEqual(abi.encode(t.tx), res.input);
                    done();
                },
                done
            );
        });
    };

    test({
        tx: {
            to: contracts.faucets,
            from: COINBASE,
            method: "reputationFaucet",
            signature: "i",
            params: "0xf69b5",
            returns: "number"
        },
        txhash: "0xb47930faa3946f0e2ea64d3dbf479a4ac3b12e6eb59d7a6be402baa3f53f993d",
        returns: "number",
        expected: "1"
    });

});

describe("transact", function () {

    var test = function (t) {
        it(t.tx.method, function (done) {
            this.timeout(TIMEOUT);
            rpc.TX_POLL_MAX = 64;
            rpc.TX_POLL_INTERVAL = 12000;
            rpc.transact(
                t.tx,
                callbacks.onSent,
                function (res) {
                    callbacks.onSuccess(res);
                    assert.strictEqual(abi.encode(t.tx), res.input);
                    done();
                },
                done
            );
        });
    };

    test({
        tx: {
            to: contracts.faucets,
            from: COINBASE,
            method: "reputationFaucet",
            signature: "i",
            params: "0xf69b5",
            returns: "number"
        }
    });

});
