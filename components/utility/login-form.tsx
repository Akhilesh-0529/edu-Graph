"use client"

import React, { useState, useEffect } from "react"
import { 
  IconMail, 
  IconLock, 
  IconBooks, 
  IconHierarchy, 
  IconUser,
  IconArrowRight,
  IconLoader2
} from "@tabler/icons-react"

interface LoginFormProps {
  signInAction: (formData: FormData) => Promise<void>
  signUpAction: (formData: FormData) => Promise<void>
  resetPasswordAction: (formData: FormData) => Promise<void>
  message?: string
}

type Mode = "signin" | "signup" | "reset"
type Role = "student" | "teacher" | "admin"

export function LoginForm({
  signInAction,
  signUpAction,
  resetPasswordAction,
  message: initialMessage
}: LoginFormProps) {
  const [mode, setMode] = useState<Mode>("signin")
  const [role, setRole] = useState<Role>("student")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState(initialMessage || "")
  const [loading, setLoading] = useState(false)

  // Demo credentials mapping
  const demoCredentials: Record<Role, { email: string; pass: string }> = {
    student: { email: "test@test.com", pass: "password" },
    teacher: { email: "test@test.com", pass: "password" },
    admin: { email: "test@test.com", pass: "password" }
  }

  // Pre-fill fields when role changes
  useEffect(() => {
    if (mode === "signin") {
      const creds = demoCredentials[role]
      setEmail(creds.email)
      setPassword(creds.pass)
    }
  }, [role, mode])

  const handleAction = async (e: React.FormEvent<HTMLFormElement>, actionFn: (formData: FormData) => Promise<void>) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    const formData = new FormData()
    formData.append("email", email)
    if (mode !== "reset") {
      formData.append("password", password)
    }

    try {
      await actionFn(formData)
    } catch (err: any) {
      setMessage(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#05050a] px-4 text-white">
      {/* Dynamic Ambient Background Blobs */}
      <div className="absolute top-1/4 left-1/4 -z-10 size-[350px] rounded-full bg-violet-600/10 blur-[100px] animate-pulse duration-4000"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 size-[400px] rounded-full bg-cyan-600/10 blur-[120px] animate-pulse duration-6000"></div>

      {/* Login Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/5 bg-zinc-950/45 p-8 shadow-2xl backdrop-blur-xl">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        {/* Card Header */}
        <div className="mb-8 flex flex-col items-center text-center">
          {/* Stylized Connected Graph Logo */}
          <div className="relative mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20 shadow-inner">
            <div className="relative size-6">
              <span className="absolute left-1/2 top-0 size-2 -translate-x-1/2 rounded-full bg-violet-400 shadow-[0_0_8px_#a78bfa]"></span>
              <span className="absolute bottom-0 left-0 size-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]"></span>
              <span className="absolute bottom-0 right-0 size-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></span>
              <svg className="absolute inset-0 size-full overflow-visible" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5">
                <line x1="50%" y1="15%" x2="15%" y2="85%" />
                <line x1="50%" y1="15%" x2="85%" y2="85%" />
                <line x1="15%" y1="85%" x2="85%" y2="85%" />
              </svg>
            </div>
          </div>

          <h1 className="bg-gradient-to-r from-violet-400 via-purple-300 to-cyan-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            EduSphère
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Interactive Educational Knowledge Graph
          </p>
        </div>

        {/* Mode Selector (Sign In vs Sign Up vs Reset) */}
        {mode === "signin" && (
          <div className="mb-6">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-neutral-900/60 p-1 border border-white/5">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  role === "student"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-900/30"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <IconBooks size={16} />
                Student
              </button>
              <button
                type="button"
                onClick={() => setRole("teacher")}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  role === "teacher"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-900/30"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <IconHierarchy size={16} />
                Teacher
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                  role === "admin"
                    ? "bg-violet-600 text-white shadow-md shadow-violet-900/30"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <IconUser size={16} />
                Admin
              </button>
            </div>
          </div>
        )}

        {/* Form Content */}
        <form
          onSubmit={(e) => 
            handleAction(
              e, 
              mode === "signin" 
                ? signInAction 
                : mode === "signup" 
                  ? signUpAction 
                  : resetPasswordAction
            )
          }
          className="space-y-4"
        >
          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400" htmlFor="email">
              Email Address
            </label>
            <div className="relative flex items-center">
              <IconMail className="absolute left-3.5 size-5 text-neutral-500" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full rounded-xl border border-white/5 bg-neutral-900/30 py-3 pr-4 pl-11 text-sm outline-none transition-all placeholder:text-neutral-600 focus:border-violet-500 focus:bg-neutral-900/50 focus:ring-1 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Password input */}
          {mode !== "reset" && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-400" htmlFor="password">
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => setMode("reset")}
                    className="text-xs text-violet-400 hover:text-violet-300 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative flex items-center">
                <IconLock className="absolute left-3.5 size-5 text-neutral-500" />
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/5 bg-neutral-900/30 py-3 pr-4 pl-11 text-sm outline-none transition-all placeholder:text-neutral-600 focus:border-violet-500 focus:bg-neutral-900/50 focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>
          )}

          {/* Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold tracking-wide text-white shadow-lg shadow-violet-950/20 transition-all hover:from-violet-500 hover:to-indigo-500 active:scale-98 disabled:pointer-events-none disabled:opacity-50"
          >
            {loading ? (
              <IconLoader2 className="size-5 animate-spin" />
            ) : (
              <>
                {mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Email"}
                <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        {/* Form Mode Toggle Toggles */}
        <div className="mt-6 flex flex-col items-center justify-center space-y-2 text-center text-xs">
          {mode === "signin" && (
            <div className="text-neutral-400">
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup")
                  setPassword("")
                }}
                className="font-semibold text-violet-400 hover:text-violet-300 hover:underline"
              >
                Sign Up
              </button>
            </div>
          )}

          {mode === "signup" && (
            <div className="text-neutral-400">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("signin")}
                className="font-semibold text-violet-400 hover:text-violet-300 hover:underline"
              >
                Sign In
              </button>
            </div>
          )}

          {mode === "reset" && (
            <button
              type="button"
              onClick={() => setMode("signin")}
              className="font-semibold text-violet-400 hover:text-violet-300 hover:underline"
            >
              Back to Sign In
            </button>
          )}
        </div>

        {/* Message / Error Box */}
        {message && (
          <div className="mt-6 rounded-xl border border-rose-500/10 bg-rose-500/5 p-4 text-center text-xs text-rose-300/90 backdrop-blur-sm">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
