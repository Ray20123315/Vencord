/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import type { Channel, Emoji } from "@vencord/discord-types";

const settings = definePluginSettings({
    shownEmojis: {
        description: "自動完成選單中要顯示的表情符號類型。",
        type: OptionType.SELECT,
        default: "onlyUnicode",
        options: [
            { label: "僅顯示 Unicode 表情符號", value: "onlyUnicode" },
            { label: "Unicode 表情符號及目前伺服器的表情符號", value: "currentServer" },
            { label: "Unicode 表情符號及所有伺服器表情符號（Discord 預設）", value: "all" }
        ]
    }
});

export default definePlugin({
    name: "NoServerEmojis",
    authors: [Devs.UlyssesZhan],
    description: "不要在自動完成選單中顯示伺服器表情符號。",
    tags: ["Emotes", "Servers"],
    settings,

    patches: [
        {
            find: "}searchWithoutFetchingLatest(",
            replacement: {
                match: /\.nameMatchesChain\(\i\)\.reduce\(\((\i),(\i)\)=>\{(?<=channel:(\i).+?)/,
                replace: "$&if($self.shouldSkip($3,$2))return $1;"
            }
        }
    ],

    shouldSkip(channel: Channel | undefined | null, emoji: Emoji) {
        if (emoji.type !== 1) {
            return false;
        }

        if (settings.store.shownEmojis === "onlyUnicode") {
            return true;
        }

        if (settings.store.shownEmojis === "currentServer") {
            return emoji.guildId !== (channel != null ? channel.getGuildId() : null);
        }

        return false;
    }
});
