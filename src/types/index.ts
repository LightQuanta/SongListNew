// TODO　将歌曲信息修改为更通用的格式
export interface SongInfo {
    name: string;
    artist: string;
    language: string;
    tags?: string;

    BVID?: string;
    url?: string;

    // links?: string[];
}
