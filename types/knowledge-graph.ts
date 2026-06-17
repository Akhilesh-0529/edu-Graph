import { Tables } from "@/supabase/types"

export interface GraphNode {
  id: string
  graph_id: string
  name: string
  description: string
  color: string
  size: number
  x: number
  y: number
  files?: Tables<"files">[]
}

export interface GraphLink {
  id: string
  graph_id: string
  source_node_id: string
  target_node_id: string
  label: string
}

export interface FullGraph {
  graph: Tables<"graphs">
  nodes: GraphNode[]
  links: GraphLink[]
}
