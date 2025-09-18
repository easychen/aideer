/**
 * JPEG提示词处理器类
 * 支持读取JPEG文件中的EXIF和XMP元数据
 */
export class JpegPromptProcessor {
  
  /**
   * 从JPEG文件中提取元数据
   * @param arrayBuffer JPEG文件的ArrayBuffer
   * @returns 提取的元数据或null
   */
  static async extractMetadata(arrayBuffer: ArrayBuffer): Promise<Record<string, any> | null> {
    try {
      console.log('开始从JPEG文件提取元数据，文件大小:', arrayBuffer.byteLength);

      if (!this.isValidJpeg(arrayBuffer)) {
        console.warn('不是有效的JPEG文件');
        return null;
      }

      const metadata: Record<string, any> = {};
      
      // 解析JPEG段
      const segments = this.parseJpegSegments(arrayBuffer);
      
      for (const segment of segments) {
        if (segment.marker === 0xFFE1) { // APP1段，可能包含EXIF或XMP
          const segmentData = new Uint8Array(arrayBuffer.slice(segment.offset + 4, segment.offset + 4 + segment.length - 2));
          
          // 检查是否是XMP数据
          if (this.isXmpSegment(segmentData)) {
            const xmpData = this.extractXmpData(segmentData);
            if (xmpData) {
              Object.assign(metadata, xmpData);
            }
          }
          // 这里可以添加EXIF解析逻辑
        }
      }

      return Object.keys(metadata).length > 0 ? metadata : null;
    } catch (error) {
      console.error('提取JPEG元数据时出错:', error);
      return null;
    }
  }

  /**
   * 检查是否是有效的JPEG文件
   * @param buffer 文件Buffer
   * @returns 是否是有效的JPEG文件
   */
  private static isValidJpeg(buffer: ArrayBuffer): boolean {
    if (buffer.byteLength < 2) return false;
    
    const view = new DataView(buffer);
    return view.getUint8(0) === 0xFF && view.getUint8(1) === 0xD8;
  }

  /**
   * 解析JPEG段
   * @param buffer JPEG文件Buffer
   * @returns JPEG段数组
   */
  private static parseJpegSegments(buffer: ArrayBuffer): Array<{marker: number, offset: number, length: number}> {
    const segments: Array<{marker: number, offset: number, length: number}> = [];
    const view = new DataView(buffer);
    let offset = 2; // 跳过SOI标记

    while (offset < buffer.byteLength - 1) {
      // 查找下一个标记
      if (view.getUint8(offset) !== 0xFF) {
        offset++;
        continue;
      }

      const marker = (view.getUint8(offset) << 8) | view.getUint8(offset + 1);
      
      // 某些标记没有长度字段
      if (marker === 0xFFD8 || marker === 0xFFD9 || (marker >= 0xFFD0 && marker <= 0xFFD7)) {
        offset += 2;
        continue;
      }

      if (offset + 4 > buffer.byteLength) break;

      const length = view.getUint16(offset + 2);
      
      segments.push({
        marker,
        offset,
        length
      });

      offset += 2 + length;
    }

    return segments;
  }

  /**
   * 检查是否是XMP段
   * @param segmentData 段数据
   * @returns 是否是XMP段
   */
  private static isXmpSegment(segmentData: Uint8Array): boolean {
    const xmpHeader = 'http://ns.adobe.com/xap/1.0/\0';
    if (segmentData.length < xmpHeader.length) return false;
    
    const headerBytes = new Uint8Array(segmentData.buffer, segmentData.byteOffset, xmpHeader.length);
    const headerString = new TextDecoder('utf-8').decode(headerBytes);
    
    return headerString === xmpHeader;
  }

  /**
   * 提取XMP数据
   * @param segmentData 段数据
   * @returns 提取的XMP数据
   */
  private static extractXmpData(segmentData: Uint8Array): Record<string, any> | null {
    try {
      const xmpHeader = 'http://ns.adobe.com/xap/1.0/\0';
      const xmpStart = xmpHeader.length;
      
      if (segmentData.length <= xmpStart) return null;
      
      const xmpBytes = new Uint8Array(segmentData.buffer, segmentData.byteOffset + xmpStart, segmentData.length - xmpStart);
      const xmpString = new TextDecoder('utf-8').decode(xmpBytes);
      
      return this.parseXmpString(xmpString);
    } catch (error) {
      console.error('提取XMP数据时出错:', error);
      return null;
    }
  }

  /**
   * 解析XMP字符串
   * @param xmpString XMP XML字符串
   * @returns 解析后的数据
   */
  private static parseXmpString(xmpString: string): Record<string, any> | null {
    try {
      const result: Record<string, any> = {
        xmp_data: xmpString
      };

      // 解析XML内容
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmpString, 'text/xml');

      // 检查是否有解析错误
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        console.warn('XMP XML解析错误:', parseError.textContent);
        return { xmp_data: xmpString };
      }

      // 查找source_url字段
      const sourceUrlElement = xmlDoc.querySelector('[source_url], [*|source_url]');
      if (sourceUrlElement) {
        result.source_url = sourceUrlElement.textContent?.trim();
      }

      // 也可以通过属性查找
      const elements = xmlDoc.querySelectorAll('*');
      for (const element of elements) {
        if (element.hasAttribute('source_url')) {
          result.source_url = element.getAttribute('source_url');
          break;
        }
      }

      return result;
    } catch (error) {
      console.error('解析XMP字符串时出错:', error);
      return { xmp_data: xmpString };
    }
  }
}