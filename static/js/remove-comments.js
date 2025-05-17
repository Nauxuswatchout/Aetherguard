const fs = require("fs");
const strip = require("strip-comments");

const inputPath = "regular_event_handler.js";
const outputPath = "clean.js";

const code = fs.readFileSync(inputPath, "utf8");
const stripped = strip(code);
fs.writeFileSync(outputPath, stripped);

console.log("注释已清理，输出到 clean.js");
