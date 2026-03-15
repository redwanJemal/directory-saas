# Task 23: AI Module — Vercel AI SDK, Tools, Streaming

## Summary
Implement an AI planning engine using the Vercel AI SDK with tool calling, streaming responses, and conversation memory. This powers the "plan my event" feature where users describe what they want and the AI creates a plan with provider recommendations.

## Current State
- Search infrastructure available (Task 22).
- Background jobs available (Task 16).
- Caching available (Task 14).

## Required Changes

### 23.1 AI Module

**File**: `backend/src/modules/ai/`

```
ai/
├── ai.module.ts
├── ai.controller.ts       # SSE streaming endpoint
├── ai.service.ts           # LLM orchestration
├── tools/                  # AI function tools
│   ├── search-providers.tool.ts
│   ├── check-availability.tool.ts
│   ├── estimate-budget.tool.ts
│   └── create-plan.tool.ts
├── prompts/
│   └── planner.prompt.ts   # System prompts
└── ai.spec.ts
```

### 23.2 AI Service

```typescript
@Injectable()
export class AiService {
  async chat(tenantId: string, userId: string, messages: Message[]): AsyncGenerator<StreamPart>;
  async generatePlan(tenantId: string, request: PlanRequest): Promise<Plan>;
}
```

Uses `@ai-sdk/anthropic` or `@ai-sdk/openai` (configurable):
```typescript
const result = streamText({
  model: anthropic('claude-sonnet-4-20250514'),
  system: PLANNER_SYSTEM_PROMPT,
  messages,
  tools: {
    searchProviders: this.searchProvidersTool,
    estimateBudget: this.estimateBudgetTool,
    checkAvailability: this.checkAvailabilityTool,
    createPlan: this.createPlanTool,
  },
});
```

### 23.3 AI Tools

**searchProviders**: Search the provider database
```typescript
{
  description: "Search for service providers by category, location, budget, and rating",
  parameters: z.object({
    categories: z.array(z.string()),
    location: z.string().optional(),
    maxBudget: z.number().optional(),
    minRating: z.number().optional(),
  }),
  execute: async (params) => {
    // Uses SearchService to find providers
    // Returns top matches with pricing
  }
}
```

**estimateBudget**: Break down budget across categories
```typescript
{
  description: "Suggest budget allocation across service categories based on total budget and guest count",
  parameters: z.object({
    totalBudget: z.number(),
    guestCount: z.number(),
    categories: z.array(z.string()),
    priorities: z.array(z.string()).optional(),  // "amazing photography"
  }),
}
```

**checkAvailability**: Check provider availability (stub — real implementation per project)

**createPlan**: Generate structured plan output
```typescript
{
  description: "Create a structured event plan with timeline, provider recommendations, and budget breakdown",
  parameters: z.object({
    eventType: z.string(),
    date: z.string().optional(),
    guestCount: z.number(),
    totalBudget: z.number(),
    selectedProviders: z.array(z.object({
      providerId: z.string(),
      category: z.string(),
      allocatedBudget: z.number(),
    })),
  }),
}
```

### 23.4 Streaming Endpoint

**File**: `backend/src/modules/ai/ai.controller.ts`

```typescript
@Post('chat')
@FeatureGate('ai-planner')
async chat(
  @CurrentTenant() tenantId: string,
  @CurrentUser() user: JwtPayload,
  @Body() body: { messages: Message[] },
  @Res() res: Response,
) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const stream = await this.aiService.chat(tenantId, user.sub, body.messages);
  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
  }
  res.end();
}
```

### 23.5 Conversation Memory

Store conversation history per user session:
```prisma
model AiConversation {
  id        String   @id @default(uuid()) @db.Uuid
  tenantId  String?  @map("tenant_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  userType  String   @map("user_type")
  title     String?
  messages  Json     @default("[]")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz
  @@index([userId, userType])
  @@map("ai_conversations")
}
```

### 23.6 AI Configuration

```env
AI_PROVIDER=anthropic          # or 'openai'
AI_MODEL=claude-sonnet-4-20250514  # configurable
AI_API_KEY=sk-...
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.7
```

### 23.7 Rate Limiting for AI

Stricter rate limits:
- 10 requests per minute per user
- 100 requests per hour per tenant
- Feature-gated to Professional+ plans

### 23.8 Tests

- Test: Chat endpoint streams SSE responses
- Test: Tool calls execute and return results
- Test: searchProviders tool queries search service
- Test: estimateBudget returns allocation breakdown
- Test: Conversation history persisted
- Test: Rate limiting enforced on AI endpoints
- Test: Feature gate blocks Starter plan users
- Test: AI configuration loaded from env

## Acceptance Criteria

1. Vercel AI SDK with configurable provider (Anthropic/OpenAI)
2. SSE streaming chat endpoint
3. 4 AI tools (search, budget, availability, plan)
4. Conversation memory stored in DB
5. Feature-gated to Professional+ plans
6. Stricter rate limits for AI endpoints
7. All tests pass
