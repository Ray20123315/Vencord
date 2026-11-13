/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    defaultLayout: {
        type: OptionType.SELECT,
        options: [
            { label: "清單", value: 1, default: true },
            { label: "圖庫", value: 2 }
        ],
        description: "預設使用的版面配置"
    },
    defaultSortOrder: {
        type: OptionType.SELECT,
        options: [
            { label: "最近活躍", value: 0, default: true },
            { label: "發文日期", value: 1 }
        ],
        description: "預設使用的排序方式"
    }
});

export default definePlugin({
    name: "OverrideForumDefaults",
    description: "自訂論壇頻道的預設版面與排序方式，也能針對各頻道另外調整。",
    tags: ["Servers", "Organisation", "Customisation"],
    authors: [Devs.Inbestigator],
    patches: [
        {
            find: "getDefaultLayout(){",
            replacement: [
                {
                    match: /}getDefaultLayout\(\){/,
                    replace: "$&return $self.getLayout();"
                },
                {
                    match: /}getDefaultSortOrder\(\){/,
                    replace: "$&return $self.getSortOrder();"
                }
            ]
        }
    ],

    getLayout: () => settings.store.defaultLayout,
    getSortOrder: () => settings.store.defaultSortOrder,

    settings
});
