"use client"

import { ChangePassword } from "@/components/utility/change-password"
import { supabase } from "@/lib/supabase/browser-client"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(true)

  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    ;(async () => {
      const session = (await supabase.auth.getSession()).data.session

      if (!session) {
        const locale = params.locale as string ?? "en"
        router.push(`/${locale}/login`)
      } else {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) {
    return null
  }

  return <ChangePassword />
}
