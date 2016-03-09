var pageMod = require('sdk/page-mod');

exports.main = function() {

	pageMod.PageMod({
		include: '*',
		contentScriptFile: './fitToWidth.js',
		contentScriptWhen: 'start',
		attachTo: 'top'
	});

}

exports.onUnload = function() {}
