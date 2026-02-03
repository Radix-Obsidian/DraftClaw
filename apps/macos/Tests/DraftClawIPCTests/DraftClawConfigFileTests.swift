import Foundation
import Testing
@testable import DraftClaw

@Suite(.serialized)
struct DraftClawConfigFileTests {
    @Test
    func configPathRespectsEnvOverride() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("draftclaw-config-\(UUID().uuidString)")
            .appendingPathComponent("draftclaw.json")
            .path

        await TestIsolation.withEnvValues(["DRAFTCLAW_CONFIG_PATH": override]) {
            #expect(DraftClawConfigFile.url().path == override)
        }
    }

    @MainActor
    @Test
    func remoteGatewayPortParsesAndMatchesHost() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("draftclaw-config-\(UUID().uuidString)")
            .appendingPathComponent("draftclaw.json")
            .path

        await TestIsolation.withEnvValues(["DRAFTCLAW_CONFIG_PATH": override]) {
            DraftClawConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "ws://gateway.ts.net:19999",
                    ],
                ],
            ])
            #expect(DraftClawConfigFile.remoteGatewayPort() == 19999)
            #expect(DraftClawConfigFile.remoteGatewayPort(matchingHost: "gateway.ts.net") == 19999)
            #expect(DraftClawConfigFile.remoteGatewayPort(matchingHost: "gateway") == 19999)
            #expect(DraftClawConfigFile.remoteGatewayPort(matchingHost: "other.ts.net") == nil)
        }
    }

    @MainActor
    @Test
    func setRemoteGatewayUrlPreservesScheme() async {
        let override = FileManager().temporaryDirectory
            .appendingPathComponent("draftclaw-config-\(UUID().uuidString)")
            .appendingPathComponent("draftclaw.json")
            .path

        await TestIsolation.withEnvValues(["DRAFTCLAW_CONFIG_PATH": override]) {
            DraftClawConfigFile.saveDict([
                "gateway": [
                    "remote": [
                        "url": "wss://old-host:111",
                    ],
                ],
            ])
            DraftClawConfigFile.setRemoteGatewayUrl(host: "new-host", port: 2222)
            let root = DraftClawConfigFile.loadDict()
            let url = ((root["gateway"] as? [String: Any])?["remote"] as? [String: Any])?["url"] as? String
            #expect(url == "wss://new-host:2222")
        }
    }

    @Test
    func stateDirOverrideSetsConfigPath() async {
        let dir = FileManager().temporaryDirectory
            .appendingPathComponent("draftclaw-state-\(UUID().uuidString)", isDirectory: true)
            .path

        await TestIsolation.withEnvValues([
            "DRAFTCLAW_CONFIG_PATH": nil,
            "DRAFTCLAW_STATE_DIR": dir,
        ]) {
            #expect(DraftClawConfigFile.stateDirURL().path == dir)
            #expect(DraftClawConfigFile.url().path == "\(dir)/draftclaw.json")
        }
    }
}
