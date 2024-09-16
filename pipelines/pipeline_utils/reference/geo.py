import petl as etl

local_authorities = [
    {
        'LAD24CD': 'E06000047', 'LAD24NM': 'County Durham'
    }, {
        'LAD24CD': 'E06000057', 'LAD24NM': 'Northumberland'
    }, {
        'LAD24CD': 'E08000021', 'LAD24NM': 'Newcastle upon Tyne'
    }, {
        'LAD24CD': 'E08000022', 'LAD24NM': 'North Tyneside'
    }, {
        'LAD24CD': 'E08000023', 'LAD24NM': 'South Tyneside'
    }, {
        'LAD24CD': 'E08000024', 'LAD24NM': 'Sunderland'
    }, {
        'LAD24CD': 'E08000037', 'LAD24NM': 'Gateshead'
    },
]

la_names = [l['LAD24NM'] for l in local_authorities]

la_code_lookup = etl.dictlookupone(etl.fromdicts(local_authorities), 'LAD24NM')
