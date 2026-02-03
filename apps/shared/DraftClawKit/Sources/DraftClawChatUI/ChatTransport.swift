import Foundation

public enum DraftClawChatTransportEvent: Sendable {
    case health(ok: Bool)
    case tick
    case chat(DraftClawChatEventPayload)
    case agent(DraftClawAgentEventPayload)
    case seqGap
}

public protocol DraftClawChatTransport: Sendable {
    func requestHistory(sessionKey: String) async throws -> DraftClawChatHistoryPayload
    func sendMessage(
        sessionKey: String,
        message: String,
        thinking: String,
        idempotencyKey: String,
        attachments: [DraftClawChatAttachmentPayload]) async throws -> DraftClawChatSendResponse

    func abortRun(sessionKey: String, runId: String) async throws
    func listSessions(limit: Int?) async throws -> DraftClawChatSessionsListResponse

    func requestHealth(timeoutMs: Int) async throws -> Bool
    func events() -> AsyncStream<DraftClawChatTransportEvent>

    func setActiveSessionKey(_ sessionKey: String) async throws
}

extension DraftClawChatTransport {
    public func setActiveSessionKey(_: String) async throws {}

    public func abortRun(sessionKey _: String, runId _: String) async throws {
        throw NSError(
            domain: "DraftClawChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "chat.abort not supported by this transport"])
    }

    public func listSessions(limit _: Int?) async throws -> DraftClawChatSessionsListResponse {
        throw NSError(
            domain: "DraftClawChatTransport",
            code: 0,
            userInfo: [NSLocalizedDescriptionKey: "sessions.list not supported by this transport"])
    }
}
