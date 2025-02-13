export default function ({ title, id, classes, icon, content, }) {
	let output = '<article id="'+(id || crypto.randomUUID())+'" role="tabpanel"';
	if(title) output += ' data-tab-title="'+title+'"';
	if(classes) output += ' class="'+classes+'"';
	if(icon) output += ' data-tab-icon="'+icon+'"';
	output += '>'+content+'</article>';
	return output;
}