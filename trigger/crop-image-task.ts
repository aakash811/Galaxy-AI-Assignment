import { task } from "@trigger.dev/sdk/v3"
import { z } from "zod"
import { spawn } from "child_process"
import fs from "fs/promises"
import path from "path"
import os from "os"
import fetch from "node-fetch"
import FormData from "form-data"
import crypto from "crypto"

const cropImageInputSchema = z.object({
  imageUrl: z.string(),
  xPercent: z.number().min(0).max(100).default(0),
  yPercent: z.number().min(0).max(100).default(0),
  widthPercent: z.number().min(0).max(100).default(100),
  heightPercent: z.number().min(0).max(100).default(100),
})

export type CropImageTaskInput = z.infer<typeof cropImageInputSchema>

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


export const cropImageTask = task({
  id: "crop-image",
  maxDuration: 120,

  run: async (payload: CropImageTaskInput) => {
    const input = cropImageInputSchema.parse(payload)

    const tempDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "crop-image-")
    )

    const inputPath = path.join(tempDir, "input.jpg")
    const outputPath = path.join(tempDir, "output.jpg")

    try {
      const imageBuffer = await downloadImage(input.imageUrl)
      await fs.writeFile(inputPath, imageBuffer)

      const cropFilter = buildCropFilter(input)
      await runFfmpeg(inputPath, outputPath, cropFilter)

      const resultUrl = await uploadToTransloadit(outputPath)

      return { success: true, resultUrl }
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  },
})


async function downloadImage(imageUrl: string): Promise<Buffer> {
  if (imageUrl.startsWith("data:image")) {
    const base64 = imageUrl.split(",")[1]
    return Buffer.from(base64, "base64")
  }

  const res = await fetch(imageUrl)
  if (!res.ok) {
    throw new Error(`Failed to download image (${res.status})`)
  }

  return Buffer.from(await res.arrayBuffer())
}

function buildCropFilter({
  xPercent,
  yPercent,
  widthPercent,
  heightPercent,
}: CropImageTaskInput): string {
  return `crop=in_w*${widthPercent / 100}:in_h*${heightPercent / 100}:in_w*${xPercent / 100}:in_h*${yPercent / 100}`
}

function runFfmpeg(
  inputPath: string,
  outputPath: string,
  cropFilter: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i",
      inputPath,
      "-vf",
      cropFilter,
      "-y",
      outputPath,
    ])

    ffmpeg.on("error", reject)

    ffmpeg.on("close", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`FFmpeg exited with code ${code}`))
    })
  })
}

async function uploadToTransloadit(filePath: string): Promise<string> {
  const params = {
    auth: {
      key: process.env.TRANSLOADIT_AUTH_KEY!,
      expires: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    },
   steps: {
    ":original": {
      robot: "/upload/handle",
    },
  }

  }

  const paramsString = JSON.stringify(params)


   const signature = crypto
    .createHmac("sha1", process.env.TRANSLOADIT_AUTH_SECRET!)
    .update(paramsString)
    .digest("hex")

  const form = new FormData()
  form.append("params", paramsString)
  form.append("signature", signature)
  form.append(
    "file",
    await fs.readFile(filePath),
    {
      filename: "output.jpg",
      contentType: "image/jpeg",
    }
  )

  const res = await fetch("https://api2.transloadit.com/assemblies", {
    method: "POST",
    body: form,
    headers: form.getHeaders(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Transloadit failed (${res.status}): ${text}`)
  }

  const assembly =
    (await res.json()) as TransloaditAssemblyResponse

  let status: TransloaditAssemblyStatus

  do {
    await new Promise((r) => setTimeout(r, 1000))

    const pollRes = await fetch(assembly.assembly_url)
    status = (await pollRes.json()) as TransloaditAssemblyStatus

    console.log("Transloadit assembly status:", status)

    if (status.ok === "ASSEMBLY_CANCELED") {
      throw new Error(
        status.error ?? "Transloadit assembly canceled"
      )
    }
  } while (status.ok !== "ASSEMBLY_COMPLETED")

  const uploadResult = status.uploads?.[0]

  if (!uploadResult?.url) {
    throw new Error("No upload result returned from Transloadit")
  }

  return uploadResult.url
}
