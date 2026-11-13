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

import * as DataStore from "@api/DataStore";
import { isPluginEnabled } from "@api/PluginManager";
import { useSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { Divider } from "@components/Divider";
import ErrorBoundary from "@components/ErrorBoundary";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { ChangeList } from "@utils/ChangeList";
import { classNameFactory } from "@utils/css";
import { isTruthy } from "@utils/guards";
import { Logger } from "@utils/Logger";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { PluginTarget } from "@utils/pluginTargets";
import { promptToRestart } from "@utils/promptToRestart";
import { useAwaiter, useCleanupEffect } from "@utils/react";
import { PluginTag, PluginTags } from "@utils/types";
import { lodash, React, SearchableSelect, Select, TextInput, Tooltip, useMemo, useRef, useState } from "@webpack/common";
import { JSX } from "react";

import Plugins, { ExcludedPlugins, PluginMeta } from "~plugins";

import { PluginCard } from "./PluginCard";
import { UIElementsButton } from "./UIElements";

export const cl = classNameFactory("vc-plugins-");
export const logger = new Logger("PluginSettings", "#a6d189");

function ReloadRequiredCard({ required }: { required: boolean; }) {
    return (
        <Card variant={required ? "warning" : "normal"} className={cl("info-card")}>
            {required
                ? (
                    <>
                        <Heading tag="h4">需要重新啟動！</Heading>
                        <Paragraph className={cl("dep-text")}>
                            立即重新啟動以套用新插件及其設定
                        </Paragraph>
                        <Button onClick={() => location.reload()} className={cl("restart-button")}>
                            Restart
                        </Button>
                    </>
                )
                : (
                    <>
                        <Heading tag="h4">插件管理</Heading>
                        <Paragraph>點選齒輪或資訊圖示，查看更多插件資訊</Paragraph>
                        <Paragraph>齒輪圖示代表此插件有可調整的設定！</Paragraph>
                    </>
                )}
        </Card>
    );
}

const enum SearchStatus {
    ALL,
    FAVORITES,
    ENABLED,
    DISABLED,
    NEW,
    USER_PLUGINS,
    API_PLUGINS
}

function ExcludedPluginsList({ search }: { search: string; }) {
    const matchingExcludedPlugins = search
        ? Object.entries(ExcludedPlugins)
            .filter(([name]) => name.toLowerCase().includes(search))
        : [];

    const ExcludedReasons: Record<PluginTarget, string> = {
        desktop: "Discord 桌面版或 Vesktop",
        discordDesktop: "Discord 桌面版",
        vesktop: "Vesktop app",
        web: "Vesktop 與 Discord 網頁版",
        dev: "Vencord 開發版本",
        browser: "Vencord 瀏覽器版本"
    };

    return (
        <Paragraph className={Margins.top16}>
            {matchingExcludedPlugins.length
                ? <>
                    <Paragraph>你要找的是：</Paragraph>
                    <ul>
                        {matchingExcludedPlugins.map(([name, reason]) => (
                            <li key={name}>
                                <b>{name}</b>: 僅適用於{ExcludedReasons[reason]}
                            </li>
                        ))}
                    </ul>
                </>
                : "沒有符合搜尋條件的插件。"
            }
        </Paragraph>
    );
}

function PluginSettings() {
    const settings = useSettings();
    const changeRef = useRef<ChangeList<string>>(null);
    const changes = changeRef.current ??= new ChangeList<string>();

    useCleanupEffect(() => {
        if (changes.hasChanges)
            promptToRestart("reload", {
                children: <>
                    <Heading className={Margins.bottom8}>以下插件需要重新啟動才能套用：</Heading>
                    <Paragraph>{Array.from(changes, k => k.split(".")[0]).join(", ")}</Paragraph>
                </>
            });
    }, []);

    const depMap = useMemo(() => {
        const o = {} as Record<string, string[]>;
        for (const plugin in Plugins) {
            const deps = Plugins[plugin].dependencies;
            if (deps) {
                for (const dep of deps) {
                    o[dep] ??= [];
                    o[dep].push(plugin);
                }
            }
        }
        return o;
    }, []);

    const sortedPlugins = useMemo(() =>
        Object.values(Plugins).sort((a, b) => a.name.localeCompare(b.name)),
        []
    )
        .toSorted((a, b) => Number(settings.plugins[b.name]?.isFavorite ?? false) - Number(settings.plugins[a.name]?.isFavorite ?? false));

    const hasUserPlugins = useMemo(() => !IS_STANDALONE && Object.values(PluginMeta).some(m => m.userPlugin), []);

    const [searchValue, setSearchValue] = useState({ value: "", tags: [] as PluginTag[], status: SearchStatus.ALL });

    const search = searchValue.value.toLowerCase();
    const onSearch = (query: string) => setSearchValue(prev => ({ ...prev, value: query }));

    const pluginFilter = (plugin: typeof Plugins[keyof typeof Plugins]) => {
        const { status, tags } = searchValue;

        switch (status) {
            case SearchStatus.FAVORITES:
                if (!settings.plugins[plugin.name]?.isFavorite) return false;
                break;
            case SearchStatus.DISABLED:
                if (isPluginEnabled(plugin.name)) return false;
                break;
            case SearchStatus.ENABLED:
                if (!isPluginEnabled(plugin.name)) return false;
                break;
            case SearchStatus.NEW:
                if (!newPlugins?.includes(plugin.name)) return false;
                break;
            case SearchStatus.USER_PLUGINS:
                if (!PluginMeta[plugin.name]?.userPlugin) return false;
                break;
            case SearchStatus.API_PLUGINS:
                if (!plugin.name.endsWith("API")) return false;
                break;
        }

        if (tags.length && tags.some(t => !plugin.tags?.includes(t))) return false;

        if (!search.length) return true;

        return (
            plugin.name.toLowerCase().includes(search) ||
            plugin.name.match(/[A-Z]/g)?.join("").toLowerCase().includes(search) || // acronyms like BF for BetterFolders
            plugin.description.toLowerCase().includes(search) ||
            plugin.searchTerms?.some(t => t.toLowerCase().includes(search))
        );
    };

    const [newPlugins] = useAwaiter(() => DataStore.get("Vencord_existingPlugins").then((cachedPlugins: Record<string, number> | undefined) => {
        const now = Date.now() / 1000;
        const existingTimestamps: Record<string, number> = {};
        const sortedPluginNames = Object.values(sortedPlugins).map(plugin => plugin.name);

        const newPlugins: string[] = [];
        for (const { name: p } of sortedPlugins) {
            const time = existingTimestamps[p] = cachedPlugins?.[p] ?? now;
            if ((time + 60 * 60 * 24 * 2) > now) {
                newPlugins.push(p);
            }
        }
        DataStore.set("Vencord_existingPlugins", existingTimestamps);

        return lodash.isEqual(newPlugins, sortedPluginNames) ? [] : newPlugins;
    }));

    const plugins = [] as JSX.Element[];
    const requiredPlugins = [] as JSX.Element[];

    const showApi = searchValue.status === SearchStatus.API_PLUGINS;
    for (const p of sortedPlugins) {
        if (p.hidden || (!p.settings && p.name.endsWith("API") && !showApi))
            continue;

        if (!pluginFilter(p)) continue;

        const isRequired = p.required || p.isDependency || depMap[p.name]?.some(d => settings.plugins[d].enabled);

        if (isRequired) {
            const tooltipText = p.required || !depMap[p.name]
                ? "此插件是 Vencord 正常運作所必需的。"
                : makeDependencyList(depMap[p.name]?.filter(d => settings.plugins[d].enabled));

            requiredPlugins.push(
                <Tooltip text={tooltipText} key={p.name}>
                    {({ onMouseLeave, onMouseEnter }) => (
                        <PluginCard
                            onMouseLeave={onMouseLeave}
                            onMouseEnter={onMouseEnter}
                            onRestartNeeded={(name, key) => changes.handleChange(`${name}.${key}`)}
                            disabled={true}
                            plugin={p}
                            key={p.name}
                        />
                    )}
                </Tooltip>
            );
        } else {
            plugins.push(
                <PluginCard
                    onRestartNeeded={(name, key) => changes.handleChange(`${name}.${key}`)}
                    disabled={false}
                    plugin={p}
                    isNew={newPlugins?.includes(p.name)}
                    key={p.name}
                />
            );
        }
    }

    return (
        <SettingsTab>
            <ReloadRequiredCard required={changes.hasChanges} />

            <UIElementsButton />

            <Heading tag="h4" className={classes(Margins.top20, Margins.bottom8)}>
                篩選條件
            </Heading>

            <ErrorBoundary noop>
                <TextInput
                    inputClassName={cl("filter-control")}
                    placeholder="搜尋插件…"
                    value={searchValue.value}
                    onChange={onSearch}
                    autoFocus
                />
            </ErrorBoundary>

            <ErrorBoundary noop>
                <div className={classes(Margins.bottom20, Margins.top8, cl("filter-controls"))}>
                    <Select
                        options={[
                            { label: "顯示全部", value: SearchStatus.ALL, default: true },
                            { label: "顯示我的最愛", value: SearchStatus.FAVORITES },
                            { label: "顯示已啟用", value: SearchStatus.ENABLED },
                            { label: "顯示已停用", value: SearchStatus.DISABLED },
                            { label: "顯示新增", value: SearchStatus.NEW },
                            hasUserPlugins && { label: "顯示使用者插件", value: SearchStatus.USER_PLUGINS },
                            { label: "顯示 API 插件", value: SearchStatus.API_PLUGINS },
                        ].filter(isTruthy)}
                        serialize={String}
                        select={status => setSearchValue(prev => ({ ...prev, status }))}
                        isSelected={v => v === searchValue.status}
                        closeOnSelect={true}
                        placeholder="依類型篩選"
                    />
                    <SearchableSelect
                        options={PluginTags.map(tag => ({ label: tag, value: tag }))}
                        value={searchValue.tags}
                        onChange={tags => setSearchValue(prev => ({ ...prev, tags }))}
                        closeOnSelect={false}
                        placeholder="依標籤篩選"
                        multi
                    />
                </div>
            </ErrorBoundary>

            <Heading tag="h4" className={Margins.top20}>插件</Heading>

            {plugins.length || requiredPlugins.length
                ? (
                    <div className={cl("grid")}>
                        {plugins.length
                            ? plugins
                            : <Paragraph>沒有符合搜尋條件的插件。</Paragraph>
                        }
                    </div>
                )
                : <ExcludedPluginsList search={search} />
            }


            <Divider className={Margins.top20} />

            <Heading tag="h4" className={classes(Margins.top20, Margins.bottom8)}>
                必要插件
            </Heading>

            <div className={cl("grid")}>
                {requiredPlugins.length
                    ? requiredPlugins
                    : <Paragraph>沒有符合搜尋條件的插件。</Paragraph>
                }
            </div>
        </SettingsTab >
    );
}

function makeDependencyList(deps: string[]) {
    return (
        <>
            <Paragraph>以下插件需要此插件：</Paragraph>
            {deps.map((dep: string) => <Paragraph key={dep} className={cl("dep-text")}>{dep}</Paragraph>)}
        </>
    );
}

export default wrapTab(PluginSettings, "Plugins");
