import { z } from "zod";

export interface ToolDefinition<T extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  description: string;
  schema: z.ZodObject<T>;
  handler: (params: z.infer<z.ZodObject<T>>) => Promise<ToolResponse>;
}

export interface ToolResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  [key: string]: unknown;
}
