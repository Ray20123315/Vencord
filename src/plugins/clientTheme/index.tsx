/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./clientTheme.css";

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType, StartAt } from "@utils/types";

import { ResetThemeColorComponent, ThemeSettingsComponent } from "./components/Settings";
import { disableClientTheme, startClientTheme } from "./utils/styleUtils";

export const settings = definePluginSettings({
    color: {
        type: OptionType.COMPONENT,
        default: "313338",
        component: ThemeSettingsComponent
    },
    resetColor: {
        type: OptionType.COMPONENT,
        component: ResetThemeColorComponent
    }
});

export default definePlugin({
    name: "ClientTheme",
    authors: [Devs.Nuckyz],
    description: "重現舊版客戶端主題實驗功能，為 Discord 客戶端設定主題色彩。",
    tags: ["Appearance", "Customisation"],
    settings,

    startAt: StartAt.DOMContentLoaded,
    start: () => startClientTheme(settings.store.color),
    stop: disableClientTheme
});
