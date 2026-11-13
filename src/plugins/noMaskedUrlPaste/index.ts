/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants.js";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "NoMaskedUrlPaste",
    authors: [Devs.CatNoir],
    description: "選取文字時貼上連結，不會自動將選取內容轉成隱藏網址的連結。",
    tags: ["Chat", "Utility"],
    patches: [
        {
            find: ".selection,preventEmojiSurrogates:",
            replacement: {
                match: /if\(null!=\i.selection&&\i.\i.isExpanded\(\i.selection\)\)/,
                replace: "if(false)"
            }
        }
    ],
});
