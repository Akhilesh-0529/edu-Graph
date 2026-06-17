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
import { Tables } from "@/supabase/types"
import { GraphNode, GraphLink } from "@/types/knowledge-graph"
import {
  IconPlus,
  IconArrowRight,
  IconTrash,
  IconHierarchy,
  IconFile,
  IconSparkles,
  IconMessage2,
  IconZoomIn,
  IconZoomOut,
  IconFocus2,
  IconSettings,
  IconX
} from "@tabler/icons-react"
import { FC, useContext, useEffect, useState, useRef } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "../ui/dialog"
import { toast } from "sonner"

export const KnowledgeGraphView: FC = () => {
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

  const { handleNewChat } = useChatHandler()

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
    if (e.target === e.currentTarget || (e.target as Element).tagName === "svg" || (e.target as Element).id === "grid-rect") {
      setSelectedNode(null)
    }
  }

  // Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (e.target === e.currentTarget || (e.target as Element).tagName === "svg" || (e.target as Element).id === "grid-rect")) {
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
  const handleAskAI = () => {
    if (!selectedNode) return
    // Gather linked files
    const associatedFiles = selectedNode.files || []
    const mappedFiles = associatedFiles.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      file: null
    }))

    setNewMessageFiles(mappedFiles)
    setUserInput(
      `Please explain the concept of "${selectedNode.name}" in detail, referencing the attached files. Explain how it works and any relevant subtopics.`
    )
    handleNewChat()
  }

  // Spring Physics Force Auto-Layout
  const runAutoLayout = () => {
    if (!selectedGraph || selectedGraph.nodes.length === 0) return

    let tempNodes = selectedGraph.nodes.map(n => ({ ...n }))
    const links = selectedGraph.links

    const width = 600
    const height = 400
    const center = { x: width / 2, y: height / 2 }

    const kRepel = 2500 // Coulomb constant
    const kAttract = 0.05 // Spring stiffness
    const linkDistance = 120 // Desired edge length
    const centerGravity = 0.01

    // Run 80 iterations synchronously for instant neat layout
    for (let iter = 0; iter < 80; iter++) {
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

          if (d < 300) {
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

  if (!selectedGraph) return null

  const nodeMap = new Map(selectedGraph.nodes.map(n => [n.id, n]))

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {/* MAIN VIEW AREA */}
      <div
        className="relative flex-1 h-full select-none"
        onClick={handleBackgroundClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {/* TOP TOOLBAR */}
        <div className="absolute left-4 top-4 z-10 flex items-center space-x-2 rounded-xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-md">
          <div className="px-3 py-1 text-sm font-semibold text-white/90">
            {selectedGraph.graph.name}
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* ADD CONCEPT BUTTON */}
          <Dialog open={isAddingNode} onOpenChange={setIsAddingNode}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2.5 text-xs text-white/80 hover:text-white">
                <IconPlus size={14} /> Add Concept
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Educational Concept</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g. Photosynthesis"
                    value={newNodeName}
                    onChange={e => setNewNodeName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Description</Label>
                  <Input
                    placeholder="Explain the concept in a sentence or two..."
                    value={newNodeDesc}
                    onChange={e => setNewNodeDesc(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Category Color</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    {["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"].map(c => (
                      <button
                        key={c}
                        className={`size-6 rounded-full border-2 transition-transform ${newNodeColor === c ? "scale-110 border-white" : "border-transparent"}`}
                        style={{ backgroundColor: c }}
                        onClick={() => setNewNodeColor(c)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAddingNode(false)}>Cancel</Button>
                <Button onClick={handleAddNode}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ADD CONNECTION BUTTON */}
          <Dialog open={isAddingLink} onOpenChange={setIsAddingLink}>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2.5 text-xs text-white/80 hover:text-white">
                <IconArrowRight size={14} /> Connect
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Concept Relation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1">
                  <Label>Source Concept (Prerequisite)</Label>
                  <select
                    className="w-full rounded border border-input bg-background p-2"
                    value={linkSource}
                    onChange={e => setLinkSource(e.target.value)}
                  >
                    <option value="">Select concept...</option>
                    {selectedGraph.nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Target Concept (Subsequent)</Label>
                  <select
                    className="w-full rounded border border-input bg-background p-2"
                    value={linkTarget}
                    onChange={e => setLinkTarget(e.target.value)}
                  >
                    <option value="">Select concept...</option>
                    {selectedGraph.nodes.map(n => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Relationship Label (optional)</Label>
                  <Input
                    placeholder="e.g. requires, leads to, is type of"
                    value={linkLabel}
                    onChange={e => setLinkLabel(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAddingLink(false)}>Cancel</Button>
                <Button onClick={handleAddLink}>Connect</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* AI EXTRACT CONCEPTS */}
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-900/20">
                <IconSparkles size={14} /> AI Extract
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Auto-Extract Concepts from Documents</DialogTitle>
              </DialogHeader>
              <div className="py-3">
                <p className="text-xs text-muted-foreground mb-4">
                  Select documents uploaded to this workspace. The AI will parse them, discover key educational concepts, map their dependency links, and add them directly to this graph.
                </p>
                <Label>Select Workspace Files</Label>
                <div className="max-h-48 overflow-y-auto border border-white/10 rounded mt-1.5 p-2 space-y-1 bg-black/20">
                  {files.length === 0 ? (
                    <div className="text-center text-xs italic text-muted-foreground p-4">
                      No files uploaded. Upload files first.
                    </div>
                  ) : (
                    files.map(f => {
                      const isSelected = selectedExtractFiles.includes(f.id)
                      return (
                        <div
                          key={f.id}
                          className="flex items-center space-x-2 p-1.5 rounded hover:bg-white/5 cursor-pointer text-sm"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedExtractFiles(prev => prev.filter(id => id !== f.id))
                            } else {
                              setSelectedExtractFiles(prev => [...prev, f.id])
                            }
                          }}
                        >
                          <input type="checkbox" checked={isSelected} readOnly />
                          <IconFile size={16} className="text-blue-400" />
                          <span className="truncate flex-1">{f.name}</span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" disabled={isExtracting} onClick={() => setSelectedExtractFiles([])}>Clear</Button>
                <Button disabled={isExtracting || selectedExtractFiles.length === 0} onClick={handleAIConceptExtraction}>
                  {isExtracting ? "Extracting..." : "Run AI Extraction"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 gap-1.5 px-2.5 text-xs text-green-400 hover:text-green-300 hover:bg-green-900/20"
            onClick={runAutoLayout}
          >
            <IconHierarchy size={14} /> Align Graph
          </Button>
        </div>

        {/* BOTTOM LEFT NAVIGATION CONTROLS */}
        <div className="absolute bottom-4 left-4 z-10 flex flex-col space-y-1 rounded-xl border border-white/10 bg-black/40 p-1 backdrop-blur-md">
          <Button size="icon" variant="ghost" className="size-8 text-white/80 hover:text-white" onClick={() => setZoom(z => Math.min(z + 0.1, 2))}>
            <IconZoomIn size={18} />
          </Button>
          <Button size="icon" variant="ghost" className="size-8 text-white/80 hover:text-white" onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}>
            <IconZoomOut size={18} />
          </Button>
          <Button size="icon" variant="ghost" className="size-8 text-white/80 hover:text-white" onClick={resetFocus}>
            <IconFocus2 size={18} />
          </Button>
        </div>

        {/* INTERACTIVE GRAPH CANVAS */}
        <svg
          ref={svgRef}
          className="size-full bg-slate-950/40"
          style={{ cursor: isPanning ? "grabbing" : "default" }}
        >
          {/* Grid Background Pattern */}
          <defs>
            <pattern
              id="grid"
              width={40}
              height={40}
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(255, 255, 255, 0.03)"
                strokeWidth="1"
              />
            </pattern>
            {/* Arrow Marker */}
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="28"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(255, 255, 255, 0.2)" />
            </marker>
          </defs>

          {/* Background grid representation */}
          <rect
            id="grid-rect"
            width="100%"
            height="100%"
            fill="url(#grid)"
          />

          {/* Transformation Group */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* 1. RENDER LINKS */}
            {selectedGraph.links.map(link => {
              const src = nodeMap.get(link.source_node_id)
              const tgt = nodeMap.get(link.target_node_id)
              if (!src || !tgt) return null

              return (
                <g key={link.id} className="group">
                  <line
                    x1={src.x}
                    y1={src.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="2"
                    markerEnd="url(#arrow)"
                    className="transition-colors group-hover:stroke-blue-500/50"
                  />
                  {/* Hover Delete Link button */}
                  <foreignObject
                    x={(src.x + tgt.x) / 2 - 10}
                    y={(src.y + tgt.y) / 2 - 10}
                    width="20"
                    height="20"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <button
                      className="size-5 rounded-full bg-red-900 border border-red-500 flex items-center justify-center text-white text-[10px] hover:bg-red-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteLink(link.id)
                      }}
                    >
                      <IconX size={8} />
                    </button>
                  </foreignObject>

                  {/* Optional Label */}
                  {link.label && (
                    <text
                      x={(src.x + tgt.x) / 2}
                      y={(src.y + tgt.y) / 2 - 6}
                      fill="rgba(255, 255, 255, 0.4)"
                      fontSize="9"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {link.label}
                    </text>
                  )}
                </g>
              )
            })}

            {/* 2. RENDER NODES */}
            {selectedGraph.nodes.map(node => {
              const isSelected = selectedNode?.id === node.id
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  onMouseDown={e => handleNodeMouseDown(e, node)}
                >
                  {/* Glow ring */}
                  {isSelected && (
                    <circle
                      r={node.size + 6}
                      fill="none"
                      stroke={node.color}
                      strokeWidth="2"
                      strokeDasharray="4 2"
                      className="animate-spin"
                      style={{ animationDuration: "12s" }}
                    />
                  )}

                  {/* Main Circle */}
                  <circle
                    r={node.size}
                    fill={node.color}
                    className="transition-all hover:scale-115 duration-200"
                    style={{
                      filter: `drop-shadow(0 0 8px ${node.color}80)`
                    }}
                  />

                  {/* Inner design dot */}
                  <circle r="4" fill="white" opacity="0.8" />

                  {/* Node Name */}
                  <text
                    y={node.size + 14}
                    fill="white"
                    fontSize="11"
                    fontWeight="600"
                    textAnchor="middle"
                    style={{
                      textShadow: "0 1px 4px rgba(0,0,0,0.8)"
                    }}
                    className="pointer-events-none"
                  >
                    {node.name}
                  </text>
                </g>
              )
            })}
          </g>
        </svg>
      </div>

      {/* NODE DETAILS SIDEBAR PANEL */}
      {selectedNode && (
        <div className="w-[320px] h-full border-l border-white/10 bg-black/40 backdrop-blur-md flex flex-col p-5 overflow-y-auto animate-in slide-in-from-right duration-250">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="size-3.5 rounded-full" style={{ backgroundColor: selectedNode.color }} />
              Concept Details
            </h3>
            <Button
              size="icon"
              variant="ghost"
              className="size-7 rounded-full text-white/50 hover:text-white"
              onClick={() => setSelectedNode(null)}
            >
              <IconX size={16} />
            </Button>
          </div>

          <div className="mt-4 space-y-4 flex-1">
            {/* Title / Description */}
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Concept Name</Label>
              <div className="text-xl font-bold text-white/90 mt-0.5">{selectedNode.name}</div>
            </div>

            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Summary Description</Label>
              <p className="text-sm text-white/70 mt-1 leading-relaxed bg-white/5 rounded-lg p-3 border border-white/5">
                {selectedNode.description || "No description provided for this concept."}
              </p>
            </div>

            {/* Document Mappings */}
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Associated Documents</Label>
              <div className="mt-2 space-y-1.5">
                {selectedNode.files && selectedNode.files.length > 0 ? (
                  selectedNode.files.map(f => (
                    <div key={f.id} className="flex items-center justify-between bg-white/5 border border-white/5 p-2 rounded-md text-xs">
                      <div className="flex items-center space-x-2 truncate">
                        <IconFile size={14} className="text-blue-400 shrink-0" />
                        <span className="truncate text-white/80">{f.name}</span>
                      </div>
                      <button
                        className="text-red-400 hover:text-red-300 p-0.5"
                        onClick={() => handleToggleFile(f.id)}
                      >
                        <IconX size={12} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-xs italic text-muted-foreground py-1">No files associated with this concept.</div>
                )}
              </div>

              {/* Add file association dropdown */}
              <div className="mt-3">
                <select
                  className="w-full text-xs rounded border border-white/10 bg-background text-white/80 p-2"
                  value=""
                  onChange={e => {
                    if (e.target.value) {
                      handleToggleFile(e.target.value)
                      e.target.value = ""
                    }
                  }}
                >
                  <option value="">+ Associate document...</option>
                  {files
                    .filter(f => !selectedNode.files?.some(linked => linked.id === f.id))
                    .map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                </select>
              </div>
            </div>

            {/* Connections count */}
            <div>
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Connections</Label>
              <div className="flex space-x-4 mt-2">
                <div className="bg-white/5 p-2 rounded flex-1 text-center border border-white/5">
                  <div className="text-xs text-muted-foreground">Prerequisites</div>
                  <div className="text-lg font-bold text-blue-400 mt-0.5">
                    {selectedGraph.links.filter(l => l.target_node_id === selectedNode.id).length}
                  </div>
                </div>
                <div className="bg-white/5 p-2 rounded flex-1 text-center border border-white/5">
                  <div className="text-xs text-muted-foreground">Dependents</div>
                  <div className="text-lg font-bold text-purple-400 mt-0.5">
                    {selectedGraph.links.filter(l => l.source_node_id === selectedNode.id).length}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-4 border-t border-white/10 space-y-2 mt-auto">
            <Button
              className="w-full gap-2 bg-blue-600 hover:bg-blue-500 text-white"
              onClick={handleAskAI}
            >
              <IconMessage2 size={16} /> Ask AI about this
            </Button>
            <Button
              variant="ghost"
              className="w-full gap-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
              onClick={() => handleDeleteNode(selectedNode.id)}
            >
              <IconTrash size={16} /> Delete Concept
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
