import config from '../config/songlist.ts'

export interface SongInfo {
    id: number
    name: string
    artist: string
    language: string
    alias?: string[]
    tags?: string[]
    remark?: string

    paid?: boolean
    top?: boolean
    sc?: number

    date?: string[]
    links?: string[]
}

type SongConfig = typeof config
export type { SongConfig }
