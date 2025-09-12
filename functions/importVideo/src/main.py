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
        logging.info("Extracting video metadata...")
        meta_data = extract_video_metadata(video_url)
        
        logging.info("Downloading video...")
        video_temp_path = download_video(video_url)
        logging.info(f"Video downloaded to temporary path: {video_temp_path}")

        logging.info("Uploading video to storage...")
        file_url = upload_file_to_storage(video_temp_path, bucket_id)
        logging.info("Video uploaded successfully.")

        file_name = os.path.basename(video_temp_path)
        file_size = os.path.getsize(video_temp_path)
        file_mime_type = "video/mp4"

        logging.info("Preparing and saving database metadata...")
        video_id = prepare_database_metadata(meta_data, user_id, file_name, file_mime_type, file_size)
        logging.info(f"Database metadata created with video ID: {video_id}")

        # Trigger transcription API (best-effort)
        try:
            transcribe_api_url = os.environ.get('TRANSCRIBE_API_URL')
            if transcribe_api_url:
                logging.info("Triggering transcription API...")
                payload = {
                    'audioUrl': file_url['file_url'],
                    'videoId': video_id,
                    'userId': user_id,
                }
                requests.post(transcribe_api_url, json=payload, timeout=5)
            else:
                logging.warning('TRANSCRIBE_API_URL not set. Skipping transcription trigger.')
        except Exception as e:
            logging.error(f"Failed to call transcribe API (non-critical): {e}")

        return context.res.json({'file_url': file_url['file_url'], 'file_id': file_url['file_id'], 'video_id': video_id})

    except Exception as e:
        logging.error(f"A critical error occurred: {e}", exc_info=True)
        return context.res.json({'error': 'An internal server error occurred.'}, 500)

    finally:
        if video_temp_path and os.path.exists(video_temp_path):
            logging.info(f"Cleaning up temporary file: {video_temp_path}")
            cleanup_temp_file(video_temp_path)
