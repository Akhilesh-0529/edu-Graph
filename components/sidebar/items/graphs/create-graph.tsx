import { SidebarCreateItem } from "@/components/sidebar/items/all/sidebar-create-item"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChatbotUIContext } from "@/context/context"
import { TablesInsert } from "@/supabase/types"
import { FC, useContext, useState } from "react"

interface CreateGraphProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
}

export const CreateGraph: FC<CreateGraphProps> = ({
  isOpen,
  onOpenChange
}) => {
  const { profile, selectedWorkspace } = useContext(ChatbotUIContext)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isTyping, setIsTyping] = useState(false)

  if (!profile || !selectedWorkspace) return null

  return (
    <SidebarCreateItem
      contentType="graphs"
      createState={
        {
          user_id: profile.user_id,
          name,
          description
        } as TablesInsert<"graphs">
      }
      isOpen={isOpen}
      isTyping={isTyping}
      onOpenChange={onOpenChange}
      renderInputs={() => (
        <>
          <div className="space-y-1">
            <Label>Name</Label>
            <Input
              placeholder="Graph name..."
              value={name}
              onChange={e => setName(e.target.value)}
              onCompositionStart={() => setIsTyping(true)}
              onCompositionEnd={() => setIsTyping(false)}
              maxLength={100}
            />
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Input
              placeholder="Graph description..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              onCompositionStart={() => setIsTyping(true)}
              onCompositionEnd={() => setIsTyping(false)}
              maxLength={500}
            />
          </div>
        </>
      )}
    />
  )
}
