import { PublicChatDto } from '@/dtos/chat.dto.js';
import { ICitation } from '@/models/Message.js';
import ChatSessionRepository from '@/repositories/chatSession.repository.js';
import chunkRepository from '@/repositories/chunk.repository.js';
import messageRepository from '@/repositories/message.repository.js';
import organizationRepository from '@/repositories/organization.repository.js';
import workspaceRepository from '@/repositories/workspace.repository.js'
import aiService from '@/services/ai.service.js';
import AppError from '@/utils/AppError.js';
import { normalizeDomain } from '@/utils/helper.js';
import { ChatMessageDto } from '@/validators/chat.validator.js';
import mongoose from 'mongoose';

const RECENT_MESSAGE_LIMIT = 8; // how many past turns to inline verbatim
const SUMMARY_REFRESH_INTERVAL = 10; // refresh conversationSummary every N messages

class ChatService {

  private async generateAndSaveTitle(chatSessionId: mongoose.Types.ObjectId, firstMessage: string) {
    const prompt = `
      Generate a short, descriptive title (maximum 4 to 5 words) for a chat conversation that starts with the following message.
      Return ONLY the title text. Do not include quotes, preambles, or punctuation at the end.
      
      Message: "${firstMessage}"
    `;

    const aiResponse = await aiService.generateText(prompt);
    let cleanTitle = aiResponse.text.trim();
    cleanTitle = cleanTitle.replace(/^["']|["']$/g, '');

    await ChatSessionRepository.findByIdAndUpdate(chatSessionId.toString(), { title: cleanTitle });
  }

  private buildSystemPrompt(conversationSummary: string, recentTurns: string, contextText: string): string {
    return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
IDENTITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are Omnix.
Omnix is the official AI assistant for this organization.
When asked about your identity, always introduce yourself as Omnix.

Never introduce yourself as Gemini, Bard, Google AI, ChatGPT, Claude, OpenAI, or any other public AI assistant.
Never begin responses with "As an AI..." or "I'm a language model...".
Maintain this identity consistently for the entire conversation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HOW TO ANSWER (KNOWLEDGE PRIORITY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are a knowledge-grounded assistant. Always prioritize the "ORGANIZATION KNOWLEDGE" provided below to answer the user's queries.

1. If the "ORGANIZATION KNOWLEDGE" contains the answer, use it confidently.
2. If the user's question is general (e.g., greetings, coding help, general knowledge) or the organization knowledge is empty/insufficient, you may use your own general knowledge to answer and be helpful.
3. NEVER fabricate or guess organization-specific details (like fees, links, policies, or staff) if they are not explicitly provided in the knowledge base.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION STYLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Your responses should sound natural, conversational, and intelligent.
Do NOT sound robotic. Do NOT sound like a search engine. 

Never say things like:
- "According to the document..."
- "Based on the uploaded files..."
- "The provided context says..."
- "The knowledge base mentions..."

Instead, simply integrate the facts naturally. Match the complexity of the question (simple questions get short answers). Use markdown formatting (bolding, lists) only when genuinely helpful.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONVERSATION SUMMARY (earlier context, condensed)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${conversationSummary || "No prior summary yet — this is early in the conversation."}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RECENT CONVERSATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${recentTurns || "No recent turns."}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ORGANIZATION KNOWLEDGE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${contextText || "No organization-specific information was retrieved for this message."}
    `;
  }

  private async maybeRefreshSummary(
    sessionId: mongoose.Types.ObjectId,
    existingSummary: string,
    recentTurns: string,
    messageCountSoFar: number
  ) {
    if (messageCountSoFar % SUMMARY_REFRESH_INTERVAL !== 0) return;

    const prompt = `
Condense the conversation so far into a compact running summary (max ~150 words) that preserves names, decisions, and open questions a reader would need to follow up correctly.

Previous summary: ${existingSummary || "(none)"}

Recent turns to fold in:
${recentTurns}

Return ONLY the updated summary text.
    `;

    try {
      const res = await aiService.generateText(prompt);
      await ChatSessionRepository.findByIdAndUpdate(sessionId.toString(), {
        conversationSummary: res.text.trim(),
      });
    } catch (err) {
      console.error(`Failed to refresh conversationSummary for session ${sessionId}: ${(err as Error).message}`);
    }
  }

  async processUserMessage(
    organizationId: string,
    dto: ChatMessageDto
  ) {
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) {
      throw new AppError('Organization context not found.', 404);
    }

    if (organization.cachedUsage.messagesThisMonth >= organization.cachedLimits.messagesPerMonth) {
      throw new AppError(`Monthly limit exceeded. Your plan is limited to ${organization.cachedLimits.messagesPerMonth} messages per month. Please upgrade your plan.`,
        429)
    }
    const workspace = await workspaceRepository.findById(dto.workspaceId);

    if (!workspace) {
      throw new AppError('Workspace not found.', 404);
    }

    if (workspace.organization.toString() != organizationId) {
      throw new AppError('Tenant boundary violation: Workspace does not belong to your organization.', 403);
    }

    // ── 1: load session context (summary + recent messages) ──
    let activeSessionId: mongoose.Types.ObjectId;
    let conversationSummary = '';
    let recentTurns = '';
    let priorMessageCount = 0;

    if (dto.sessionId) {
      const existingSession = await ChatSessionRepository.findById(dto.sessionId);
      if (!existingSession) throw new AppError('Provided chat session no longer exits.', 404);

      activeSessionId = new mongoose.Types.ObjectId(existingSession._id);
      conversationSummary = existingSession.conversationSummary || '';

      const recentMessages = await messageRepository.findRecentBySession(activeSessionId, RECENT_MESSAGE_LIMIT);
      priorMessageCount = recentMessages.length;
      recentTurns = recentMessages
        .slice()
        .reverse() 
        .map(m => `${m.role === 'user' ? 'User' : 'Omnix'}: ${m.content}`)
        .join('\n');
    } else {
      const newSession = await ChatSessionRepository.create(
        organizationId,
        dto.workspaceId,
        {
          title: "New Conversation",
          page: {
           url: dto.page?.url || "",
    title: dto.page?.title || "",
          },
          visitorId: dto.visitorId,
          client: {
            userAgent: dto.client?.userAgent || "",
          },
        });

      activeSessionId = newSession._id!;
      this.generateAndSaveTitle(activeSessionId, dto.content).catch(err => {
        console.error(`Failed to generate AI title for session ${activeSessionId}: ${err.message}`)
      })
    }

    await messageRepository.create({
      session: activeSessionId,
      organization: new mongoose.Types.ObjectId(organizationId),
      role: 'user',
      content: dto.content,
      metadata: {
        pageUrl: '', screenshotAnalysis: '', sourceChunks: [], citations: [],
        tokensUsed: 0, responseTime: 0, modelUsed: '', retrievalScore: 0
      }
    });

    const startTime = Date.now();

    // ── 2: ALWAYS embed + retrieve (RAG approach) ──
    let contextText = '';
    let sourceChunkIds: mongoose.Types.ObjectId[] = [];
    let citations: ICitation[] = [];
    let similarChunksCount = 0;

    const queryVector = await aiService.generateEmbedding(dto.content, 'RETRIEVAL_QUERY');
    const similarChunks = await chunkRepository.findSimilarChunks(dto.workspaceId, queryVector, 5);

    const uniqueSourcesMap = new Map();

    if (similarChunks.length) {
      contextText = similarChunks
        .map((chunk: any, index) => {
          const doc = chunk.knowledgeDocument;

          const sourceIdentifier = doc.sourceType === 'webpage'
            ? `Website: ${doc.title} (${doc.sourceUrl})`
            : `Document: ${doc.title}`;

          if (doc._id && !uniqueSourcesMap.has(doc._id.toString())) {
            uniqueSourcesMap.set(doc._id.toString(), {
              document: doc._id,
              sourceType: doc.sourceType,
              title: doc.title,
              url: doc.sourceUrl || null
            } as ICitation);
          }
          return `[Source ${index + 1} - ${sourceIdentifier}]:\n${chunk.content}`;
        })
        .join("\n\n");

      citations = Array.from(uniqueSourcesMap.values());
      sourceChunkIds = similarChunks.map(chunk => new mongoose.Types.ObjectId(chunk._id));
      similarChunksCount = similarChunks.length;
    }

    // ── 3: build the final prompt (identity + summary + recent turns + org knowledge + question) ──
    const systemPrompt = this.buildSystemPrompt(conversationSummary, recentTurns, contextText);
    const fullPrompt = `${systemPrompt}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER QUESTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${dto.content}
`;

    // ── 4: generate the response ──
    const aiResponse = await aiService.generateText(fullPrompt);
    const answer = aiResponse.text;
    const tokenUsed = aiResponse.tokenCount;

    const responseTimeMs = Date.now() - startTime;

    // ── 5: save the response ──
    const session = await mongoose.startSession();
    let savedMessageId: mongoose.Types.ObjectId | null = null;

    try {
      await session.withTransaction(async () => {

        const aiMessage = await messageRepository.create({
          session: activeSessionId,
          organization: new mongoose.Types.ObjectId(organizationId),
          role: 'assistant',
          content: answer,
          metadata: {
            pageUrl: dto.page?.url || '',
            screenshotAnalysis: '',
            sourceChunks: sourceChunkIds,
            citations,
            tokensUsed: tokenUsed,
            responseTime: responseTimeMs,
            modelUsed: 'gemini-flash-latest',
            retrievalScore: similarChunksCount > 0 ? 0.9 : 0
          }
        }, session);

        savedMessageId = aiMessage._id;

        await ChatSessionRepository.recordSessionActivity(activeSessionId.toString(), session);
        await organizationRepository.recordMessageUsage(organizationId, session);
        await workspaceRepository.recordMessageUsage(dto.workspaceId, session);

        if (organization.onboardingStatus && !organization.onboardingStatus.firstSuccessfulMessage) {
          await organizationRepository.updateOnboardingStep(
            organizationId,
            'firstSuccessfulMessage',
            session
          );
        }

      });

      // ── 6: periodically refresh conversationSummary (fire-and-forget) ──
      this.maybeRefreshSummary(activeSessionId, conversationSummary, recentTurns, priorMessageCount + 2)
        .catch(err => console.error(`Summary refresh error for session ${activeSessionId}:`, err));

      return {
        messageId: savedMessageId,
        sessionId: activeSessionId,
        answer: answer,
        sourcesUsed: sourceChunkIds.length,
        citations,
        // 'intent' has been removed from the return payload entirely.
      };

    } catch (error) {
      console.error('Failed to save AI message and update usage:', error);
      throw new AppError('Message generated but failed to save to database.', 500);
    } finally {
      await session.endSession();
    }
  }

  async initializeWidget(workspaceId: string, domain: string ,visitorId: string) {
    const workspace = await workspaceRepository.findById(workspaceId);

    if (!workspace || workspace.isDeleted) {
      throw new AppError("Widget configuration not found.", 404);
    }

    if (!workspace.isActive) {
      throw new AppError("This widget has been deactivated.", 403);
    }

    const incomingDomain = normalizeDomain(domain);

    const isAllowed = workspace.allowedDomains.some(
      allowed => normalizeDomain(allowed) === incomingDomain
    );

    if (!isAllowed) {
      throw new AppError(
        `Domain unauthorized: ${domain} is not whitelisted.`,
        403
      );
    }

    const recentSessions = visitorId
    ? await ChatSessionRepository.findRecentByVisitor(workspaceId, visitorId, 10)
    : [];

  const history = recentSessions.map(s => ({
    id: s._id!.toString(),
    title: s.title,
    lastMessageAt: s.lastActivityAt,
  }));

   return {
    settings: workspace.settings,
    workspaceId: workspace._id,
    history,
  };
  }

  async processPublicChat(dto: PublicChatDto) {
    const { workspaceId, domain, content, sessionId, userAgent, visitorId } = dto;

    const workspace = await workspaceRepository.findById(workspaceId);
    if (!workspace || !workspace.isActive) {
      throw new AppError("Workspace unavailable.", 404);
    }

    const incomingDomain = normalizeDomain(domain);

    const isAllowed = workspace.allowedDomains.some(
      allowed => normalizeDomain(allowed) === incomingDomain
    );

    if (!isAllowed) {
      throw new AppError("Unauthorized domain.", 403);
    }

    const organization = await organizationRepository.findById(
      workspace.organization.toString()
    );

    if (!organization || organization.isDeleted) {
      throw new AppError("Organization account is inactive.", 403);
    }

    if (
      organization.cachedUsage.messagesThisMonth >=
      organization.cachedLimits.messagesPerMonth
    ) {
      throw new AppError(
        "This AI Copilot has reached its monthly capacity.",
        429
      );
    }

    return await this.processUserMessage(
      organization._id!.toString(),
      {
        workspaceId,
        content,
        sessionId,
        visitorId,
        page: {
          url: domain,
          title: "Public Website Visitor"
        },
        client: {
          userAgent: userAgent ?? "Unknown Visitor"
        }
      }
    );
  }
}

export default new ChatService();