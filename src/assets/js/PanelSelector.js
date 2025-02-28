/* PanelSelector version 1.1 */
(function(root){

	if(!root.OI) root.OI = {};
	if(!root.OI.ready){
		root.OI.ready = function(fn){
			// Version 1.1
			if(document.readyState != 'loading') fn();
			else document.addEventListener('DOMContentLoaded', fn);
		};
	}

})(window || this);

OI.ready(function(){

	// Add default CSS
	var styles = document.createElement('style');
	styles.innerHTML = `
		panel-selector { display: block; }
		panel-selector + *, * + panel-selector { margin-top: 1em; }
		panel-selector [role="tablist"] {
			display: inline-block;
			margin: 0;
			padding: 0;
			list-style: none;
		}
		panel-selector [role="tablist"] > * {
			display: inline-block;
			margin-right: 0.5rem;
			margin-bottom: 0.5rem;
		}
		panel-selector [role="tab"] {
			position: relative;
			display: inline-block;
			text-align:center;
			padding: 0.5em;
			text-decoration: none;
			color: inherit;
			border: 1px solid var(--col-white);
			font-weight: bold;
			border-radius: 8px;
			background: var(--col-white);
			color: var(--col-black);
		}
		panel-selector [role="tab"][aria-selected="true"] {
			background: transparent;
			color: var(--col-white);
		}
		panel-selector [role="tabpanel"] {
			display: block;
		}
		panel-selector [role="tabpanel"][hidden=true] {
			display: none;
		}
		panel-selector [role=tab] .icon {
			float: right;
			margin-left: 0.25rem;
			margin-top: 0.125em;
		}`;
	document.head.prepend(styles);
	
	var panelSelectors = document.querySelectorAll('panel-selector');
	var p;
	var icons = {
		'line': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="icon bi bi-graph-up" viewBox="0 0 16 16"><path fill-rule="evenodd" d="M0 0h1v15h15v1H0zm14.817 3.113a.5.5 0 0 1 .07.704l-4.5 5.5a.5.5 0 0 1-.74.037L7.06 6.767l-3.656 5.027a.5.5 0 0 1-.808-.588l4-5.5a.5.5 0 0 1 .758-.06l2.609 2.61 4.15-5.073a.5.5 0 0 1 .704-.07"/></svg>',
		'table': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="icon bi bi-table" viewBox="0 0 16 16"><path d="M0 2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2zm15 2h-4v3h4zm0 4h-4v3h4zm0 4h-4v3h3a1 1 0 0 0 1-1zm-5 3v-3H6v3zm-5 0v-3H1v2a1 1 0 0 0 1 1zm-4-4h4V8H1zm0-4h4V4H1zm5-3v3h4V4zm4 4H6v3h4z"/></svg>',
		'waffle': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="icon bi bi-grid-3x3-gap-fill" viewBox="0 0 16 16"><path d="M1 2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zM1 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1zM1 12a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1zm5 0a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1z"/></svg>',
		'bar': '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="icon" viewBox="0 0 16 16"><path d="M0,0h1v1h10v4h-10v1h15v4h-15v1h5v4h-5v1h-1z"/></svg>'
	}
	
	function panelSelector(el){

		var type,titleSelector,position,idx,list,panel,panels,li,title,tabs,id,_obj,iconSelector,icon,a;
		type = el.getAttribute('data-type');
		titleSelector = el.getAttribute('data-title-selector')||'';
		iconSelector = el.getAttribute('data-icon-selector')||'';
		position = el.getAttribute('data-position');
		id = el.id;
		
		panels = el.querySelectorAll('[role="tabpanel"]');
		
		el.setAttribute('style','--tab-count: '+panels.length+';');

		if(type=="select") list = document.createElement('select');
		else list = document.createElement('ul');
		
		list.setAttribute('role','tablist');
		
		for(idx = 0; idx < panels.length; idx++){
			panel = panels[idx];

			if(!panel.id) panel.setAttribute('id', id+'-section'+(idx + 1));

			if(panel.getAttribute('data-tab-title')){
				title = panel.getAttribute('data-tab-title');
			}else{
				if(titleSelector && panel.querySelector(titleSelector)){
					title = panel.querySelector(titleSelector).innerHTML;
					panel.setAttribute('data-tab-title',title);
				}else{
					console.warning("No title provided for",panel);
				}
			}

			// Build the link
			a = document.createElement('a');
			a.href = '#'+panel.id;
			a.setAttribute('role','tab');
			a.setAttribute('aria-controls',panel.id);
			a.innerHTML = title;
			if(panel.getAttribute('data-tab-icon')){
				icon = panel.getAttribute('data-tab-icon');
				if(icon in icons){
					a.innerHTML += icons[icon];
				}else{
					console.warning('No icon "'+icon+'" is known.');
				}
			}else{
				if(iconSelector && panel.querySelector(iconSelector)){
					a.appendChild(panel.querySelector(iconSelector));
				}
			}
			// Build the list item
			li = document.createElement('li');
			li.appendChild(a);
			list.append(li);
		}
		if(position=="bottom") el.append(list);
		else el.prepend(list);
		
		_obj = this;

		if(type=="select"){
			
		}else{

			this.setTab = function(tab,updateHistory){
				var mtab;
				for(t = 0; t < tabs.length; t++){
					if(tab==tabs[t] || tab==tabs[t].getAttribute('href')) mtab = tabs[t];
				}
				if(mtab){

					// Remove all current selected tabs
					list.querySelectorAll('[aria-selected="true"]').forEach((t) => t.setAttribute("aria-selected", false));

					// Set this tab as selected
					mtab.setAttribute("aria-selected", true);

					// Hide all tab panels
					panels.forEach((p) => p.setAttribute("hidden", true));

					// Show the selected panel
					el.querySelector(`#${mtab.getAttribute("aria-controls")}`).removeAttribute("hidden");

					if(updateHistory){
						history.pushState({ tab: mtab.getAttribute('href') }, "title 1", mtab.getAttribute('href'));
					}
				}
			};

			tabs = el.querySelectorAll('[role="tab"]');

			// Add a click event handler to each tab
			tabs.forEach((tab) => {
				tab.addEventListener("click", function(e){ e.preventDefault(); e.stopPropagation(); _obj.setTab(e.target,true) });
			});

			// Enable arrow navigation between tabs in the tab list
			let tabFocus = 0;

			list.addEventListener("keydown", (e) => {
				if(e.key === "ArrowRight" || e.key === "ArrowLeft"){

					tabs[tabFocus].setAttribute("tabindex", -1);
					if(e.key === "ArrowRight"){
						// Move right
						tabFocus++;
						// If we're at the end, go to the start
						if(tabFocus >= tabs.length) tabFocus = 0;
					}else if(e.key === "ArrowLeft"){
						// Move left
						tabFocus--;
						// If we're at the start, move to the end
						if(tabFocus < 0) tabFocus = tabs.length - 1;
					}

					tabs[tabFocus].setAttribute("tabindex", 0);
					tabs[tabFocus].focus();
					this.setTab(tabs[tabFocus],true);
				}
			});
			this.setTab(tabs[0],false);
		}

		return this;
	}
	var ps = new Array(panelSelectors.length)
	for(p = 0; p < panelSelectors.length; p++) ps[p] = new panelSelector(panelSelectors[p]);

	function triggerTab(tab){
		for(var p = 0; p < ps.length; p++){
			ps[p].setTab(tab,false);
		}
	}

	if(location.hash) triggerTab(location.hash);
	window.addEventListener("popstate", (event) => {
		if(location.hash) triggerTab(location.hash);
	});
});