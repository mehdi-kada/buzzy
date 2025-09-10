import os
import uuid
from re import S
from appwrite.client import Client 
from appwrite.services.storage import Storage
from appwrite.input_file import InputFile

def upload_file_to_storage(file_path: str, bucket_id: str):
    client = Client()
    # client.set_endpoint(os.environ['APPWRITE_FUNCTION_ENDPOINT'])
    # client.set_project(os.environ['APPWRITE_FUNCTION_PROJECT_ID'])
    # client.set_key(os.environ['APPWRITE_FUNCTION_API_KEY'])
    client.set_endpoint("https://fra.cloud.appwrite.io/v1")
    client.set_project("68b176e6002132376d96")
    client.set_key("standard_be69d8260420697361403ea7a2abf1e96b87a7ca344fcdc6dcdfdbddaf5febaaa6e278c9c56f2145c941f1b75918930f0a54bb1ce277fe28d84d2a4731b163c0746423e01764f79352f4a559a416dfbd414f59a538a0ec80dc2b50ff659f814eda976e4050cc0f4f96aee56c5c79f0f1c0ef827639509390e7d0b2cce12316db")
    storage = Storage(client)
    # unique file id 
    file_id = str(uuid.uuid4())

    file_obj = storage.create_file(
        bucket_id=bucket_id,
        file_id=file_id,
        file=InputFile.from_path(file_path)
    )
    # constructing the url instead of making another api call
    uploaded_file_id = file_obj["$id"] if isinstance(file_obj, dict) else getattr(file_obj, "$id", file_id)
    file_url = f"https://fra.cloud.appwrite.io/v1/storage/buckets/{bucket_id}/files/{uploaded_file_id}/view"
    return {"file_id": uploaded_file_id, "file_url": file_url}


def cleanup_temp_file(file_path):
    """
    Clean up temporary files and directories
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
        
        # Remove temp directory if empty
        temp_dir = os.path.dirname(file_path)
        if os.path.exists(temp_dir) and not os.listdir(temp_dir):
            os.rmdir(temp_dir)
    except Exception:
        pass  # Ignore cleanup errorsemp_dir)
    except Exception:
        pass  # Ignore cleanup errors