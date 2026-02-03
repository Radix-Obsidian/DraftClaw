package ai.draftclaw.android.protocol

import org.junit.Assert.assertEquals
import org.junit.Test

class DraftClawProtocolConstantsTest {
  @Test
  fun canvasCommandsUseStableStrings() {
    assertEquals("canvas.present", DraftClawCanvasCommand.Present.rawValue)
    assertEquals("canvas.hide", DraftClawCanvasCommand.Hide.rawValue)
    assertEquals("canvas.navigate", DraftClawCanvasCommand.Navigate.rawValue)
    assertEquals("canvas.eval", DraftClawCanvasCommand.Eval.rawValue)
    assertEquals("canvas.snapshot", DraftClawCanvasCommand.Snapshot.rawValue)
  }

  @Test
  fun a2uiCommandsUseStableStrings() {
    assertEquals("canvas.a2ui.push", DraftClawCanvasA2UICommand.Push.rawValue)
    assertEquals("canvas.a2ui.pushJSONL", DraftClawCanvasA2UICommand.PushJSONL.rawValue)
    assertEquals("canvas.a2ui.reset", DraftClawCanvasA2UICommand.Reset.rawValue)
  }

  @Test
  fun capabilitiesUseStableStrings() {
    assertEquals("canvas", DraftClawCapability.Canvas.rawValue)
    assertEquals("camera", DraftClawCapability.Camera.rawValue)
    assertEquals("screen", DraftClawCapability.Screen.rawValue)
    assertEquals("voiceWake", DraftClawCapability.VoiceWake.rawValue)
  }

  @Test
  fun screenCommandsUseStableStrings() {
    assertEquals("screen.record", DraftClawScreenCommand.Record.rawValue)
  }
}
