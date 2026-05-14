# Miscellaneous

## Directory Organization

- `preprocessor`: contains the standard way of preprocessing the videos to create training data.
  Please build your own in the `scratch` directory, and when it is finished we can replace the
  current preprocessor in the repository!
- `classifiers`: contains subdirectories that hold the classifiers. Please use more specific names
  than "nerual_classifier_for_items."
- `tools`: contains subdirectories that hold tools used for developer.
- `extentions`: contains subdirectories that hold things that are built on top of our classifiers,
  such as data visualization tools
- `training_data`: the place that holds the training data
  - `raw_videos`: the raw videos
  - `videos`: the videos correctly named
  - `frames`: the frames all in their subdirectories
  - `labels`: the lables for the frames in the form of csv files
- `packages`: the code that is common among lots of parts of the application. This includes types,
  but wouldn't include things that are specific to one application, such as the types in-between a
  hypothetcial backend and frontend.
  - `types`: Holds the types used by all the code and conversion utilities for various langauges
- `scratch`: contains scratch space for each developer to play around. Really everything goes
  **EXCEPT** showing stuff up here that will take a lot of storage. Make your own subdirectory with
  your name (e.g. `scratch/timothy`).

## Mario Kart World Track Short Names

The following table gives a shortened name for each track that will be used for saving files. While
not set in stone, we will likely name each intermission track in the form of
`<short_name_one>_<short_name_two>`.

| Full Name    | Short Name     |
| ------------ | -------------- |
| Rainbow Road | `rainbow_road` |

## Suggested Tools

- git
  - We suggest `jj` as a git replacement as it is much nicer to use and we will be using that for
    our version control.
- Python Environments
- Pytorch
- OBS
