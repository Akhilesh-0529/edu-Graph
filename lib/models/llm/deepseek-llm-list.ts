import { LLM } from "@/types"

const DEEPSEEK_PLATFORM_LINK = "https://platform.deepseek.com/"

// DeepSeek Models
const DEEPSEEK_CHAT: LLM = {
  modelId: "deepseek-chat",
  modelName: "DeepSeek Chat",
  provider: "deepseek",
  hostedId: "deepseek-chat",
  platformLink: DEEPSEEK_PLATFORM_LINK,
  imageInput: false
}

const DEEPSEEK_CODER: LLM = {
  modelId: "deepseek-coder",
  modelName: "DeepSeek Coder",
  provider: "deepseek",
  hostedId: "deepseek-coder",
  platformLink: DEEPSEEK_PLATFORM_LINK,
  imageInput: false
}

export const DEEPSEEK_LLM_LIST: LLM[] = [DEEPSEEK_CHAT, DEEPSEEK_CODER]
