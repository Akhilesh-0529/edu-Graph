import { FC } from "react"
import { IconX, IconFile, IconMessage2, IconTrash } from "@tabler/icons-react"
import { Button } from "../ui/button"
import { Label } from "../ui/label"
import { GraphNode } from "@/types/knowledge-graph"
import { Tables } from "@/supabase/types"

interface ConceptDetailDrawerProps {
  selectedNode: GraphNode
  setSelectedNode: (node: GraphNode | null) => void
  selectedGraph: any
  files: Tables<"files">[]
  handleToggleFile: (fileId: string) => Promise<void>
  handleAskAI: () => void
  handleDeleteNode: (nodeId: string) => Promise<void>
}

export const ConceptDetailDrawer: FC<ConceptDetailDrawerProps> = ({
  selectedNode,
  setSelectedNode,
  selectedGraph,
  files,
  handleToggleFile,
  handleAskAI,
  handleDeleteNode
}) => {
  return (
    <div className="animate-in slide-in-from-right duration-250 flex h-full w-[320px] flex-col overflow-y-auto border-l border-white/10 bg-black/40 p-5 backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <h3 className="flex items-center gap-2 text-lg font-bold text-white">
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

      <div className="mt-4 flex-1 space-y-4">
        {/* Title / Description */}
        <div>
          <Label className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Concept Name</Label>
          <div className="mt-0.5 text-xl font-bold text-white/90">{selectedNode.name}</div>
        </div>

        <div>
          <Label className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Summary Description</Label>
          <p className="text-white/77 mt-1 rounded-lg border border-white/5 bg-white/5 p-3 text-sm leading-relaxed">
            {selectedNode.description || "No description provided for this concept."}
          </p>
        </div>

        {/* Document Mappings */}
        <div>
          <Label className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Associated Documents</Label>
          <div className="mt-2 space-y-1.5">
            {selectedNode.files && selectedNode.files.length > 0 ? (
              selectedNode.files.map(f => (
                <div key={f.id} className="flex items-center justify-between rounded-md border border-white/5 bg-white/5 p-2 text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <IconFile size={14} className="shrink-0 text-blue-400" />
                    <span className="truncate text-white/80">{f.name}</span>
                  </div>
                  <button
                    className="p-0.5 text-red-400 hover:text-red-300"
                    onClick={() => handleToggleFile(f.id)}
                  >
                    <IconX size={12} />
                  </button>
                </div>
              ))
            ) : (
              <div className="text-muted-foreground py-1 text-xs italic">No files associated with this concept.</div>
            )}
          </div>

          {/* Add file association dropdown */}
          <div className="mt-3">
            <select
              className="bg-background w-full rounded border border-white/10 p-2 text-xs text-white/80"
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
          <Label className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Connections</Label>
          <div className="mt-2 flex space-x-4">
            <div className="flex-1 rounded border border-white/5 bg-white/5 p-2 text-center">
              <div className="text-muted-foreground text-xs">Prerequisites</div>
              <div className="mt-0.5 text-lg font-bold text-blue-400">
                {selectedGraph?.links?.filter((l: any) => l.target_node_id === selectedNode.id).length}
              </div>
            </div>
            <div className="flex-1 rounded border border-white/5 bg-white/5 p-2 text-center">
              <div className="text-muted-foreground text-xs">Dependents</div>
              <div className="mt-0.5 text-lg font-bold text-purple-400">
                {selectedGraph?.links?.filter((l: any) => l.source_node_id === selectedNode.id).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="mt-auto space-y-2 border-t border-white/10 pt-4">
        <Button
          className="w-full gap-2 bg-blue-600 text-white hover:bg-blue-500"
          onClick={handleAskAI}
        >
          <IconMessage2 size={16} /> Ask AI about this
        </Button>
        <Button
          variant="ghost"
          className="w-full gap-2 text-red-400 hover:bg-red-900/20 hover:text-red-300"
          onClick={() => handleDeleteNode(selectedNode.id)}
        >
          <IconTrash size={16} /> Delete Concept
        </Button>
      </div>
    </div>
  )
}
