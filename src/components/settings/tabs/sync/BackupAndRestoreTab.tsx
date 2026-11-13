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

import { downloadSettingsBackup, uploadSettingsBackup } from "@api/SettingsSync/offline";
import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { Text } from "@components/Text";
import { Margins } from "@utils/margins";

function BackupAndRestoreTab() {
    return (
        <SettingsTab>
            <Flex flexDirection="column" gap="0.5em">
                <Card variant="warning">
                    <Heading tag="h4">警告</Heading>
                    <Paragraph>匯入設定檔會覆蓋目前的設定。</Paragraph>
                </Card>

                <Paragraph size="md" className={Margins.bottom8}>
                    你可以將 Vencord 設定匯入或匯出為 JSON 檔案。
                    這樣便能輕鬆將設定移至其他裝置，
                    或在重新安裝 Vencord 或 Discord 後還原設定。
                </Paragraph>

                <Heading tag="h4">匯出的設定包含：</Heading>
                <Text size="md" className={Margins.bottom8}>
                    <ul>
                        <li>&mdash; 自訂 QuickCSS</li>
                        <li>&mdash; 主題連結</li>
                        <li>&mdash; 插件設定</li>
                    </ul>
                </Text>

                <Flex>
                    <Button onClick={() => uploadSettingsBackup()}>
                        匯入設定
                    </Button>
                    <Button onClick={downloadSettingsBackup}>
                        匯出設定
                    </Button>
                </Flex>
            </Flex>
        </SettingsTab >
    );
}

export default wrapTab(BackupAndRestoreTab, "備份與還原");
