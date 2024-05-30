import { parse as parseToml } from 'smol-toml'
import { readFileSync } from 'fs'
import { z } from 'zod'

interface KeysInfo {
    default: string
    description: string
}

const SongInfoKeys: Record<keyof z.infer<typeof SongInfo>, KeysInfo> = {
    id: {
        default: '序号',
        description: '歌曲序号',
    },
    name: {
        default: '歌名',
        description: '歌名',
    },
    artist: {
        default: '原唱',
        description: '原唱',
    },
    language: {
        default: '语言',
        description: '语言',
    },
    alias: {
        default: '别名',
        description: '歌曲别名',
    },
    tags: {
        default: '标签',
        description: '歌曲标签（可填写多个，用逗号或分号分隔）',
    },
    remark: {
        default: '备注',
        description: '歌曲备注',
    },
    paid: {
        default: '付费',
        description: '是否为付费歌曲',
    },
    top: {
        default: '置顶',
        description: '是否为置顶歌曲',
    },
    sc: {
        default: 'SC',
        description: '点歌需要该列标注金额的sc',
    },
    links: {
        default: '链接',
        description: '完整链接（如歌切等）',
    },
    date: {
        default: '日期',
        description: '该曲唱过的日期（可填写多个，用逗号或分号分隔）',
    },
}

const DisplayName = z.object({
    id: z.string().min(1).default(SongInfoKeys.id.default),
    name: z.string().min(1).default(SongInfoKeys.name.default),
    artist: z.string().min(1).default(SongInfoKeys.artist.default),
    language: z.string().min(1).default(SongInfoKeys.language.default),
    alias: z.string().min(1).default(SongInfoKeys.alias.default),
    tags: z.string().min(1).default(SongInfoKeys.tags.default),
    remark: z.string().min(1).default(SongInfoKeys.remark.default),
    paid: z.string().min(1).default(SongInfoKeys.paid.default),
    top: z.string().min(1).default(SongInfoKeys.top.default),
    sc: z.string().min(1).default(SongInfoKeys.sc.default),
    date: z.string().min(1).default(SongInfoKeys.date.default),
    links: z.string().min(1).default(SongInfoKeys.links.default),
})

const SongInfo = z.object({
    id: z.number(),
    name: z.string().min(1),
    artist: z.string().min(1),
    language: z.string().min(1),
    alias: z.string().array().optional(),
    tags: z.string().array().optional(),
    remark: z.string().optional(),
    paid: z.boolean().default(false).optional(),
    top: z.boolean().default(false).optional(),
    sc: z.number().optional(),
    date: z.string().array().optional(),
    links: z.string().url().array().optional(),
})

const SongConfig = z.object({
    titles: SongInfo.keyof().array(),
    display_name: DisplayName,
    songs: SongInfo.array(),
})

// TODO 实现用户自定义配置文件读取
const config = SongConfig.parse(parseToml(readFileSync('src/config/default/songlist.toml', 'utf-8')))

export default config
export { SongInfo, SongInfoKeys, SongConfig }