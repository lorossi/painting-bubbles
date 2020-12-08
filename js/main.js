/* jshint esversion: 8 */
// basic objects
let sketch, capturer;
// sketch container id
let sketch_id = "sketch";
// make this true to start recording
let recording = false;
// make this true to go automatically
let auto = false;
// current path
let current_path;
// are we on mobile?
let mobile = false;

// images names and dir
const dir = "assets/paintings/";
const names = ["a-sunday-on-la-grande-jatte.jpg", "american-gothic.jpg", "arnolfini-portrait.jpg", "bouilloire-et-fruits.jpg", "composition-8.jpg", "crying-girl.jpg", "der-wanderer-uber-dem-nebelmeer.jpg", "el-beso.jpg", "flying-copper.jpg", "gioconda.jpg", "great-wave.jpg", "guernica.jpg", "hunters-in-the-snow.jpg", "impression-soleil-levant.jpg", "la-libert\u00e8-guidant-le-peuple.jpg", "meisje-met-de-parel.jpg", "napoleon-crossing-the-alps.jpg", "nascita-di-venere.jpg", "nighthawks.jpg", "persistence-of-memory.jpg", "piet-modrian-composition-2-with-red-blue-and-yellow.jpg", "rebel-with-many-causes.jpg", "skrik.jpg", "starry-night.jpg", "sunflowers.jpg", "the-kiss.jpg", "the-son-of-men.jpg", "the-tower-of-babel.jpg", "the-water-lily-pond.jpg"];

// main function
let main = async () => {
  // load next image
  if (recording) {
    next_image(0);
  } else {
    next_image("random");
  }

  // get canvas size
  canvas_size = get_canvas_size();
  // load image pixels
  let pixels;
  pixels = await load_pixels(img_path, canvas_size);
  resize_canvas(pixels.width, pixels.height);

  if (recording) {
    // fire up the capturer
    // currently generating JPG files, will change later into gifs
    setup_capturer();
  }

  // create canvas and sketch
  let canvas, ctx;
  canvas = document.getElementById(sketch_id);
  if (canvas.getContext) {
    ctx = canvas.getContext("2d", {alpha: false});
    sketch = new Sketch(canvas, ctx, 60);
    sketch.pixels = pixels.data;
    sketch.run();
  }
};

// calculate optimal canvas size
get_canvas_size = () => {
  let canvas_size;
  let width, height;

  // update global variable
  mobile = get_css_property("--mobile");

  width = $(document).width();
  height = $(document).height();

  for (let i = 1000; i >= 0; i -= 100) {
    if (width >= i && height >= i) {
      return i;
    }
  }
};

// resize canvas
resize_canvas = (width, height) => {
  $(`canvas#${sketch_id}`).prop({
    "width": width,
    "height": height,
  });
};


// loads next image in path
// direction = none, 1 -> next
// direction = -1 -> previous
// direction = 0 -> reset
// direction = "random" -> random
// direction = "this" -> reset this
let next_image = async (direction) => {
  if (recording && capturer){
    recording = false;

    // add waiting banner
    let waiting = $('<div class="wait">The video is being generated, wait a while....<br>Reload the page after the download is complete!</div>');
    $("body").append(waiting);

    await capturer.stop();
    await capturer.save(async (blob) => {
      let filename = names[current_path].replace("-", " ").replace(".jpg", "");

      new Promise((resolve, reject) => {
      let reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onload = () => {
        // create and fill element
        let element = $('<a class="hidden"></a>');
        $(element).attr("href", reader.result);
        $(element).attr("download", filename);
        $("body").append(element);
        $(element)[0].click("click");
        $(element).remove();
        resolve("image created");
      };
      reader.onerror = () => reject("error while creating image");
      });

      // delete waiting banner
      $(waiting).remove();
      // re enable record
      $(".icons #record").removeClass("disabled");

    });
  }

  if (current_path === undefined) {
    current_path = 0;
  }

  if (direction === undefined) {
    direction = 1;
  } else if (direction === "random") {
    direction = random(0, 100000, true);
  } else if (direction === "keep") {
    direction = 0;
  }

  // load new image
  current_path = (current_path + direction) % names.length;
  img_path = dir + names[current_path];
  // get canvas size
  canvas_size = get_canvas_size();

  if (sketch) {
    // load pixels
    let pixels;
    pixels = await load_pixels(img_path, canvas_size);
    // resize the canvas to match the new image
    resize_canvas(pixels.width, pixels.height);
    sketch.resized();

    // put pixels inside sketch
    sketch.pixels = pixels.data;

  // fire up recorder again
  if (recording) {
    console.log("%cRecorded painting started", "color:green;font-size:1rem;");
    setup_capturer();
  }

    // reset sketch
    sketch.reset();
    // reload sketch
    sketch.run();
  }
};

