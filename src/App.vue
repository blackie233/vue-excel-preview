<template>
  <div class="app">

    <div class="demo-container">

      <!-- Preview Panel -->
      <div class="preview-panel">
        <div class="upload-section">
          <label class="file-upload-btn">
            <input type="file" accept=".xlsx, .csv" @change="handleFileChange" hidden />
            📁 选择 Excel 文件
          </label>
          <p class="upload-hint">支持 .xlsx、.csv 格式</p>
        </div>
         <div class="preview-container">
           <ExcelPreview
             ref="previewRef"
             @parse-complete="handleParseComplete"
             error-message="无法解析文件"
             no-data-message="选择 Excel 文件"
             loading-message="正在努力解析中..."
           >
             <template #error-icon>
               <svg class="custom-icon error-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                 <circle cx="12" cy="12" r="10" stroke-width="2"/>
                 <line x1="12" y1="8" x2="12" y2="12" stroke-width="2"/>
                 <line x1="12" y1="16" x2="12.01" y2="16" stroke-width="2"/>
               </svg>
             </template>
             
             <template #no-data-icon>
               <svg class="custom-icon no-data-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                 <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke-width="2"/>
                 <polyline points="14 2 14 8 20 8" stroke-width="2"/>
                 <line x1="16" y1="13" x2="8" y2="13" stroke-width="2"/>
                 <line x1="16" y1="17" x2="8" y2="17" stroke-width="2"/>
                 <polyline points="10 9 9 9 8 9" stroke-width="2"/>
               </svg>
             </template>
           </ExcelPreview>
         </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ExcelPreview from './components/ExcelPreview.vue'
import type {IParseResult} from "./core/types.ts";

const previewRef = ref<InstanceType<typeof ExcelPreview> | null>(null)

const currentFile = ref<File | null>(null)
const parseResult = ref<IParseResult | null>(null)

function handleFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) {
    currentFile.value = file
    
    // Load in refactored version
    if (previewRef.value) {
      previewRef.value.loadFile(file)
    }
  }
}

function handleParseComplete(result: IParseResult) {
  parseResult.value = result
}

</script>

<style scoped>

@keyframes rotateConic {
  from {
    background: conic-gradient(
        from 0deg,
        #444,
        #666,
        #888,
        #aaa,
        #ddd
    );
  }
  to {
    background: conic-gradient(
        from 360deg,
        #444,
        #666,
        #888,
        #aaa,
        #ddd
    );
  }
}

.app {
  min-height: 100vh;
  width: 100%;
  padding: 2rem;
  background: radial-gradient(#e66465, #9198e5);
}


.app-header h1 {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  font-weight: 700;
}

.demo-container {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.preview-panel {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.upload-section {
  padding: 1.5rem;
  background: linear-gradient(135deg, #9198e5 0%, #e66465 100%);
  text-align: center;
}

.file-upload-btn {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: white;
  color: #667eea;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.file-upload-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

.upload-hint {
  color: white;
  margin-top: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.9;
}


.preview-container {
  position: relative;
  overflow: hidden;
  height: 500px;
}

/* Custom SVG icon styles */
.custom-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
}

.error-svg {
  color: #dc3545;
  stroke-width: 2;
}

.no-data-svg {
  color: #6c757d;
  stroke-width: 2;
}

@media (max-width: 1200px) {
  .demo-container {
    grid-template-columns: 1fr;
  }
  
  .architecture-panel {
    order: 2;
  }
}
</style>

