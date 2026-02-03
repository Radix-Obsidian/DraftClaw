import CoreLocation
import Foundation
import DraftClawKit
import UIKit

protocol CameraServicing: Sendable {
    func listDevices() async -> [CameraController.CameraDeviceInfo]
    func snap(params: DraftClawCameraSnapParams) async throws -> (format: String, base64: String, width: Int, height: Int)
    func clip(params: DraftClawCameraClipParams) async throws -> (format: String, base64: String, durationMs: Int, hasAudio: Bool)
}

protocol ScreenRecordingServicing: Sendable {
    func record(
        screenIndex: Int?,
        durationMs: Int?,
        fps: Double?,
        includeAudio: Bool?,
        outPath: String?) async throws -> String
}

@MainActor
protocol LocationServicing: Sendable {
    func authorizationStatus() -> CLAuthorizationStatus
    func accuracyAuthorization() -> CLAccuracyAuthorization
    func ensureAuthorization(mode: DraftClawLocationMode) async -> CLAuthorizationStatus
    func currentLocation(
        params: DraftClawLocationGetParams,
        desiredAccuracy: DraftClawLocationAccuracy,
        maxAgeMs: Int?,
        timeoutMs: Int?) async throws -> CLLocation
}

protocol DeviceStatusServicing: Sendable {
    func status() async throws -> DraftClawDeviceStatusPayload
    func info() -> DraftClawDeviceInfoPayload
}

protocol PhotosServicing: Sendable {
    func latest(params: DraftClawPhotosLatestParams) async throws -> DraftClawPhotosLatestPayload
}

protocol ContactsServicing: Sendable {
    func search(params: DraftClawContactsSearchParams) async throws -> DraftClawContactsSearchPayload
    func add(params: DraftClawContactsAddParams) async throws -> DraftClawContactsAddPayload
}

protocol CalendarServicing: Sendable {
    func events(params: DraftClawCalendarEventsParams) async throws -> DraftClawCalendarEventsPayload
    func add(params: DraftClawCalendarAddParams) async throws -> DraftClawCalendarAddPayload
}

protocol RemindersServicing: Sendable {
    func list(params: DraftClawRemindersListParams) async throws -> DraftClawRemindersListPayload
    func add(params: DraftClawRemindersAddParams) async throws -> DraftClawRemindersAddPayload
}

protocol MotionServicing: Sendable {
    func activities(params: DraftClawMotionActivityParams) async throws -> DraftClawMotionActivityPayload
    func pedometer(params: DraftClawPedometerParams) async throws -> DraftClawPedometerPayload
}

extension CameraController: CameraServicing {}
extension ScreenRecordService: ScreenRecordingServicing {}
extension LocationService: LocationServicing {}
