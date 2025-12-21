#!/usr/bin/env python3
"""
Simple HTTP server for processing YouTube videos.
Serves a web interface and handles video processing requests.
"""

import http.server
import socketserver
import json
import os
import subprocess
import urllib.parse
import re
from pathlib import Path

# Configuration
PORT = 8000
# server.py is in content-generation/
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(SCRIPT_DIR, 'data')  # content-generation/data only
RAW_LYRICS_DIR = os.path.join(DATA_DIR, 'raw-lyrics')
TRANSCRIBED_LYRICS_DIR = os.path.join(DATA_DIR, 'transcribed-lyrics')
SCRIPTS_DIR = os.path.join(SCRIPT_DIR, 'scripts')
SCRIPT_PATH = os.path.join(SCRIPTS_DIR, 'download-and-transcribe.ts')
LOGS_DIR = os.path.join(SCRIPT_DIR, 'logs')

def extract_video_id(url):
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$',  # Direct video ID
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None

def get_existing_songs():
    """Get list of existing song files from raw-lyrics directory."""
    songs = []
    print(f"[DEBUG] Checking for songs in: {RAW_LYRICS_DIR}")
    print(f"[DEBUG] Directory exists: {os.path.exists(RAW_LYRICS_DIR)}")
    if os.path.exists(RAW_LYRICS_DIR):
        try:
            files = os.listdir(RAW_LYRICS_DIR)
            print(f"[DEBUG] Found {len(files)} files in directory")
            for file in files:
                if file.endswith('.json'):
                    video_id = file.replace('.json', '')
                    songs.append(video_id)
        except Exception as e:
            print(f"[ERROR] Failed to list directory: {e}")
    else:
        print(f"[ERROR] Directory does not exist: {RAW_LYRICS_DIR}")
    print(f"[DEBUG] Returning {len(songs)} songs")
    return sorted(songs)

def check_existing_videos(video_ids):
    """Check which video IDs already exist in raw-lyrics or transcribed-lyrics."""
    existing = {
        'raw_lyrics': [],
        'transcribed_lyrics': [],
        'both': []
    }
    
    TRANSCRIBED_LYRICS_DIR = os.path.join(DATA_DIR, 'transcribed-lyrics')
    
    for video_id in video_ids:
        raw_path = os.path.join(RAW_LYRICS_DIR, f'{video_id}.json')
        transcribed_path = os.path.join(TRANSCRIBED_LYRICS_DIR, f'{video_id}.json')
        
        has_raw = os.path.exists(raw_path)
        has_transcribed = os.path.exists(transcribed_path)
        
        if has_raw and has_transcribed:
            existing['both'].append(video_id)
        elif has_raw:
            existing['raw_lyrics'].append(video_id)
        elif has_transcribed:
            existing['transcribed_lyrics'].append(video_id)
    
    return existing

class VideoProcessorHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Serve files from content-generation directory
        super().__init__(*args, directory=SCRIPT_DIR, **kwargs)
    
    def do_GET(self):
        """Handle GET requests."""
        if self.path == '/' or self.path == '/index.html':
            self.serve_index()
        elif self.path == '/api/songs':
            self.serve_songs_list()
        elif self.path.startswith('/song/'):
            self.serve_song_detail()
        elif self.path.startswith('/api/song/'):
            self.serve_song_data()
        else:
            super().do_GET()
    
    def do_POST(self):
        """Handle POST requests."""
        if self.path == '/api/process':
            self.handle_process()
        else:
            self.send_error(404)
    
    def serve_index(self):
        """Serve the index.html file."""
        index_path = os.path.join(SCRIPT_DIR, 'index.html')
        if os.path.exists(index_path):
            with open(index_path, 'rb') as f:
                content = f.read()
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(content)
        else:
            self.send_error(404)
    
    def serve_songs_list(self):
        """Serve JSON list of existing songs."""
        print(f"[GET] /api/songs - Fetching songs list")
        songs = get_existing_songs()
        print(f"[GET] /api/songs - Returning {len(songs)} songs")
        response = json.dumps({'songs': songs}).encode('utf-8')
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(response)
    
    def serve_song_detail(self):
        """Serve HTML detail page for a specific song."""
        # Extract video ID from path: /song/VIDEO_ID
        video_id = self.path.replace('/song/', '').split('?')[0].split('#')[0]
        
        if not video_id or len(video_id) != 11:
            self.send_error(404, "Invalid video ID")
            return
        
        print(f"[GET] /song/{video_id} - Serving detail page")
        
        # Check which files exist - only look in content-generation/data/
        raw_path = os.path.join(RAW_LYRICS_DIR, f'{video_id}.json')
        transcribed_path = os.path.join(TRANSCRIBED_LYRICS_DIR, f'{video_id}.json')
        
        # Prefer transcribed (has metadata), then raw
        if os.path.exists(transcribed_path):
            file_path = transcribed_path
            file_type = 'transcribed'
        else:
            file_path = raw_path
            file_type = 'raw'
        
        if not os.path.exists(file_path):
            self.send_error(404, f"Song file not found for video ID: {video_id}")
            return
        
        # Read the JSON file
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                song_data = json.load(f)
        except Exception as e:
            self.send_error(500, f"Error reading song file: {str(e)}")
            return
        
        # Generate HTML page
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Song Details - {video_id}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen py-8">
    <div class="max-w-7xl mx-auto px-4">
        <div class="mb-4">
            <a href="/" class="text-blue-600 hover:text-blue-800 font-medium">← Back to Home</a>
        </div>
        
        <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h1 class="text-3xl font-bold text-gray-800 mb-2">Song Details</h1>
            <p class="text-gray-600 mb-4">
                Video ID: <span class="font-mono text-sm">{video_id}</span> | 
                Source: <span class="font-mono text-sm">{file_type}</span>
            </p>
            
            <div class="mb-6">
                <a 
                    href="https://www.youtube.com/watch?v={video_id}" 
                    target="_blank"
                    class="inline-block px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Open on YouTube ↗
                </a>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- YouTube Video -->
                <div>
                    <h2 class="text-xl font-bold text-gray-800 mb-4">Video</h2>
                    <div class="aspect-video bg-black rounded-lg overflow-hidden">
                        <iframe
                            width="100%"
                            height="100%"
                            src="https://www.youtube.com/embed/{video_id}"
                            frameborder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowfullscreen
                            class="w-full h-full"
                        ></iframe>
                    </div>
                </div>
                
                <!-- JSON Data -->
                <div>
                    <h2 class="text-xl font-bold text-gray-800 mb-4">Data File</h2>
                    <div class="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[600px]">
                        <pre class="text-green-400 text-xs font-mono whitespace-pre-wrap break-words"><code id="jsonData">{json.dumps(song_data, indent=2, ensure_ascii=False)}</code></pre>
                    </div>
                    <div class="mt-4">
                        <button
                            onclick="copyToClipboard()"
                            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                        >
                            Copy JSON
                        </button>
                        <span id="copyStatus" class="ml-2 text-sm text-green-600"></span>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function copyToClipboard() {{
            const jsonText = document.getElementById('jsonData').textContent;
            navigator.clipboard.writeText(jsonText).then(() => {{
                const status = document.getElementById('copyStatus');
                status.textContent = 'Copied!';
                setTimeout(() => {{
                    status.textContent = '';
                }}, 2000);
            }});
        }}
    </script>
