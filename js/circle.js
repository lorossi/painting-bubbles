/* jshint esversion: 8 */

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

    if (mobile) {
      this.min_radius = 2;
    } else {
      this.min_radius = 4;
    }

    // check if the circle is already of the minimum size
    this._min_size = this.r < this.min_radius;
    // the circle's age is 0
    this._age_count = 0;

    if (this._r < 10) {
      this._split_age = 2;
    } else {
      this._split_age = 4;
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
      this._split_age = 0;
      this._age_count = 0;
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

  get min_size() {
    return this._min_size;
  }

  get old_enough() {
    this._age_count++;
    return this._age_count >= this._split_age;
  }

}
