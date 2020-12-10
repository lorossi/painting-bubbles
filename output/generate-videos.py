import os
import shutil
import subprocess
import logging

first_frame_duration = 1
last_frame_duration = 5
fps = 60
source = "frames"
videos_dir = "square_videos"
gifs_dir = "square_gifs"
temp_dir = "temp"
completed = 0

logging.basicConfig(level=logging.INFO, filename="generate-videos.log", filemode="w+", format='%(asctime)s %(levelname)s %(message)s')

logging.info("Creating folders")
if not os.path.exists(temp_dir):
    os.makedirs(temp_dir)
if not os.path.exists(gifs_dir):
    os.makedirs(gifs_dir)
if not os.path.exists(videos_dir):
    os.makedirs(videos_dir)

logging.info("Listing file")
dirs = os.listdir(source)
for dir in dirs:
    logging.info(f"Started conversion for folder {dir}")

    # LIST OF FILES
    files = os.listdir(f"{source}/{dir}")

    # create still of first image
    options = f"ffmpeg -y -framerate 1 -r {fps} -t {first_frame_duration} -i {source}/{dir}/{files[0]} -loop 0 {temp_dir}/temp_0.mp4"
    subprocess.run(options.split(" "))
    logging.info("First temp video created")

    # create video
    options = f"ffmpeg -y -r {fps} -i {source}/{dir}/%07d.png -loop 0 {temp_dir}/temp_1.mp4"
    subprocess.run(options.split(" "))
    logging.info("Second temp video created")

    # create still of last image
    options = f"ffmpeg -y -framerate 1 -r {fps} -t {last_frame_duration} -i {source}/{dir}/{files[-1]} -loop 0 {temp_dir}/temp_2.mp4"
    subprocess.run(options.split(" "))
    logging.info("Third temp video created")

    # create file list
    with open(f"{temp_dir}/list.txt", "w+") as list:
        for x in range(3):
            list.write(f"file 'temp_{x}.mp4'\n")

    # concatenate the videos in form of mp4
    options = f"ffmpeg -f concat -safe 0 -y -i {temp_dir}/list.txt -c copy -loop 0 {videos_dir}/{dir}.mp4"
    subprocess.run(options.split(" "))
    logging.info("Output video created")

    # concatenate the videos in form of gif
    options = f"ffmpeg -y -i {videos_dir}/{dir}.mp4 -loop 0 -filter_complex fps=25,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse {gifs_dir}/{dir}.gif"
    subprocess.run(options.split(" "))
    logging.info("Output gif created")

    logging.info(f"Completed folder {dir}! Folder {completed + 1}/{len(dirs)}")
    completed += 1

logging.info("Removing temp folder")
shutil.rmtree(temp_dir)
logging.info("Everything completed")
