"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/browser-client"
import { Tables } from "@/supabase/types"
import { 
  IconShield, 
  IconUsers, 
  IconSettings, 
  IconDatabase, 
  IconRefresh, 
  IconLoader2, 
  IconCheck, 
  IconAlertTriangle,
  IconLogout
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter, useParams } from "next/navigation"

export default function AdminDashboard() {
  const router = useRouter()
  const params = useParams()

  const [profiles, setProfiles] = useState<Tables<"profiles">[]>([])
  const [workspacesCount, setWorkspacesCount] = useState(0)
  const [messagesCount, setMessagesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      // Fetch all profiles in the system
      const { data: profileData, error: profileErr } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (profileErr) throw profileErr
      setProfiles(profileData || [])

      // Fetch count of workspaces
      const { count: wsCount, error: wsErr } = await supabase
        .from("workspaces")
        .select("*", { count: "exact", head: true })

      if (wsErr) throw wsErr
      setWorkspacesCount(wsCount || 0)

      // Fetch count of messages
      const { count: msgCount, error: msgErr } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })

      if (msgErr) throw msgErr
      setMessagesCount(msgCount || 0)

    } catch (err: any) {
      console.error("Error loading admin data:", err)
      toast.error("Failed to load admin data. Ensure you have admin access.")
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" })
      await supabase.auth.signOut()
      const locale = params.locale as string ?? "en"
      router.push(`/${locale}/login`)
      router.refresh()
    } catch (err: any) {
      console.error("Error signing out:", err)
      toast.error("Failed to log out.")
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleRoleChange = async (profileId: string, newRole: string) => {
    setUpdatingId(profileId)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", profileId)

      if (error) throw error

      setProfiles(prev =>
        prev.map(p => (p.id === profileId ? { ...p, role: newRole } : p))
      )
      toast.success("User role updated successfully!")
    } catch (err: any) {
      console.error("Error updating role:", err)
      toast.error("Failed to update user role.")
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-white">
        <IconLoader2 className="animate-spin text-violet-500" size={48} />
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-[#07070d] p-8 text-white">
      {/* Admin Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-red-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent">
            <IconShield className="text-red-400" size={32} />
            Admin Console
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            System administration, user role assignments, and global platform analytics.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline"
            onClick={loadData}
            className="border-white/10 bg-zinc-900/50 hover:bg-zinc-900"
          >
            <IconRefresh className="mr-1.5" size={16} /> Refresh Metrics
          </Button>
          <Button
            className="size-[40px] cursor-pointer rounded-xl border border-white/10 bg-zinc-900/50 hover:bg-zinc-900 text-neutral-400 hover:text-white"
            size="icon"
            variant="outline"
            onClick={handleSignOut}
            title="Logout"
          >
            <IconLogout size={20} />
          </Button>
        </div>
      </div>

      {/* Admin Stats Grid */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/35 p-6 backdrop-blur-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-violet-400">
            <IconUsers size={64} />
          </div>
          <div className="text-sm font-medium text-neutral-400">Total Users</div>
          <div className="mt-2 text-4xl font-extrabold text-white">{profiles.length}</div>
          <div className="mt-1 text-xs text-neutral-500">
            Student / Teacher / Admin profiles
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/35 p-6 backdrop-blur-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-cyan-400">
            <IconDatabase size={64} />
          </div>
          <div className="text-sm font-medium text-neutral-400">Active Workspaces</div>
          <div className="mt-2 text-4xl font-extrabold text-white">{workspacesCount}</div>
          <div className="mt-1 text-xs text-neutral-500">Database workspaces allocated</div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/35 p-6 backdrop-blur-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-400">
            <IconSettings size={64} />
          </div>
          <div className="text-sm font-medium text-neutral-400">System Messages</div>
          <div className="mt-2 text-4xl font-extrabold text-white">{messagesCount}</div>
          <div className="mt-1 text-xs text-neutral-500">Total chat messages logged</div>
        </div>
      </div>

      {/* Main Admin Section */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-12">
        {/* User Management Panel */}
        <div className="flex flex-col rounded-2xl border border-white/5 bg-zinc-900/20 p-6 xl:col-span-8">
          <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
            <IconUsers size={20} className="text-violet-400" />
            User Access Management
          </h2>

          <div className="grow overflow-auto max-h-[500px]">
            <table className="w-full text-left text-sm text-neutral-400">
              <thead className="border-b border-white/5 text-xs uppercase text-neutral-500">
                <tr>
                  <th scope="col" className="py-3 px-4">User</th>
                  <th scope="col" className="py-3 px-4">Username</th>
                  <th scope="col" className="py-3 px-4">Joined Date</th>
                  <th scope="col" className="py-3 px-4">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {profiles.map(profile => (
                  <tr key={profile.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 font-semibold text-white flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/10 font-bold text-xs uppercase">
                        {profile.display_name ? profile.display_name.slice(0, 2) : "US"}
                      </div>
                      {profile.display_name || "Unknown User"}
                    </td>
                    <td className="py-4 px-4 text-xs font-mono">@{profile.username}</td>
                    <td className="py-4 px-4 text-xs">
                      {new Date(profile.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      {updatingId === profile.id ? (
                        <IconLoader2 className="animate-spin text-violet-500 size-4" />
                      ) : (
                        <select
                          value={profile.role}
                          onChange={e => handleRoleChange(profile.id, e.target.value)}
                          className="rounded bg-neutral-900 border border-white/10 text-xs text-white p-1 focus:ring-1 focus:ring-violet-500 outline-none"
                        >
                          <option value="student">Student</option>
                          <option value="teacher">Teacher</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global System Settings */}
        <div className="flex flex-col gap-6 rounded-2xl border border-white/5 bg-zinc-900/20 p-6 xl:col-span-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
              <IconSettings size={20} className="text-red-400" />
              System Config
            </h2>
            <p className="text-xs text-neutral-400">
              Manage platform settings and verify third-party service connections.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/40 p-4">
              <div>
                <div className="text-sm font-semibold">Supabase Connection</div>
                <div className="text-xs text-neutral-500">RLS and schema synchrony</div>
              </div>
              <IconCheck className="text-green-500" size={20} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/40 p-4">
              <div>
                <div className="text-sm font-semibold">Security Level Policies</div>
                <div className="text-xs text-neutral-500">Admin/Teacher role restriction</div>
              </div>
              <IconCheck className="text-green-500" size={20} />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/40 p-4">
              <div>
                <div className="text-sm font-semibold">External LLM Providers</div>
                <div className="text-xs text-neutral-500">API keys verification status</div>
              </div>
              <IconAlertTriangle className="text-amber-400 animate-pulse" size={20} />
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-white/5 text-center text-[10px] text-neutral-500">
            Chatbot UI Admin Version 2.0.0
          </div>
        </div>
      </div>
    </div>
  )
}
