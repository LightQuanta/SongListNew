<template>
    <table class="flex items-stretch flex-col">
        <thead>
            <tr class="flex content-center">
                <th class="flex-1">歌名</th>
                <th class="flex-1">原唱</th>
                <th class="flex-1">语言</th>
                <th class="flex-1">标签</th>
                <th class="flex-1">links</th>
            </tr>
        </thead>
        <tbody>
            <tr class="flex content-center justify-center text-center" v-for="s in songs" :key="s.name">
                <td class="flex-1">{{ s.name }}</td>
                <td class="flex-1">{{ s.artist }}</td>
                <td class="flex-1">{{ s.language }}</td>
                <td class="flex-1">{{ s.tags }}</td>
                <td class="flex-1">{{ s.links }}</td>
            </tr>
        </tbody>
    </table>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { SongInfo } from '../types'

const songs = ref<SongInfo[]>([])

defineProps<{
    songs: SongInfo[],
}>()

</script>