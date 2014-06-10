// Generated by CoffeeScript 1.7.1
(function() {
  var Etcd, async, close, env, etcd, getClient, h, load, merge, setFromKey, setFromResponse, setWatcher, stopWatcher, watchers,
    __slice = [].slice;

  Etcd = require('node-etcd');

  require("./index");

  env = require("./env");

  async = require('async');

  h = require("./helpers");

  merge = require("./merge");

  etcd = null;

  watchers = {};

  getClient = function() {
    if (etcd != null) {
      return etcd;
    }
    if (config.etcdHost == null) {
      config.etcdHost = env.get("ETCD_HOST", "localhost");
    }
    if (config.etcdPort == null) {
      config.etcdPort = env.get("ETCD_PORT", 4001);
    }
    if (config.etcdNamespace == null) {
      config.etcdNamespace = env.get("ETCD_NAMESPACE", "");
    }
    return etcd = new Etcd(config.etcdHost, config.etcdPort);
  };

  setFromResponse = function(res, cb) {
    var key, keys, node, _i, _len, _ref;
    key = res.node.key.replace("/", "");
    if ((res.node.dir == null) || !res.node.dir || (res.node.nodes == null)) {
      config[key] = res.node.value;
      return typeof cb === "function" ? cb() : void 0;
    }
    keys = [];
    _ref = res.node.nodes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      node = _ref[_i];
      if ((node.dir == null) || !res.node.dir) {
        h.setObject(node.key, node.value, config, /[\/]+/);
        continue;
      }
      keys.push(node.key);
    }
    return async.each(keys, setFromKey, function(err) {
      return typeof cb === "function" ? cb() : void 0;
    });
  };

  setFromKey = function() {
    var args, cb, key, opts, _ref;
    key = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    _ref = h.argParser.apply(h, __slice.call(args).concat([{
      recursive: true
    }])), opts = _ref[0], cb = _ref[1];
    return etcd.get(key, function(err, res) {
      if (err) {
        return typeof cb === "function" ? cb(err) : void 0;
      }
      return setFromResponse(res, cb);
    });
  };

  setWatcher = function(key, cb) {
    var _etc;
    if (key in watchers) {
      return typeof cb === "function" ? cb() : void 0;
    }
    _etc = new Etcd(config.etcdHost, config.etcdPort);
    watchers[key] = _etc.watcher(key);
    watchers[key].on("set", function(res) {
      return setFromResponse(res);
    });
    watchers[key].on("error", function(res) {});
    return typeof cb === "function" ? cb() : void 0;
  };

  stopWatcher = function(key, cb) {
    if (!(key in watchers)) {
      return typeof cb === "function" ? cb() : void 0;
    }
    watchers[key].on("stop", (function(_this) {
      return function(err) {
        delete watchers[key];
        return typeof cb === "function" ? cb() : void 0;
      };
    })(this));
    return watchers[key].stop();
  };

  load = function() {
    var args, cb, keys, opts, _ref;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    _ref = h.splatParser.apply(h, args), keys = _ref[0], opts = _ref[1], cb = _ref[2];
    if (opts == null) {
      opts = {};
    }
    if (opts.recursive == null) {
      opts.recursive = true;
    }
    if (etcd == null) {
      etcd = getClient();
    }
    return async.eachSeries(keys, setFromKey, (function(_this) {
      return function(err) {
        var key, _i, _j, _len, _len1, _val;
        if (err != null) {
          return typeof cb === "function" ? cb(err) : void 0;
        }
        if ((opts.watch != null) && opts.watch) {
          for (_i = 0, _len = keys.length; _i < _len; _i++) {
            key = keys[_i];
            setWatcher(key);
          }
        }
        if ((opts.namespace != null) && !opts.namespace) {
          for (_j = 0, _len1 = keys.length; _j < _len1; _j++) {
            key = keys[_j];
            _val = config[key];
            merge(_val);
            if (_val[key] == null) {
              delete config[key];
            }
          }
        }
        return typeof cb === "function" ? cb() : void 0;
      };
    })(this));
  };

  close = function(cb) {
    var key;
    return async.eachSeries((function() {
      var _results;
      _results = [];
      for (key in watchers) {
        _results.push(key);
      }
      return _results;
    })(), stopWatcher, (function(_this) {
      return function(err) {
        return typeof cb === "function" ? cb() : void 0;
      };
    })(this));
  };

  module.exports = {
    load: load,
    close: close,
    getClient: getClient,
    watchers: watchers
  };

}).call(this);
