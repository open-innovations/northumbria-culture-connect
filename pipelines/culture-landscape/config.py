from pipeline_utils.filesystem.paths import RAW_DATA as RAW, SITE as _SITE
from pipeline_utils.reference.geo import la_names

WORKING = RAW / 'culture-landscape'

WORKING.mkdir(exist_ok=True)

# Stage 1 outputs
FUNDED_ORGS_LIST = WORKING / 'funded-organisations.csv'

SITE = _SITE / 'regional/culture-sector/_data'
SITE.mkdir(exist_ok=True, parents=True)
