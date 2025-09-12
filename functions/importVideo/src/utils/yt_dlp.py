import os
import tempfile
import yt_dlp

def _get_common_ydl_opts():
    """Returns a dictionary with common yt-dlp options, including the User-Agent header."""
    # Construct the path to the cookies.txt file, assuming it's in the src directory
    cookie_path = os.path.join(os.path.dirname(__file__), '..', 'cookies.txt')
    
    if not os.path.exists(cookie_path):
        # If the cookie file is not found, raise an error to make it obvious.
        raise FileNotFoundError(f"Cookie file not found. Please make sure 'cookies.txt' is in the 'src' directory of the function. Expected path: {cookie_path}")

    opts = {
        'cookiefile': cookie_path,
        'http_headers': {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
        },
    }
    return opts

def download_video(url: str) -> str:
    temp_dir = tempfile.mkdtemp()
    output_template = os.path.join(temp_dir, '%(title)s.%(ext)s')

    ydl_opts = _get_common_ydl_opts()
    ydl_opts.update({
        'outtmpl': output_template,
        'format': 'bestvideo+bestaudio/best',
        'noplaylist': True,
        'merge_output_format': 'mp4',
        'ffmpeg_location': '/usr/local/server/src/function/ffmpeg',
    })

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=True)
        video_path = ydl.prepare_filename(info)

    return video_path


def extract_video_metadata(url):
    """
    Extract metadata without downloading the video
    """
    ydl_opts = _get_common_ydl_opts()
    ydl_opts.update({
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
        'dump_single_json': True
    })
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(url, download=False)
        
    return info