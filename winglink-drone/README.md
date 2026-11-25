# 翼联智航本地运行

[项目介绍与截图](../README.md) · [在线门户演示](https://statuesque-phoenix-9ff3be.netlify.app/)

## 体验门户和模拟后台

准备 Node.js 20.19 或以上版本，在 `winglink-drone` 目录执行以下 PowerShell 命令。

```powershell
Set-Location .\drone-web\drone-web
npm ci
npm run dev
```

打开 [本地门户](http://localhost:3000/)。在 [后台登录页](http://localhost:3000/login) 输入演示用户名和至少 6 位的测试密码，即可查看订单、机队与报表。模拟登录和后台演示数据由前端提供，可直接体验。

## 运行后端接口

准备 Java 17、Maven 与 MySQL 8。在 MySQL 客户端执行 `source` 命令，将示例表结构导入本地测试库。把下面的路径换成实际文件路径。

```sql
source D:/your-path/winglink-drone/database.example.sql
```

在 `winglink-drone` 目录打开 PowerShell，复制配置示例。

```powershell
Copy-Item .\drone-admin\src\main\resources\application.example.yml .\drone-admin\src\main\resources\application.yml
```

在 `application.yml` 填写本地数据库连接信息和随机 JWT 签名密钥，随后启动后端。

```powershell
Set-Location .\drone-admin
mvn spring-boot:run
```

后端默认监听 `http://localhost:8080`，Vite 将前端 `/api` 请求代理到该端口。示例库只包含表结构，可通过后端 `/auth/register` 创建测试账号。

## 可选配置

- **地图**。在前端目录复制 [`.env.example`](drone-web/drone-web/.env.example) 为 `.env.local`，配置 `VITE_AMAP_JS_KEY` 后重启 Vite，可启用航线页的高德地图。该 JavaScript Key 对浏览器可见。
- **AI 助手**。按同一份示例配置 `DASHSCOPE_API_KEY` 和 `DASHSCOPE_APP_ID`。请求由 Vite 开发服务器转发，密钥保留在服务端，静态构建不提供该转发。
- **检查与构建**。可在前端目录执行 `node --test dev/aiProxy.test.mjs` 和 `npm run build`。
