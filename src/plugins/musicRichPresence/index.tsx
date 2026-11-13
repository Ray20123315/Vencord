/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Sofia Lima
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { definePluginSettings, migratePluginSetting, migratePluginSettings } from "@api/Settings";
import { Button, LinkButton } from "@components/Button";
import { Card } from "@components/Card";
import { Heading } from "@components/Heading";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { Devs } from "@utils/constants";
import { promptToRestart } from "@utils/promptToRestart";
import { useAwaiter, useForceUpdater } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";
import { Activity, ActivityAssets, ActivityButton } from "@vencord/discord-types";
import { ActivityFlags, ActivityStatusDisplayType, ActivityType } from "@vencord/discord-types/enums";
import { ApplicationAssetUtils, AuthenticationStore, FluxDispatcher, PresenceStore } from "@webpack/common";

import { LastFMScrobbler } from "./lastfm";
import { invalidateListenBrainzCache, ListenBrainzScrobbler } from "./listenbrainz";

export interface TrackData {
    name: string;
    album: string;
    artist: string;
    trackURL?: string;
    artistURL?: string;
    albumURL?: string;
    imageURL?: string;
    serviceName?: string;
}

export interface ScrobblerBackend {
    name: string,
    id: string,

    fetchTrackData(): Promise<TrackData | null>;
    getUserURL(username: string): string;
}

const enum NameFormat {
    StatusName = "status-name",
    ArtistFirst = "artist-first",
    SongFirst = "song-first",
    ArtistOnly = "artist",
    SongOnly = "song",
    AlbumName = "album",
    ServiceName = "service-name"
}

const DISCORD_APP_ID = "1108588077900898414";
const LASTFM_PLACEHOLDER_IMAGE_HASH = "2a96cbd8b46e442fc41c2b86b821562f";

async function getApplicationAsset(key: string): Promise<string> {
    return (await ApplicationAssetUtils.fetchAssetIds(DISCORD_APP_ID, [key]))[0];
}

function setActivity(activity: Activity | null) {
    FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        activity,
        socketId: "LastFM",
    });
}

export const settings = definePluginSettings({
    scrobblerBackend: {
        description: "要使用的播放紀錄服務。",
        type: OptionType.SELECT,
        options: [
            {
                "label": "Last.FM",
                "value": "lastfm",
                "default": true
            },
            {
                "label": "ListenBrainz",
                "value": "listenbrainz"
            },
            {
                "label": "ListenBrainz Compatible (self-hosted)",
                "value": "listenbrainz-compatible"
            }
        ] as const
    },
    instanceBaseURL: {
        description: "ListenBrainz 執行個體的基底網址。",
        type: OptionType.STRING,
        placeholder: "https://example.org",
        onChange: invalidateListenBrainzCache
    },
    instanceAPIBaseUrl: {
        description: "ListenBrainz API 的基底網址。",
        type: OptionType.STRING,
        placeholder: "https://api.example.org",
        onChange: invalidateListenBrainzCache
    },
    apiKey: {
        displayName: "API Key",
        description: "Last.fm API 金鑰。非必填，但強烈建議設定，避免共用金鑰受到速率限制",
        type: OptionType.STRING,
    },
    username: {
        description: "使用者名稱",
        type: OptionType.STRING,
    },
    shareUsername: {
        description: "顯示播放紀錄服務個人資料連結",
        type: OptionType.BOOLEAN,
        default: false,
    },
    clickableLinks: {
        description: "讓歌曲、演出者及專輯名稱可點選以開啟連結",
        type: OptionType.BOOLEAN,
        default: true,
    },
    hideWithSpotify: {
        description: "Spotify 執行時隱藏活動狀態",
        type: OptionType.BOOLEAN,
        default: true,
    },
    hideWithActivity: {
        description: "有其他活動狀態時隱藏此活動狀態",
        type: OptionType.BOOLEAN,
        default: false,
    },
    statusName: {
        description: "自訂狀態文字。可使用下列變數：{artist} | {album} | {title}",
        type: OptionType.STRING,
        default: "some music",
    },
    statusDisplayType: {
        description: "在成員清單顯示歌曲／演出者名稱",
        type: OptionType.SELECT,
        options: [
            {
                label: "不顯示（改用一般聆聽訊息）",
                value: "off"
            },
            {
                label: "顯示演出者名稱",
                value: "artist",
                default: true
            },
            {
                label: "顯示歌曲名稱",
                value: "track"
            }
        ]
    },
    nameFormat: {
        description: "在狀態名稱中顯示歌曲與演出者名稱",
        type: OptionType.SELECT,
        options: [
            {
                label: "使用自訂狀態名稱",
                value: NameFormat.StatusName,
                default: true
            },
            {
                label: "使用音樂服務名稱（無法取得時使用自訂狀態文字）",
                value: NameFormat.ServiceName
            },
            {
                label: "使用『演出者 - 歌曲』格式",
                value: NameFormat.ArtistFirst
            },
            {
                label: "使用『歌曲 - 演出者』格式",
                value: NameFormat.SongFirst
            },
            {
                label: "僅使用演出者名稱",
                value: NameFormat.ArtistOnly
            },
            {
                label: "僅使用歌曲名稱",
                value: NameFormat.SongOnly
            },
            {
                label: "使用專輯名稱（歌曲沒有專輯時改用自訂狀態文字）",
                value: NameFormat.AlbumName
            }
        ],
    },
    useListeningStatus: {
        description: '使用「正在聆聽」狀態，而不是「正在遊玩」',
        type: OptionType.BOOLEAN,
        default: false,
    },
    missingArt: {
        description: "沒有專輯資訊或封面時",
        type: OptionType.SELECT,
        options: [
            {
                label: "顯示大型播放紀錄服務標誌",
                value: "logo",
                default: true
            },
            {
                label: "使用一般預設圖片",
                value: "placeholder"
            }
        ],
    },
    showLogo: {
        displayName: "Show Scrobbler Logo",
        description: "在專輯封面旁顯示播放紀錄服務標誌",
        type: OptionType.BOOLEAN,
        default: true,
    },
    showAlbumCover: {
        description: "顯示專輯封面。停用後改顯示預設圖片，適用於封面包含不適當內容的情況",
        type: OptionType.BOOLEAN,
        default: true,
    }
}, {
    apiKey: { hidden() { return this.store.scrobblerBackend !== "lastfm"; } },
    instanceBaseURL: { hidden() { return this.store.scrobblerBackend !== "listenbrainz-compatible"; } },
    instanceAPIBaseUrl: { hidden() { return this.store.scrobblerBackend !== "listenbrainz-compatible"; } },
});

