/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
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

import { definePluginSettings } from "@api/Settings";
import { disableStyle, enableStyle } from "@api/Styles";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

import hoverOnlyStyle from "./hoverOnly.css?managed";
import { Player } from "./PlayerComponent";

export const settings = definePluginSettings({
    hoverControls: {
        description: "滑鼠移至上方時顯示控制按鈕",
        type: OptionType.BOOLEAN,
        default: false,
        onChange: v => toggleHoverControls(v)
    },
    useSpotifyUris: {
        type: OptionType.BOOLEAN,
        description: "使用 Spotify URI 而非 Spotify 網址開啟連結。必須已安裝 Spotify，且部分平台可能不支援",
        default: false
    },
    previousButtonRestartsTrack: {
        type: OptionType.BOOLEAN,
        description: "目前歌曲已播放超過 3 秒時，按上一首會從頭播放目前歌曲",
        default: true
    }
});

function toggleHoverControls(value: boolean) {
    (value ? enableStyle : disableStyle)(hoverOnlyStyle);
}

export default definePlugin({
    name: "SpotifyControls",
    description: "在帳號面板上方新增 Spotify 播放控制器。",
    tags: ["Media", "Activity"],
    authors: [Devs.Ven, Devs.afn, Devs.KraXen72, Devs.Av32000, Devs.nin0dev],
    settings,
    patches: [
        {
            find: "#{intl::USER_PROFILE_ACCOUNT_POPOUT_BUTTON_A11Y_LABEL}",
            replacement: {
                // react.jsx)(AccountPanel, { ..., showTaglessAccountPanel: blah })
                match: /(?<=\i\.jsxs?\)\()(\i),{(?=[^}]*?userTag:\i,occluded:)/,
                // react.jsx(WrapperComponent, { VencordOriginal: AccountPanel, ...
                replace: "$self.PanelWrapper,{VencordOriginal:$1,"
            }
        },
        {
            find: ".PLAYER_DEVICES",
            replacement: [{
                // Adds POST and a Marker to the SpotifyAPI (so we can easily find it)
                match: /get:(\i)\.bind\(null,(\i\.\i)\.get\)/,
                replace: "post:$1.bind(null,$2.post),vcSpotifyMarker:1,$&"
            },
            {
                // Spotify Connect API returns status 202 instead of 204 when skipping tracks.
                // Discord rejects 202 which causes the request to send twice. This patch prevents this.
                match: /202===\i\.status/,
                replace: "false",
            }]
        },
        {
            find: 'repeat:"off"!==',
            replacement: [
                {
                    // Discord doesn't give you shuffle state and the repeat kind, only a boolean
                    match: /repeat:"off"!==(\i),/,
                    replace: "shuffle:arguments[2]?.shuffle_state??false,actual_repeat:$1,$&"
                },
                {
                    match: /(?<=artists.filter\(\i=>).{0,10}\i\.id\)&&/,
                    replace: ""
                }
            ]
        },
    ],

    start: () => toggleHoverControls(settings.store.hoverControls),

    PanelWrapper({ VencordOriginal, ...props }) {
        return (
            <>
                <ErrorBoundary
                    fallback={() => (
                        <div className="vc-spotify-fallback">
                            <p>無法顯示 Spotify 視窗</p>
                            <p >請查看主控台的錯誤訊息</p>
                        </div>
                    )}
                >
                    <Player />
                </ErrorBoundary>

                <VencordOriginal {...props} />
            </>
        );
    }
});
