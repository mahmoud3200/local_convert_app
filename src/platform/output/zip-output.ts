import type { DownloadableOutput } from "./types";

interface ZipEntry {
  name: string;
  bytes: Uint8Array;
}

const textEncoder = new TextEncoder();
const crcTable = buildCrcTable();

export async function createZipBlob(outputs: DownloadableOutput[]) {
  const entries = await Promise.all(
    outputs.map(async (output) => {
      if (!output.blob) {
        throw new Error(`Converted output is not available in memory: ${output.fileName}`);
      }

      return {
        name: output.fileName,
        bytes: new Uint8Array(await output.blob.arrayBuffer()),
      };
    }),
  );

  return new Blob([buildZip(entries)], { type: "application/zip" });
}

function buildZip(entries: ZipEntry[]) {
  const chunks: Uint8Array[] = [];
  const centralDirectoryChunks: Uint8Array[] = [];
  const usedNames = new Set<string>();
  let offset = 0;

  for (const entry of entries) {
    const fileName = getUniqueZipName(entry.name, usedNames);
    const nameBytes = textEncoder.encode(fileName);
    const crc = crc32(entry.bytes);
    const localHeader = createLocalFileHeader(nameBytes, entry.bytes, crc);

    chunks.push(localHeader, entry.bytes);
    centralDirectoryChunks.push(
      createCentralDirectoryHeader(nameBytes, entry.bytes, crc, offset),
    );
    offset += localHeader.length + entry.bytes.length;
  }

  const centralDirectoryOffset = offset;
  const centralDirectorySize = centralDirectoryChunks.reduce(
    (size, chunk) => size + chunk.length,
    0,
  );
  const endRecord = createEndOfCentralDirectoryRecord(
    entries.length,
    centralDirectorySize,
    centralDirectoryOffset,
  );

  return concatUint8Arrays([...chunks, ...centralDirectoryChunks, endRecord]);
}

function createLocalFileHeader(
  nameBytes: Uint8Array,
  bytes: Uint8Array,
  crc: number,
) {
  const header = new Uint8Array(30 + nameBytes.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x04034b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint32(14, crc, true);
  view.setUint32(18, bytes.length, true);
  view.setUint32(22, bytes.length, true);
  view.setUint16(26, nameBytes.length, true);
  view.setUint16(28, 0, true);
  header.set(nameBytes, 30);

  return header;
}

function createCentralDirectoryHeader(
  nameBytes: Uint8Array,
  bytes: Uint8Array,
  crc: number,
  localHeaderOffset: number,
) {
  const header = new Uint8Array(46 + nameBytes.length);
  const view = new DataView(header.buffer);

  view.setUint32(0, 0x02014b50, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, 0, true);
  view.setUint16(14, 0, true);
  view.setUint32(16, crc, true);
  view.setUint32(20, bytes.length, true);
  view.setUint32(24, bytes.length, true);
  view.setUint16(28, nameBytes.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, localHeaderOffset, true);
  header.set(nameBytes, 46);

  return header;
}

function createEndOfCentralDirectoryRecord(
  entryCount: number,
  centralDirectorySize: number,
  centralDirectoryOffset: number,
) {
  const record = new Uint8Array(22);
  const view = new DataView(record.buffer);

  view.setUint32(0, 0x06054b50, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, entryCount, true);
  view.setUint16(10, entryCount, true);
  view.setUint32(12, centralDirectorySize, true);
  view.setUint32(16, centralDirectoryOffset, true);
  view.setUint16(20, 0, true);

  return record;
}

function getUniqueZipName(fileName: string, usedNames: Set<string>) {
  const safeName = sanitizeZipName(fileName);
  const dotIndex = safeName.lastIndexOf(".");
  const stem = dotIndex > 0 ? safeName.slice(0, dotIndex) : safeName;
  const extension = dotIndex > 0 ? safeName.slice(dotIndex) : "";
  let candidate = safeName;
  let index = 2;

  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${stem} (${index})${extension}`;
    index += 1;
  }

  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function sanitizeZipName(fileName: string) {
  const sanitized = fileName
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();

  return sanitized || "converted-file";
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ byte) & 0xff];
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function buildCrcTable() {
  const table = new Uint32Array(256);

  for (let index = 0; index < table.length; index += 1) {
    let value = index;

    for (let bit = 0; bit < 8; bit += 1) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }

    table[index] = value >>> 0;
  }

  return table;
}

function concatUint8Arrays(chunks: Uint8Array[]) {
  const totalLength = chunks.reduce((length, chunk) => length + chunk.length, 0);
  const output = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }

  return output;
}
