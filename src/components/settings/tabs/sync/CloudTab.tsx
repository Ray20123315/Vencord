/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
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
import { authorizeCloud, deauthorizeCloud } from "@api/SettingsSync/cloudSetup";
import { deleteCloudSettings, eraseAllCloudData, getCloudSettings, getCloudSyncDirection, putCloudSettings, setCloudSyncDirection } from "@api/SettingsSync/cloudSync";
import { Button, ButtonProps } from "@components/Button";
import { CheckedTextInput } from "@components/CheckedTextInput";
import { Divider } from "@components/Divider";
import { Flex } from "@components/Flex";
import { FormSwitch } from "@components/FormSwitch";
import { Grid } from "@components/Grid";
import { Heading } from "@components/Heading";
import { CloudDownloadIcon, CloudUploadIcon, DeleteIcon, RestartIcon } from "@components/Icons";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { confirmAction } from "@utils/discord";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { IconComponent } from "@utils/types";
import { Select, Tooltip, useState } from "@webpack/common";

function validateUrl(url: string) {
    try {
        new URL(url);
        return true;
    } catch {
        return "無效的網址";
    }
}

const SectionHeading = ({ text }: { text: string; }) => (
    <Heading tag="h3" className={Margins.bottom16}>
        {text}
    </Heading>
);

function ButtonWithIcon({ children, Icon, className, ...buttonProps }: ButtonProps & { Icon: IconComponent; }) {
    return (
        <Button {...buttonProps} className={classes("vc-cloud-icon-with-button", className)}>
            <Icon className={"vc-cloud-button-icon"} />
            {children}
        </Button>
    );
}

function CloudSetupSection() {
    const { cloud } = useSettings(["cloud.authenticated", "cloud.url"]);

    return (
        <section>
            <SectionHeading text="雲端整合" />

            <Paragraph size="md" className={Margins.bottom20}>
                Vencord 提供雲端整合功能，包含跨裝置同步設定等實用功能。
                It <Link href="https://vencord.dev/cloud/privacy">尊重你的隱私</Link>, and
                the <Link href="https://github.com/Vencord/Backend">原始碼</Link> 採用 AGPL 3.0 授權，你
                也可以自行架設服務。
            </Paragraph>
            <FormSwitch
                key="backend"
                title="啟用雲端整合"
                description="如果尚未設定雲端整合，啟用時會要求授權。"
                value={cloud.authenticated}
                onChange={v => {
                    if (v)
                        authorizeCloud();
                    else
                        cloud.authenticated = v;
                }}
            />
            <Heading className={classes(Margins.top16, Margins.bottom8)}>後端服務網址</Heading>
            <Paragraph className={Margins.bottom8}>
                指定雲端整合功能使用的後端服務。
            </Paragraph>
            <CheckedTextInput
                key="backendUrl"
                initialValue={cloud.url}
                onChange={async v => {
                    cloud.url = v;
                    cloud.authenticated = false;
                    deauthorizeCloud();
                }}
                validate={validateUrl}
            />

            <Grid columns={1} gap="1em" className={Margins.top8}>
                <ButtonWithIcon
                    variant="primary"
                    disabled={!cloud.authenticated}
                    onClick={async () => {
                        await deauthorizeCloud();
                        cloud.authenticated = false;
                        await authorizeCloud();
                    }}
                    Icon={RestartIcon}
                >
                    重新授權
                </ButtonWithIcon>
            </Grid>
        </section>
    );
}

function SettingsSyncSection() {
    const { cloud } = useSettings(["cloud.authenticated", "cloud.settingsSync"]);
    const [syncDirection, setSyncDirection] = useState(getCloudSyncDirection);
    const sectionEnabled = cloud.authenticated && cloud.settingsSync;

    return (
        <section>
            <SectionHeading text="設定同步" />
            <Flex flexDirection="column" gap="1em">
                <FormSwitch
                    key="cloud-sync"
                    title="啟用設定同步"
                    description="將 Vencord 設定儲存到雲端，方便在所有裝置保持一致"
                    value={cloud.settingsSync}
                    onChange={v => { cloud.settingsSync = v; }}
                    disabled={!cloud.authenticated}
                    hideBorder
                />

                <div>
                    <Heading className={Margins.bottom8}>
                        此裝置的同步規則
                    </Heading>
                    <Paragraph className={Margins.bottom8}>
                        此設定決定<strong>這台裝置</strong>與雲端之間的同步方式。
                        你可以選擇雙向同步，也可以指定其中一方為主要設定來源。
                    </Paragraph>
                    <Select
                        options={[
                            {
                                label: "雙向同步（雙方的變更都會同步）",
                                value: "both",
                                default: true,
                            },
                            {
                                label: "以此裝置為準（僅上傳）",
                                value: "push",
                            },
                            {
                                label: "以雲端為準（僅下載）",
                                value: "pull",
                            },
                            {
                                label: "不自動同步（僅透過下方按鈕手動同步）",
                                value: "manual",
                            }
                        ]}
                        isSelected={v => v === syncDirection}
                        serialize={v => String(v)}
                        select={v => {
                            setCloudSyncDirection(v);
                            setSyncDirection(v);
                        }}
                        closeOnSelect={true}
                    />
                </div>

                <Grid columns={2} gap="1em" className={Margins.top20}>
                    <ButtonWithIcon
                        variant="positive"
                        disabled={!sectionEnabled}
                        onClick={() => putCloudSettings(true)}
                        Icon={CloudUploadIcon}
                    >
                        上傳設定
                    </ButtonWithIcon>
                    <Tooltip text="這會以雲端儲存的設定覆蓋目前設定，請小心操作！">
                        {({ onMouseLeave, onMouseEnter }) => (
                            <ButtonWithIcon
                                variant="dangerPrimary"
                                onMouseLeave={onMouseLeave}
                                onMouseEnter={onMouseEnter}
                                disabled={!sectionEnabled}
                                onClick={() => getCloudSettings(true, true)}
                                Icon={CloudDownloadIcon}
                            >
                                下載設定
                            </ButtonWithIcon>
                        )}
                    </Tooltip>
                </Grid>
            </Flex>
        </section>
    );
}

function ResetSection() {
    const { authenticated, settingsSync } = useSettings(["cloud.authenticated", "cloud.settingsSync"]).cloud;

    return (
        <section>
            <SectionHeading text="重設雲端資料" />

            <Grid columns={2} gap="1em">
                <ButtonWithIcon
                    variant="dangerPrimary"
                    disabled={!authenticated || !settingsSync}
                    onClick={() => deleteCloudSettings()}
                    Icon={DeleteIcon}
                >
                    刪除雲端設定
                </ButtonWithIcon>
                <ButtonWithIcon
                    variant="dangerPrimary"
                    disabled={!authenticated}
                    onClick={() =>
                        confirmAction({
                            title: "確定要繼續嗎？",
                            subtitle: "資料刪除後無法復原，請確認！",
                            confirmText: "確認刪除",
                            cancelText: "取消",
                            onConfirm: eraseAllCloudData,
                        })
                    }
                    Icon={DeleteIcon}
                >
                    刪除雲端帳號
                </ButtonWithIcon>
            </Grid>
        </section>
    );
}

function CloudTab() {
    return (
        <SettingsTab>
            <Flex flexDirection="column" gap="1em">
                <CloudSetupSection />
                <Divider />
                <SettingsSyncSection />
                <Divider />
                <ResetSection />
            </Flex>
        </SettingsTab>
    );
}

export default wrapTab(CloudTab, "雲端");
