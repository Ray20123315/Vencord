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

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { Divider } from "@components/Divider";
import { FormSwitch } from "@components/FormSwitch";
import { Heading } from "@components/Heading";
import { FolderIcon, GithubIcon, LogIcon, PaintbrushIcon, RestartIcon } from "@components/Icons";
import { Paragraph } from "@components/Paragraph";
import { QuickAction, QuickActionCard } from "@components/settings/QuickAction";
import { SpecialCard } from "@components/settings/SpecialCard";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { openContributorModal } from "@components/settings/tabs/plugins/ContributorModal";
import { openPluginModal } from "@components/settings/tabs/plugins/PluginModal";
import NoTrack from "@plugins/_core/noTrack";
import SettingsPlugin from "@plugins/_core/settings";
import { gitRemote } from "@shared/vencordUserAgent";
import { IS_WINDOWS } from "@utils/constants";
import { Margins } from "@utils/margins";
import { isPluginDev } from "@utils/misc";
import { relaunch } from "@utils/native";
import { promptToRestart } from "@utils/promptToRestart";
import { React, useMemo, UserStore } from "@webpack/common";

import { DonateButtonComponent, isDonor } from "./DonateButton";
import { MacOSVibrancySettings } from "./MacVibrancySettings";
import { NotificationSection } from "./NotificationSettings";
import { openPlayground } from "./playground";
import { WindowsMaterialSettings } from "./WindowsMaterialSettings";

const DEFAULT_DONATE_IMAGE = "https://cdn.discordapp.com/emojis/1026533090627174460.png";
const SHIGGY_DONATE_IMAGE = "https://media.discordapp.net/stickers/1039992459209490513.png";
const VENNIE_DONATOR_IMAGE = "https://cdn.discordapp.com/emojis/1238120638020063377.png";
const COZY_CONTRIB_IMAGE = "https://cdn.discordapp.com/emojis/1026533070955872337.png";
const DONOR_BACKGROUND_IMAGE = "https://media.discordapp.net/stickers/1311070116305436712.png?size=2048";
const CONTRIB_BACKGROUND_IMAGE = "https://media.discordapp.net/stickers/1311070166481895484.png?size=2048";

type KeysOfType<Object, Type> = {
    [K in keyof Object]: Object[K] extends Type ? K : never;
}[keyof Object];

function Switches() {
    const settings = useSettings(["useQuickCss", "enableReactDevtools", "frameless", "nativeTitleBar", "transparent", "winCtrlQ", "disableMinSize"]);
    const { disableAnalytics } = NoTrack.settings.use(["disableAnalytics"]);

    const Switches = [
        {
            key: "useQuickCss",
            title: "啟用自訂 CSS",
            description: "套用已設定的 QuickCSS"
        },
        {
            value: disableAnalytics,
            updateSetting(newValue) {
                NoTrack.settings.store.disableAnalytics = newValue;
            },
            reactKey: "NoTrack::disableAnalytics",
            key: null!,
            title: "封鎖 Discord 分析資料收集",
            description: NoTrack.settings.def.disableAnalytics.description,
            restartRequired: NoTrack.settings.def.disableAnalytics.restartNeeded,
        },
        IS_DISCORD_DESKTOP && {
            key: "nativeTitleBar",
            title: "除了 Discord 自訂標題列，也啟用系統標題列",
            restartRequired: true
        },
        !IS_WEB && {
            key: "transparent",
            title: "啟用視窗透明效果",
            description: "必須使用支援透明效果的主題，否則此設定不會生效；啟用後視窗也將無法調整大小",
            restartRequired: true
        },
        IS_DISCORD_DESKTOP && {
            key: "disableMinSize",
            title: "停用視窗最小尺寸限制",
            description: "允許將視窗調整成任意大小，包括小於 Discord 預設的最小尺寸",
            restartRequired: true
        },
        !IS_WEB && IS_WINDOWS && {
            key: "winCtrlQ",
            title: "將 Ctrl+Q 設為關閉 Discord 的快捷鍵（替代 Alt+F4）",
            restartRequired: true
        },
        !IS_WEB && {
            key: "enableReactDevtools",
            title: "啟用 React 開發者工具",
            description: "主要供插件開發者使用；若不清楚用途，可以忽略此選項",
            restartRequired: true
        },
    ] satisfies Array<false | {
        key: KeysOfType<typeof settings, boolean>;
        reactKey?: string;
        title: string;
        description?: string;
        restartRequired?: boolean;
        updateSetting?(newValue: boolean): void;
        value?: boolean;
    }>;

    return Switches.map(setting => {
        if (!setting) {
            return null;
        }

        const { reactKey, key, value, title, description, restartRequired, updateSetting = v => (settings[key] = v) } = setting;

        return (
            <FormSwitch
                key={reactKey ?? key}
                title={title}
                description={description}
                value={value ?? settings[key]}
                hideBorder
                onChange={v => {
                    updateSetting(v);

                    if (restartRequired) {
                        promptToRestart("relaunch");
                    }
                }}
            />
        );
    });
}

