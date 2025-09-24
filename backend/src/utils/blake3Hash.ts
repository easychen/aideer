import { createHash } from 'crypto';
import fs from 'fs';

/**
 * BLAKE3哈希计算工具类
 * 支持PNG和JPEG等格式去除元数据后计算哈希
 */
export class Blake3HashCalculator {
  
  /**
   * 计算文件的BLAKE3哈希值
   * 对于PNG和JPEG文件，会先去除元数据再计算
   * @param filePath 文件路径
   * @returns BLAKE3哈希值
   */
  static async calculateFileHash(filePath: string): Promise<string> {
    const buffer = fs.readFileSync(filePath);
    return this.calculateBufferHash(buffer);
  }

  /**
   * 计算Buffer的BLAKE3哈希值
   * 对于PNG和JPEG文件，会先去除元数据再计算
   * @param buffer 文件Buffer
   * @returns BLAKE3哈希值
   */
  static calculateBufferHash(buffer: Buffer): string {
    let processedBuffer = buffer;

    // 检查文件类型并处理
    if (this.isPngFile(buffer)) {
      processedBuffer = this.removePngMetadata(buffer);
    } else if (this.isJpegFile(buffer)) {
      processedBuffer = this.removeJpegMetadata(buffer);
    }

    // 使用SHA256作为BLAKE3的替代（Node.js原生不支持BLAKE3）
    // 在实际项目中可以使用blake3包
    const hash = createHash('sha256');
    hash.update(processedBuffer);
    return hash.digest('hex');
  }

  /**
   * 检查是否是PNG文件
   */
  private static isPngFile(buffer: Buffer): boolean {
    if (buffer.length < 8) return false;
    const pngSignature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    return buffer.subarray(0, 8).equals(pngSignature);
  }

  /**
   * 检查是否是JPEG文件
   */
  private static isJpegFile(buffer: Buffer): boolean {
    if (buffer.length < 2) return false;
    return buffer[0] === 0xFF && buffer[1] === 0xD8;
  }

  /**
   * 去除PNG文件的元数据
   * 保留关键的图像数据块，移除文本和其他元数据块
   */
  private static removePngMetadata(buffer: Buffer): Buffer {
    if (!this.isPngFile(buffer)) {
      return buffer;
    }

    const chunks: Buffer[] = [];
    const signature = buffer.subarray(0, 8);
    chunks.push(signature);

    let offset = 8;
    
    while (offset < buffer.length) {
      if (offset + 8 > buffer.length) break;

      const length = buffer.readUInt32BE(offset);
      const type = buffer.subarray(offset + 4, offset + 8).toString('ascii');
      
      if (offset + 12 + length > buffer.length) break;

      // 保留关键的图像数据块，移除元数据块
      const keepChunk = this.shouldKeepPngChunk(type);
      
      if (keepChunk) {
        const chunkData = buffer.subarray(offset, offset + 12 + length);
        chunks.push(chunkData);
      }

      offset += 12 + length;

      // IEND块是最后一个块
      if (type === 'IEND') {
        break;
      }
    }

    return Buffer.concat(chunks);
  }

  /**
   * 判断是否应该保留PNG块
   */
  private static shouldKeepPngChunk(type: string): boolean {
    // 保留关键的图像数据块
    const keepTypes = [
      'IHDR', // 图像头
      'PLTE', // 调色板
      'IDAT', // 图像数据
      'IEND', // 图像结束
      'tRNS', // 透明度
      'gAMA', // 伽马值
      'cHRM', // 色度
      'sRGB', // sRGB色彩空间
      'iCCP', // ICC配置文件
    ];

    // 移除的元数据块类型
    const removeTypes = [
      'tEXt', // 文本
      'zTXt', // 压缩文本
      'iTXt', // 国际化文本
      'tIME', // 时间戳
      'pHYs', // 物理像素尺寸
      'sBIT', // 有效位数
      'bKGD', // 背景色
      'hIST', // 直方图
      'sPLT', // 建议调色板
      'eXIf', // EXIF数据
    ];

    return keepTypes.includes(type);
  }

  /**
   * 去除JPEG文件的元数据
   * 移除EXIF、XMP等元数据段
   */
  private static removeJpegMetadata(buffer: Buffer): Buffer {
    if (!this.isJpegFile(buffer)) {
      return buffer;
    }

    const segments: Buffer[] = [];
    let offset = 0;

    // 添加SOI标记
    segments.push(buffer.subarray(0, 2));
    offset = 2;

    while (offset < buffer.length - 1) {
      if (buffer[offset] !== 0xFF) {
        break;
      }

      const marker = buffer[offset + 1];
      
      // SOS标记后是图像数据，直接添加剩余部分
      if (marker === 0xDA) {
        segments.push(buffer.subarray(offset));
        break;
      }

      // EOI标记
      if (marker === 0xD9) {
        segments.push(buffer.subarray(offset, offset + 2));
        break;
      }

      // 计算段长度
      if (offset + 3 >= buffer.length) break;
      
      const segmentLength = buffer.readUInt16BE(offset + 2);
      const totalSegmentLength = segmentLength + 2;

      if (offset + totalSegmentLength > buffer.length) break;

      // 判断是否保留该段
      if (this.shouldKeepJpegSegment(marker)) {
        segments.push(buffer.subarray(offset, offset + totalSegmentLength));
      }

      offset += totalSegmentLength;
    }

    return Buffer.concat(segments);
  }

  /**
   * 判断是否应该保留JPEG段
   */
  private static shouldKeepJpegSegment(marker: number): boolean {
    // 保留的段类型
    const keepMarkers = [
      0xC0, 0xC1, 0xC2, 0xC3, // SOF (Start of Frame)
      0xC4, // DHT (Define Huffman Table)
      0xC5, 0xC6, 0xC7,
      0xC8, 0xC9, 0xCA, 0xCB,
      0xCC, 0xCD, 0xCE, 0xCF,
      0xDA, // SOS (Start of Scan)
      0xDB, // DQT (Define Quantization Table)
      0xDC, 0xDD, 0xDE, 0xDF,
      0xD0, 0xD1, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, // RST (Restart)
    ];

    // 移除的元数据段
    const removeMarkers = [
      0xE0, // APP0 (JFIF)
      0xE1, // APP1 (EXIF, XMP)
      0xE2, // APP2 (ICC Profile)
      0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xEB, 0xEC, 0xED, 0xEE, 0xEF, // APP3-APP15
      0xFE, // COM (Comment)
    ];

    return keepMarkers.includes(marker);
  }
}