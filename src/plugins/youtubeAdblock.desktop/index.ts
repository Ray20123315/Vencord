/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

// The entire code of this plugin can be found in native.ts
export default definePlugin({
    name: "YoutubeAdblock",
    description: "透過 AdGuard 封鎖 YouTube 嵌入影片及 WatchTogether 活動中的廣告。",
    tags: ["Media", "Utility"],
    authors: [Devs.ImLvna, Devs.Ven],
});
