import { Base64 } from "js-base64"

// Interface for character data
interface CharacterData {
  name: string
  gender?: string
  description?: string
  fullDescription?: string
  personality?: string
  scenario?: string
  exampleDialogue?: string
  creatorNotes?: string
  systemPrompt?: string
  postHistoryInstructions?: string
  alternateGreetings?: string[]
  tags?: string[]
  creator?: string
  characterVersion?: string
  firstMes?: string
  [key: string]: any
}

/**
 * Extracts character data from a PNG file
 * @param arrayBuffer The PNG file as an ArrayBuffer
 * @returns The extracted character data or null if none found
 */
export async function extractCharacterData(arrayBuffer: ArrayBuffer): Promise<CharacterData | null> {
  try {
    // Import the Png class dynamically to avoid server-side issues
    const { Png } = await import("./png")

    console.log("Starting character data extraction from PNG")

    // Parse the PNG file
    const result = Png.Parse(arrayBuffer)

    if (!result || !result.data) {
      console.warn("No character data found in PNG")
      return null
    }

    console.log("PNG data type:", result.type)
    console.log("Data starts with:", result.data.substring(0, 20))

    let jsonData: any = null

    // Process based on the type of data found
    if (result.type === "ccv3") {
      // ccv3 data is already decoded by the Png.Parse method
      try {
        jsonData = JSON.parse(result.data)
        console.log("Successfully parsed ccv3 data")
      } catch (e) {
        console.error("Error parsing ccv3 JSON data:", e)
        throw new Error("Invalid ccv3 character data format")
      }
    } else if (result.type === "chara") {
      // chara data is Base64 encoded
      try {
        const decodedData = Base64.decode(result.data)
        jsonData = JSON.parse(decodedData)
        console.log("Successfully decoded and parsed chara data")
      } catch (e) {
        console.error("Error decoding/parsing chara data:", e)
        throw new Error("Invalid chara character data format")
      }
    }

    if (!jsonData) {
      throw new Error("Failed to extract valid character data")
    }

    // Log the structure of the parsed data
    console.log("Parsed data structure:", Object.keys(jsonData))

    // Extract the actual character data
    const characterData = jsonData.data || jsonData
    console.log("Character data keys:", Object.keys(characterData))

    // Map the data to our CharacterData interface
    return {
      name: characterData.name || "",
      gender: characterData.gender || "",
      description: characterData.description || characterData.char_persona || "",
      fullDescription: characterData.personality || characterData.full_description || characterData.char_persona || "",
      personality: characterData.personality || characterData.char_persona || "",
      scenario: characterData.scenario || characterData.world_scenario || "",
      exampleDialogue: characterData.mes_example || characterData.example_dialogue || "",
      creatorNotes: characterData.creator_notes || "",
      systemPrompt: characterData.system_prompt || characterData.system || "",
      postHistoryInstructions: characterData.post_history_instructions || "",
      alternateGreetings: characterData.alternate_greetings || [],
      tags: characterData.tags || [],
      creator: characterData.creator || "",
      characterVersion: characterData.character_version || "",
      firstMes: characterData.first_mes || "",
    }
  } catch (error) {
    console.error("Error extracting character data:", error)
    throw new Error(`Failed to extract character data: ${error.message}`)
  }
}

/**
 * Mock implementation of the Png class for TypeScript type checking
 * The actual implementation will be imported dynamically at runtime
 */
export class Png {
  static Parse(arrayBuffer: ArrayBuffer): { type: string; data: string; assets?: any } | null {
    throw new Error("This is a mock implementation")
  }

  static Generate(originalImageData: ArrayBuffer, cardData: string, options?: any): ArrayBuffer {
    throw new Error("This is a mock implementation")
  }
}

