/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useSettings } from "@api/Settings";
import { Card } from "@components/Card";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { TextArea, useState } from "@webpack/common";

export function OnlineThemesTab() {
    const settings = useSettings(["themeLinks"]);

    const [themeText, setThemeText] = useState(settings.themeLinks.join("\n"));

    // When the user leaves the online theme textbox, update the settings
    function onBlur() {
        settings.themeLinks = [...new Set(
            themeText
                .trim()
                .split(/\n+/)
                .map(s => s.trim())
                .filter(Boolean)
        )];
    }

    return (
        <Flex flexDirection="column" gap="1em">
            <Card variant="warning" defaultPadding>
                <Paragraph>
                    This section is for advanced users. If you are having difficulties using it, use the
                    Local Themes tab instead.
                </Paragraph>
            </Card>
            <Card>
                <Heading className={Margins.bottom8}>在這裡貼上 CSS 檔案連結</Heading>
                <Paragraph>每行一個連結</Paragraph>
                <Paragraph>可在每行開頭加上 @light 或 @dark，依 Discord 的主題模式切換</Paragraph>
                <Paragraph>請使用檔案的直接連結（raw 或 github.io）！</Paragraph>
            </Card>

            <section>
                <Heading className={Margins.bottom8}>線上主題</Heading>
                <TextArea
                    value={themeText}
                    onChange={setThemeText}
                    className={"vc-settings-theme-links"}
                    placeholder="輸入主題連結…"
                    spellCheck={false}
                    onBlur={onBlur}
                    rows={10}
                />
            </section>
        </Flex>
    );
}
