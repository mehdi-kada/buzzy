import os
from re import S
from appwrite.client import Client 
from appwrite.services.storage import Storage
from appwrite.input_file import InputFile

def upload_file_to_storage(file_path: str, bucket_id: str):
    client = Client()
    client.set_endpoint(os.environ['APPWRITE_FUNCTION_ENDPOINT'])
    client.set_project(os.environ['APPWRITE_FUNCTION_PROJECT_ID'])
    client.set_key(os.environ['APPWRITE_API_KEY'])
    storage = Storage(client)
    # unique file id 
    file_id = f"video_{int(os.path.getctime(file_path))}_{os.path.basename(file_path)}"

    file_obj = storage.create_file(
        bucket_id=bucket_id,
        file_id=file_id,
        file=InputFile.from_path(file_path)
    )
    # constructing the url instead of making another api call
    uploaded_file_id = file_obj["$id"] if isinstance(file_obj, dict) else getattr(file_obj, "$id", file_id)
    file_url = f"{os.environ['APPWRITE_FUNCTION_ENDPOINT']}/storage/buckets/{bucket_id}/files/{uploaded_file_id}/view"
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
        pass  # Ignore cleanup errors