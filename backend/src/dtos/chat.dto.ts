export interface PublicChatDto {
    workspaceId: string;
    domain: string;
    content: string;
    sessionId?: string;
    userAgent?: string;
    visitorId?: string;
}