/* jshint esversion: 8 */
// basic objects
let sketch, capturer;
// sketch container id
let sketch_id = "sketch";
// make this true to start recording
let recording = true;
// make this true to go automatically
let auto = true;
// current path
let current_path;
// are we on mobile?
let mobile = false;

// images names and dir
const dir = "assets/paintings/";
const names = ["american-gothic.jpg", "der-wanderer-uber-dem-nebelmeer.jpg", "persistence-of-memory.jpg", "crying-girl.jpg", "blue-poles-number-11.jpg", "piet-modrian-composition-2-with-red-blue-and-yellow.jpg", "creazione-di-adamo.jpg", "the-tower-of-babel.jpg", "el-beso.jpg", "rebel-with-many-causes.jpg", "great-wave.jpg", "gioconda.jpg", "napoleon-crossing-the-alps.jpg", "nascita-di-venere.jpg", "the-kiss.jpg", "skrik.jpg", "impression-soleil-levant.jpg", "bouilloire-et-fruits.jpg", "a-sunday-on-la-grande-jatte.jpg", "the-son-of-men.jpg", "flying-copper.jpg", "guernica.jpg", "starry-night.jpg", "composition-8.jpg", "nighthawks.jpg"];

let main = async () => {
  let canvas_size, img_path;
  // get correct size and resize canvas
  canvas_size = get_canvas_size();
  resize_canvas(canvas_size);

  if (!recording && !current_path) {
    // load a random image
    current_path = random(0, names.length - 1, true);
  } else if (recording && !current_path) {
    current_path = 0;
  }
  img_path = dir + names[current_path];

  let pixels;
  pixels = await load_pixels(img_path, canvas_size);

  if (recording) {
    // fire up the capturer
    // currently generating JPG files, will change later into gifs
    capturer = new CCapture({
                             format: "png",
                             name: `${names[current_path].replace("-", " ").replace(".jpg", "")}-${current_path+1}`,
                             autoSaveTime: 30,
                             frameRate: 60
                            });
  }

  let canvas, ctx;
  canvas = document.getElementById(sketch_id);
  if (canvas.getContext) {
    ctx = canvas.getContext("2d", {alpha: false});
    sketch = new Sketch(canvas, ctx, pixels.width, pixels.height, 60);
    sketch.pixels = pixels.data;
    sketch.run();
  }
};

get_canvas_size = () => {
  let canvas_size;
  // adaptive size
  if ($(document).width() >= 900 && $(document).height() >= 900) {
    canvas_size = 900;
  } else if ($(document).width() >= 600 && $(document).height() >= 600) {
    canvas_size = 600;
  } else {
    canvas_size = 300;
  }

  mobile = get_css_property("--mobile");

  return canvas_size;
};

resize_canvas = (size) => {
  // resize canvas
  $(`canvas#${sketch_id}`).prop({
    "width": size,
    "height": size,
  });
};


$(document).ready(() => {
  main();

  // disable stop
  $(".icons #stop").addClass("disabled");
  $(".icons img").click((e) => {
    console.log(e.target.id);

    if (e.target.className === "disabled") {
      return;
    }

    if (e.target.id === "play") {
      auto = true;
      $(".icons #play").addClass("disabled");
      $(".icons #stop").removeClass("disabled");
    } else if (e.target.id === "stop") {
      auto = false;
      $(".icons #stop").addClass("disabled");
      $(".icons #play").removeClass("disabled");
    } else if (e.target.id === "next") {
      if (auto) {
        auto = false;
        $(".icons #stop").addClass("disabled");
        $(".icons #play").removeClass("disabled");
      }
      next_image();
    }
  });
});

$(window).resize(() => {
  get_canvas_size();
  resize_canvas();
  if (sketch) {
    sketch.resized();
  }
});

