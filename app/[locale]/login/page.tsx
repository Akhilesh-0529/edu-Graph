import { createClient } from "@/lib/supabase/server"
import { Database } from "@/supabase/types"
import { createServerClient } from "@supabase/ssr"
import { Metadata } from "next"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { LoginForm } from "@/components/utility/login-form"

export const metadata: Metadata = {
  title: "Login"
}

export default async function Login({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ message: string }>
}) {
  const { locale } = await params
  const resolvedParams = await searchParams
  const cookieStore = await cookies()
  const supabaseClient = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        }
      }
    }
  )
  const {
    data: { user }
  } = await supabaseClient.auth.getUser()

  if (user) {
    console.log("Skipping login: active session found, redirecting to workspace")
    const { data: homeWorkspace } = await supabaseClient
      .from("workspaces")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_home", true)
      .single()

    if (!homeWorkspace) {
      return redirect(`/${locale}/setup`)
    }

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single()

    const userRole = profile?.role || "student"

    if (userRole === "teacher") {
      return redirect(`/${locale}/${homeWorkspace.id}/teacher`)
    } else if (userRole === "admin") {
      return redirect(`/${locale}/${homeWorkspace.id}/admin`)
    }

    return redirect(`/${locale}/${homeWorkspace.id}/chat`)
  }

  const signIn = async (formData: FormData) => {
    "use server"

    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return redirect(`/${locale}/login?message=${error.message}`)
    }

    const { data: homeWorkspace } = await supabase
      .from("workspaces")
      .select("*")
      .eq("user_id", data.user.id)
      .eq("is_home", true)
      .single()

    if (!homeWorkspace) {
      return redirect(`/${locale}/setup`)
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", data.user.id)
      .single()

    const userRole = profile?.role || "student"

    if (userRole === "teacher") {
      return redirect(`/${locale}/${homeWorkspace.id}/teacher`)
    } else if (userRole === "admin") {
      return redirect(`/${locale}/${homeWorkspace.id}/admin`)
    }

    return redirect(`/${locale}/${homeWorkspace.id}/chat`)
  }

  const signUp = async (formData: FormData) => {
    "use server"

    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as string || "student"

    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role
        }
      }
    })

    if (error) {
      console.error(error)
      return redirect(`/${locale}/login?message=${error.message}`)
    }

    return redirect(`/${locale}/setup`)
  }

  const handleResetPassword = async (formData: FormData) => {
    "use server"

    const origin = (await headers()).get("origin")
    const email = formData.get("email") as string
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/login/password`
    })

    if (error) {
      return redirect(`/${locale}/login?message=${error.message}`)
    }

    return redirect(`/${locale}/login?message=Check email to reset password`)
  }

  return (
    <LoginForm
      signInAction={signIn}
      signUpAction={signUp}
      resetPasswordAction={handleResetPassword}
      message={resolvedParams?.message}
    />
  )
}
