import { z } from "zod";

export interface ToolDefinition {
  name: string;
  description: string;
  schema: z.ZodObject<any>;
  handler: (params: any) => Promise<ToolResponse>;
}

export interface ToolResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
}
