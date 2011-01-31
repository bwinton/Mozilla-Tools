#!/usr/bin/env node

var http = require("http");
var redis = require("redis-node");
var sys = require("sys");
var url = require("url");

var fileDb = redis.createClient();
const FILE_DB = 2;
fileDb.select(FILE_DB);

http.createServer(function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  var path = url.parse(req.url).pathname.substr(1);
  console.log(path);
  var done = function() { res.end() };
  fileDb.keys("*"+path+"*", function(err, arrayOfKeys) {
    count = arrayOfKeys.length;
    arrayOfKeys.forEach(function(key) {
      fileDb.zrevrange(key, 0, -1, "withscores", function(err, value) {
        res.write(key + "<br><ul>\n");
        value.forEach(function(val) {
          res.write("<li>"+JSON.stringify(val)+"</li>\n");
        });
        res.write("</ul>\n");
        count--;
        if (count == 0)
          done();
      });
    });
  });
}).listen(8123, "127.0.0.1");

console.log('Server running at http://127.0.0.1:8123/');
