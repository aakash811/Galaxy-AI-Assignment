"use client"

import { useEffect, useRef, useState } from "react"
import type { NodeProps } from "@xyflow/react"
import { BaseNode } from "./base-node"
import { NodeHandle } from "./node-handle"
import { useWorkflowStore } from "@/stores/workflow-store"
import { VideoIcon, Upload, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { VideoUploadNodeData } from "@/types/workflow"

import Uppy from "@uppy/core"
import Transloadit from "@uppy/transloadit"

const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]

type VideoUploadNodeProps = NodeProps & {
  data: VideoUploadNodeData
}

export function VideoUploadNode({ id, data }: VideoUploadNodeProps) {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData)
  const uppyRef = useRef<Uppy | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  /* -------------------- init uppy -------------------- */
  useEffect(() => {
    const uppy = new Uppy({
      autoProceed: true,
      restrictions: {
        maxNumberOfFiles: 1,
        allowedFileTypes: ACCEPTED_VIDEO_TYPES,
      },
    })

    uppy.use(Transloadit, {
      waitForEncoding: true,
      assemblyOptions: {
        params: {
          auth: {
            key: process.env.NEXT_PUBLIC_TRANSLOADIT_KEY!,
          },
          template_id: process.env.NEXT_PUBLIC_TRANSLOADIT_TEMPLATE_ID!,
        },
      },
    })  

    uppy.on("upload", () => {
      setIsUploading(true)
    })

    uppy.on("transloadit:complete", (assembly) => {
      const uploaded = assembly.uploads?.[0]

      if (!uploaded?.url) {
        console.error("No upload URL returned from Transloadit")
        setIsUploading(false)
        return
      }

      updateNodeData(id, {
        videoUrl: uploaded.url, // ✅ HTTPS URL
        fileName: uploaded.name,
        fileSize: uploaded.size,
      })

      setIsUploading(false)
    })

    uppy.on("error", (err) => {
      console.error("Video upload failed:", err)
      setIsUploading(false)
    })

    uppyRef.current = uppy

    return () => {
      uppy.destroy()
    }
  }, [id, updateNodeData])

  /* -------------------- handlers -------------------- */
  const handleFileSelect = (file: File) => {
    uppyRef.current?.cancelAll()
    uppyRef.current?.addFile({
      name: file.name,
      type: file.type,
      data: file,
    })
  }

  const handleRemove = () => {
    uppyRef.current?.cancelAll()
    updateNodeData(id, {
      videoUrl: undefined,
      fileName: undefined,
      fileSize: undefined,
    })
  }

  /* -------------------- UI -------------------- */
  return (
    <BaseNode
      id={id}
      type="uploadVideo"
      title="Upload Video"
      icon={<VideoIcon className="h-4 w-4" />}
    >
      <div className="space-y-3">
        {data?.videoUrl ? (
          <div className="relative group">
            <video
              src={data.videoUrl}
              controls
              className="w-full h-40 rounded-lg border border-border bg-black nodrag"
            />
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1 rounded-full bg-background/80 text-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            {data.fileName && (
              <p className="mt-2 text-xs text-muted-foreground truncate">
                {data.fileName}
              </p>
            )}
          </div>
        ) : (
          <label
            className={cn(
              "flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed cursor-pointer transition-colors nodrag",
              isUploading
                ? "border-primary bg-primary/10 pointer-events-none opacity-50"
                : "border-border hover:border-primary/50 hover:bg-secondary/50"
            )}
          >
            <input
              type="file"
              accept={ACCEPTED_VIDEO_TYPES.join(",")}
              className="hidden"
              onChange={(e) =>
                e.target.files && handleFileSelect(e.target.files[0])
              }
            />

            {isUploading ? (
              <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  Drop video or click to upload
                </p>
                <p className="text-xs text-muted-foreground/70">
                  MP4, MOV, WebM, M4V
                </p>
              </>
            )}
          </label>
        )}

        {/* Output handle */}
        <div className="flex justify-end pt-2">
          <NodeHandle
            id="output"
            handleType="source"
            dataType="video"
            label="video"
          />
        </div>
      </div>
    </BaseNode>
  )
}
