import {
  type LangGraphRunnableConfig,
  START,
  StateGraph,
} from "@langchain/langgraph";
import { Client } from "@langchain/langgraph-sdk";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import {
  getArtifactContent,
  isArtifactMarkdownContent,
} from "@opencanvas/shared/utils/artifacts";
import { TITLE_SYSTEM_PROMPT, TITLE_USER_PROMPT } from "./prompts.js";
import {
  TitleGenerationAnnotation,
  TitleGenerationReturnType,
} from "./state.js";

export const generateTitle = async (
  state: typeof TitleGenerationAnnotation.State,
  config: LangGraphRunnableConfig
): Promise<TitleGenerationReturnType> => {
  const threadId = config.configurable?.open_canvas_thread_id;

  if (!threadId) {
    throw new Error("open_canvas_thread_id not found in configurable");
  }

  const generateTitleTool = {
    name: "generate_title",
    description: "Generate a concise title for the conversation.",
    schema: z.object({
      title: z.string().describe("The generated title for the conversation."),
    }),
  };

  // 检查是否启用 New API
  const useNewApi = process.env.USE_NEW_API === "true";
  
  let model;
  if (useNewApi) {
    // 使用 New API 的标题生成模型
    const { initChatModel } = await import("langchain/chat_models/universal");
    const baseModel = await initChatModel(process.env.NEW_API_TITLE_MODEL || "gpt-4o-mini", {
      modelProvider: "openai",
      apiKey: process.env.NEW_API_KEY,
      baseUrl: process.env.NEW_API_BASE_URL,
      temperature: 0,
    });
    model = baseModel.bindTools([generateTitleTool], {
      tool_choice: "generate_title",
    });
  } else {
    // 使用传统的 OpenAI 直连
    model = new ChatOpenAI({
      model: "gpt-4o-mini",
      temperature: 0,
    }).bindTools([generateTitleTool], {
      tool_choice: "generate_title",
    });
  }

  const currentArtifactContent = state.artifact
    ? getArtifactContent(state.artifact)
    : undefined;

  const artifactContent = currentArtifactContent
    ? isArtifactMarkdownContent(currentArtifactContent)
      ? currentArtifactContent.fullMarkdown
      : currentArtifactContent.code
    : undefined;

  const artifactContext = artifactContent
    ? `An artifact was generated during this conversation:\n\n${artifactContent}`
    : "No artifact was generated during this conversation.";

  const formattedUserPrompt = TITLE_USER_PROMPT.replace(
    "{conversation}",
    state.messages
      .map((msg) => `<${msg.getType()}>\n${msg.content}\n</${msg.getType()}>`)
      .join("\n\n")
  ).replace("{artifact_context}", artifactContext);

  const result = await model.invoke([
    {
      role: "system",
      content: TITLE_SYSTEM_PROMPT,
    },
    {
      role: "user",
      content: formattedUserPrompt,
    },
  ]);

  const titleToolCall = result.tool_calls?.[0];
  if (!titleToolCall) {
    console.error("FAILED TO GENERATE TOOL CALL", result);
    throw new Error("Title generation tool call failed.");
  }

  const langGraphClient = new Client({
    apiUrl: `http://localhost:${process.env.PORT}`,
  });

  // Update thread metadata with the generated title
  await langGraphClient.threads.update(threadId, {
    metadata: {
      thread_title: titleToolCall.args.title,
    },
  });

  return {};
};

const builder = new StateGraph(TitleGenerationAnnotation)
  .addNode("title", generateTitle)
  .addEdge(START, "title");

export const graph = builder.compile().withConfig({ runName: "thread_title" });