const hasInvalidCustomInstance = () => settings.store.scrobblerBackend === "listenbrainz-compatible" && (!settings.store.instanceAPIBaseUrl || !settings.store.instanceBaseURL);

function CustomInstanceAboutComponent() {
    const { instanceAPIBaseUrl, instanceBaseURL } = settings.store;

    const [signal, forceUpdate] = useForceUpdater(true);

    const [cspAllowed] = useAwaiter(async () => {
        if (!instanceAPIBaseUrl || !instanceBaseURL) return true;
        return await VencordNative.csp.isDomainAllowed(instanceAPIBaseUrl, ["connect-src"]) && await VencordNative.csp.isDomainAllowed(instanceBaseURL, ["connect-src"]);
    }, { fallbackValue: true, deps: [instanceAPIBaseUrl, instanceBaseURL, signal] });

    if (!instanceAPIBaseUrl || !instanceBaseURL)
        return (
            <Card variant="danger">
                <Heading className={Margins.bottom8}>無效的 ListenBrainz 相容執行個體</Heading>
                <Paragraph>請提供自訂 ListenBrainz 執行個體的 <b>API 基底網址</b> 和 <b>執行個體基底網址</b>，或切換回 ListenBrainz／Last.fm</Paragraph>
            </Card>
        );

    if (!cspAllowed)
        return (
            <Card variant="warning">
                <Heading className={Margins.bottom8}>允許 Vencord 連線至 ListenBrainz 執行個體</Heading>
                <Paragraph>使用自訂 ListenBrainz 執行個體前，必須先允許 Vencord 連線。</Paragraph>
                <Button
                    size="small"
                    className={Margins.top8}
                    variant="secondary"
                    onClick={async () => {
                        for (const host of [instanceAPIBaseUrl, instanceBaseURL]) {
                            const res = await VencordNative.csp.requestAddOverride(host, ["connect-src"], "MusicRichPresence");
                            if (!res) return;
                        }
                        forceUpdate();
                        promptToRestart("relaunch");
                    }}
                >
                    Allow Instance
                </Button>
            </Card>
        );

    return null;
}

