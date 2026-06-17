import { ChatbotUIContext } from "@/context/context"
import { getGraphDetails, updateGraph, deleteGraph } from "@/db/knowledge-graphs"
import { Tables } from "@/supabase/types"
import { IconEdit, IconTrash, IconHierarchy } from "@tabler/icons-react"
import { FC, useContext, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface GraphItemProps {
  graph: Tables<"graphs">
}

export const GraphItem: FC<GraphItemProps> = ({ graph }) => {
  const {
    selectedGraph,
    setSelectedGraph,
    setSelectedChat,
    setGraphs
  } = useContext(ChatbotUIContext)

  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [name, setName] = useState(graph.name)
  const [description, setDescription] = useState(graph.description)

  const isActive = selectedGraph?.graph.id === graph.id

  const handleClick = async () => {
    const fullGraph = await getGraphDetails(graph.id)
    if (fullGraph) {
      setSelectedGraph(fullGraph)
      setSelectedChat(null) // Switch main panel to graph view
    }
  }

  const handleUpdate = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const updated = await updateGraph(graph.id, { name, description })
    setGraphs(prev => prev.map(g => (g.id === graph.id ? updated : g)))
    if (selectedGraph?.graph.id === graph.id) {
      setSelectedGraph(prev => prev ? { ...prev, graph: updated } : null)
    }
    setIsEditing(false)
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await deleteGraph(graph.id)
    setGraphs(prev => prev.filter(g => g.id !== graph.id))
    if (selectedGraph?.graph.id === graph.id) {
      setSelectedGraph(null)
    }
    setIsDeleting(false)
  }

  return (
    <div
      className={cn(
        "hover:bg-accent focus:bg-accent group flex w-full cursor-pointer items-center rounded p-2 hover:opacity-50 focus:outline-none",
        isActive && "bg-accent"
      )}
      tabIndex={0}
      onClick={handleClick}
    >
      <IconHierarchy className="text-blue-500" size={30} />

      <div className="ml-3 flex-1 truncate text-sm font-semibold">
        <div className="truncate">{graph.name}</div>
        <div className="truncate text-xs font-normal opacity-50">
          {graph.description || "No description"}
        </div>
      </div>

      <div
        onClick={e => {
          e.stopPropagation()
        }}
        className={cn(
          "ml-2 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity",
          isActive && "opacity-100"
        )}
      >
        {/* EDIT DIALOG */}
        <Dialog open={isEditing} onOpenChange={setIsEditing}>
          <DialogTrigger asChild>
            <IconEdit className="cursor-pointer hover:text-blue-500" size={18} />
          </DialogTrigger>
          <DialogContent onClick={e => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>Edit Graph</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label>Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input value={description} onChange={e => setDescription(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdate}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DELETE DIALOG */}
        <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
          <DialogTrigger asChild>
            <IconTrash className="cursor-pointer hover:text-red-500" size={18} />
          </DialogTrigger>
          <DialogContent onClick={e => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>Delete Graph</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{graph.name}"? This will permanently remove all of its nodes and links.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsDeleting(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
