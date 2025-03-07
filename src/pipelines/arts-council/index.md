```python
from collections import OrderedDict
from pathlib import Path
from datetime import datetime

import petl as etl
from pipeline_utils.reference.geo import la_code_lookup, la_names
```

Set up some directories


```python
OUTDIR = Path('../src/data/arts-council/')

OUTDIR.mkdir(exist_ok=True, parents=True)
```

Create a date parser


```python
date_parser = etl.dateparser('%Y-%m-%d 00:00:00', strict=True)
```

## NPO / IPSO


```python
IPDATA = OUTDIR / 'investment-programme/_data'
IPDATA_RELEASE = IPDATA / 'release'
IPDATA_RELEASE.mkdir(exist_ok=True, parents=True)
```


```python
investment_data = (
    etl.fromcsv('../raw/arts-council-investment-programme.csv')
        .selectin('Local authority', la_names)
        .convert('Local authority', lambda n: la_code_lookup[n])
        .unpackdict('Local authority')
        .cut(
            'Applicant Name',
            'Type of organisation\n(NPO/IPSO/Transfer)',
            '2023-26 Annual Funding (Offered 4 Nov 2022)',
            'Main Discipline',
            'LAD24CD',
            'LAD24NM',
            'Levelling Up For Culture Place',
        )
        .rename({
            'Type of organisation\n(NPO/IPSO/Transfer)': 'Type',
            'Applicant Name': 'Recipient',
        })
        .convertnumbers()
        .aggregate(
            (
                'Recipient',
                'Type',
                'LAD24CD',
                'Main Discipline',
            ),
            {
                'number': len,
                'funding': ('2023-26 Annual Funding (Offered 4 Nov 2022)', sum)
            },
            field='Grants'
        )
)
```


```python
investment_data.tocsv(IPDATA_RELEASE / 'funding_by_organisation.csv')
```


```python
investment_data.aggregate(
    ('LAD24CD'),
    {
        'number': ('number', sum),
        'funding': ('funding', sum),
    }
).addfield(
    'average_funding', lambda r: r.funding / r.number
).convert(
    'average_funding', round
).tocsv(IPDATA / 'investment_by_lad.csv')
```


```python
with open(IPDATA / 'processed.yml', 'w') as f:
        f.write(datetime.now().isoformat())
```

## Project Grants data


```python
PGDATA = OUTDIR / 'project-grants/_data'
PGDATA_RELEASE = PGDATA / 'release'
PGDATA_RELEASE.mkdir(exist_ok=True, parents=True)
```


```python
grants_data = (
    etl.fromcsv('../raw/arts-council-project-grants.csv')
        .selectin('Local authority', la_names)
        .convert('Local authority', lambda r: la_code_lookup[r] )
        .unpackdict('Local authority')
        .convert('Award date', date_parser)
        .convert('Award amount', float)
)
```

Grants by Recipient / Local authority


```python
grants_data.aggregate(
    aggregation=len,
    key=('Recipient', 'LAD24CD'),
    field='Grants'
).selecteq(
    'LAD24CD', 'E08000021'
).tocsv(
    PGDATA / 'grants_by_recipient.csv'
)
```


```python
agg = OrderedDict()
agg['value'] = 'Award amount', sum
agg['number'] = len

grants_model = grants_data.cut(
    'Award date', 'LAD24CD', 'Award amount'
).addfield(
    'Year', lambda x: x['Award date'].year
).aggregate(
    ('Year', 'LAD24CD'),
    agg
).addfield(
    'Average award', lambda r: r.value / r.number
).convert(
    'Average award', round
)
```


```python
grants_model.pivot(
    'Year', 'LAD24CD', 'value', sum
).tocsv(
    PGDATA_RELEASE / 'grants_value_by_lad_by_year.csv'
)
```


```python
grants_model.pivot(
    'Year', 'LAD24CD', 'number', sum
).tocsv(
    PGDATA_RELEASE / 'grants_count_by_lad_by_year.csv'
)
```


```python
grants_model.pivot(
    'Year', 'LAD24CD', 'Average award', sum
).tocsv(
    PGDATA_RELEASE / 'grants_average_award_by_lad_by_year.csv'
)
```


```python
with open(PGDATA / 'processed.yml', 'w') as f:
        f.write(datetime.now().isoformat())
```


```python

```
