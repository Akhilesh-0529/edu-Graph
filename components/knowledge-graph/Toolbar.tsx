import { FC } from "react"
import {
  IconPlus,
  IconArrowRight,
  IconSparkles,
  IconHierarchy,
  IconFile,
  IconZoomIn,
  IconZoomOut,
  IconFocus2
} from "@tabler/icons-react"
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
import { Tables } from "@/supabase/types"

interface ToolbarProps {
  selectedGraph: any
  files: Tables<"files">[]
  isAddingNode: boolean
  setIsAddingNode: (open: boolean) => void
  newNodeName: string
  setNewNodeName: (val: string) => void
  newNodeDesc: string
  setNewNodeDesc: (val: string) => void
  newNodeColor: string
  setNewNodeColor: (color: string) => void
  handleAddNode: () => Promise<void>
  isAddingLink: boolean
  setIsAddingLink: (open: boolean) => void
  linkSource: string
  setLinkSource: (val: string) => void
  linkTarget: string
  setLinkTarget: (val: string) => void
  linkLabel: string
  setLinkLabel: (val: string) => void
  handleAddLink: () => Promise<void>
  isExtracting: boolean
  selectedExtractFiles: string[]
  setSelectedExtractFiles: (files: string[] | ((prev: string[]) => string[])) => void
  handleAIConceptExtraction: () => Promise<void>
  runAutoLayout: () => void
  setZoom: (zoom: number | ((prev: number) => number)) => void
  resetFocus: () => void
}

export const Toolbar: FC<ToolbarProps> = ({
  selectedGraph,
  files,
  isAddingNode,
  setIsAddingNode,
  newNodeName,
  setNewNodeName,
  newNodeDesc,
  setNewNodeDesc,
  newNodeColor,
  setNewNodeColor,
  handleAddNode,
  isAddingLink,
  setIsAddingLink,
  linkSource,
  setLinkSource,
  linkTarget,
  setLinkTarget,
  linkLabel,
  setLinkLabel,
  handleAddLink,
  isExtracting,
  selectedExtractFiles,
  setSelectedExtractFiles,
  handleAIConceptExtraction,
  runAutoLayout,
  setZoom,
  resetFocus
}) => {
  return (
    <>
      {/* TOP TOOLBAR */}
      <div className="absolute left-4 top-4 z-10 flex items-center space-x-2 rounded-xl border border-white/10 bg-black/40 p-1.5 backdrop-blur-md">
        <div className="px-3 py-1 text-sm font-semibold text-white/90">
          {selectedGraph?.graph?.name}
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
                <div className="mt-1 flex items-center space-x-2">
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
                  className="border-input bg-background w-full rounded border p-2 text-white"
                  value={linkSource}
                  onChange={e => setLinkSource(e.target.value)}
                >
                  <option value="">Select concept...</option>
                  {selectedGraph?.nodes?.map((n: any) => (
                    <option key={n.id} value={n.id} className="bg-[#0b101f] text-white">{n.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Target Concept (Subsequent)</Label>
                <select
                  className="border-input bg-background w-full rounded border p-2 text-white"
                  value={linkTarget}
                  onChange={e => setLinkTarget(e.target.value)}
                >
                  <option value="">Select concept...</option>
                  {selectedGraph?.nodes?.map((n: any) => (
                    <option key={n.id} value={n.id} className="bg-[#0b101f] text-white">{n.name}</option>
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
            <Button size="sm" variant="ghost" className="h-8 gap-1.5 px-2.5 text-xs text-blue-400 hover:bg-blue-900/20 hover:text-blue-300">
              <IconSparkles size={14} /> AI Extract
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Auto-Extract Concepts from Documents</DialogTitle>
            </DialogHeader>
            <div className="py-3">
              <p className="text-muted-foreground mb-4 text-xs">
                Select documents uploaded to this workspace. The AI will parse them, discover key educational concepts, map their dependency links, and add them directly to this graph.
              </p>
              <Label>Select Workspace Files</Label>
              <div className="mt-1.5 max-h-48 space-y-1 overflow-y-auto rounded border border-white/10 bg-black/20 p-2">
                {files?.length === 0 ? (
                  <div className="text-muted-foreground p-4 text-center text-xs italic">
                    No files uploaded. Upload files first.
                  </div>
                ) : (
                  files?.map(f => {
                    const isSelected = selectedExtractFiles.includes(f.id)
                    return (
                      <div
                        key={f.id}
                        className="flex cursor-pointer items-center space-x-2 rounded p-1.5 text-sm hover:bg-white/5"
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
                        <span className="flex-1 truncate">{f.name}</span>
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
          className="h-8 gap-1.5 px-2.5 text-xs text-green-400 hover:bg-green-900/20 hover:text-green-300"
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
    </>
  )
}
