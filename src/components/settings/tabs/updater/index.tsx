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

import { useSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { Divider } from "@components/Divider";
import { Flex } from "@components/Flex";
import { FormSwitch } from "@components/FormSwitch";
import { Heading } from "@components/Heading";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { useAwaiter } from "@utils/react";
import { getRepo, isNewer, UpdateLogger } from "@utils/updater";
import { React } from "@webpack/common";

import gitHash from "~git-hash";

import { CommonProps, HashLink, Newer, Updatable } from "./Components";

function VesktopSection() {
    if (!IS_VESKTOP) return null;

    const [isVesktopOutdated] = useAwaiter<boolean>(VesktopNative.app.isOutdated, { fallbackValue: false });

    return (
        <Flex className={Margins.bottom20} flexDirection="column" gap="1em">
            <Card variant="info">
                <Heading className={Margins.bottom8}>Vesktop & Vencord</Heading>
                <Paragraph>Vesktop 與 Vencord 是不同的程式。這個更新工具僅用於更新 Vencord。</Paragraph>
                <Paragraph className={Margins.top8}>
                    Vesktop 更新時會另外顯示通知。你也可以安裝 <Link href="https://vesktop.dev/install">最新版本</Link>.
                </Paragraph>
            </Card>

            {isVesktopOutdated && (
                <Card variant="warning">
                    <Heading className={Margins.bottom8}>Vesktop 版本過舊</Heading>
                    <Flex flexDirection="column" gap="0.5em">
                        <Paragraph>你的 Vesktop 版本已過舊！</Paragraph>
                        <Button variant="link" onClick={() => VesktopNative.app.openUpdater()}>開啟 Vesktop 更新工具</Button>
                    </Flex>
                </Card>
            )}
        </Flex>
    );
}

function Updater() {
    const settings = useSettings(["autoUpdate", "autoUpdateNotification"]);

    const [repo, err, repoPending] = useAwaiter(getRepo, {
        fallbackValue: "載入中…",
        onError: e => UpdateLogger.error("Failed to retrieve repo", err)
    });

    const commonProps: CommonProps = {
        repo,
        repoPending
    };

    return (
        <SettingsTab>
            <VesktopSection />

            <div className="vc-settings-switches">
                <FormSwitch
                    title="自動更新"
                    description="不經確認提示，自動更新 Vencord"
                    value={settings.autoUpdate}
                    onChange={(v: boolean) => settings.autoUpdate = v}
                    hideBorder
                />
                <FormSwitch
                    title="自動更新完成時通知我"
                    description="Vencord 自動更新完成後顯示通知"
                    value={settings.autoUpdateNotification}
                    onChange={(v: boolean) => settings.autoUpdateNotification = v}
                    disabled={!settings.autoUpdate}
                    hideBorder
                />
            </div>

            <Heading className={classes(Margins.top20, Margins.bottom8)}>儲存庫</Heading>

            <Paragraph>
                {repoPending
                    ? repo
                    : err
                        ? "取得失敗，請查看主控台"
                        : (
                            <Link href={repo}>
                                {repo.split("/").slice(-2).join("/")}
                            </Link>
                        )
                }
                {" "}
                (<HashLink hash={gitHash} repo={repo} disabled={repoPending} />)
            </Paragraph>

            <Divider className={classes(Margins.top16, Margins.bottom16)} />

            <Heading className={Margins.bottom8}>更新</Heading>

            {isNewer
                ? <Newer {...commonProps} />
                : <Updatable {...commonProps} />
            }
        </SettingsTab>
    );
}

export default IS_UPDATER_DISABLED
    ? null
    : wrapTab(Updater, "更新工具");
