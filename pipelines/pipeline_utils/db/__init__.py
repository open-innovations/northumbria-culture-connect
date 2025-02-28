import duckdb
from pipeline_utils.filesystem.paths import RAW_DATA

DB_PATH = RAW_DATA / 'data-lake.db'


def connect(**kwargs):
    return duckdb.connect(DB_PATH, **kwargs)
