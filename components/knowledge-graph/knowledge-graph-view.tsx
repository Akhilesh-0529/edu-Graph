"use client"

import { FC } from "react"
import { useKnowledgeGraph } from "./use-knowledge-graph"
import { Toolbar } from "./Toolbar"
import { Canvas } from "./Canvas"
import { ConceptDetailDrawer } from "./ConceptDetailDrawer"

export const KnowledgeGraphView: FC = () => {
  const {
    selectedGraph,
    files,
    selectedNode,
    setSelectedNode,
    zoom,
    setZoom,
    pan,
    isPanning,
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
  } = useKnowledgeGraph()

  if (!selectedGraph) return null

  const nodeMap = new Map(selectedGraph.nodes.map((n: any) => [n.id, n]))

  return (
    <div className="bg-background flex size-full overflow-hidden">
      {/* MAIN VIEW AREA */}
      <div
        className="relative h-full flex-1 select-none"
        onClick={handleBackgroundClick}
      >
        <Toolbar
          selectedGraph={selectedGraph}
          files={files}
          isAddingNode={isAddingNode}
          setIsAddingNode={setIsAddingNode}
          newNodeName={newNodeName}
          setNewNodeName={setNewNodeName}
          newNodeDesc={newNodeDesc}
          setNewNodeDesc={setNewNodeDesc}
          newNodeColor={newNodeColor}
          setNewNodeColor={setNewNodeColor}
          handleAddNode={handleAddNode}
          isAddingLink={isAddingLink}
          setIsAddingLink={setIsAddingLink}
          linkSource={linkSource}
          setLinkSource={setLinkSource}
          linkTarget={linkTarget}
          setLinkTarget={setLinkTarget}
          linkLabel={linkLabel}
          setLinkLabel={setLinkLabel}
          handleAddLink={handleAddLink}
          isExtracting={isExtracting}
          selectedExtractFiles={selectedExtractFiles}
          setSelectedExtractFiles={setSelectedExtractFiles}
          handleAIConceptExtraction={handleAIConceptExtraction}
          runAutoLayout={runAutoLayout}
          setZoom={setZoom}
          resetFocus={resetFocus}
        />

        <Canvas
          svgRef={svgRef}
          isPanning={isPanning}
          handleMouseDown={handleMouseDown}
          handleMouseMove={handleMouseMove}
          handleMouseUp={handleMouseUp}
          pan={pan}
          zoom={zoom}
          selectedGraph={selectedGraph}
          nodeMap={nodeMap}
          selectedNode={selectedNode}
          handleDeleteLink={handleDeleteLink}
          handleNodeMouseDown={handleNodeMouseDown}
        />
      </div>

      {/* NODE DETAILS SIDEBAR PANEL */}
      {selectedNode && (
        <ConceptDetailDrawer
          selectedNode={selectedNode}
          setSelectedNode={setSelectedNode}
          selectedGraph={selectedGraph}
          files={files}
          handleToggleFile={handleToggleFile}
          handleAskAI={handleAskAI}
          handleDeleteNode={handleDeleteNode}
        />
      )}
    </div>
  )
}
export default KnowledgeGraphView
