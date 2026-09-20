import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Dimensioni reali di un'immagine di `public/`, lette dall'intestazione del file.
 *
 * Perché esiste: senza `og:image:width` e `og:image:height` il client che mostra l'anteprima di un
 * link (Discord, dove sta il nostro pubblico) deve scaricare l'immagine per sapere come impaginarla,
 * e nell'attesa mostra un riquadro piccolo o niente. Le copertine però non hanno tutte la stessa
 * misura (1600×900, 1600×1042, 1200×675, le carte sono verticali e alte in modo diverso), quindi
 * una costante scritta a mano direbbe il falso su metà delle pagine: qui il numero si legge dal file.
 *
 * Si usa solo nelle pagine statiche (guide, carte): la lettura avviene durante la build, dove
 * `public/` esiste. Le pagine dinamiche passano la misura a mano, perché in produzione la funzione
 * serverless non ha `public/` nel suo filesystem. Se il file non si legge, torna `undefined` e i
 * metadati restano quelli di prima: nessuna pagina si rompe per un'immagine mancante.
 */

type Size = { width: number; height: number };

const cache = new Map<string, Size | undefined>();

function readSize(publicPath: string): Size | undefined {
  const file = join(process.cwd(), "public", publicPath.replace(/^\//, ""));
  const b = readFileSync(file);

  // WebP: RIFF....WEBP + un blocco VP8X (esteso), VP8 (lossy) o VP8L (lossless).
  if (b.length > 30 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") {
    const kind = b.toString("ascii", 12, 16);
    if (kind === "VP8X") return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    if (kind === "VP8 ") return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (kind === "VP8L") {
      const n = b.readUInt32LE(21);
      return { width: (n & 0x3fff) + 1, height: ((n >> 14) & 0x3fff) + 1 };
    }
  }

  // JPEG: si cerca il marcatore SOF, che porta altezza e larghezza.
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length - 9) {
      if (b[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
      }
      i += 2 + b.readUInt16BE(i + 2);
    }
  }

  // PNG: larghezza e altezza stanno nel blocco IHDR, subito dopo la firma.
  if (b.length > 24 && b.toString("ascii", 1, 4) === "PNG") {
    return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  }

  return undefined;
}

export function imageSizeOf(publicPath: string | undefined): Size | undefined {
  if (!publicPath || !publicPath.startsWith("/")) return undefined;
  if (cache.has(publicPath)) return cache.get(publicPath);
  let size: Size | undefined;
  try {
    size = readSize(publicPath);
  } catch {
    size = undefined;
  }
  cache.set(publicPath, size);
  return size;
}
