"use server"

import crypto from "crypto"

export async function getTransloaditParams() {
  const key = process.env.TRANSLOADIT_AUTH_KEY
  const secret = process.env.TRANSLOADIT_AUTH_SECRET

  if (!key || !secret) {
    throw new Error("Missing Transloadit env vars")
  }

  const params = {
    auth: {
      key,
      expires: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    },
    steps: {
      store: {
        robot: "/s3/store",
      },
    },
  }

  const paramsString = JSON.stringify(params)

  const signature = crypto
    .createHmac("sha1", secret)
    .update(paramsString)
    .digest("hex")

  return {
    params: paramsString,
    signature,
  }
}
