package ai.draftclaw.android.ui

import androidx.compose.runtime.Composable
import ai.draftclaw.android.MainViewModel
import ai.draftclaw.android.ui.chat.ChatSheetContent

@Composable
fun ChatSheet(viewModel: MainViewModel) {
  ChatSheetContent(viewModel = viewModel)
}
