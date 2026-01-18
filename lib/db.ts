import { neon } from "@neondatabase/serverless"

// Create a reusable SQL client (tagged template)
export const sql = neon(process.env.DATABASE_URL!)

// Optional typed helper (correct way)
export async function query<T>(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Promise<T[]> {
  const result = await sql(strings, ...values)
  return result as T[]
}