migratePluginSettings("MusicRichPresence", "LastFMRichPresence");
migratePluginSetting("MusicRichPresence", "showLastFmLogo", "showLogo");
export default definePlugin({
    name: "MusicRichPresence",
    description: "為 Last.fm／ListenBrainz 顯示 Rich Presence 活動狀態。",
    tags: ["Activity", "Media"],
    searchTerms: ["lastfm", "LastFMRichPresence"],
    authors: [Devs.Rini, Devs.Ven, Devs.angelcube, Devs.RuiNtD, Devs.blahajZip, Devs.archeruwu],

    settings,

    settingsAboutComponent() {
        if (settings.store.scrobblerBackend === "lastfm")
            return (
                <Card>
                    <Heading tag="h4" className={Margins.bottom20}>Last.FM</Heading>
                    <Heading className={Margins.bottom8}>如何建立 API 金鑰</Heading>
                    <Paragraph>自行填寫<strong>應用程式名稱</strong>與<strong>應用程式說明</strong>，其餘欄位保持空白。</Paragraph>
                    <LinkButton size="small" href="https://www.last.fm/api/account/create" className={Margins.top8}>建立 API 金鑰</LinkButton>
                </Card>
            );

        if (settings.store.scrobblerBackend === "listenbrainz-compatible")
            return <CustomInstanceAboutComponent />;

        return null;
    },

    start() {
        this.updatePresence();
        this.updateInterval = setInterval(() => { this.updatePresence(); }, 16000);
    },

    stop() {
        clearInterval(this.updateInterval);
    },

    async updatePresence() {
        const { username } = settings.store;

        if (!username) return;
        if (hasInvalidCustomInstance()) return;

        setActivity(await this.getActivity());
    },

    getLargeImage(track: TrackData): string | undefined {
        if (settings.store.showAlbumCover && track.imageURL && !track.imageURL.includes(LASTFM_PLACEHOLDER_IMAGE_HASH))
            return track.imageURL;

        if (settings.store.missingArt === "placeholder")
            return "placeholder";
    },

    async getActivity(): Promise<Activity | null> {

        if (settings.store.hideWithActivity) {
            if (PresenceStore.getActivities(AuthenticationStore.getId()).some(a => a.application_id !== DISCORD_APP_ID && a.type !== ActivityType.CUSTOM_STATUS)) {
                return null;
            }
        }

        if (settings.store.hideWithSpotify) {
            if (PresenceStore.getActivities(AuthenticationStore.getId()).some(a => a.type === ActivityType.LISTENING && a.application_id !== DISCORD_APP_ID)) {
                // there is already music status because of Spotify or richerCider (probably more)
                return null;
            }
        }

        const scrobbler = settings.store.scrobblerBackend === "lastfm" ? LastFMScrobbler : ListenBrainzScrobbler;

        const trackData = await scrobbler.fetchTrackData();
        if (!trackData) return null;

        const largeImage = this.getLargeImage(trackData);
        const assets: ActivityAssets = largeImage ?
            {
                large_image: await getApplicationAsset(largeImage),
                large_text: trackData.album || undefined,
                ...(settings.store.showLogo && {
                    small_image: await getApplicationAsset(`${scrobbler.id}-small`),
                    small_text: scrobbler.id
                }),
            } : {
                large_image: await getApplicationAsset(`${scrobbler.id}-large`),
                large_text: trackData.album || undefined,
            };

        const buttons: ActivityButton[] = [];

        if (settings.store.shareUsername) {
            buttons.push({
                label: `${scrobbler.name} Profile`,
                url: scrobbler.getUserURL(settings.store.username!)
            });
        }

        const statusName = (() => {
            switch (settings.store.nameFormat) {
                case NameFormat.ArtistFirst:
                    return trackData.artist + " - " + trackData.name;
                case NameFormat.SongFirst:
                    return trackData.name + " - " + trackData.artist;
                case NameFormat.ArtistOnly:
                    return trackData.artist;
                case NameFormat.SongOnly:
                    return trackData.name;
                case NameFormat.AlbumName:
                    return trackData.album || settings.store.statusName
                        .replaceAll("{artist}", trackData.artist || "")
                        .replaceAll("{album}", trackData.album || "")
                        .replaceAll("{title}", trackData.name || "");
                case NameFormat.ServiceName:
                    return trackData.serviceName || settings.store.statusName
                        .replaceAll("{artist}", trackData.artist || "")
                        .replaceAll("{album}", trackData.album || "")
                        .replaceAll("{title}", trackData.name || "");
                default:
                    return settings.store.statusName
                        .replaceAll("{artist}", trackData.artist || "")
                        .replaceAll("{album}", trackData.album || "")
                        .replaceAll("{title}", trackData.name || "");
            }
        })();

        const activity: Activity = {
            application_id: DISCORD_APP_ID,
            name: statusName,

            details: trackData.name,
            state: trackData.artist,
            status_display_type: {
                "off": ActivityStatusDisplayType.NAME,
                "artist": ActivityStatusDisplayType.STATE,
                "track": ActivityStatusDisplayType.DETAILS
            }[settings.store.statusDisplayType],

            assets,

            buttons: buttons.length ? buttons.map(v => v.label) : undefined,
            metadata: {
                button_urls: buttons.map(v => v.url),
            },

            type: settings.store.useListeningStatus ? ActivityType.LISTENING : ActivityType.PLAYING,
            flags: ActivityFlags.INSTANCE,
        };

        if (settings.store.clickableLinks) {
            activity.details_url = trackData.trackURL;
            activity.state_url = trackData.artistURL;

            if (trackData.album) {
                activity.assets!.large_url = trackData.albumURL;
            }
        }

        return activity;
    }
});
