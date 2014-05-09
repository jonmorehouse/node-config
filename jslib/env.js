// Generated by CoffeeScript 1.6.3
(function() {
  var getEnv, helpers, setCamelCase, setEnv, setObject,
    _this = this;

  helpers = require("./helpers");

  getEnv = function(key) {
    return helpers.normalizeValue(process.env[key]);
  };

  setCamelCase = function(key) {
    var err, objKey;
    objKey = helpers.camelCase(key);
    if (process.env[key] != null) {
      config[objKey] = getEnv(key);
      return config[key] = getEnv(key);
    } else {
      err = new Error("Invalid key");
      if (typeof cb !== "undefined" && cb !== null) {
        return typeof cb === "function" ? cb(err) : void 0;
      }
      throw err;
    }
  };

  setEnv = function(key) {
    return config[key] = getEnv(key);
  };

  setObject = function(key) {
    var piece, pieces, _recurser;
    pieces = (function() {
      var _i, _len, _ref, _results;
      _ref = key.split("_");
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        piece = _ref[_i];
        _results.push(piece.toLowerCase());
      }
      return _results;
    })();
    return (_recurser = function(keys, pObj) {
      if (keys.length === 0) {

      } else if (keys.length === 1) {
        return pObj[keys[0]] = getEnv(key);
      } else {
        if ((pObj[keys[0]] == null) || !typeof pObj[keys[0]] === "object") {
          pObj[keys[0]] = {};
        }
        return _recurser(keys.slice(1), pObj[keys[0]]);
      }
    })(pieces, config);
  };

  module.exports = function(keys, cb) {
    var key, _fn, _i, _len,
      _this = this;
    if (!typeof keys === 'array') {
      keys = [keys];
    }
    _fn = function(key) {
      setCamelCase(key);
      setObject(key);
      return setEnv(key);
    };
    for (_i = 0, _len = keys.length; _i < _len; _i++) {
      key = keys[_i];
      _fn(key);
    }
    return typeof cb === "function" ? cb() : void 0;
  };

}).call(this);
