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

import { definePluginSettings, migratePluginSetting } from "@api/Settings";
import { Devs } from "@utils/constants";
import { runtimeHashMessageKey } from "@utils/intlHash";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import { Message } from "@vencord/discord-types";
import { i18n, RelationshipStore } from "@webpack/common";

interface MessageDeleteProps {
    // Internal intl message for BLOCKED_MESSAGE_COUNT
    collapsedReason: () => any;
}

// Remove this migration once enough time has passed
migratePluginSetting("NoBlockedMessages", "ignoreBlockedMessages", "ignoreMessages");
const settings = definePluginSettings({
    ignoreMessages: {
        description: "完全忽略已封鎖或已忽略（若啟用）的使用者傳來的訊息",
        type: OptionType.BOOLEAN,
        default: false,
        restartNeeded: true
    },
    applyToIgnoredUsers: {
        description: "同時套用至已忽略的使用者",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: false
    }
});

export default definePlugin({
    name: "NoBlockedMessages",
    description: "在聊天中完全隱藏已封鎖或忽略的使用者訊息。",
    authors: [Devs.rushii, Devs.Samu, Devs.jamesbt365],
    tags: ["Accessibility", "Chat"],
    settings,

    patches: [
        {
            find: ".__invalid_blocked,",
            replacement: [
                {
                    match: /let{messages:\i,[^}]*?canUncollapse[^}]*}/,
                    replace: "if($self.shouldHide(arguments[0]))return null;$&"
                }
            ]
        },
        {
            find: '"MessageStore"',
            predicate: () => settings.store.ignoreMessages,
            replacement: [
                {
                    match: /(?<=MESSAGE_CREATE:function\((\i)\){)/,
                    replace: (_, props) => `if($self.shouldIgnoreMessage(${props}.message))return;`
                }
            ]
        },
        {
            find: '"ReadStateStore"',
            predicate: () => settings.store.ignoreMessages,
            replacement: [
                {
                    match: /(?<=MESSAGE_CREATE:function\((\i)\){)/,
                    replace: (_, props) => `if($self.shouldIgnoreMessage(${props}.message))return;`
                }
            ]
        }
    ],

    shouldIgnoreUser(userId: string) {
        try {
            return RelationshipStore.isBlocked(userId) || (settings.store.applyToIgnoredUsers && RelationshipStore.isIgnored(userId));
        } catch (e) {
            new Logger("NoBlockedMessages").error("Failed to check if user is blocked or ignored:", e);
            return false;
        }
    },

    shouldIgnoreMessage(message: Message) {
        return this.shouldIgnoreUser(message?.author?.id);
    },

    shouldHide(props: MessageDeleteProps): boolean {
        try {
            const collapsedReason = props.collapsedReason?.();
            const is = (key: string) => collapsedReason === i18n.t[runtimeHashMessageKey(key)]();

            return is("BLOCKED_MESSAGE_COUNT") || (settings.store.applyToIgnoredUsers && is("IGNORED_MESSAGE_COUNT"));
        } catch (e) {
            new Logger("NoBlockedMessages").error("Failed to check if message should be hidden:", e);
            return false;
        }
    }
});
