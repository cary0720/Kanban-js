"use srict";
const submitRequests = require('./submit_requests');

function JSONTransformer() {
  /**@type {Object.<string,{clickHandler:function, content: any}>} */
  this.bindings = {};
}

var keyWeights = {
  height: 1000,
  hash: 100,
  tx: 50,
  blockhash: 40,
  previousblockhash: 30,
  previousBlock: 30,
  nextblockhash: 29,
  confirmations: 10
};

JSONTransformer.prototype.bindButtons = function() {
  for (var label in this.bindings) {
    var currentElement = document.getElementById(label);
    var currentLabelData = this.bindings[label];
    var currentHandler = currentLabelData.clickHandler;
    currentElement.addEventListener('click', currentHandler.bind(null, currentElement, currentLabelData.content));
  }
}

JSONTransformer.prototype.writeJSONtoDOMComponent =  function(inputJSON, theDomComponent, options) {
  this.bindings = {};
  if (typeof theDomComponent === "string") {
    theDomComponent = document.getElementById(theDomComponent);
  }
  var outputHTML = this.getHtmlFromArrayOfObjects(inputJSON, options);
  theDomComponent.innerHTML = outputHTML;
  this.bindButtons();
}

var totalClickableEntries = 0;

function getLabelString(input) {
  if (typeof input === "string") {
    if (Number(input).toString() === input) {
      return "${number}";
    }
    return input;
  }
  if (typeof input === "number") {
    return "${number}";
  }
  if (Array.isArray(input)) {
    var result = "";
    for (var i = 0; i < input.length; i ++) {
      result += getLabelString(input[i]);
      if (i !== input.length -1) {
        result += ".";
      }
    }
    return result;
  }
  return "unknown";
}

JSONTransformer.prototype.getClickableEntry = function(input, transformers, /** @type {string}*/ label) {
  if (transformers === undefined || transformers === null) {
    return input;
  } 
  if (!(label in transformers)) {
    return input;
  }
  //var shouldHighlight = true;
  var theTransformer = transformers[label];
  //if (!shouldHighlight) {
  //  return input;
  //}
  return this.getClickableEntryUsingTransformer(input, theTransformer)
}

/** @returns {string} */
JSONTransformer.prototype.getClickableEntryUsingTransformer = function(input, theTransformer) {
  if (theTransformer === undefined || theTransformer === null) {
    return input;
  }
  totalClickableEntries ++;
  var currentId = `buttonJSONTransformer${totalClickableEntries}`;
  this.bindings[currentId] = {
    content: input,
    grandParentLabel: null,
    clickHandler: theTransformer.clickHandler
  }
  var result = "";
  result += `<button class = "buttonRPCInput" id = "${currentId}">`; 
  if (theTransformer.transformer !== undefined && theTransformer.transformer !== null) {
    result += theTransformer.transformer(input);
  } else {
    result += input;
  }
  result += "</button>";
  return result;
}

var totalEntriesToDisplayAtEnds = 4;

JSONTransformer.prototype.getTableHorizontallyLaidFromJSON = function(input, transformers, label) {
  if (
    typeof input === "string" || 
    typeof input === "number" ||
    typeof input === "boolean"
  ) {
    return this.getClickableEntry(input, transformers, label);
  }
  var newLabel;
  if (typeof input === "object") {
    var result = "";
    result += "<table class='tableJSON'>";
    var arrayLength = 0;
    if (Array.isArray(input)) {
      arrayLength = input.length;
    } 
    var numSoFar = 0;
    for (item in input) {
      numSoFar ++;
      if (label !== "" && typeof label === "string") {
        newLabel = getLabelString([label, item]);
      }
      if (arrayLength == 0 || numSoFar <= totalEntriesToDisplayAtEnds || numSoFar > arrayLength - totalEntriesToDisplayAtEnds) {
        result += `<tr><td>${item}</td><td>${this.getTableHorizontallyLaidFromJSON(input[item], transformers, newLabel)}</td></tr>`; 
      }
      if (arrayLength > 0 && numSoFar === totalEntriesToDisplayAtEnds && totalEntriesToDisplayAtEnds * 2 < arrayLength) {
        result += "<tr><td>...</td></tr>";
      }
    }
    result += "</table>";
    return result;
  }
  
  return typeof input;
}

function getLabelWeight(label) {
  if (label in keyWeights) {
    return keyWeights[label];
  }
  return - 1;
}

function labelComparisonOperator(left, right) {
  if (getLabelWeight(left) > getLabelWeight(right)) {
    return - 1;
  }
  if (getLabelWeight(left) < getLabelWeight(right)) {
    return 1;
  }
  if (left < right) {
    return - 1;
  }  
  if (left > right) {
    return 1;
  }
  return 0;
}