let setup_capturer = () => {
  capturer = new CCapture({
                           format: 'gif',
                           workersPath: 'js/',
                           motionBlurFrames: 1,
                           name: `${names[current_path].replace("-", " ").replace(".jpg", "")}-${current_path+1}`,
                           autoSaveTime: 30,
                           frameRate: 60
                          });
  console.log("%c Started recording painting", "color:yellow;font-size:1rem;");
};

// load image and return pixels. img_src can be blob or path
let load_pixels = (img_src, canvas_size) => {
  return new Promise((resolve, reject) => {
    let img = new Image();
    img.src = img_src;
    let image_data;

    img.onload = () => {
      let canvas, ctx;
      let image_width, image_height;
      // save image sizes
      image_width = img.naturalWidth;
      image_height = img.naturalHeight;
      // calculate image resize
      // biggest side and scale
      let biggest, scl;
      biggest = Math.max(image_width, image_height);
      scl = canvas_size / biggest;


      let seed = random(100000000, 999999999, true);
      // create hidden canvas to load pixels
      $(".container").append(`<canvas class="hidden" id="hidden" seed="${seed}"></canvas>`);
      $("canvas#hidden").prop({"width": image_width * scl, "height": image_height * scl});
      // load (hidden) canvas
      canvas = document.getElementById("hidden");

      if (canvas.getContext) {
        ctx = canvas.getContext("2d", {alpha: false});
        // anti alias
        ctx.imageSmoothingQuality = "high";
        // reset canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // set background
        ctx.fillStyle = get_css_property("--background-color");
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // draw image
        ctx.drawImage(img, 0, 0, image_width, image_height, 0, 0, image_width * scl, image_height * scl);
        // load pixels
        image_data = ctx.getImageData(0, 0, image_width * scl, image_height * scl);
      }
      // delete canvas
      $("canvas#hidden").remove();

      // finally return pixels
      resolve(image_data);
    };
    img.onerror = () => reject("error");
  });
};


$(document).ready(() => {
  console.clear();
  console.log("%cSnooping around? Check the repo! https://github.com/lorossi/painting-bubbles", "color:white;font-size:1.5rem;");
  console.log("%cAs opening the console messes with the browser's mouse events, I recommend it to be closed to better enjoy the experience!", "color:white;font-size:1rem;");
  main();

  // disable stop
  $(".icons #stop").addClass("disabled");

  $(".icons div").click((e) => {
    if (e.target.className === "disabled") {
      // if the button is disabled, a click won't affect the output
      return;
    }

    if (e.target.id === "play") {
      // play button was pressed
      auto = true;
      // start drawing again
      sketch.draw();
      // disable play and enable stop
      $(".icons #play").addClass("disabled");
      $(".icons #stop").removeClass("disabled");
    } else if (e.target.id === "stop") {
      if (recording) {
        next_image("this");
      }
      // stop button was pressed
      auto = false;
      recording = false;
      // disable stop and enable play
      $(".icons #stop").addClass("disabled");
      $(".icons #play").removeClass("disabled");
    } else if (e.target.id === "next") {
      // next button was pressed
      if (auto) {
        // if the sketch was in auto mode, stop it
        auto = false;
        // disable stop and enable play
        $(".icons #stop").addClass("disabled");
        $(".icons #play").removeClass("disabled");
      }
      next_image();
    } else if (e.target.id === "record") {
      // hide record and show stop
      $(".icons #record").addClass("disabled");
      $(".icons #stop").removeClass("disabled");

      console.log("%cDO IT ON YOU OWN RISK. YOU HAVE BEEN WARNED", "color:red;text-size:2.5rem;");
      recording = true;
      auto = true;
      next_image("keep");
    }
  });
});
