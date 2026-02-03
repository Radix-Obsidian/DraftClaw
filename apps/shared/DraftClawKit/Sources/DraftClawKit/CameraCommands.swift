import Foundation

public enum DraftClawCameraCommand: String, Codable, Sendable {
    case list = "camera.list"
    case snap = "camera.snap"
    case clip = "camera.clip"
}

public enum DraftClawCameraFacing: String, Codable, Sendable {
    case back
    case front
}

public enum DraftClawCameraImageFormat: String, Codable, Sendable {
    case jpg
    case jpeg
}

public enum DraftClawCameraVideoFormat: String, Codable, Sendable {
    case mp4
}

public struct DraftClawCameraSnapParams: Codable, Sendable, Equatable {
    public var facing: DraftClawCameraFacing?
    public var maxWidth: Int?
    public var quality: Double?
    public var format: DraftClawCameraImageFormat?
    public var deviceId: String?
    public var delayMs: Int?

    public init(
        facing: DraftClawCameraFacing? = nil,
        maxWidth: Int? = nil,
        quality: Double? = nil,
        format: DraftClawCameraImageFormat? = nil,
        deviceId: String? = nil,
        delayMs: Int? = nil)
    {
        self.facing = facing
        self.maxWidth = maxWidth
        self.quality = quality
        self.format = format
        self.deviceId = deviceId
        self.delayMs = delayMs
    }
}

public struct DraftClawCameraClipParams: Codable, Sendable, Equatable {
    public var facing: DraftClawCameraFacing?
    public var durationMs: Int?
    public var includeAudio: Bool?
    public var format: DraftClawCameraVideoFormat?
    public var deviceId: String?

    public init(
        facing: DraftClawCameraFacing? = nil,
        durationMs: Int? = nil,
        includeAudio: Bool? = nil,
        format: DraftClawCameraVideoFormat? = nil,
        deviceId: String? = nil)
    {
        self.facing = facing
        self.durationMs = durationMs
        self.includeAudio = includeAudio
        self.format = format
        self.deviceId = deviceId
    }
}
