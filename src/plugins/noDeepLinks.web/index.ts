/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "DisableDeepLinks",
    description: "停用 Discord 強制導向桌面應用程式的深層連結功能。",
    tags: ["Utility"],
    authors: [Devs.Ven],
    required: true,

    noop: () => { },

    patches: [{
        find: /\.openNativeAppModal\(.{0,50}?\.DEEP_LINK/,
        replacement: {
            match: /\i\.\i\.openNativeAppModal/,
            replace: "$self.noop",
        }
    }]
});
