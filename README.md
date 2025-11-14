# 📊 Excel 预览器 

一个基于 Vue 3 + TypeScript 构建的 Excel 预览组件。

![Vue 3](https://img.shields.io/badge/Vue-3.x-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![Design Patterns](https://img.shields.io/badge/Design%20Patterns-6+-orange)

## 🚀 快速开始

```vue
<template>
  <div>
    <input type="file" accept=".xlsx,.csv" @change="handleFileChange" />
    <ExcelPreview 
      ref="previewRef"
      @parse-complete="handleParseComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ExcelPreview } from '@blackie233/vue-excel-preview'
import '@blackie233/vue-excel-preview/style.css'

const previewRef = ref()

function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file && previewRef.value) {
    previewRef.value.loadFile(file)
  }
}

function handleParseComplete(result: any) {
  console.log('解析完成:', result)
}
</script>
```

### 🎭 自定义 SVG 图标

```vue
<template>
  <ExcelPreview ref="previewRef">
    <template #error-icon>
      <svg class="custom-icon" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
      </svg>
    </template>
    
    <template #no-data-icon>
      <svg class="custom-icon" viewBox="0 0 24 24">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      </svg>
    </template>
  </ExcelPreview>
</template>
```
