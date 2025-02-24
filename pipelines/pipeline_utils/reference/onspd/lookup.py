import petl as etl

from ...filesystem.paths import REF_DATA

_onspd = etl.fromcsv(REF_DATA / 'onspd_extract.csv').cache()

postcode_lookup = _onspd.dictlookupone('pcds')
