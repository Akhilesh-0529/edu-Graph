import { FC } from "react"
import { GraphNode } from "@/types/knowledge-graph"

interface NodeProps {
  node: GraphNode
  isSelected: boolean
  handleNodeMouseDown: (e: React.MouseEvent, node: GraphNode) => void
}

export const Node: FC<NodeProps> = ({ node, isSelected, handleNodeMouseDown }) => {
  return (
    <g
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
        className="hover:scale-115 transition-all duration-200"
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
}
