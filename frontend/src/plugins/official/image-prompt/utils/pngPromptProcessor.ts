
// 提示词数据接口
export interface PromptData {
  // A1111 格式的通用字段
  prompt?: string;
  negative_prompt?: string;
  steps?: number;
  sampler?: string;
  cfg_scale?: number;
  seed?: number;
  size?: string;
  model?: string;
  model_hash?: string;
  
  // 扩展字段
  width?: number;
  height?: number;
  denoising_strength?: number;
  clip_skip?: number;
  ensd?: number;
  
  // ComfyUI 工作流
  workflow?: any;
  
  // 其他元数据
  software?: string;
  parameters?: string;
  
  // XMP 元数据
  xmp_data?: any;
  creator_tool?: string;
  description?: string;
  user_comment?: any;
  
  // 源URL信息
  source_url?: string;
  
  // 原始数据
  raw_data?: Record<string, any>;
  
  [key: string]: any;
}

// PNG解析结果接口
interface PngParseResult {
  type: 'parameters' | 'workflow' | 'other';
  keyword: string;
  data: string;
}

/**
 * PNG提示词处理器类
 * 支持读取各种AI工具生成的图片元数据
 */
export class PngPromptProcessor {
  /**
   * 从PNG文件中提取提示词数据
   * @param arrayBuffer PNG文件的ArrayBuffer
   * @returns 提取的提示词数据或null
   */
  static async extractPromptData(arrayBuffer: ArrayBuffer): Promise<PromptData | null> {
    try {
      console.log('开始从PNG文件提取提示词数据，文件大小:', arrayBuffer.byteLength);

      // 解析PNG文件
      const results = this.parsePng(arrayBuffer);

      if (!results || results.length === 0) {
        console.warn('PNG文件中未找到提示词数据');
        return null;
      }

      console.log('找到', results.length, '个数据块');

      // 合并所有找到的数据
      const promptData: PromptData = {
        raw_data: {}
      };

      for (const result of results) {
        console.log(`处理数据块: ${result.keyword} (类型: ${result.type})`);
        
        if (result.keyword === 'parameters') {
          // A1111格式的parameters
          const parsedParams = this.parseA1111Parameters(result.data);
          Object.assign(promptData, parsedParams);
        } else if (result.keyword === 'workflow') {
          // ComfyUI工作流
          try {
            promptData.workflow = JSON.parse(result.data);
          } catch (e) {
            console.warn('解析workflow JSON失败:', e);
          }
        } else if (result.keyword === 'Software') {
          promptData.software = result.data;
        } else if (result.keyword === 'source_url') {
          // 网页源URL
          promptData.source_url = result.data;
        } else if (result.keyword === 'XML:com.adobe.xmp') {
          // XMP 元数据
          const xmpData = this.parseXMPData(result.data);
          if (xmpData) {
            Object.assign(promptData, xmpData);
          }
        } else {
          // 其他元数据
          promptData.raw_data![result.keyword] = result.data;
        }
      }

      // 检查是否有有效的提示词数据
      const hasValidData = this.isValidPromptData(promptData);
      if (!hasValidData) {
        console.warn('未找到有效的提示词数据');
        // 如果没有提示词数据，但有其他有用的元数据（如source_url），仍然返回数据
        if (promptData.source_url || (promptData.raw_data && Object.keys(promptData.raw_data).length > 0)) {
          return promptData;
        }
        return null;
      }

      console.log('成功提取提示词数据');
      return promptData;
    } catch (error) {
      console.error('提取提示词数据时出错:', error);
      throw new Error(`提取提示词数据失败: ${(error as Error).message}`);
    }
  }

  /**
   * 解析PNG文件的文本块
   * @param arrayBuffer PNG文件的ArrayBuffer
   * @returns 解析结果数组
   */
  private static parsePng(arrayBuffer: ArrayBuffer): PngParseResult[] {
    try {
      console.log('开始解析PNG文件，缓冲区大小:', arrayBuffer.byteLength);
      const view = new DataView(arrayBuffer);
      let offset = 8; // 跳过PNG头部
      const results: PngParseResult[] = [];

      while (offset < arrayBuffer.byteLength) {
        if (offset + 8 > arrayBuffer.byteLength) {
          break; // 防止越界
        }

        const length = view.getUint32(offset);
        const type = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7)
        );

        console.log(`发现块类型: ${type}, 长度: ${length}`);

        // 检查块是否完整
        if (offset + 12 + length > arrayBuffer.byteLength) {
          console.warn(`块 ${type} 不完整，跳过`);
          break;
        }

        if (type === 'tEXt' || type === 'zTXt' || type === 'iTXt') {
          const result = this.parseTextChunk(arrayBuffer, offset, length, type);
          if (result) {
            results.push(result);
          }
        }

        offset += 12 + length; // 跳到下一个块 (长度 + 类型 + 数据 + CRC)
      }

