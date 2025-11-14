# 📦 NPM 发布指南

## 准备工作

### 1. 修改 package.json

在发布前，请修改以下字段：

```json
{
  "name": "@your-org/vue-excel-preview",  // 修改为你的包名
  "version": "1.0.0",                      // 设置版本号
  "repository": {
    "url": "https://github.com/your-username/vue-excel-preview.git"  // 修改为你的仓库地址
  },
  "bugs": {
    "url": "https://github.com/your-username/vue-excel-preview/issues"
  },
  "homepage": "https://github.com/your-username/vue-excel-preview#readme"
}
```

### 2. 检查文件

确保以下文件存在：
- ✅ `README.md` - 项目说明文档
- ✅ `LICENSE` - 许可证文件
- ✅ `.npmignore` - npm 忽略文件配置

## 发布步骤

### Step 1: 登录 npm

```bash
npm login
```

输入你的 npm 账号信息。

### Step 2: 构建库

```bash
npm run build:lib
```

这将会：
- 编译 TypeScript
- 打包组件为 ES 和 UMD 格式
- 生成类型声明文件
- 输出到 `dist/` 目录

### Step 3: 测试构建产物

检查 `dist/` 目录：
```
dist/
├── excel-preview.es.js      # ES module 格式
├── excel-preview.umd.js     # UMD 格式
├── style.css                # 样式文件
└── index.d.ts              # TypeScript 类型声明
```

### Step 4: 发布到 npm

```bash
# 发布到 npm 公共仓库
npm publish --access public

# 如果是私有包（需要付费账号）
npm publish
```

### Step 5: 验证发布

```bash
# 查看包信息
npm info @your-org/vue-excel-preview

# 安装测试
npm install @your-org/vue-excel-preview
```

## 版本管理

### 更新版本

```bash
# 补丁版本（修复 bug）：1.0.0 -> 1.0.1
npm version patch

# 次版本（新功能）：1.0.0 -> 1.1.0
npm version minor

# 主版本（破坏性更改）：1.0.0 -> 2.0.0
npm version major
```

### 发布新版本

```bash
npm run build:lib
npm publish --access public
```

## 使用示例

发布后，用户可以这样使用：

### 安装

```bash
npm install @your-org/vue-excel-preview
```

### 全局注册

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import VueExcelPreview from '@your-org/vue-excel-preview'
import '@your-org/vue-excel-preview/style.css'

const app = createApp(App)
app.use(VueExcelPreview)
app.mount('#app')
```

### 局部使用

```vue
<template>
  <ExcelPreview
    ref="previewRef"
    error-icon="❌"
    no-data-message="选择文件"
  />
</template>

<script setup>
import { ExcelPreview } from '@your-org/vue-excel-preview'
import '@your-org/vue-excel-preview/style.css'
</script>
```

### 高级使用（使用核心类）

```typescript
import { ExcelViewer, Events } from '@your-org/vue-excel-preview'

const viewer = new ExcelViewer()

viewer.on(Events.PARSE_COMPLETE, (result) => {
  console.log('解析完成:', result)
})

await viewer.loadFile(file)
```

## 注意事项

### 1. 包名规范

- 使用 `@your-org/package-name` 格式（scoped package）
- 或使用唯一的包名（避免冲突）

### 2. 版本规范

遵循语义化版本（Semver）：
- **MAJOR**: 不兼容的 API 修改
- **MINOR**: 向下兼容的功能性新增
- **PATCH**: 向下兼容的问题修正

### 3. 文档更新

每次发布前确保：
- ✅ README.md 更新
- ✅ CHANGELOG.md 记录变更
- ✅ 示例代码可用

### 4. 测试

发布前测试：
```bash
# 本地测试
npm link
cd test-project
npm link @your-org/vue-excel-preview
```

## 常见问题

### Q: 发布时出现 403 错误？
A: 检查包名是否已被占用，使用 scoped package 或更改包名。

### Q: 如何撤销发布？
A: 72小时内可以撤销：
```bash
npm unpublish @your-org/vue-excel-preview@1.0.0
```

### Q: 如何更新 README？
A: 直接修改 README.md 后重新发布即可。

### Q: 如何添加 Badge？
A: 在 README.md 中添加：
```markdown
![npm](https://img.shields.io/npm/v/@your-org/vue-excel-preview)
![downloads](https://img.shields.io/npm/dm/@your-org/vue-excel-preview)
![license](https://img.shields.io/npm/l/@your-org/vue-excel-preview)
```

## 持续集成

建议配置 GitHub Actions 自动发布：

```yaml
# .github/workflows/publish.yml
name: Publish to NPM
on:
  release:
    types: [created]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build:lib
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

## 资源链接

- [npm 文档](https://docs.npmjs.com/)
- [语义化版本](https://semver.org/lang/zh-CN/)
- [npm 包发布指南](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)

