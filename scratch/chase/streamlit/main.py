import streamlit as st


st.set_page_config(
    page_title="Welcome to the Mario Kart Data App!",
    page_icon="🏁",
)

st.write("# Welcome to Streamlit! 👋")

st.sidebar.success("Select page")

st.session_state["camera_idx"] = 0