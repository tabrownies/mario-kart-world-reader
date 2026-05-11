import os
import sys
import csv
import argparse
import cv2
from datetime import datetime
from dotenv import load_dotenv

# Load directory paths from shared .env
# The .env file should be at the root of the project
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)
DATA_DIR = os.getenv("BASE_DATA_DIR")

if not DATA_DIR:
    print("Error: BASE_DATA_DIR not defined in .env file.")
    sys.exit(1)

def parse_args():
    parser = argparse.ArgumentParser(description="Split Mario Kart World videos into frame datasets.")
    parser.add_argument("--video", required=True, help="Path to the source .mp4 file")
    parser.add_argument("--track", required=True, help="Shortened track name (e.g., royal_ruins)")
    parser.add_argument("--players", type=int, default=1, help="Number of players (1-4)")
    parser.add_argument("--type", choices=["standard", "knockout", "time_trial"], default="standard")
    parser.add_argument("--online", action="store_true", help="Is this an online race?")
    parser.add_argument("--nochat", action="store_true", help="Is gamechat mode disabled (nochat)?", default=True)
    
    # Target resolution to save space. Standardizing 1080p half-scale (960x540) is highly effective for ML.
    parser.add_argument("--width", type=int, default=960, help="Target frame width")
    parser.add_argument("--height", type=int, default=540, help="Target frame height")
    return parser.parse_args()

def generate_video_id(args):
    now = datetime.utcnow()
    date_str = now.strftime("%m_%d_%Y")
    time_str = now.strftime("%H_%M_%S")
    player_str = f"p{args.players}"
    lobby_str = "online" if args.online else "local"
    chat_str = "nochat" if args.nochat else "chat"
    
    return f"mkw_{args.track}_{player_str}_{args.type}_{lobby_str}_{chat_str}_{date_str}_{time_str}"

def split_video():
    args = parse_args()
    
    if not os.path.exists(args.video):
        print(f"Error: Video file not found at {args.video}")
        sys.exit(1)

    video_id = generate_video_id(args)
    run_dir = os.path.join(DATA_DIR, video_id)
    
    os.makedirs(run_dir, exist_ok=True)
    
    # Initialize OpenCV
    cap = cv2.VideoCapture(args.video)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    print(f"Loaded {args.video} ({total_frames} total frames). Splitting to: {run_dir}")

    csv_path = os.path.join(run_dir, f"UNFINISHED_{video_id}.csv")
    csv_headers = [
        "frame_id", "track", "placement", "lap_count", 
        "coin_count", "primary_item", "secondary_item", "race_phase"
    ]

    frame_idx = 0
    csv_rows = []

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Format: 000000_mkw_track_...
        frame_name = f"{frame_idx:06d}_{video_id}.png"
        frame_path = os.path.join(run_dir, frame_name)
        
        # Downsample frame for storage and fast training loading
        resized_frame = cv2.resize(frame, (args.width, args.height), interpolation=cv2.INTER_AREA)
        cv2.imwrite(frame_path, resized_frame)
        
        # Write only the frame identifier and the known track name to the CSV list
        csv_rows.append({
            "frame_id": frame_name,
            "track": args.track,
            "placement": "",
            "lap_count": "",
            "coin_count": "",
            "primary_item": "",
            "secondary_item": "",
            "race_phase": ""
        })
        
        frame_idx += 1
        if frame_idx % 100 == 0 or frame_idx == total_frames:
            print(f"Processed {frame_idx}/{total_frames} frames...", end="\r")

    cap.release()

    # Write the empty dataset template
    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=csv_headers)
        writer.writeheader()
        writer.writerows(csv_rows)

    print(f"\nSuccessfully finished! Dataset template created at: {csv_path}")

if __name__ == "__main__":
    split_video()
