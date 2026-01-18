import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import type {
  WorkflowNode,
  WorkflowEdge,
  NodeType,
  RunStatus,
  NodeDataMap,
} from "@/types/workflow"
import type { Connection, EdgeChange, NodeChange, Viewport, Edge } from "@xyflow/react"
import { applyNodeChanges, applyEdgeChanges, addEdge } from "@xyflow/react"
import { createWorkflowNode } from "@/lib/create-workflow-node"

interface HistoryEntry {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

interface WorkflowStore {
  workflowId: string | null
  workflowName: string
  isSaved: boolean

  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  viewport: Viewport

  selectedNodes: string[]

  runningNodes: Set<string>
  nodeStatuses: Map<string, RunStatus>

  history: HistoryEntry[]
  historyIndex: number

  leftSidebarOpen: boolean
  rightSidebarOpen: boolean

  setWorkflowId: (id: string | null) => void
  setWorkflowName: (name: string) => void
  setIsSaved: (saved: boolean) => void

  onNodesChange: (changes: NodeChange[]) => void
  onEdgesChange: (changes: EdgeChange[]) => void
  onConnect: (connection: Connection) => void

  addNode: (type: NodeType, position: { x: number; y: number }) => void
  updateNodeData: (nodeId: string, data: Partial<NodeDataMap[NodeType]>) => void

  deleteNode: (nodeId: string) => void
  deleteSelectedNodes: () => void

  setSelectedNodes: (nodeIds: string[]) => void
  clearSelection: () => void

  setNodeRunning: (nodeId: string, running: boolean) => void
  setNodeStatus: (nodeId: string, status: RunStatus) => void
  clearRunningNodes: () => void

  undo: () => void
  redo: () => void
  saveToHistory: () => void

  toggleLeftSidebar: () => void
  toggleRightSidebar: () => void
  setViewport: (viewport: Viewport) => void

  loadWorkflow: (workflow: {
    nodes: WorkflowNode[]
    edges: WorkflowEdge[]
    viewport?: Viewport
  }) => void

  resetWorkflow: () => void
  getWorkflowData: () => { nodes: WorkflowNode[]; edges: WorkflowEdge[]; viewport: Viewport }
}

let nodeIdCounter = 0
const generateNodeId = () => `node-${Date.now()}-${++nodeIdCounter}`

export const useWorkflowStore = create<WorkflowStore>()(
  subscribeWithSelector((set, get) => ({
    workflowId: null,
    workflowName: "Untitled Workflow",
    isSaved: true,

    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },

    selectedNodes: [],

    runningNodes: new Set(),
    nodeStatuses: new Map(),

    history: [{ nodes: [], edges: [] }],
    historyIndex: 0,

    leftSidebarOpen: true,
    rightSidebarOpen: true,

    setWorkflowId: (id) => set({ workflowId: id }),
    setWorkflowName: (name) => set({ workflowName: name, isSaved: false }),
    setIsSaved: (saved) => set({ isSaved: saved }),

    onNodesChange: (changes) =>
      set({
        nodes: applyNodeChanges(changes, get().nodes) as WorkflowNode[],
        isSaved: false,
      }),

    onEdgesChange: (changes) =>
      set({
        edges: applyEdgeChanges(changes, get().edges),
        isSaved: false,
      }),

    onConnect: (connection) => {
      const edge: Edge = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        animated: true,
      }

      set({
        edges: addEdge(edge, get().edges),
        isSaved: false,
      })
      get().saveToHistory()
    },

    addNode: (type, position) => {
      const id = generateNodeId()

      const dataMap: NodeDataMap = {
        text: { label: "Text", text: "" },
        uploadImage: { label: "Upload Image" },
        uploadVideo: { label: "Upload Video" },
        llm: {
          label: "Run LLM",
          model: "gemini-1.5-flash",
          systemPrompt: "",
          userMessage: "",
          images: [],
        },
        cropImage: {
          label: "Crop Image",
          xPercent: 0,
          yPercent: 0,
          widthPercent: 100,
          heightPercent: 100,
        },
        extractFrame: {
          label: "Extract Frame",
          timestamp: 0,
        },
      }

      const newNode = createWorkflowNode(type, id, position, dataMap[type])

      set({
        nodes: [...get().nodes, newNode],
        isSaved: false,
      })
      get().saveToHistory()
    },

    updateNodeData: (nodeId, data) => {
      set({
        nodes: get().nodes.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } }
            : node
        ) as WorkflowNode[],
        isSaved: false,
      })
    },

    deleteNode: (nodeId) => {
      set({
        nodes: get().nodes.filter((n) => n.id !== nodeId),
        edges: get().edges.filter(
          (e) => e.source !== nodeId && e.target !== nodeId
        ),
        isSaved: false,
      })
      get().saveToHistory()
    },

    deleteSelectedNodes: () => {
      const ids = new Set(get().selectedNodes)
      set({
        nodes: get().nodes.filter((n) => !ids.has(n.id)),
        edges: get().edges.filter(
          (e) => !ids.has(e.source) && !ids.has(e.target)
        ),
        selectedNodes: [],
        isSaved: false,
      })
      get().saveToHistory()
    },

    setSelectedNodes: (ids) => set({ selectedNodes: ids }),
    clearSelection: () => set({ selectedNodes: [] }),

    setNodeRunning: (id, running) => {
      const next = new Set(get().runningNodes)
      running ? next.add(id) : next.delete(id)
      set({ runningNodes: next })
    },

    setNodeStatus: (id, status) => {
      const next = new Map(get().nodeStatuses)
      next.set(id, status)
      set({ nodeStatuses: next })
    },

    clearRunningNodes: () =>
      set({ runningNodes: new Set(), nodeStatuses: new Map() }),

    saveToHistory: () => {
      const { nodes, edges, history, historyIndex } = get()
      const next = history.slice(0, historyIndex + 1)
      next.push({ nodes, edges })
      set({
        history: next.slice(-50),
        historyIndex: next.length - 1,
      })
    },

    undo: () => {
      const i = get().historyIndex
      if (i > 0) {
        const entry = get().history[i - 1]
        set({ ...entry, historyIndex: i - 1, isSaved: false })
      }
    },

    redo: () => {
      const i = get().historyIndex
      const h = get().history
      if (i < h.length - 1) {
        const entry = h[i + 1]
        set({ ...entry, historyIndex: i + 1, isSaved: false })
      }
    },

    toggleLeftSidebar: () =>
      set({ leftSidebarOpen: !get().leftSidebarOpen }),

    toggleRightSidebar: () =>
      set({ rightSidebarOpen: !get().rightSidebarOpen }),

    setViewport: (viewport) => set({ viewport }),

    loadWorkflow: (workflow) =>
      set({
        nodes: workflow.nodes,
        edges: workflow.edges,
        viewport: workflow.viewport ?? { x: 0, y: 0, zoom: 1 },
        history: [{ nodes: workflow.nodes, edges: workflow.edges }],
        historyIndex: 0,
        isSaved: true,
      }),

    resetWorkflow: () =>
      set({
        workflowId: null,
        workflowName: "Untitled Workflow",
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
        selectedNodes: [],
        runningNodes: new Set(),
        nodeStatuses: new Map(),
        history: [{ nodes: [], edges: [] }],
        historyIndex: 0,
        isSaved: true,
      }),

    getWorkflowData: () => ({
      nodes: get().nodes,
      edges: get().edges,
      viewport: get().viewport,
    }),
  }))
)
