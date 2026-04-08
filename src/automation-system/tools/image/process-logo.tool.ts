import sharp from "sharp";
import axios from "axios";

export interface ProcessLogoInput {
  imageSource: string | Buffer; // URL or Buffer
  targetWidth?: number;
}

export async function processLogoTool(input: ProcessLogoInput): Promise<Buffer> {
  let buffer: Buffer;

  if (typeof input.imageSource === "string" && input.imageSource.startsWith("http")) {
    const response = await axios.get(input.imageSource, { responseType: "arraybuffer" });
    buffer = Buffer.from(response.data);
  } else if (Buffer.isBuffer(input.imageSource)) {
    buffer = input.imageSource;
  } else {
    throw new Error("Invalid image source");
  }

  const image = sharp(buffer);
  
  // 1. Ensure alpha channel exists, trim empty space, and get raw pixels
  const { data, info } = await image
    .ensureAlpha()
    .trim()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha > 10) { // If pixel is semi-opaque
      data[i] = 255;     // R
      data[i + 1] = 255; // G
      data[i + 2] = 255; // B
    }
  }

  // 3. Convert back to PNG buffer
  let finalImage = sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  }).png();

  if (input.targetWidth) {
    finalImage = finalImage.resize(input.targetWidth);
  }

  return await finalImage.toBuffer();
}
