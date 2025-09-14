import { Base64 } from 'js-base64';

// Character Card V2 规范类型定义
export interface CharacterBookEntry {
  keys: string[];
  content: string;
  extensions: Record<string, any>;
  enabled: boolean;
  insertion_order: number;
  case_sensitive?: boolean;
  // 可选字段
  name?: string;
  priority?: number;
  id?: number;
  comment?: string;
  selective?: boolean;
  secondary_keys?: string[];
  constant?: boolean;
  position?: 'before_char' | 'after_char';
}

export interface CharacterBook {
  name?: string;
  description?: string;
  scan_depth?: number;
  token_budget?: number;
  recursive_scanning?: boolean;
  extensions: Record<string, any>;
  entries: CharacterBookEntry[];
}

// CCv2规范的完整CharacterData接口
export interface CharacterData {
  // V1字段
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;
  
  // V2新增字段
  creator_notes: string;
  system_prompt: string;
  post_history_instructions: string;
  alternate_greetings: string[];
  character_book?: CharacterBook;
  
  // May 8th additions
  tags: string[];
  creator: string;
  character_version: string;
  extensions: Record<string, any>;
  
  // 兼容性字段（用于向后兼容）
  gender?: string;
  fullDescription?: string;
  exampleDialogue?: string;
  creatorNotes?: string;
  systemPrompt?: string;
  postHistoryInstructions?: string;
  alternateGreetings?: string[];
  characterVersion?: string;
  firstMes?: string;
  
  [key: string]: any;
}

// CCv2规范的完整卡片结构
export interface TavernCardV2 {
  spec: 'chara_card_v2';
  spec_version: '2.0';
  data: CharacterData;
}

// PNG解析结果接口
interface PngParseResult {
  type: 'ccv3' | 'chara';
  data: string;
  assets?: Record<string, string> | null;
}

/**
 * PNG文件解析器类
 */
export class PngProcessor {
  /**
   * 从PNG文件中提取CharacterCard数据
   * @param arrayBuffer PNG文件的ArrayBuffer
   * @returns 提取的角色数据或null
   */
  static async extractCharacterData(arrayBuffer: ArrayBuffer): Promise<CharacterData | null> {
    try {
      console.log('开始从PNG文件提取角色数据，文件大小:', arrayBuffer.byteLength);

      // 解析PNG文件
      const result = this.parsePng(arrayBuffer);

      if (!result || !result.data) {
        console.warn('PNG文件中未找到角色数据');
        return null;
      }

      console.log('PNG数据类型:', result.type);
      console.log('数据开头:', result.data.substring(0, 20));

      let jsonData: any = null;

      // 根据数据类型处理
      if (result.type === 'ccv3') {
        // ccv3数据已经由parsePng方法解码
        try {
          jsonData = JSON.parse(result.data);
          console.log('成功解析ccv3数据');
        } catch (e) {
          console.error('解析ccv3 JSON数据时出错:', e);
          throw new Error('无效的ccv3角色数据格式');
        }
      } else if (result.type === 'chara') {
        // chara数据是Base64编码的
        try {
          const decodedData = Base64.decode(result.data);
          jsonData = JSON.parse(decodedData);
          console.log('成功解码和解析chara数据');
        } catch (e) {
          console.error('解码/解析chara数据时出错:', e);
          throw new Error('无效的chara角色数据格式');
        }
      }

      if (!jsonData) {
        throw new Error('无法提取有效的角色数据');
      }

      // 记录解析数据的结构
      console.log('解析数据结构:', Object.keys(jsonData));

      // 提取实际的角色数据
      const characterData = jsonData.data || jsonData;
      console.log('角色数据键:', Object.keys(characterData));

      // 映射数据到CharacterData接口
      return this.mapToCharacterData(characterData);
    } catch (error) {
      console.error('提取角色数据时出错:', error);
      throw new Error(`提取角色数据失败: ${(error as Error).message}`);
    }
  }

