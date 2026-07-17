import { writeFile, mkdir } from "fs/promises";
import { dirname, isAbsolute } from "path";

export async function downloadImage(
  url: string,
  savePath: string
): Promise<string> {
  if (!isAbsolute(savePath)) {
    throw new Error(
      `savePath must be an absolute path (e.g. /Users/you/project/images/photo.png or C:\\Users\\you\\project\\images\\photo.png). Received relative path: "${savePath}"`
    );
  }

  const resolvedPath = savePath;

  // Ensure the directory exists
  const dir = dirname(resolvedPath);
  await mkdir(dir, { recursive: true });

  // Download the image
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "image/*,*/*;q=0.8",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const contentType = response.headers.get("content-type") || "";
  if (
    !contentType.includes("image/") &&
    !contentType.includes("application/octet-stream")
  ) {
    throw new Error(
      `URL does not appear to be an image. Content-Type: ${contentType}`
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(resolvedPath, buffer);

  const sizeMB = (buffer.length / (1024 * 1024)).toFixed(2);

  return `Image downloaded successfully!\n- Saved to: ${resolvedPath}\n- Size: ${sizeMB} MB\n- Content-Type: ${contentType}`;
}
