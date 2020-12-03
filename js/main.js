/* jshint esversion: 8 */

class Circle {
  constructor(x, y, width, height, color, split_direction) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.cx = this.x + this.width / 2; // center x coord
    this.cy = this.y + this.height / 2; // center x coord
    this.r = Math.min(this.width, this.height) / 2; // radius
    this._color = color;
    this._split_direction = split_direction || "horizontal";

    this.min_radius = 5;
    this._min_size = this.r > this.min_radius;

    this._just_split = true;
    this._age_count = 0;
    // how many times you have to move the mouse on the screen before the circle gets popped
    this._split_age = this.r * .75;
}

  get pos() {
    return {
      "x": this.x,
      "y": this.y,
      "cx": this.cx,
      "cy": this.cy,
      "r": this.r,
      "width": this.width,
      "height": this.height
    };
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

  get just_split() {
    return this._just_split;
  }

  set just_split(bool) {
    if (this._age_count > this._split_age) {
      this._just_split = bool;
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
  constructor(canvas, context, source_width, source_height) {
    this.canvas = canvas;
    this.ctx = context;
    this.width = canvas.width;
    this.height = canvas.height;
    this._source_width = source_width;
    this._source_height = source_height;

    this.mouse_x = 0;
    this.mouse_y = 0;

    // pixels container
    this._pixels = [];
    // rects container
    this._circles = [];

    // displacement
    this.dx = Math.floor((this.width - this._source_width) / 2);
    this.dy = Math.floor((this.height - this._source_height) / 2);

    // save canvas in memory
    this.savedData = new Image();
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

  splitCircle(x, y) {
    if (x === this.mouse_x && y === this.mouse_y) {
      return;
    }
    this.mouse_x = x;
    this.mouse_y = y;

    let found, pos, i, just_split;

    found = false;
    for (i = 0; i < this._circles.length; i++) {
      pos = this._circles[i].pos;
      if (x >= pos.x && y >= pos.y && x <= pos.x + pos.width && y <= pos.y + pos.height && !pos.min_size) {
        just_split = this._circles[i].just_split;
        if (just_split) {
          this._circles[i].just_split = false;
          break;
        }
        found = true;
        break;
      }
    }

    if (found) {
      // at least one has been found
      let split_direction, next_split_direction;
      split_direction = this._circles[i].split_direction;
      if (split_direction === "horizontal") {
        next_split_direction = "vertical";
      } else if (split_direction === "vertical"){
        next_split_direction = "horizontal";
      }

      // remove old circle
      this._circles.splice(i, 1);

      // new position and size
      let nx, ny, nwidth, nheight;
      for (i = 0; i < 2; i++) {
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
        let new_rect = new Circle(nx, ny, nwidth, nheight, average_color, next_split_direction);
        this._circles.push(new_rect);
      }
    }
  }

  setup() {
    this.background = getCssProperty("--background-color");
  }

  draw() {
    // if circle is empty, it's time to generate a new circle
    if (this._circles.length === 0) {
      let average_color = this.averageSource();
      let new_rect = new Circle(this.dx, this.dy, this.width - this.dx * 2, this.height - this.dy * 2, average_color);
      this._circles.push(new_rect);
      this.background = new_rect.color;
      setCssProperty("--background-color", this.background);
    }

    this.ctx.save();

    // reset canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // set background
    this.ctx.fillStyle = this.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // draw rects
    this._circles.forEach((r, i) => {
      let rect_pos;
      rect_pos = r.pos;
      this.ctx.fillStyle = r.color;
      //this.ctx.fillRect(rect_pos.x, rect_pos.y, rect_pos.width, rect_pos.height)
      this.ctx.beginPath();
      this.ctx.arc(rect_pos.cx, rect_pos.cy, rect_pos.r, 0, 2 * Math.PI);
      this.ctx.fill();
    });


    this.ctx.restore();
    window.requestAnimationFrame(this.draw.bind(this));
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
}

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
        ctx.fillStyle = getCssProperty("--background-color");
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


let sketch, sketch_id;

let main = async () => {
  let canvas_size, img_path;
  canvas_size = 900;
  img_path = "/assets/paintings/gioconda.jpg";

  let pixels;
  pixels = await load_pixels(img_path, canvas_size);

  // resize canvas
  $(`canvas#${sketch_id}`).prop({
    "width": canvas_size,
    "height": canvas_size,
  });

  let canvas, ctx;
  canvas = document.getElementById(sketch_id);
  if (canvas.getContext) {
    ctx = canvas.getContext("2d", {alpha: false});
    sketch = new Sketch(canvas, ctx, pixels.width, pixels.height);
    sketch.pixels = pixels.data;
    sketch.run();
  }
};


$(document).ready(() => {
  sketch_id = "sketch";
  main();
});

$(window).resize(() => {
  if (sketch) {
    sketch.resized();
  }
});

$(document).mousemove((e) => {
  if (e.target.id === sketch_id) {
    if (sketch) {
      sketch.splitCircle(e.offsetX, e.offsetY);
    }
  }
});
