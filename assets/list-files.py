import json
import os
import random

# this scripts generate the list of paintings in the form of a js constant
# run this and copy the output in main.js
# this is needed because js can't access root tree and I won't write each
# filename inside the script

images = os.listdir("paintings/")
js_variable = f"const names = {json.dumps(images)};"
print('const dir = "assets/paintings/";')
print(js_variable)
print()