// loads next image in path
// dir = none, 1 -> next
// dir = -1 -> previous
// dir = 0 -> rest
let next_image = (dir) => {
  // stop sketch (if any)
  if (sketch) {
    // stop and save recording (if any)
    if (capturer) {

      capturer = null;
    }

    sketch = null;

    // remove old canvas
    $(`#${sketch_id}`).remove();
    // create a new canvas
    $(`.container`).append(`<canvas id="${sketch_id}"></canvas>`);
  }

  if (dir === undefined) {
    dir = 1;
  } else if (dir === "random") {
    dir = random(0, 100000, true);
  }

  current_path = (current_path + dir) % names.length;

  main();
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

      // create hidden canvas to load pixels
      $(".container").append('<canvas class="hidden" id="hidden"></canvas>');
      $("canvas#hidden").prop({"width": image_width * scl, "height": image_height * scl});
      // load (hidden) canvas
      canvas = document.getElementById("hidden");

      // displacement values to center the image
      let dx, dy;
      dx = Math.floor((canvas_size - image_width * scl) / 2);
      dy = Math.floor((canvas_size - image_height * scl) / 2);

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
        image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      }
      // delete canvas
      $("canvas#hidden").remove();

      // finally return pixels
      resolve(image_data);
    };
    img.onerror = () => reject("error");
  });
};


class Circle {
  constructor(x, y, width, height, color, split_direction) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.cx = this.x + this.width / 2; // center x coord
    this.cy = this.y + this.height / 2; // center x coord
    this._r = Math.min(this.width, this.height) / 2; // radius
    this._color = color;

    this.min_radius = 4;
    this._min_size = this.r < this.min_radius;
    this._recently_split = true;
    this._age_count = 0;

    if (this._r < 10) {
        this._split_age = 1;
    } else {
        this._split_age = 2;
    }


    if (!split_direction) {
      // it's the first circle, we have to set the direction of its split
      if (this.height > this.width) {
        this._split_direction = "horizontal";
      } else {
        this._split_direction = "vertical";
      }
      // let's also set an higher life
      this._split_age = 10;
    } else {
      this._split_direction = split_direction;
    }

    if (mobile) {
      // we're on mobile, let's not bore our users to death
      this._split_age = 2;
      this._recently_split = false;
    }
}

  get pos() {
    return {
      "x": this.x,
      "y": this.y,
      "cx": this.cx,
      "cy": this.cy,
      "r": this._r,
      "width": this.width,
      "height": this.height
    };
  }

  get r() {
    return this._r;
  }

  get color() {
    // r g b array to rgb string
    let color_string = "#";
    for (let i = 0; i < this._color.length; i++) {
      let channel;
      channel = this._color[i];
      if (channel > 255) {
        channel = 255;
      }
      color_string += Math.floor(channel).toString(16).padStart(2, '0');
    }
    return color_string;
  }

  get split_direction() {
    return this._split_direction;
  }

  get recently_split() {
    // has the
    this._recently_split = this._age_count < this._split_age;
    return this._recently_split;
  }

  set recently_split(bool) {
    if (this._age_count >= this._split_age) {
      this._recently_split = bool;
      this._age_count = 0;
    } else {
      this._age_count++;
    }
  }

  get min_size() {
    return this._min_size;
  }

}


class Sketch {
  constructor(canvas, context, source_width, source_height, fps) {
    this.canvas = canvas;
    this.ctx = context;
    this.width = canvas.width;
    this.height = canvas.height;
    this._source_width = source_width;
    this._source_height = source_height;

    this.fps = fps || 60;
    this.fps_interval = 1000 / this.fps;

    // how many circles should be selected for splitting
    this.auto_to_keep = 35;
    // amout of split circles
    this.split_circles = 0;
    // pixels container
    this._pixels = [];
    // rects container
    this._circles = [];
    // when this is true, all circles are of minimal size
    this._ended = false;

    // displacement
    this.dx = Math.floor((this.width - this._source_width) / 2);
    this.dy = Math.floor((this.height - this._source_height) / 2);

    // save canvas in memory (currently unused, might delete later)
    this.savedData = new Image();

    // event listener
    this.canvas.addEventListener('mousemove', this.mouseMoved.bind(this), false);
    this.canvas.addEventListener('touchstart', this.touchMoved.bind(this), false);
    this.canvas.addEventListener('touchmove', this.touchMoved.bind(this), false);
  }

  run() {
    // run once
    this.setup();
    // anti alias
    this.ctx.imageSmoothingQuality = "high";
    // run often
    this.draw();
  }

