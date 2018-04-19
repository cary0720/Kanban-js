#!/usr/bin/env node
/**
 * Entry point for Kanban
 * 
 */

"use strict";
const pathnames = require('./pathnames')
const https = require('https');
const http = require('http');
const handleRequests = require('./handle_requests');
const fs = require('fs');
const execSync = require('child_process').execSync;
const handleRequest = require('./handle_requests');
const colors = require('colors');
const buildFrontEnd = require('./build_frontend');
global.kanban = {
  openCLDriverStarted: false,
  openCLDriver: null
};

const gpuDB = require('./gpu_functions');
gpuDB.testGPU();

// This line is from the Node.js HTTPS documentation.

if (!fs.existsSync(pathnames.pathname.privateKey)) {
  console.log(`Private key file: ${pathnames.pathname.privateKey} appears not to exist. Let me create that for you. Answer all prompts please (enter for defaults). `);
  execSync(`openssl req -new -newkey rsa:2048 -days 3000 -nodes -x509 -subj "/C=CA/ST=ON/L=Markham/O=FA Enterprise System/CN=none" -keyout ${pathnames.pathname.privateKey} -out ${pathnames.pathname.certificate}`);
}

buildFrontEnd.buildFrontEnd();

var options = {
  cert: fs.readFileSync(pathnames.pathname.certificate),
  key: fs.readFileSync(pathnames.pathname.privateKey)
};

var portHttps = 52907;
var portHttp = 51846;

var serverHTTPS = https.createServer(options, handleRequest.handle_requests);
serverHTTPS.listen(portHttps, function(){
  console.log(`Listening on https port: ${portHttps}`.green);
});

var serverHTTP = http.createServer(handleRequest.handle_requests);
serverHTTP.listen(portHttp, function(){
  console.log(`Listening on http port: ${portHttp}`.yellow);
});