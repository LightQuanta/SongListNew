import { parse as parseToml } from 'smol-toml'
import { readFileSync } from 'fs'
import { z } from 'zod'

// TODO 设计更多配置项
const websiteConfig = z.object({
    title: z.string().min(1),
    enable_editor: z.boolean().default(true),
})

const links = z.object({
    name: z.string().min(1),
    icon: z.string().optional(),
    link: z.string().url(),
})

const vaildator = z.object({
    website: websiteConfig,
    links: links.array().optional(),
})

// TODO 实现用户自定义配置文件读取
const config = vaildator.parse(parseToml(readFileSync('src/config/default.toml', 'utf-8')))

export default config