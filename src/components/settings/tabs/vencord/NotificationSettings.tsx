/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { ErrorCard } from "@components/ErrorCard";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { Margins } from "@utils/margins";
import { identity } from "@utils/misc";
import { Modal, openModal, Select, Slider } from "@webpack/common";

export function NotificationSection() {
    return (
        <section className={Margins.top16}>
            <Heading className={Margins.bottom8}>通知</Heading>
            <Paragraph className={Margins.bottom8}>
                Vencord 通知的相關設定。
                不包含 Discord 本身的通知（訊息等）。
            </Paragraph>
            <Flex>
                <Button onClick={openNotificationSettingsModal}>
                    通知設定
                </Button>
                <Button onClick={openNotificationLogModal}>
                    檢視通知紀錄
                </Button>
            </Flex>
        </section>
    );
}

export function openNotificationSettingsModal() {
    openModal(props => (
        <Modal
            {...props}
            size="lg"
            title="通知設定"
        >
            <NotificationSettings />
        </Modal>
    ));
}

function NotificationSettings() {
    const settings = useSettings(["notifications.*"]).notifications;

    return (
        <>
            <Heading className={Margins.bottom8}>通知樣式</Heading>
            {settings.useNative !== "never" && Notification?.permission === "denied" && (
                <ErrorCard style={{ padding: "1em" }} className={Margins.bottom8}>
                    <Heading className={Margins.bottom8}>桌面通知權限遭拒</Heading>
                    <Paragraph>你已拒絕通知權限，因此桌面通知無法運作！</Paragraph>
                </ErrorCard>
            )}
            <Paragraph className={Margins.bottom8}>
                部分插件可能顯示通知，通知分為兩種類型：
                <ul>
                    <li><strong>Vencord 通知</strong>: 這些是程式內通知</li>
                    <li><strong>桌面通知</strong>: 系統原生桌面通知（例如收到提及時）</li>
                </ul>
            </Paragraph>
            <Select
                placeholder="通知樣式"
                options={[
                    { label: "僅在 Discord 視窗未取得焦點時使用桌面通知", value: "not-focused", default: true },
                    { label: "一律使用桌面通知", value: "always" },
                    { label: "一律使用 Vencord 通知", value: "never" },
                ] satisfies Array<{ value: typeof settings["useNative"]; } & Record<string, any>>}
                closeOnSelect={true}
                select={v => settings.useNative = v}
                isSelected={v => v === settings.useNative}
                serialize={identity}
            />

            <Heading className={Margins.top16 + " " + Margins.bottom8}>通知位置</Heading>
            <Select
                isDisabled={settings.useNative === "always"}
                placeholder="通知位置"
                options={[
                    { label: "右下角", value: "bottom-right", default: true },
                    { label: "右上角", value: "top-right" },
                ] satisfies Array<{ value: typeof settings["position"]; } & Record<string, any>>}
                select={v => settings.position = v}
                isSelected={v => v === settings.position}
                serialize={identity}
            />

            <Heading className={Margins.top16 + " " + Margins.bottom8}>通知顯示時間</Heading>
            <Paragraph className={Margins.bottom16}>設為 0 秒即可讓通知不自動消失</Paragraph>
            <Slider
                disabled={settings.useNative === "always"}
                markers={[0, 1000, 2500, 5000, 10_000, 20_000]}
                minValue={0}
                maxValue={20_000}
                initialValue={settings.timeout}
                onValueChange={v => settings.timeout = v}
                onValueRender={v => (v / 1000).toFixed(2) + "s"}
                onMarkerRender={v => (v / 1000) + "s"}
                stickToMarkers={false}
            />

            <Heading className={Margins.top16 + " " + Margins.bottom8}>通知紀錄上限</Heading>
            <Paragraph className={Margins.bottom16}>
                設定通知紀錄保留的數量，超出後將移除較舊的通知。
                設為 <code>0</code> 可停用通知紀錄；設為 <code>∞</code> 則永不自動移除舊通知
            </Paragraph>
            <Slider
                markers={[0, 25, 50, 75, 100, 200]}
                minValue={0}
                maxValue={200}
                stickToMarkers={true}
                initialValue={settings.logLimit}
                onValueChange={v => settings.logLimit = v}
                onValueRender={v => v === 200 ? "∞" : v}
                onMarkerRender={v => v === 200 ? "∞" : v}
            />
        </>
    );
}
