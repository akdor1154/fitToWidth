'use strict';

var resizeClassName = 'akdorFitToWidth';

var styleSheet;
var classRule;


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


function setupClass(styleSheet) {
  var classRuleIndex = styleSheet.insertRule(`.${resizeClassName} { max-width: auto }`, 0);
  var classRule = styleSheet.cssRules[classRuleIndex];
  return classRule;
}


function setWidth(widthInPx, classRule) {
  var widthValue = (widthInPx) ?  `${widthInPx}px` : 'auto';
  classRule.style.setProperty('max-width', widthValue, 'important');
  //classRule.style.setProperty('background-color', 'red', 'important');
}




function isInline(node) {
  if (!node.nodeStyle) {
    node.nodeStyle = window.getComputedStyle(node).display;
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
    node.nodeStyle = window.getComputedStyle(node).display;
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
  if (!(node instanceof Element)) {
    return;
  }

  if (node.tested) {
    return;
  }

  node.tested = true;

  if (isInline(node)) {
    //do nothing
  } else {
    //console.log('stopping a '+node.nodeName+' from resizing');
    if (node.parentNode) {
      node.parentNode.classList.remove(resizeClassName);
    }
  }

  if (hasWidth(node)) {
    //console.log('setting a '+node.nodeName+' to resize');
    node.classList.add(resizeClassName);
  }
}


function walkChildren(node) {
  onNewNode(node);
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
          elements.push(newNode);
        } else {
          walkChildren(newNode);
        }
      } catch (e) {
        console.error(e.message);
        console.error(e.stack);
      }
    }
  }
}

var loaded = false;
var elements = Array(1000);

function main() {

  var observeOptions = {
    'childList': true,
    'subtree': true
  };

  var observer = new MutationObserver(onMutation);
  observer.observe(document.documentElement, observeOptions)
  
  setupStyle();
  var styleSheet = getStyleSheet();
  var classRule = setupClass(styleSheet);

  document.addEventListener('DOMContentLoaded', onLoad, false);
  //walkChildren(document.body);
  //for each node

  //windowSizeChanged(classRule);

  //window.addEventListener('resize', onResize.bind(undefined, classRule), false);

  window.setInterval(checkIfResized.bind(undefined, classRule), 250);
  
}

function onLoad() {
  loaded = true;
  actuallyWalk(elements);
}

function actuallyWalk(elements) {
  console.log('walking');
  elements.forEach(walkChildren);
  console.log('walked');
}


var oldWidth;
var currentlyResizing;

function checkIfResized(classRule) {
  if (oldWidth != window.innerWidth) {
    oldWidth = window.innerWidth;
    currentlyResizing = true;
  } else {
    if (currentlyResizing) {
      windowSizeChanged(classRule);
    }
    currentlyResizing = false;
  }
}

var resizeTimout = 0;

function onResize(classRule, e) {
  //console.error('event got');
  //console.log(`clearing timer ${window.resizeTimeout}`)
  clearTimeout(resizeTimout);
  resizeTimeout = setTimeout(windowSizeChanged.bind(undefined, classRule), 500);
  //console.log(`new timeout is ${window.resizeTimeout}`)

}

function windowSizeChanged(classRule) {
  var viewportWidth = window.innerWidth - 10;
  if (viewportWidth <= 5) {
    return;
  }
  setWidth(viewportWidth, classRule);
}

main();