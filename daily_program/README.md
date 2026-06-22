# Weekly Planner

一个本地优先的计划网页工具，用来记录每周焦点、早中晚安排、计划收纳、想法和周末复盘，也支持用「宏观版」管理 15-60 天的阶段规划。

## 使用

直接用浏览器打开 `index.html`，或在目录里启动静态服务：

```powershell
python -m http.server 4173 --bind 127.0.0.1
```

然后访问 `http://127.0.0.1:4173/`。

## 数据存储

默认数据保存在浏览器 `localStorage` 中。页面右侧的「GitHub 同步」面板支持把 JSON 数据同步到私有仓库：

- 默认 owner：`qiutao20`
- 默认 repository：`private_data`
- 默认 branch：`main`
- 默认 path：`weekly-planner-data.json`

需要在浏览器里填入一个拥有目标仓库 Contents read/write 权限的 GitHub token。配置会保存在当前浏览器中；计划数据仍然存放在 `private_data` 仓库，不会进入这个工具仓库。

同步逻辑参考 `qiutao20/revise_tool`：本地优先保存，手动拉取/推送，支持自动拉取和修改后防抖自动推送，并用 GitHub Contents API 的 `sha` 检查降低误覆盖风险。