</body>
</html>"""
        
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()
        self.wfile.write(html.encode('utf-8'))
    
    def serve_song_data(self):
        """Serve raw JSON data for a specific song."""
        # Extract video ID from path: /api/song/VIDEO_ID
        video_id = self.path.replace('/api/song/', '').split('?')[0].split('#')[0]
        
        if not video_id or len(video_id) != 11:
            self.send_error(404, "Invalid video ID")
            return
        
        print(f"[GET] /api/song/{video_id} - Serving JSON data")
        
        # Check which files exist - only look in content-generation/data/
        raw_path = os.path.join(RAW_LYRICS_DIR, f'{video_id}.json')
        transcribed_path = os.path.join(TRANSCRIBED_LYRICS_DIR, f'{video_id}.json')
        
        # Prefer transcribed (has metadata), then raw
        if os.path.exists(transcribed_path):
            file_path = transcribed_path
        else:
            file_path = raw_path
        
        if not os.path.exists(file_path):
            self.send_error(404, f"Song file not found for video ID: {video_id}")
            return
        
        # Read and serve the JSON file
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                song_data = json.load(f)
            
            response = json.dumps(song_data, indent=2, ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(response)
        except Exception as e:
            self.send_error(500, f"Error reading song file: {str(e)}")
    
    def handle_process(self):
        """Handle video processing request."""
        print(f"[POST] /api/process - Received request")
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8'))
            urls = data.get('urls', [])
            print(f"[POST] /api/process - Received {len(urls)} URL(s)")
            
            if not urls:
                print(f"[POST] /api/process - Error: No URLs provided")
                self.send_json_response({'success': False, 'error': 'No URLs provided'}, 400)
                return
            
            # Extract video IDs
            video_ids = []
            invalid_urls = []
            
            for url in urls:
                url = url.strip()
                if not url:
                    continue
                video_id = extract_video_id(url)
                if video_id:
                    video_ids.append(video_id)
                    print(f"[POST] /api/process - Extracted video ID: {video_id} from {url}")
                else:
                    invalid_urls.append(url)
                    print(f"[POST] /api/process - Invalid URL: {url}")
            
            if not video_ids:
                print(f"[POST] /api/process - Error: No valid video IDs found")
                self.send_json_response({
                    'success': False,
                    'error': 'No valid YouTube video IDs found',
                    'invalid_urls': invalid_urls
                }, 400)
                return
            
            # Check which videos already exist
            existing = check_existing_videos(video_ids)
            new_video_ids = [vid for vid in video_ids if vid not in existing['both'] and vid not in existing['raw_lyrics'] and vid not in existing['transcribed_lyrics']]
            
            if existing['both']:
                print(f"[POST] /api/process - Found {len(existing['both'])} video(s) already fully processed")
            if existing['raw_lyrics']:
                print(f"[POST] /api/process - Found {len(existing['raw_lyrics'])} video(s) with raw lyrics only")
            if existing['transcribed_lyrics']:
                print(f"[POST] /api/process - Found {len(existing['transcribed_lyrics'])} video(s) with transcribed lyrics only")
            if new_video_ids:
                print(f"[POST] /api/process - Processing {len(new_video_ids)} new video(s)")
            
            # If all videos already exist, return early
            if not new_video_ids:
                print(f"[POST] /api/process - All videos already exist, skipping processing")
                self.send_json_response({
                    'success': True,
                    'message': 'All videos already exist',
                    'video_ids': video_ids,
                    'invalid_urls': invalid_urls,
                    'existing': existing,
                    'skipped': True
                })
                return
            
            # Run the script (only for new videos, but --skip-existing will handle duplicates)
            # Note: The script only processes ONE video ID at a time, so we need to call it multiple times
            try:
                # Use relative path from content-generation/ to the script
                script_rel_path = os.path.relpath(SCRIPT_PATH, SCRIPT_DIR)
                
                # Use Node v20 - try multiple methods to find it
                node_cmd = None
                import glob
                
                # Method 1: Try nvm to use Node 20 (most common)
                nvm_node_pattern = os.path.expanduser('~/.nvm/versions/node/v20*/bin/node')
                nvm_nodes = glob.glob(nvm_node_pattern)
                if nvm_nodes:
                    # Use the latest Node 20 version found
                    node_cmd = sorted(nvm_nodes)[-1]
                    print(f"[POST] /api/process - Using Node from nvm: {node_cmd}")
                
                # Method 2: Try common Node 20 installation paths
                if not node_cmd:
                    common_paths = [
                        '/usr/local/bin/node20',
                        '/usr/bin/node20',
                        '/opt/homebrew/bin/node20',
                        os.path.expanduser('~/.nvm/versions/node/v20.0.0/bin/node'),
                        os.path.expanduser('~/.nvm/versions/node/v20.11.0/bin/node'),
                        os.path.expanduser('~/.nvm/versions/node/v20.10.0/bin/node'),
                    ]
                    for path in common_paths:
                        if os.path.exists(path):
                            node_cmd = path
                            print(f"[POST] /api/process - Using Node from path: {node_cmd}")
                            break
                
                # Method 3: Try using nvm via shell (if nvm is available)
                use_nvm_bash = False
                nvm_source = None
                if not node_cmd:
                    nvm_source = os.path.expanduser('~/.nvm/nvm.sh')
                    if os.path.exists(nvm_source):
                        use_nvm_bash = True
                        print(f"[POST] /api/process - Using nvm via bash wrapper")
                    else:
                        # Fallback to regular node (might not work but worth trying)
                        node_cmd = 'node'
                        print(f"[POST] /api/process - Warning: Using default node (may not be v20)")
                
                # Create logs directory if it doesn't exist
                os.makedirs(LOGS_DIR, exist_ok=True)
                
                # Use a single log file that appends (always append to the same file)
                log_file = os.path.join(LOGS_DIR, 'process.log')
                
                # Set environment variables
                env = os.environ.copy()
                # Check for node_modules in content-generation
                content_gen_node_modules = os.path.join(SCRIPT_DIR, 'node_modules')
                
                if os.path.exists(content_gen_node_modules):
                    if 'NODE_PATH' in env:
                        env['NODE_PATH'] = f"{content_gen_node_modules}:{env['NODE_PATH']}"
                    else:
                        env['NODE_PATH'] = content_gen_node_modules
                
                # Add separator and timestamp to log for this batch
                from datetime import datetime
                timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                with open(log_file, 'a') as log:
                    log.write(f"\n{'='*80}\n")
                    log.write(f"[{timestamp}] Starting batch: {len(new_video_ids)} video(s): {', '.join(new_video_ids)}\n")
                    log.write(f"{'='*80}\n")
                    log.flush()
                
                # Process each video ID separately (script only handles one at a time)
                process_pids = []
                for video_id in new_video_ids:
                    # Build command for this single video
                    # Note: Script always uses OpenAI Whisper now, no --openai flag needed
                    if use_nvm_bash:
                        escaped_script = script_rel_path.replace("'", "'\"'\"'")
                        escaped_video_id = video_id.replace("'", "'\"'\"'")
                        cmd = ['bash', '-c', f'source {nvm_source} && nvm use 20 > /dev/null 2>&1 && node -r ts-node/register {escaped_script} --skip-existing {escaped_video_id}']
                    elif node_cmd:
                        cmd = [node_cmd, '-r', 'ts-node/register', script_rel_path, '--skip-existing', video_id]
                    else:
                        cmd = ['node', '-r', 'ts-node/register', script_rel_path, '--skip-existing', video_id]
                    
                    # Log this individual command
                    with open(log_file, 'a') as log:
                        log.write(f"\n[Starting] Video ID: {video_id}\n")
                        log.write(f"Command: {' '.join(cmd)}\n")
                        log.flush()
                    
                    # Run in background (non-blocking) with logging (append mode)
                    with open(log_file, 'a') as log:
                        process = subprocess.Popen(
                            cmd,
                            cwd=SCRIPT_DIR,
                            stdout=log,
                            stderr=subprocess.STDOUT,
                            text=True,
                            env=env
                        )
                        process_pids.append(process.pid)
                    
                    print(f"[POST] /api/process - Started process for {video_id} (PID: {process.pid})")
                
                print(f"[POST] /api/process - Started {len(process_pids)} process(es), PIDs: {process_pids}")
                print(f"[POST] /api/process - Log file: {log_file} (appending)")
                
                self.send_json_response({
                    'success': True,
                    'message': f'Processing {len(new_video_ids)} new video(s) in background',
                    'video_ids': video_ids,
                    'new_video_ids': new_video_ids,
                    'invalid_urls': invalid_urls,
                    'existing': existing,
                    'process_ids': process_pids,
                    'log_file': log_file
                })
            except Exception as e:
                print(f"[POST] /api/process - Error starting process: {e}")
                import traceback
                traceback.print_exc()
                error_msg = str(e)
                # Check if it's a package.json parsing error
                if 'package.json' in error_msg and 'SyntaxError' in error_msg:
                    error_msg += " (There may be a malformed package.json in a parent directory. Check /mnt/media/c/easysong/package.json)"
                self.send_json_response({
                    'success': False,
                    'error': f'Failed to start process: {error_msg}'
                }, 500)
        
        except json.JSONDecodeError as e:
            print(f"[POST] /api/process - JSON decode error: {e}")
            self.send_json_response({'success': False, 'error': 'Invalid JSON'}, 400)
        except Exception as e:
            print(f"[POST] /api/process - Unexpected error: {e}")
            import traceback
            traceback.print_exc()
            self.send_json_response({'success': False, 'error': str(e)}, 500)
    
    def send_json_response(self, data, status=200):
        """Send JSON response."""
        response = json.dumps(data).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(response)
    
    def log_message(self, format, *args):
        """Override to customize logging."""
        print(f"[{self.address_string()}] {format % args}")

def main():
    """Start the server."""
    # Print configuration for debugging
    print(f"[CONFIG] Script directory: {SCRIPT_DIR}")
    print(f"[CONFIG] Data directory: {DATA_DIR}")
    print(f"[CONFIG] Raw lyrics directory: {RAW_LYRICS_DIR}")
    print(f"[CONFIG] Scripts directory: {SCRIPTS_DIR}")
    print(f"[CONFIG] Script path: {SCRIPT_PATH}")
    print(f"[CONFIG] Script exists: {os.path.exists(SCRIPT_PATH)}")
    print(f"[CONFIG] Logs directory: {LOGS_DIR}")
    
    # Ensure directories exist
    os.makedirs(RAW_LYRICS_DIR, exist_ok=True)
    os.makedirs(LOGS_DIR, exist_ok=True)
    
    handler = VideoProcessorHandler
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"Server running at http://localhost:{PORT}/")
        print(f"Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server...")
            httpd.shutdown()

if __name__ == '__main__':
    main()

