<script lang="ts" setup>
import { ElDialog, ElRadioGroup, ElInput, ElButton, ElTable, ElTableColumn, ElCheckbox } from 'element-plus';
import { computed, reactive, ref, watch } from 'vue';
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

const selectedColumn = ref(Object.keys(props.titleAndDesc).map((key) => ({
  key,
  name: key,
  enable: true
})))

const editFlag = ref(Object.fromEntries(Object.keys(props.titleAndDesc).map((key) => [key, false])))

watch(songConfig, (value) => {
  selectedColumn.value = selectedColumn.value.map((item) => ({
    key: item.key,
    // @ts-expect-error: key is in titles key
    name: value.display_name[item.key] || item.key,
    // @ts-expect-error: key is in titles key
    enable: value.titles.includes(item.key)
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
  const titles = selectedColumn.value.filter((item) => item.enable).map((item) => item.key)
  const display_name = Object.fromEntries(selectedColumn.value.map((item) => [item.key, item.name]))
  emit('onUpdateColumn', { ...songConfig.value, titles, display_name })
}

// drop trigger
const onDrop = (dropResult: DropResult) => {
  selectedColumn.value = applyDrag(selectedColumn.value, dropResult)
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
          <th scope="col" class="text-left w-[15%]">展示该列</th>
          <th scope="col" class="w-[10%]">拖拽排序</th>
        </tr>
      </thead>
      <Container :drop="onDrop" tag="tbody" drag-handle-selector=".column-drag-handle">
        <Draggable v-for="item in selectedColumn" :key="item.key">
          <tr class="flex border-b-2 py-2 bg-white px-4">
            <td class="flex items-center w-[75%]" @dblclick="editFlag[item.key] = true">
              <template v-if="editFlag[item.key]">
                <el-input v-model="item.name" />
                <el-button class="ml-2" @click="editFlag[item.key] = false" size="small" type="danger">重置</el-button>
                <el-button class="ml-2" @click="editFlag[item.key] = false" size="small" type="primary">保存</el-button>
              </template>
              <template v-else>
                {{ item.name }}
              </template>
            </td>
            <td class="flex items-center w-[15%]">
              <el-checkbox v-model="item.enable"></el-checkbox>
            </td>
            <td class="flex justify-center items-center w-[10%] column-drag-handle cursor-grab">
              &#x2630;
            </td>
          </tr>
        </Draggable>
      </Container>
    </table>
    <div class="mt-4"> 效果预览： </div>
    <el-table :data="songConfig.songs" stripe>
      <el-table-column v-for="element in selectedColumn.filter((item) => item.enable)" :prop="element.key"
        :key="element.key">
        <template #header>{{ element.name }}</template>
      </el-table-column>
    </el-table>
  </el-dialog>
</template>
