export default function ({ id, type = "", label, titleSelector="h2", position="top", iconSelector="", content }) {

	if(!id) id = crypto.randomUUID();

	let output = '<panel-selector data-dependencies="/assets/js/PanelSelector.js" id="'+id+'" data-type="'+type+'" data-title-selector="'+titleSelector+'" data-position="'+position+'" data-icon-selector="'+iconSelector+'">'+content+'</panelSelector>';

	return output;
}