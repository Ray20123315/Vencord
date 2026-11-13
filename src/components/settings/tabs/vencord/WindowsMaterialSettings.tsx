/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Heading } from "@components/Heading";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { IS_WINDOWS } from "@utils/constants";
import { Select } from "@webpack/common";

export function WindowsMaterialSettings() {
    const settings = useSettings(["windowsMaterial"]);

    if (!IS_WINDOWS || IS_WEB || !VencordNative.native.supportsWindowsMaterial()) return null;

    return (
        <ErrorBoundary noop>
            <Heading className={Margins.bottom8}>背景材質</Heading>
            <Paragraph className={Margins.bottom8}>
                Windows 透明背景效果。必須使用支援透明效果的主題，否則此設定不會生效。變更後需要重新啟動。
            </Paragraph>

            <Select
                placeholder="無"
                options={[
                    {
                        label: "無",
                        value: "none",
                        default: true
                    },
                    {
                        label: "Mica（結合系統主題與桌布繪製背景）",
                        value: "mica"
                    },
                    {
                        label: "Tabbed（背景染色更明顯的 Mica 變體）",
                        value: "tabbed"
                    },
                    {
                        label: "Acrylic（模糊 Vesktop 後方的視窗以呈現半透明背景）",
                        value: "acrylic"
                    }
                ]}
                closeOnSelect={true}
                select={v => (settings.windowsMaterial = v)}
                isSelected={v => v === settings.windowsMaterial}
                serialize={s => s}
            />
        </ErrorBoundary>
    );
}
