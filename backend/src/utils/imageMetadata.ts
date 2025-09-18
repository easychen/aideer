import fs from 'fs-extra';
import path from 'path';

/**
 * 图片元数据处理工具
 * 支持在PNG和JPEG图片中写入元数据
 */
export class ImageMetadataProcessor {
  
  /**
   * 在图片中写入网页URL元数据
   * @param imageBuffer 图片文件的Buffer
   * @param sourceUrl 网页URL
   * @param mimeType 图片MIME类型
   * @returns 处理后的图片Buffer
   */
  static async addSourceUrlMetadata(
    imageBuffer: Buffer, 
    sourceUrl: string, 
    mimeType?: string
  ): Promise<Buffer> {
    // 根据MIME类型或文件头判断图片格式
    const imageType = this.detectImageType(imageBuffer, mimeType);
    
    switch (imageType) {
      case 'png':
        return this.addPngMetadata(imageBuffer, sourceUrl);
      case 'jpeg':
        return this.addJpegMetadata(imageBuffer, sourceUrl);
      default:
        console.warn(`不支持的图片格式: ${imageType}，返回原始图片`);
        return imageBuffer;
    }
  }

  /**
   * 检测图片类型
   * @param buffer 图片Buffer
   * @param mimeType MIME类型
   * @returns 图片类型
   */
  private static detectImageType(buffer: Buffer, mimeType?: string): string {
    // 优先使用MIME类型
    if (mimeType) {
      if (mimeType.includes('png')) return 'png';
      if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'jpeg';
    }

    // 通过文件头检测
    if (buffer.length >= 8) {
      // PNG文件头: 89 50 4E 47 0D 0A 1A 0A
      if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
        return 'png';
      }
      // JPEG文件头: FF D8
      if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
        return 'jpeg';
      }
    }

    return 'unknown';
  }

  /**
   * 在PNG图片中添加tEXt chunk
   * @param pngBuffer PNG图片Buffer
   * @param sourceUrl 网页URL
   * @returns 处理后的PNG Buffer
   */
  private static addPngMetadata(pngBuffer: Buffer, sourceUrl: string): Buffer {
    try {
      // 验证PNG文件头
      if (!this.isValidPng(pngBuffer)) {
        throw new Error('无效的PNG文件');
      }

      // 创建tEXt chunk
      const keyword = 'source_url';
      const textData = sourceUrl;
      const textChunk = this.createPngTextChunk(keyword, textData);

      // 找到IEND chunk的位置
      const iendPosition = this.findPngIendPosition(pngBuffer);
      if (iendPosition === -1) {
        // 如果没有找到IEND chunk，可能是损坏的PNG文件
        // 尝试在文件末尾添加IEND chunk
        console.warn('未找到PNG IEND chunk，尝试修复PNG文件');
        
        // 创建IEND chunk (长度0 + 'IEND' + CRC)
        const iendChunk = Buffer.alloc(12);
        iendChunk.writeUInt32BE(0, 0); // 长度为0
        iendChunk.write('IEND', 4, 4, 'ascii'); // 类型
        iendChunk.writeUInt32BE(0xAE426082, 8); // IEND的固定CRC值
        
        // 在原文件末尾插入tEXt chunk和IEND chunk
        return Buffer.concat([pngBuffer, textChunk, iendChunk]);
      }

      // 在IEND之前插入tEXt chunk
      const beforeIend = pngBuffer.slice(0, iendPosition);
      const iendChunk = pngBuffer.slice(iendPosition);
      
      return Buffer.concat([beforeIend, textChunk, iendChunk]);
    } catch (error) {
      console.error('添加PNG元数据失败:', error);
      return pngBuffer; // 返回原始图片
    }
  }

  /**
   * 验证PNG文件
   * @param buffer PNG Buffer
   * @returns 是否为有效PNG
   */
  private static isValidPng(buffer: Buffer): boolean {
    if (buffer.length < 8) return false;
    // PNG文件头: 89 50 4E 47 0D 0A 1A 0A
    return buffer[0] === 0x89 && buffer[1] === 0x50 && 
           buffer[2] === 0x4E && buffer[3] === 0x47 &&
           buffer[4] === 0x0D && buffer[5] === 0x0A &&
           buffer[6] === 0x1A && buffer[7] === 0x0A;
  }

  /**
   * 创建PNG tEXt chunk
   * @param keyword 关键字
   * @param text 文本内容
   * @returns tEXt chunk Buffer
   */
  private static createPngTextChunk(keyword: string, text: string): Buffer {
    const keywordBuffer = Buffer.from(keyword, 'latin1');
    const textBuffer = Buffer.from(text, 'utf8');
    const dataLength = keywordBuffer.length + 1 + textBuffer.length; // +1 for null separator
    
    // 创建chunk
    const chunk = Buffer.alloc(12 + dataLength);
    let offset = 0;
    
    // 长度 (4 bytes, big-endian)
    chunk.writeUInt32BE(dataLength, offset);
    offset += 4;
    
    // 类型 "tEXt" (4 bytes)
    chunk.write('tEXt', offset, 4, 'ascii');
    offset += 4;
    
    // 数据: keyword + null + text
    keywordBuffer.copy(chunk, offset);
    offset += keywordBuffer.length;
    chunk[offset] = 0; // null separator
    offset += 1;
    textBuffer.copy(chunk, offset);
    offset += textBuffer.length;
    
    // CRC (4 bytes)
    const crcData = chunk.slice(4, 8 + dataLength); // type + data
    const crc = this.calculateCRC32(crcData);
    chunk.writeUInt32BE(crc, 8 + dataLength);
    
    return chunk;
  }

  /**
   * 找到PNG IEND chunk的位置
   * @param pngBuffer PNG Buffer
   * @returns IEND位置，-1表示未找到
   */
  private static findPngIendPosition(pngBuffer: Buffer): number {
    let offset = 8; // 跳过PNG头部
    
    while (offset < pngBuffer.length - 8) { // 至少需要8字节来读取chunk头
      // 确保有足够的字节来读取chunk长度和类型
      if (offset + 8 > pngBuffer.length) {
        break;
      }
      
      const length = pngBuffer.readUInt32BE(offset);
      const type = pngBuffer.toString('ascii', offset + 4, offset + 8);
      
      if (type === 'IEND') {
        return offset;
      }
      
      // 移动到下一个chunk: 4字节长度 + 4字节类型 + length字节数据 + 4字节CRC
      const nextOffset = offset + 4 + 4 + length + 4;
      
      // 防止无限循环和越界
      if (nextOffset <= offset || nextOffset >= pngBuffer.length) {
        break;
      }
      
      offset = nextOffset;
    }
    
    return -1;
  }

  /**
   * 在JPEG图片中添加EXIF/XMP元数据
   * @param jpegBuffer JPEG图片Buffer
   * @param sourceUrl 网页URL
   * @returns 处理后的JPEG Buffer
   */
  private static addJpegMetadata(jpegBuffer: Buffer, sourceUrl: string): Buffer {
    try {
      // 验证JPEG文件头
      if (!this.isValidJpeg(jpegBuffer)) {
        throw new Error('无效的JPEG文件');
      }

      // 创建XMP数据包
      const xmpData = this.createXmpPacket(sourceUrl);
      const xmpSegment = this.createJpegXmpSegment(xmpData);

      // 找到合适的插入位置（在SOI之后，在其他数据之前）
      let insertPosition = 2; // 跳过SOI (FF D8)
      
      // 如果存在APP0段，在其后插入
      if (jpegBuffer.length > 4 && jpegBuffer[2] === 0xFF && jpegBuffer[3] === 0xE0) {
        const app0Length = jpegBuffer.readUInt16BE(4);
        insertPosition = 4 + app0Length;
      }

      // 插入XMP段
      const beforeXmp = jpegBuffer.slice(0, insertPosition);
      const afterXmp = jpegBuffer.slice(insertPosition);
      
      return Buffer.concat([beforeXmp, xmpSegment, afterXmp]);
    } catch (error) {
      console.error('添加JPEG元数据失败:', error);
      return jpegBuffer; // 返回原始图片
    }
  }

  /**
   * 验证JPEG文件
   * @param buffer JPEG Buffer
   * @returns 是否为有效JPEG
   */
  private static isValidJpeg(buffer: Buffer): boolean {
    if (buffer.length < 2) return false;
    // JPEG文件头: FF D8
    return buffer[0] === 0xFF && buffer[1] === 0xD8;
  }

  /**
   * 创建XMP数据包
   * @param sourceUrl 网页URL
   * @returns XMP XML字符串
   */
  private static createXmpPacket(sourceUrl: string): string {
    const timestamp = new Date().toISOString();
    
    return `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="AiDeer Image Processor">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmlns:aideer="http://aideer.com/ns/1.0/">
      <dc:source>${this.escapeXml(sourceUrl)}</dc:source>
      <dc:description>Image imported from web page</dc:description>
      <xmp:CreatorTool>AiDeer Browser Extension</xmp:CreatorTool>
      <xmp:CreateDate>${timestamp}</xmp:CreateDate>
      <aideer:sourceUrl>${this.escapeXml(sourceUrl)}</aideer:sourceUrl>
      <aideer:importDate>${timestamp}</aideer:importDate>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
  }

  /**
   * 创建JPEG XMP段
   * @param xmpData XMP数据
   * @returns XMP段Buffer
   */
  private static createJpegXmpSegment(xmpData: string): Buffer {
    const xmpNamespace = 'http://ns.adobe.com/xap/1.0/\0';
    const xmpNamespaceBuffer = Buffer.from(xmpNamespace, 'utf8');
    const xmpDataBuffer = Buffer.from(xmpData, 'utf8');
    
    const segmentLength = 2 + xmpNamespaceBuffer.length + xmpDataBuffer.length;
    const segment = Buffer.alloc(4 + segmentLength - 2);
    
    let offset = 0;
    // APP1标记 (FF E1)
    segment[offset++] = 0xFF;
    segment[offset++] = 0xE1;
    
    // 段长度 (2 bytes, big-endian, 包括长度字段本身)
    segment.writeUInt16BE(segmentLength, offset);
    offset += 2;
    
    // XMP命名空间
    xmpNamespaceBuffer.copy(segment, offset);
    offset += xmpNamespaceBuffer.length;
    
    // XMP数据
    xmpDataBuffer.copy(segment, offset);
    
    return segment;
  }

  /**
   * XML转义
   * @param text 要转义的文本
   * @returns 转义后的文本
   */
  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * 计算CRC32校验和
   * @param data 数据Buffer
   * @returns CRC32值
   */
  private static calculateCRC32(data: Buffer): number {
    const crcTable = this.getCRC32Table();
    let crc = 0xFFFFFFFF;
    
    for (let i = 0; i < data.length; i++) {
      const byte = data[i];
      crc = crcTable[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
    }
    
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }

  /**
   * 获取CRC32查找表
   * @returns CRC32查找表
   */
  private static getCRC32Table(): number[] {
    const table: number[] = [];
    
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        if (c & 1) {
          c = 0xEDB88320 ^ (c >>> 1);
        } else {
          c = c >>> 1;
        }
      }
      table[i] = c;
    }
    
    return table;
  }
}