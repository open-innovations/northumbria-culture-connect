import { parseArgs } from "jsr:@std/cli@1.0.6/parse-args";
import { ZipReaderStream } from "jsr:@zip-js/zip-js@2.7.52";
import { resolve } from "jsr:@std/path@1.0.6";
import { ensureDir, ensureFile } from "jsr:@std/fs@1.0.4";

async function downloadFont(key: string, destination = "src/assets/fonts") {
  // Available from https://fontsource.org/fonts/{key}
  // The download endpoint is undocumented! Warning!
  const response = await fetch(`https://api.fontsource.org/v1/download/${key}`);

  // Create a ZipReaderStream to extract the file
  const zipStream = response.body!.pipeThrough(new ZipReaderStream());

  // Iterate over every entry in the zip stream
  for await (const entry of zipStream) {
    // Work out the local file name
    const fullPath = resolve(destination, entry.filename);

    // Create directories if they need to exist
    if (entry.directory) {
      console.log(`Creating ${fullPath}...`);
      await ensureDir(fullPath);
      continue;
    }

    console.log(`Unpacking ${fullPath}...`);
    // Create the file...
    await ensureFile(fullPath);
    // ... and stream the contents of the zip file entry to it
    await entry.readable?.pipeTo((await Deno.create(fullPath)).writable);
  }
}

function main() {
  const args = parseArgs(Deno.args);
  args._.forEach(font => downloadFont(font.toString()));
}

if (import.meta.main) main()