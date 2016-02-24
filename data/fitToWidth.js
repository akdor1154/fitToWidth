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
}




function isInline(node) {
  var nodeStyle = window.getComputedStyle(node);
  if (!nodeStyle) {
    return false;
  }
  switch (nodeStyle.display) {
    case 'inline':
    case 'inline-block':
      return true;
    default:
      return false;
  }
}


function hasWidth(node) {
  var nodeStyle = window.getComputedStyle(node);
  if (!nodeStyle) {
    return false;
  }
  switch (nodeStyle.display) {
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


function walkChildren(node) {
  if (shouldResize(node)) {
    resize(node)
  }
  for (var child of node.children) {
    walkChildren(child);
  }
}


function main() {

  setupStyle();
  var styleSheet = getStyleSheet();
  var classRule = setupClass(styleSheet);

  walkChildren(document.body);
  //for each node

  windowSizeChanged(classRule);

  //window.addEventListener('resize', onResize.bind(undefined, classRule), false);

  window.setInterval(checkIfResized.bind(undefined, classRule), 250);

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