import CRC32 from "crc-32"
import { Base64 } from "js-base64"

export class Png {
  static createTextChunk(keyword: string, text: string) {
    // 将文本编码改为Latin1（ISO-8859-1）
    const encodeLatin1 = (str: string) => {
      const bytes = new Uint8Array(str.length)
      for (let i = 0; i < str.length; i++) {
        bytes[i] = str.charCodeAt(i) & 0xff // 确保在0-255范围内
      }
      return bytes
    }

    const keywordBytes = encodeLatin1(keyword)
    const textBytes = encodeLatin1(text)
    const length = keywordBytes.length + 1 + textBytes.length // +1 for null separator

    const chunk = new Uint8Array(12 + length)
    const view = new DataView(chunk.buffer)

    // Length
    view.setUint32(0, length)

    // Chunk type (tEXt)
    chunk[4] = 0x74 // t
    chunk[5] = 0x45 // E
    chunk[6] = 0x58 // X
    chunk[7] = 0x74 // t

    // Keyword
    chunk.set(keywordBytes, 8)
    chunk[8 + keywordBytes.length] = 0 // null separator

    // Text
    chunk.set(textBytes, 8 + keywordBytes.length + 1)

    // CRC
    const crc = CRC32.buf(chunk.slice(4, 8 + length)) >>> 0
    view.setUint32(8 + length, crc)

    return chunk
  }

  static Parse(arrayBuffer: ArrayBuffer) {
    try {
      console.log("Starting PNG parsing, buffer size:", arrayBuffer.byteLength)
      const view = new DataView(arrayBuffer)
      let offset = 8 // Skip PNG header
      let charaData = null
      let ccv3Data = null
      const assetData: Record<string, string> = {}

      while (offset < arrayBuffer.byteLength) {
        const length = view.getUint32(offset)
        const type = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7),
        )

        console.log(`Found chunk type: ${type}, length: ${length}`)

        if (type === "tEXt") {
          const textOffset = offset + 8
          let keywordEnd = textOffset
          while (keywordEnd < arrayBuffer.byteLength && view.getUint8(keywordEnd) !== 0) keywordEnd++

          if (keywordEnd >= arrayBuffer.byteLength) {
            console.error("Invalid tEXt chunk: no null terminator found for keyword")
            offset += 12 + length
            continue
          }

          const keyword = new Uint8Array(arrayBuffer.slice(textOffset, keywordEnd)).reduce(
            (str, byte) => str + String.fromCharCode(byte),
            "",
          )

          console.log(`Found tEXt chunk with keyword: ${keyword}`)

          // 定义文本起止位置
          const textStart = keywordEnd + 1
          const textEnd = offset + 8 + length

          if (textEnd > arrayBuffer.byteLength) {
            console.error("Invalid tEXt chunk: chunk extends beyond buffer")
            offset += 12 + length
            continue
          }

          const textData = new Uint8Array(arrayBuffer.slice(textStart, textEnd)).reduce(
            (str, byte) => str + String.fromCharCode(byte),
            "",
          )

          if (keyword === "ccv3") {
            // 处理CharacterCardV3数据 (base64解码)
            try {
              console.log("Found ccv3 data, attempting to decode")
              ccv3Data = Base64.decode(textData)
              console.log("ccv3 data decoded successfully")
            } catch (e) {
              console.error("Error decoding ccv3 data:", e)
            }
          } else if (keyword === "chara") {
            console.log("Found chara data")
            charaData = textData
          } else if (keyword.startsWith("chara-ext-asset_:")) {
            // 处理扩展资源
            const assetPath = keyword.substring("chara-ext-asset_:".length)
            assetData[assetPath] = textData // 存储资源数据
          }
        }

        offset += 12 + length // Skip to next chunk (length + type + data + CRC)
      }

      // 优先返回ccv3数据，其次是chara数据
      if (ccv3Data) {
        console.log("Returning ccv3 data")
        return { type: "ccv3", data: ccv3Data, assets: Object.keys(assetData).length > 0 ? assetData : null }
      } else if (charaData) {
        console.log("Returning chara data")
        return { type: "chara", data: charaData, assets: Object.keys(assetData).length > 0 ? assetData : null }
      }

