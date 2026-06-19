import { checkApiKey, getServerProfile } from "@/lib/server/server-chat-helpers"
import { Database } from "@/supabase/types"
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import OpenAI from "openai"

export async function POST(request: Request) {
  try {
    const json = await request.json()
    const { graphId, fileIds, text, workspaceId, useLocal } = json as {
      graphId: string
      fileIds?: string[]
      text?: string
      workspaceId: string
      useLocal?: boolean
    }

    if (!graphId) {
      return new Response("Missing graphId parameter", { status: 400 })
    }

    const supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Retrieve server profile to load API keys
    const profile = await getServerProfile()

    let docText = ""

    if (text) {
      docText = text
    } else if (fileIds && fileIds.length > 0) {
      // Fetch file contents from the database
      const { data: fileItems, error: fileItemsError } = await supabaseAdmin
        .from("file_items")
        .select("content")
        .in("file_id", fileIds)

      if (fileItemsError) {
        throw fileItemsError
      }

      docText = fileItems?.map(item => item.content).join("\n\n") || ""
    } else {
      return new Response("Missing either text or fileIds parameters", { status: 400 })
    }

    if (!docText.trim()) {
      return new Response("No content found to extract concepts from", { status: 400 })
    }

    const systemPrompt = `You are an expert NLP concept extractor. Your task is to analyze the following educational text and extract a list of core concepts (nodes) and their prerequisite relationships (links).
Each concept should be a specific topic or subtopic.
Each relationship should represent a dependency (e.g. "Concept A is a prerequisite for Concept B" or "Concept A is a component of Concept B").

You MUST output your response in EXACTLY this JSON format:
{
  "nodes": [
    {
      "name": "Concept Name",
      "description": "Short explanation of the concept (1-2 sentences)",
      "color": "#3b82f6" // use a color like #3b82f6 (blue), #ef4444 (red), #10b981 (green), #f59e0b (yellow), #8b5cf6 (purple) to categorize
    }
  ],
  "links": [
    {
      "source_concept": "Concept Name of the prerequisite",
      "target_concept": "Concept Name of the dependent",
      "label": "requires" // relationship label
    }
  ]
}

Make sure the node names used in the links exactly match the names in the nodes list.
Do not include any explanation, markdown formatting, or text outside the JSON. Ensure the JSON is clean and valid.`

    const userPrompt = `Here is the educational text:\n\n${docText.substring(0, 10000)}\n\nExtract the concepts and relations in JSON format.`

    let completionText = ""
    let selectedProviderLog = ""

    /**
     * LOCAL-FIRST EXTRACTION DESIGN DECISION:
     * We run extraction using local Ollama (gemma2:2b) as the PRIMARY path.
     * Reasons:
     * 1. Cost: Zero cost for NLP parsing of documents/chat contexts.
     * 2. Privacy: Keeps student workspace data entirely local to their machine.
     * 3. Resiliency: No dependency on external cloud services or API key setup for the core graph visualization to function.
     */

    // 1. Primary path: Local Ollama (gemma2:2b)
    try {
      console.log("Attempting primary concept extraction with local Ollama (gemma2:2b)...")
      const ollamaUrl = process.env.OLLAMA_BASE_URL || process.env.NEXT_PUBLIC_OLLAMA_URL || "http://localhost:11434"
      const openaiClient = new OpenAI({
        apiKey: "ollama",
        baseURL: `${ollamaUrl}/v1`
      })
      const response = await openaiClient.chat.completions.create({
        model: "gemma2:2b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.1
      })
      completionText = response.choices[0]?.message?.content || ""
      selectedProviderLog = "Local Ollama (gemma2:2b)"
    } catch (err: any) {
      console.warn("Primary local Ollama extraction failed, checking fallback cloud options:", err.message)
    }

    // 2. Fallback Option A: DeepSeek Cloud API
    if (!completionText) {
      const deepseekKey = profile.deepseek_api_key || process.env.DEEPSEEK_API_KEY
      if (deepseekKey) {
        try {
          console.log("Attempting fallback concept extraction with DeepSeek Cloud...")
          const openaiClient = new OpenAI({
            apiKey: deepseekKey,
            baseURL: "https://api.deepseek.com/v1"
          })
          const response = await openaiClient.chat.completions.create({
            model: "deepseek-chat",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.1
          })
          completionText = response.choices[0]?.message?.content || ""
          selectedProviderLog = "DeepSeek Cloud API"
        } catch (err: any) {
          console.warn("DeepSeek fallback extraction failed:", err.message)
        }
      } else {
        console.log("Skipping DeepSeek fallback: No DeepSeek API Key provided.")
      }
    }

    // 3. Fallback Option B: OpenAI Cloud API
    if (!completionText) {
      const openaiKey = profile.openai_api_key || process.env.OPENAI_API_KEY
      if (openaiKey) {
        try {
          console.log("Attempting fallback concept extraction with OpenAI Cloud...")
          const openaiClient = new OpenAI({
            apiKey: openaiKey,
            organization: profile.openai_organization_id
          })
          const response = await openaiClient.chat.completions.create({
            model: "gpt-4-turbo",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.1
          })
          completionText = response.choices[0]?.message?.content || ""
          selectedProviderLog = "OpenAI Cloud API"
        } catch (err: any) {
          console.warn("OpenAI fallback extraction failed:", err.message)
        }
      } else {
        console.log("Skipping OpenAI fallback: No OpenAI API Key provided.")
      }
    }

    // If both local and fallbacks failed
    if (!completionText) {
      throw new Error("Concept extraction failed: Local Ollama is offline, and no valid fallback cloud credentials succeeded.")
    }

    // Clear logs indicating path served
    console.log(`[EXTRACTION COMPLETED] Served by: ${selectedProviderLog}`)
    console.log("LLM response content:", completionText)

    // Parse JSON safely
    let parsed: any = null
    try {
      parsed = JSON.parse(completionText.trim())
    } catch (e) {
      // Find the first { and last } to extract JSON block if model included extra text
      const startIdx = completionText.indexOf("{")
      const endIdx = completionText.lastIndexOf("}")
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const jsonSubstring = completionText.substring(startIdx, endIdx + 1)
        try {
          parsed = JSON.parse(jsonSubstring)
        } catch (subErr) {
          console.error("Failed parsing JSON substring:", jsonSubstring)
          throw new Error("Could not parse LLM output as JSON: " + completionText)
        }
      } else {
        throw new Error("No JSON object structure found in LLM output: " + completionText)
      }
    }

    if (!parsed) {
      throw new Error("Extracted JSON parsed to null or undefined")
    }

    // Flexible extraction keys for nodes and links
    const extractedNodes = 
      parsed.nodes || 
      parsed.Nodes || 
      parsed.concepts || 
      parsed.Concepts || 
      parsed.topics || 
      parsed.Topics || 
      []

    const extractedLinks = 
      parsed.links || 
      parsed.Links || 
      parsed.edges || 
      parsed.Edges || 
      parsed.relations || 
      parsed.Relations || 
      parsed.dependencies || 
      parsed.Dependencies || 
      []

    const nameToIdMap = new Map<string, string>()

    // Insert Nodes
    for (const node of extractedNodes) {
      const nodeName = node.name || node.concept || node.title || ""
      if (!nodeName) continue

      const { data: createdNode, error: nodeError } = await supabaseAdmin
        .from("graph_nodes")
        .insert({
          graph_id: graphId,
          name: nodeName,
          description: node.description || "",
          color: node.color || "#3b82f6",
          size: 15,
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100
        })
        .select("id, name")
        .single()

      if (nodeError) {
        console.error("Error creating node:", nodeError)
        continue
      }
      if (createdNode) {
        nameToIdMap.set(createdNode.name.toLowerCase().trim(), createdNode.id)
      }
    }

    // Insert Links
    for (const link of extractedLinks) {
      const sourceName = link.source_concept || link.source || link.from || ""
      const targetName = link.target_concept || link.target || link.to || ""
      const labelText = link.label || link.relation || link.relationship || ""

      if (sourceName && targetName) {
        const sourceId = nameToIdMap.get(sourceName.toLowerCase().trim())
        const targetId = nameToIdMap.get(targetName.toLowerCase().trim())

        if (sourceId && targetId) {
          const { error: linkError } = await supabaseAdmin
            .from("graph_links")
            .insert({
              graph_id: graphId,
              source_node_id: sourceId,
              target_node_id: targetId,
              label: labelText
            })

          if (linkError) {
            console.error("Error creating link:", linkError)
          }
        }
      }
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (error: any) {
    console.error("Graph extraction error:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
