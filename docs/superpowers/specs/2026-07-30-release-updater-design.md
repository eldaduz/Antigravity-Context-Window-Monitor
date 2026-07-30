# Release updater

The extension checks GitHub Releases for `eldaduz/Antigravity-Context-Window-Monitor` at startup and through a `Check for Updates` command.

It selects the newest release asset matching `antigravity-context-monitor-*.vsix`, compares semantic versions with the installed extension, and does nothing when no newer version exists. For a newer version it asks before downloading the VSIX to the extension storage directory and installing it through VS Code's `workbench.extensions.installExtension` command. Success asks the user to reload the window. Failures show one actionable error message.

The release source is fixed to this fork. Tests cover version comparison and selecting a matching release asset. Release version: `1.16.16`.
