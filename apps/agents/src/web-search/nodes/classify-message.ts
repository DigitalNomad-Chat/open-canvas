import { ChatAnthropic } from "@langchain/anthropic";
import { WebSearchState } from "../state.js";
import z from "zod";

const CLASSIFIER_PROMPT = `You're a helpful AI assistant tasked with classifying the user's latest message.
The user has enabled web search for their conversation, however not all messages should be searched.

Analyze their latest message in isolation and determine if it warrants a web search to include additional context.

<message>
{message}
</message>`;

const classificationSchema = z
  .object({
    shouldSearch: z
      .boolean()
      .describe(
        "Whether or not to search the web based on the user's latest message."
      ),
  })
  .describe("The classification of the user's latest message.");

export async function classifyMessage(
  state: WebSearchState
): Promise<Partial<WebSearchState>> {
  // 检查是否启用 New API
  const useNewApi = process.env.USE_NEW_API === "true";
  
  let model;
  if (useNewApi) {
    // 使用 New API 的搜索分类模型
    const { initChatModel } = await import("langchain/chat_models/universal");
    const baseModel = await initChatModel(process.env.NEW_API_SEARCH_CLASSIFY_MODEL || "claude-3-5-sonnet", {
      modelProvider: "openai",
      apiKey: process.env.NEW_API_KEY,
      baseUrl: process.env.NEW_API_BASE_URL,
      temperature: 0,
    });
    model = baseModel.withStructuredOutput(classificationSchema, {
      name: "classify_message",
    });
  } else {
    // 使用传统的 Anthropic 直连
    model = new ChatAnthropic({
      model: "claude-3-5-sonnet-latest",
      temperature: 0,
    }).withStructuredOutput(classificationSchema, {
      name: "classify_message",
    });
  }

  const latestMessageContent = state.messages[state.messages.length - 1]
    .content as string;
  const formattedPrompt = CLASSIFIER_PROMPT.replace(
    "{message}",
    latestMessageContent
  );

  const response = await model.invoke([["user", formattedPrompt]]);

  return {
    shouldSearch: response.shouldSearch,
  };
}
