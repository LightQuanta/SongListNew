<template>
  <el-row class="m-4">
    <el-button class="p-5 border" @click="importXlsx()" type="primary">上传xlsx</el-button>
    <el-button class="p-5 border" @click="exportToml()" v-if="songs.length > 0">导出toml格式歌单信息</el-button>
  </el-row>
  <el-collapse class="mx-4">
    <el-collapse-item title="编辑表格展示列">
      <!-- TODO 同步selectedTitles -->
      <EditableTagsWithDisplayName v-model:display-name="displayName"
                                   v-model:selected-keys="selectedTitles"
                                   content-editable
      />
    </el-collapse-item>
  </el-collapse>
  <table class="flex items-stretch flex-col w-full" v-loading="loading">
    <thead>
    <tr class="flex content-center sticky top-0">
      <th class="flex-1" v-for="t in selectedTitles">
        {{ displayName[t] }}
      </th>
    </tr>
    </thead>
    <tbody>
    <tr class="flex content-center justify-center text-center" v-for="s in songs" :key="s.name">
      <td class="flex-1 flex justify-center" v-for="t in selectedTitles" :key="t">
        <EditableTags v-if="tags.has(t)" v-model="s[t]"/>
        <div v-else>{{ s[t] }}</div>
      </td>
    </tr>
    </tbody>
  </table>
  <!-- Xlsx Import -->
  <XlsxImportDialog ref="xlsxImportDialogRef"
                    @update-songs="updateSongsAndTitles"
                    @dialog-close="loading = false"
                    @start-processing="loading = true"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { stringify as toToml } from 'smol-toml'
import type { SongConfig, SongInfo } from '../types'
import EditableTags from "./EditableTags.vue";
import EditableTagsWithDisplayName from "./EditableTagsWithDisplayName.vue";
import XlsxImportDialog from "./XlsxImportDialog.vue";

import 'element-plus/dist/index.css'
import { ElButton, ElCollapse, ElCollapseItem, ElLoading, ElMessageBox, ElRow, } from 'element-plus'

const tags = new Set(['tags'])

interface KeysInfo {
  default: string
  description: string
}

const props = defineProps<{
  config: SongConfig,
  songInfoKeys: Record<keyof SongInfo, KeysInfo>,
}>()

const selectedTitles = ref([...new Set(props.config.titles)])
const displayName = ref(props.config.display_name)

// Xlsx Import
const xlsxImportDialogRef = ref<InstanceType<typeof XlsxImportDialog>>()

const updateSongsAndTitles = (songInfo: typeof songs.value, titles: typeof selectedTitles.value) => {
  songs.value = songInfo
  selectedTitles.value = titles
}

const loading = ref(false)
const importXlsx = () => {
  if (songs.value.length > 0) {
    ElMessageBox.confirm('导入歌单将会覆盖当前歌单内容，是否继续导入', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      center: true,
    }).then(() => {
      xlsxImportDialogRef.value?.openDialog()
    })
  } else {
    xlsxImportDialogRef.value?.openDialog()
  }
}

// todo!: 临时增加的全局遮罩，table完成后删除
let loadingService: any
watch(loading, (value) => {
  if (!value) {
    loadingService?.close()
  } else {
    loadingService = ElLoading.service({
      lock: true,
      text: 'Loading',
      background: 'rgba(0, 0, 0, 0.7)',
      fullscreen: true,
    })
  }
})

// 将歌单导出为toml配置文件
const exportToml = () => {
  const toml = toToml({
    titles: selectedTitles.value,
    display_name: displayName.value,
    songs: songs.value,
  })
  const blob = new Blob([toml], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'songs.toml'
  a.click()
}

const songs = ref<SongInfo[]>(props.config.songs)
</script>