import { supabase } from "@/lib/supabase/browser-client"
import { TablesInsert, TablesUpdate, Tables } from "@/supabase/types"
import { FullGraph, GraphNode, GraphLink } from "@/types/knowledge-graph"

export const getGraphById = async (graphId: string) => {
  const { data: graph, error } = await supabase
    .from("graphs")
    .select("*")
    .eq("id", graphId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return graph
}

export const getGraphWorkspacesByWorkspaceId = async (workspaceId: string) => {
  const { data: workspace, error } = await supabase
    .from("workspaces")
    .select(
      `
      id,
      name,
      graphs (*)
    `
    )
    .eq("id", workspaceId)
    .single()

  if (!workspace) {
    throw new Error(error.message)
  }

  return workspace
}

export const getGraphDetails = async (graphId: string): Promise<FullGraph | null> => {
  // Fetch graph details
  const graph = await getGraphById(graphId)
  if (!graph) return null

  // Fetch nodes with files
  const { data: nodesData, error: nodesError } = await supabase
    .from("graph_nodes")
    .select(`
      *,
      graph_node_files (
        files (*)
      )
    `)
    .eq("graph_id", graphId)

  if (nodesError) {
    throw new Error(nodesError.message)
  }

  // Fetch links
  const { data: linksData, error: linksError } = await supabase
    .from("graph_links")
    .select("*")
    .eq("graph_id", graphId)

  if (linksError) {
    throw new Error(linksError.message)
  }

  const nodes: GraphNode[] = (nodesData || []).map((node: any) => {
    const files = (node.graph_node_files || [])
      .map((gnf: any) => gnf.files)
      .filter(Boolean) as Tables<"files">[]
    return {
      id: node.id,
      graph_id: node.graph_id,
      name: node.name,
      description: node.description,
      color: node.color,
      size: node.size,
      x: node.x,
      y: node.y,
      files
    }
  })

  const links: GraphLink[] = (linksData || []).map((link: any) => ({
    id: link.id,
    graph_id: link.graph_id,
    source_node_id: link.source_node_id,
    target_node_id: link.target_node_id,
    label: link.label
  }))

  return {
    graph,
    nodes,
    links
  }
}

export const createGraph = async (
  graph: TablesInsert<"graphs">,
  workspace_id: string
) => {
  const { data: createdGraph, error } = await supabase
    .from("graphs")
    .insert([graph])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  await createGraphWorkspace({
    user_id: createdGraph.user_id,
    graph_id: createdGraph.id,
    workspace_id
  })

  return createdGraph
}

export const createGraphWorkspace = async (item: {
  user_id: string
  graph_id: string
  workspace_id: string
}) => {
  const { data: createdGraphWorkspace, error } = await supabase
    .from("graph_workspaces")
    .insert([item])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdGraphWorkspace
}

export const updateGraph = async (
  graphId: string,
  graph: TablesUpdate<"graphs">
) => {
  const { data: updatedGraph, error } = await supabase
    .from("graphs")
    .update(graph)
    .eq("id", graphId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedGraph
}

export const deleteGraph = async (graphId: string) => {
  const { error } = await supabase
    .from("graphs")
    .delete()
    .eq("id", graphId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const createGraphNode = async (node: TablesInsert<"graph_nodes">) => {
  const { data: createdNode, error } = await supabase
    .from("graph_nodes")
    .insert([node])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdNode
}

export const updateGraphNode = async (
  nodeId: string,
  node: TablesUpdate<"graph_nodes">
) => {
  const { data: updatedNode, error } = await supabase
    .from("graph_nodes")
    .update(node)
    .eq("id", nodeId)
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return updatedNode
}

export const deleteGraphNode = async (nodeId: string) => {
  const { error } = await supabase
    .from("graph_nodes")
    .delete()
    .eq("id", nodeId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const createGraphLink = async (link: TablesInsert<"graph_links">) => {
  const { data: createdLink, error } = await supabase
    .from("graph_links")
    .insert([link])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return createdLink
}

export const deleteGraphLink = async (linkId: string) => {
  const { error } = await supabase
    .from("graph_links")
    .delete()
    .eq("id", linkId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}

export const associateFileWithNode = async (
  nodeId: string,
  fileId: string,
  userId: string
) => {
  const { data, error } = await supabase
    .from("graph_node_files")
    .insert([{ node_id: nodeId, file_id: fileId, user_id: userId }])
    .select("*")
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export const disassociateFileFromNode = async (
  nodeId: string,
  fileId: string
) => {
  const { error } = await supabase
    .from("graph_node_files")
    .delete()
    .eq("node_id", nodeId)
    .eq("file_id", fileId)

  if (error) {
    throw new Error(error.message)
  }

  return true
}
