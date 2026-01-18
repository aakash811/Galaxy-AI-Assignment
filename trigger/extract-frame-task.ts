import { task } from "@trigger.dev/sdk/v3"
import { z } from "zod"
import { exec } from "child_process"
import fs from "fs/promises"
import path from "path"
import os from "os"
import fetch from "node-fetch"
import FormData from "form-data"
import crypto from "crypto"

const FFMPEG = "ffmpeg"
const FFPROBE = "ffprobe"

const extractFrameInputSchema = z.object({
  videoUrl: z.string(),
  timestamp: z.union([z.number(), z.string()]).default(0),
})

export type ExtractFrameTaskInput = z.infer<typeof extractFrameInputSchema>

export interface TransloaditAssemblyResponse {
  ok: "ASSEMBLY_EXECUTING" | "ASSEMBLY_COMPLETED" | "ASSEMBLY_CANCELED"
  http_code: number
  message: string
  assembly_id: string
  parent_id: string | null
  account_id: string
  template_id: string | null
  instance: string
  assembly_url: string
  assembly_ssl_url: string
  uppyserver_url: string
  websocket_url: string
  tus_url: string
  bytes_received: number
  bytes_expected: number
  upload_duration: number
  start_date: string
  warnings: string[]
  execution_start?: string
  execution_duration?: number
  queue_duration?: number
  jobs_queue_duration?: number
  fields: Record<string, unknown>
  bytes_usage?: number
  template?: unknown
  uploads?: Array<{
    name?: string
    size?: number
    mime?: string
    url?: string
  }>
  results?: Record<
    string,
    Array<{
      url: string
      name: string
      size: number
      mime: string
    }>
  >
}


export type TransloaditAssemblyStatus = {
  ok: "ASSEMBLY_EXECUTING" | "ASSEMBLY_COMPLETED" | "ASSEMBLY_CANCELED"
  assembly_id: string
  message: string
  warnings: string[]
  account_id: string
  assembly_url: string
  assembly_ssl_url: string
  build_id?: string
  bytes_expected: number
  bytes_received: number
  bytes_usage?: number
  client_agent?: string | null
  client_ip?: string | null
  client_referer?: string | null
  companion_url?: string
  execution_start?: string
  execution_duration?: number
  expected_tus_uploads?: number
  finished_tus_uploads?: number
  has_dupe_jobs?: boolean
  instance: string
  is_infinite?: boolean
  jobs_queue_duration?: number
  last_job_completed?: string
  merged_params?: string
  notify_duration?: number | null
  notify_response_code?: number | null
  notify_start?: string | null
  notify_status?: string | null
  notify_url?: string | null
  parent_assembly_status?: string | null
  parent_id?: string | null
  queue_duration?: number
  running_jobs?: string[]
  start_date?: string
  started_jobs?: string[]
  started_tus_uploads?: number
  template?: unknown
  template_id?: string | null
  transloadit_client?: string
  tus_url?: string
  upload_duration?: number
  upload_meta_data_extracted?: boolean
  uppyserver_url?: string
  websocket_url?: string

  uploads?: Array<{
    id: string
    basename: string
    ext: string
    field: string
    from_batch_import: boolean
    is_tus_file: boolean
    md5hash: string
    mime: string
    name: string
    original_basename: string
    original_id: string
    original_md5hash: string
    original_name: string
    original_path: string
    size: number
    ssl_url: string
    tus_upload_url?: string | null
    type: string
    url: string
    meta: Record<string, any>
  }>

  results?: Record<
    string, // dynamic step names like ":original" or "faces_detected"
    Array<{
      id: string
      basename: string
      cost?: number
      execTime?: number
      ext: string
      field: string
      from_batch_import: boolean
      is_tus_file: boolean
      md5hash: string
      mime: string
      name: string
      original_basename: string
      original_id: string
      original_md5hash: string
      original_name: string
      original_path: string
      queue?: string
      queueTime?: number
      size: number
      ssl_url: string
      tus_upload_url?: string | null
      type: string
      url: string
      meta: Record<string, any>
    }>
  >

  error?: string
}

