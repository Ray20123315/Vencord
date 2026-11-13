/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "MutedServersActivityBadge",
    description: "即使伺服器已靜音，也保留活動徽章。",
    authors: [Devs.NiNoX],
    tags: ["Servers", "Appearance", "Activity", "Voice"],

    patches: [
        {
            find: '"GuildMediaStateStore"',
            replacement: {
                match: /=\i\.\i\.isMuted\(\i\)/,
                replace: "=false"
            }
        }
    ]
});
