'use strict';

var resizeClassName = 'akdorFitToWidth';

var styleSheet;
var classRule;


function AsyncForeacher(func, batchSize = 5) {
    this.func = func;
    this.queue = [];
    this.batchSize = batchSize;
    this.i = 0;
    this.processCB = (queueDone) => this._processAsync(queueDone);
    this.running = false;
  }

  AsyncForeacher.prototype = Object.create(Object.prototype);

  AsyncForeacher.prototype.
  add = function(element, run=true) {
    this.queue.push(element);
    if (run) {
      window.setTimeout( () => this.process(), 5);
    }
  }

  AsyncForeacher.prototype.
  _processSync = function(callback) {
    var batchLimit = Math.min(this.i+this.batchSize, this.queue.length);
    for (; this.i < batchLimit; this.i++) {
      this.func(this.queue[this.i]);
      this.queue[this.i] = undefined;
    }
    var queueDone = (this.i == this.queue.length);
    callback(queueDone);
  }


  AsyncForeacher.prototype.
  process = function() {
    if (this.running) {
      return;
    }
    //console.log(`starting loop! i=${this.i}, l=${this.queue.length}, n=${this.queue[this.i].outerHTML}`);
    this.running = true;
    this._processAsync();
  }

  AsyncForeacher.prototype.
  _processAsync = function(queueDone = false) {
    if (queueDone) {
      //console.log('ending loop!');
      this.running = false;
      return;
    }
    window.setTimeout( () => this._processSync(this.processCB) , 5);
  }



function setupStyle() {
  var styleElement = document.createElement('style');
  styleElement.title = 'fitToWidthStyle';
  document.head.appendChild(styleElement);
  return styleElement;  
}


var getStyleSheet = Array.prototype.find.bind(
   document.styleSheets,
   (maybeStyle) => maybeStyle.title == 'fitToWidthStyle'
);

function addStyleSheetRule(rule, styleSheet) {
  var classRuleIndex = styleSheet.insertRule(rule, 0);
  var classRule = styleSheet.cssRules[classRuleIndex];
  return classRule;
}

function setupClass(styleSheet) {
  maxWidthClassRule = addStyleSheetRule(`.${resizeClassName}:not(img) { max-width: auto }`, styleSheet);
  addStyleSheetRule(`.akdorHasLongTextChild { max-width: auto }`, styleSheet);
  minWidthClassRule = addStyleSheetRule(`* .akdorHasLongTextChild { max-width: auto }`, styleSheet);
}


function setMaxWidth(widthInPx) {
  var widthValue = (widthInPx) ?  `${widthInPx}px` : 'auto';
  maxWidthClassRule.style.setProperty('max-width', widthValue, 'important');
  //classRule.style.setProperty('background-color', 'red', 'important');
}

function setMinWidth(widthInPx) {
  var widthValue = (widthInPx) ?  `${widthInPx}px` : 'auto';
  minWidthClassRule.style.setProperty('min-width', widthValue, 'important');
}


function isLongTextNode(node) {
  return (node.nodeType == Node.TEXT_NODE
    && node.nodeValue.length > 10
    && node.nodeValue.trim().length > 10);
}

function isInline(node) {

  if (!node.nodeStyle) {
    var computedStyle = window.getComputedStyle(node);
    if (!computedStyle) {
      return false;
    }
    node.nodeStyle = computedStyle.display;
  }

  if (!node.nodeStyle) {
    return false;
  }

  switch (node.nodeStyle) {
    case 'inline':
    case 'inline-block':
      return true;
    default:
      return false;
  }
}


function hasWidth(node) {
  if (!node.nodeStyle) {
    var computedStyle = window.getComputedStyle(node);
    if (!computedStyle) {
      return;
    }
    node.nodeStyle = computedStyle.display;
  }
  if (!node.nodeStyle) {
    return false;
  }
  switch (node.nodeStyle) {
    case 'inline-block':
    case 'block':
    case 'table-cell':
      return true;
    default:
      return false;
  }
}


function shouldResize(node) {
  return hasWidth(node) && Array.prototype.every.call(
    node.children,
    (node) => isInline(node)
  );
}


function resize(node) {
  node.classList.add(resizeClassName);
}


