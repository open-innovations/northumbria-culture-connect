from io import StringIO


import requests
import geopandas as gpd


def list_services():
    with requests.get(
        'https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/',
        params={
            'f': 'json'
        }
    ) as r:
        services = r.json()
    return services

def load_geojson(feature_server):
    with requests.get(f"{feature_server}/0/query",
                    params={
                        'where': '1=1',
                        'f': 'geojson',
                        'outFields': 'LAD24CD,LAD24NM,LAD24NMW,LAT,LONG',
                        'geometryPrecision': 5
                    }) as r:
        df = gpd.read_file(StringIO(r.text))

    return df