/* ------------------------- helpers ------------------------- */

async function downloadVideo(videoUrl: string): Promise<Buffer> {
  if (videoUrl.startsWith("data:video")) {
    const base64 = videoUrl.split(",")[1]
    return Buffer.from(base64, "base64")
  }

  if (videoUrl.startsWith("blob:")) {
    throw new Error("Blob URLs are not supported in extract-frame task")
  }

  const res = await fetch(videoUrl)
  if (!res.ok) {
    throw new Error(`Failed to download video (${res.status})`)
  }

  return Buffer.from(await res.arrayBuffer())
}

function execAsync(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message))
      else resolve(stdout.trim())
    })
  })
}

async function uploadFrameToTransloadit(filePath: string): Promise<string> {
  const params = {
    auth: {
      key: process.env.TRANSLOADIT_AUTH_KEY!,
      expires: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    },
    steps: {
      ":original": {
        robot: "/upload/handle",
      },
    },
  }

  const paramsString = JSON.stringify(params)

  const signature = crypto
    .createHmac("sha1", process.env.TRANSLOADIT_AUTH_SECRET!)
    .update(paramsString)
    .digest("hex")

  const form = new FormData()
  form.append("params", paramsString)
  form.append("signature", signature)
  form.append("file", await fs.readFile(filePath), {
    filename: "frame.png",
    contentType: "image/png",
  })

  const res = await fetch("https://api2.transloadit.com/assemblies", {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  })

  if (!res.ok) {
    throw new Error(await res.text())
  }

  const assembly = (await res.json()) as TransloaditAssemblyResponse

  let status: any
  do {
    await new Promise((r) => setTimeout(r, 1000))
    const poll = await fetch(assembly.assembly_url)
    status = (await poll.json()) as TransloaditAssemblyStatus

    if (status.ok === "ASSEMBLY_CANCELED") {
      throw new Error(status.error ?? "Transloadit assembly canceled")
    }
  } while (status.ok !== "ASSEMBLY_COMPLETED")

  const upload = status.uploads?.[0]
  if (!upload?.url) {
    throw new Error("No frame URL returned from Transloadit")
  }

  return upload.url
}

/* ------------------------- task ------------------------- */

export const extractFrameTask = task({
  id: "extract-frame",
  maxDuration: 180,

  run: async (payload: ExtractFrameTaskInput) => {
    const { videoUrl, timestamp } =
      extractFrameInputSchema.parse(payload)

    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "extract-frame-")
    )

    const inputPath = path.join(tempDir, "input.mp4")
    const outputPath = path.join(tempDir, "frame.png")

    try {
      // 1️⃣ Download video
      const videoBuffer = await downloadVideo(videoUrl)
      await fs.writeFile(inputPath, videoBuffer)

      // 2️⃣ Resolve timestamp
      let seekTime = "0"

      if (typeof timestamp === "number") {
        seekTime = timestamp.toString()
      }

      if (typeof timestamp === "string" && timestamp.endsWith("%")) {
        const duration = Number(
          await execAsync(
            `${FFPROBE} -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 ${inputPath}`
          )
        )

        const percent = parseFloat(timestamp.replace("%", ""))
        if (percent < 0 || percent > 100) {
          throw new Error("Timestamp percentage must be between 0 and 100")
        }

        seekTime = ((duration * percent) / 100).toFixed(2)
      }

      // 3️⃣ Extract frame
      await execAsync(
        `${FFMPEG} -ss ${seekTime} -i ${inputPath} -frames:v 1 -q:v 2 -y ${outputPath}`
      )

      // 4️⃣ Upload frame
      const resultUrl = await uploadFrameToTransloadit(outputPath)

      return {
        success: true,
        resultUrl,
        timestampUsed: seekTime,
      }
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  },
})
