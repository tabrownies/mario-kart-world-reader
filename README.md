# Mario Kart World Screen Reader

## Goal

The goal of this project is twofold.

First, the main reason is to create a machine learning system that takes as inputs the video stream from Mariokart World and outputs various information about the state of the game, such as lap number, placement, and coin count.

Second, we aim to use this core project to build other tools on top of it.

## Project Parts

### Progress Table

This table shows at a high level, where we are with various parts of the project. They fall into three categories:

1. custom tools necessary to build and train the ML models
1. various things on the screen that we are reading
1. applications built on top of that data
Not all of them will necessarily happen, you will find more information about them as they are built in sections below. This is a work in progress and subject to change.

<!-- none are started yet -->
| Part | Part Category | Status |
|------|--------|-------|
| Web based frame classification pipeline | tool | Not started |
| Program that will port the screen capture to the ml model and then display what is read | tool | Not started |
| placement | game reading | Not started |
| lap count | game reading | Not started |
| coin count | game reading | Not started |
| primary item | game reading | Not started |
| secondary item | game reading | Not started |
| race track | game reading | Not started |
| race phase | game reading | Not started |
| online race leaderboard | application | Not started |
| long term stat tracker | application | Not started |
| real time race coach | application | Not started |
| real time commentator | application | Not started |

Note: we will begin by classifying for *single* player play on lap based tracks. We imagine and intend for this to easily translate to multiplayer and other race formats (intermission tracks and knockout tours).

### Web Based Frame Classification Pipeline

This is a web application that will allow us to label various frames from Mariokart World.

### Program that will port the screen capture to the ml model and then display what is read

This program will be run on the computer plugged into the HDMI capture card of the Nintendo Switch 2. It will be responsible for taking the video stream from the Nintendo Switch 2, porting it into the local ml model for analysis, and then outputting the predictions into various visualizations.

### Things read off the screen: Placement, Lap Count, Coin Count, Primary Item, Secondary Item, Race Track, Race Phase

The following table details what each of these things are and how we plan to read them.

<!-- none are started yet -->
| Data Point | Read Method | Status |
|------------|-------------|--------|
| Placement | Single Frame CNN leading into Decision Tree | Not started |
| Lap Count | Single Frame CNN leading into Decision Tree | Not started |
| Coin Count | Single Frame CNN leading into Decision Tree | Not started |
| Primary Item | Unknown | Not started |
| Secondary Item | Unknown | Not started |
| Race Track | Single Frame CNN leading into Decision Tree | Not started |
| Race Phase | Unknown | Not started |

### Online Race Leaderboard

An application that will port the information from the game reading to a public website where people can view the real-time race stats. Ideally this will also allow multiple Nintendo Switch 2s to port their information to the same website, creating a real-time leaderboard for a race with multiple racers.

### Long Term Stat Tracker

An application that will track the long term stats of a player and display them in a web application.

### Real Time Race Coach

An application that will provide real-time race coaching to the player. This could be a good use case of decision tree assisted LLMs or a multi-armed bandit.

### Real Time Commentator

An application that will provide real-time commentary to the player. This could be a good use case for LLMs.

## Other Notes

### Storage Location

For now, we will storing everything locally during the data collection and classification process. In the future, when we start working on the ML models, we will likely move everything to a Google Drive or other cloud storage solution for easier collaboration.

### Data Collection Format

We will be using mp4 files for video, png files for frame images, and csv files for the classification data. We will be downsampling these to 1080p for storage and to ensure that budget capture cards will still work.

Each video will have a unique id attached to it. It will be made of the follwoing connected by underscores:

1. mkw
1. The Shortened Race Name (see this [document](miscilanious.md))
1. The Number of Players on the screen prefixed by p (i.e. p1, p2, p3, p4)
1. Race Type (standard, knockout, time_trial)
    - to begin it will *only* be standard and we will *only* be using standard lap based tracks
1. Whether it is online (online, local)
1. The UTC Date in mm_dd_yyyy format
1. The UTC time in hh_mm_ss format (using 24 hour time)

#### Video

The video will simply be the id.

#### Classification Data

The classification data will be the id prepended with UNFINISHED_ until the data is complete.

#### Frame

Each frame is assigned a unique id that is composed of the follwoing connected by underscores:

1. the frame number starting from 0
    - For convenience, we can pad these with zeros. We will start with 6 digits (000000)
1. video id (see above)

#### Example

##### Video File

`mkw_royal_ruins_p2_standard_online_10_09_2026_06_22_34.mp4`

##### CSV File

`mkw_royal_ruins_p2_standard_online_10_09_2026_06_22_34.csv` **or** `UNFINISHED_mkw_royal_ruins_p2_standard_online_10_09_2026_06_22_34.csv`

##### Frame files

`000000_mkw_royal_ruins_p2_standard_online_10_09_2026_06_22_34.png`
`000001_mkw_royal_ruins_p2_standard_online_10_09_2026_06_22_34.png`
`000002_mkw_royal_ruins_p2_standard_online_10_09_2026_06_22_34.png`
...

## History

We have previously attempted this for Mariokart 8 Deluxe and successfully build one that used a nerual net to determine each players position. It was redementary and worked only most of the time, but it was a good start. Read more about it [here](https://tabrownies.github.io/blog/hack-usu/).

## Contributors

Timothy Brown
