<script setup lang="ts">
import { ElButton, ElPopover, ElTag } from 'element-plus';
import { Container, Draggable } from './Draggable';
import { ref, computed, watch } from 'vue'
import type { DropResult } from "smooth-dnd";

interface KeyAndDisplayName {
  key: string
  name: string
}

const props = defineProps<{
  selectedKeys: string[]
  keysInfo?: KeyAndDisplayName[]
  allKeys?: string[]
  contentEditable?: boolean
}>()

const getDisplayName = (key: string) => {
  if (!props.keysInfo) return key
  const item = props.keysInfo.find((item) => item.key === key)
  if (!item) return key
  return item.name
}

const selectedTitles = ref([...new Set(props.selectedKeys)])
const hasAllKeys = ref((props.allKeys?.length ?? 0) > 0)
const unSelectedTitles = computed(() => {
  if (!props.allKeys) return []
  return (props.allKeys.filter((key) => !new Set(selectedTitles.value).has(key)))
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

// TODO 实现keyNameChanged编辑事件
const emit = defineEmits(['selectedKeysChanged', 'keyNameChanged'])

watch(selectedTitles, (value) => {
  emit('selectedKeysChanged', value)
}, { deep: true })

</script>

<template>
  <Container class="flex gap-2" orientation="horizontal" :drop="onDrop" lock-axis="x"
             drag-handle-selector=".editor-head-drag-item">
    <transition-group name="tags">
      <Draggable v-for="t in selectedTitles" :key="t">
        <!-- TODO 实现文本内容编辑 -->
        <el-tag closable size="large" class="mx-1 editor-head-drag-item cursor-grab"
                @close="selectedTitles.splice(selectedTitles.indexOf(t), 1)">
          {{ getDisplayName(t) }}
        </el-tag>
      </Draggable>
      <!-- TODO 实现文本内容添加，实现按钮动画 -->
      <el-popover class="absolute" v-if="hasAllKeys" placement="bottom" :width="150" :visible="showAddTitle">
        <template #reference>
          <el-button v-show="unSelectedTitles.length > 0" @click="showAddTitle = !showAddTitle">
            + 添加
          </el-button>
        </template>
        <div class="flex flex-col flex-grow">
          <el-button text class="!ml-0" v-for="t in unSelectedTitles"
                     @click="selectedTitles.push(t); showAddTitle = false">
            {{ getDisplayName(t) }}
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