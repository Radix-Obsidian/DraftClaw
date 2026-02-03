import Foundation

public enum DraftClawDeviceCommand: String, Codable, Sendable {
    case status = "device.status"
    case info = "device.info"
}

public enum DraftClawBatteryState: String, Codable, Sendable {
    case unknown
    case unplugged
    case charging
    case full
}

public enum DraftClawThermalState: String, Codable, Sendable {
    case nominal
    case fair
    case serious
    case critical
}

public enum DraftClawNetworkPathStatus: String, Codable, Sendable {
    case satisfied
    case unsatisfied
    case requiresConnection
}

public enum DraftClawNetworkInterfaceType: String, Codable, Sendable {
    case wifi
    case cellular
    case wired
    case other
}

public struct DraftClawBatteryStatusPayload: Codable, Sendable, Equatable {
    public var level: Double?
    public var state: DraftClawBatteryState
    public var lowPowerModeEnabled: Bool

    public init(level: Double?, state: DraftClawBatteryState, lowPowerModeEnabled: Bool) {
        self.level = level
        self.state = state
        self.lowPowerModeEnabled = lowPowerModeEnabled
    }
}

public struct DraftClawThermalStatusPayload: Codable, Sendable, Equatable {
    public var state: DraftClawThermalState

    public init(state: DraftClawThermalState) {
        self.state = state
    }
}

public struct DraftClawStorageStatusPayload: Codable, Sendable, Equatable {
    public var totalBytes: Int64
    public var freeBytes: Int64
    public var usedBytes: Int64

    public init(totalBytes: Int64, freeBytes: Int64, usedBytes: Int64) {
        self.totalBytes = totalBytes
        self.freeBytes = freeBytes
        self.usedBytes = usedBytes
    }
}

public struct DraftClawNetworkStatusPayload: Codable, Sendable, Equatable {
    public var status: DraftClawNetworkPathStatus
    public var isExpensive: Bool
    public var isConstrained: Bool
    public var interfaces: [DraftClawNetworkInterfaceType]

    public init(
        status: DraftClawNetworkPathStatus,
        isExpensive: Bool,
        isConstrained: Bool,
        interfaces: [DraftClawNetworkInterfaceType])
    {
        self.status = status
        self.isExpensive = isExpensive
        self.isConstrained = isConstrained
        self.interfaces = interfaces
    }
}

public struct DraftClawDeviceStatusPayload: Codable, Sendable, Equatable {
    public var battery: DraftClawBatteryStatusPayload
    public var thermal: DraftClawThermalStatusPayload
    public var storage: DraftClawStorageStatusPayload
    public var network: DraftClawNetworkStatusPayload
    public var uptimeSeconds: Double

    public init(
        battery: DraftClawBatteryStatusPayload,
        thermal: DraftClawThermalStatusPayload,
        storage: DraftClawStorageStatusPayload,
        network: DraftClawNetworkStatusPayload,
        uptimeSeconds: Double)
    {
        self.battery = battery
        self.thermal = thermal
        self.storage = storage
        self.network = network
        self.uptimeSeconds = uptimeSeconds
    }
}

public struct DraftClawDeviceInfoPayload: Codable, Sendable, Equatable {
    public var deviceName: String
    public var modelIdentifier: String
    public var systemName: String
    public var systemVersion: String
    public var appVersion: String
    public var appBuild: String
    public var locale: String

    public init(
        deviceName: String,
        modelIdentifier: String,
        systemName: String,
        systemVersion: String,
        appVersion: String,
        appBuild: String,
        locale: String)
    {
        self.deviceName = deviceName
        self.modelIdentifier = modelIdentifier
        self.systemName = systemName
        self.systemVersion = systemVersion
        self.appVersion = appVersion
        self.appBuild = appBuild
        self.locale = locale
    }
}
