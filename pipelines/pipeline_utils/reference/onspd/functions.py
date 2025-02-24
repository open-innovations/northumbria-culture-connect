import re

def normalise_postcode(raw_pcd):
    return re.sub(r"^(\w*?)\s*(\w{3})$", r"\1 \2", raw_pcd.strip().upper())
