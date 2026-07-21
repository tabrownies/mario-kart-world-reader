import streamlit as st
import os
import cv2
import pandas as pd
import streamlit_hotkeys as hotkeys
import numpy as np

from utils.constants import VIDEO_DIR, TRAINING_CSV_DIR

from utils.video_svd_clusterer import PlacementClusterer

pc = st.session_state.get("pc", None)
if pc is None:
    pc = PlacementClusterer()

if not pc.is_trained:
    st.text("Placement Clusterer is not trained. Click the button below to train it.")
    if st.button("Train!"):
        pbar = st.progress(0.0)
        with st.spinner():
            for msg, msg_idx, msg_total in pc.train():
                if "ather" not in msg:
                    st.toast(msg)
                pbar.progress(msg_idx / msg_total)
    else:
        st.stop()

if not pc.is_labeled:
    N_COLS = 5
    st.text(
        "Placement Clusterer is not labeled. Use the drop-downs lo label the centroids."
    )
    cols = st.columns(N_COLS)
    for i, centroid in enumerate(pc.get_centroids()):
        with cols[i % N_COLS]:
            transformed_centroid = centroid - np.min(centroid)
            maxtransformedcentroid = np.max(transformed_centroid)
            if maxtransformedcentroid > 1e-4:
                transformed_centroid = transformed_centroid / np.max(
                    transformed_centroid
                )
            transformed_centroid = np.nan_to_num(
                transformed_centroid, nan=0.0, posinf=1.0, neginf=0.0
            )
            try:
                st.image(transformed_centroid)
            except:
                print(transformed_centroid)
            st.text("Selectbox goes here")
            # st.selectbox("WIP",range(25))
