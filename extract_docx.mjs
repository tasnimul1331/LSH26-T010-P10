import fs from 'fs';
import zlib from 'zlib';

// A simple zip extractor in pure node without external dependencies
// PKZip format: Local file header signature = 0x04034b50
const buf = fs.readFileSync('P10_Prepaid_Meter_Recharge_Advisor_PRD.docx');

let offset = 0;
while (offset < buf.length - 4) {
  if (buf.readUInt32LE(offset) === 0x04034b50) {
    const versionNeeded = buf.readUInt16LE(offset + 4);
    const flags = buf.readUInt16LE(offset + 6);
    const compression = buf.readUInt16LE(offset + 8);
    const modTime = buf.readUInt16LE(offset + 10);
    const modDate = buf.readUInt16LE(offset + 12);
    const crc32 = buf.readUInt32LE(offset + 14);
    const compSize = buf.readUInt32LE(offset + 18);
    const uncompSize = buf.readUInt32LE(offset + 22);
    const nameLen = buf.readUInt16LE(offset + 26);
    const extraLen = buf.readUInt16LE(offset + 28);
    
    const fileName = buf.toString('utf8', offset + 30, offset + 30 + nameLen);
    const dataStart = offset + 30 + nameLen + extraLen;
    const dataEnd = dataStart + compSize;
    
    if (fileName === 'word/document.xml') {
      const compressedData = buf.subarray(dataStart, dataEnd);
      let xmlStr = '';
      if (compression === 8) {
        xmlStr = zlib.inflateRawSync(compressedData).toString('utf8');
      } else {
        xmlStr = compressedData.toString('utf8');
      }
      
      // Extract text content from XML
      // Replace XML tags with spaces/newlines
      const text = xmlStr
        .replace(/<w:p[^>]*>/g, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'");
      
      fs.writeFileSync('PRD_EXTRACTED.md', text);
      console.log('Successfully extracted PRD text, length:', text.length);
      break;
    }
    offset += 30 + nameLen + extraLen + compSize;
  } else {
    offset++;
  }
}
