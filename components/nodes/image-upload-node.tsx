"use client"

import type React from "react"
import { useState, useCallback } from "react"
import type { NodeProps } from "@xyflow/react"
import { BaseNode } from "./base-node"
import { NodeHandle } from "./node-handle"
import { useWorkflowStore } from "@/stores/workflow-store"
import { ImageIcon, Upload, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ImageUploadNodeData } from "@/types/workflow"

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]

type ImageUploadNodeProps = NodeProps & {
  data: ImageUploadNodeData
}

export function ImageUploadNode({ id, data }: ImageUploadNodeProps) {
  const updateNodeData = useWorkflowStore((state) => state.updateNodeData)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
  })

  const handleUpload = useCallback(
    async (file: File) => {
      if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
        alert("Please upload a valid image file (JPG, PNG, WebP, or GIF)")
        return
      }

      setIsUploading(true)

      try {
        const base64 = await fileToBase64(file)
        console.log("UPLOAD NODE OUTPUT:", base64.slice(0, 50))
        updateNodeData(id, {
          imageUrl: base64,
          fileName: file.name,
          fileSize: file.size,
        })
      } catch (error) {
        console.error("Upload failed:", error)
      } finally {
        setIsUploading(false)
      }
    },
    [id, updateNodeData],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleUpload(file)
    },
    [handleUpload],
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  const handleRemove = () => {
    if (data?.imageUrl) {
      URL.revokeObjectURL(data.imageUrl)
    }
    updateNodeData(id, { imageUrl: undefined, fileName: undefined, fileSize: undefined })
  }

  return (
    <BaseNode id={id} type="uploadImage" title="Upload Image" icon={<ImageIcon className="h-4 w-4" />}>
      <div className="space-y-3">
        {data?.imageUrl ? (
          <div className="relative group">
            <img
              src={data.imageUrl || "/placeholder.svg"}
              alt={data.fileName || "Uploaded image"}
              className="w-full h-40 object-cover rounded-lg border border-border"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            {data.fileName && <p className="mt-2 text-xs text-muted-foreground truncate">{data.fileName}</p>}
          </div>
        ) : (
          <label
            onDragOver={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragging(true)
            }}
            onDragLeave={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setIsDragging(false)
            }}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed cursor-pointer transition-colors nodrag",
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50 hover:bg-secondary/50",
              isUploading && "pointer-events-none opacity-50",
            )}
          >
            <input
              type="file"
              accept={ACCEPTED_IMAGE_TYPES.join(",")}
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />
            {isUploading ? (
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">Drop image or click to upload</p>
                <p className="text-xs text-muted-foreground/70">JPG, PNG, WebP, GIF</p>
              </>
            )}
          </label>
        )}

        {/* Output handle */}
        <div className="flex justify-end pt-2">
          <NodeHandle id="output" handleType="source" dataType="image" label="image" />
        </div>
      </div>
    </BaseNode>
  )
}
