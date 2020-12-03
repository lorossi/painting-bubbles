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

function getCssProperty(property) {
  let css_property = $(":root").css(property);
  return css_property.split(" ").join("");
}

function setCssProperty(property, value) {
  let css_property = $(":root").css(property, value);
}

function random(min, max, int) {
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
}
