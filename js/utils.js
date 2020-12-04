/* jshint esversion: 6 */

let get_xy_from_index = (index, width) => {
  return {
    "x": index % width,
    "y": Math.round(index / width)
  };
};

let get_index_from_xy = (x, y, width) => {
  return x + width * y;
};

let get_css_property = (property) => {
  let css_property = $(":root").css(property);
  css_property = css_property.split(" ").join("");

  if (css_property === "true") {
    return true;
  } else if (css_property === "false") {
    return false;
  }

  if (parseInt(css_property) == css_property) {
    // property is int
    return parseInt(css_property);
  } else if (parseFloat(css_property) == css_property) {
    // property is float
    return parseFloat(css_property);
  }

  return css_property;
};

let set_css_property = (property, value) => {
  let css_property = $(":root").css(property, value);
};

let random = (min, max, int) => {
    if (max == null && min != null) {
      max = min;
      min = 0;
    } else if (min == null && max == null) {
      min = 0;
      max = 1;
    }

   let random_num = Math.random() * (max - min) + min;

   // return an integer value
   if (int) {
     return Math.round(random_num);
   }

   return random_num;
};

let get_mouse_pos = (canvas, e) => {
    let rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
};

let get_touch_pos = (canvas, e) => {
  let rect = canvas.getBoundingClientRect();
  return {
    x: e.targetTouches[0].clientX - rect.left,
    y: e.targetTouches[0].clientY - rect.top
  };
};
