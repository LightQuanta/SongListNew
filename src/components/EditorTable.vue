<template>
    <el-row class="m-4">
        <el-button class="p-5 border" @click="open()" type="primary">上传xlsx</el-button>
        <el-button class="p-5 border" @click="exportToml()" v-if="songs.length > 0">导出toml格式歌单信息</el-button>
        <el-button class="p-5 border" @click="columnEditor.openDialog(props.config)">
            打开歌单表头编辑器
        </el-button>
    </el-row>
    <table class="flex items-stretch flex-col w-full" v-loading="loading">
        <thead>
            <tr class="flex content-center sticky top-0">
                <th class="flex-1" v-for="t in config.titles">
                    {{ config.display_name[t] }}
                </th>
            </tr>
        </thead>
        <tbody>
            <tr class="flex content-center justify-center text-center" v-for="s in songs" :key="s.name">
                <td class="flex-1" v-for="t in config.titles" :key="t">
                    {{ s[t] }}
                </td>
            </tr>
        </tbody>
    </table>
    <el-dialog v-model="showDialog" title="选择每列类型" center align-center modal :close-on-click-modal="false"
        :close-on-press-escape="false" :show-close="false">
        <el-table :data="rowTitleData" stripe class=" text-center">
            <el-table-column property="id" label="列号" width="100" />
            <el-table-column property="name" label="名称" width="150" />
            <el-table-column property="dataType" label="类型">
                <template #default="scope">
                    <el-select v-model="rowTitleData[scope.$index].dataType">
                        <el-option v-for="key in Object.keys(titleTypesAndDesc)" :value="key"
                            :label="titleTypesAndDesc[key]"
                            :disabled="key != rowTitleData[scope.$index].dataType && selectedRows.includes(key)">
                        </el-option>
                    </el-select>
                </template>
            </el-table-column>
        </el-table>
        <el-row class="mt-3" justify="end">
            <el-button @click="showDialog = false; waitForDialog?.(false)">取消</el-button>
            <el-button @click="verifyTypes" type="primary">确定</el-button>
        </el-row>
    </el-dialog>
    <edit-column ref="columnEditor" :title-and-desc="titleTypesAndDesc" />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useFileDialog } from '@vueuse/core'
import Excel from "exceljs";
import { stringify as toToml } from 'smol-toml'
import type { SongInfo, SongConfig } from '../types'
import EditColumn from './EditorTable/EditColumn.vue'

import 'element-plus/dist/index.css'
import { ElDialog, ElButton, ElTable, ElTableColumn, ElSelect, ElOption, ElMessage, ElRow, ElLoading, ElMessageBox } from 'element-plus'

const props = defineProps<{
    config: SongConfig
}>()

const columnEditor = ref()

const { open: openFileDialog, onChange } = useFileDialog({
    multiple: false,
    accept: '.xlsx',
})
const loading = ref(false)
let waitForDialog = ref<(value: boolean) => void>()

const open = () => {
    if (songs.value.length > 0) {
        ElMessageBox.confirm('导入歌单将会覆盖当前歌单内容，是否继续导入', '警告', {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
            center: true,
        }).then(() => {
            openFileDialog()
        })
    } else {
        openFileDialog()
    }
}

// todo!: 临时增加的全局遮罩，table完成后删除
let loadingService: any
watch(loading, (value) => {
    if (!value) {
        loadingService?.close()
    }
    else {
        loadingService = ElLoading.service({
            lock: true,
            text: 'Loading',
            background: 'rgba(0, 0, 0, 0.7)',
            fullscreen: true,
        })
    }
})

type DataType = keyof SongInfo | 'BVID' | 'neteaseRadio' | 'ignore'

type ExcelTitleInfo = {
    id: number,
    name: string,
    dataType: DataType,
}

const titleTypesAndDesc: Record<string, string> = {
    'ignore': '忽略该列内容',
    'id': '歌曲序号',
    'name': '歌名',
    'artist': '原唱',
    'language': '语言',
    'alias': '歌曲别名',
    'tags': '歌曲标签（可填写多个，用逗号或分号分隔）',
    'remark': '歌曲备注',
    'paid': '是否为付费歌曲',
    'top': '是否为置顶歌曲',
    'sc': '点歌需要该列标注金额的sc',
    'BVID': '歌切BV号（可填写多个，用逗号或分号分隔）',
    'links': '完整链接（如歌切等）',
    'date': '该曲唱过的日期（可填写多个，用逗号或分号分隔）',
    'neteaseRadio': '网易云播客ID',
}

const showDialog = ref(false)
const rowTitleData = ref<ExcelTitleInfo[]>([])
const selectedRows = computed(() => rowTitleData.value.map(r => r.dataType.toString()).filter(t => t !== 'ignore'))

const verifyTypes = () => {
    const set = new Set(rowTitleData.value.map(d => d.dataType))
    if (set.has('name') && set.has('artist') && set.has('language')) {
        waitForDialog.value?.(true)
        loading.value = false
        showDialog.value = false
    } else {
        ElMessage.error('至少需要选择歌名、原唱和语言！')
    }
}

