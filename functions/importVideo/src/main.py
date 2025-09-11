import json
import os

from .services.upload_services import prepare_database_metadata
from .utils.yt_dlp import download_video, extract_video_metadata
from .services.upload_services import upload_file_to_storage, cleanup_temp_file

# This Appwrite function will be executed every time your function is triggered
def main(context):
  body = context.req.body
  data = {}
  if body:
    if isinstance(body, str):
      data = json.loads(body)
    else:
      data = body
  video_url = data.get('video_url')
  bucket_id = data.get('bucket_id')
  user_id = data.get('user_id')

  if not video_url or not bucket_id:
    return {'error': 'Missing video_url or bucket_id in payload'}
  
  # extract metadata before downloading
  meta_data = extract_video_metadata(video_url)
  
  # download the video to a temp file 
  video_temp_path = download_video(video_url)

  # upload to appwrite storage
  file_url = upload_file_to_storage(video_temp_path, bucket_id)

  # get actual file info
  file_name = os.path.basename(video_temp_path)
  file_size = os.path.getsize(video_temp_path)
  file_mime_type = "video/mp4"  

  # cleanup for the temp file
  cleanup_temp_file(video_temp_path)

  # prepare data for database insertion
  video_id = prepare_database_metadata(meta_data, user_id, file_name, file_mime_type, file_size)

  return context.res.json({'file_url': file_url['file_url'], 'file_id': file_url['file_id'], 'video_id': video_id})