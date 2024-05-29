import { SongInfo as zSongInfo, SongConfig as zSongConfig } from '../config/songlist.ts'
import { WebsiteConfig as zWebsiteConfig } from '../config/config.ts'
import { z } from 'zod'

type SongInfo = z.infer<typeof zSongInfo>
type SongConfig = z.infer<typeof zSongConfig>
type WebsiteConfig = z.infer<typeof zWebsiteConfig>

export type {
    SongInfo,
    SongConfig,
    WebsiteConfig
}