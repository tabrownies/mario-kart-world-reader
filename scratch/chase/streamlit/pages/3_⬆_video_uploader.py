import streamlit as st
import os
import ffmpeg
from datetime import datetime, timezone

video_dir = "./training_data/uploaded_videos"

from utils.packages.types.python.translate_enums import EnumTranslator

et = EnumTranslator()

race_track_strings = []
race_track = None
while race_track != "track_unknown":
    # st.toast(f"trying enum {len(race_track_strings)+1}")
    race_track = et.raceCourseEnumToString(len(race_track_strings)+1)
    # st.toast(f"got {race_track=}")
    if race_track == "track_unknown":
        break
    race_track_strings.append(race_track)



track_name = st.selectbox(label="Select Track", options=race_track_strings, index=None)

if not track_name:
    st.stop()

num_players = st.selectbox(label="Select number of players", options=list(range(1,5)), index=None)

if not num_players:
    st.stop()

race_type_strings = []
race_type = None
while race_type != "course_type_unknown":
    race_type = et.raceCourseTypeEnumToString(len(race_type_strings)+1)
    if race_type == "course_type_unknown":
        break
    race_type_strings.append(race_type)
    


race_type = st.selectbox(label="Select Race Type", options=race_type_strings, index=None)

if not race_type:
    st.stop()

locale = st.selectbox(label="Select Locality", options=["local","online"], index=None)

if not locale:
    st.stop()

chatmode = st.selectbox(label="Select Chat Mode", options=["chat", 'nochat'], index=None)

if not chatmode:
    st.stop()


def generate_video_id(track_name, num_players, race_type, locale, chatmode):
    now = datetime.now(timezone.utc)
    date_str = now.strftime("%m_%d_%Y")
    time_str = now.strftime("%H_%M_%S")
    player_str = f"p{num_players}"
    
    return f"mkw_{track_name}_{player_str}_{race_type}_{locale}_{chatmode}_{date_str}_{time_str}"

uploaded_file = st.file_uploader("Upload Videos", type="video", accept_multiple_files=False, max_upload_size=1000)

if not uploaded_file:
    st.stop()

def process_video(uploaded_file):

    file_path = os.path.join(video_dir, uploaded_file.name)
    with open(file_path, "wb") as file:
        file.write(uploaded_file.getbuffer())
    # st.success(f"Video saved to {file_path}")

    with st.spinner(f"saving video as mp4"):

    # uploaded_file_name_without_extension = os.path.splitext(uploaded_file.name)[0]
        video_id = generate_video_id(track_name=track_name, num_players=num_players, race_type=race_type, locale=locale, chatmode=chatmode)

        stream = ffmpeg.input(file_path)
        stream = ffmpeg.filter(stream, "fps", fps=10)
        stream = ffmpeg.output(stream, os.path.join(video_dir,video_id+".mp4"), f="mp4")
        ffmpeg.run(stream)

    st.success(f"saved {video_id+'.mp4'} video as 10 fps mp4")
    os.remove(file_path)
    # st.success(f"removed {file_path}")

if st.button("Process video"):
    process_video(uploaded_file)



