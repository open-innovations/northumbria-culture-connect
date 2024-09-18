'''
Landscape map, stage 1

Process raw funding data into a candidate longlist broken down by local authority and source.
'''

import logging
from pathlib import Path

import petl as etl
from pipeline_utils.reference.geo import la_names

'''
Setup logging
'''

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__file__)

'''
Set document root and date parser
'''

_ROOT = (Path(__file__) / '../..').resolve()
_date_parser = etl.dateparser('%Y-%m-%d 00:00:00')

'''
Load data from Arts Council England

1. Investment programme
2. Project grants
'''

ace_investment_programme = (
    etl.fromcsv(_ROOT / 'raw/arts-council-investment-programme.csv')
    .rename({
            'Applicant Name': 'organisation',
            "Type of organisation\n(NPO/IPSO/Transfer)": 'Source'
            })
    .addfield('Period', '2023/26')
    .cut('organisation', 'Source', 'Local authority')
)

ace_project_grants = (
    etl.fromcsv(_ROOT / 'raw/arts-council-project-grants.csv')
    .convert('Award date', lambda d: _date_parser(d).year)
    .rename({
            'Recipient': 'organisation',
            'Award date': 'Period'
            })
    .addfield('Source', 'Project Grant')
    .cut('organisation', 'Source', 'Local authority', 'Period')
)

'''
Combine all data into a single table,
Then select just the local authorities in the region.
Filter out some missing organisations
And finally aggregate by organisation / Local authority / Source
'''

data = etl.cat(
    ace_investment_programme,
    ace_project_grants
).selectin(
    'Local authority', la_names
).selectnotin(
    'organisation', ['-']
).aggregate(
    ('organisation', 'Local authority', 'Source'),
    len,
    field="Number"
).sort(
    ['organisation', 'Local authority']
)


'''
Save to the raw longlist
'''
data.tocsv(_ROOT / 'raw/landscape-longlist-raw.csv')
