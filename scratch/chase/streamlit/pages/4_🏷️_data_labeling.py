import streamlit as st
import os
import cv2
import pandas as pd
import streamlit_hotkeys as hotkeys

from utils.constants import VIDEO_DIR, TRAINING_CSV_DIR

st.error("This page is a WIP")


# select video file from training_data/uploaded_videos where no matching csv found
# (or where csv starts with UNFINISHED)

video_files = [path for path in os.listdir(VIDEO_DIR) if path.endswith('.mp4')]
csv_files = [path for path in os.listdir(TRAINING_CSV_DIR) if (path.endswith('.csv') and (not path.startswith("UNFINISHED")))]

# st.write(f"{video_files=}")
# st.write(f"{csv_files=}")

unfinished_video_files = []
for vid in video_files:
    video_name = os.path.splitext(vid)[0]
    found_matching_csv = False
    # st.write(video_name)
    for csv in csv_files:
        csv_name = os.path.splitext(csv)[0]
        if video_name == csv_name:
            found_matching_csv = True
            break
    if not found_matching_csv:
        unfinished_video_files.append(vid)

# st.write(f"{unfinished_video_files=}")

chosen_video = st.selectbox(label="Select Video to Label:", options=unfinished_video_files, index=None)

if not chosen_video:
    if "loaded_video" in st.session_state:
        st.session_state.pop("loaded_video")
    st.stop()

# load video file

if "loaded_video" not in st.session_state:
    with st.spinner():
        st.session_state["loaded_video"] = cv2.VideoCapture(os.path.join(VIDEO_DIR, chosen_video))
    loaded_video = st.session_state["loaded_video"]
    st.toast("loaded video from file")
else:
    loaded_video = st.session_state["loaded_video"]
    st.toast("loaded video from session state")


video_frame_count = int(loaded_video.get(cv2.CAP_PROP_FRAME_COUNT))




# initialize csv with ..._UNKNOWN values (enum 0 values)

chosen_video_name = os.path.splitext(chosen_video)[0]
chosen_csv_name = chosen_video_name+".csv"
chosen_csv_path = os.path.join(TRAINING_CSV_DIR, "UNFINISHED_"+chosen_csv_name)
if "dfedits" not in st.session_state:
    st.session_state["dfedits"] = []
    dataframe_edits = st.session_state['dfedits']
else:
    dataframe_edits = st.session_state['dfedits']

if len(dataframe_edits) == 0:
    if os.path.exists(chosen_csv_path):
        dataframe_edits.append(pd.read_csv(chosen_csv_path))
    else:
        csv_headers = [
            "frame_id", "track", "placement", "lap_count", 
            "coin_count", "primary_item", "secondary_item", "race_phase"
        ]
        dataframe_edits.append(pd.DataFrame(columns=csv_headers))
        dataframe_edits[-1].to_csv(chosen_csv_path)



# display i'th frame of video
st.session_state.setdefault("frameidx", 0)
st.session_state.setdefault("frameskip", 1)
loaded_video.set(cv2.CAP_PROP_POS_FRAMES, max(0,min(st.session_state['frameidx'], video_frame_count)))

ret, frame = loaded_video.read()

st.image(frame)

# implement "video" "scrubbing" 
# (yes there's two different sets of quotation marks. yes that's on purpose)
    # numeric input to select how many frames to skip through each update
        # up arrow should increase this +1
        # down arrow should decrease this -1
    # on right arrow, skip forward
    # on left arrow key, skip backward
        # wasd support (meant for laptops without good arrow keys)

left,right = st.columns(2)

with left:
    st.session_state["frameidx"] = st.number_input(label="Frame Index", min_value=0, max_value=video_frame_count, value=st.session_state['frameidx'])

with right:
    st.session_state['frameskip'] = st.number_input(label="Frame skip", min_value=1, value=st.session_state['frameskip'])

hotkeys.activate([
    hotkeys.hk("up", "ArrowUp", ignore_repeat=False),
    hotkeys.hk("down", "ArrowDown", ignore_repeat=False),
    hotkeys.hk("left", "ArrowLeft", ignore_repeat=False),
    hotkeys.hk("right", "ArrowRight", ignore_repeat=False),
    hotkeys.hk('w', 'w', ignore_repeat=False),
    hotkeys.hk('a', 'a', ignore_repeat=False),
    hotkeys.hk('s', 's', ignore_repeat=False),
    hotkeys.hk('d', 'd', ignore_repeat=False)
])

if hotkeys.pressed("up") or hotkeys.pressed("w"):
    st.session_state['frameskip'] += 1

if hotkeys.pressed('down') or hotkeys.pressed('s'):
    st.session_state['frameskip'] = max(1, st.session_state['frameskip'] - 1)

if hotkeys.pressed('left') or hotkeys.pressed('a'):
    st.session_state['frameidx'] = max(0, st.session_state['frameidx'] - st.session_state['frameskip'])

if hotkeys.pressed('right') or hotkeys.pressed('d'):
    st.session_state['frameidx'] = min(video_frame_count, st.session_state['frameidx'] + st.session_state['frameskip'])



    # drop-down menus to select place, primary item, secondary item, coin count, race phase
    # a button called "Add Key Frame" that populates all unpopulated csv data 
        # from the last key frame to the current key frame with the selected values
        # ctrl-Z implementation? 
            # shouldn't be to hard, just keep a list of csv changes, and display the most current one
    # some UI design to show how the data has been set so far (display key frames?)

st.write(f"current working dataframe:")
st.write(dataframe_edits[-1])

# Once that video is all scrubbed through (when working csv is all populated)
# we can binary search for lap change key frames
    # can this be automated?

# save working csv

# if at any step in the process the user needs to quit,
# they can save their work with a "Save UNFINISHED" button
# this will write the csv to an "UNFINISHED_*.csv" file 
# that can be loaded up later
# we can also save changes as we go, in the same unfinished file,
# but keep changes in memory to keep ctrl-z implementation

# do we care about ctrl-shift-z implementation?
    # Maybe keep the entire list of changes to be able to ctrl-shift-z
    # track the current working csv as a index number
    # when a previous csv is wanting to be edited, 
    # we simply delete all csv's post the current idx, 
    # make the desired edit
    # then append the new csv to the list of edits



with open(__file__, 'r') as file:
    st.write("page source:")
    st.code(file.read())