function VencordSettings() {
    const donateImage = useMemo(() =>
        Math.random() > 0.5 ? DEFAULT_DONATE_IMAGE : SHIGGY_DONATE_IMAGE,
        []
    );

    const user = UserStore?.getCurrentUser();

    return (
        <SettingsTab>
            {isDonor(user?.id)
                ? (
                    <SpecialCard
                        title="贊助"
                        subtitle="感謝你的贊助！"
                        description="隨時可以傳訊息給 @vending.machine 管理你的贊助者福利。"
                        cardImage={VENNIE_DONATOR_IMAGE}
                        backgroundImage={DONOR_BACKGROUND_IMAGE}
                        backgroundColor="#ED87A9"
                    >
                        <DonateButtonComponent />
                    </SpecialCard>
                )
                : (
                    <SpecialCard
                        title="支持專案"
                        description="歡迎透過贊助支持 Vencord 的開發！"
                        cardImage={donateImage}
                        backgroundImage={DONOR_BACKGROUND_IMAGE}
                        backgroundColor="#c3a3ce"
                    >
                        <DonateButtonComponent />
                    </SpecialCard>
                )
            }

            {isPluginDev(user?.id) && (
                <SpecialCard
                    title="貢獻紀錄"
                    subtitle="感謝你的貢獻！"
                    description="感謝你為 Vencord 做出貢獻！你已獲得專屬徽章。"
                    cardImage={COZY_CONTRIB_IMAGE}
                    backgroundImage={CONTRIB_BACKGROUND_IMAGE}
                    backgroundColor="#EDCC87"
                    buttonTitle="查看你的貢獻"
                    buttonOnClick={() => openContributorModal(user)}
                />
            )}

            <section>
                <Heading className={Margins.bottom8}>快速操作</Heading>

                <QuickActionCard>
                    <QuickAction
                        Icon={LogIcon}
                        text="通知紀錄"
                        action={openNotificationLogModal}
                    />
                    <QuickAction
                        Icon={PaintbrushIcon}
                        text="編輯 QuickCSS"
                        action={() => VencordNative.quickCss.openEditor()}
                    />
                    {!IS_WEB && (
                        <>
                            <QuickAction
                                Icon={RestartIcon}
                                text="重新啟動 Discord"
                                action={relaunch}
                            />
                            <QuickAction
                                Icon={FolderIcon}
                                text="開啟設定資料夾"
                                action={() => VencordNative.settings.openFolder()}
                            />
                        </>
                    )}
                    <QuickAction
                        Icon={GithubIcon}
                        text="檢視原始碼"
                        action={() => VencordNative.native.openExternal("https://github.com/" + gitRemote)}
                    />
                    {IS_DEV && <QuickAction
                        Icon={PaintbrushIcon}
                        text="開啟元件測試區"
                        action={() => openPlayground()}
                    />}
                </QuickActionCard>
            </section>

            <Divider />

            <section className={Margins.top16}>
                <Heading className={Margins.bottom8}>設定</Heading>
                <Paragraph className={Margins.bottom20} style={{ color: "var(--text-muted)" }}>
                    提示：你可以在{" "}
                    <a onClick={() => openPluginModal(SettingsPlugin)}>
                        「Settings」插件的設定
                    </a>中調整這個設定區塊的位置！
                </Paragraph>

                <div className="vc-settings-switches">
                    <Switches />
                </div>
            </section>


            <MacOSVibrancySettings />
            <WindowsMaterialSettings />

            <NotificationSection />
        </SettingsTab>
    );
}

export default wrapTab(VencordSettings, "Vencord 設定");
