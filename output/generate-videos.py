import os
import shutil
import subprocess
import logging

first_frame_duration = 1
last_frame_duration = 5
fps = 60
source = "frames"
videos_dir = "videos"
gifs_dir = "gifs"
temp_dir = "temp"
instagram_dir = "instagram"
completed = 0

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s', filename="generate-videos.log", filemode="w+")

logging.info("Creating folders")
if not os.path.exists(temp_dir):
    os.makedirs(temp_dir)
if not os.path.exists(gifs_dir):
    os.makedirs(gifs_dir)
if not os.path.exists(videos_dir):
    os.makedirs(videos_dir)
if not os.path.exists(instagram_dir):
    os.makedirs(instagram_dir)

logging.info("Listing file")
dirs = os.listdir(source)
for dir in dirs:
    logging.info(f"Started conversion for folder {dir}")

    # LIST OF FILES
    files = os.listdir(f"{source}/{dir}")

    # create still of first image
    options = f"ffmpeg -y -framerate 1 -r {fps} -t {first_frame_duration} -i {source}/{dir}/{files[0]} -loop 0 {temp_dir}/temp_0.mp4"
    subprocess.run(options.split(" "))
    logging.info("Second temp video created")

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
    options = f"ffmpeg -y -i {videos_dir}/{dir}.mp4 -loop 0 -filter_complex fps=30,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse {gifs_dir}/{dir}.gif"
    subprocess.run(options.split(" "))
    logging.info("Output gif created")

    # create instagram compatible video
    options = f"ffmpeg -i {videos_dir}/{dir}.mp4 -c:v libx265 -filter_complex fps=30 -c:a copy {instagram_dir}/{dir}.mp4"
    subprocess.run(options.split(" "))
    logging.info("Output Instagram video created")

    logging.info(f"Completed folder {dir}! Folder {completed + 1}/{len(dirs)}")
    completed += 1

logging.info("Removing temp folder")
shutil.rmtree(temp_dir)

# concatenate ALL videos
# create file list
with open(f"{videos_dir}/list.txt", "w+") as list:
    files = os.listdir(videos_dir + "/")
    file in files:
        list.write(f"file '{file}'\n")
# concatenate
options = f"ffmpeg -f concat -safe 0 -y -i {videos_dir}/list.txt -c copy -loop 0 {videos_dir}/ALL_PAINTINGS.mp4"
subprocess.run(options.split(" "))
logging.info("Big video created")
# convert for Instagram
options = f"ffmpeg -i {videos_dir}/ALL_PAINTINGS.mp4 -c:v libx265 -filter_complex fps=30 -c:a copy {instagram_dir}/ALL_PAINTINGS.mp4"
subprocess.run(options.split(" "))
logging.info("Big video for Instagram created")

logging.info("Everything completed")
