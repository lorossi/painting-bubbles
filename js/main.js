/* jshint esversion: 8 */

class Rect {
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

    this._just_split = true;
    this._age_count = 0;
    // how many times you have to move the mouse on the screen before the rect gets popped
    if (this.width > 200) {
      this._split_age = 20;
    } else if (this.width > 50) {
        this._split_age = 10;
    } else if (this.width > 5) {
        this._split_age = 5;
      }
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

}


class Sketch {
  constructor(canvas, context) {
    this.canvas = canvas;
    this.ctx = context;
    this.width = canvas.width;
    this.height = canvas.height;

    this.mouse_x = 0;
    this.mouse_y = 0;
    this.min_size = 10;

    // pixels container
    this._pixels = [];
    // rects container
    this._rects = [];

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

  clicked(x, y) {
    if (x === this.mouse_x && y === this.mouse_y) {
      return;
    }
    this.mouse_x = x;
    this.mouse_y = y;

    let found, pos, i, just_split;

    found = false;
    for (i = 0; i < this._rects.length; i++) {
      pos = this._rects[i].pos;
      if (x >= pos.x && y >= pos.y && x <= pos.x + pos.width && y <= pos.y + pos.height && pos.width > this.min_size) {
        just_split = this._rects[i].just_split;
        if (just_split) {
          this._rects[i].just_split = false;
          break;
        }
        found = true;
        break;
      }
    }

    if (found) {
      // at least one has been found
      let split_direction, next_split_direction;
      split_direction = this._rects[i].split_direction;
      if (split_direction === "horizontal") {
        next_split_direction = "vertical";
      } else if (split_direction === "vertical"){
        next_split_direction = "horizontal";
      }

      // remove old rect
      this._rects.splice(i, 1);

      // new position and size
      let nx, ny, nwidth, nheight;
      for (i = 0; i < 2; i++) {
        if (split_direction === "horizontal") {
          nx = pos.x;
          ny = Math.floor(pos.y + pos.height / 2 * i);
          nwidth = pos.width;
          nheight = Math.floor(pos.height / 2);
        }  else if (split_direction === "vertical"){
          nx =  Math.floor(pos.x + pos.width / 2 * i);
          ny = pos.y;
          nwidth = Math.floor(pos.width / 2);
          nheight = pos.height;
        }
        let average_color = this.averageColor(nx, ny, nwidth, nheight, true);
        let new_rect = new Rect(nx, ny, nwidth, nheight, average_color, next_split_direction);
        this._rects.push(new_rect);
      }
    }
  }

  setup() {
    this.background = getCssProperty("--background-color");
  }

  draw() {
    // if rect is empty, it's time to generate a new rect
    if (this._rects.length === 0) {
      let average_color = this.averageColor(0, 0, this.width, this.height);
      let new_rect = new Rect(0, 0, this.width, this.height, average_color);
      this._rects.push(new_rect);
      this.background = new_rect.color;
    }

    this.ctx.save();

    // reset canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    // set background
    this.ctx.fillStyle = this.background;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // draw rects
    this._rects.forEach((r, i) => {
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

  get_pixel(x, y) {
    let index, pixel;
    index = y * this.width * 4 + x * 4;
    pixel = [];
    for (let i = 0; i < 4; i++) {
      pixel.push(this._pixels[index+i]);
    }
    return pixel;
  }

  averageColor(x0, y0, width, height, show_all) {
    // current rectangle size
    let rect_size;
    rect_size = width * height;
    // sum of all pixels in rect, current pixel
    let rect_pixels, current_pixel;
    // only r, g, b (discard alpha)
    rect_pixels = [0, 0, 0];

    for (let x = x0; x < x0 + width; x++) {
      for (let y = y0; y < y0 + height; y++) {
        current_pixel = this.get_pixel(x, y);
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
      $("canvas#hidden").prop({"width": canvas_size, "height": canvas_size});
      // load (hidden) canvas
      canvas = document.getElementById("hidden");

      // displacement values to center the image
      let dx, dy;
      dx = (canvas.width - image_width * scl) / 2;
      dy = (canvas.height - image_height * scl) / 2;

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
        ctx.drawImage(img, 0, 0, image_width, image_height, dx, dy, image_width * scl, image_height * scl);
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

  // resize canvas
  $(`canvas#${sketch_id}`).prop({
    "width": canvas_size,
    "height": canvas_size
  });

  let pixels;
  pixels = await load_pixels(img_path, canvas_size);
  console.log(pixels)

  let canvas, ctx;
  canvas = document.getElementById(sketch_id);
  if (canvas.getContext) {
    ctx = canvas.getContext("2d", {alpha: false});
    sketch = new Sketch(canvas, ctx);
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
      sketch.clicked(e.offsetX, e.offsetY);
    }
  }
});
