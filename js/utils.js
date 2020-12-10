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
  let css_property = getComputedStyle(document.documentElement).getPropertyValue(property);
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
  document.documentElement.style.setProperty(property, value);
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

let get_mouse_pos = (element, e, dx, dy) => {
  dx = dx || 0;
  dy = dy || 0;
  let rect = element.getBoundingClientRect();
  return {
    x: e.clientX - rect.left - dx,
    y: e.clientY - rect.top - dy
  };
};

let get_touch_pos = (element, e, dx, dy) => {
  dx = dx || 0;
  dy = dy || 0;
  let rect = element.getBoundingClientRect();
  return {
    x: e.targetTouches[0].clientX - rect.left - dx,
    y: e.targetTouches[0].clientY - rect.top - dy
  };
};

let constrain = (val, min, max) => {
  if (val < min) {
    val = min;
  } else if (val > max) {
    val = max;
  }

  return val;
};

let shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

let get_base_log = (x, y) => {
  return Math.log(y) / Math.log(x);
};
