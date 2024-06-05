<template>
  <el-row class="m-4">
    <el-button class="p-5 border" @click="importXlsx()" type="primary">上传xlsx</el-button>
    <el-button class="p-5 border" @click="exportToml()" v-if="songs.length > 0">导出toml格式歌单信息</el-button>
  </el-row>
  <el-collapse class="mx-4">
    <el-collapse-item title="编辑标题">
      <p>点击标签编辑标题，长按拖动</p>
      <EditableTagsWithDisplayName v-model:display-name="displayName" v-model:selected-keys="selectedTitles"
        content-editable />
    </el-collapse-item>
  </el-collapse>
  <!-- TODO 解决性能问题 -->
  <!-- <el-table ref="tableRef" :data="songs" stripe>
    <template v-for="title in selectedTitles" :key="title">
      <el-table-column
          :filter-method="getFilterMethod(title)"
          :filters="getFilters(title)"
          :label="displayName[title]"
          :prop="title"
          :sortable="sortableColumns.has(title)"
      >
        <template v-if="tagColumns.has(title)" #default="scope">
          <EditableTags v-model="scope.row[title]" :suggestions="allTagsText"/>
        </template>
</el-table-column>
</template>
</el-table> -->
  <el-table-v2 ref="tableRef" :data="songs" :columns="columns" stripe :width="1680" :height="800" />
  <!-- Xlsx Import -->
  <XlsxImportDialog ref="xlsxImportDialogRef" @update-songs="updateSongsAndTitles" @dialog-close="loading = false"
    @start-processing="loading = true" />
</template>

<script setup lang="tsx">
import { computed, ref, watch } from 'vue'
import { stringify as toToml } from 'smol-toml'
import type { SongConfig, SongInfo } from '../types'
import EditableTags from "./EditableTags.vue";
import EditableTagsWithDisplayName from "./EditableTagsWithDisplayName.vue";
import XlsxImportDialog from "./XlsxImportDialog.vue";

import 'element-plus/dist/index.css'
import {
  ElButton,
  ElCollapse,
  ElCollapseItem,
  ElLoading,
  ElMessageBox,
  ElRow,
  ElTable,
  ElTableColumn,
  ElTableV2,
  type TableColumnCtx,
  type Column
} from 'element-plus'

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
    songs: songs.value.map(s => {
      for (const prop in s) {
        if (s[prop as keyof SongInfo] instanceof Array && (s[prop as keyof SongInfo] as Array<any>).length === 0) {
          delete s[prop as keyof SongInfo]
        }
      }
      return s
    }),
  })
  const blob = new Blob([toml], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'songs.toml'
  a.click()
}

const songs = ref<SongInfo[]>(props.config.songs)

const tagRenderer = (data: any, suggestions: string[]) =>
  <EditableTags v-model={data} suggestions={suggestions} />

const pureCellRenderer = (title: keyof SongInfo, cellData?: any) => {
  if (cellData) {
    return tagColumns.has(title) ? tagRenderer(cellData, allTagsText.value) : cellData
  }
  else return null
}
// table columns
const columns: Column<SongInfo>[] = selectedTitles.value.map(title => ({
  width: 300,
  title: displayName.value[title],
  key: title,
  dataKey: title,
  cellRenderer: ({ cellData }) => pureCellRenderer(title, cellData),
}))

// 表格筛选处理
const tagColumns = new Set(['tags'])
const sortableColumns = new Set(['id', 'name', 'artist', 'language', 'paid', 'top', 'sc'])
const filterableColumns = new Set(['artist', 'language', 'paid', 'top', 'sc'])

const tableRef = ref<InstanceType<typeof ElTable>>()
// watch(songs, () => tableRef.value!.clearFilter())

const getFilterMethod = (title: keyof SongInfo) => filterableColumns.has(title) ? filterColumn : (tagColumns.has(title) ? filterTag : undefined)
const getFilters = (title: keyof SongInfo) => {
  if (filterableColumns.has(title)) {
    return [...allFilterableColumns.value.get(title)!].map(c => ({
      text: c,
      value: c
    }))
  }
  if (tagColumns.has(title)) {
    return allTags.value
  }
  return undefined
}


const allTags = computed(() => {
  const tags = new Set<string>()
  for (const s of songs.value) {
    for (const key in s) {
      if (tagColumns.has(key)) {
        (s[key as keyof SongInfo] as string[]).forEach(str => tags.add(str))
      }
    }
  }
  return [...tags].map(t => ({ text: t, value: t }))
})

const allTagsText = computed(() => {
  return allTags.value.map(t => t.text)
})

const allFilterableColumns = computed(() => {
  const map = new Map<string, Set<string>>()
  for (const song of songs.value) {
    for (const key in song) {
      if (!filterableColumns.has(key)) continue

      if (!map.has(key)) {
        map.set(key, new Set([song[key as keyof SongInfo] as string]))
      } else {
        map.get(key)!.add(song[key as keyof SongInfo] as string)
      }
    }
  }
  return map
})

const filterTag = (
  _: string,    // 这玩意有啥用？
  row: SongInfo,
  column: TableColumnCtx<SongInfo>
) => {
  const selected = column.filteredValue
  if (selected.length === 0) return true

  // TODO 交集还是并集，这是个问题
  // return selected.some(t => row.tags?.includes(t) ?? false)
  return selected.every(t => row.tags?.includes(t) ?? false)
}

const filterColumn = (
  _: string,
  row: SongInfo,
  column: TableColumnCtx<SongInfo>
) => column.filteredValue.some(v => v === row[column.property as keyof SongInfo])
</script>