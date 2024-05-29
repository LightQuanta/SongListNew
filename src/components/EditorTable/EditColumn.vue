<script lang="ts" setup>
import { ElDialog, ElRadioGroup, ElButton, ElTable, ElTableColumn } from 'element-plus';
import { computed, ref, watch } from 'vue';
import type { SongConfig } from '../../types';
import merge from 'lodash/merge'
import { Container, Draggable } from "../Draggable";
import type { DropResult } from 'smooth-dnd';

const emit = defineEmits(['onUpdateColumn'])

const props = defineProps<{
  titleAndDesc: Record<string, string>
}>()

const DEFAULT_CONFIG = {
  titles: [],
  display_name: {},
  songs: [],
} as unknown as SongConfig

const songConfig = ref<SongConfig>({ ...DEFAULT_CONFIG })

const idNameKV = ref<{ id: string, name: string }[]>([])
watch(songConfig, (value) => {
  idNameKV.value = value.titles.map(t => ({
    id: t,
    name: songConfig.value.display_name[t]
  }))
})

// open
const open = ref(false)

const openDialog = (config: SongConfig) => {
  open.value = true
  songConfig.value = merge({}, DEFAULT_CONFIG, config)
}

const closeDialog = () => {
  open.value = false
  emit('onUpdateColumn', songConfig.value)
}

// drop trigger
const onDrop = (dropResult: DropResult) => {
  songConfig.value.titles = applyDrag(songConfig.value.titles, dropResult)
}

// utils

const applyDrag = (arr: any[], dragResult: DropResult) => {
  const { removedIndex, addedIndex, payload } = dragResult
  if (removedIndex === null && addedIndex === null) return arr

  const result = [...arr]
  let itemToAdd = payload

  if (removedIndex !== null) {
    itemToAdd = result.splice(removedIndex, 1)[0]
  }

  if (addedIndex !== null) {
    result.splice(addedIndex, 0, itemToAdd)
  }

  return result
}

defineExpose({
  openDialog
})
</script>

<template>
  <el-dialog v-model="open" title="歌单表头控制面板" center :on-close="closeDialog" width="80%" @close="closeDialog">
    <table class="w-full">
      <thead class="thead-dark block mb-1 py-4 border-y-[1px]">
        <tr class="flex px-4">
          <th scope="col" class="text-left w-[75%]">列名(双击修改)</th>
          <th scope="col" class="text-left w-[15%]">操作</th>
          <th scope="col" class="w-[10%]">拖拽排序</th>
        </tr>
      </thead>
      <Container :drop="onDrop" tag="tbody" drag-handle-selector=".column-drag-handle">
        <Draggable v-for="element in songConfig.titles" :key="element">
          <tr class="flex border-b-2 py-2 bg-white px-4">
            <td class="flex items-center w-[75%]">{{ songConfig.display_name[element] }}</td>
            <td class="flex items-center w-[15%]">
              <el-button type="danger" size="small">删除该列</el-button>
            </td>
            <td class="flex justify-center items-center w-[10%] column-drag-handle cursor-grab">
              &#x2630;
            </td>
          </tr>
        </Draggable>
      </Container>
    </table>
    <div class="mt-4"> 效果预览： </div>
    <el-table :data="songConfig.songs.slice(0, 5)" stripe>
      <el-table-column v-for="element in songConfig.titles" :prop="element" :key="element">
        <template #header>{{ songConfig.display_name[element] }}</template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>
