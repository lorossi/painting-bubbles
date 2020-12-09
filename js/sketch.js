/* jshint esversion: 8 */

class Sketch {
  constructor(canvas, context, fps) {
    this.canvas = canvas;
    this.ctx = context;
    this.width = canvas.width;
    this.height = canvas.height;

    this.fps = fps || 60;
    this.fps_interval = 1000 / this.fps;

    // amout of split circles
    this._split_circles = 0;
    // pixels container
    this._pixels = [];
    // rects container
    this._circles = [];
    // when this is true, all circles are of minimal size
    this._ended = false;
    // add some border while recording
    this.record_border = 0.9;

    // save canvas in memory (currently unused, might delete later)
    this.savedData = new Image();

    // event listener
    document.addEventListener('mousemove', this.mouseMoved.bind(this), false);
    document.addEventListener('touchstart', this.touchMoved.bind(this), false);
    document.addEventListener('touchmove', this.touchMoved.bind(this), false);

    this.hint_container_class = "hint";
    // hint timeout
    if (!recording) {
      self.hint_timeout = setTimeout(() => {
        let hint_div;
        if (mobile) {
          hint_div = $(`<div class='${this.hint_container_class}'><p>Tap here...</p></div>`);
        } else {
          hint_div = $(`<div class='${this.hint_container_class}'><p>Move your mouse here...</p></div>`);
        }

        $("body").append(hint_div);
        $(hint_div).hide().fadeIn(1000);
      }, 2000);
    }
  }

  run() {
    // run once
    this.setup();
    // anti alias
    this.ctx.imageSmoothingQuality = "high";
    // run often
    this.draw();
  }

  reset() {
    // reset circles array
    this._circles = [];
    // reset ended status
    this._ended = false;
    // reset split circles
    this._split_circles = 0;
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
    if (recording) return;

    let mouse_coords;
    mouse_coords = get_mouse_pos(this.canvas, e);
    this.searchCircle(mouse_coords.x, mouse_coords.y);
  }

  touchMoved(e) {
    if (recording) return;

    let touch_coords;
    touch_coords = get_touch_pos(this.canvas, e);
    this.searchCircle(touch_coords.x, touch_coords.y);
  }

  searchCircle(x, y) {
    if (x < 0 || x > this.width || y < 0 || y > this.height) return;

    let found, pos, i;
    found = false;
    for (i = 0; i < this._circles.length; i++) {
      pos = this._circles[i].pos;
      if (x >= pos.x && y >= pos.y && x <= pos.x + pos.width && y <= pos.y + pos.height && !this._circles[i].min_size) {
        if (this._circles[i].old_enough) {
          found = true;
          break;
        }
      }
    }

    if (found) {
      // at least one has been found
      this.splitCircle(i);
      window.requestAnimationFrame(this.draw.bind(this));
    }
  }

  splitCircle(index) {
    // remove hint timeout (if set)
    if (self.hint_timeout) {
      clearTimeout(self.hint_timeout);
    }

    // check if hint has already been displayed
    if ($(`.${this.hint_container_class}`).length > 0) {
      // if so, fade it out
      $(`.${this.hint_container_class}`).fadeOut(500);
    }

    // determine next split direction
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
      let average_color = this.averageColor(nx, ny, nwidth, nheight, true);
      let new_circle = new Circle(nx, ny, nwidth, nheight, average_color, next_split_direction);
      this._circles.push(new_circle);
    }
  }

  getPixel(x, y) {
    let index, pixel;
    index = y * this.width * 4 + x * 4;
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
    return this.averageColor(0, 0, this.width, this.height);
  }

  setup() {
    // load background
    this.background = get_css_property("--background-color");
    if (capturer) {
      // start capturer
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

    if (!this._ended && (this._circles.length == 1 || recording || auto)) {
      // load the next frame
      window.requestAnimationFrame(this.draw.bind(this));
    } else if (this._ended && recording) {
        // if in auto or recording, load another image
        // if recording, stop and save
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
      let new_circle = new Circle(0, 0, this.width, this.height , average_color);
      this._circles.push(new_circle);
      // the background color is now the color of the rect, not only for canvas but for the whole page
      this.background = new_circle.color;
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

    // recording scale
    if (recording) {
      this.ctx.translate(this.width / 2, this.height / 2);
      this.ctx.scale(  this.record_border, this.record_border);
      this.ctx.translate(- this.width / 2, - this.height / 2);
    }
    // if this is true, all circles cannot become smaller
    let all_min_size = true;
    // draw rects
    // shadow
    this.ctx.shadowColor = get_css_property("--shadow-color");
    this._circles.forEach((c, i) => {
      let circle_pos;
      circle_pos = c.pos;

      if (this._circles.length === 1) {
        this.ctx.shadowOffsetX = 5;
        this.ctx.shadowOffsetY = 5;
        this.ctx.shadowBlur = 15;
      } else if (c.pos.r > 25) {
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

      this.ctx.save();
      this.ctx.fillStyle = c.color;
      this.ctx.beginPath();
      this.ctx.arc(circle_pos.cx, circle_pos.cy, circle_pos.r, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.restore();

      if (all_min_size && !c.min_size) {
        all_min_size = false;
      }
    });

    // draw watermark
    if (recording && false) {
      let textsize = 24;
      let textwidth;
      this.ctx.save();
      this.ctx.fillStyle = "#0000007f";
      this.ctx.font = `${textsize}px AvenirRoman`;
      textwidth = this.ctx.measureText("Lorenzo Rossi").width;
      this.ctx.fillText('Lorenzo Rossi', textwidth * 0.25, 1.25 * textsize);
      textwidth = this.ctx.measureText("www.lorenzoros.si").width;
      this.ctx.fillText("www.lorenzoros.si", this.width - textwidth * 1.25, this.height - 0.25 * textsize);
      this.ctx.restore();
    }
    this.ctx.restore();

    // save frame if recording
    if (recording) {
      capturer.capture(this.canvas);
    }

    // if the sketch is in auto mode, pop a circle
    if ((auto || recording) && !all_min_size) {
      // circles big enough to be split
      let available_circles;
      available_circles = this._circles.filter(c => !c.min_size);
      available_circles = available_circles.sort((a, b) => (b.r - a.r));

      let iterations;
      if (this._split_circles < 16) {
        iterations = 2;
      } else if (this._split_circles < 250) {
        iterations = 4;
      } else if (this._split_circles < 1000) {
        iterations = 8;
      } else if (this._split_circles < 4000) {
        iterations = 16;
      } else if (this._split_circles < 8000) {
        iterations = 32;
      } else if (this._split_circles < 16000) {
        iterations = 64;
      } else {
        iterations = 256;
      }
      available_circles = available_circles.slice(0, iterations * 4);

      for (let i = 0; i < iterations; i++) {
         let random_index, circles_index;
          random_index = random(0, available_circles.length - 1, true);
          circles_index = this._circles.indexOf(available_circles[random_index]);
          if (circles_index === -1) {
            // this should not happen...
            continue;
          }
          this.splitCircle(circles_index);
          this._split_circles++;
        }
      }

    // all the circles are small!
    if (all_min_size && !this._ended) {
      // the sketch has ended
      this._ended = true;
    }
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
