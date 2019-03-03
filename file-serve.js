"use strict";

var fileServer = require('node-static');

var file = new fileServer.Server('.', {
  cache: 1,
  headers: {
    'Access-Control-Allow-Origin': '*'
  }
});

var glob = require("globby")
var pathTrie = require('path-trie');

function getFiles() {
  return glob(["**/*.sml", "!node_modules/**"]);
}

function serveFiles(request, response) {
  file.serve(request, response, function (err, res) {
    if (err) {
      console.error("> Error serving " +request.url + "-" +err.message);
      response.writeHead(err.status, err.headers);
      response.end();
    } else {
      console.log("> " + request.url + " - " + res.message);
    }
  })
}

function removeEndToken(pathStructure) {
  const result = [];
  for (var path in pathStructure) {
    if (path === "@") return false;
    else {
      var del = removeEndToken(pathStructure[path]);
      var arrayOfFiles = {};
      arrayOfFiles[path] = del;
      if (del) result.push(arrayOfFiles);
      else result.push(path)
    }
  }
  return result;
}

// TODO files should be updated when removed/added
getFiles().then(function (paths) {
  var dict = {};
  paths.forEach(function(path) {
    dict[path] = true;
  });
  var result = {
    '.': removeEndToken(pathTrie(dict))
  };

  require('http').createServer(function (request, response) {
    response.setHeader('Access-Control-Allow-Origin', '*');

    if(request.url=='/') {
      var json = JSON.stringify(result);
      response.write(json, "UTF-8");
      response.end();
    } else {
      serveFiles(request, response);
    }
  }).listen(8080);
});

console.log("> node static is listening on http://127.0.0.1:8080");