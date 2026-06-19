import { useContext, useEffect, useState, useRef } from "react"
import { ChatbotUIContext } from "@/context/context"
import {
  createGraphNode,
  updateGraphNode,
  deleteGraphNode,
  createGraphLink,
  deleteGraphLink,
  associateFileWithNode,
  disassociateFileFromNode,
  getGraphDetails
} from "@/db/knowledge-graphs"
import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { GraphNode, GraphLink } from "@/types/knowledge-graph"
import { Tables } from "@/supabase/types"
import { toast } from "sonner"

export const useKnowledgeGraph = () => {
  const {
    selectedGraph,
    setSelectedGraph,
    files,
    profile,
    selectedWorkspace,
    setNewMessageFiles,
    setUserInput,
    chatSettings,
    availableLocalModels
  } = useContext(ChatbotUIContext)

  const { handleNewChat, handleSendMessage } = useChatHandler()

  // SVG viewport transforms
  const [zoom, setZoom] = useState(1.0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })

  // Node Dragging State
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  // Selection Detail Sidebar
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)

  // Dialog forms
  const [isAddingNode, setIsAddingNode] = useState(false)
  const [newNodeName, setNewNodeName] = useState("")
  const [newNodeDesc, setNewNodeDesc] = useState("")
  const [newNodeColor, setNewNodeColor] = useState("#3b82f6")

  const [isAddingLink, setIsAddingLink] = useState(false)
  const [linkSource, setLinkSource] = useState("")
  const [linkTarget, setLinkTarget] = useState("")
  const [linkLabel, setLinkLabel] = useState("")

  // AI Extraction State
  const [isExtracting, setIsExtracting] = useState(false)
  const [selectedExtractFiles, setSelectedExtractFiles] = useState<string[]>([])

  const svgRef = useRef<SVGSVGElement>(null)

  // Deselect node on background click
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (
      e.target === e.currentTarget ||
      (e.target as Element).tagName === "svg" ||
      (e.target as Element).id === "grid-rect"
    ) {
      setSelectedNode(null)
    }
  }

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (
      e.button === 0 &&
      (e.target === e.currentTarget ||
        (e.target as Element).tagName === "svg" ||
        (e.target as Element).id === "grid-rect")
    ) {
      setIsPanning(true)
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      })
    } else if (draggedNode && selectedGraph) {
      if (!svgRef.current) return
      const rect = svgRef.current.getBoundingClientRect()
      // Convert screen coords to SVG coords taking pan and zoom into account
      const mouseX = (e.clientX - rect.left - pan.x) / zoom
      const mouseY = (e.clientY - rect.top - pan.y) / zoom

      setSelectedGraph({
        ...selectedGraph,
        nodes: selectedGraph.nodes.map(n =>
          n.id === draggedNode
            ? { ...n, x: mouseX - dragOffset.x, y: mouseY - dragOffset.y }
            : n
        )
      })
    }
  }

  const handleMouseUp = async () => {
    setIsPanning(false)
    if (draggedNode && selectedGraph) {
      const node = selectedGraph.nodes.find(n => n.id === draggedNode)
      if (node) {
        await updateGraphNode(node.id, { x: node.x, y: node.y })
      }
      setDraggedNode(null)
    }
  }

  // Node Drag Start
  const handleNodeMouseDown = (e: React.MouseEvent, node: GraphNode) => {
    e.stopPropagation()
    setSelectedNode(node)
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const mouseX = (e.clientX - rect.left - pan.x) / zoom
    const mouseY = (e.clientY - rect.top - pan.y) / zoom

    setDraggedNode(node.id)
    setDragOffset({
      x: mouseX - node.x,
      y: mouseY - node.y
    })
  }

  // Node CRUD
  const handleAddNode = async () => {
    if (!selectedGraph || !newNodeName.trim()) return
    try {
      const centerSVGX = -pan.x / zoom + 200
      const centerSVGY = -pan.y / zoom + 200

      const created = await createGraphNode({
        graph_id: selectedGraph.graph.id,
        name: newNodeName,
        description: newNodeDesc,
        color: newNodeColor,
        size: 15,
        x: centerSVGX,
        y: centerSVGY
      })

      const newNode: GraphNode = {
        id: created.id,
        graph_id: created.graph_id,
        name: created.name,
        description: created.description,
        color: created.color,
        size: created.size,
        x: created.x,
        y: created.y,
        files: []
      }

      setSelectedGraph({
        ...selectedGraph,
        nodes: [...selectedGraph.nodes, newNode]
      })

      setNewNodeName("")
      setNewNodeDesc("")
      setIsAddingNode(false)
      toast.success("Concept added successfully")
    } catch (e) {
      toast.error("Failed to add node")
    }
  }

  const handleDeleteNode = async (nodeId: string) => {
    if (!selectedGraph) return
    try {
      await deleteGraphNode(nodeId)
      setSelectedGraph({
        ...selectedGraph,
        nodes: selectedGraph.nodes.filter(n => n.id !== nodeId),
        links: selectedGraph.links.filter(
          l => l.source_node_id !== nodeId && l.target_node_id !== nodeId
        )
      })
      if (selectedNode?.id === nodeId) {
        setSelectedNode(null)
      }
      toast.success("Concept deleted")
    } catch (e) {
      toast.error("Failed to delete node")
    }
  }

  // Link CRUD
  const handleAddLink = async () => {
    if (!selectedGraph || !linkSource || !linkTarget) return
    if (linkSource === linkTarget) {
      toast.error("Cannot link a concept to itself")
      return
    }
    // Check duplication
    const exists = selectedGraph.links.some(
      l => l.source_node_id === linkSource && l.target_node_id === linkTarget
    )
    if (exists) {
      toast.error("Link already exists")
      return
    }

    try {
      const created = await createGraphLink({
        graph_id: selectedGraph.graph.id,
        source_node_id: linkSource,
        target_node_id: linkTarget,
        label: linkLabel
      })

      const newLink: GraphLink = {
        id: created.id,
        graph_id: created.graph_id,
        source_node_id: created.source_node_id,
        target_node_id: created.target_node_id,
        label: created.label
      }

      setSelectedGraph({
        ...selectedGraph,
        links: [...selectedGraph.links, newLink]
      })

      setLinkSource("")
      setLinkTarget("")
      setLinkLabel("")
      setIsAddingLink(false)
      toast.success("Connection added")
    } catch (e) {
      toast.error("Failed to create connection")
    }
  }

  const handleDeleteLink = async (linkId: string) => {
    if (!selectedGraph) return
    try {
      await deleteGraphLink(linkId)
      setSelectedGraph({
        ...selectedGraph,
        links: selectedGraph.links.filter(l => l.id !== linkId)
      })
      toast.success("Connection removed")
    } catch (e) {
      toast.error("Failed to remove link")
    }
  }

  // File association
  const handleToggleFile = async (fileId: string) => {
    if (!selectedNode || !selectedGraph || !profile) return
    const isLinked = selectedNode.files?.some(f => f.id === fileId)

    try {
      if (isLinked) {
        await disassociateFileFromNode(selectedNode.id, fileId)
        const updatedNode = {
          ...selectedNode,
          files: selectedNode.files?.filter(f => f.id !== fileId) || []
        }
        setSelectedNode(updatedNode)
        setSelectedGraph({
          ...selectedGraph,
          nodes: selectedGraph.nodes.map(n =>
            n.id === selectedNode.id ? updatedNode : n
          )
        })
        toast.success("File unlinked")
      } else {
        await associateFileWithNode(selectedNode.id, fileId, profile.user_id)
        const fileRecord = files.find(f => f.id === fileId)
        const updatedNode = {
          ...selectedNode,
          files: [...(selectedNode.files || []), fileRecord].filter(Boolean) as Tables<"files">[]
        }
        setSelectedNode(updatedNode)
        setSelectedGraph({
          ...selectedGraph,
          nodes: selectedGraph.nodes.map(n =>
            n.id === selectedNode.id ? updatedNode : n
          )
        })
        toast.success("File linked to concept")
      }
    } catch (e) {
      toast.error("Failed to map file")
    }
  }

  // Ask AI Helper
  const handleAskAI = async () => {
    if (!selectedNode) return
    // Gather linked files
    const associatedFiles = selectedNode.files || []
    const mappedFiles = associatedFiles.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      file: null
    }))

    await handleNewChat(true)

    setNewMessageFiles(mappedFiles)
    const promptText = `Please explain the concept of "${selectedNode.name}" in detail, referencing the attached files. Explain how it works and any relevant subtopics.`
    setUserInput(promptText)

    handleSendMessage(promptText, [], false, mappedFiles)
  }

  // Spring Physics Force Auto-Layout
  const runAutoLayout = () => {
    if (!selectedGraph || selectedGraph.nodes.length === 0) return

    let tempNodes = selectedGraph.nodes.map(n => ({ ...n }))
    const links = selectedGraph.links

    const width = 1000
    const height = 800
    const center = { x: width / 2, y: height / 2 }

    const kRepel = 12000 // Coulomb constant
    const kAttract = 0.04 // Spring stiffness
    const linkDistance = 150 // Desired edge length
    const centerGravity = 0.01

    // Run 100 iterations synchronously for instant neat layout
    for (let iter = 0; iter < 100; iter++) {
      // 1. Initialize forces
      const fx = new Array(tempNodes.length).fill(0)
      const fy = new Array(tempNodes.length).fill(0)

      // 2. Repulsion between all nodes
      for (let i = 0; i < tempNodes.length; i++) {
        for (let j = i + 1; j < tempNodes.length; j++) {
          const dx = tempNodes[i].x - tempNodes[j].x
          const dy = tempNodes[i].y - tempNodes[j].y
          const d2 = dx * dx + dy * dy + 0.1
          const d = Math.sqrt(d2)

          if (d < 600) {
            const force = kRepel / d2
            const fX = (dx / d) * force
            const fY = (dy / d) * force

            fx[i] += fX
            fy[i] += fY
            fx[j] -= fX
            fy[j] -= fY
          }
        }
      }

      // 3. Attraction along edges
      for (const link of links) {
        const i = tempNodes.findIndex(n => n.id === link.source_node_id)
        const j = tempNodes.findIndex(n => n.id === link.target_node_id)
        if (i === -1 || j === -1) continue

        const dx = tempNodes[i].x - tempNodes[j].x
        const dy = tempNodes[i].y - tempNodes[j].y
        const d = Math.sqrt(dx * dx + dy * dy) + 0.1

        const force = kAttract * (d - linkDistance)
        const fX = (dx / d) * force
        const fY = (dy / d) * force

        fx[i] -= fX
        fy[i] -= fY
        fx[j] += fX
        fy[j] += fY
      }

      // 4. Gravity towards center
      for (let i = 0; i < tempNodes.length; i++) {
        fx[i] -= (tempNodes[i].x - center.x) * centerGravity
        fy[i] -= (tempNodes[i].y - center.y) * centerGravity
      }

      // 5. Update positions with small multiplier
      for (let i = 0; i < tempNodes.length; i++) {
        tempNodes[i].x += fx[i] * 0.5
        tempNodes[i].y += fy[i] * 0.5
      }
    }

    // Update state
    setSelectedGraph({
      ...selectedGraph,
      nodes: tempNodes
    })

    // Bulk save coordinates to database
    tempNodes.forEach(async node => {
      await updateGraphNode(node.id, { x: node.x, y: node.y })
    })

    toast.success("Auto-layout completed and saved")
  }

  // AI Concept Extraction triggering backend NLP extraction
  const handleAIConceptExtraction = async () => {
    if (!selectedGraph || selectedExtractFiles.length === 0 || !selectedWorkspace) return
    setIsExtracting(true)
    try {
      const useLocal = availableLocalModels.some(m => m.modelId === chatSettings?.model)

      const response = await fetch("/api/chat/extract-graph", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          graphId: selectedGraph.graph.id,
          fileIds: selectedExtractFiles,
          workspaceId: selectedWorkspace.id,
          useLocal
        })
      })

      if (!response.ok) {
        throw new Error(await response.text())
      }

      // Reload graph details
      const reloaded = await getGraphDetails(selectedGraph.graph.id)
      if (reloaded) {
        setSelectedGraph(reloaded)
      }
      setIsExtracting(false)
      setSelectedExtractFiles([])
      toast.success("Concepts extracted successfully!")
    } catch (e) {
      toast.error(`Extraction failed: ${e}`)
      setIsExtracting(false)
    }
  }

  // Initial centering layout
  const resetFocus = () => {
    setZoom(1.0)
    setPan({ x: 50, y: 50 })
  }

  useEffect(() => {
    resetFocus()
  }, [selectedGraph?.graph.id])

  return {
    selectedGraph,
    setSelectedGraph,
    files,
    selectedNode,
    setSelectedNode,
    zoom,
    setZoom,
    pan,
    setPan,
    isPanning,
    draggedNode,
    dragOffset,
    svgRef,
    isAddingNode,
    setIsAddingNode,
    newNodeName,
    setNewNodeName,
    newNodeDesc,
    setNewNodeDesc,
    newNodeColor,
    setNewNodeColor,
    isAddingLink,
    setIsAddingLink,
    linkSource,
    setLinkSource,
    linkTarget,
    setLinkTarget,
    linkLabel,
    setLinkLabel,
    isExtracting,
    selectedExtractFiles,
    setSelectedExtractFiles,
    handleBackgroundClick,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleNodeMouseDown,
    handleAddNode,
    handleDeleteNode,
    handleAddLink,
    handleDeleteLink,
    handleToggleFile,
    handleAskAI,
    runAutoLayout,
    handleAIConceptExtraction,
    resetFocus
  }
}
