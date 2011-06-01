#!/usr/bin/env node

var express = require("express");
var http = require("http");
var mu = require("./lib/mu");
var redis = require("redis-node");
var sys = require("sys");
var url = require("url");

const MAX_RESULTS = 10;  // Set to -1 to get everything.
const FILE_DB = 2;
var fileDb = redis.createClient();
fileDb.select(FILE_DB);

var tmpl = "There are {{count}} results in {{redis}}/{{server}} ms.<br>\n" +
           "{{#results}}<b><a href='/path/{{id}}'>{{id}}</a></b><br>\n" +
             "<ul>{{#values}}" +
               "<li>{{count}}: <a href='/path/{{file}}'>{{file}}</a></li>\n" +
             "{{/values}}</ul><br>\n" +
           "{{/results}}";
var compiled = mu.compileText(tmpl, {});

var app = express.createServer();

app.get("/path/*", function(req, res) {
  var startTime = Date.now();
  res.writeHead(200, {"Content-Type": "text/html"});
  var path = req.params[0];
  var ip_address = req.headers["x-forwarded-for"];
  if (!ip_address)
    ip_address = req.connection.remoteAddress;
  console.log(ip_address + " -> " + path);
  var context = {};
  var done = function() {
    var now = Date.now();
    context.redis = (now - redisStartTime) || 0;
    context.server = (now - startTime) || 0;
    compiled(context)
      .addListener("data", function(c) { res.write(c); })
      .addListener("end", function() {
        res.end();
        var after = Date.now() - startTime;
        console.log("  Time: "+context.redis+"/"+context.server+"/"+after+" ms");
      });
  };

  var redisStartTime = Date.now();
  fileDb.keys("*"+path+"*", function(err, arrayOfKeys) {
    count = arrayOfKeys.length;
    context.count = count;
    context.results = [];
    if (!count)
      done();
    arrayOfKeys.forEach(function(key) {
      fileDb.zrevrange(key, 0, MAX_RESULTS, "withscores", function(err, values) {
        subcontext = {id: key, values: []};
        values.forEach(function(value) {
          for (var i in value)
            subcontext.values.push({file: i, count:value[i]});
        });
        context.results.push(subcontext)
        count--;
        if (count == 0)
          done();
      });
    });
  });
});

app.use(express.staticProvider(__dirname + '/client'));
app.listen(8123);

console.log("Server running at http://127.0.0.1:8123/");
