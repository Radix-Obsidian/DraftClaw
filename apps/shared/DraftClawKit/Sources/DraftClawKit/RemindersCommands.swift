import Foundation

public enum DraftClawRemindersCommand: String, Codable, Sendable {
    case list = "reminders.list"
    case add = "reminders.add"
}

public enum DraftClawReminderStatusFilter: String, Codable, Sendable {
    case incomplete
    case completed
    case all
}

public struct DraftClawRemindersListParams: Codable, Sendable, Equatable {
    public var status: DraftClawReminderStatusFilter?
    public var limit: Int?

    public init(status: DraftClawReminderStatusFilter? = nil, limit: Int? = nil) {
        self.status = status
        self.limit = limit
    }
}

public struct DraftClawRemindersAddParams: Codable, Sendable, Equatable {
    public var title: String
    public var dueISO: String?
    public var notes: String?
    public var listId: String?
    public var listName: String?

    public init(
        title: String,
        dueISO: String? = nil,
        notes: String? = nil,
        listId: String? = nil,
        listName: String? = nil)
    {
        self.title = title
        self.dueISO = dueISO
        self.notes = notes
        self.listId = listId
        self.listName = listName
    }
}

public struct DraftClawReminderPayload: Codable, Sendable, Equatable {
    public var identifier: String
    public var title: String
    public var dueISO: String?
    public var completed: Bool
    public var listName: String?

    public init(
        identifier: String,
        title: String,
        dueISO: String? = nil,
        completed: Bool,
        listName: String? = nil)
    {
        self.identifier = identifier
        self.title = title
        self.dueISO = dueISO
        self.completed = completed
        self.listName = listName
    }
}

public struct DraftClawRemindersListPayload: Codable, Sendable, Equatable {
    public var reminders: [DraftClawReminderPayload]

    public init(reminders: [DraftClawReminderPayload]) {
        self.reminders = reminders
    }
}

public struct DraftClawRemindersAddPayload: Codable, Sendable, Equatable {
    public var reminder: DraftClawReminderPayload

    public init(reminder: DraftClawReminderPayload) {
        self.reminder = reminder
    }
}
