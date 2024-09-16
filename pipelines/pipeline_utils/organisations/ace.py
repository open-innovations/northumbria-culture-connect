import petl as etl
import requests
from bs4 import BeautifulSoup

request_headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
}


def get_sources(url, **kwargs):
    '''Find links on page matching kwargs flags'''
    with requests.get(url, headers=request_headers) as r:
        soup = BeautifulSoup(r.text, 'html.parser')

    return [
        f"https://www.artscouncil.org.uk/{a['href']}"
        for a
        in soup.find_all('a', **kwargs)
    ]


def url_source(url):
    '''Construct a valid remote source to download from Arts Council England'''
    return etl.RemoteSource(url, client_kwargs={'headers': request_headers})
