var pageMod = require('sdk/page-mod');

console.log('hello from index');

pageMod.PageMod({
	include: '*',
	contentScriptFile: './fitToWidth.js'
});
