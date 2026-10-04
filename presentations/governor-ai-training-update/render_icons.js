// Render Phosphor icons (react-icons/pi) to transparent PNGs in a given colour.
// usage: node render_icons.js '<json array of {name, color, out, size?}>'
const path = require("path");
const mod = (m) => require(path.join(process.env.ICON_NODE_MODULES, m));
const React = mod("react");
const { renderToStaticMarkup } = mod("react-dom/server");
const sharp = mod("sharp");
const icons = mod("react-icons/pi");

(async () => {
  const jobs = JSON.parse(process.argv[2]);
  for (const j of jobs) {
    const Cmp = icons[j.name];
    if (!Cmp) { console.error("MISSING ICON " + j.name); process.exitCode = 2; continue; }
    const size = j.size || 512;
    const svg = renderToStaticMarkup(
      React.createElement(Cmp, { color: "#" + j.color, size })
    );
    await sharp(Buffer.from(svg)).png().toFile(j.out);
  }
})();
