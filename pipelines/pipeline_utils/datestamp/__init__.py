from datetime import datetime
from pathlib import Path


def save_datestamp(file: Path):
    Path(file).parent.mkdir(exist_ok=True, parents=True)
    with open(file, 'w') as f:
        f.write(datetime.now().isoformat())