function onNewNode(node) {
  if (node.tested) {
    return;
  }

  node.tested = true;

  if (isLongTextNode(node)) {
    if (node.parentNode) {
      node.parentNode.akdorHasLongTextChild = true;
      node.parentNode.classList.add('akdorHasLongTextChild');
      node.parentNode.classList.add(resizeClassName);
    }
  }

  if (!(node instanceof Element)) {
    return;
  }


  if (isInline(node)) {
    //do nothing
  } else {
    //console.log('stopping a '+node.nodeName+' from resizing');
    if (node.parentNode && ! node.parentNode.akdorHasLongTextChild) {
      node.parentNode.classList.remove(resizeClassName);
    }
  }

  if (hasWidth(node)) {
    //console.log('setting a '+node.nodeName+' to resize');
    node.classList.add(resizeClassName);
  }
}


function walkChildren(node) {
  elementQueue.add(node, false);
  if (!node.children) {
    return;
  }
  Array.prototype.forEach.call(node.children, walkChildren);
}

function onMutation(mutations, observer) {
  for (let mutation of mutations) {
    for (let newNode of mutation.addedNodes) {
      try {
        if (!loaded) {
          //console.error('mutation called before loaded!');
        } else {
          walkChildren(newNode);
          elementQueue.process();
        }
      } catch (e) {
        //console.error('oh no!');
        //console.error(e.message);
        //console.error(e.stack);
      }
    }
  }
}

var loaded = false;
var elements = Array(1000);
var elementQueue = new AsyncForeacher(onNewNode);

function setupObserver() {

  var observeOptions = {
    'childList': true,
    'subtree': true
  };

  var observer = new MutationObserver(onMutation);
  observer.observe(document.documentElement, observeOptions);

}

var minWidthClassRule;
var maxWidthClassRule;

function main() {
  setupStyle();
  var styleSheet = getStyleSheet();
  setupClass(styleSheet);

  document.addEventListener('DOMContentLoaded', onLoad, false);
  //walkChildren(document.body);
  //for each node

  //windowSizeChanged(classRule);

  //window.addEventListener('resize', onResize.bind(undefined, classRule), false);

  window.setInterval(checkIfResized, 250);
  
}

function onLoad() {
  document.removeEventListener('DOMContentLoaded', onLoad, false);
  loaded = true;

  if (!forSmallScreens()) {
    //console.log('page looks like it\'s for desktop, resizing');
    actuallyWalk();
  }
}


function metaStringToObject(metaString) {
  //"a=asdf; b= adf" => { a: 'asdf', b: 'asdf' }

  var contentData = {};
  metaString.split(',').forEach((contentDatum) => {
    var contentDatumSplit = contentDatum.split('=');
    if (contentDatumSplit.length != 2) {
      return;
    }
    contentData[contentDatumSplit[0].trim()] = contentDatumSplit[1].trim();
  });

  return contentData;
}


function forSmallScreens() {
  var viewportElement = document.querySelector('meta[name=viewport]');
  if (!viewportElement || !viewportElement.content) {
    return false;
  }

  var contentData = metaStringToObject(viewportElement.content);

  if (contentData.width == 'device-width') {
    return true;
  }

  if (parseInt(contentData.width) <= 480) {
    return true;
  }

  if (contentData['initial-scale']) {
    return true;
  }

  return false;
}

function actuallyWalk() {
  //console.log('walking');
  walkChildren(document.body);
  elementQueue.process();
  //console.log('walked');

  //console.log(`observing ${window.location.href}`);
  setupObserver();
  //console.log('...for reals');
}


var oldWidth;
var currentlyResizing;

function checkIfResized() {
  if (oldWidth != window.innerWidth) {
    oldWidth = window.innerWidth;
    currentlyResizing = true;
  } else {
    if (currentlyResizing) {
      windowSizeChanged();
    }
    currentlyResizing = false;
  }
}

var resizeTimout = 0;

function onResize(e) {
  //console.error('event got');
  //console.log(`clearing timer ${window.resizeTimeout}`)
  clearTimeout(resizeTimout);
  resizeTimeout = setTimeout(windowSizeChanged.bind(undefined, classRule), 500);
  //console.log(`new timeout is ${window.resizeTimeout}`)

}

function windowSizeChanged() {
  var viewportWidth = window.innerWidth - 10;
  if (viewportWidth <= 5) {
    return;
  }
  //setMinWidth(viewportWidth, classRule);
  setMaxWidth(viewportWidth);
}

main();