/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "FixYoutubeEmbeds",
    description: "繞過 YouTube 影片在 Discord 中遭封鎖顯示的限制（例如 UMG 限制）。",
    tags: ["Media", "Utility"],
    authors: [Devs.coolelectronics]
});
