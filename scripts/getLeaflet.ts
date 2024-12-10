// import { parseArgs } from "jsr:@std/cli@1.0.6/parse-args";
import { ZipReaderStream } from "jsr:@zip-js/zip-js@2.7.52";
import { resolve } from "jsr:@std/path@1.0.6";
import { ensureDir, ensureFile } from "jsr:@std/fs@1.0.4";

const leafletPackage = 'https://leafletjs-cdn.s3.amazonaws.com/content/leaflet/v1.9.4/leaflet.zip'

async function downloadLeaflet(destination = "src/assets/vendor/leaflet") {
    const response = await fetch(leafletPackage);

    // Create a ZipReaderStream to extract the file
    const zipStream = response.body!.pipeThrough(new ZipReaderStream());

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

async function main() {
    await downloadLeaflet();
}
  
if (import.meta.main) await main();