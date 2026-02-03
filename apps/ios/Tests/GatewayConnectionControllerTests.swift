import DraftClawKit
import Foundation
import Testing
import UIKit
@testable import DraftClaw

private func withUserDefaults<T>(_ updates: [String: Any?], _ body: () throws -> T) rethrows -> T {
    let defaults = UserDefaults.standard
    var snapshot: [String: Any?] = [:]
    for key in updates.keys {
        snapshot[key] = defaults.object(forKey: key)
    }
    for (key, value) in updates {
        if let value {
            defaults.set(value, forKey: key)
        } else {
            defaults.removeObject(forKey: key)
        }
    }
    defer {
        for (key, value) in snapshot {
            if let value {
                defaults.set(value, forKey: key)
            } else {
                defaults.removeObject(forKey: key)
            }
        }
    }
    return try body()
}

@Suite(.serialized) struct GatewayConnectionControllerTests {
    @Test @MainActor func resolvedDisplayNameSetsDefaultWhenMissing() {
        let defaults = UserDefaults.standard
        let displayKey = "node.displayName"

        withUserDefaults([displayKey: nil, "node.instanceId": "ios-test"]) {
            let appModel = NodeAppModel()
            let controller = GatewayConnectionController(appModel: appModel, startDiscovery: false)

            let resolved = controller._test_resolvedDisplayName(defaults: defaults)
            #expect(!resolved.isEmpty)
            #expect(resolved != "iOS Node")
            #expect(defaults.string(forKey: displayKey) == resolved)
        }
    }

    @Test @MainActor func currentCapsReflectToggles() {
        withUserDefaults([
            "node.instanceId": "ios-test",
            "node.displayName": "Test Node",
            "camera.enabled": true,
            "location.enabledMode": DraftClawLocationMode.always.rawValue,
            VoiceWakePreferences.enabledKey: true,
        ]) {
            let appModel = NodeAppModel()
            let controller = GatewayConnectionController(appModel: appModel, startDiscovery: false)
            let caps = Set(controller._test_currentCaps())

            #expect(caps.contains(DraftClawCapability.canvas.rawValue))
            #expect(caps.contains(DraftClawCapability.screen.rawValue))
            #expect(caps.contains(DraftClawCapability.camera.rawValue))
            #expect(caps.contains(DraftClawCapability.location.rawValue))
            #expect(caps.contains(DraftClawCapability.voiceWake.rawValue))
            #expect(caps.contains(DraftClawCapability.device.rawValue))
            #expect(caps.contains(DraftClawCapability.photos.rawValue))
            #expect(caps.contains(DraftClawCapability.contacts.rawValue))
            #expect(caps.contains(DraftClawCapability.calendar.rawValue))
            #expect(caps.contains(DraftClawCapability.reminders.rawValue))
        }
    }

    @Test @MainActor func currentCommandsIncludeLocationWhenEnabled() {
        withUserDefaults([
            "node.instanceId": "ios-test",
            "location.enabledMode": DraftClawLocationMode.whileUsing.rawValue,
        ]) {
            let appModel = NodeAppModel()
            let controller = GatewayConnectionController(appModel: appModel, startDiscovery: false)
            let commands = Set(controller._test_currentCommands())

            #expect(commands.contains(DraftClawLocationCommand.get.rawValue))
        }
    }

    @Test @MainActor func currentCommandsExcludeShellAndIncludeNotifyAndDevice() {
        withUserDefaults([
            "node.instanceId": "ios-test",
        ]) {
            let appModel = NodeAppModel()
            let controller = GatewayConnectionController(appModel: appModel, startDiscovery: false)
            let commands = Set(controller._test_currentCommands())

            #expect(commands.contains(DraftClawSystemCommand.notify.rawValue))
            #expect(commands.contains(DraftClawChatCommand.push.rawValue))
            #expect(!commands.contains(DraftClawSystemCommand.run.rawValue))
            #expect(!commands.contains(DraftClawSystemCommand.which.rawValue))
            #expect(!commands.contains(DraftClawSystemCommand.execApprovalsGet.rawValue))
            #expect(!commands.contains(DraftClawSystemCommand.execApprovalsSet.rawValue))

            #expect(commands.contains(DraftClawDeviceCommand.status.rawValue))
            #expect(commands.contains(DraftClawDeviceCommand.info.rawValue))
            #expect(commands.contains(DraftClawContactsCommand.add.rawValue))
            #expect(commands.contains(DraftClawCalendarCommand.add.rawValue))
            #expect(commands.contains(DraftClawRemindersCommand.add.rawValue))
            #expect(commands.contains(DraftClawTalkCommand.pttStart.rawValue))
            #expect(commands.contains(DraftClawTalkCommand.pttStop.rawValue))
            #expect(commands.contains(DraftClawTalkCommand.pttCancel.rawValue))
            #expect(commands.contains(DraftClawTalkCommand.pttOnce.rawValue))
        }
    }

    @Test @MainActor func currentPermissionsIncludeExpectedKeys() {
        let appModel = NodeAppModel()
        let controller = GatewayConnectionController(appModel: appModel, startDiscovery: false)
        let permissions = controller._test_currentPermissions()
        let keys = Set(permissions.keys)

        #expect(keys.contains("camera"))
        #expect(keys.contains("microphone"))
        #expect(keys.contains("location"))
        #expect(keys.contains("screenRecording"))
        #expect(keys.contains("photos"))
        #expect(keys.contains("contacts"))
        #expect(keys.contains("calendar"))
        #expect(keys.contains("reminders"))
        #expect(keys.contains("motion"))
    }
}
