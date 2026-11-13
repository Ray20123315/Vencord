/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const ImageExtensionRe = /\.(png|jpg|jpeg|gif|webp|avif)$/i;
const GifHostRegex = /^(.+?\.)?(tenor|giphy|imgur)\.com$/i;

const settings = definePluginSettings({
    showFullUrl: {
        description: "顯示圖片完整網址，而不只顯示檔名。GIF 通常沒有具辨識性的檔名，因此一律啟用。",
        type: OptionType.BOOLEAN,
        default: false,
    },
});

export default definePlugin({
    name: "ImageFilename",
    authors: [Devs.Ven],
    description: "將滑鼠移至圖片或 GIF 上時，以工具提示顯示檔名。",
    tags: ["Media", "Utility"],
    settings,

    patches: [
        {
            find: ".RESPONSIVE?",
            replacement: {
                match: /(?="data-role":"img","data-safe-src":)(?<=href:(\i).+?)/,
                replace: "title:$self.getTitle($1),"
            }
        },
    ],

    getTitle(src: string) {
        try {
            const url = new URL(src);
            const isGif = GifHostRegex.test(url.hostname);
            if (!isGif && !ImageExtensionRe.test(url.pathname)) return undefined;

            return isGif || settings.store.showFullUrl
                ? src
                : url.pathname.split("/").pop();
        } catch {
            return undefined;
        }
    }
});