      return results;
    } catch (error) {
      console.error('解析PNG文件时出错:', error);
      return [];
    }
  }

  /**
   * 解析文本块 (tEXt, zTXt, iTXt)
   * @param arrayBuffer PNG文件的ArrayBuffer
   * @param offset 块的偏移量
   * @param length 块的长度
   * @param type 块的类型
   * @returns 解析结果或null
   */
  private static parseTextChunk(
    arrayBuffer: ArrayBuffer, 
    offset: number, 
    length: number, 
    type: string
  ): PngParseResult | null {
    try {
      const view = new DataView(arrayBuffer);
      const textOffset = offset + 8;
      
      if (type === 'tEXt') {
        // tEXt: keyword\0text
        let keywordEnd = textOffset;
        while (keywordEnd < arrayBuffer.byteLength && view.getUint8(keywordEnd) !== 0) {
          keywordEnd++;
        }

        if (keywordEnd >= arrayBuffer.byteLength) {
          console.error('无效的tEXt块: 未找到关键字的空终止符');
          return null;
        }

        const keyword = new Uint8Array(arrayBuffer.slice(textOffset, keywordEnd)).reduce(
          (str, byte) => str + String.fromCharCode(byte),
          ''
        );

        const textStart = keywordEnd + 1;
        const textEnd = offset + 8 + length;
        const textData = new Uint8Array(arrayBuffer.slice(textStart, textEnd)).reduce(
          (str, byte) => str + String.fromCharCode(byte),
          ''
        );

        console.log(`tEXt块，关键字: ${keyword}`);
        return {
          type: this.getDataType(keyword),
          keyword,
          data: textData
        };
      } else if (type === 'zTXt') {
        // zTXt: keyword\0compression_method\0compressed_text
        let keywordEnd = textOffset;
        while (keywordEnd < arrayBuffer.byteLength && view.getUint8(keywordEnd) !== 0) {
          keywordEnd++;
        }

        if (keywordEnd >= arrayBuffer.byteLength) {
          console.error('无效的zTXt块: 未找到关键字的空终止符');
          return null;
        }

        const keyword = new Uint8Array(arrayBuffer.slice(textOffset, keywordEnd)).reduce(
          (str, byte) => str + String.fromCharCode(byte),
          ''
        );

        const compressionMethod = view.getUint8(keywordEnd + 1);
        if (compressionMethod !== 0) {
          console.warn(`不支持的压缩方法: ${compressionMethod}`);
          return null;
        }

        // const compressedStart = keywordEnd + 2;
        // const compressedEnd = offset + 8 + length;
        // const compressedData = new Uint8Array(arrayBuffer.slice(compressedStart, compressedEnd));

        // 使用pako或其他库解压缩（这里简化处理）
        console.log(`zTXt块，关键字: ${keyword} (压缩数据，暂不支持)`);
        return null;
      } else if (type === 'iTXt') {
        // iTXt: keyword\0compression_flag\0compression_method\0language_tag\0translated_keyword\0text
        let keywordEnd = textOffset;
        while (keywordEnd < arrayBuffer.byteLength && view.getUint8(keywordEnd) !== 0) {
          keywordEnd++;
        }

        if (keywordEnd >= arrayBuffer.byteLength) {
          console.error('无效的iTXt块: 未找到关键字的空终止符');
          return null;
        }

        const keyword = new Uint8Array(arrayBuffer.slice(textOffset, keywordEnd)).reduce(
          (str, byte) => str + String.fromCharCode(byte),
          ''
        );

        const compressionFlag = view.getUint8(keywordEnd + 1);
        // const compressionMethod = view.getUint8(keywordEnd + 2);

        if (compressionFlag !== 0) {
          console.warn(`iTXt块使用压缩，暂不支持: ${keyword}`);
          return null;
        }

        // 跳过language_tag和translated_keyword
        let textStart = keywordEnd + 3;
        // 跳过language_tag
        while (textStart < arrayBuffer.byteLength && view.getUint8(textStart) !== 0) {
          textStart++;
        }
        textStart++; // 跳过null终止符
        // 跳过translated_keyword
        while (textStart < arrayBuffer.byteLength && view.getUint8(textStart) !== 0) {
          textStart++;
        }
        textStart++; // 跳过null终止符

        const textEnd = offset + 8 + length;
        const textData = new Uint8Array(arrayBuffer.slice(textStart, textEnd)).reduce(
          (str, byte) => str + String.fromCharCode(byte),
          ''
        );

        console.log(`iTXt块，关键字: ${keyword}`);
        return {
          type: this.getDataType(keyword),
          keyword,
          data: textData
        };
      }

      return null;
    } catch (error) {
      console.error(`解析${type}块时出错:`, error);
      return null;
    }
  }

  /**
   * 根据关键字确定数据类型
   * @param keyword 关键字
   * @returns 数据类型
   */
  private static getDataType(keyword: string): 'parameters' | 'workflow' | 'other' {
    if (keyword === 'parameters') {
      return 'parameters';
    } else if (keyword === 'workflow') {
      return 'workflow';
    } else {
      return 'other';
    }
  }

  /**
   * 解析A1111格式的parameters字符串
   * @param parametersText parameters文本
   * @returns 解析后的数据
   */
  private static parseA1111Parameters(parametersText: string): Partial<PromptData> {
    try {
      const result: Partial<PromptData> = {
        parameters: parametersText
      };

      // 分割正面和负面提示词
      const lines = parametersText.split('\n');
      let currentSection = '';
      let prompt = '';
      let negativePrompt = '';
      let parametersLine = '';

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('Negative prompt:')) {
          currentSection = 'negative';
          negativePrompt = line.substring('Negative prompt:'.length).trim();
        } else if (line.includes('Steps:') || line.includes('Sampler:') || line.includes('CFG scale:')) {
          // 参数行
          parametersLine = line;
          break;
        } else if (currentSection === 'negative') {
          negativePrompt += (negativePrompt ? ' ' : '') + line;
        } else {
          prompt += (prompt ? ' ' : '') + line;
        }
      }

      result.prompt = prompt.trim();
      if (negativePrompt) {
        result.negative_prompt = negativePrompt.trim();
      }

      // 解析参数行
      if (parametersLine) {
        const params = this.parseParametersLine(parametersLine);
        Object.assign(result, params);
      }

      return result;
    } catch (error) {
      console.error('解析A1111参数时出错:', error);
      return { parameters: parametersText };
    }
  }

  /**
   * 解析参数行
   * @param line 参数行文本
   * @returns 解析后的参数
   */
  private static parseParametersLine(line: string): Partial<PromptData> {
    const result: Partial<PromptData> = {};
    
    // 使用正则表达式匹配各种参数
    const patterns = [
      { key: 'steps', pattern: /Steps:\s*(\d+)/ },
      { key: 'sampler', pattern: /Sampler:\s*([^,]+)/ },
      { key: 'cfg_scale', pattern: /CFG scale:\s*([\d.]+)/ },
      { key: 'seed', pattern: /Seed:\s*(\d+)/ },
      { key: 'size', pattern: /Size:\s*(\d+x\d+)/ },
      { key: 'model', pattern: /Model:\s*([^,]+)/ },
      { key: 'model_hash', pattern: /Model hash:\s*([^,]+)/ },
      { key: 'denoising_strength', pattern: /Denoising strength:\s*([\d.]+)/ },
      { key: 'clip_skip', pattern: /Clip skip:\s*(\d+)/ },
      { key: 'ensd', pattern: /ENSD:\s*(\d+)/ }
    ];

    for (const { key, pattern } of patterns) {
      const match = line.match(pattern);
      if (match) {
        let value: any = match[1].trim();
        
        // 类型转换
        if (key === 'steps' || key === 'seed' || key === 'clip_skip' || key === 'ensd') {
          value = parseInt(value, 10);
        } else if (key === 'cfg_scale' || key === 'denoising_strength') {
          value = parseFloat(value);
        }
        
        result[key as keyof PromptData] = value;
      }
    }

    // 解析尺寸
    if (result.size) {
      const sizeMatch = (result.size as string).match(/(\d+)x(\d+)/);
      if (sizeMatch) {
        result.width = parseInt(sizeMatch[1], 10);
        result.height = parseInt(sizeMatch[2], 10);
      }
    }

    return result;
  }

  /**
   * 解析XMP元数据
   * @param xmpData XMP XML数据
   * @returns 解析后的数据
   */
  private static parseXMPData(xmpData: string): Partial<PromptData> | null {
    try {
      const result: Partial<PromptData> = {
        xmp_data: xmpData
      };

      // 解析XML内容
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmpData, 'text/xml');

      // 检查是否有解析错误
      const parseError = xmlDoc.querySelector('parsererror');
      if (parseError) {
        console.warn('XMP XML解析错误:', parseError.textContent);
        return { xmp_data: xmpData };
      }

      // 提取 CreatorTool
      const creatorTool = xmlDoc.querySelector('CreatorTool');
      if (creatorTool) {
        result.creator_tool = creatorTool.textContent?.trim();
        result.software = result.creator_tool; // 兼容性
      }

      // 提取 description
      const description = xmlDoc.querySelector('description rdf\\:Alt rdf\\:li, description Alt li');
      if (description) {
        const descText = description.textContent?.trim();
        if (descText) {
          result.description = descText;
          
          // 尝试解析 Draw Things 格式的描述
          if (descText.includes('Steps:') && descText.includes('Sampler:')) {
            // 这是 Draw Things 格式，包含提示词和参数
            const parts = descText.split('&#xA;');
            if (parts.length >= 2) {
              result.prompt = parts[0].trim();
              result.negative_prompt = parts[1].replace(/^-/, '').trim();
              
              // 解析参数部分
              const paramsPart = parts.slice(2).join('\n');
              const drawThingsParams = this.parseDrawThingsParameters(paramsPart);
              Object.assign(result, drawThingsParams);
            }
          } else if (descText.includes('Include in Image:')) {
            // Mochi Diffusion 格式
            const match = descText.match(/Include in Image:\s*(.+?)(?:\s+Generator:|$)/s);
            if (match) {
              result.prompt = match[1].trim();
            }
          }
        }
      }

      // 提取 UserComment (Draw Things 的 JSON 数据)
      const userComment = xmlDoc.querySelector('UserComment rdf\\:Alt rdf\\:li, UserComment Alt li');
      if (userComment) {
        const commentText = userComment.textContent?.trim();
        if (commentText) {
          try {
            const jsonData = JSON.parse(commentText);
            result.user_comment = jsonData;
            
            // 从 JSON 数据中提取更多信息
            if (jsonData.c) result.prompt = jsonData.c;
            if (jsonData.uc) result.negative_prompt = jsonData.uc;
            if (jsonData.steps) result.steps = jsonData.steps;
            if (jsonData.sampler) result.sampler = jsonData.sampler;
            if (jsonData.scale) result.cfg_scale = jsonData.scale;
            if (jsonData.seed) result.seed = jsonData.seed;
            if (jsonData.size) result.size = jsonData.size;
            if (jsonData.model) result.model = jsonData.model;
            if (jsonData.strength) result.denoising_strength = jsonData.strength;
            
            // 解析尺寸
            if (jsonData.size) {
              const sizeMatch = jsonData.size.match(/(\d+)x(\d+)/);
              if (sizeMatch) {
                result.width = parseInt(sizeMatch[1], 10);
                result.height = parseInt(sizeMatch[2], 10);
              }
            }
          } catch (e) {
            console.warn('解析UserComment JSON失败:', e);
            result.user_comment = commentText;
          }
        }
      }

      return result;
    } catch (error) {
      console.error('解析XMP数据时出错:', error);
      return { xmp_data: xmpData };
    }
  }

  /**
   * 解析Draw Things格式的参数
   * @param paramsText 参数文本
   * @returns 解析后的参数
   */
  private static parseDrawThingsParameters(paramsText: string): Partial<PromptData> {
    const result: Partial<PromptData> = {};
    
    // Draw Things 参数格式: Steps: 20, Sampler: Euler Ancestral, Guidance Scale: 4.5, ...
    const patterns = [
      { key: 'steps', pattern: /Steps:\s*(\d+)/ },
      { key: 'sampler', pattern: /Sampler:\s*([^,]+)/ },
      { key: 'cfg_scale', pattern: /Guidance Scale:\s*([\d.]+)/ },
      { key: 'seed', pattern: /Seed:\s*(\d+)/ },
      { key: 'size', pattern: /Size:\s*(\d+x\d+)/ },
      { key: 'model', pattern: /Model:\s*([^,]+)/ },
      { key: 'denoising_strength', pattern: /Strength:\s*([\d.]+)/ }
    ];

    for (const { key, pattern } of patterns) {
      const match = paramsText.match(pattern);
      if (match) {
        let value: any = match[1].trim();
        
        // 类型转换
        if (key === 'steps' || key === 'seed') {
          value = parseInt(value, 10);
        } else if (key === 'cfg_scale' || key === 'denoising_strength') {
          value = parseFloat(value);
        }
        
        result[key as keyof PromptData] = value;
      }
    }

    // 解析尺寸
    if (result.size) {
      const sizeMatch = (result.size as string).match(/(\d+)x(\d+)/);
      if (sizeMatch) {
        result.width = parseInt(sizeMatch[1], 10);
        result.height = parseInt(sizeMatch[2], 10);
      }
    }

    return result;
  }

  /**
   * 验证是否为有效的PNG文件
   * @param arrayBuffer 文件的ArrayBuffer
   * @returns 是否为有效PNG
   */
  static isValidPng(arrayBuffer: ArrayBuffer): boolean {
    if (arrayBuffer.byteLength < 8) {
      return false;
    }

    const view = new DataView(arrayBuffer);
    const pngSignature = [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
    
    for (let i = 0; i < 8; i++) {
      if (view.getUint8(i) !== pngSignature[i]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 检查提示词数据是否有效（包含有意义的内容）
   * @param promptData 提示词数据对象
   * @returns 是否包含有效数据
   */
  private static isValidPromptData(promptData: PromptData): boolean {
    // 检查是否有主要的提示词内容
    if (promptData.prompt && promptData.prompt.trim()) {
      return true;
    }
    
    // 检查是否有负面提示词
    if (promptData.negative_prompt && promptData.negative_prompt.trim()) {
      return true;
    }
    
    // 检查是否有工作流数据
    if (promptData.workflow && typeof promptData.workflow === 'object') {
      return true;
    }
    
    // 检查是否有参数字符串
    if (promptData.parameters && promptData.parameters.trim()) {
      return true;
    }
    
    // 检查是否有有意义的生成参数
    const meaningfulParams = ['steps', 'sampler', 'cfg_scale', 'seed', 'model', 'width', 'height'];
    const hasParams = meaningfulParams.some(param => 
      promptData[param] !== undefined && promptData[param] !== null && promptData[param] !== ''
    );
    if (hasParams) {
      return true;
    }
    
    // 检查是否有source_url（网页来源）
    if (promptData.source_url && promptData.source_url.trim()) {
      return true;
    }
    
    // 检查原始数据是否包含有意义的内容
    if (promptData.raw_data && Object.keys(promptData.raw_data).length > 0) {
      // 过滤掉一些无意义的元数据
      const meaningfulKeys = Object.keys(promptData.raw_data).filter(key => {
        const value = promptData.raw_data![key];
        const keyLower = key.toLowerCase();
        
        // 跳过空值或无意义的键
        if (!value || value === '' || value === 'Unknown') return false;
        
        // source_url 是有意义的元数据
        if (keyLower === 'source_url') return true;
        
        // 跳过一些技术性的元数据
        if (keyLower.includes('timestamp') || keyLower.includes('date') || 
            keyLower.includes('version') || keyLower.includes('software')) {
          return false;
        }
        
        return true;
      });
      
      if (meaningfulKeys.length > 0) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 检查PNG文件是否包含提示词数据
   * @param arrayBuffer PNG文件的ArrayBuffer
   * @returns 是否包含提示词数据
   */
  static async hasPromptData(arrayBuffer: ArrayBuffer): Promise<boolean> {
    try {
      const promptData = await this.extractPromptData(arrayBuffer);
      return promptData !== null;
    } catch (error) {
      console.error('检查提示词数据时出错:', error);
      return false;
    }
  }
}