      console.warn("No character data found in PNG")
      return null
    } catch (error) {
      console.error("Error parsing PNG:", error)
      throw error
    }
  }

  static Generate(
    originalImageData: ArrayBuffer,
    cardData: string,
    options: { version?: string; assets?: Record<string, string> | null } = {},
  ) {
    try {
      const { version = "v2", assets = null } = options
      const view = new DataView(originalImageData)
      const chunks = []
      let offset = 8

      chunks.push(new Uint8Array(originalImageData.slice(0, 8)))

      while (offset < originalImageData.byteLength) {
        const length = view.getUint32(offset)
        const type = String.fromCharCode(
          view.getUint8(offset + 4),
          view.getUint8(offset + 5),
          view.getUint8(offset + 6),
          view.getUint8(offset + 7),
        )

        // 先处理当前块
        const currentChunk = new Uint8Array(originalImageData.slice(offset, offset + 12 + length))

        if (type === "tEXt") {
          // 统一使用Latin1解码
          const keywordBytes = currentChunk.subarray(
            8,
            currentChunk.findIndex((v, i) => i >= 8 && v === 0),
          )
          const keyword = keywordBytes.reduce((str, byte) => str + String.fromCharCode(byte), "")

          // 跳过已有的角色卡数据块
          if (keyword === "chara" || keyword === "ccv3" || keyword.startsWith("chara-ext-asset_:")) {
            offset += 12 + length
            continue
          }
        }

        // 调整插入顺序：在添加当前块前检查IEND
        if (type === "IEND") {
          // 根据版本添加不同的数据块
          if (version === "v3") {
            // 对于v3，使用Base64编码的UTF-8 JSON字符串
            const encodedData = Base64.encode(cardData)
            const ccv3Chunk = this.createTextChunk("ccv3", encodedData)
            chunks.push(ccv3Chunk)

            // 添加资源块（如果有）
            if (assets && typeof assets === "object") {
              for (const [path, data] of Object.entries(assets)) {
                const assetChunk = this.createTextChunk(`chara-ext-asset_:${path}`, data)
                chunks.push(assetChunk)
              }
            }
          } else {
            // 对于v2，保持原有的chara块
            const charaChunk = this.createTextChunk("chara", cardData)
            chunks.push(charaChunk)
          }
        }

        chunks.push(currentChunk) // 将当前块添加到末尾

        offset += 12 + length
      }

      // Combine all chunks
      const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
      const result = new Uint8Array(totalLength)
      let resultOffset = 0

      for (const chunk of chunks) {
        result.set(chunk, resultOffset)
        resultOffset += chunk.length
      }

      // 新增验证和日志
      console.log("Generated chunks:", {
        totalChunks: chunks.length,
        lastChunkType: String.fromCharCode(...chunks[chunks.length - 1].slice(4, 8)),
        version: version,
        charaFound: chunks.some(
          (chunk) =>
            String.fromCharCode(...chunk.slice(4, 8)) === "tEXt" &&
            ((chunk[8] === 0x63 &&
              chunk[9] === 0x68 &&
              chunk[10] === 0x61 &&
              chunk[11] === 0x72 &&
              chunk[12] === 0x61) || // 'chara'
              (chunk[8] === 0x63 && chunk[9] === 0x63 && chunk[10] === 0x76 && chunk[11] === 0x33)), // 'ccv3'
        ),
      })

      if (chunks.length < 2 || String.fromCharCode(...chunks[chunks.length - 1].slice(4, 8)) !== "IEND") {
        throw new Error("Invalid chunk structure: IEND must be last chunk")
      }

      // 新增最终数据验证
      try {
        const parsedResult = Png.Parse(result.buffer)

        if (!parsedResult) {
          throw new Error("Failed to parse generated PNG")
        }

        console.log("Data validation result:", {
          version: version,
          dataType: parsedResult.type,
        })
      } catch (e) {
        console.error("Data validation failed:", e)
        // Don't throw an error here, just log it
        console.warn("PNG generation validation warning: " + e.message)
      }

      return result.buffer
    } catch (error) {
      console.error("Error generating PNG:", error)
      throw error
    }
  }
}

