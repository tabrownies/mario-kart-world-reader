import numpy as np
import cv2
from sklearn.cluster import KMeans, AgglomerativeClustering
from sklearn.neighbors import kneighbors_graph
from sklearn.decomposition import TruncatedSVD
import os
import pickle
from tqdm.auto import tqdm
from utils.constants import VIDEO_DIR, CLUSTERER_DIR, PLACEMENT_FILENAME


class Clusterer:
    def __init__(self, nclusters, svd_components, topleft=(0, 0), bottomright=(1, 1)):
        self.nclusters = nclusters
        self.svd_components = svd_components

        self.kmeans = KMeans(n_clusters=self.nclusters, n_init=10)
        self.svd = TruncatedSVD(n_components=self.svd_components)

        self.training_features = None
        self.training_lables = None
        self.is_trained = False
        self.is_labeled = False
        self.topleft = topleft
        self.bottomright = bottomright
        self.labels = None
        self.savefile = None
        self.cropped_dimensions = None
        self.mean_feat = None
        self.std_feat = None

    def _extract_images_from_video(self, cap: cv2.VideoCapture):
        cap.set(cv2.CAP_PROP_FRAME_COUNT, 0)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        pbar = tqdm(total=total_frames, desc="processing frames", leave=False)
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            cropped = self._crop(frame)
            cropped = cv2.cvtColor(cropped, cv2.COLOR_RGB2GRAY)
            cropped = cropped / np.max(cropped)
            cropped = np.nan_to_num(cropped, nan=0.0, posinf=1.0, neginf=0.0)
            yield cropped
            pbar.update()
        pbar.close()

    def _crop(self, frame):
        if len(frame.shape) < 2:
            raise ValueError(
                f"Frame has shape {frame.shape}, which is not at least 2-d!"
            )
        totalx, totaly = frame.shape[:2]
        totalx -= 1
        totaly -= 1
        left = int(self.topleft[0] * totalx)
        right = int(self.bottomright[0] * totalx)
        top = int(self.topleft[1] * totaly)
        bottom = int(self.bottomright[1] * totaly)
        return frame[left:right, top:bottom]

    def train(self, video_paths=None):
        if video_paths is None:
            video_files = [
                filename
                for filename in os.listdir(VIDEO_DIR)
                if filename.endswith(".mp4")
            ]
            video_paths = [
                os.path.join(VIDEO_DIR, filename) for filename in video_files
            ]

        total_messages = 5 + len(video_paths)
        msg_index = 1
        msg = f"Training K-Means classifier with {len(video_paths)} videos..."
        yield (msg, msg_index, total_messages)
        msg_index += 1
        print(msg)

        all_features = []
        for path in tqdm(video_paths):
            yield f"Gathering data...", msg_index, total_messages
            msg_index += 1
            cap = cv2.VideoCapture(path)
            for cropped in self._extract_images_from_video(cap):
                if self.cropped_dimensions is None:
                    self.cropped_dimensions = cropped.shape
                edge_detected = cv2.Laplacian(cropped, cv2.CV_64F)
                edge_detected = cv2.convertScaleAbs(edge_detected)
                all_features.append(edge_detected.reshape(1, -1))

        features_array = np.vstack(all_features, dtype=float)
        self.mean_feat = np.mean(features_array, axis=0)
        features_array -= self.mean_feat
        self.std_feat = np.std(features_array, axis=0)
        features_array /= self.std_feat
        msg = f"Applying SVD Dimensionality Transform"
        yield (msg, msg_index, total_messages)
        msg_index += 1
        print(msg)

        reduced_features = self.svd.fit_transform(features_array)
        self.training_features = reduced_features

        # msg = "Applying K-Means model..."
        # yield (msg, msg_index, total_messages)
        # msg_index += 1
        # print(msg)

        # self.kmeans.fit(reduced_features)
        # self.is_trained = True

        msg = "creating connectivity graph..."
        yield (msg, msg_index, total_messages)
        msg_index += 1
        print(msg)

        stats = {
            "nsamples": len(all_features),
            "original_dim": features_array.shape[1],
            "reduced_dim": self.training_features.shape[1],
            "explained_variance": self.svd.explained_variance_ratio_,
            "total_variance": np.sum(self.svd.explained_variance_ratio_),
        }

        msg = "Training Complete"
        yield (msg, msg_index, total_messages)
        msg_index += 1
        print(msg)

        return stats

    def label(self, labels):
        assert len(labels) == self.nclusters
        self.labels = labels
        self.is_labeled = True

    def save(self):
        if self.savefile is None:
            raise RuntimeError("Cannot save! No savefile name found!")

        if not self.is_trained:
            raise RuntimeError("Cannot save! Model is not trained.")

        if not self.is_labeled:
            raise RuntimeError("Cannot save! Model is not labeled!")

        data = {
            "nclusters": self.nclusters,
            "svd_components": self.svd_components,
            "topleft": self.topleft,
            "bottomright": self.bottomright,
            "kmeans": self.kmeans,
            "svd": self.svd,
            "cropped_dimensions": self.cropped_dimensions,
            "training_features": self.training_features,
            "training_labels": self.training_lables,
        }

        with open(os.path.join(CLUSTERER_DIR, PLACEMENT_FILENAME), "wb") as file:
            pickle.dump(data, file)

        return True

    def load_from_data(self, data: dict):
        self.nclusters = data.get("nclusters")
        self.svd_components = data.get("svd_components")
        self.topleft = data.get("topleft")
        self.bottomright = data.get("bottomright")
        self.cropped_dimensions = data.get("cropped_dimensions")

        kmeans = data.get("kmeans")
        svd = data.get("svd")
        training_features = data.get("training_features")

        if (
            isinstance(kmeans, KMeans)
            and isinstance(svd, TruncatedSVD)
            and isinstance(training_features, np.ndarray)
        ):
            self.is_trained = True
            self.kmeans = kmeans
            self.svd = svd
            self.training_features = training_features
            training_labels = data.get("training_labels")
            if (
                "__len__" in dir(training_labels)
                and len(training_labels) == self.nclusters
            ):
                self.is_trained = True
                self.training_lables = training_labels
            else:
                self.is_trained = False
        else:
            self.is_trained = False

    def get_centroids(self):
        centers = self.kmeans.cluster_centers_
        inverted_centers = self.svd.inverse_transform(centers)
        inverted_centers *= self.std_feat
        inverted_centers += self.mean_feat
        reshaped_centers = [
            c.reshape(self.cropped_dimensions) for c in inverted_centers
        ] + [self.mean_feat.reshape(self.cropped_dimensions)]
        return reshaped_centers


