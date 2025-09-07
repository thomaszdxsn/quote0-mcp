# Quote0 MCP

通过 Claude Desktop 控制您的 Quote0 智能显示设备。

## 什么是 Quote0？

Quote0 是一款智能电子墨水屏显示设备，可以远程更新显示内容。通过这个 MCP 服务，您可以在 Claude Desktop 中用自然语言控制设备，发送文字和图片。

## 准备工作

使用前您需要：
1. **API Key**：从 Quote0 App 获取 - [查看教程](https://dot.mindreset.tech/docs/server/template/api/get_api)
2. **设备序列号**：在设备背面或 App 中查看 - [查看教程](https://dot.mindreset.tech/docs/server/template/api/get_device_id)

## 快速开始

### 在 Claude Desktop 中配置

1. **找到配置文件**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. **添加 Quote0 MCP 配置**

```json
{
  "mcpServers": {
    "quote0": {
      "command": "npx",
      "args": ["quote0-mcp"],
      "env": {
        "QUOTE0_API_KEY": "你的API密钥",
        "QUOTE0_DEVICE_IDS": "书桌:设备序列号1,客厅:设备序列号2,冰箱:设备序列号3"
      }
    }
  }
}
```

配置说明：
- `QUOTE0_API_KEY`：必填，您的 API 密钥
- `QUOTE0_DEVICE_IDS`：可选，给设备起别名，格式为 `别名:序列号`，多个设备用逗号分隔

3. **重启 Claude Desktop**

## 使用示例

配置完成后，您可以在 Claude Desktop 中这样对话：

### 📝 发送文字

**示例 1：发送待办事项**
```
请发送以下内容到书桌的设备：
标题：今日待办
内容：
1. 完成项目报告
2. 下午3点会议  
3. 回复重要邮件
署名：2024年1月15日
```

**示例 2：显示名言警句**
```
在客厅设备上显示：
"书山有路勤为径，学海无涯苦作舟"
署名：古训
```

**示例 3：显示天气信息**
```
帮我在玄关的 Quote0 上显示：
标题：今日天气
内容：晴，15-22°C
备注：适合外出
```

### 🖼️ 发送图片

**示例 1：发送本地图片**
```
把这张图片发送到卧室的设备上
[附上图片文件]
```

**示例 2：生成并发送二维码**
```
生成我的 WiFi 信息二维码，发送到客厅设备：
网络名：MyHome
密码：12345678
```

**示例 3：发送带链接的图片**
```
发送公司 logo 到书桌设备，点击后打开公司官网 https://example.com
```

## 设备别名配置

为了方便使用，建议给每个设备起一个容易记住的别名：

### 按位置命名
```json
"QUOTE0_DEVICE_IDS": "书桌:abc123,客厅:def456,卧室:ghi789,厨房:jkl012"
```

### 按用途命名
```json
"QUOTE0_DEVICE_IDS": "日程表:abc123,相框:def456,便签:ghi789"
```

### 支持中文或英文
```json
"QUOTE0_DEVICE_IDS": "desk:abc123,living_room:def456,冰箱:ghi789,玄关:jkl012"
```

## 高级配置

### 自定义 API 地址（可选）

如果您使用私有部署的 Quote0 服务：

```json
{
  "mcpServers": {
    "quote0": {
      "command": "npx",
      "args": ["quote0-mcp"],
      "env": {
        "QUOTE0_API_KEY": "你的API密钥",
        "QUOTE0_TEXT_API_URL": "https://your-server.com/api/open/text",
        "QUOTE0_IMAGE_API_URL": "https://your-server.com/api/open/image",
        "QUOTE0_DEVICE_IDS": "设备1:id1,设备2:id2"
      }
    }
  }
}
```

### 本地开发模式

如果您想修改或扩展功能：

1. 克隆代码仓库
```bash
git clone https://github.com/your-username/quote0-mcp.git
cd quote0-mcp
```

2. 安装依赖并编译
```bash
pnpm install
pnpm build
```

3. 在 Claude Desktop 中使用本地版本
```json
{
  "mcpServers": {
    "quote0-local": {
      "command": "node",
      "args": ["/完整路径/quote0-mcp/dist/index.js"]
    }
  }
}
```

## 常见问题

### Q: 设备没有响应？
A: 请检查：
- 设备是否开机并连接网络
- API Key 是否正确
- 设备序列号是否正确

### Q: 如何知道命令是否成功？
A: Claude 会告诉您发送结果，成功时会显示"Successfully sent"，失败时会说明原因。

### Q: 可以同时控制多个设备吗？
A: 可以，只需在配置中添加多个设备的序列号和别名即可。

### Q: 图片显示效果不好？
A: Quote0 使用电子墨水屏，建议使用：
- 黑白或灰度图片
- 简单清晰的图形
- 避免过于复杂的渐变

## 注意事项

- API 限制：每秒最多发送 1 次请求
- 设备需要保持开机状态并连接 WiFi
- 图片格式必须是 PNG，会自动转换为 Base64
- 文字内容支持中英文和 Emoji

## 相关文档

- [文字 API 详细说明](https://dot.mindreset.tech/docs/server/template/api/text_api)
- [图片 API 详细说明](https://dot.mindreset.tech/docs/server/template/api/image_api)
- [获取 API Key](https://dot.mindreset.tech/docs/server/template/api/get_api)
- [获取设备序列号](https://dot.mindreset.tech/docs/server/template/api/get_device_id)

## 开源协议

MIT License