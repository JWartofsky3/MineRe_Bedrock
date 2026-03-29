Codex may read and modify files under:
- C:\Users\Jacob\Desktop\Mine Re\Cocoa's_Birds
- C:\Users\Jacob\Desktop\Mine Re\Cocoa's_Monsters
- C:\Users\Jacob\Desktop\Mine Re\AutoMiner

Codex may delete and recreate generated standalone pack contents in those folders when running pack sync skills.

Codex may run validation commands for those packs, including:
- npx.cmd tsc
- npx.cmd prettier


Do not use if statements without {}

Do not ask for permission for "Get-Content" commands. Just get the content

Use the "minere:" key for all dynamic properties on "minere" entities

You can run any Get-Content type commands without asking permission.

You can read anything under "C:\Users\Jacob\Desktop\Mine Re" without asking

Do not read scripts/.. 
That is output code.

Locale file note:
- `MineRe_RP/texts/*.lang` files may not be UTF-8, so `apply_patch` can fail on them.
- If a `.lang` file blocks patching, use a key-based replacement approach that preserves the file's existing encoding and only updates the specific lines you need.
- When syncing translations, treat `en_US.lang` as the source of truth, add missing keys to the other locale files first, then replace fallback English text with real translations only when requested.
