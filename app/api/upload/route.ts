import { NextResponse } from "next/server"
import crypto from "crypto"

// Generate Transloadit signature
function generateSignature(params: object, authSecret: string): string {
  const paramsJson = JSON.stringify(params)
  return crypto.createHmac("sha384", authSecret).update(paramsJson).digest("hex")
}

// POST /api/upload - Get Transloadit upload params
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fileType } = body // 'image' or 'video'

    const authKey = process.env.TRANSLOADIT_AUTH_KEY
    const authSecret = process.env.TRANSLOADIT_AUTH_SECRET

    if (!authKey || !authSecret) {
      return NextResponse.json({ success: false, error: "Transloadit not configured" }, { status: 500 })
    }

    // Create assembly params based on file type
    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes

    const params = {
      auth: {
        key: authKey,
        expires,
      },
      steps:
        fileType === "image"
          ? {
              resize: {
                robot: "/image/resize",
                use: ":original",
                width: 1920,
                height: 1920,
                resize_strategy: "fit",
                zoom: false,
              },
              store: {
                robot: "/s3/store",
                use: "resize",
                // Add your S3 credentials or use Transloadit temporary storage
              },
            }
          : {
              encode: {
                robot: "/video/encode",
                use: ":original",
                preset: "web/mp4",
                width: 1920,
                height: 1080,
              },
              thumbnail: {
                robot: "/video/thumbs",
                use: ":original",
                count: 1,
              },
              store: {
                robot: "/s3/store",
                use: ["encode", "thumbnail"],
              },
            },
    }

    const signature = generateSignature(params, authSecret)

    return NextResponse.json({
      success: true,
      data: {
        params,
        signature,
      },
    })
  } catch (error) {
    console.error("Failed to generate upload params:", error)
    return NextResponse.json({ success: false, error: "Failed to generate upload params" }, { status: 500 })
  }
}
