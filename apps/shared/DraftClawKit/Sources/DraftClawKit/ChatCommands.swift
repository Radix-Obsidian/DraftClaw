import Foundation

public enum DraftClawChatCommand: String, Codable, Sendable {
    case push = "chat.push"
}

public struct DraftClawChatPushParams: Codable, Sendable, Equatable {
    public var text: String
    public var speak: Bool?

    public init(text: String, speak: Bool? = nil) {
        self.text = text
        self.speak = speak
    }
}

public struct DraftClawChatPushPayload: Codable, Sendable, Equatable {
    public var messageId: String?

    public init(messageId: String? = nil) {
        self.messageId = messageId
    }
}