// 文件成功上传
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
        rowTitleData.value = []

        // 尝试推断首行定义
        worksheet1.getRow(1).eachCell((c, index) => {
            const text = c.toString().trim().toLowerCase()
            if (text === '') return

            const titleInfo: ExcelTitleInfo = {
                id: index,
                name: text,
                dataType: 'ignore'
            }

            if (text === '序号' || text === 'id') {
                titleInfo.dataType = 'id'
            } else if (text === '歌名' || text === '名称') {
                titleInfo.dataType = 'name'
            } else if (text.includes('翻译')) {
                titleInfo.dataType = 'alias'
            } else if (text.includes('原唱') || text.includes('歌手')) {
                titleInfo.dataType = 'artist'
            } else if (text === '语言' || text === '语种') {
                titleInfo.dataType = 'language'
            } else if (text === '标签' || text === '分类' || text === '类别' || text === '备注') {
                titleInfo.dataType = 'tags'
            } else if (text.includes('歌切') || text.includes('bv')) {
                titleInfo.dataType = 'BVID'
            } else if (text.includes('网易云播客') || text.includes('网易云电台')) {
                titleInfo.dataType = 'neteaseRadio'
            } else if (text.includes('日期')) {
                titleInfo.dataType = 'date'
            } else if (text.includes('置顶')) {
                titleInfo.dataType = 'top'
            } else if (text.includes('付费')) {
                titleInfo.dataType = 'paid'
            } else if (text.includes('sc')) {
                titleInfo.dataType = 'sc'
            }
            rowTitleData.value.push(titleInfo)
        })

        // 让用户选择首行定义
        showDialog.value = true
        const result = new Promise<boolean>((resolve) => {
            waitForDialog.value = resolve
        })

        // 如果对话框中点击取消则退出
        if (!await result) {
            loading.value = false
            return
        }

        // 处理剩余内容
        songs.value = worksheet1.getRows(2, worksheet1.rowCount)?.map(
            (row, index) => {
                const song: SongInfo = {
                    id: -1,
                    name: '',
                    artist: '',
                    language: ''
                }
                let hasId = false
                // 按照首行定义处理每一列
                for (let i = 0; i < row.cellCount; i++) {
                    if (rowTitleData.value[i] !== undefined) {
                        const text = row.getCell(i + 1).toString().trim()
                        if (text === '') continue
                        switch (rowTitleData.value[i].dataType) {
                            case 'id': song.id = parseInt(text); hasId = true; break;
                            case 'name': song.name = text; break;
                            case 'artist': song.artist = text; break;
                            case 'alias': song.alias?.push(text) ?? (song.alias = [text]); break;
                            case 'language': song.language = text; break;
                            case 'remark': song.remark = text; break;
                            case 'tags': {
                                const tags = text.replaceAll('，', ',')
                                    .replaceAll('；', ';')
                                    .replaceAll(';', ',')
                                    .split(',')
                                    .map(t => t.trim())
                                song.tags?.push(...tags) ?? (song.tags = tags);
                                break;
                            }
                            case 'BVID': {
                                const bvs = text.replaceAll('，', ',')
                                    .replaceAll('；', ';')
                                    .replaceAll(';', ',')
                                    .split(',')
                                    .map(v => `https://www.bilibili.com/video/${v.trim()}`)

                                song.links?.push(...bvs) ?? (song.links = bvs);
                                break;
                            }
                            case 'neteaseRadio': song.links?.push(`https://music.163.com/#/dj?id=${text}`) ?? (song.links = [`https://music.163.com/#/dj?id=${text}`]); break;
                            case 'date': {
                                const date = text.replaceAll('，', ',')
                                    .replaceAll('；', ';')
                                    .replaceAll(';', ',')
                                    .split(',')
                                    .map(d => d.trim())
                                song.date?.push(...date) ?? (song.date = date);
                                break;
                            }
                            case 'top': if (text === '1') song.top = true; break;
                            case 'paid': if (text === '1') song.paid = true; break;
                            case 'sc': song.sc = +text; break;
                            case 'links': song.links?.push(text) ?? (song.links = [text]); break;
                        }
                    }
                }
                // 未定义ID列则使用自增index
                if (!hasId) song.id = index + 1
                return song
            }
        ).filter(s => s.name.trim() !== '') ?? []

        // 默认启用上传的表格中指定的列
        props.config.titles = [...new Set(rowTitleData.value.filter(t => t.dataType !== 'ignore')
            .sort((a, b) => a.id - b.id)
            .map(t => t.dataType)
            .map(t => {
                if (t === 'BVID' || t === 'neteaseRadio') {
                    return 'links'
                }
                return t
            }))] as (keyof SongInfo)[]

        loading.value = false
        ElMessage.success('导入成功')
    }
    reader.readAsArrayBuffer(file)
})

// 将歌单导出为toml配置文件
const exportToml = () => {
    const toml = toToml({
        titles: props.config.titles,
        display_name: props.config.display_name,
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