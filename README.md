# my_tools

个人静态小工具合集。根目录是导航页，具体工具放在独立子目录中，便于用一个 GitHub Pages 仓库统一发布。

## 目录

- `/`：小工具导航页，来自原 `my_page`
- `/daily_program/`：每周计划工具，来自原 `daily_program`
- `/revise_tool/`：返修进度工具，来自原 `revise_tool`
- `/thesis_tool/`：大论文进度控制工具，来自本地 `thesis_tool`

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
http://127.0.0.1:4173/thesis_tool/
```




