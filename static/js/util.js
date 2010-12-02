function in_boundary(pos, box) {
    return pos[0] >= box[0] && // x1
           pos[1] >= box[1] && // y1
           pos[0] <= box[2] && // x2
           pos[1] <= box[3];   // y2
}

function bounding_square(pos, size) {
    /* Given pos [x1, y1] with size scalar,
 [x1, y1, x2: "   * Returns boundary", y2] */
    return [pos[0], pos[1]+size, pos[1], pos[1]+size];
}

function rotate(vector, angle) {
    // Rotate vector by angle (in radians)
    var x = vector[0], y = vector[1];
    var sin = Math.sin(angle), cos = Math.cos(angle);
    return [x * cos - y * sin, x * sin + y * cos];
}

function ctx_xy_to_rgb(ctx, xy) {
    var img=ctx.getImageData(xy[0],xy[1],1,1);
    return [img.data[0], img.data[1], img.data[2]];
}

// Stolen from Google Closure
KEY_CODES = {8: "BACKSPACE", 9: "TAB", 13: "ENTER", 16: "SHIFT", 17: "CTRL", 18: "ALT", 19: "PAUSE", 20: "CAPS_LOCK", 27: "ESC", 32: "SPACE", 33: "PAGE_UP", 34: "PAGE_DOWN", 35: "END", 36: "HOME", 37: "←", 38: "↑", 39: "→", 40: "↓", 44: "PRINT_SCREEN", 45: "INSERT", 46: "DELETE", 48: "ZERO", 49: "ONE", 50: "TWO", 51: "THREE", 52: "FOUR", 53: "FIVE", 54: "SIX", 55: "SEVEN", 56: "EIGHT", 57: "NINE", 63: "QUESTION_MARK", 65: "A", 66: "B", 67: "C", 68: "D", 69: "E", 70: "F", 71: "G", 72: "H", 73: "I", 74: "J", 75: "K", 76: "L", 77: "M", 78: "N", 79: "O", 80: "P", 81: "Q", 82: "R", 83: "S", 84: "T", 85: "U", 86: "V", 87: "W", 88: "X", 89: "Y", 90: "Z", 91: "META", 93: "CONTEXT_MENU", 96: "NUM_0", 97: "NUM_1", 98: "NUM_2", 99: "NUM_3", 100: "NUM_4", 101: "NUM_5", 102: "NUM_6", 103: "NUM_7", 104: "NUM_8", 105: "NUM_9", 106: "NUM_*", 107: "NUM_+", 109: "NUM_-", 110: "NUM_PERIOD", 111: "NUM_DIVISION", 112: "F1", 113: "F2", 114: "F3", 115: "F4", 116: "F5", 117: "F6", 118: "F7", 119: "F8", 120: "F9", 121: "F10", 122: "F11", 123: "F12", 144: "NUMLOCK", 186: ":", 189: "-", 187: "=", 188: ",", 190: ".", 191: "/", 192: "APOSTROPHE", 222: "'", 219: "[", 220: "\\", 221: "]", 224: "WIN_KEY"}; 
