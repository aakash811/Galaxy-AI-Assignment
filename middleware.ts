import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
])

export default clerkMiddleware((auth, req) => {
  if (!isPublicRoute(req)) {
    auth.protect()
  }
})

export const config = {
  matcher: [
    /*
     * Match all routes except static files and _next
     */
    "/((?!_next|.*\\..*).*)",
    "/(api|trpc)(.*)",
  ],
}
