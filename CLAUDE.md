# ai — 技術脈絡 (Technical Context)

`ai/` 是`分類目錄 (category)`，不是專案：它`不含任何程式碼`，只以 git submodule
聚合五個獨立 repo。業務導覽與專案關聯見 [README.md](README.md)。

分類深度固定一層 —— 不得出現 `ai/<category>/<project>`。

## 目錄結構 (Directory Structure)

```tree
ai/
├── agentSDK/            # submodule → github.com/BizShuk/agentSDK      (branch master, 目前釘在 tag v0.0.60)
├── cc-plugin/           # submodule → github.com/bizshuk/cc-plugin     (branch master)
├── conversation_agent/  # submodule → github.com/BizShuk/conversation_agent (branch master)
├── customer_service/    # submodule → github.com/BizShuk/customer_service   (branch master)
├── m-agent/             # submodule → github.com/BizShuk/m-agent       (branch master;內含第三層 submodule picoclaw/)
├── model/               # 空目錄，未被 git 追蹤（git 不追蹤空目錄）
├── plans/               # 空目錄，分類層計畫預留位置，目前無檔案
├── .agents/             # 空目錄，分類層 agent 設定預留位置，目前無檔案
├── .claude-plugin/      # Claude Code plugin manifest（分類層唯一入版控的設定）
├── .vscode/             # 工作區編輯器設定（files.exclude 過濾 build 產物與 AGENTS.md 等 symlink 噪音）
├── .gitignore           # 工作區共用的 Universal Ignore Template
└── .gitmodules          # 五個 submodule 的 path / url / branch 宣告
```

分類層`入版控的檔案只有四個`：`.gitmodules`、`.gitignore`、
`.claude-plugin/plugin.json`、`.vscode/settings.json`（其餘為 submodule gitlink）。
`model/`、`plans/`、`.agents/` 目前皆為空目錄，只存在於 working tree。

## Submodule 機制 (Submodule Mechanics)

取得單一專案：

```bash
git submodule update --init <name>      # 例：git submodule update --init customer_service
git submodule update --init --recursive m-agent   # m-agent 需 --recursive 才會帶出 picoclaw/
git submodule status                    # 檢視每個 submodule 的 SHA 與檢出狀態
```

- `目前五個 submodule 全部已初始化`，沒有未初始化項目。
- `git submodule status` 前綴 `+` 表示檢出的 commit 與 superproject 記錄的 SHA
  不一致（在子專案內提交後、尚未在分類層 `git add <name>` 推進 pointer 的正常狀態）。
- 分類層記錄的是 commit `SHA` 而非分支內容；他處 clone 前，該 SHA 必須已存在於
  子專案的 `origin`，否則 `submodule update` 會失敗。
- `agentSDK` 目前釘在 tag `v0.0.60`；其餘四個追各自的 `master`。

### 第三層 submodule

`m-agent/picoclaw/` 是本分類唯一的第三層 repo，且是 `sipeed/picoclaw` 的 fork
（`origin` = 自己的 fork，`upstream` = sipeed）。`不要在分類層或 m-agent 層直接
編輯 picoclaw 內容` —— 任何本層寫入都會在 `merge upstream/main` 時變成衝突。
變更引擎請進 `m-agent/picoclaw/` 提交推 `origin`，再逐層 `git add` 推進 pointer。

## 分類層慣例 (Category Conventions)

- `分類層不放程式碼`。任何 `.go` / `.ts` / `.py` 都屬於某個專案，不屬於分類。
- `每個專案自帶統一介面 (Unified Interface)`：`README.md`（業務定義）、
  `CLAUDE.md`（技術脈絡）、`AGENTS.md`（symlink → `CLAUDE.md`）、`README.todo`、
  `docs/terminology.md`、`docs/memory/`。分類層`不`複製各專案的結構樹或術語，
  只留一行指標指過去。
- `提交邊界`：子專案的變更在子專案 repo 內提交；分類層只提交 submodule pointer
  的推進（`git add <name>`）與上述四個設定檔。兩者不混在同一個 commit。
- 新增專案：在子目錄 `git init` 並推上 remote 後，以
  `git submodule add <url> <name>` 掛入，再補該專案的統一介面文件。

## 分類層自身檔案 (Category-Level Files)

| 路徑 | 用途 |
| ---- | ---- |
| `.claude-plugin/plugin.json` | Claude Code plugin manifest，plugin 名稱 `ai` / displayName `AI Workspace`，用途是把各 submodule 維護的可重用 skills 聚合成一個工作區 plugin |
| `.vscode/settings.json` | 只有 `files.exclude`：隱藏 `.git`、build 產物（`dist`/`out`/`target`）、`node_modules`、`__pycache__`、`*_test.go`，以及 `AGENTS.md` / `GEMINI.md` / `.agents` 這類 symlink 與代理設定噪音 |
| `.gitignore` | 工作區共用的 Universal Ignore Template（同一份內容也用於 `.geminiignore` / `.claudeignore`，後兩者作為 LLM 語境過濾） |
| `plans/` `.agents/` `model/` | 目前皆空。`plans/` 依工作區慣例放 `YYYY-MM-DD-<topic>.md` 分類層計畫；`model/` 用途未偵測到 (Not detected) |

### 已知不一致 (Known Inconsistency)

`.claude-plugin/plugin.json` 的 `skills` 欄位宣告 `bizshuk/msgHub`，但
`.gitmodules` 沒有對應項目、working tree 也沒有 `msgHub/` 目錄；
`.git/modules/msgHub/` 仍殘留（曾經掛過又移除的 submodule 遺跡）。
現況下該 skills 項目`指不到任何東西`。要復原就重新 `git submodule add`，
要放棄就同時清掉 `plugin.json` 的宣告與 `.git/modules/msgHub/`。
