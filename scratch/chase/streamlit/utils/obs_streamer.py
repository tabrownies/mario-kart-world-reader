import time
import cv2
import numpy as np

class OBSVirtualCameraStream:
    def __init__(self, camera_index):
        # Initialize video capture with the given camera index
        self.cap = cv2.VideoCapture(camera_index)
        if not self.cap.isOpened():
            raise ValueError("Unable to open video source")

    def get_frame(self):
        print("Getting frame")
        # Capture a single frame
        ret, frame = self.cap.read()
        print(frame.shape)

        if not ret:
            raise RuntimeError("Failed to capture frame")
        
        # Return the frame as a NumPy array
        return frame

    def release(self):
        # Release the video capture object
        self.cap.release()