  /**
   * 解析PNG文件
   * @param arrayBuffer PNG文件的ArrayBuffer
   * @returns 解析结果或null
   */
  private static parsePng(arrayBuffer: ArrayBuffer): PngParseResult | null {
    try {
      console.log('开始解析PNG文件，缓冲区大小:', arrayBuffer.byteLength);
      const view = new DataView(arrayBuffer);
      let offset = 8; // 跳过PNG头部
      let charaData = null;
      let ccv3Data = null;
      const assetData: Record<string, string> = {};

      while (offset < arrayBuffer.byteLength) {
        const length = view.getUint32(offset);
        const type = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7)
        );

        console.log(`发现块类型: ${type}, 长度: ${length}`);

        if (type === 'tEXt') {
          const textOffset = offset + 8;
          let keywordEnd = textOffset;
          while (keywordEnd < arrayBuffer.byteLength && view.getUint8(keywordEnd) !== 0) {
            keywordEnd++;
          }

          if (keywordEnd >= arrayBuffer.byteLength) {
            console.error('无效的tEXt块: 未找到关键字的空终止符');
            offset += 12 + length;
            continue;
          }

          const keyword = new Uint8Array(arrayBuffer.slice(textOffset, keywordEnd)).reduce(
            (str, byte) => str + String.fromCharCode(byte),
            ''
          );

          console.log(`发现tEXt块，关键字: ${keyword}`);

          // 定义文本起止位置
          const textStart = keywordEnd + 1;
          const textEnd = offset + 8 + length;

          if (textEnd > arrayBuffer.byteLength) {
            console.error('无效的tEXt块: 块超出缓冲区范围');
            offset += 12 + length;
            continue;
          }

          const textData = new Uint8Array(arrayBuffer.slice(textStart, textEnd)).reduce(
            (str, byte) => str + String.fromCharCode(byte),
            ''
          );

          if (keyword === 'ccv3') {
            // 处理CharacterCardV3数据 (base64解码)
            try {
              console.log('发现ccv3数据，尝试解码');
              ccv3Data = Base64.decode(textData);
              console.log('ccv3数据解码成功');
            } catch (e) {
              console.error('解码ccv3数据时出错:', e);
            }
          } else if (keyword === 'chara') {
            console.log('发现chara数据');
            charaData = textData;
          } else if (keyword.startsWith('chara-ext-asset_:')) {
            // 处理扩展资源
            const assetPath = keyword.substring('chara-ext-asset_:'.length);
            assetData[assetPath] = textData; // 存储资源数据
          }
        }

        offset += 12 + length; // 跳到下一个块 (长度 + 类型 + 数据 + CRC)
      }

      // 优先返回ccv3数据，其次是chara数据
      if (ccv3Data) {
        console.log('返回ccv3数据');
        return { 
          type: 'ccv3', 
          data: ccv3Data, 
          assets: Object.keys(assetData).length > 0 ? assetData : null 
        };
      } else if (charaData) {
        console.log('返回chara数据');
        return { 
          type: 'chara', 
          data: charaData, 
          assets: Object.keys(assetData).length > 0 ? assetData : null 
        };
      }

