import json
from appwrite.client import Client
from appwrite.services.users import Users
from appwrite.exception import AppwriteException
import os
from .utils.yt_dlp import download_video
from .services.uploadService import upload_file_to_storage, cleanup_temp_file

# This Appwrite function will be executed every time your function is triggered
def main(context):
  data = json.loads(context.payload) if context.payload else {}
  video_url = data.get('video_url')
  bucket_id = data.get('bucket_id')

  if not video_url or not bucket_id:
    return {'error': 'Missing video_url or bucket_id in payload'}
  
  # download the video to a temp file 
  video_temp_path = download_video(video_url)

  # upload to appwrite storage
  file_url = upload_file_to_storage(video_temp_path, bucket_id)

  # cleanup for the temp file
  cleanup_temp_file(video_temp_path)

  return context.response.json({'file_url': file_url}, 200)