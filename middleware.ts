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
    const isRoot = pathname === "/" || i18nConfig.locales.some(locale => pathname === `/${locale}`)
    const isLogin = pathname === "/login" || i18nConfig.locales.some(locale => pathname === `/${locale}/login`)

    const getRedirectResponse = (url: string) => {
      const redirectResponse = NextResponse.redirect(new URL(url, request.url))
      response.cookies.getAll().forEach(cookie => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
      })
      return redirectResponse
    }

    if (session) {
      if (isRoot || isLogin) {
        const { data: homeWorkspace, error } = await supabase
          .from("workspaces")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("is_home", true)
          .single()

        if (!homeWorkspace) {
          throw new Error(error?.message || "No home workspace found")
        }

        return getRedirectResponse(`/${homeWorkspace.id}/chat`)
      }
    } else {
      if (isRoot) {
        return getRedirectResponse(`/login`)
      }
    }

    // Fallback to i18n router
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
