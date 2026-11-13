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

import {
    findGroupChildrenByChildId,
    NavContextMenuPatchCallback
} from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { CogWheel } from "@components/Icons";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Guild } from "@vencord/discord-types";
import { findByCodeLazy, findByPropsLazy, mapMangledModuleLazy } from "@webpack";
import { Menu, UserStore } from "@webpack/common";

const { updateGuildNotificationSettings } = findByPropsLazy("updateGuildNotificationSettings");
const { toggleShowAllChannels } = mapMangledModuleLazy(".onboardExistingMember(", {
    toggleShowAllChannels: m => {
        const s = String(m);
        return s.length < 100 && !s.includes("onboardExistingMember") && !s.includes("getOptedInChannels");
    }
});
const isOptInEnabledForGuild = findByCodeLazy(".COMMUNITY)||", ".isOptInEnabled(");

const settings = definePluginSettings({
    guild: {
        description: "自動將伺服器靜音",
        type: OptionType.BOOLEAN,
        default: true
    },
    messages: {
        description: "伺服器通知設定",
        type: OptionType.SELECT,
        options: [
            { label: "所有訊息", value: 0 },
            { label: "僅 @ 提及", value: 1 },
            { label: "不通知", value: 2 },
            { label: "伺服器預設", value: 3, default: true }
        ],
    },
    everyone: {
        description: "抑制 @everyone 與 @here 通知",
        type: OptionType.BOOLEAN,
        default: true
    },
    role: {
        description: "抑制所有身分組 @ 提及通知",
        type: OptionType.BOOLEAN,
        default: true
    },
    highlights: {
        description: "自動抑制重點通知",
        type: OptionType.BOOLEAN,
        default: true
    },
    events: {
        description: "自動將新活動靜音",
        type: OptionType.BOOLEAN,
        default: true
    },
    showAllChannels: {
        description: "自動顯示所有頻道",
        type: OptionType.BOOLEAN,
        default: true
    }
});

const makeContextMenuPatch: (shouldAddIcon: boolean) => NavContextMenuPatchCallback = (shouldAddIcon: boolean) => (children, { guild }: { guild: Guild, onClose(): void; }) => {
    if (!guild) return;

    const group = findGroupChildrenByChildId("privacy", children);
    group?.push(
        <Menu.MenuItem
            label="套用 NewGuildSettings"
            id="vc-newguildsettings-apply"
            icon={shouldAddIcon ? CogWheel : void 0}
            leadingAccessory={shouldAddIcon ? { type: "icon", icon: CogWheel } : void 0}
            action={() => applyDefaultSettings(guild.id)}
        />
    );
};

function applyDefaultSettings(guildId: string | null) {
    if (guildId === "@me" || guildId === "null" || guildId == null) return;
    updateGuildNotificationSettings(guildId,
        {
            muted: settings.store.guild,
            suppress_everyone: settings.store.everyone,
            suppress_roles: settings.store.role,
            mute_scheduled_events: settings.store.events,
            notify_highlights: settings.store.highlights ? 1 : 0
        });
    if (settings.store.messages !== 3) {
        updateGuildNotificationSettings(guildId,
            {
                message_notifications: settings.store.messages,
            });
    }
    if (settings.store.showAllChannels && isOptInEnabledForGuild(guildId)) {
        toggleShowAllChannels(guildId);
    }
}

export default definePlugin({
    name: "NewGuildSettings",
    description: "加入新伺服器時自動靜音，並套用其他指定設定。",
    tags: ["Servers", "Customisation"],
    searchTerms: ["MuteNewGuild", "mute", "server"],
    authors: [Devs.Glitch, Devs.Nuckyz, Devs.carince, Devs.Mopi, Devs.GabiRP],
    contextMenus: {
        "guild-context": makeContextMenuPatch(false),
        "guild-header-popout": makeContextMenuPatch(true)
    },
    patches: [
        {
            find: ",acceptInvite(",
            replacement: {
                match: /INVITE_ACCEPT_SUCCESS.+?,(\i)=null!=.+?;/,
                replace: (m, guildId) => `${m}$self.applyDefaultSettings(${guildId});`
            }
        },
        {
            find: "{joinGuild:",
            replacement: {
                match: /guildId:(\i),lurker:(\i).{0,20}}\);/,
                replace: (m, guildId, lurker) => `${m}if(!${lurker})$self.applyDefaultSettings(${guildId});`
            }
        }
    ],
    settings,
    applyDefaultSettings,
    flux: {
        GUILD_JOIN_REQUEST_UPDATE({ guildId, request, status }) {
            if (status === "APPROVED" && request.user_id === UserStore.getCurrentUser().id)
                applyDefaultSettings(guildId);
        }
    }
});
