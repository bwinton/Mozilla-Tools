#!/usr/bin/env node

var http = require("http");
var mu = require("./lib/mu");
var redis = require("redis-node");
var sys = require("sys");
var url = require("url");

const MAX_RESULTS = 10;  // Set to -1 to get everything.
const FILE_DB = 2;
var fileDb = redis.createClient();
fileDb.select(FILE_DB);

var tmpl = "There are {{count}} results.<br>\n" +
           "{{#results}}<b><a href='/{{id}}'>{{id}}</a></b><br>\n" +
             "<ul>{{#values}}" +
               "<li>{{count}}: {{file}}</li>\n" +
             "{{/values}}</ul><br>\n" +
           "{{/results}}";
var compiled = mu.compileText(tmpl, {});

http.createServer(function(req, res) {
  res.writeHead(200, {"Content-Type": "text/html"});
  var path = url.parse(req.url).pathname.substr(1);
  console.log(path);
  var context = {};
  var done = function() {
    compiled(context)
      .addListener("data", function(c) { res.write(c); })
      .addListener("end", function() {res.end(); });
  };
  fileDb.keys("*"+path+"*", function(err, arrayOfKeys) {
    count = arrayOfKeys.length;
    context.count = count;
    context.results = [];
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
}).listen(8123, "127.0.0.1");

console.log("Server running at http://127.0.0.1:8123/");
