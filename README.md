# my_tools

个人静态小工具合集。根目录是导航页，具体工具放在独立子目录中，便于用一个 GitHub Pages 仓库统一发布。

## 目录

- `/`：小工具导航页，来自原 `my_page`
- `/daily_program/`：每周计划工具，来自原 `daily_program`
- `/revise_tool/`：返修进度工具，来自原 `revise_tool`

## 本地预览

直接用浏览器打开 `index.html`，或启动静态服务：

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

然后访问：

```txt
http://127.0.0.1:4173/
http://127.0.0.1:4173/daily_program/
http://127.0.0.1:4173/revise_tool/
```

## GitHub Pages

推荐统一发布到：

```txt
https://tools.qiutao20.online/
https://tools.qiutao20.online/daily_program/
https://tools.qiutao20.online/revise_tool/
```

Cloudflare DNS 中添加：

```txt
tools  CNAME  qiutao20.github.io
```

旧域名如果还要保留入口，建议在 Cloudflare 里做重定向：

```txt
plan.qiutao20.online   -> https://tools.qiutao20.online/daily_program/
revise.qiutao20.online -> https://tools.qiutao20.online/revise_tool/
```

注意：浏览器 `localStorage` 按域名隔离。迁移到 `tools.qiutao20.online` 后，旧域名下的本地数据不会自动出现在新域名；`daily_program` 可以通过 GitHub 同步从 `private_data` 拉取数据。
