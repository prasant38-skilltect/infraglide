import { useCallback } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  NodeTypes,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import { AWSComponentNode } from "./aws-components";

const nodeTypes: NodeTypes = {
  awsComponent: AWSComponentNode,
};

interface PipelineCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: any) => void;
  onEdgesChange: (changes: any) => void;
  onConnect: (connection: Connection) => void;
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onDrop: (event: React.DragEvent) => void;
  onDragOver: (event: React.DragEvent) => void;
  onInit: (instance: ReactFlowInstance) => void;
}

export default function PipelineCanvas({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onNodeClick,
  onDrop,
  onDragOver,
  onInit,
}: PipelineCanvasProps) {
  const onConnectHandler = useCallback(
    (params: Connection) => onConnect(params),
    [onConnect]
  );

  return (
    <div className="flex-1 bg-gray-50 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnectHandler}
        onInit={onInit}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50"
        style={{
          backgroundImage: "radial-gradient(circle, #e5e7eb 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        <Controls 
          className="bg-white border border-gray-200 rounded-lg shadow-sm"
          showZoom={true}
          showFitView={true}
          showInteractive={true}
        />
        <Background 
          variant="dots" 
          gap={20} 
          size={1} 
          color="#e5e7eb"
        />
        
        {/* Drop zone indicator for empty canvas */}
        {nodes.length === 0 && (
          <div className="absolute inset-4 border-2 border-dashed border-gray-300 rounded-lg bg-gray-100 bg-opacity-50 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-600 mb-2">Drop AWS components here</p>
              <p className="text-sm text-gray-500">Drag components from the sidebar to build your pipeline</p>
            </div>
          </div>
        )}
      </ReactFlow>
    </div>
  );
}