class PlacementClusterer(Clusterer):
    def __init__(
        self,
        nclusters=25,
        svd_components=500,
        topleft=(0.80, 0.84),
        bottomright=(0.97, 0.97),
    ):
        super().__init__(
            nclusters=nclusters,
            svd_components=svd_components,
            topleft=topleft,
            bottomright=bottomright,
        )
        self.savefile = PLACEMENT_FILENAME

    @staticmethod
    def load():
        data = None
        if os.path.exists(os.path.join(CLUSTERER_DIR, PLACEMENT_FILENAME)):
            with open(os.path.join(CLUSTERER_DIR, PLACEMENT_FILENAME), "r") as file:
                data = pickle.load(file)
        else:
            print(
                f"no data found @ {os.path.join(CLUSTERER_DIR, PLACEMENT_FILENAME)}. Creating new clusterer."
            )

        new_placement_clusterer = PlacementClusterer()

        if data is not None:
            try:
                new_placement_clusterer.load_from_data(data)
            except:
                print(f"failed to load from file!")
                if os.path.exists(os.path.join(CLUSTERER_DIR, PLACEMENT_FILENAME)):
                    os.remove(os.path.join(CLUSTERER_DIR, PLACEMENT_FILENAME))
                print("removed bogus data file")
                new_placement_clusterer = PlacementClusterer()

        return new_placement_clusterer
