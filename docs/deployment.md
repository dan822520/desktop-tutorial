# 跨平台部署指南

本指南提供在 Windows、macOS 与 Linux 环境部署资产二维码管理系统（后端 API + Web 管理端测试工具）的详细步骤。部署完成后即可通过前端测试所有后端接口功能。

> **提示**：所有命令均以默认安装路径为例，实际使用时请根据企业环境调整数据库地址、端口及凭证。

## 1. 通用准备工作

1. **获取源代码**
   ```bash
   git clone https://your.git.server/asset-qrcode-system.git
   cd asset-qrcode-system
   ```
2. **数据库**：准备可访问的 MySQL 5.7+/8.0 实例，并创建空数据库（例如 `asset_qrcode_db`）。
3. **环境变量**：复制模板 `backend/.env.example` 并补充数据库连接、JWT 密钥等信息。
4. **防火墙**：确保 3000 端口（后端）与 5173/静态资源端口（前端）对外开放或通过反向代理转发。

## 2. Windows 10/11 部署

### 2.1 安装依赖

1. 安装 [Node.js LTS](https://nodejs.org/en)（建议 18.x），安装过程勾选 *Automatically install the necessary tools*。
2. 安装 [MySQL Community Server](https://dev.mysql.com/downloads/mysql/)，创建具备读写权限的应用账号。
3. 可选：安装 [Git for Windows](https://git-scm.com/download/win) 以便拉取代码。

### 2.2 配置并启动后端

```powershell
cd backend
copy .env.example .env
notepad .env      # 修改数据库、JWT 等配置
npm install --production
npm run build
node dist/index.js
```

- 若需后台运行，可安装 [nssm](https://nssm.cc/) 将 `node dist/index.js` 注册为 Windows 服务。
- 数据库初始化：
  ```powershell
  mysql -u root -p < scripts\init_database.sql
  npx ts-node scripts/seed.ts
  ```

### 2.3 构建前端测试台

```powershell
cd ..\web-admin
npm install
npm run build
```

- 构建后静态文件位于 `web-admin\dist`，可使用任意静态服务器（如 [serve](https://www.npmjs.com/package/serve)）或 IIS 发布：
  ```powershell
  npx serve dist -l 5173
  ```
- 首次访问时在登录页填入后端 API 地址（例如 `http://localhost:3000/api`），并使用种子数据中的测试账号登录，验证资产、盘点、维修、调拨等功能。

## 3. macOS (Intel/Apple Silicon) 部署

### 3.1 安装依赖

```bash
# 使用 Homebrew 安装 Node.js 与 MySQL
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node@18 mysql
brew services start mysql
```

### 3.2 后端服务

```bash
cd backend
cp .env.example .env
open -e .env        # 编辑配置
npm install --production
npm run build
npm start           # 等同于 node dist/index.js
```

- 建议使用 `pm2` 管理进程：
  ```bash
  npm install -g pm2
  pm2 start dist/index.js --name asset-backend
  pm2 startup
  pm2 save
  ```

### 3.3 前端

```bash
cd ../web-admin
npm install
npm run build
npx serve dist --listen 5173
```

或将 `dist` 目录部署到 Nginx/Apache。若需要 HTTPS，可使用 `mkcert` 签发本地证书。

## 4. Linux (Ubuntu 20.04+/CentOS 8+) 部署

### 4.1 安装运行环境

```bash
# Ubuntu 示例
sudo apt update
sudo apt install -y curl build-essential mysql-server
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs git
```

- 初始化 MySQL 并创建数据库：
  ```bash
  sudo mysql_secure_installation
  mysql -u root -p -e "CREATE DATABASE asset_qrcode_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  ```

### 4.2 配置后端

```bash
cd backend
cp .env.example .env
nano .env             # 调整数据库、JWT、端口等
npm install --production
npm run build
```

- 使用 `pm2` 或 `systemd` 常驻：
  ```bash
  npm install -g pm2
  pm2 start dist/index.js --name asset-backend
  pm2 save
  pm2 startup systemd
  ```
  或：
  ```bash
  sudo tee /etc/systemd/system/asset-backend.service <<'SERVICE'
  [Unit]
  Description=Asset QRCode Backend
  After=network.target

  [Service]
  WorkingDirectory=/opt/asset-qrcode-system/backend
  ExecStart=/usr/bin/node dist/index.js
  Restart=always
  Environment=NODE_ENV=production

  [Install]
  WantedBy=multi-user.target
  SERVICE

  sudo systemctl enable --now asset-backend.service
  ```

### 4.3 构建与部署前端

```bash
cd ../web-admin
npm install
npm run build
```

- 将 `dist` 发布到 Nginx：
  ```nginx
  server {
      listen 80;
      server_name your-domain.com;

      location /api/ {
          proxy_pass http://127.0.0.1:3000/;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
      }

      location / {
          root /opt/asset-qrcode-system/web-admin/dist;
          try_files $uri $uri/ /index.html;
      }
  }
  ```
- 重新加载配置：`sudo nginx -t && sudo systemctl reload nginx`。

## 5. 验证部署

1. 浏览器访问 `http(s)://<前端域名>/`，登录超级管理员账号 `admin/admin123`。
2. 打开“测试数据”标签页并执行“填充测试数据”，系统会自动生成演示组织、资产、调拨、维修与盘点任务，同时展示新增测试账号（默认密码 `Test1234!`）。
3. 在每个功能页执行示例操作：
   - 资产管理：列表、创建、扫码查询。
   - 盘点管理：创建任务、扫码记录、生成报告。
   - 维修管理：创建报修、派单、完工。
   - 调拨管理：新建调拨、审批通过/驳回。
4. 验证完毕后，可在同一标签页执行“卸载测试数据”清理演示数据。
5. 前端所有请求均应返回 2xx 状态；如失败，`响应详情` 面板会显示后端返回的错误信息。

## 6. 生产环境加固建议

- **配置强密码**：修改 `.env` 中默认的数据库与 JWT 密钥，及时更新初始管理员口令。
- **启用 HTTPS**：推荐使用 Let’s Encrypt 或企业 CA。
- **备份与监控**：
  - 启用 MySQL binlog，定期备份数据库。
  - 通过 `pm2 monit`、`systemd` 日志或第三方平台监控服务健康状态。
- **日志与审计**：将 `backend/logs` 目录挂载到持久化存储，定期归档。
- **CI/CD**：在代码合入后自动执行 `npm run build`（后端 & 前端）和自定义测试流程，确保质量。

## 7. 常见问题

| 问题 | 解决方案 |
| --- | --- |
| 前端无法登录 | 检查 `.env` 中的后端端口、防火墙放行情况，以及浏览器 Console 是否存在跨域错误。 |
| 接口返回 401 | 确认请求头携带 `Authorization: Bearer <token>`，token 是否过期。 |
| 数据库连接失败 | 使用 `mysql -h <host> -u <user> -p` 手动连接验证权限，查看服务器安全组设置。 |
| 构建失败（缺少依赖） | 执行 `npm install` 后再次运行 `npm run build`，确保网络可访问 npm registry。 |

完成上述步骤后，系统即可在三大主流桌面/服务器平台上稳定运行，并可通过 Web 测试台全面验证后端能力。
