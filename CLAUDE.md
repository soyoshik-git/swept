# Swept - Claude Code ガイドライン

## Git ワークフロー

### push 前の必須手順

`git push` を実行する前に、必ず以下を実行してブランチを最新の main に同期する：

```bash
git fetch origin main
git merge origin/main --no-edit
```

コンフリクトが発生した場合は解決してからプッシュする。これにより、セッションをまたいだブランチのズレによる PR マージ失敗を防ぐ。

### 開発ブランチ

常に `claude/swept-project-status-Vh7kS` ブランチで開発し、PR 経由で main にマージする。
