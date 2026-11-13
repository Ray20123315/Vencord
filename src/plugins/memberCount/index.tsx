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

import "./style.css";

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import definePlugin, { OptionType } from "@utils/types";
import { FluxStore } from "@vencord/discord-types";
import { findStoreLazy } from "@webpack";

import { MemberCount } from "./MemberCount";

export const ChannelMemberStore = findStoreLazy("ChannelMemberStore") as FluxStore & {
    getProps(guildId?: string, channelId?: string): { groups: { count: number; id: string; }[]; };
};
export const ThreadMemberListStore = findStoreLazy("ThreadMemberListStore") as FluxStore & {
    getMemberListSections(channelId?: string): { [sectionId: string]: { sectionId: string; userIds: string[]; }; };
};

export const settings = definePluginSettings({
    toolTip: {
        type: OptionType.BOOLEAN,
        description: "在伺服器工具提示中顯示成員數量",
        default: true,
        restartNeeded: true
    },
    memberList: {
        type: OptionType.BOOLEAN,
        description: "在成員清單中顯示成員數量",
        default: true,
        restartNeeded: true
    },
    voiceActivity: {
        type: OptionType.BOOLEAN,
        description: "在成員清單的人數旁顯示語音活動",
        default: true
    }
});

const sharedIntlNumberFormat = new Intl.NumberFormat();
export const numberFormat = (value: number) => sharedIntlNumberFormat.format(value);
export const cl = classNameFactory("vc-membercount-");

export default definePlugin({
    name: "MemberCount",
    description: "在成員清單與工具提示中顯示伺服器的線上人數、總成員數及語音頻道使用者數量。",
    tags: ["Servers", "Utility"],
    authors: [Devs.Ven, Devs.Commandtechno, Devs.Apexo],
    settings,

    patches: [
        {
            find: "{isSidebarVisible:",
            replacement: [
                {
                    match: /children:\[(\i\.useMemo[^}]+"aria-multiselectable")(?<=className:(\i),.+?)/,
                    replace: "children:[$2?.includes('members')?$self.render():null,$1",
                },
            ],
            predicate: () => settings.store.memberList
        },
        {
            find: "GuildTooltip - ",
            replacement: {
                match: /#{intl::VIEW_AS_ROLES_MENTIONS_WARNING}.{0,100}(?=])/,
                replace: "$&,$self.renderTooltip(arguments[0].guild)"
            },
            predicate: () => settings.store.toolTip
        },
        {
            find: '"GuildSubscriptionsStore"',
            replacement: {
                match: /(\i\.\i\.getSection\(\i\))===(\i\.\i)\.MEMBERS/,
                replace: (m, section, ChannelSectionTypes) => `(${m}||${section}===${ChannelSectionTypes}.NONE)`
            }
        }
    ],
    render: ErrorBoundary.wrap(() => <MemberCount />, { noop: true }),
    renderTooltip: ErrorBoundary.wrap(guild => <MemberCount isTooltip tooltipGuildId={guild.id} />, { noop: true })
});
