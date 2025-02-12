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

    const boundaryLayer = L.geoJSON(boundaries);
    boundaryLayer.addTo(map);

    const bounds = L.latLngBounds(); 
    bounds.extend(boundaryLayer.getBounds());

    const orgs = data
        .filter(o => o.latitude && o.longitude)
        .map(o => ({
            ...o,
            sic_code: JSON.parse(o.sic_code) || [],
        }));

    const popupTemplate = (props, extraRows = () => '') => `<div class='cs-popup'>
        <p style="font-weight: bold; font-size: 1.5em;">${props.organisation}</p>
        <table>
        <tr><td>Postcode</td><td>${ props.pcds && `${ props.pcds }` || '' }</td></tr>
        <tr><td>Company number</td><td>
            <!-- <a href="${ props.uri }"> -->
            ${ props.company_number }
            <!-- </a> -->
        </td></tr>
        <tr><td>SIC code</td><td>${ props.sic_code.join('<br>') }</td></tr>
        ${ extraRows(props) }
        </table>
    </div>`;

    const popupFragFunded = (props) => (props.funded === 'True') ? `
        <tr><td>Funding type</td><td>${ [
            props.NPO ==='True' && 'NPO',
            props.IPSO  ==='True' && 'IPSO',
            props['Project Grant'] === 'True' && 'Project Grant'
        ].filter(x => x).join(', ') }</td></tr>
        <tr><td>Funding area</td><td>${ props.funding_geo_name }</td></tr>
    
    ` : '';

    const funded = L.featureGroup()
        .bindPopup((l) => `<div class='cs-popup'>
            ${ popupTemplate(l.options.props, popupFragFunded) }
        </div>`)

    const matchedCompany = L.featureGroup()
        .bindPopup((l) => `<div class='cs-popup'>
            ${ popupTemplate(l.options.props) }
        </div>`)

    const others = L.featureGroup()
        .bindPopup((l) => `<div class='cs-popup'>
            ${ popupTemplate(l.options.props) }
        </div>`);

    for (const o of orgs) {
        const marker = L.circleMarker([o.latitude, o.longitude], {
            props: { ...o },
            color: '#777',
        });
        if (o.funded === 'True') {
            marker.setStyle(({ color: 'green' }))
            funded.addLayer(marker);
            continue;
        }
        if (o.company_match === 'True') {
            marker.setStyle(({ color: 'red' }))
            matchedCompany.addLayer(marker);
            continue;
        }

        others.addLayer(marker);
    }
    layerControl.addOverlay(funded, 'Funded organisations');

    layerControl.addOverlay(matchedCompany, 'Matched companies');

    matchedCompany.addTo(map);
    funded.addTo(map);

    if (others.getLayers().length > 0) {
        layerControl.addOverlay(others, 'Other organisations');
    }

    // Add scale control to map
    L.control.scale().addTo(map);

    map.flyToBounds(bounds);
}