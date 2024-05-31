<script setup lang="ts">
import { ElButton, ElInput, ElPopover, ElTag } from 'element-plus';
import { Container, Draggable } from './Draggable';
import { ref } from 'vue'
import type { DropResult } from "smooth-dnd";

const tags = defineModel<string[]>()

if (tags.value == undefined) {
  tags.value = []
}

const onDrop = (dropResult: DropResult) => {
  tags.value = applyDrag(tags.value ?? [], dropResult)
}

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
const newText = ref<string>('')

const inputNewText = () => {
  if (newText.value?.trim() === '') return
  const text = newText.value.trim()

  tags.value = Array.from(
    new Set([...(tags.value || []), text])
  )

  newText.value = ''
}

const removeTag = (index: number) => {
  tags.value!.splice(index, 1)
  if (tags.value!.length === 0) tags.value = undefined
}

</script>

<template>
  <Container class="flex gap-2" orientation="horizontal" :drop="onDrop" lock-axis="x"
    drag-handle-selector=".editor-head-drag-item">
    <transition-group name="tags">
      <Draggable v-for="(t, index) in tags">
        <el-popover :width="200" placement="bottom" title="编辑内容" trigger="click">
          <el-input v-model="tags![index]" clearable placeholder="请输入新名称" />
          <template #reference>
            <el-tag class="mx-1 editor-head-drag-item cursor-grab" closable size="large" @close="removeTag(index)">
              {{ t }}
            </el-tag>
          </template>
        </el-popover>
      </Draggable>
      <!-- TODO 实现按钮动画 -->
      <el-popover :width="200" class="absolute" placement="bottom" trigger="click">
        <el-input v-model="newText" clearable placeholder="输入新标签名称" />
        <el-button class="w-full mt-2" type="primary" @click="inputNewText">添加</el-button>
        <template #reference>
          <el-button>+</el-button>
        </template>
      </el-popover>
    </transition-group>
  </Container>
</template>

<style scoped>
.tags-move,
.tags-enter-active,
.tags-leave-active {
  transition: all .5s ease;
}

.tags-enter-from,
.tags-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

.tags-leave-active {
  position: absolute;
}
</style>