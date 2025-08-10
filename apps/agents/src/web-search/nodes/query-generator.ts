import { format } from "date-fns";
import { ChatAnthropic } from "@langchain/anthropic";
import { WebSearchState } from "../state.js";
import { formatMessages } from "../../utils.js";

const QUERY_GENERATOR_PROMPT = `You're a helpful AI assistant tasked with writing a query to search the web.
You're provided with a list of messages between a user and an AI assistant.
The most recent message from the user is the one you should update to be a more search engine friendly query.

Try to keep the new query as similar to the message as possible, while still being search engine friendly.

Here is the conversation between the user and the assistant, in order of oldest to newest:

<conversation>
{conversation}
</conversation>

<additional_context>
{additional_context}
</additional_context>

Respond ONLY with the search query, and nothing else.`;

export async function queryGenerator(
  state: WebSearchState
): Promise<Partial<WebSearchState>> {
  // 检查是否启用 New API
  const useNewApi = process.env.USE_NEW_API === "true";
  
  let model;
  if (useNewApi) {
    // 使用 New API 的搜索查询模型
    const { initChatModel } = await import("langchain/chat_models/universal");
    model = await initChatModel(process.env.NEW_API_SEARCH_QUERY_MODEL || "claude-3-5-sonnet", {
      modelProvider: "openai",
      apiKey: process.env.NEW_API_KEY,
      baseUrl: process.env.NEW_API_BASE_URL,
      temperature: 0,
    });
  } else {
    // 使用传统的 Anthropic 直连
    model = new ChatAnthropic({
      model: "claude-3-5-sonnet-latest",
      temperature: 0,
    });
  }

  const additionalContext = `The current date is ${format(new Date(), "PPpp")}`;

  const formattedMessages = formatMessages(state.messages);
  const formattedPrompt = QUERY_GENERATOR_PROMPT.replace(
    "{conversation}",
    formattedMessages
  ).replace("{additional_context}", additionalContext);

  const response = await model.invoke([["user", formattedPrompt]]);

  return {
    query: response.content as string,
  };
}
