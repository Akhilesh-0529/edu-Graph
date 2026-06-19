import { FC, RefObject } from "react"
import { IconX } from "@tabler/icons-react"
import { GraphNode } from "@/types/knowledge-graph"
import { Node } from "./Node"

interface CanvasProps {
  svgRef: RefObject<any>
  isPanning: boolean
  handleMouseDown: (e: React.MouseEvent) => void
  handleMouseMove: (e: React.MouseEvent) => void
  handleMouseUp: () => void
  pan: { x: number; y: number }
  zoom: number
  selectedGraph: any
  nodeMap: Map<string, GraphNode>
  selectedNode: GraphNode | null
  handleDeleteLink: (id: string) => Promise<void>
  handleNodeMouseDown: (e: React.MouseEvent, node: GraphNode) => void
}

export const Canvas: FC<CanvasProps> = ({
  svgRef,
  isPanning,
  handleMouseDown,
  handleMouseMove,
  handleMouseUp,
  pan,
  zoom,
  selectedGraph,
  nodeMap,
  selectedNode,
  handleDeleteLink,
  handleNodeMouseDown
}) => {
  return (
    <svg
      ref={svgRef}
      className="size-full bg-slate-950/40"
      style={{ cursor: isPanning ? "grabbing" : "default" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
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
        {selectedGraph?.links?.map((link: any) => {
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
                className="opacity-0 transition-opacity group-hover:opacity-100"
              >
                <button
                  className="flex size-5 items-center justify-center rounded-full border border-red-500 bg-red-900 text-[10px] text-white transition-colors hover:bg-red-600"
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
        {selectedGraph?.nodes?.map((node: any) => {
          const isSelected = selectedNode?.id === node.id
          return (
            <Node
              key={node.id}
              node={node}
              isSelected={isSelected}
              handleNodeMouseDown={handleNodeMouseDown}
            />
          )
        })}
      </g>
    </svg>
  )
}
