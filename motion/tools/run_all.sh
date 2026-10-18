#!/bin/bash
# Build -> render frames (4 browsers) -> encode -> mux the audio mix when present.
set -e; cd "$(dirname "$0")/.."
bash tools/install_fonts.sh
python3 tools/build.py
rm -rf build/frames; mkdir -p build/frames
for w in 0 1 2 3; do node tools/render_frames.js $w 4 & done; wait
ffmpeg -y -loglevel error -framerate 30 -i build/frames/f_%05d.jpg -c:v libx264 -preset slow -crf 22 -maxrate 9M -bufsize 18M -pix_fmt yuv420p -profile:v high -movflags +faststart release/silent.mp4
if [ -f audio/out/mix.m4a ]; then
  ffmpeg -y -loglevel error -i release/silent.mp4 -i audio/out/mix.m4a -c:v copy -c:a copy -shortest -movflags +faststart release/balighu-motion.mp4
  echo "final with audio: release/balighu-motion.mp4"
else
  cp release/silent.mp4 release/balighu-motion.mp4; echo "no audio mix found, silent video: release/balighu-motion.mp4"
fi
