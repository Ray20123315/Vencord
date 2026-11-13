/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Heading } from "@components/Heading";
import { IS_MAC } from "@utils/constants";
import { Margins } from "@utils/margins";
import { identity } from "@utils/misc";
import { Select } from "@webpack/common";

export function MacOSVibrancySettings() {
    const settings = useSettings(["macosVibrancyStyle"]);

    if (!IS_MAC || IS_WEB) return null;

    return (
        <ErrorBoundary noop>
            <Heading className={Margins.bottom8}>macOS 視窗毛玻璃效果（需要重新啟動）</Heading>
            <Select
                className={Margins.bottom20}
                placeholder="視窗毛玻璃樣式"
                options={[
                    // Sorted from most opaque to most transparent
                    {
                        label: "停用毛玻璃效果", value: undefined
                    },
                    {
                        label: "頁面下方（視窗染色）",
                        value: "under-page"
                    },
                    {
                        label: "內容",
                        value: "content"
                    },
                    {
                        label: "視窗",
                        value: "window"
                    },
                    {
                        label: "選取範圍",
                        value: "selection"
                    },
                    {
                        label: "標題列",
                        value: "titlebar"
                    },
                    {
                        label: "頁首",
                        value: "header"
                    },
                    {
                        label: "側邊欄",
                        value: "sidebar"
                    },
                    {
                        label: "工具提示",
                        value: "tooltip"
                    },
                    {
                        label: "選單",
                        value: "menu"
                    },
                    {
                        label: "彈出視窗",
                        value: "popover"
                    },
                    {
                        label: "全螢幕介面（透明但稍微降低亮度）",
                        value: "fullscreen-ui"
                    },
                    {
                        label: "HUD（透明度最高）",
                        value: "hud"
                    },
                ]}
                select={v => settings.macosVibrancyStyle = v}
                isSelected={v => settings.macosVibrancyStyle === v}
                serialize={identity}
            />
        </ErrorBoundary>
    );
}
