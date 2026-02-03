// swift-tools-version: 6.2
// Package manifest for the DraftClaw macOS companion (menu bar app + IPC library).

import PackageDescription

let package = Package(
    name: "DraftClaw",
    platforms: [
        .macOS(.v15),
    ],
    products: [
        .library(name: "DraftClawIPC", targets: ["DraftClawIPC"]),
        .library(name: "DraftClawDiscovery", targets: ["DraftClawDiscovery"]),
        .executable(name: "DraftClaw", targets: ["DraftClaw"]),
        .executable(name: "draftclaw-mac", targets: ["DraftClawMacCLI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/orchetect/MenuBarExtraAccess", exact: "1.2.2"),
        .package(url: "https://github.com/swiftlang/swift-subprocess.git", from: "0.1.0"),
        .package(url: "https://github.com/apple/swift-log.git", from: "1.8.0"),
        .package(url: "https://github.com/sparkle-project/Sparkle", from: "2.8.1"),
        .package(url: "https://github.com/steipete/Peekaboo.git", branch: "main"),
        .package(path: "../shared/DraftClawKit"),
        .package(path: "../../Swabble"),
    ],
    targets: [
        .target(
            name: "DraftClawIPC",
            dependencies: [],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "DraftClawDiscovery",
            dependencies: [
                .product(name: "DraftClawKit", package: "DraftClawKit"),
            ],
            path: "Sources/DraftClawDiscovery",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "DraftClaw",
            dependencies: [
                "DraftClawIPC",
                "DraftClawDiscovery",
                .product(name: "DraftClawKit", package: "DraftClawKit"),
                .product(name: "DraftClawChatUI", package: "DraftClawKit"),
                .product(name: "DraftClawProtocol", package: "DraftClawKit"),
                .product(name: "SwabbleKit", package: "swabble"),
                .product(name: "MenuBarExtraAccess", package: "MenuBarExtraAccess"),
                .product(name: "Subprocess", package: "swift-subprocess"),
                .product(name: "Logging", package: "swift-log"),
                .product(name: "Sparkle", package: "Sparkle"),
                .product(name: "PeekabooBridge", package: "Peekaboo"),
                .product(name: "PeekabooAutomationKit", package: "Peekaboo"),
            ],
            exclude: [
                "Resources/Info.plist",
            ],
            resources: [
                .copy("Resources/DraftClaw.icns"),
                .copy("Resources/DeviceModels"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .executableTarget(
            name: "DraftClawMacCLI",
            dependencies: [
                "DraftClawDiscovery",
                .product(name: "DraftClawKit", package: "DraftClawKit"),
                .product(name: "DraftClawProtocol", package: "DraftClawKit"),
            ],
            path: "Sources/DraftClawMacCLI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "DraftClawIPCTests",
            dependencies: [
                "DraftClawIPC",
                "DraftClaw",
                "DraftClawDiscovery",
                .product(name: "DraftClawProtocol", package: "DraftClawKit"),
                .product(name: "SwabbleKit", package: "swabble"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
