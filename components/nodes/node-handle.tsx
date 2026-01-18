"use client"

import { Handle, Position, type HandleProps } from "@xyflow/react"
import { cn } from "@/lib/utils"

interface NodeHandleProps extends Omit<HandleProps, "type" | "position"> {
  label?: string
  position?: Position
  handleType: "source" | "target"
  dataType: "text" | "image" | "video" | "any"
  isConnected?: boolean
}

const dataTypeColors = {
  text: "bg-blue-500 border-blue-400",
  image: "bg-green-500 border-green-400",
  video: "bg-orange-500 border-orange-400",
  any: "bg-primary border-primary",
}

export function NodeHandle({
  label,
  position,
  handleType,
  dataType,
  isConnected,
  className,
  ...props
}: NodeHandleProps) {
  const defaultPosition = handleType === "source" ? Position.Right : Position.Left

  return (
    <div
      className={cn(
        "relative flex items-center",
        handleType === "source" ? "justify-end" : "justify-start",
        className
      )}
    >
      {label && handleType === "target" && (
        <span className="mr-2 text-xs text-muted-foreground">{label}</span>
      )}

      <Handle
        type={handleType}
        position={position || defaultPosition}
        className={cn(
          "w-3! h-3! border-2! rounded-full! transition-all duration-200",
          dataTypeColors[dataType],
          isConnected && "scale-110!",
          "hover:scale-125!"
        )}
        {...props}
      />

      {label && handleType === "source" && (
        <span className="ml-2 text-xs text-muted-foreground">{label}</span>
      )}
    </div>
  )
}