      console.warn('PNG文件中未找到角色数据');
      return null;
    } catch (error) {
      console.error('解析PNG时出错:', error);
      throw error;
    }
  }

  /**
   * 将原始数据映射到CharacterData接口
   * @param rawData 原始角色数据
   * @returns 映射后的角色数据
   */
  private static mapToCharacterData(rawData: any): CharacterData {
    // 处理CharacterBook数据
    let characterBook: CharacterBook | undefined;
    if (rawData.character_book) {
      characterBook = {
        name: rawData.character_book.name,
        description: rawData.character_book.description,
        scan_depth: rawData.character_book.scan_depth,
        token_budget: rawData.character_book.token_budget,
        recursive_scanning: rawData.character_book.recursive_scanning,
        extensions: rawData.character_book.extensions || {},
        entries: (rawData.character_book.entries || []).map((entry: any) => ({
          keys: entry.keys || [],
          content: entry.content || '',
          extensions: entry.extensions || {},
          enabled: entry.enabled !== false,
          insertion_order: entry.insertion_order || 0,
          case_sensitive: entry.case_sensitive,
          name: entry.name,
          priority: entry.priority,
          id: entry.id,
          comment: entry.comment,
          selective: entry.selective,
          secondary_keys: entry.secondary_keys,
          constant: entry.constant,
          position: entry.position
        }))
      };
    }

    return {
      // V1必需字段
      name: rawData.name || '',
      description: rawData.description || rawData.char_persona || '',
      personality: rawData.personality || rawData.char_persona || '',
      scenario: rawData.scenario || rawData.world_scenario || '',
      first_mes: rawData.first_mes || '',
      mes_example: rawData.mes_example || rawData.example_dialogue || '',
      
      // V2新增字段
      creator_notes: rawData.creator_notes || '',
      system_prompt: rawData.system_prompt || rawData.system || '',
      post_history_instructions: rawData.post_history_instructions || '',
      alternate_greetings: rawData.alternate_greetings || [],
      character_book: characterBook,
      
      // May 8th additions
      tags: rawData.tags || [],
      creator: rawData.creator || '',
      character_version: rawData.character_version || '',
      extensions: rawData.extensions || {},
      
      // 兼容性字段
      gender: rawData.gender || '',
      fullDescription: rawData.personality || rawData.full_description || rawData.char_persona || '',
      exampleDialogue: rawData.mes_example || rawData.example_dialogue || '',
      creatorNotes: rawData.creator_notes || '',
      systemPrompt: rawData.system_prompt || rawData.system || '',
      postHistoryInstructions: rawData.post_history_instructions || '',
      alternateGreetings: rawData.alternate_greetings || [],
      characterVersion: rawData.character_version || '',
      firstMes: rawData.first_mes || '',
      
      // 保留其他所有字段
      ...rawData
    };
  }

  /**
   * 验证是否为有效的PNG文件
   * @param arrayBuffer 文件的ArrayBuffer
   * @returns 是否为有效PNG文件
   */
  static isValidPng(arrayBuffer: ArrayBuffer): boolean {
    if (arrayBuffer.byteLength < 8) {
      return false;
    }

    const view = new DataView(arrayBuffer);
    // PNG文件签名: 89 50 4E 47 0D 0A 1A 0A
    return (
      view.getUint8(0) === 0x89 &&
      view.getUint8(1) === 0x50 &&
      view.getUint8(2) === 0x4E &&
      view.getUint8(3) === 0x47 &&
      view.getUint8(4) === 0x0D &&
      view.getUint8(5) === 0x0A &&
      view.getUint8(6) === 0x1A &&
      view.getUint8(7) === 0x0A
    );
  }

  /**
   * 检查PNG文件是否包含角色数据
   * @param arrayBuffer PNG文件的ArrayBuffer
   * @returns 是否包含角色数据
   */
  static async hasCharacterData(arrayBuffer: ArrayBuffer): Promise<boolean> {
    try {
      const result = this.parsePng(arrayBuffer);
      return result !== null;
    } catch (error) {
      console.error('检查角色数据时出错:', error);
      return false;
    }
  }

  /**
   * 将角色数据嵌入到PNG文件中
   * @param originalArrayBuffer 原始PNG文件的ArrayBuffer
   * @param characterData 要嵌入的角色数据
   * @returns 包含角色数据的新PNG文件的ArrayBuffer
   */
  static embedCharacterData(originalArrayBuffer: ArrayBuffer, characterData: CharacterData): ArrayBuffer {
    try {
      // 创建CCv2格式的数据结构
      const ccv2Data: TavernCardV2 = {
        spec: 'chara_card_v2',
        spec_version: '2.0',
        data: {
          // V1必需字段
          name: characterData.name || '',
          description: characterData.description || '',
          personality: characterData.personality || '',
          scenario: characterData.scenario || '',
          first_mes: characterData.first_mes || characterData.firstMes || '',
          mes_example: characterData.mes_example || characterData.exampleDialogue || '',
          
          // V2新增字段
          creator_notes: characterData.creator_notes || characterData.creatorNotes || '',
          system_prompt: characterData.system_prompt || characterData.systemPrompt || '',
          post_history_instructions: characterData.post_history_instructions || characterData.postHistoryInstructions || '',
          alternate_greetings: characterData.alternate_greetings || characterData.alternateGreetings || [],
          character_book: characterData.character_book,
          
          // May 8th additions
          tags: characterData.tags || [],
          creator: characterData.creator || '',
          character_version: characterData.character_version || characterData.characterVersion || '',
          extensions: characterData.extensions || {}
        }
      };
      
      // 创建tEXt块 - 使用chara关键字以保持兼容性
      const encodedData = Base64.encode(JSON.stringify(ccv2Data));
      const charaChunk = this.createTextChunk('chara', encodedData);
      
      // 同时创建ccv3块以支持新格式
      const ccv3EncodedData = Base64.encode(JSON.stringify(ccv2Data));
      const ccv3Chunk = this.createTextChunk('ccv3', ccv3EncodedData);
      
      const view = new DataView(originalArrayBuffer);
      const chunks = [];
      let offset = 8;
      
      // 添加PNG头部
      chunks.push(new Uint8Array(originalArrayBuffer.slice(0, 8)));
      
      // 解析所有块
      while (offset < originalArrayBuffer.byteLength) {
        const length = view.getUint32(offset);
        const type = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7)
        );
        
        const currentChunk = new Uint8Array(originalArrayBuffer.slice(offset, offset + 12 + length));
        
        // 如果是tEXt块，检查是否是已有的角色数据
        if (type === 'tEXt') {
          const keywordBytes = currentChunk.subarray(
            8,
            currentChunk.findIndex((v, i) => i >= 8 && v === 0)
          );
          const keyword = keywordBytes.reduce((str, byte) => str + String.fromCharCode(byte), '');
          
          // 跳过已有的角色卡数据块
          if (keyword === 'chara' || keyword === 'ccv3') {
            offset += 12 + length;
            continue;
          }
        }
        
        // 在IEND块之前插入新的角色数据
        if (type === 'IEND') {
          chunks.push(charaChunk);
          chunks.push(ccv3Chunk);
        }
        
        chunks.push(currentChunk);
        offset += 12 + length;
      }
      
      // 合并所有块
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let resultOffset = 0;
      
      for (const chunk of chunks) {
        result.set(chunk, resultOffset);
        resultOffset += chunk.length;
      }
      
      return result.buffer;
    } catch (error) {
      console.error('嵌入角色数据时出错:', error);
      throw error;
    }
  }

  /**
   * 创建tEXt块
   * @param keyword 关键字
   * @param text 文本内容
   * @returns tEXt块的Uint8Array
   */
  private static createTextChunk(keyword: string, text: string): Uint8Array {
    const keywordBytes = new TextEncoder().encode(keyword);
    const textBytes = new TextEncoder().encode(text);
    const dataLength = keywordBytes.length + 1 + textBytes.length; // +1 for null separator
    
    const chunk = new ArrayBuffer(12 + dataLength);
    const view = new DataView(chunk);
    const array = new Uint8Array(chunk);
    
    // 写入数据长度
    view.setUint32(0, dataLength, false);
    
    // 写入块类型 'tEXt'
    array.set(new TextEncoder().encode('tEXt'), 4);
    
    // 写入关键字
    array.set(keywordBytes, 8);
    
    // 写入null分隔符
    array[8 + keywordBytes.length] = 0;
    
    // 写入文本数据
    array.set(textBytes, 8 + keywordBytes.length + 1);
    
    // 计算并写入CRC32
    const crcData = array.slice(4, 8 + dataLength); // 类型 + 数据
    const crc32 = this.calculateCRC32(crcData);
    view.setUint32(8 + dataLength, crc32, false);
    
    return array;
  }

  /**
   * 计算CRC32校验和
   * @param data 要计算CRC32的数据
   * @returns CRC32值
   */
  private static calculateCRC32(data: Uint8Array): number {
    const crcTable = new Array(256);
    
    // 生成CRC表
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        if (c & 1) {
          c = 0xEDB88320 ^ (c >>> 1);
        } else {
          c = c >>> 1;
        }
      }
      crcTable[i] = c;
    }
    
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < data.length; i++) {
      crc = crcTable[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
    }
    
    return (crc ^ 0xFFFFFFFF) >>> 0;
  }
}