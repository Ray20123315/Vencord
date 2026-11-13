/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import "./styles.css";

import { Card } from "@components/Card";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { Link } from "@components/Link";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { getStylusWebStoreUrl } from "@utils/web";
import { React, TabBar, useState } from "@webpack/common";

import { CspErrorCard } from "./CspErrorCard";
import { LocalThemesTab } from "./LocalThemesTab";
import { OnlineThemesTab } from "./OnlineThemesTab";

const enum ThemeTab {
    LOCAL,
    ONLINE
}

function ThemesTab() {
    const [currentTab, setCurrentTab] = useState(ThemeTab.LOCAL);

    return (
        <SettingsTab>
            <TabBar
                type="top"
                look="brand"
                className="vc-settings-tab-bar"
                selectedItem={currentTab}
                onItemSelect={setCurrentTab}
            >
                <TabBar.Item
                    className="vc-settings-tab-bar-item"
                    id={ThemeTab.LOCAL}
                >
                    本機主題
                </TabBar.Item>
                <TabBar.Item
                    className="vc-settings-tab-bar-item"
                    id={ThemeTab.ONLINE}
                >
                    線上主題
                </TabBar.Item>
            </TabBar>

            <Flex flexDirection="column" gap="1em">
                <CspErrorCard />

                <Card variant="warning">
                    <Heading className={Margins.bottom8}>主題效能提醒</Heading>
                    <Paragraph>
                        主題與自訂 CSS 可能造成明顯延遲。如果遇到效能問題，請嘗試
                        停用主題與 CSS，確認是否為問題來源。最常造成延遲的是 <code>:has()</code> 運算子。
                    </Paragraph>
                </Card>

                {currentTab === ThemeTab.LOCAL && <LocalThemesTab />}
                {currentTab === ThemeTab.ONLINE && <OnlineThemesTab />}
            </Flex>
        </SettingsTab>
    );
}

function UserscriptThemesTab() {
    return (
        <SettingsTab>
            <Card variant="danger">
                <Heading className={Margins.bottom8}>Userscript 不支援主題！</Heading>

                <Paragraph>
                    你可以改用 <Link href={getStylusWebStoreUrl()}>Stylus 擴充功能</Link>!
                </Paragraph>
            </Card>
        </SettingsTab>
    );
}

export default IS_USERSCRIPT
    ? wrapTab(UserscriptThemesTab, "主題")
    : wrapTab(ThemesTab, "主題");
