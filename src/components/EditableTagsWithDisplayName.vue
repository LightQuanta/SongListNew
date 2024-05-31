<script lang="ts" setup>
import { ElButton, ElInput, ElPopover, ElTag } from 'element-plus';
import { Container, Draggable } from './Draggable';
import { computed, ref } from 'vue'
import type { DropResult } from "smooth-dnd";

const selectedTitles = defineModel<string[]>('selectedKeys', { required: true })
const keyDisplayName = defineModel<Record<string, string>>('displayName', { required: true })

const unSelectedTitles = computed(() => {
  return (Object.keys(keyDisplayName.value).filter((key) => !new Set(selectedTitles.value).has(key)))
})
const showAddTitle = ref(false)

const onDrop = (dropResult: DropResult) => {
  selectedTitles.value = applyDrag(selectedTitles.value, dropResult)
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

</script>

<template>
  <Container :drop="onDrop" class="flex gap-2" drag-handle-selector=".editor-head-drag-item" lock-axis="x"
             orientation="horizontal">
    <transition-group name="tags">
      <Draggable v-for="t in selectedTitles" :key="t">
        <el-popover
            :width="200"
            placement="bottom"
            title="编辑内容"
            trigger="click"
        >
          <el-input
              v-model="keyDisplayName[t]"
              clearable
              placeholder="Please input"
          />
          <template #reference>
            <el-tag class="mx-1 editor-head-drag-item cursor-grab" closable size="large"
                    @close="selectedTitles.splice(selectedTitles.indexOf(t), 1)">
              {{ `${keyDisplayName[t]} (${t})` }}
            </el-tag>
          </template>
        </el-popover>
      </Draggable>
      <el-popover :visible="showAddTitle" :width="150" class="absolute" placement="bottom">
        <template #reference>
          <el-button v-show="unSelectedTitles.length > 0" @click="showAddTitle = !showAddTitle">+</el-button>
        </template>
        <div class="flex flex-col flex-grow">
          <el-button v-for="t in unSelectedTitles" class="!ml-0" text
                     @click="selectedTitles.push(t); showAddTitle = false">
            {{ `${keyDisplayName[t]} (${t})` }}
          </el-button>
        </div>
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