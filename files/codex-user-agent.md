# 获取最新 Codex User-Agent

本文档用于后续快速获取当前最新版 Codex 的 `User-Agent`。

## 1. 确认最新版

```bash
npm view @openai/codex version
```

示例输出：

```text
0.137.0
```

本机已安装版本：

```bash
codex --version
```

## 2. 获取当前运行时实际返回的 User-Agent

Codex app-server 的 `initialize` 响应会返回它将对上游服务使用的 `userAgent`。

```bash
mkdir -p .tmp/codex-ua-home

CODEX_HOME="$PWD/.tmp/codex-ua-home" node <<'NODE'
const { spawn } = require("child_process");

const proc = spawn("codex", ["app-server"], {
  stdio: ["pipe", "pipe", "inherit"],
  env: process.env,
});

let buffer = "";
const timer = setTimeout(() => proc.kill("SIGTERM"), 5000);

proc.stdout.on("data", (chunk) => {
  buffer += chunk;
  const lines = buffer.split("\n");
  buffer = lines.pop() || "";

  for (const line of lines) {
    if (!line.trim()) continue;

    try {
      const message = JSON.parse(line);
      if (message.id === 0 && message.result?.userAgent) {
        console.log(message.result.userAgent);
        clearTimeout(timer);
        proc.kill("SIGTERM");
      }
    } catch {
      // Ignore non-JSON diagnostic output.
    }
  }
});

proc.on("exit", () => clearTimeout(timer));

proc.stdin.write(JSON.stringify({
  method: "initialize",
  id: 0,
  params: {
    clientInfo: {
      name: "codex_ua_probe",
      title: "Codex UA Probe",
      version: "0.0.1",
    },
  },
}) + "\n");

proc.stdin.write(JSON.stringify({
  method: "initialized",
  params: {},
}) + "\n");
NODE
```

示例输出：

```text
codex_ua_probe/0.137.0 (Alpine Linux 3.23.3; x86_64) xterm-256color (codex_ua_probe; 0.0.1)
```

说明：

- `codex_ua_probe` 来自 `clientInfo.name`。
- 最后的 `(codex_ua_probe; 0.0.1)` 来自 app-server 为客户端追加的 UA suffix。
- 如果要标识自己的集成，改 `clientInfo.name/title/version`。
- `CODEX_HOME` 指向项目临时目录，是为了避开某些环境下默认 `$HOME/.codex` 只读的问题。

## 3. 默认 Codex CLI User-Agent

源码中的默认 originator 是：

```text
codex_cli_rs
```

默认 CLI UA 公式：

```text
codex_cli_rs/<codex_version> (<os_type> <os_version>; <architecture>) <terminal_token>
```

当前环境示例：

```text
codex_cli_rs/0.137.0 (Alpine Linux 3.23.3; x86_64) xterm-256color
```

## 4. 校验来源

- Codex app-server 文档：`initialize` 响应包含 `userAgent`、`platformFamily`、`platformOs`。
- Codex 源码：`login/src/auth/default_client.rs` 中 `get_codex_user_agent()` 负责拼接 UA。
- Codex 源码：`terminal-detection/src/lib.rs` 中 `user_agent()` 负责终端 token。

参考：

- https://developers.openai.com/codex/codex-manual.md
- https://github.com/openai/codex
- https://www.npmjs.com/package/@openai/codex
