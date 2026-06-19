"use client"

import { FC, useContext, useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/browser-client"
import { ChatbotUIContext } from "@/context/context"
import { Tables } from "@/supabase/types"
import { 
  IconSchool, 
  IconMessage2, 
  IconSend, 
  IconClock, 
  IconCheck, 
  IconRobot, 
  IconUser, 
  IconLoader2 
} from "@tabler/icons-react"
import { Button } from "../ui/button"
import { TextareaAutosize } from "../ui/textarea-autosize"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "../ui/dialog"
import { WithTooltip } from "../ui/with-tooltip"
import { toast } from "sonner"

export const ContactTeacher: FC = () => {
  const { profile } = useContext(ChatbotUIContext)
  const [isOpen, setIsOpen] = useState(false)
  const [teachers, setTeachers] = useState<Tables<"profiles">[]>([])
  const [queries, setQueries] = useState<any[]>([])
  const [selectedTeacherId, setSelectedTeacherId] = useState("")
  const [queryText, setQueryText] = useState("")
  const [activeTab, setActiveTab] = useState<"send" | "history">("send")
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  // Only show if the user is a student
  if (profile?.role !== "student") return null

  const fetchTeachersAndQueries = async () => {
    setFetching(true)
    try {
      // Fetch teachers
      const { data: teacherData, error: teacherErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "teacher")

      if (teacherErr) throw teacherErr
      setTeachers(teacherData || [])
      if (teacherData && teacherData.length > 0) {
        setSelectedTeacherId(teacherData[0].user_id)
      }

      // Fetch user's sent queries
      const { data: queryData, error: queryErr } = await supabase
        .from("student_queries")
        .select(`
          *,
          teacher:profiles!student_queries_teacher_id_fkey (
            display_name,
            username
          )
        `)
        .order("created_at", { ascending: false })

      if (queryErr) throw queryErr
      setQueries(queryData || [])
    } catch (err) {
      console.error("Error loading teacher query data:", err)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchTeachersAndQueries()
    }
  }, [isOpen])

  const handleSubmitQuery = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!queryText.trim()) return toast.info("Please enter a question.")
    if (!selectedTeacherId) return toast.info("Please select a teacher.")

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("student_queries")
        .insert({
          student_id: profile.user_id,
          teacher_id: selectedTeacherId,
          query_text: queryText
        })
        .select()

      if (error) throw error

      toast.success("Question submitted to your teacher!")
      setQueryText("")
      setActiveTab("history")
      fetchTeachersAndQueries()
    } catch (err: any) {
      console.error("Error submitting question:", err)
      toast.error("Failed to submit question.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <div>
          <WithTooltip
            display={<div>Contact Teacher</div>}
            trigger={
              <Button
                size="icon"
                variant="ghost"
                className="bg-primary text-secondary size-[30px] rounded-full p-1 opacity-60 hover:opacity-100"
              >
                <IconSchool size={20} />
              </Button>
            }
          />
        </div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] border border-white/5 bg-zinc-950 text-white p-6 rounded-2xl">
        <DialogHeader className="mb-4">
          <DialogTitle className="flex items-center gap-2 text-xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            <IconSchool className="text-violet-400" size={24} />
            Contact Your Teacher
          </DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-2 p-1 bg-zinc-900 rounded-lg mb-4">
          <button
            onClick={() => setActiveTab("send")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "send"
                ? "bg-violet-600 text-white shadow-md shadow-violet-950/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Ask a Question
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              activeTab === "history"
                ? "bg-violet-600 text-white shadow-md shadow-violet-950/30"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            My Questions ({queries.length})
          </button>
        </div>

        {activeTab === "send" ? (
          <form onSubmit={handleSubmitQuery} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400">Select Teacher</label>
              {teachers.length === 0 ? (
                <div className="text-xs text-neutral-500">No teachers available.</div>
              ) : (
                <select
                  value={selectedTeacherId}
                  onChange={e => setSelectedTeacherId(e.target.value)}
                  className="w-full rounded-lg border border-white/5 bg-neutral-900 p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
                >
                  {teachers.map(teacher => (
                    <option key={teacher.user_id} value={teacher.user_id}>
                      {teacher.display_name || `@${teacher.username}`}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-400">Your Question</label>
              <TextareaAutosize
                value={queryText}
                onValueChange={setQueryText}
                placeholder="Ask about dynamic knowledge graphs, presets, or classroom curriculum..."
                minRows={4}
                maxRows={8}
                className="w-full text-sm bg-neutral-900 text-white rounded-lg border border-white/5 p-3 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !selectedTeacherId || !queryText.trim()}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <IconLoader2 className="animate-spin" size={16} />
              ) : (
                <>
                  <IconSend size={16} /> Submit to Teacher
                </>
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 max-h-[300px] overflow-auto pr-1">
            {fetching ? (
              <div className="flex h-32 items-center justify-center">
                <IconLoader2 className="animate-spin text-violet-500" size={24} />
              </div>
            ) : queries.length === 0 ? (
              <div className="text-center text-xs text-neutral-500 py-12">
                You haven't submitted any questions yet.
              </div>
            ) : (
              queries.map(q => (
                <div key={q.id} className="rounded-xl border border-white/5 bg-zinc-900/40 p-4 space-y-2">
                  <div className="flex items-center justify-between text-[10px] text-neutral-500">
                    <span className="flex items-center gap-1">
                      <IconUser size={12} />
                      To: {q.teacher?.display_name || "Teacher"}
                    </span>
                    <span className="flex items-center gap-1">
                      <IconClock size={12} />
                      {new Date(q.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white">{q.query_text}</p>
                  
                  {q.response_text ? (
                    <div className="mt-2 pl-3 border-l-2 border-green-500 bg-green-500/5 py-2 pr-2 rounded-r-lg space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="flex items-center gap-1 text-green-400 font-semibold">
                          {q.answered_by === "ai" ? (
                            <>
                              <IconRobot size={12} /> AI Assistant Answer
                            </>
                          ) : (
                            <>
                              <IconUser size={12} /> Teacher Response
                            </>
                          )}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300">{q.response_text}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-amber-500">
                      <IconClock size={14} /> Pending teacher response...
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
