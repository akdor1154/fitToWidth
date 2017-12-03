'use strict';

var resizeClassName = 'akdorFitToWidth';
var hasLongTextChildClassName = 'akdorHasLongTextChild';
var styleSheetName = 'fitToWidthStyle';

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
  styleElement.title = styleSheetName;
  document.head.appendChild(styleElement);
  return styleElement;  
}


var getStyleSheet = () => Array.prototype.find.call(
   document.styleSheets,
   (maybeStyle) => maybeStyle.title == styleSheetName
);

function addStyleSheetRule(rule, styleSheet) {
  var classRuleIndex = styleSheet.insertRule(rule, 0);
  var classRule = styleSheet.cssRules[classRuleIndex];
  return classRule;
}

function setupClass(styleSheet) {
  maxWidthClassRule = addStyleSheetRule(`.${resizeClassName}:not(img) { max-width: auto }`, styleSheet);
  addStyleSheetRule(`.${hasLongTextChildClassName} { max-width: auto }`, styleSheet);
  addStyleSheetRule(`* .${hasLongTextChildClassName} { max-width: auto }`, styleSheet);
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
      return true;
    }
    node.nodeStyle = computedStyle.display;
  }

  if (!node.nodeStyle) {
    return true;
  }

  switch (node.nodeStyle) {
    case 'inline':
    //case 'inline-block':
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
    if (node.parentNode && !node.parentNode.akdorHasLongTextChild) {
      node.parentNode.akdorHasLongTextChild = true;
      node.parentNode.classList.add(hasLongTextChildClassName);
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
  Array.prototype.forEach.call(node.childNodes, walkChildren);
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
var elementQueue = new AsyncForeacher(onNewNode, 40);

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
  document.addEventListener('DOMContentLoaded', onLoad, false);
}

function onLoad() {
  //console.log('running onLoad');
  document.removeEventListener('DOMContentLoaded', onLoad, false);
  loaded = true;

  if (!forSmallScreens()) {

    setup();
    //console.log('page looks like it\'s for desktop, resizing');
    actuallyWalk();

  } else {
    //console.log('page looks like it\'s for mobile, leaving alone');
  }
}

function setup() {
  setupStyle();
  var styleSheet = getStyleSheet();
  setupClass(styleSheet);

  window.setInterval(checkIfResized, 250);
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
      windowSizeChanged(oldWidth);
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

function windowSizeChanged(oldWidth) {
  var viewportWidth = window.innerWidth - 10;
  if (viewportWidth <= 5) {
    return;
  }
  //setMinWidth(viewportWidth, classRule);

  var elementToScrollTo = guessFocusedElement(Math.min(oldWidth, window.innerWidth));

  setMaxWidth(viewportWidth);

  window.requestAnimationFrame(() => {
    if (elementToScrollTo && !isElementVisible(elementToScrollTo)) {
      console.log('we need to scroll');
      elementToScrollTo.scrollIntoView();
    } else {
      console.log('no need to scroll');
    }
  });
}


function* coordinates({minX, maxX, numX, minY, maxY, numY}) {
  for (let yi = 0; yi < numY; yi++) {
    for (let xi = 0; xi < numX; xi++) {
      yield [
        minX + (xi * (maxX - minX) / (numX-1)),
        minY + (yi * (maxY - minY) / (numY-1)),
      ];
    }
  }
}

function focusedElementCoordinates(width, height) {
  const numX = 6;
  const numY = 4;

  const minY = 0.2 * height;
  const maxY = 0.6 * height;

  const minX = 0.1 * width;
  const maxX = 0.9 * width;

  return coordinates({minX, maxX, numX, minY, maxY, numY});
}

function zoomOutElementCoordinates() {

}

function* maybeFocusedElements(width, height) {
  const html = document.querySelector('html');
  for (let coord of focusedElementCoordinates(width, height)) {
    const element = document.elementFromPoint(...coord);
    if (element !== document.body && element !== html) {
      yield element;
    } 
  }
}


function getMostCommon(iterator) {
  const counts = new Map();
  for (const item of iterator) {
    if (! counts.has(item) ) {
      counts.set(item, 1);
    } else {
      counts.set(item, counts.get(item)+1);
    }
  }
  console.log(counts);
  let maxCount = 0;
  let maxElement = undefined;
  for (const [element, count] of counts) {
    if (count > maxCount) {
      maxCount = count;
      maxElement = element;
    }
  }
  return maxElement;
}

function guessFocusedElement(width) {
  return getMostCommon(maybeFocusedElements(width, window.innerHeight));
}


function isElementVisible(el) {
  
      var rect = el.getBoundingClientRect();
  
      const middleX = rect.left + rect.width / 2;
      const middleY = rect.top + rect.height / 2;

      console.dir({
        middleX,
        middleY,
        height: window.innerHeight,
        width: window.innerWidth
      })
      return (
          middleX >= 0 &&
          middleY >= 0 &&
          middleY <= (window.innerHeight) && 
          middleX <= (window.innerWidth)
      );
  }