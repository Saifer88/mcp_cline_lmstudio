import { readFile } from "fs/promises";
import { resolve } from "path";
import pdf from "pdf-parse";

export async function readPdf(source: string): Promise<string> {
  let buffer: Buffer;

  if (source.startsWith("http://") || source.startsWith("https://")) {
    // Download PDF from URL
    const response = await fetch(source, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "application/pdf,*/*",
      },
      redirect: "follow",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    buffer = Buffer.from(await response.arrayBuffer());
  } else {
    // Read local file
    const filePath = resolve(source);
    buffer = await readFile(filePath);
  }

  const data = await pdf(buffer);

  let result = "";
  result += `Pages: ${data.numpages}\n`;
  result += `---\n\n`;
  result += data.text;

  return result;
}
