import { prisma } from "./prisma"

const hasClerkKeys = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY

export async function getCurrentUser() {
  if (!hasClerkKeys) {
    const anonUser = await prisma.user.upsert({
      where: { clerkId: "anonymous" },
      update: {},
      create: {
        clerkId: "anonymous",
        email: "anonymous@local.dev",
        name: "Anonymous User",
        imageUrl: null,
      },
    })
    return anonUser
  }

  const { currentUser } = await import("@clerk/nextjs/server")
  const user = await currentUser()

  if (!user) {
    return null
  }

  // Get or create database user
  const dbUser = await prisma.user.upsert({
    where: { clerkId: user.id },
    update: {
      email: user.emailAddresses[0]?.emailAddress || "",
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
      imageUrl: user.imageUrl,
    },
    create: {
      clerkId: user.id,
      email: user.emailAddresses[0]?.emailAddress || "",
      name: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
      imageUrl: user.imageUrl,
    },
  })

  return dbUser
}

export async function requireAuth() {
  if (!hasClerkKeys) {
    return "anonymous"
  }

  const { auth } = await import("@clerk/nextjs/server")
  const { userId } = await auth()

  if (!userId) {
    throw new Error("Unauthorized")
  }

  return userId
}
