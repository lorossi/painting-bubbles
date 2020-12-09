# Painting Bubbles
*Just.... move your mouse*
# [Try it](https://lorenzoros.si/painting-bubbles/)

## What is this?
Some say that *Michelangelo* saw the sculpture inside a marble block and all he had to do was "just" removing everything that wasn't what he wanted. Of course he didn't say that (this quote is originally by Honorè de Balzac) but this made me wonder: what if painters were able to see their painting on the canvas even before getting started? What if, for a moment, I could see the painting even before starting?

Well, the main problem here is that I cannot paint. Or draw, for all that matters. But the idea still stuck with me.

It took a while but one night where I couldn't sleep I started thinking about how I could make this work in real life. The next morning I jumped on the PC *(yay, quarantine!)* and started coding it. Many days later, the project came to life and started working 100%.

*How do I use it?*

Just move your mouse (or tap, if you are on a mobile device) around. If you get bored, press *auto* to let the script complete the image or *next* to get another painting.

If you feel like doing so, press *record* and wait for the rendered gif! It might take a while, tho.

## How it works
The script loads an image from the `assets/paintings` folder and puts it in a hidden canvas. Then, it's pixels are loaded and passed into the real sketch, where they are rendered as big circles that split every time you pass the mouse (or tap) on them. Their color is the average color of the pixels under them.

It's nothing too hard but it took me a while to get used to the `async` quirks of the ECMA6 language.

### Recording
There's a feature that lets your browser record the completion of a painting in the form of a gif animation. It might take a long time, so hang tight and wait.

**BE CAREFUL** when you use that.

## Rendered videos
You can find some output videos on my [Instagram account](https://www.instagram.com/lorossi97/), in higher quality on [Vimeo](https://vimeo.com/489007379) or inside the *output* folder.

## Examples
*Some of the produced gifs:*
![La gioconda](https://github.com/lorossi/painting-bubbles/blob/master/output/gifs/gioconda.gif?raw=true)
![The great wave](https://github.com/lorossi/painting-bubbles/blob/master/output/gifs/great-wave.gif?raw=true)
![Rebel with many causes](https://github.com/lorossi/painting-bubbles/blob/master/output/gifs/rebel-with-many-causes.gif?raw=true)
![Starry night](https://github.com/lorossi/painting-bubbles/blob/master/output/gifs/starry-night.gif?raw=true)
![Vertumno](https://github.com/lorossi/painting-bubbles/blob/master/output/gifs/vertumno.gif?raw=true)

## Credits
Videos created using [ccapture.js by spite](https://github.com/spite/ccapture.js/) for saving frames and [FFMPEG](https://ffmpeg.org/) for rendering.

This project is distributed under Attribution 4.0 International (CC BY 4.0) license.
