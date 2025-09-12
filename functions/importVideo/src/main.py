import json
import os
import logging
from typing import Optional
import requests

from .services.upload_services import prepare_database_metadata, upload_file_to_storage, cleanup_temp_file
from .utils.yt_dlp import download_video, extract_video_metadata

# This Appwrite function will be executed every time your function is triggered
def main(context):
    body = context.req.body
    data = {}
    if body:
        if isinstance(body, str):
            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                return context.res.json({'error': 'Invalid JSON in request body'}, 400)
        else:
            data = body
            
    video_url = data.get('video_url')
    bucket_id = data.get('bucket_id')
    user_id = data.get('user_id')

    if not video_url or not bucket_id or not user_id:
        return context.res.json({'error': 'Missing video_url, bucket_id, or user_id in payload'}, 400)

    video_temp_path = None
    try:
        meta_data = extract_video_metadata(video_url)
        
        video_temp_path = download_video(video_url)

        file_url = upload_file_to_storage(video_temp_path, bucket_id)


        file_name = os.path.basename(video_temp_path)
        file_size = os.path.getsize(video_temp_path)
        file_mime_type = "video/mp4"

        video_id = prepare_database_metadata(meta_data, user_id, file_name, file_mime_type, file_size, file_url['file_id'])
        # Trigger transcription API
        transcribe_api_url = os.environ.get('TRANSCRIBE_API_URL')
        if not transcribe_api_url:
            logging.error('TRANSCRIBE_API_URL not set. Cannot trigger transcription.')
        else:
            try:
                logging.info(f"Triggering transcription API at {transcribe_api_url}...")
                payload = {
                    'audioUrl': file_url['file_url'],
                    'videoId': video_id,
                    'userId': user_id,
                }
                requests.post(transcribe_api_url, json=payload, timeout=900)
            except requests.exceptions.Timeout:
                # This is an expected outcome for a fire-and-forget call.
                logging.info("Transcription API triggered (request timed out as expected).")
            except requests.exceptions.RequestException as e:
                logging.error(f"Failed to trigger transcription API: {e}")
        return context.res.json({'file_url': file_url['file_url'], 'file_id': file_url['file_id'], 'video_id': video_id})

    except Exception as e:
        logging.error(f"A critical error occurred: {e}", exc_info=True)
        return context.res.json({'error': 'An internal server error occurred.'}, 500)

    finally:
        if video_temp_path and os.path.exists(video_temp_path):
            logging.info(f"Cleaning up temporary file: {video_temp_path}")
            cleanup_temp_file(video_temp_path)
