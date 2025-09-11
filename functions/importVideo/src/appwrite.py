import os
from appwrite.client import Client

_client = None

def get_appwrite_client():
    global _client
    if _client is not  None:
        return _client
    
    client = Client()
    # client.set_endpoint(os.environ.get("APPWRITE_ENDPOINT", "https://fra.cloud.appwrite.io/v1"))
    # client.set_project(os.environ.get("APPWRITE_PROJECT_ID"))
    # client.set_key(os.environ.get("APPWRITE_API_KEY"))
    client.set_endpoint("https://fra.cloud.appwrite.io/v1")
    client.set_project("68b176e6002132376d96")
    client.set_key("standard_be69d8260420697361403ea7a2abf1e96b87a7ca344fcdc6dcdfdbddaf5febaaa6e278c9c56f2145c941f1b75918930f0a54bb1ce277fe28d84d2a4731b163c0746423e01764f79352f4a559a416dfbd414f59a538a0ec80dc2b50ff659f814eda976e4050cc0f4f96aee56c5c79f0f1c0ef827639509390e7d0b2cce12316db")
    _client = client
    return _client


    # client.set_endpoint(os.environ['APPWRITE_FUNCTION_ENDPOINT'])
    # client.set_project(os.environ['APPWRITE_FUNCTION_PROJECT_ID'])
    # client.set_key(os.environ['APPWRITE_FUNCTION_API_KEY'])
    # client.set_endpoint("https://fra.cloud.appwrite.io/v1")
    # client.set_project("68b176e6002132376d96")
    # client.set_key("standard_be69d8260420697361403ea7a2abf1e96b87a7ca344fcdc6dcdfdbddaf5febaaa6e278c9c56f2145c941f1b75918930f0a54bb1ce277fe28d84d2a4731b163c0746423e01764f79352f4a559a416dfbd414f59a538a0ec80dc2b50ff659f814eda976e4050cc0f4f96aee56c5c79f0f1c0ef827639509390e7d0b2cce12316db")