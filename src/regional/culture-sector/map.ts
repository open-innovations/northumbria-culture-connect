export function initialiseMap({
    id,
    centre,
    data,
    boundaries,
}) {
    const map = L.map(id, { scrollWheelZoom: false }).setView(centre, 13);
    map.attributionControl.setPrefix(false)

    const baseMap = L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 20,
        attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OSM</a> contributors &copy; <a href=\"https://carto.com/attributions\">CARTO</a>",
        subdomains: "abcd",
    })

    baseMap.addTo(map);

	const layerControl = L.control.layers().addTo(map);

	const boundaryLayer = L.geoJSON(boundaries,{
		style: function (feature) {
			return {'color':'var(--col-darkgrey)','fill':false};
		}
	});
    boundaryLayer.addTo(map);

    const bounds = L.latLngBounds(); 
    bounds.extend(boundaryLayer.getBounds());

	const icons = {
		'funded': {'class':'bg-green-100','icon':L.divIcon({'html':'<div class="sector-icon bg-green-100">£</div>'})},
		'matched': {'class':'bg-green-25','icon':L.divIcon({'html':'<div class="sector-icon bg-green-25">+</div>'})}
	}

    const orgs = data
        .filter(o => o.latitude && o.longitude)
        .map(o => ({
            ...o,
            sic_code: JSON.parse(o.sic_code) || [],
        }));

    const popupTemplate = (props, extraRows = () => '') => {
		let cls = '';
		if(props.group) cls = ' '+props.group;
		var html = '<div class="cs-popup'+(cls||'')+'">';
		html += '<h3>' + props.organisation + '</h3>';
        html += '<table>';
        if(props.pcds) html += '<tr><td>Postcode</td><td>'+(props.pcds && props.pcds || '')+'</td></tr>';
        if(props.company_number) html += '<tr><td>Company number</td><td>'+props.company_number+'</td></tr>';
        if(props.sic_code) html += '<tr><td>SIC code</td><td>' + props.sic_code.join("<br>") + '</td></tr>';
        html += extraRows(props);
        html += '</table>';
		html += '</div>';
		return html;
	}

    const popupFragFunded = (props) => (props.funded === 'True') ? `
        <tr><td>Funding type</td><td>${ [
            props.NPO ==='True' && 'NPO',
            props.IPSO  ==='True' && 'IPSO',
            props['Project Grant'] === 'True' && 'Project Grant'
        ].filter(x => x).join(', ') }</td></tr>
        <tr><td>Funding area</td><td>${ props.funding_geo_name }</td></tr>
    
    ` : '';

    const funded = L.featureGroup()
		.bindPopup((l) => popupTemplate(l.options.props, popupFragFunded),{'className':icons.funded.class,'minWidth':350});

    const matchedCompany = L.featureGroup()
		.bindPopup((l) => popupTemplate(l.options.props),{'className':icons.matched.class,'minWidth':350});

    const others = L.featureGroup()
		.bindPopup((l) => popupTemplate(l.options.props));

    for (const o of orgs) {
        if (o.funded === 'True') {
			o.group = "funded";
			const marker = L.marker([o.latitude, o.longitude], {icon: icons['funded'].icon, props: { ...o }});
			funded.addLayer(marker);
            continue;
        } else if (o.company_match === 'True') {
			o.group = "matched";
			const marker = L.marker([o.latitude, o.longitude], {icon: icons['matched'].icon, props: { ...o }});
	        matchedCompany.addLayer(marker);
            continue;
        } else {
			o.group = "other";
	        others.addLayer(marker);
		}
    }

    layerControl.addOverlay(funded, icons.funded.icon.options.html+'Funded organisations');
    layerControl.addOverlay(matchedCompany, icons.matched.icon.options.html+'Matched companies');

    matchedCompany.addTo(map);
    funded.addTo(map);

    if (others.getLayers().length > 0) {
        layerControl.addOverlay(others, 'Other organisations');
    }

    // Add scale control to map
    L.control.scale().addTo(map);

    map.flyToBounds(bounds);


	map.on("popupopen", function (e) {
		console.log(e.popup,e.popup._container);
		let el = e.popup._container;
		let colour = "";
		if(el) colour = window.getComputedStyle(el)['backgroundColor'];
		console.log(colour);
		el.querySelector(".leaflet-popup-tip").style['backgroundColor'] = colour;
		/*
		var style = "background-color:"+colour+"!important;color:"+OI.contrastColour(colour)+"!important;";
		el.querySelector(".leaflet-popup-content-wrapper").setAttribute("style",style);
		el.querySelector(".leaflet-popup-close-button").setAttribute("style",style);*/
	});
}