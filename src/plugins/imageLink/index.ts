/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "ImageLink",
    description: "即使圖片連結是訊息的唯一內容，也不要隱藏連結。",
    tags: ["Media", "Appearance"],
    authors: [Devs.Kyuuhachi, Devs.Sqaaakoi],

    patches: [
        {
            // small util file
            find: "linkCount:0,onlyLinks:!1",
            replacement: {
                // SimpleEmbedTypes.has(embed.type) && isEmbedInline(embed)
                match: /\i\.has\(\i\.type\)&&\(0,\i\.\i\)\(\i\)/,
                replace: "false",
            }
        }
    ]
});
