import os
import uuid
import logging
from appwrite.services.storage import Storage
from appwrite.services.databases import Databases
from appwrite.id import ID
from appwrite.input_file import InputFile
from ..appwrite import get_appwrite_client

def upload_file_to_storage(file_path: str, bucket_id: str):
    client = get_appwrite_client()
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
    
    endpoint = os.environ.get("APPWRITE_FUNCTION_API_ENDPOINT")
    if not endpoint:
        raise ValueError("APPWRITE_FUNCTION_API_ENDPOINT environment variable not set.")

    file_url = f"{endpoint}/storage/buckets/{bucket_id}/files/{uploaded_file_id}/view"
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
    except Exception as e:
        logging.warning(f"Error during cleanup of temp file {file_path}: {e}")



def prepare_database_metadata(yt_metadata, user_id, file_name, mime_type, file_size):
    """
    Map yt-dlp metadata to your database schema
    """
    client = get_appwrite_client()
    
    DATABASE_ID = os.environ.get("APPWRITE_FUNCTION_DATABASE_ID")


    if not DATABASE_ID:
        raise ValueError("Missing APPWRITE_FUNCTION_DATABASE_ID env variables.")

    database = Databases(client)
    # Safely truncate strings to fit database limits
    def truncate_string(value, max_length):
        if not value:
            return None
        return str(value)[:max_length] if len(str(value)) > max_length else str(value)
    
    # Extract and clean tags
    tags = []
    if yt_metadata.get('tags'):
        tags = [truncate_string(tag, 255) for tag in yt_metadata['tags'][:10]]  # Limit to 10 tags
    
    # Map categories (YouTube categories to your schema)
    category_mapping = {
        'Entertainment': 'entertainment',
        'Education': 'educational', 
        'Music': 'music',
        'Gaming': 'gaming',
        'News & Politics': 'news',
        'Sports': 'sports'
    }
    
    yt_category = yt_metadata.get('categories', [])
    category = 'uncategorized'
    if yt_category and len(yt_category) > 0:
        category = category_mapping.get(yt_category[0], 'uncategorized')
    
    payload = {
        'userId': user_id,
        'title': truncate_string(yt_metadata.get('title'), 255),
        'description': truncate_string(yt_metadata.get('description'), 1000),
        'fileName': truncate_string(file_name, 255),
        'mimeType': truncate_string(mime_type, 255),
        'sizeBytes': min(file_size, 4294967296),  # Ensure within limit
        'duration': yt_metadata.get('duration'),  # Already in seconds
        'thumbnailId': truncate_string(yt_metadata.get('thumbnail'), 255),
        'category': category,
        'transcript': None,  # Can be extracted separately if needed
        'status': 'pending',
        'tags': tags,
        'clipIds': []  # Empty initially
    }

    response = database.create_document(
        database_id=DATABASE_ID,
        collection_id="videos",
        document_id=ID.unique(),
        data=payload
    )

    logging.info("Database insert response: %s", response)

    return response['$id']
