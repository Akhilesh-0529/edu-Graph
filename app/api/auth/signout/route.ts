import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  
  // Call supabase signOut to delete session and clear cookies server-side
  await supabase.auth.signOut()
  
  return new NextResponse(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  })
}