function getLabelsRows(input) {
  var result = {
    labels: [],
    rows: []
  };
  var labelFinder = {};
  for (var counterRow = 0; counterRow < input.length; counterRow ++) {
    for (var label in input[counterRow]) {
      labelFinder[label] = true;
    }
  }
  result.labels = Object.keys(labelFinder).sort(labelComparisonOperator);
  for (var counterRow = 0; counterRow < input.length; counterRow ++) {
    var currentInputItem = input[counterRow];
    result.rows.push([]);
    var currentOutputItem = result.rows[result.rows.length - 1];
    for (var counterLabel = 0; counterLabel < result.labels.length; counterLabel ++) {
      var label = result.labels[counterLabel];
      if (label in currentInputItem) {
        currentOutputItem.push(currentInputItem[label]);
      } else {
        currentOutputItem.push("");
      }
    }
  }
  return result;
}

var numberCallsGetHtmlFromArrayOfObjects = 0;
function getClearParentButton() {
  numberCallsGetHtmlFromArrayOfObjects ++;
  var theId = `clearButton${numberCallsGetHtmlFromArrayOfObjects}`;
  return `<button id = '${theId}' class = "buttonProgress" onclick = "window.kanban.submitRequests.deleteParent(this.id);">clear</button>`;
}

var labelAbbreviations = {
  "difficulty" : "diff.",
  "gasUsed": "g.used",
  "hashNoSignature": "hash no sig",
  "logsBloom": "l-bloom",
  "receiptsRoot": "rec.rt.",
  "totalDifficulty": "tl. diff.",
  "transactions": "txs",
  "transactionsRoot": "txRoot",
}

function shortenHeaderIfNeedBe(/** @type {string}*/ header) {
  if (!(header in labelAbbreviations)) {
    return header
  }
  return labelAbbreviations[header];
}

JSONTransformer.prototype.getHtmlFromArrayOfObjects = function(input, options) {
  var doIncludeTogglePolling = false; 
  var doShowClearButton = true;
  if (options.flagDontShowClearButton === true) {
    doShowClearButton = false;
  }
  var outputPolling = null; 
  if (options.polling !== undefined && options.polling !== null) {
    doIncludeTogglePolling = options.polling.doPoll;
    outputPolling = options.polling.output;
  }
  var inputJSON = input;
  if (typeof inputJSON === "string") {
    inputJSON = input.replace(/[\r\n]/g, " "); 
    if (inputJSON[0] !== "{" && inputJSON[0] !== "[" && input[0] !== "\"") {
      inputJSON = `"${inputJSON}"`;
    }
    try {
      inputJSON = JSON.parse(inputJSON);
    } catch (e) {
      return `${getClearParentButton()}<br>${input}<br><b style='color:red; font-size: small'>Could not parse input as JSON.</b>`;
    }
  }
  var rawButton = "";
  var clearButton = "";
  if (doIncludeTogglePolling === true) {
    rawButton = submitRequests.getToggleButtonPausePolling({label: "raw", content: JSON.stringify(input), output: outputPolling});
  } else {
    rawButton = submitRequests.getToggleButton({label: "raw", content: JSON.stringify(input)});
  }
  if (doShowClearButton) {
    clearButton = getClearParentButton();
  }
  var result = "";
  result += rawButton;
  result += clearButton;
  result += "<br>";
  if (typeof inputJSON === "object" && !Array.isArray(inputJSON)) {
    inputJSON = [inputJSON];
  }
  var shouldLayoutAsArrayOfObjects = false; 
  if (Array.isArray(inputJSON)) {
    if (inputJSON.length > 0) {
      if (typeof inputJSON[0] === "object") {
        shouldLayoutAsArrayOfObjects = true; 
      }
    }
  }
  var shouldLayoutAsArrayTable = false;
  if (!shouldLayoutAsArrayOfObjects) {
    if (Array.isArray(inputJSON)) {
      shouldLayoutAsArrayTable = true;
    }
  }
  var transformers = options.transformers;
  if (transformers === undefined || transformers === null) {
    transformers = {};
  }
  if (shouldLayoutAsArrayOfObjects) {
    var labelsRows = getLabelsRows(inputJSON);
    result += "<table class='tableJSON'>";
    result += "<tr>";
    for (var counterColumn = 0; counterColumn < labelsRows.labels.length; counterColumn ++) {
      var header = this.getClickableEntryUsingTransformer(labelsRows.labels[counterColumn], transformers.labelsAtFirstLevel);
      if (transformers.labelsAtFirstLevel === undefined) {
        header = `<small>${shortenHeaderIfNeedBe(header)}</small>`;
      }
      result += `<th>${header}</th>`;
    }
    for (var counterRow = 0; counterRow < labelsRows.rows.length; counterRow ++) {
      result += "<tr>";
      for (var counterColumn = 0; counterColumn < labelsRows.labels.length; counterColumn ++) {
        var currentEntry = this.getTableHorizontallyLaidFromJSON(labelsRows.rows[counterRow][counterColumn], transformers, labelsRows.labels[counterColumn]);
        result += `<td>${currentEntry}</td>`;
      }
      result += "</tr>";
    }
    result += "</tr>";
    result += "</table>";
  } else if (shouldLayoutAsArrayTable) {
    result += this.getTableHorizontallyLaidFromJSON(inputJSON, transformers, "", "", "");
  } else {
    result += `${this.getClickableEntryUsingTransformer(inputJSON, transformers.singleEntry)}<br>`; 
  }

  return result;
}

module.exports = {
  JSONTransformer,
  getClearParentButton
}