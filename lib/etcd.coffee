Etcd = require 'node-etcd'
require "./index"
env = require "./env"
async = require 'async'
h = require "./helpers"

# module wide vars
etcd = null
watchers = {}

getClient = ->

    # return cached value is possible
    return etcd if etcd?

    # set up required etcd configuration
    config.etcdHost ?= env.getEnv "ETCD_HOST", "localhost"
    config.etcdPort ?= env.getEnv "ETCD_PORT", 4001
    config.etcdNamespace ?= env.getEnv "ETCD_NAMESPACE", ""
    etcd = new Etcd config.etcdHost, config.etcdPort

setFromResponse = (res) ->

  key = res.node.key.replace "/", ""
  config[key] = res.node.value

setFromKey = (key, args...) ->

  [opts, cb] = h.argParser args..., {recursive: true}
  etcd.get key, (err, res) ->
    return cb? err if err 
    setFromResponse res
    cb?()

setWatcher = (key, cb) ->
  
  # return if watcher already exists
  return cb?() if key of watchers

  # this is really hacky because there is something weird about the etcd library not playing nice
  _etc = new Etcd config.etcdHost, config.etcdPort
  watchers[key] = _etc.watcher key
  watchers[key].on "set", (res) ->
    setFromResponse res

  watchers[key].on "error", (res) ->

  cb?()

stopWatcher = (key,cb) ->

  return cb?() if key not of watchers
  watchers[key].on "stop", (err) =>
    delete watchers[key]
    cb?()

  watchers[key].stop()

loadKeys = (keys, args...) ->

  [opts, cb] = h.argParser args..., {watch: true}
  keys = if keys instanceof Array then keys else [keys]
  etcd ?= getClient()

  async.eachSeries keys, setFromKey, (err) =>
    return cb? err if err?
    
    if opts.watch? and opts.watch
      setWatcher key for key in keys

    cb?()
    
close = (cb) ->

  #close all existing watchers
  async.eachSeries (key for key of watchers), stopWatcher, (err) =>
    # close client
    cb?()

module.exports =
  loadKeys: loadKeys
  close: close
  getClient: getClient
  watchers: watchers


