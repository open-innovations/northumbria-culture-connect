import re
import petl as etl
from ..filesystem.paths import REF_DATA

_onspd = etl.fromcsv(REF_DATA / 'onspd_extract.csv').cache()

postcode_lookup = _onspd.dictlookupone('pcds')


def normalise_postcode(raw_pcd):
    return re.sub(r"^(\w*?)\s*(\w{3})$", r"\1 \2", raw_pcd.strip().upper())
