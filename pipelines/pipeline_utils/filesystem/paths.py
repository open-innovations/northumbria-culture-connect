from pathlib import Path

_ROOT = (Path(__file__).parent / '../../..').resolve()

RAW_DATA = _ROOT / 'raw'

DATA = _ROOT / 'data'

REF_DATA = DATA / 'reference'

SITE = _ROOT / 'src'

RAW_DATA.mkdir(exist_ok=True, parents=True)
DATA.mkdir(exist_ok=True, parents=True)
REF_DATA.mkdir(exist_ok=True, parents=True)