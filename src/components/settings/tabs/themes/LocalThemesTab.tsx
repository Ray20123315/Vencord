/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isPluginEnabled } from "@api/PluginManager";
import { Settings, useSettings } from "@api/Settings";
import { Card } from "@components/Card";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { FolderIcon, PaintbrushIcon, PencilIcon, PlusIcon, RestartIcon } from "@components/Icons";
import { Link } from "@components/Link";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { QuickAction, QuickActionCard } from "@components/settings/QuickAction";
import { openPluginModal } from "@components/settings/tabs/plugins/PluginModal";
import { UserThemeHeader } from "@main/themes";
import ClientThemePlugin from "@plugins/clientTheme";
import { classNameFactory } from "@utils/css";
import { findLazy } from "@webpack";
import { useEffect, useRef, useState } from "@webpack/common";
import type { ComponentType, Ref, SyntheticEvent } from "react";

import { ThemeCard } from "./ThemeCard";

const cl = classNameFactory("vc-settings-theme-");

type FileInput = ComponentType<{
    ref: Ref<HTMLInputElement>;
    onChange: (e: SyntheticEvent<HTMLInputElement>) => void;
    multiple?: boolean;
    filters?: { name?: string; extensions: string[]; }[];
}>;

const FileInput: FileInput = findLazy(m => m.prototype?.activateUploadDialogue && m.prototype.setRef);

// When a local theme is enabled/disabled, update the settings
function onLocalThemeChange(fileName: string, value: boolean) {
    if (value) {
        if (Settings.enabledThemes.includes(fileName)) return;
        Settings.enabledThemes = [...Settings.enabledThemes, fileName];
    } else {
        Settings.enabledThemes = Settings.enabledThemes.filter(f => f !== fileName);
    }
}

async function doUploadThemes(files: ArrayLike<File>) {
    const uploads = Array.from(files, file => {
        const { name } = file;
        if (!name.endsWith(".css")) return;

        return new Promise<void>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                VencordNative.themes.uploadTheme(name, reader.result as string)
                    .then(resolve)
                    .catch(reject);
            };
            reader.readAsText(file);
        });
    });

    await Promise.all(uploads);
}

async function onFileUpload(e: SyntheticEvent<HTMLInputElement>) {
    e.stopPropagation();
    e.preventDefault();

    if (!e.currentTarget?.files?.length) return;
    await doUploadThemes(e.currentTarget.files);
}

function useDropFile(refreshThemes: Function) {
    useEffect(() => {
        const onDragOver = (e: DragEvent) => {
            if (!e.dataTransfer?.items.length) return;
            if (!Array.from(e.dataTransfer.items).some(item => item.kind === "file" && item.getAsFile()?.name.endsWith(".css")))
                return;

            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
        };

        const onDrop = async (e: DragEvent) => {
            e.preventDefault();

            if (!e.dataTransfer?.files.length) return;

            await doUploadThemes(
                Array.from(e.dataTransfer.files).filter(file => file.name.endsWith(".css"))
            );

            refreshThemes();
        };

        window.addEventListener("dragover", onDragOver);
        window.addEventListener("drop", onDrop);

        return () => {
            window.removeEventListener("dragover", onDragOver);
            window.removeEventListener("drop", onDrop);
        };
    }, []);
}

export function LocalThemesTab() {
    const settings = useSettings(["enabledThemes"]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [userThemes, setUserThemes] = useState<UserThemeHeader[] | null>(null);

    useEffect(() => {
        refreshLocalThemes();
    }, []);

    // This condition is compile time so conditional hook is okay
    if (IS_WEB) useDropFile(refreshLocalThemes);

    async function refreshLocalThemes() {
        const themes = await VencordNative.themes.getThemesList();
        setUserThemes(themes);
    }

    return (
        <Flex flexDirection="column" gap="1em">
            <Card>
                <Heading className={Margins.bottom8}>尋找主題：</Heading>
                <Flex gap="0.4em" flexDirection="column" justifyContent="flex-start" className={Margins.bottom8}>
                    <span>&ndash; <Link href="https://betterdiscord.app/themes">BetterDiscord 主題列表</Link></span>
                    <span>&ndash; <Link href="https://github.com/search?q=discord+theme">GitHub</Link></span>
                </Flex>
                <Paragraph>若使用 BetterDiscord 網站，請點選「Download」，再將下載的 .theme.css 檔案放入主題資料夾。</Paragraph>
            </Card>

            <Card>
                <Heading className={Margins.bottom8}>外部資源</Heading>
                <Paragraph>基於安全考量，已封鎖大多數網站的外部資源（樣式、字型、圖片等）。</Paragraph>
                <Paragraph>請確保所有資源都託管於 GitHub、GitLab、Codeberg、Imgur、Discord 或 Google Fonts。</Paragraph>
            </Card>

            <section>
                <Heading className={Margins.bottom8}>本機主題</Heading>
                <QuickActionCard>
                    <>
                        {IS_WEB ?
                            (
                                <QuickAction
                                    text={
                                        <span>
                                            上傳主題
                                            <FileInput
                                                ref={fileInputRef}
                                                onChange={async e => {
                                                    await onFileUpload(e);
                                                    refreshLocalThemes();
                                                }}
                                                multiple={true}
                                                filters={[{ extensions: ["css"] }]}
                                            />
                                        </span>
                                    }
                                    Icon={PlusIcon}
                                    style={{ position: "relative" }}
                                />
                            ) : (
                                <QuickAction
                                    text="開啟主題資料夾"
                                    action={() => VencordNative.themes.openFolder()}
                                    Icon={FolderIcon}
                                />
                            )}
                        <QuickAction
                            text="重新載入遺漏的主題"
                            action={refreshLocalThemes}
                            Icon={RestartIcon}
                        />
                        <QuickAction
                            text="編輯 QuickCSS"
                            action={() => VencordNative.quickCss.openEditor()}
                            Icon={PaintbrushIcon}
                        />

                        {isPluginEnabled(ClientThemePlugin.name) && (
                            <QuickAction
                                text="編輯 ClientTheme"
                                action={() => openPluginModal(ClientThemePlugin)}
                                Icon={PencilIcon}
                            />
                        )}
                    </>
                </QuickActionCard>

                <div className={cl("grid")}>
                    {userThemes?.map(theme => (
                        <ThemeCard
                            key={theme.fileName}
                            enabled={settings.enabledThemes.includes(theme.fileName)}
                            onChange={enabled => onLocalThemeChange(theme.fileName, enabled)}
                            onDelete={async () => {
                                onLocalThemeChange(theme.fileName, false);
                                await VencordNative.themes.deleteTheme(theme.fileName);
                                refreshLocalThemes();
                            }}
                            theme={theme}
                        />
                    ))}
                </div>
            </section>
        </Flex>
    );
}
