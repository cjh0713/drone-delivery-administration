# 翼联智航 无人机配送协同平台

一个围绕无人机配送场景制作的早期 Web 作品，包含前台门户、管理后台和基础业务接口。前端使用 Vue 3，后端使用 Spring Boot 与 MySQL。

地图、航线、配送位置和部分统计内容包含模拟展示。本项目没有接入真实无人机或飞控系统，适合作为学习与作品演示材料。当前仓库不提供持续在线的演示地址，可按下文在本地启动。

## 项目结构

```text
drone/
├── drone-admin/                       # Spring Boot 后端
│   ├── pom.xml
│   └── src/main/resources/
│       └── application.example.yml    # 可公开的配置示例
├── drone-web/
│   └── drone-web/                     # 前端实际目录
│       ├── package.json
│       ├── .env.example
│       ├── dev/aiProxy.mjs            # 本地开发用 AI 转发
│       └── src/
├── database.example.sql               # 仅表结构与索引，不含历史用户和订单
├── .env.example                       # 可选地图测试配置
├── requirements-dev.txt              # 可选 Python 测试工具依赖
└── test_api.py
```

## 技术与功能

| 部分 | 内容 |
| --- | --- |
| 前端 | Vue 3、Vue Router、Pinia、Element Plus、Axios、ECharts、GSAP、Cesium |
| 后端 | Java 17、Spring Boot 3.2、Spring Security、MyBatis Plus、JWT、MySQL |
| 门户页面 | 登录注册、首页展示、配送预约、地图与位置展示、AI 助手等 |
| 管理页面 | 用户、无人机、订单、航线、统计与设置等页面 |
| 业务接口 | 认证、用户、无人机、订单、统计等接口，以当前源码实现为准 |

页面展示和实际业务接口的完成程度不同，部分内容使用模拟数据；不将演示页面视为真实设备控制能力。

## 本地启动

需要 Java 17、Maven、MySQL 8 和满足 Vite 5 要求的 Node.js 环境。以下命令从仓库根目录开始，使用 PowerShell。

### 1 初始化数据库

在 MySQL 客户端执行：

```sql
source /绝对路径/drone/database.example.sql;
```

Windows 下可使用正斜杠路径，例如 `source D:/my-projects/drone/database.example.sql;`。

示例脚本只创建 `drone_platform` 数据库、表和索引，不包含历史账号、手机号、地址及订单数据。应使用本地测试数据，不要导入真实业务数据到公开仓库。

### 2 配置并启动后端

```powershell
Copy-Item .\drone-admin\src\main\resources\application.example.yml .\drone-admin\src\main\resources\application.yml
```

打开生成的 `application.yml`，填写自己的数据库地址、用户名、密码以及随机 JWT 签名密钥。实际配置文件已被 `.gitignore` 排除。

```powershell
Set-Location .\drone-admin
mvn spring-boot:run
```

后端默认地址为 `http://localhost:8080`。也可在 IDE 中运行 `com.winglink.DroneApplication`。

### 3 启动前端

另开一个终端，从仓库根目录执行：

```powershell
Set-Location .\drone-web\drone-web
npm install
npm run dev
```

前端默认地址为 `http://localhost:3000`。前端目录是 `drone-web/drone-web`，不是外层的 `drone-web`。

### 4 创建本地账号

通过登录页面的注册入口创建测试账号。示例数据库不预置可登录账号。

如需管理员账号，可先注册一个专用的本地测试账号，再在自己的数据库中修改角色，例如：

```sql
UPDATE sys_user SET role = 'ADMIN' WHERE username = 'demo_admin';
```

其中 `demo_admin` 必须替换成自己已注册的测试用户名。此方式用于本地演示，不作为正式环境的权限管理方案。

## 可选 AI 助手

基础页面展示不要求启用 AI 助手。需要使用该功能时，在前端目录执行：

```powershell
Copy-Item .env.example .env.local
```

在前端 `.env.local` 中填写自己的 `DASHSCOPE_API_KEY` 和 `DASHSCOPE_APP_ID`，然后重启开发服务器。

密钥由本地 Vite 开发服务器读取并添加到转发请求中；浏览器只访问 `/ai-api/chat`，前端源码中不保存密钥。不要使用 `VITE_` 前缀存放密钥，因为这类变量会进入浏览器代码。

这项转发只在 `npm run dev` 时提供。构建后的静态文件及 `npm run preview` 不包含该服务；重新上线时，应在服务端配置对应转发与访问控制，不要把服务密钥塞回前端。

## 可选地图配置

公开源码已删除原有高德 JavaScript Key 和 Web 服务 Key，未填写任何可使用的真实凭据。仅用于展示代码时保持示例配置为空即可。

`src/components/Map2D/index-v2.vue` 是保留的旧版高德地图组件。需要使用时，在前端目录的 `.env.local` 填写自己的 `VITE_AMAP_JS_KEY` 并重启开发服务；未配置时组件显示“地图暂未配置”。当前主要地图页面的使用情况以实际组件引用为准。

`VITE_` 变量会进入浏览器代码，环境文件只能避免把配置提交到仓库，不能隐藏网页运行时使用的 JS Key。上线前应在高德控制台配置域名白名单；如启用 `securityJsCode`，请按[高德官方安全说明](https://lbs.amap.com/api/javascript-api-v2/guide/abc/jscode)使用服务端代理，不要放入前端变量。Web 服务 Key 也不要放入浏览器。

### 独立地图 API 测试工具

根目录的 `test_api.py` 是独立的本地地理编码检查工具，不是后端或前端启动条件。

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-dev.txt
Copy-Item .env.example .env.local
```

在根目录 `.env.local` 中填写 `AMAP_WEB_SERVICE_KEY`，然后执行：

```powershell
.\.venv\Scripts\python.exe .\test_api.py
```

不要把自己的 `.env.local` 上传到仓库。

## 构建与检查

在前端目录执行：

```powershell
node --test dev/aiProxy.test.mjs
npm run build
```

前端构建结果位于 `drone-web/drone-web/dist`，依赖目录和构建结果均不进入源码仓库。后端可在 `drone-admin` 中运行 `mvn test`；执行环境需自行准备。

## 上传 GitHub

建议使用 Git 或 GitHub Desktop 提交文件，以便按 `.gitignore` 排除依赖、构建结果、本地配置和原始数据库文件。请不要直接把当前整个工作目录压缩上传。

创建一个空仓库时：

- Repository template 选择 **No template**。
- 不勾选 Add a README file，本地已有说明。
- Add .gitignore 选择 **None**，使用本项目中的规则。
- License 暂选 **None**，确认项目来源及授权意愿后再补齐许可证。

保留的本地 `database.sql` 和 `application.yml` 不用于公开上传；公开版本分别提供 `database.example.sql` 与 `application.example.yml`。

本公开版本还删除了原有 AI 凭据、两处高德 Key，并将手动调度模拟订单中的两个完整手机号替换为“未提供”。源码内保留的城市坐标、模拟航线和通用地点名称用于界面演示。请使用本次清理后的源码包，不要把旧项目的私有配置、数据库、构建产物或本地备份混入仓库。

## 许可证

原有项目说明标注为 MIT License，但当前目录没有独立的完整 `LICENSE` 文件。发布者应先核实原始代码与素材的来源，再补齐适用的授权文本。第三方依赖和素材仍须遵守各自的许可证。
