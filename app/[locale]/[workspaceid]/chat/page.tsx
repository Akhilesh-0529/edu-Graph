"use client"

import { ChatHelp } from "@/components/chat/chat-help"
import { ContactTeacher } from "@/components/chat/contact-teacher"
import { useChatHandler } from "@/components/chat/chat-hooks/use-chat-handler"
import { ChatInput } from "@/components/chat/chat-input"
import { ChatSettings } from "@/components/chat/chat-settings"
import { ChatUI } from "@/components/chat/chat-ui"
import { QuickSettings } from "@/components/chat/quick-settings"
import { Brand } from "@/components/ui/brand"
import { ChatbotUIContext } from "@/context/context"
import useHotkey from "@/lib/hooks/use-hotkey"
import { useTheme } from "next-themes"
import { useContext } from "react"
import { useRouter, useParams } from "next/navigation"
import { supabase } from "@/lib/supabase/browser-client"
import { Button } from "@/components/ui/button"
import { IconLogout } from "@tabler/icons-react"

export default function ChatPage() {
  useHotkey("o", () => handleNewChat())
  useHotkey("l", () => {
    handleFocusChatInput()
  })

  const { chatMessages } = useContext(ChatbotUIContext)

  const { handleNewChat, handleFocusChatInput } = useChatHandler()

  const { theme } = useTheme()
  const router = useRouter()
  const params = useParams()

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" })
    await supabase.auth.signOut()
    const locale = params.locale as string ?? "en"
    router.push(`/${locale}/login`)
    router.refresh()
  }

  return (
    <>
      {chatMessages.length === 0 ? (
        <div className="relative flex h-full flex-col items-center justify-center">
          <div className="top-50% left-50% -translate-x-50% -translate-y-50% absolute mb-20">
            <Brand theme={theme === "dark" ? "dark" : "light"} />
          </div>

          <div className="absolute left-2 top-2">
            <QuickSettings />
          </div>

          <div className="absolute right-2 top-2 flex items-center gap-2">
            <ChatSettings />
            <Button
              className="size-[36px] cursor-pointer rounded hover:opacity-50"
              size="icon"
              variant="ghost"
              onClick={handleSignOut}
            >
              <IconLogout size={20} />
            </Button>
          </div>

          <div className="flex grow flex-col items-center justify-center" />

          <div className="w-full min-w-[300px] items-end px-2 pb-3 pt-0 sm:w-[600px] sm:pb-8 sm:pt-5 md:w-[700px] lg:w-[700px] xl:w-[800px]">
            <ChatInput />
          </div>

          <div className="absolute bottom-2 right-2 hidden md:flex items-center gap-2 lg:bottom-4 lg:right-4">
            <ContactTeacher />
            <ChatHelp />
          </div>
        </div>
      ) : (
        <ChatUI />
      )}
    </>
  )
}
