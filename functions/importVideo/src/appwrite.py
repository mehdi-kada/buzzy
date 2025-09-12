import os
from appwrite.client import Client

_client = None

def get_appwrite_client():
    """
    Initializes and returns an Appwrite client using environment variables.
    This function implements a singleton pattern to ensure the client is initialized only once.
    """
    global _client
    if _client is not None:
        return _client
    
    client = Client()
    
    endpoint = os.environ.get("APPWRITE_FUNCTION_API_ENDPOINT")
    project_id = os.environ.get("APPWRITE_FUNCTION_PROJECT_ID")
    api_key = os.environ.get("APPWRITE_FUNCTION_API_KEY")

    if not all([endpoint, project_id, api_key]):
        raise ValueError(
            "Missing one or more required Appwrite environment variables: "
            "APPWRITE_FUNCTION_API_ENDPOINT, APPWRITE_FUNCTION_PROJECT_ID, APPWRITE_FUNCTION_API_KEY"
        )

    client.set_endpoint(endpoint)
    client.set_project(project_id)
    client.set_key(api_key)
    
    _client = client
    return _client