  save() {
    this.savedData.src = this.canvas.toDataURL("image/png");
  }

  restore() {
    this.ctx.drawImage(this.savedData, 0, 0);
  }

  resized() {
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  createFavicon(color) {
    // create a monocolor canvas to be set as favicon
    let favicon = document.createElement('canvas');
    favicon.width = 16;
    favicon.height = 16;
    let favicon_ctx = favicon.getContext('2d');
    favicon_ctx.fillStyle = color;
    favicon_ctx.fillRect(0, 0, 16, 16);
    let link = document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = favicon.toDataURL("image/x-icon");
    document.getElementsByTagName('head')[0].appendChild(link);
  }

  mouseMoved(e) {
    let mouse_coords;
    mouse_coords = get_mouse_pos(this.canvas, e);
    this.searchCircle(mouse_coords.x, mouse_coords.y);
  }

  touchMoved(e) {
    let touch_coords;
    touch_coords = get_touch_pos(this.canvas, e);
    this.searchCircle(touch_coords.x, touch_coords.y);
  }

  searchCircle(x, y) {
    let found, pos, i, recently_split;

    found = false;
    for (i = 0; i < this._circles.length; i++) {
      pos = this._circles[i].pos;
      if (x >= pos.x && y >= pos.y && x <= pos.x + pos.width && y <= pos.y + pos.height && !this._circles[i].min_size) {
        recently_split = this._circles[i].recently_split;
        if (recently_split) {
          this._circles[i].recently_split = false;
          break;
        }
        found = true;
        break;
      }
    }

    if (found) {
      // at least one has been found
      this.splitCircle(i);
      window.requestAnimationFrame(this.draw.bind(this));
    }
  }

  splitCircle(index) {
    let split_direction, next_split_direction;
    split_direction = this._circles[index].split_direction;
    if (split_direction === "horizontal") {
      next_split_direction = "vertical";
    } else if (split_direction === "vertical"){
      next_split_direction = "horizontal";
    }

    // get old circle position
    let pos;
    pos = this._circles[index].pos;

    // remove old circle
    this._circles.splice(index, 1);

    // new position and size
    let nx, ny, nwidth, nheight;
    for (let i = 0; i < 2; i++) {
      if (split_direction === "horizontal") {
        nx = pos.x;
        ny = pos.y + pos.height / 2 * i;
        nwidth = pos.width;
        nheight = pos.height / 2;
      }  else if (split_direction === "vertical"){
        nx = pos.x + pos.width / 2 * i;
        ny = pos.y;
        nwidth = pos.width / 2;
        nheight = pos.height;
      }
      let average_color = this.averageColor(nx - this.dx, ny - this.dy, nwidth, nheight, true);
      let new_circle = new Circle(nx, ny, nwidth, nheight, average_color, next_split_direction);
      this._circles.push(new_circle);
    }
  }

  setup() {
    // load background
    this.background = get_css_property("--background-color");
    if (capturer) {
      // start capturing
      capturer.start();
    }
    // save time to limit fps
    this.then = performance.now();
  }

  draw(e) {
    // time elapsed since last frame was rendered

    if (!recording) {
      let diff;
      diff = performance.now() - this.then;
      if (diff < this.fps_interval && auto) {
        // not enough time has passed, so we request next frame and give up on this render
        window.requestAnimationFrame(this.draw.bind(this));
        return;
      }
    }

    if (!this.ended || this._circles.length == 1) {
      // load the next frame
      window.requestAnimationFrame(this.draw.bind(this));
    } else if (this.ended && (auto || recording)) {
        // if in auto or recording, load another image
        // if recording, stop and save
      if (capturer) {
        capturer.stop();
        capturer.save();
      }
      next_image();
      return;
      // otherwise, the user has to do so manually
    }

    // enough time has now passed, let's keep track of the time
    this.then = performance.now();

    // if circle is empty, it's time to generate a new circle
    if (this._circles.length === 0) {
      // compute average image color
      let average_color = this.averageSource();
      //create a new rect
      let new_rect = new Circle(this.dx, this.dy, this.width - this.dx * 2, this.height - this.dy * 2, average_color);
      this._circles.push(new_rect);
      // the background color is now the color of the rect, not only for canvas but for the whole page
      this.background = new_rect.color;
      set_css_property("--background-color", this.background);
      // create a favicon with the same color
      this.createFavicon(this.background);
    }

    this.ctx.save();
    // reset canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // set background
    this.ctx.fillStyle = this.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // if this is true, all circles cannot become smaller
    let all_min_size = true;
    // draw rects
    // shadow
    this.ctx.shadowColor = get_css_property("--shadow-color");
    this._circles.forEach((c, i) => {
      let circle_pos;
      circle_pos = c.pos;

      if (c.pos.r > 25) {
        this.ctx.shadowOffsetX = 3;
        this.ctx.shadowOffsetY = 3;
        this.ctx.shadowBlur = 5;
      } else if (c.pos.r > 10){
        // smaller shadow for very small circles
        this.ctx.shadowOffsetX = 1;
        this.ctx.shadowOffsetY = 1;
        this.ctx.shadowBlur = 2;
      } else {
        // no shadow for smallest circles
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        this.ctx.shadowBlur = 0;
      }

      this.ctx.fillStyle = c.color;
      this.ctx.beginPath();
      this.ctx.arc(circle_pos.cx, circle_pos.cy, circle_pos.r, 0, 2 * Math.PI);
      this.ctx.fill();
      if (all_min_size && !c.min_size) {
        all_min_size = false;
      }
    });
    this.ctx.restore();

    // save frame if recording
    if (recording) {
      // async function
      this.captureFrame();
    }

    // if the sketch is in auto mode, pop a circle
    if (auto && !all_min_size) {
      // circles big enough to be split
      let available_circles;
      available_circles = this._circles.filter(c => !c.min_size);

      // how many circles are split each time
      let iterations = Math.floor(this.split_circles / 10 - 180);
      iterations = iterations <= 0 ? 1 : iterations;
      // sort by size
      available_circles.sort((c1, c2) => parseInt(c2.r) - parseInt(c1.r));
      // keep only the first n
      let to_keep;
      // don't need to keep more than what we have
      to_keep = Math.min(available_circles.length, this.auto_to_keep);
      available_circles = available_circles.slice(0, to_keep);

      for (let i = 0; i < Math.min(iterations, available_circles.length); i++) {
         let random_index, circles_index;
          random_index = random(0, available_circles.length - 1, true);
          //console.log(random_index, available_circles.length)
          circles_index = this._circles.indexOf(available_circles[random_index]);
          if (circles_index === -1) {
            // this should not happen...
            continue;
          }
          this.splitCircle(circles_index);
          this.split_circles++;
        }
      }

    // all the circles are small!
    if (all_min_size && !this.ended) {
      // the sketch has ended
      this._ended = true;
      console.log("ended");
    }
  }

  captureFrame() {
    capturer.capture(this.canvas);
  }

  getPixel(x, y) {
    let index, pixel;
    index = y * this._source_width * 4 + x * 4;
    pixel = [];
    for (let i = 0; i < 4; i++) {
      pixel.push(this._pixels[index+i]);
    }
    return pixel;
  }

  averageColor(x0, y0, width, height) {
    // make all parameters integer
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    width = Math.round(width);
    height = Math.round(height);
    // current rectangle size
    let rect_size;
    rect_size = width * height;
    // sum of all pixels in circle, current pixel
    let rect_pixels, current_pixel;
    // only r, g, b (discard alpha)
    rect_pixels = [0, 0, 0];

    for (let x = x0; x < x0 + width; x++) {
      for (let y = y0; y < y0 + height; y++) {
        current_pixel = this.getPixel(x, y);
        for (let j = 0; j < rect_pixels.length; j++) {
          rect_pixels[j] += current_pixel[j];
        }
      }
    }
    // average color
    let average_color;
    average_color = rect_pixels.map(x => x / rect_size);
    return average_color;
  }

  averageSource() {
    return this.averageColor(0, 0, this._source_width, this._source_height);
  }

  get pixels() {
    return this._pixels;
  }

  set pixels(pixels) {
    this._pixels = pixels;
  }

  get ended() {
    return this._ended;
  }

  set ended(bool) {
    this._ended = bool;
  }
}
