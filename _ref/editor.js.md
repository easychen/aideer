"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Upload, Save, X, RefreshCw, Download, FileUp, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { extractCharacterData } from "@/lib/png-processor"
import { useLanguage } from "@/contexts/language-context"

interface CharacterEditorProps {
  character?: any
  onClose: () => void
}

export function CharacterEditor({ character, onClose }: CharacterEditorProps) {
  const { t } = useLanguage()
  const [activeTab, setActiveTab] = useState("basic")
  const [imagePreview, setImagePreview] = useState(character?.image || "/placeholder.svg?height=400&width=300")
  const [characterData, setCharacterData] = useState({
    name: character?.name || "",
    gender: character?.gender || "",
    intro: character?.description || "",
    description: character?.fullDescription || "",
    personality: character?.personality || "",
    background: character?.scenario || "",
    dialogue: character?.exampleDialogue || "",
    creatorNotes: character?.creatorNotes || "",
    systemPrompt: character?.systemPrompt || "",
    postHistoryInstructions: character?.postHistoryInstructions || "",
    alternateGreetings: character?.alternateGreetings || [],
    tags: character?.tags || [],
    creator: character?.creator || "",
    characterVersion: character?.characterVersion || "",
    firstMes: character?.firstMes || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const jsonFileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Debug: Log characterData changes
  useEffect(() => {
    console.log("Character data updated:", characterData)
  }, [characterData])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      console.log("Processing file:", file.name)

      // Read the file as an ArrayBuffer for PNG processing
      const arrayBuffer = await file.arrayBuffer()
      console.log("File read as ArrayBuffer, size:", arrayBuffer.byteLength)

      // Create a URL for image preview
      const imageUrl = URL.createObjectURL(file)
      setImagePreview(imageUrl)

      // Extract character data from PNG
      console.log("Attempting to extract character data...")
      const extractedData = await extractCharacterData(arrayBuffer)

      if (extractedData) {
        console.log("Character data extracted successfully:", extractedData)

        // Update form with extracted data
        setCharacterData({
          name: extractedData.name || "",
          gender: extractedData.gender || "",
          intro: extractedData.description || "",
          description: extractedData.fullDescription || "",
          personality: extractedData.personality || "",
          background: extractedData.scenario || "",
          dialogue: extractedData.exampleDialogue || "",
          creatorNotes: extractedData.creatorNotes || "",
          systemPrompt: extractedData.systemPrompt || "",
          postHistoryInstructions: extractedData.postHistoryInstructions || "",
          alternateGreetings: extractedData.alternateGreetings || [],
          tags: extractedData.tags || [],
          creator: extractedData.creator || "",
          characterVersion: extractedData.characterVersion || "",
          firstMes: extractedData.firstMes || "",
        })

        toast({
          title: "Character data extracted",
          description: `Successfully loaded character: ${extractedData.name}`,
        })
      } else {
        console.log("No character data found in the image")
        // If no character data was found, just update the image
        toast({
          title: "Image uploaded",
          description: "No character data was found in this image.",
        })
      }
    } catch (err) {
      console.error("Error processing PNG:", err)
      setError(`Failed to extract character data: ${err.message || "Unknown error"}`)
      toast({
        title: "Error",
        description: "Failed to process the character card.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | string[]) => {
    setCharacterData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click()
  }

  const triggerJsonFileUpload = () => {
    jsonFileInputRef.current?.click()
  }

  const handleJsonFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      // Read the JSON file
      const jsonText = await file.text()
      const jsonData = JSON.parse(jsonText)

      console.log("Imported JSON data:", jsonData)

      // Extract the character data from the JSON
      const cardData = jsonData.data || jsonData

      if (!cardData) {
        throw new Error("Invalid JSON format: missing character data")
      }

      // Update form with imported data
      setCharacterData({
        name: cardData.name || "",
        gender: cardData.gender || "",
        intro: cardData.description || "",
        description: cardData.personality || cardData.full_description || "",
        personality: cardData.personality || "",
        background: cardData.scenario || "",
        dialogue: cardData.mes_example || "",
        creatorNotes: cardData.creator_notes || "",
        systemPrompt: cardData.system_prompt || "",
        postHistoryInstructions: cardData.post_history_instructions || "",
        alternateGreetings: cardData.alternate_greetings || [],
        tags: cardData.tags || [],
        creator: cardData.creator || "",
        characterVersion: cardData.character_version || "",
        firstMes: cardData.first_mes || "",
      })

      toast({
        title: "JSON Imported",
        description: `Successfully imported character: ${cardData.name}`,
      })
    } catch (err) {
      console.error("Error importing JSON:", err)
      setError(`Failed to import JSON: ${err.message || "Unknown error"}`)
      toast({
        title: "Error",
        description: "Failed to import JSON file.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      // Reset the file input
      if (jsonFileInputRef.current) {
        jsonFileInputRef.current.value = ""
      }
    }
  }

  const exportAsJson = () => {
    if (!characterData.name) {
      toast({
        title: "错误",
        description: "请输入角色名称",
        variant: "destructive",
      })
      return
    }

    try {
      // Prepare character card data in the expected format
      const cardData = {
        spec: "chara_card_v2",
        spec_version: "2.0",
        data: {
          name: characterData.name,
          gender: characterData.gender,
          description: characterData.intro,
          personality: characterData.personality,
          scenario: characterData.background,
          mes_example: characterData.dialogue,
          creator_notes: characterData.creatorNotes,
          system_prompt: characterData.systemPrompt,
          post_history_instructions: characterData.postHistoryInstructions,
          alternate_greetings: characterData.alternateGreetings,
          tags: characterData.tags,
          creator: characterData.creator,
          character_version: characterData.characterVersion,
          first_mes: characterData.firstMes,
          extensions: {},
        },
      }

      // Convert to JSON string with pretty formatting
      const jsonString = JSON.stringify(cardData, null, 2)

      // Create a blob and download link
      const blob = new Blob([jsonString], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${characterData.name}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "成功",
        description: "角色卡JSON已导出",
      })
    } catch (err) {
      console.error("Error exporting JSON:", err)
      toast({
        title: "错误",
        description: "导出JSON失败: " + (err instanceof Error ? err.message : String(err)),
        variant: "destructive",
      })
    }
  }

  const generateAndDownloadPng = async () => {
    if (!imagePreview) {
      toast({
        title: "错误",
        description: "请先上传角色图片",
        variant: "destructive",
      })
      return
    }

    if (!characterData.name) {
      toast({
        title: "错误",
        description: "请输入角色名称",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Prepare character card data in the expected format
      const cardData = {
        spec: "chara_card_v2",
        spec_version: "2.0",
        data: {
          name: characterData.name,
          gender: characterData.gender,
          description: characterData.intro,
          personality: characterData.personality,
          scenario: characterData.background,
          mes_example: characterData.dialogue,
          creator_notes: characterData.creatorNotes,
          system_prompt: characterData.systemPrompt,
          post_history_instructions: characterData.postHistoryInstructions,
          alternate_greetings: characterData.alternateGreetings,
          tags: characterData.tags,
          creator: characterData.creator,
          character_version: characterData.characterVersion,
          first_mes: characterData.firstMes,
          extensions: {},
        },
      }

      console.log("Preparing to generate PNG with character data:", cardData)

      // Import the Png class
      const { Png } = await import("@/lib/png")
      const { Base64 } = await import("js-base64")

      // Fetch the current image
      const response = await fetch(imagePreview)
      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()

      // Convert card data to Base64-encoded JSON string
      const cardDataJson = JSON.stringify(cardData)
      const encodedCardData = Base64.encode(cardDataJson)

      // Generate the new PNG with embedded character data
      // Pass 'v2' as the version to use the 'chara' format
      const newImageData = Png.Generate(arrayBuffer, encodedCardData, { version: "v2" })

      // Create a download link
      const newBlob = new Blob([newImageData], { type: "image/png" })
      const url = URL.createObjectURL(newBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${characterData.name}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast({
        title: "成功",
        description: "角色卡已生成并下载",
      })
    } catch (err) {
      console.error("Error generating PNG:", err)
      setError(`生成角色卡失败: ${err.message || "未知错误"}`)
      toast({
        title: "错误",
        description: "生成角色卡失败: " + (err instanceof Error ? err.message : String(err)),
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    // Show confirmation dialog
    const confirmed = window.confirm(t("app.editor.confirmCancel"))
    if (confirmed) {
      onClose()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      <div className="container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="rounded-full bg-gray-800 hover:bg-gray-700"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-blue-400">
              {character ? t("app.editor.title.edit") : t("app.editor.title.create")}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white"
              onClick={handleCancel}
            >
              <X className="mr-2 h-4 w-4" />
              {t("app.editor.cancel")}
            </Button>
            <Button
              className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700"
              onClick={generateAndDownloadPng}
              disabled={isLoading}
            >
              <Save className="mr-2 h-4 w-4" />
              {t("app.editor.save")}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6 bg-red-900/50 border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Image Upload */}
          <Card className="bg-gray-800/50 border-0 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white mb-4">{t("app.editor.image.title")}</h2>

                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-full aspect-[3/4] mb-4 overflow-hidden rounded-lg border border-gray-700 bg-gray-900/50">
                    {isLoading && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500 mb-3"></div>
                          <p className="text-violet-400">Processing character card...</p>
                        </div>
                      </div>
                    )}
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Character preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        className="text-white bg-black/50 hover:bg-black/70"
                        onClick={triggerFileUpload}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {t("app.editor.image.change")}
                      </Button>
                    </div>
                  </div>

                  <div className="w-full">
                    <Button
                      variant="outline"
                      className="w-full border-gray-700 bg-gray-800 hover:bg-gray-700 text-white"
                      onClick={triggerFileUpload}
                      disabled={isLoading}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {t("app.editor.image.upload")}
                      <input
                        ref={fileInputRef}
                        id="image-upload"
                        type="file"
                        accept="image/png"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={isLoading}
                      />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-200 mb-3">{t("app.editor.import.title")}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-gray-700 bg-gray-800 hover:bg-gray-700 text-white"
                    disabled={isLoading}
                    onClick={triggerJsonFileUpload}
                  >
                    <FileUp className="mr-2 h-4 w-4" />
                    {t("app.editor.import.json")}
                    <input
                      ref={jsonFileInputRef}
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={handleJsonFileUpload}
                      disabled={isLoading}
                    />
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-700 bg-gray-800 hover:bg-gray-700 text-white"
                    disabled={isLoading}
                    onClick={exportAsJson}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t("app.editor.export.json")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Character Details */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800/50 border-0 shadow-lg">
              <CardContent className="p-6">
                <Tabs defaultValue="basic" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-2 bg-gray-900/50 mb-6">
                    <TabsTrigger
                      value="basic"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                    >
                      {t("app.editor.tabs.basic")}
                    </TabsTrigger>
                    <TabsTrigger
                      value="story"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-blue-600 data-[state=active]:text-white"
                    >
                      {t("app.editor.tabs.story")}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-6 mt-0">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                          {t("app.editor.fields.name")}
                        </label>
                        <Input
                          id="name"
                          placeholder={t("app.editor.fields.name")}
                          value={characterData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          className="bg-gray-900/50 border-gray-700 focus:border-violet-500 text-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="gender" className="block text-sm font-medium text-gray-300 mb-1">
                          {t("app.editor.fields.gender")}
                        </label>
                        <Select
                          value={characterData.gender}
                          onValueChange={(value) => handleInputChange("gender", value)}
                        >
                          <SelectTrigger className="bg-gray-900/50 border-gray-700 focus:border-violet-500 text-white">
                            <SelectValue placeholder={t("app.editor.fields.gender")} />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 border-gray-700 text-white">
                            <SelectItem value="male">{t("app.editor.fields.gender.male")}</SelectItem>
                            <SelectItem value="female">{t("app.editor.fields.gender.female")}</SelectItem>
                            <SelectItem value="other">{t("app.editor.fields.gender.other")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label htmlFor="intro" className="block text-sm font-medium text-gray-300 mb-1">
                          {t("app.editor.fields.intro")}
                        </label>
                        <Textarea
                          id="intro"
                          placeholder={t("app.editor.fields.intro")}
                          value={characterData.intro}
                          onChange={(e) => handleInputChange("intro", e.target.value)}
                          className="bg-gray-900/50 border-gray-700 focus:border-violet-500 text-white min-h-[100px]"
                        />
                      </div>

                      <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
                          {t("app.editor.fields.description")}
                        </label>
                        <Textarea
                          id="description"
                          placeholder={t("app.editor.fields.description")}
                          value={characterData.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          className="bg-gray-900/50 border-gray-700 focus:border-violet-500 text-white min-h-[100px]"
                        />
                      </div>

                      <div>
                        <label htmlFor="personality" className="block text-sm font-medium text-gray-300 mb-1">
                          {t("app.editor.fields.personality")}
                        </label>
                        <Textarea
                          id="personality"
                          placeholder={t("app.editor.fields.personality")}
                          value={characterData.personality}
                          onChange={(e) => handleInputChange("personality", e.target.value)}
                          className="bg-gray-900/50 border-gray-700 focus:border-violet-500 text-white min-h-[100px]"
                        />
                      </div>

                      <div>
                        <label htmlFor="creator" className="block text-sm font-medium text-gray-300 mb-1">
                          {t("app.editor.fields.creator")}
                        </label>
                        <Input
                          id="creator"
                          placeholder={t("app.editor.fields.creator")}
                          value={characterData.creator}
                          onChange={(e) => handleInputChange("creator", e.target.value)}
                          className="bg-gray-900/50 border-gray-700 focus:border-violet-500 text-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="characterVersion" className="block text-sm font-medium text-gray-300 mb-1">
                          {t("app.editor.fields.version")}
                        </label>
                        <Input
                          id="characterVersion"
                          placeholder={t("app.editor.fields.version")}
                          value={characterData.characterVersion}
                          onChange={(e) => handleInputChange("characterVersion", e.target.value)}
                          className="bg-gray-900/50 border-gray-700 focus:border-violet-500 text-white"
                        />
                      </div>

                      <div>
                        <label htmlFor="tags" className="block text-sm font-medium text-gray-300 mb-1">
                          {t("app.editor.fields.tags")}
                        </label>
                        <Input
                          id="tags"
                          placeholder={t("app.editor.fields.tags")}
                          value={Array.isArray(characterData.tags) ? characterData.tags.join(", ") : ""}
                          onChange={(e) =>
                            handleInputChange(
                              "tags",
                              e.target.value
                                .split(",")
                                .map((tag) => tag.trim())
                                .filter(Boolean),
                            )
                          }
                          className="bg-gray-900/50 border-gray-700 focus:border-violet-500 text-white"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="story" className="space-y-6 mt-0">
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="background" className="block text-sm font-medium text-gray-300 mb-1">
                          {t("app.editor.fields.background")}
                        </label>
                        <Textarea
                          id="background"
                          placeholder={t("app.editor.fields.background")}
                          value={characterData.background}
                          onChange={(e) => handleInputChange("background", e.target.value)}
                          className="bg-gray-900/50 border-gray-700 focus:border-violet-500 text-white min-h-[100px]"
                        />
                      </div>

                      <div>
                        <label htmlFor="dialogue" className="block text-sm font-medium text-gray-300 mb-1">
                          {t("app.editor.fields.dialogue")}
                        </label>
                        <Textarea
                          id="dialogue"
                          placeholder={t("app.editor.fields.dialogue")}
                          value={characterData.dialogue}
                          onChange={(e) => handleInputChange("dialogue", e.target.value)}
                          className="bg-gray-900/50 border-gray-700 focus:border-violet-500 text-white min-h-[100px]"
                        />
                      </div>

                      <div>
                        <label htmlFor="creator-notes" className="block text-sm font-medium text-gray-300 mb-1">
                          {t("app.editor.fields.creatorNotes")}
                        </label>
                        <Textarea
                          id="creator-notes"
                          placeholder={t("app.editor.fields.creatorNotes")}
                          value={characterData.creatorNotes}
                          onChange={(e) => handleInputChange("creatorNotes", e.target.value)}
                          className="bg-gray-900/50 border-gray-700 focus:border-violet-500 text-white min-h-[100px]"
                        />
                      </div>

                      <div>
                        <label htmlFor="system-prompt" className="block text-sm font-medium text-gray-300 mb-1">
                          {t("app.editor.fields.systemPrompt")}
                        </label>
                        <Textarea
                          id="system-prompt"
                          placeholder={t("app.editor.fields.systemPrompt")}
                          value={characterData.systemPrompt}
                          onChange={(e) => handleInputChange("systemPrompt", e.target.value)}
                          className="bg-gray-900/50 border-gray-700 focus:border-violet-500 text-white min-h-[100px]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="post-history-instructions"
                          className="block text-sm font-medium text-gray-300 mb-1"
                        >
                          {t("app.editor.fields.postHistoryInstructions")}
                        </label>
                        <Textarea
                          id="post-history-instructions"
                          placeholder={t("app.editor.fields.postHistoryInstructions")}
                          value={characterData.postHistoryInstructions}
                          onChange={(e) => handleInputChange("postHistoryInstructions", e.target.value)}
                          className="bg-gray-900/50 border-gray-700 focus:border-violet-500 text-white min-h-[100px]"
                        />
                      </div>

                      <div>
                        <label htmlFor="first-mes" className="block text-sm font-medium text-gray-300 mb-1">
                          {t("app.editor.fields.firstMes")}
                        </label>
                        <Textarea
                          id="first-mes"
                          placeholder={t("app.editor.fields.firstMes")}
                          value={characterData.firstMes}
                          onChange={(e) => handleInputChange("firstMes", e.target.value)}
                          className="bg-gray-900/50 border-gray-700 focus:border-violet-500 text-white min-h-[100px]"
                        />
                      </div>

                      <div>
                        <label htmlFor="alternate-greetings" className="block text-sm font-medium text-gray-300 mb-1">
                          {t("app.editor.fields.alternateGreetings")}
                        </label>
                        <Textarea
                          id="alternate-greetings"
                          placeholder={t("app.editor.fields.alternateGreetings")}
                          value={
                            Array.isArray(characterData.alternateGreetings)
                              ? characterData.alternateGreetings.join("\n")
                              : ""
                          }
                          onChange={(e) =>
                            handleInputChange(
                              "alternateGreetings",
                              e.target.value
                                .split("\n")
                                .map((greeting) => greeting.trim())
                                .filter(Boolean),
                            )
                          }
                          className="bg-gray-900/50 border-gray-700 focus:border-violet-500 text-white min-h-[100px]"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

