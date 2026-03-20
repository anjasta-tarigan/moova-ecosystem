const sharp = require("sharp");

const sizes = [16, 32, 48, 64, 96, 128, 192, 256, 512];
const src = "assets/images/brand.png";

(async () => {
  for (const size of sizes) {
    try {
      await sharp(src)
        .resize(size, size, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(`public/favicon-${size}x${size}.png`);
      console.log(`Generated: ${size}x${size}`);
    } catch (err) {
      console.error(`Error generating ${size}x${size}:`, err.message);
    }
  }

  try {
    await sharp(src)
      .resize(180, 180, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile("public/apple-touch-icon.png");
    console.log("Generated: apple-touch-icon 180x180");
  } catch (err) {
    console.error("Error generating apple-touch-icon:", err.message);
  }
})();
