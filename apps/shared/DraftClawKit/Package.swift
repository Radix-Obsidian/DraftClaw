// swift-tools-version: 6.2

import PackageDescription

let package = Package(
    name: "DraftClawKit",
    platforms: [
        .iOS(.v18),
        .macOS(.v15),
    ],
    products: [
        .library(name: "DraftClawProtocol", targets: ["DraftClawProtocol"]),
        .library(name: "DraftClawKit", targets: ["DraftClawKit"]),
        .library(name: "DraftClawChatUI", targets: ["DraftClawChatUI"]),
    ],
    dependencies: [
        .package(url: "https://github.com/steipete/ElevenLabsKit", exact: "0.1.0"),
        .package(url: "https://github.com/gonzalezreal/textual", exact: "0.3.1"),
    ],
    targets: [
        .target(
            name: "DraftClawProtocol",
            path: "Sources/DraftClawProtocol",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "DraftClawKit",
            dependencies: [
                "DraftClawProtocol",
                .product(name: "ElevenLabsKit", package: "ElevenLabsKit"),
            ],
            path: "Sources/DraftClawKit",
            resources: [
                .process("Resources"),
            ],
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .target(
            name: "DraftClawChatUI",
            dependencies: [
                "DraftClawKit",
                .product(
                    name: "Textual",
                    package: "textual",
                    condition: .when(platforms: [.macOS, .iOS])),
            ],
            path: "Sources/DraftClawChatUI",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
            ]),
        .testTarget(
            name: "DraftClawKitTests",
            dependencies: ["DraftClawKit", "DraftClawChatUI"],
            path: "Tests/DraftClawKitTests",
            swiftSettings: [
                .enableUpcomingFeature("StrictConcurrency"),
                .enableExperimentalFeature("SwiftTesting"),
            ]),
    ])
