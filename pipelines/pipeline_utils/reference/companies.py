from pathlib import Path

import petl as etl

_DATA_DIR = Path(__file__).parent / '../../../raw'

_fields = {
    'CompanyName': 'company_name',
    ' CompanyNumber': 'company_number',
    'RegAddress.PostTown': 'post_town',
    'RegAddress.PostCode': 'postcode',
    'SICCode.SicText_1': 'sic_1',
    'SICCode.SicText_2': 'sic_2',
    'SICCode.SicText_3': 'sic_3',
    'SICCode.SicText_4': 'sic_4',
    'URI': 'uri',
}

_all = (
    etl
    .fromcsv(etl.ZipSource(_DATA_DIR / 'company-data.zip', 'BasicCompanyDataAsOneFile-2024-09-01.csv'))
    # .selectin('CompanyStatus', ['Active'])
    # .selectnotin('Accounts.AccountCategory', ['DORMANT'])
    .cut(list(_fields.keys()))
    .rename(_fields)
    .search('postcode', r'^(NE|DH|SR)')
)

_cache = _all.cache()

company_data = _cache

company_lookup = etl.dictlookup(_cache, 'company_name')

company_names = list(_cache.values('company_name'))
