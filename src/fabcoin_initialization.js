"use strict";
const childProcess = require('child_process');
const colors = require('colors');
const pathnames = require('./pathnames');
const escapeHtml = require('escape-html');

var numberRequestsRunning = 0;
var maxRequestsRunning = 4;


function fabcoinInitialize(request, response, desiredCommand) {
  console.log("DEBUG: got to here");
  numberRequestsRunning ++;
  if (numberRequestsRunning > maxRequestsRunning){
    response.writeHead(500);
    numberRequestsRunning --;
    return response.end(`Too many (${numberRequestsRunning}) requests running, maximum allowed: ${maxRequestsRunning}`);
  }
  if (desiredCommand[pathnames.fabcoinInitialization] === undefined) {
    response.writeHead(400);
    numberRequestsRunning --;
    return response.end(`Request is missing the ${pathnames.fabcoinInitialization} entry. `);        
  }
  var theCallLabel = desiredCommand[pathnames.fabcoinInitialization];
  if (!(theCallLabel in pathnames.fabcoinInitializationProcedures)){
    response.writeHead(400);
    numberRequestsRunning --;
    return response.end(`Fabcoin initialization call label ${theCallLabel} not found. `);    
  }
  var theNet = "-testnet";
  if (desiredCommand["net"] !== undefined && desiredCommand["net"] !== null) {
    theNet = desiredCommand["net"];
  }
  var theArguments = [theNet, "-daemon"];
  
  var theCommand = `${pathnames.pathname.fabcoind}`;
  console.log(`Executing fabcoin initialization command: ${theCommand}.`.blue);
  console.log(`Arguments: ${theArguments}.`.green);
  var finalData = "";
  try {
    var child = childProcess.spawn(theCommand, theArguments);
    child.stdout.on('data', function(data) {
      console.log(data.toString());
      finalData += data.toString();
    });
    child.stderr.on('data', function(data) {
      console.log(data.toString());
      finalData += data.toString();
    });
    child.on('exit', function(code) {
      console.log(`Fabcoin initialization exited with code: ${code}`.green);
      numberRequestsRunning --;
      if (code === 0){
        response.writeHead(200);
        if (finalData === "") {
          finalData = `Server started correctly on ${theNet} (nothing to output). `;
        }
        response.end(finalData);
      } else {
        response.writeHead(200);
        response.end(`{"error": "${finalData}"}`);
      }
    });
  } catch (e){
    response.writeHead(500);
    numberRequestsRunning --;
    response.end(`Eror: ${escapeHtml(e)}. `);
    console.log(`Error: ${e}`);
  }
  return;
}

module.exports = {
  fabcoinInitialize
}