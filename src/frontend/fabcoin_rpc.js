"use strict";
const submitRequests = require('./submit_requests');
const pathnames = require('../pathnames');
const ids = require('./ids_dom_elements');
const jsonToHtml = require('./json_to_html');
const Block = require('../bitcoinjs_src/block');

function getPage(){
  return window.kanban.thePage;
}

function getBlockHash(){
  return document.getElementById(ids.defaults.inputBlockHash);
}

function getBestBlockIndex(){
  return document.getElementById(ids.defaults.inputBestBlockIndex);
}

function getSpanProgress(){ 
  return document.getElementById(ids.defaults.progressReport);
}

function getOutputBlockInfoDiv(){
  return document.getElementById(ids.defaults.outputRPCBlockInfo);
}

function getOutputTXInfoDiv(){
  return document.getElementById(ids.defaults.outputRPCTXInfo);
}

function updateBlockInfoPage(){
  if (getPage().pages.blockInfo.updateFunction === getBlock){
    document.getElementById(ids.defaults.radioButtonBestBlock).checked = true;
    getBestBlockHash();
  } else {
    getPage().pages.blockInfo.updateFunction();
  }
}

function updateTXInfoPage(){
  if (document.getElementById(ids.defaults.radioButtonTransactionsListUnspent).checked === true) {
    getListUnspent();
  } else {
    getTXoutSetInfo();
  }
}

function updatePages(){
  var currentPage = getPage().pages[getPage().currentPageLabel]; 
  if (currentPage === getPage().pages.txInfo){
    return updateTXInfoPage();
  }
  if (currentPage === getPage().pages.blockInfo){
    return updateBlockInfoPage();
  }
  if (currentPage === getPage().pages.network){
    return getPage().pages.network.updateFunction();
  }
}

function setTestNet(){
  getPage().pages.blockInfo.currentNet = "-testnet";
  updatePages();
}

function setMainNet(){
  getPage().pages.blockInfo.currentNet = "-mainnet";
  updatePages();
}

function setRegtest(){
  getPage().pages.blockInfo.currentNet = "-regtest";
  updatePages();
}

function getBlockCallback(inputHex, outputComponent){
  if (getPage().pages.blockInfo.verbosity === "0"){
    var theBlock = Block.fromHex(inputHex);
    jsonToHtml.writeJSONtoDOMComponent(theBlock.toHumanReadableHex(), outputComponent);
    getPage().pages.blockInfo.updateFunction = getBlock;
  } else {
    jsonToHtml.writeJSONtoDOMComponent(inputHex, outputComponent);
  }
}
function getBlock() {
  getPage().pages.blockInfo.verbosity = "0";
  if (document.getElementById(ids.defaults.checkboxBlockVerbose).checked){
    getPage().pages.blockInfo.verbosity = "1";  
  }
  document.getElementById(ids.defaults.radioButtonBlockInfo).checked = true;
  var theURL = pathnames.getURLfromRPCLabel(
    pathnames.rpcCalls.getBlock.rpcCall, {
      blockHash: getBlockHash().value, 
      verbosity: getPage().pages.blockInfo.verbosity,
      net: getPage().pages.blockInfo.currentNet,
    }
  );
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputBlockInfoDiv(),
    callback: getBlockCallback
  });
}

function getPeerInfoCallBack(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}

function getPeerInfo() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getPeerInfo.rpcCall, {
      net: getPage().pages.blockInfo.currentNet,
    }),
    progress: getSpanProgress(),
    result : ids.defaults.outputRPCNetwork,
    callback: getPeerInfoCallBack
  });
}

function getBestBlockHashCallback(inputHex, outputComponent) {
  getBlockHash().value = inputHex;
  jsonToHtml.writeJSONtoDOMComponent(inputHex, outputComponent);
  getPage().pages.blockInfo.updateFunction = getBestBlockHash;  
}

function getBestBlockHash() {
  var index = getBestBlockIndex().value;  
  var theURL = "";
  if (index === null || index === undefined || index === "") {
    theURL = pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getBestBlockHash.rpcCall, {
      net: getPage().pages.blockInfo.currentNet
    });
  } else {
    theURL = pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getBlockHash.rpcCall,{
      net: getPage().pages.blockInfo.currentNet,
      index: index
    });
  }
  submitRequests.submitGET({
    url: theURL,
    progress: getSpanProgress(),
    result : getOutputBlockInfoDiv(),
    callback: getBestBlockHashCallback
  });
}

function getTXoutSetInfoCallback(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}

function getTXoutSetInfo(){
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getTXOutSetInfo.rpcCall, {
      net: getPage().pages.blockInfo.currentNet,
    }),
    progress: getSpanProgress(),
    result : getOutputTXInfoDiv(),
    callback: getTXoutSetInfoCallback
  });  
}

function getTXoutCallback(input, outputComponent){
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}

function getTXout(){
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getTXOut.rpcCall, {
      net: getPage().pages.blockInfo.currentNet,
    }),
    progress: getSpanProgress(),
    result : getOutputTXInfoDiv(),
    callback: getTXoutCallback
  });  
}

function getReceivedByAccountCallback(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}

function getReceivedByAccount() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.getReceivedByAccount.rpcCall, {
      net: getPage().pages.blockInfo.currentNet,
    }),
    progress: getSpanProgress(),
    result : getOutputTXInfoDiv(),
    callback: getReceivedByAccountCallback
  });  
}

function listAccountsCallback(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}

function listAccounts() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.listAccounts.rpcCall, {
      net: getPage().pages.blockInfo.currentNet,
    }),
    progress: getSpanProgress(),
    result : getOutputTXInfoDiv(),
    callback: listAccountsCallback
  });  
}

function listUnspentCallback(input, outputComponent) {
  jsonToHtml.writeJSONtoDOMComponent(input, outputComponent);
}

function getListUnspent() {
  submitRequests.submitGET({
    url: pathnames.getURLfromRPCLabel(pathnames.rpcCalls.listUnspent.rpcCall, {
      net: getPage().pages.blockInfo.currentNet,
    }),
    progress: getSpanProgress(),
    result : getOutputTXInfoDiv(),
    callback: listUnspentCallback
  });  
}

module.exports = {
  getPeerInfo, 
  getBestBlockHash,
  getBlock,
  setTestNet,
  setMainNet,
  setRegtest,
  getTXoutSetInfo,
  getTXout,
  getReceivedByAccount,
  getListUnspent,
  listAccounts,
}