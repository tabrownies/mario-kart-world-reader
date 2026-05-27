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
    # st.toast("loaded video from file")
else:
    loaded_video = st.session_state["loaded_video"]
    # st.toast("loaded video from session state")


video_frame_count = int(loaded_video.get(cv2.CAP_PROP_FRAME_COUNT))-1




# initialize csv with ..._UNKNOWN values (enum 0 values)

chosen_video_name = os.path.splitext(chosen_video)[0]
chosen_csv_name = chosen_video_name+".csv"
chosen_csv_path = os.path.join(TRAINING_CSV_DIR, "UNFINISHED_"+chosen_csv_name)

st.session_state.setdefault('placekeyframes', dict())
st.session_state.setdefault('coinkeyframes', dict())
st.session_state.setdefault('itemkeyframes', dict())





# implement "video" "scrubbing" 
# (yes there's two different sets of quotation marks. yes that's on purpose)
    # numeric input to select how many frames to skip through each update
        # up arrow should increase this +1
        # down arrow should decrease this -1
    # on right arrow, skip forward
    # on left arrow key, skip backward
        # wasd support (meant for laptops without good arrow keys)
st.session_state.setdefault("frameidx", 0)
st.session_state.setdefault("frameskip", 1)

def up_pressed():
    st.session_state['frameskip'] += 1

def down_pressed():
    st.session_state['frameskip'] = max(1, st.session_state['frameskip'] - 1)

def left_pressed():
    st.session_state['frameidx'] = max(0, st.session_state['frameidx'] - st.session_state['frameskip'])

def right_pressed():
    st.session_state['frameidx'] = min(video_frame_count, st.session_state['frameidx'] + st.session_state['frameskip'])

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

hotkeys.on_pressed('up', up_pressed)
hotkeys.on_pressed('down', down_pressed)
hotkeys.on_pressed('left', left_pressed)
hotkeys.on_pressed('right', right_pressed)
hotkeys.on_pressed('w', up_pressed)
hotkeys.on_pressed('s', down_pressed)
hotkeys.on_pressed('a', left_pressed)
hotkeys.on_pressed('d', right_pressed)

left,right = st.columns(2)

with left:
    st.session_state["frameidx"] = st.number_input(label="Frame Index", min_value=0, max_value=video_frame_count, value=st.session_state['frameidx'])

with right:
    st.session_state['frameskip'] = st.number_input(label="Frame skip", min_value=1, value=st.session_state['frameskip'])


# display i'th frame of video
loaded_video.set(cv2.CAP_PROP_POS_FRAMES, max(0,min(st.session_state['frameidx'], video_frame_count)))

ret, frame = loaded_video.read()

st.image(frame)

# progress bar to show how much of the video we've gone through
st.progress(st.session_state['frameidx']/video_frame_count)


    # drop-down menus to select place, primary item, secondary item, coin count, race phase
key_frame_type = st.selectbox(label="Select Key Frame Type", options=['place','items','coins'])
    # a button called "Add Key Frame" that populates all unpopulated csv data 
        # from the last key frame to the current key frame with the selected values
    # some UI design to show how the data has been set so far (display key frames?)

if key_frame_type == 'place':
    

    to_place = st.selectbox(label="Place Value Moving TO (0 is unknown)", options=list(range(25)), index=None)

    if to_place is None:
        st.stop()

    def add_place_frame():
        st.session_state['placekeyframes'][st.session_state['frameidx']] = to_place
        st.toast(f"added key frame {st.session_state['frameidx']} with value {st.session_state['placekeyframes'][st.session_state['frameidx']]}")

    st.button(label="Add Key Frame", on_click=add_place_frame)

    st.write(dict(reversed(list(st.session_state['placekeyframes'].items()))))

    remove_frame_idx = st.selectbox(label="Select Key Frame to Remove", options=st.session_state['placekeyframes'], index=None)

    if remove_frame_idx is None:
        st.stop()

    def remove_place_frame():
        value = st.session_state['placekeyframes'].pop(remove_frame_idx, "None")
        st.toast(f"removed key frame {remove_frame_idx} with value {value}")
    
    st.button(label="Click to remove selected frame", on_click=remove_place_frame)

# Once that video is all scrubbed through (when working csv is all populated)
# we can binary search for lap change key frames

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