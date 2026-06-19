import { createClient } from "@/lib/supabase/middleware"
import { i18nRouter } from "next-i18n-router"
import { NextResponse, type NextRequest } from "next/server"
import i18nConfig from "./i18nConfig"

export async function middleware(request: NextRequest) {
  try {
    const { supabase, response } = createClient(request)

    const sessionResponse = await supabase.auth.getSession()
    const session = sessionResponse.data.session

    const pathname = request.nextUrl.pathname

    // Bypass public files, api routes, auth callbacks, and static paths
    if (
      pathname.startsWith("/api") ||
      pathname.startsWith("/static") ||
      pathname.includes(".") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/auth")
    ) {
      return response
    }

    // Helper to extract locale prefix and get clean path
    const cleanPath = (path: string) => {
      const segments = path.split("/")
      if (segments.length > 1 && i18nConfig.locales.includes(segments[1])) {
        return "/" + segments.slice(2).join("/")
      }
      return path
    }

    const path = cleanPath(pathname)
    const isRoot = path === "/"
    const isLogin = path === "/login"
    const isSetup = path === "/setup"

    const getRedirectResponse = (url: string) => {
      const redirectResponse = NextResponse.redirect(new URL(url, request.url))
      response.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    }

    if (session) {
      // Authenticated user path
      if (isRoot || isLogin) {
        // Query home workspace
        const { data: homeWorkspace } = await supabase
          .from("workspaces")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("is_home", true)
          .single()

        if (homeWorkspace) {
          return getRedirectResponse(`/${homeWorkspace.id}/chat`)
        } else {
          return getRedirectResponse(`/setup`)
        }
      }

      // If user is on any other page (like chat) but does not have a workspace, force them to setup
      if (!isSetup) {
        const { data: workspaces } = await supabase
          .from("workspaces")
          .select("id")
          .eq("user_id", session.user.id)

        if (!workspaces || workspaces.length === 0) {
          return getRedirectResponse(`/setup`)
        }
      }
    } else {
      // Unauthenticated user path
      if (!isLogin) {
        return getRedirectResponse(`/login`)
      }
    }

    // Fallback to i18n localization router
    const i18nResult = i18nRouter(request, i18nConfig)
    if (i18nResult) {
      response.cookies.getAll().forEach(cookie => {
        i18nResult.cookies.set(cookie.name, cookie.value, cookie)
      })
      return i18nResult
    }

    return response
  } catch (e) {
    console.error("Middleware error:", e)
    const i18nResult = i18nRouter(request, i18nConfig)
    if (i18nResult) return i18nResult
    return NextResponse.next({
      request: {
        headers: request.headers
      }
    })
  }
}

export const config = {
  matcher: "/((?!api|static|.*\\..*|_next|auth).*)"
}
