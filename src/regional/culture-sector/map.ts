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
		'funded': {'class':'bg-pink-100','icon':L.divIcon({'html':'<div class="sector-icon bg-pink-100">£</div>'})},
		'matched': {'class':'bg-pink-25','icon':L.divIcon({'html':'<div class="sector-icon bg-pink-25">+</div>'})}
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

	// Find out how many times coordinates are repeated
	let coords = {};
    for (const o of orgs) {
		let c = o.latitude.toFixed(4)+o.longitude.toFixed(4);
		o.coord = c;
		if(!(c in coords)) coords[c] = 0;
		coords[c]++;
	}

    for (const o of orgs) {
		
		// Remove one from the counter
		coords[o.coord]--;
		// Find the offset position for the coords[o.coord] position
		let c = squareSpiral(o.latitude,o.longitude,coords[o.coord],0.00008);
		
        if (o.funded === 'True') {
			o.group = "funded";
			const marker = L.marker([c.lat, c.lon], {icon: icons['funded'].icon, props: { ...o }});
			funded.addLayer(marker);
            continue;
        } else if (o.company_match === 'True') {
			o.group = "matched";
			const marker = L.marker([c.lat, c.lon], {icon: icons['matched'].icon, props: { ...o }});
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
		let el = e.popup._container;
		let colour = "";
		if(el) colour = window.getComputedStyle(el)['backgroundColor'];
		el.querySelector(".leaflet-popup-tip").style['backgroundColor'] = colour;
	});

	// Spiral outwards in a square grid from lat,lon
	function squareSpiral(lat,lon,n,separation){
		var offsets = [
			[0,0],
			[1,0],
			[1,1],
			[0,1],
			[-1,1],
			[-1,0],
			[-1,-1],
			[0,-1],
			[1,-1],
			[2,-1],
			[2,0],
			[2,1],
			[2,2],
			[1,2],
			[0,2],
			[-1,2],
			[-2,2],
			[-2,1],
			[-2,0],
			[-2,-1]
		];
		var x,y,i = Math.min(n,offsets.length);
		x = lon + offsets[i][0]*separation/Math.cos(lat*Math.PI/180);
		y = lat - offsets[i][1]*separation;
		return {'lat':y,'lon':x};
	}
}