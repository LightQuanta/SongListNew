import { parse as parseToml } from 'smol-toml'
import { readFileSync } from 'fs'
import { z } from 'zod'

enum Titles {
    ID = 'id',
    NAME = 'name',
    ARTIST = 'artist',
    LANGUAGE = 'language',
    ALIAS = 'alias',
    TAGS = 'tags',
    REMARK = 'remark',
    PAID = 'paid',
    TOP = 'top',
    SC = 'sc',
    DATE = 'date',
    LINKS = 'links',
}

const displayName = z.object({
    id: z.string().min(1).default('序号'),
    name: z.string().min(1).default('歌名'),
    artist: z.string().min(1).default('原唱'),
    language: z.string().min(1).default('语种'),
    alias: z.string().min(1).default('歌曲别名'),
    tags: z.string().min(1).default('标签'),
    remark: z.string().min(1).default('备注'),
    paid: z.string().min(1).default('是否付费'),
    top: z.string().min(1).default('是否置顶'),
    sc: z.string().min(1).default('SC'),
    date: z.string().min(1).default('日期'),
    links: z.string().min(1).default('链接'),
})

const songs = z.object({
    id: z.number(),
    name: z.string().min(1),
    artist: z.string().min(1),
    language: z.string().min(1),
    alias: z.string().array().optional(),
    tags: z.string().array().optional(),
    remark: z.string().optional(),
    paid: z.boolean().default(false),
    top: z.boolean().default(false),
    sc: z.number().optional(),
    date: z.string().array().optional(),
    links: z.string().url().array().optional(),
})

// TODO 设计更多配置项
const songConfig = z.object({
    titles: z.nativeEnum(Titles).array(),
    display_name: displayName,
    songs: songs.array(),
})


// TODO 实现用户自定义配置文件读取
const config = songConfig.parse(parseToml(readFileSync('src/config/songlist.toml', 'utf-8')))

export default config
export type { Titles }