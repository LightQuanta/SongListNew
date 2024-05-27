<template>
    <button class="p-5 border" @click="open()">上传xlsx</button>
    <div v-if="loading">LOADING</div>
    <button class="p-5 border" @click="exportToml()" v-if="songs.length > 0">导出toml格式歌单信息</button>
    <table class="flex items-stretch flex-col">
        <thead>
            <tr class="flex content-center">
                <th class="flex-1">歌名</th>
                <th class="flex-1">原唱</th>
                <th class="flex-1">语言</th>
                <th class="flex-1">标签</th>
                <th class="flex-1">BVID</th>
                <th class="flex-1">URL</th>
            </tr>
        </thead>
        <tbody>
            <tr class="flex content-center justify-center text-center" v-for="s in songs" :key="s.name">
                <td class="flex-1">{{ s.name }}</td>
                <td class="flex-1">{{ s.artist }}</td>
                <td class="flex-1">{{ s.language }}</td>
                <td class="flex-1">{{ s.tags }}</td>
                <td class="flex-1">{{ s.BVID }}</td>
                <td class="flex-1">{{ s.url }}</td>
            </tr>
        </tbody>
    </table>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useFileDialog } from '@vueuse/core'
import Excel from "exceljs";
import { stringify as toToml } from 'smol-toml'

// TODO　将歌曲信息修改为更通用的格式
interface SongInfo {
    name: string;
    artist: string;
    language: string;
    tags?: string;
    BVID?: string;
    url?: string;
}

const { open, onChange } = useFileDialog({
    multiple: false,
    accept: '.xlsx',
})
const loading = ref(false)

onChange(async (files) => {
    if (files === null) return
    const file = files[0]
    loading.value = true

    const reader = new FileReader()
    reader.onload = async e => {
        const buffer = e.target?.result as ArrayBuffer

        const workbook = new Excel.Workbook()
        await workbook.xlsx.load(new Uint8Array(buffer))

        const worksheet1 = workbook.worksheets[0]
        songs.value = worksheet1.getRows(2, worksheet1.rowCount)?.map(
            (row) => {
                const song: SongInfo = {
                    name: row.getCell(1).text,
                    artist: row.getCell(2).text,
                    language: row.getCell(3).text,
                };
                row.getCell(4).text.trim() !== '' && (song.tags = row.getCell(4).text);
                row.getCell(5).text.trim() !== '' && (song.BVID = row.getCell(5).text);
                row.getCell(6).text.trim() !== '' && (song.url = row.getCell(6).text);
                return song
            }
        ).filter(s => s.name.trim() !== '') ?? []
        loading.value = false
    }
    reader.readAsArrayBuffer(file)
})

const exportToml = () => {
    const toml = toToml({ songs: songs.value })
    const blob = new Blob([toml], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'songs.toml'
    a.click()
}

const songs = ref<SongInfo[]>([])

</script>