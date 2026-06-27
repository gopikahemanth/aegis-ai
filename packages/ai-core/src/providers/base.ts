export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AIProvider {
  readonly name: string;

  chat(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): Promise<string>;
}
