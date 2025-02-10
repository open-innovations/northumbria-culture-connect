# Stage 4

Purpose: Query companies house data for other, unfunded, organisations.


```python
import ast
import json

import petl as etl
from config import SITE
from pipeline_utils.filesystem.paths import DATA
```


```python
culture_landscape_data = (
    etl
    .fromcsv(DATA / 'culture_landscape.csv')
    .replaceall('', None)
    .selectne('accounts_category', 'DORMANT')
    .selectin('oslaua', ['E08000021', None])
    .selectin('funding_geo_code', ['E08000021', None])
    .selectnotin('company_status', ['Liquidation'])
    .cut(
        'organisation',
        # Geographic area
        'latitude', 'longitude', 'pcds', 'oslaua',
        # Funding
        'IPSO', 'NPO', 'Project Grant', 'funding_geo_code', 'funding_geo_name',
        # Companies house data
        'company_number', 'accounts_category', 'sic_code', 'uri',
        # Charity information
        'registered_charity_number', 'charity_contact_web'
    )
    .convert(['IPSO', 'NPO', 'Project Grant'], lambda x: x == 'True')
    .convert('sic_code', ast.literal_eval)
    .addfield('funded', lambda r: any([r.IPSO, r.NPO, r['Project Grant']]))
    .addfield('company_match', lambda r: r.company_number is not None)
    .addfield('charity_match', lambda r: r.registered_charity_number is not None)
).cache()
```


```python
culture_landscape_data.convert('sic_code', json.dumps).tocsv(SITE / 'list.csv')
```


```python
def gen(row):
    for v in row['sic_code']:
        yield [v]
        
sic_data = (
    culture_landscape_data
    .cut('sic_code')
    .selectnotnone('sic_code')
)

json.dump(
    dict(
        sic_data
        .rowmapmany(gen, ['sic_code'])
        .aggregate('sic_code', len)
        .sort('value', reverse=True)
        .records()
    ),
    open(SITE / 'sic_code_count.json', 'w'),
    indent=2
)
```

Build summary


```python
json.dump(
    dict(etl.cat(
        culture_landscape_data.aggregate(None, len).addfield('variable', 'total_organisations', 0),
        culture_landscape_data.selecttrue('funded').aggregate(None, len).addfield('variable', 'funded_organisations', 0),
        culture_landscape_data.selecttrue('IPSO').aggregate(None, len).addfield('variable', 'funded_organisations_ipso', 0),
        culture_landscape_data.selecttrue('NPO').aggregate(None, len).addfield('variable', 'funded_organisations_npo', 0),
        culture_landscape_data.selectnotnone('company_number').aggregate(None, len).addfield('variable', 'matched_to_companies_house', 0),
        culture_landscape_data.selectnotnone('registered_charity_number').aggregate(None, len).addfield('variable', 'matched_to_charity_commission', 0),
        culture_landscape_data.selectnone('company_number').selectnone('registered_charity_number').aggregate(None, len).addfield('variable', 'unmatched', 0),
        sic_data.aggregate(None, len).addfield('variable', 'valid_sic_codes', 0),
    ).records()),
    open(SITE / 'summary.json', 'w'),
    indent=2,
)
```


```python

```
