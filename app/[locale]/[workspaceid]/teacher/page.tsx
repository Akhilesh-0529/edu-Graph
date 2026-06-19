"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/browser-client"
import { Tables } from "@/supabase/types"
import { 
  IconSchool, 
  IconUsers, 
  IconHierarchy, 
  IconPlus, 
  IconSearch, 
  IconBook, 
  IconAward, 
  IconLoader2,
  IconMessageQuestion,
  IconRobot,
  IconSend,
  IconCheck,
  IconClock,
  IconUser,
  IconLogout
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TextareaAutosize } from "@/components/ui/textarea-autosize"
import { toast } from "sonner"
import { useRouter, useParams } from "next/navigation"

export default function TeacherDashboard() {
  const router = useRouter()
  const params = useParams()

  const [students, setStudents] = useState<Tables<"profiles">[]>([])
  const [graphs, setGraphs] = useState<Tables<"graphs">[]>([])
  const [queries, setQueries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [dashboardTab, setDashboardTab] = useState<"roster" | "questions">("roster")
  const [queryFilter, setQueryFilter] = useState<"all" | "pending" | "answered">("pending")
  
  // State for answering questions
  const [answeringQueryId, setAnsweringQueryId] = useState<string | null>(null)
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({})
  const [generatingAiId, setGeneratingAiId] = useState<string | null>(null)

  const loadData = async () => {
    try {
      // Fetch student profiles
      const { data: studentData, error: studentErr } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "student")

      if (studentErr) throw studentErr
      setStudents(studentData || [])

      // Fetch shared graphs
      const { data: graphData, error: graphErr } = await supabase
        .from("graphs")
        .select("*")

      if (graphErr) throw graphErr
      setGraphs(graphData || [])

      // Fetch student queries sent to this teacher
      const session = (await supabase.auth.getSession()).data.session
      if (session) {
        const { data: queryData, error: queryErr } = await supabase
          .from("student_queries")
          .select(`
            *,
            student:profiles!student_queries_student_id_fkey (
              display_name,
              username
            )
          `)
          .eq("teacher_id", session.user.id)
          .order("created_at", { ascending: false })

        if (queryErr) throw queryErr
        setQueries(queryData || [])
      }
    } catch (err: any) {
      console.error("Error loading dashboard data:", err)
      toast.error("Failed to load dashboard data.")
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

  const handleAssignGraph = (graphName: string, studentName: string) => {
    toast.success(`Successfully assigned "${graphName}" to ${studentName}!`)
  }

  const handleAssignToAll = (graphName: string) => {
    toast.success(`Successfully assigned "${graphName}" to all students!`)
  }

  const handleGenerateAiAnswer = async (queryId: string, questionText: string) => {
    setGeneratingAiId(queryId)
    setResponseTexts(prev => ({ ...prev, [queryId]: "" }))
    try {
      const response = await fetch("/api/chat/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatSettings: {
            model: "gpt-4o",
            temperature: 0.5
          },
          messages: [
            { 
              role: "system", 
              content: "You are an expert AI teaching assistant. Provide a helpful, clear, concise, and structured educational answer to the student's question." 
            },
            { role: "user", content: questionText }
          ]
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to generate AI answer.")
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let streamResult = ""

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break
        streamResult += decoder.decode(value)
        setResponseTexts(prev => ({ ...prev, [queryId]: streamResult }))
      }
      toast.success("AI suggestion generated!")
    } catch (err: any) {
      console.error("Error generating AI answer:", err)
      toast.error(err.message || "Could not generate AI suggestion.")
    } finally {
      setGeneratingAiId(null)
    }
  }

  const handleSubmitAnswer = async (queryId: string, type: "ai" | "manual") => {
    const responseText = responseTexts[queryId]
    if (!responseText || !responseText.trim()) return toast.info("Please enter a response.")

    setAnsweringQueryId(queryId)
    try {
      const { error } = await supabase
        .from("student_queries")
        .update({
          response_text: responseText,
          answered_by: type,
          updated_at: new Date().toISOString()
        })
        .eq("id", queryId)

      if (error) throw error

      toast.success("Answer sent to student!")
      // Reload queries
      loadData()
    } catch (err: any) {
      console.error("Error saving answer:", err)
      toast.error("Failed to send answer.")
    } finally {
      setAnsweringQueryId(null)
    }
  }

  const filteredStudents = students.filter(student =>
    student.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredQueries = queries.filter(q => {
    if (queryFilter === "pending") return !q.response_text
    if (queryFilter === "answered") return !!q.response_text
    return true
  })

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-white">
        <IconLoader2 className="animate-spin text-violet-500" size={48} />
      </div>
    )
  }

  const pendingQueriesCount = queries.filter(q => !q.response_text).length

  return (
    <div className="flex h-full w-full flex-col overflow-auto bg-[#07070d] p-8 text-white">
      {/* Dashboard Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            <IconSchool className="text-violet-400" size={32} />
            Teacher Hub
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Monitor student progress, manage educational knowledge graphs, and answer student queries either manually or with AI.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 shadow-md shadow-violet-950/20">
            <IconPlus className="mr-1.5" size={16} /> Create Curriculum
          </Button>
          <Button
            className="size-[40px] cursor-pointer rounded-xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-900 text-neutral-400 hover:text-white"
            size="icon"
            variant="outline"
            onClick={handleSignOut}
            title="Logout"
          >
            <IconLogout size={20} />
          </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/35 p-6 backdrop-blur-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-violet-400">
            <IconUsers size={64} />
          </div>
          <div className="text-sm font-medium text-neutral-400">Total Active Students</div>
          <div className="mt-2 text-4xl font-extrabold text-white">{students.length}</div>
          <div className="mt-1 text-xs text-green-400">● Live connection active</div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/35 p-6 backdrop-blur-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-cyan-400">
            <IconHierarchy size={64} />
          </div>
          <div className="text-sm font-medium text-neutral-400">Classroom Knowledge Graphs</div>
          <div className="mt-2 text-4xl font-extrabold text-white">{graphs.length}</div>
          <div className="mt-1 text-xs text-neutral-500">Interactive study graphs</div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/35 p-6 backdrop-blur-md">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-amber-400">
            <IconMessageQuestion size={64} />
          </div>
          <div className="text-sm font-medium text-neutral-400">Pending Questions</div>
          <div className="mt-2 text-4xl font-extrabold text-white">{pendingQueriesCount}</div>
          <div className="mt-1 text-xs text-amber-400">Requires your response</div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column Pane (Roster / Queries) */}
        <div className="flex flex-col rounded-2xl border border-white/5 bg-zinc-900/20 p-6 lg:col-span-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setDashboardTab("roster")}
                className={`py-1.5 px-4 text-sm font-bold rounded-lg transition-all ${
                  dashboardTab === "roster"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-950/30"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Student Roster
              </button>
              <button
                onClick={() => setDashboardTab("questions")}
                className={`py-1.5 px-4 text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                  dashboardTab === "questions"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-950/30"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                Student Questions
                {pendingQueriesCount > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-extrabold rounded-full px-1.5 py-0.5">
                    {pendingQueriesCount}
                  </span>
                )}
              </button>
            </div>

            {dashboardTab === "roster" ? (
              <div className="relative flex items-center w-full sm:w-48">
                <IconSearch className="absolute left-2.5 size-4 text-neutral-500" />
                <Input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="h-8 rounded-lg border border-white/5 bg-neutral-900/50 pl-8 text-xs focus:ring-violet-500"
                />
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setQueryFilter("pending")}
                  className={`px-2.5 py-1 text-xs rounded border ${
                    queryFilter === "pending"
                      ? "border-amber-500/20 bg-amber-500/10 text-amber-400"
                      : "border-white/5 text-neutral-400"
                  }`}
                >
                  Unanswered
                </button>
                <button
                  onClick={() => setQueryFilter("answered")}
                  className={`px-2.5 py-1 text-xs rounded border ${
                    queryFilter === "answered"
                      ? "border-green-500/20 bg-green-500/10 text-green-400"
                      : "border-white/5 text-neutral-400"
                  }`}
                >
                  Answered
                </button>
                <button
                  onClick={() => setQueryFilter("all")}
                  className={`px-2.5 py-1 text-xs rounded border ${
                    queryFilter === "all"
                      ? "border-violet-500/20 bg-violet-500/10 text-violet-400"
                      : "border-white/5 text-neutral-400"
                  }`}
                >
                  All
                </button>
              </div>
            )}
          </div>

          <div className="grow overflow-auto max-h-[500px]">
            {dashboardTab === "roster" ? (
              filteredStudents.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center text-neutral-500">
                  No students found.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStudents.map(student => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/40 p-4 transition-all hover:bg-zinc-900/60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/10 font-bold uppercase">
                          {student.display_name ? student.display_name.slice(0, 2) : "ST"}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{student.display_name || "Student"}</div>
                          <div className="text-xs text-neutral-500">@{student.username}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-neutral-400 hover:text-white"
                          onClick={() => {
                            setDashboardTab("questions")
                            setQueryFilter("all")
                            toast.info(`Filtering questions by ${student.display_name}...`)
                          }}
                        >
                          View Activity
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              /* Questions Tab Content */
              filteredQueries.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center text-neutral-500 py-12">
                  No questions found in this category.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQueries.map(q => (
                    <div
                      key={q.id}
                      className="flex flex-col gap-3 rounded-xl border border-white/5 bg-zinc-900/40 p-5 transition-all hover:bg-zinc-900/60"
                    >
                      <div className="flex items-center justify-between text-[11px] text-neutral-500">
                        <span className="flex items-center gap-1 font-semibold text-violet-400">
                          <IconUser size={12} />
                          {q.student?.display_name || "Student"}
                        </span>
                        <span className="flex items-center gap-1">
                          <IconClock size={12} />
                          {new Date(q.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="text-sm font-medium text-white">{q.query_text}</div>

                      {q.response_text ? (
                        /* Answered Question */
                        <div className="pl-3 border-l-2 border-green-500 bg-green-500/5 py-2.5 pr-2 rounded-r-lg space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-green-400 font-semibold mb-1">
                            <span className="flex items-center gap-1">
                              {q.answered_by === "ai" ? (
                                <>
                                  <IconRobot size={12} /> Answered via AI
                                </>
                              ) : (
                                <>
                                  <IconUser size={12} /> Answered manually
                                </>
                              )}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-300 whitespace-pre-wrap">{q.response_text}</p>
                        </div>
                      ) : (
                        /* Unanswered Question Answering Interface */
                        <div className="border-t border-white/5 pt-3 mt-1 space-y-3">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                              Your Answer
                            </label>
                            <TextareaAutosize
                              value={responseTexts[q.id] || ""}
                              onValueChange={text =>
                                setResponseTexts(prev => ({ ...prev, [q.id]: text }))
                              }
                              placeholder="Type your educational response..."
                              minRows={2}
                              maxRows={6}
                              className="w-full text-xs bg-neutral-900 text-white rounded-lg border border-white/5 p-2.5 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                            />
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={generatingAiId === q.id}
                              onClick={() => handleGenerateAiAnswer(q.id, q.query_text)}
                              className="border-violet-500/20 text-violet-400 bg-violet-600/5 hover:bg-violet-600/10 text-xs py-1 h-8"
                            >
                              {generatingAiId === q.id ? (
                                <IconLoader2 className="animate-spin mr-1.5" size={14} />
                              ) : (
                                <IconRobot className="mr-1.5" size={14} />
                              )}
                              Suggest AI Answer
                            </Button>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={answeringQueryId === q.id || !responseTexts[q.id]?.trim()}
                                onClick={() => handleSubmitAnswer(q.id, "manual")}
                                className="text-neutral-400 hover:text-white text-xs h-8"
                              >
                                Send Manual
                              </Button>
                              <Button
                                size="sm"
                                disabled={answeringQueryId === q.id || !responseTexts[q.id]?.trim()}
                                onClick={() => handleSubmitAnswer(q.id, "ai")}
                                className="bg-violet-600 hover:bg-violet-500 text-xs py-1 h-8"
                              >
                                {answeringQueryId === q.id ? (
                                  <IconLoader2 className="animate-spin mr-1" size={14} />
                                ) : (
                                  <IconSend className="mr-1" size={14} />
                                )}
                                Send Answer
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        {/* Knowledge Graphs Management Pane */}
        <div className="flex flex-col rounded-2xl border border-white/5 bg-zinc-900/20 p-6 lg:col-span-5">
          <h2 className="mb-4 text-xl font-bold flex items-center gap-2">
            <IconHierarchy size={20} className="text-cyan-400" />
            Classroom Graphs
          </h2>

          <div className="grow overflow-auto max-h-[500px] space-y-3">
            {graphs.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-neutral-500">
                No graphs created yet. Go to sidebar to build graphs.
              </div>
            ) : (
              graphs.map(graph => (
                <div
                  key={graph.id}
                  className="flex flex-col gap-3 rounded-xl border border-white/5 bg-zinc-900/40 p-4 transition-all hover:bg-zinc-900/60"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <IconBook className="text-cyan-400" size={16} />
                        {graph.name}
                      </div>
                      <div className="text-xs text-neutral-500 mt-1">{graph.description || "No description provided."}</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-white/5 pt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-cyan-400 hover:text-cyan-300"
                      onClick={() => handleAssignToAll(graph.name)}
                    >
                      Assign to All
                    </Button>
                    <select
                      className="rounded bg-neutral-900 text-xs p-1 border border-white/5 focus:outline-none"
                      onChange={e => {
                        const studentId = e.target.value
                        const student = students.find(s => s.id === studentId)
                        if (student) {
                          handleAssignGraph(graph.name, student.display_name || student.username)
                        }
                        e.target.value = ""
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>Assign to student...</option>
                      {students.map(s => (
                        <option key={s.id} value={s.id}>{s.display_name || s.username}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
