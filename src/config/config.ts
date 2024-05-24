import { parse } from 'smol-toml'
import { readFileSync } from 'fs'

// TODO 设计更多配置项
interface Config {
    website: WebsiteConfig
    links?: SocialLink[]
}

interface WebsiteConfig {
    title: string
    enable_editor: boolean
}

interface SocialLink {
    name: string
    icon: string
    link: string
}

// TODO 实现用户自定义配置文件读取
const config = parse(readFileSync('src/config/default.toml', 'utf-8')) as unknown as Config
export default config