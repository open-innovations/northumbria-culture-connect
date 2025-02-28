The purpose of this stage is to process raw funding data into a candidate longlist broken down by local authority and source.

Dependencies:

* Downloaded funding data (see `get-data.py`)
* `PYTHONPATH` environment variable must include `<PROJECT ROOT>/pipelines`.

## Setup

Import some libraries and local utility functions. Ensure that `PYTHONPATH` is set correctly in the environment running this code.


```python
import petl as etl
from config import RAW, FUNDED_ORGS_LIST, la_names
```

Configure a date parser


```python
date_parser = etl.dateparser('%Y-%m-%d 00:00:00')
```

## Load data

### Arts Council England Investment Programme


```python
ace_investment_programme = (
    etl.fromcsv(RAW / 'arts-council-investment-programme.csv')
    .rename({
            'Applicant Name': 'organisation',
            "Type of organisation\n(NPO/IPSO/Transfer)": 'Source'
            })
    .addfield('Period', '2023/26')
    .cut('organisation', 'Source', 'Local authority', 'Period')
)
```

### Arts Council England Project Grants


```python
ace_project_grants = (
    etl.fromcsv(RAW / 'arts-council-project-grants.csv')
    .convert('Award date', lambda d: date_parser(d).year)
    .rename({
            'Recipient': 'organisation',
            'Award date': 'Period'
            })
    .addfield('Source', 'Project Grant')
    .cut('organisation', 'Source', 'Local authority', 'Period')
)
```

## Combine data

Combine all data into a single table,
then select just the local authorities in the region.
Filter out some missing organisations
and finally aggregate by organisation / Local authority / Source.


```python
data = etl.cat(
    ace_investment_programme,
    ace_project_grants
).selectin(
    'Local authority', la_names
).selectnotin(
    'organisation', ['-']
).convert(
    'organisation', lambda x: x.strip()
).aggregate(
    ('organisation', 'Local authority', 'Source'),
    len,
    field="Number"
).sort(
    ['organisation', 'Local authority']
)
```

Save the funded organisation list.


```python
data.tocsv(FUNDED_ORGS_LIST)
```
