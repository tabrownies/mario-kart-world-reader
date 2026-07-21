from utils.obs_streamer import OBSVirtualCameraStream
import streamlit as st
import os

st.error("This page is a WIP")

devs = os.listdir("/dev")
vid_indices = set([dev[-1] for dev in devs])
vid_indices = sorted(vid_indices)

if "camera_idx" not in st.session_state:
    st.session_state["camera_idx"] = 0


camera_idx = st.session_state["camera_idx"]

st.write(
    "Welcome to the camera picker! Use the drop-down to select a video capture device."
)

st.write(f"{vid_indices=}")

camera_idx_in_vid_idxs = camera_idx in vid_indices

st.write(f"{camera_idx_in_vid_idxs=}")
if camera_idx_in_vid_idxs:
    st.write(f"{vid_indices.index(camera_idx)=}")
    vid_idx = vid_indices.index(camera_idx)
    st.session_state["camera_idx"] = st.selectbox(
        "Select camera index", vid_indices, index=vid_idx
    )
    try:
        camera = OBSVirtualCameraStream(camera_index=st.session_state["camera_idx"])
        frame = camera.get_frame()
        st.image(frame)
    except Exception as e:
        st.write(
            f"Unable to capture camera frame with camera frame {st.session_state['camera_idx']} {str(e)}"
        )
else:
    st.session_state["camera_idx"] = st.selectbox("Select camera index", vid_indices)
    st.write(f"cannot find {camera_idx=} in vid_indices!")


st.button("retry")
