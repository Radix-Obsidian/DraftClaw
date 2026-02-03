import DraftClawKit
import DraftClawProtocol
import Foundation

// Prefer the DraftClawKit wrapper to keep gateway request payloads consistent.
typealias AnyCodable = DraftClawKit.AnyCodable
typealias InstanceIdentity = DraftClawKit.InstanceIdentity

extension AnyCodable {
    var stringValue: String? { self.value as? String }
    var boolValue: Bool? { self.value as? Bool }
    var intValue: Int? { self.value as? Int }
    var doubleValue: Double? { self.value as? Double }
    var dictionaryValue: [String: AnyCodable]? { self.value as? [String: AnyCodable] }
    var arrayValue: [AnyCodable]? { self.value as? [AnyCodable] }

    var foundationValue: Any {
        switch self.value {
        case let dict as [String: AnyCodable]:
            dict.mapValues { $0.foundationValue }
        case let array as [AnyCodable]:
            array.map(\.foundationValue)
        default:
            self.value
        }
    }
}

extension DraftClawProtocol.AnyCodable {
    var stringValue: String? { self.value as? String }
    var boolValue: Bool? { self.value as? Bool }
    var intValue: Int? { self.value as? Int }
    var doubleValue: Double? { self.value as? Double }
    var dictionaryValue: [String: DraftClawProtocol.AnyCodable]? { self.value as? [String: DraftClawProtocol.AnyCodable] }
    var arrayValue: [DraftClawProtocol.AnyCodable]? { self.value as? [DraftClawProtocol.AnyCodable] }

    var foundationValue: Any {
        switch self.value {
        case let dict as [String: DraftClawProtocol.AnyCodable]:
            dict.mapValues { $0.foundationValue }
        case let array as [DraftClawProtocol.AnyCodable]:
            array.map(\.foundationValue)
        default:
            self.value
        }
    }
}
