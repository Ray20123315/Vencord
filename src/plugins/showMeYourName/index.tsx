/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 rini
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Channel, Message, User } from "@vencord/discord-types";
import { RelationshipStore, StreamerModeStore } from "@webpack/common";

interface UsernameProps {
    author: { nick: string; authorId: string; };
    channel: Channel;
    message: Message;
    withMentionPrefix?: boolean;
    isRepliedMessage: boolean;
    userOverride?: User;
}

const settings = definePluginSettings({
    mode: {
        type: OptionType.SELECT,
        description: "使用者名稱及暱稱的顯示方式",
        options: [
            { label: "使用者名稱在前、暱稱在後", value: "user-nick", default: true },
            { label: "暱稱在前、使用者名稱在後", value: "nick-user" },
            { label: "僅顯示使用者名稱", value: "user" },
            { label: "僅顯示暱稱", value: "nick" },
        ],
    },
    friendNicknames: {
        type: OptionType.SELECT,
        description: "好友暱稱相對於伺服器暱稱的優先順序",
        options: [
            { label: "僅在私訊中顯示好友暱稱", value: "dms", default: true },
            { label: "優先使用好友暱稱", value: "always" },
            { label: "優先使用伺服器暱稱", value: "fallback" }
        ]
    },
    displayNames: {
        type: OptionType.BOOLEAN,
        description: "以顯示名稱取代使用者名稱",
        default: false
    },
    inReplies: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "也套用至回覆預覽",
    },
});

export default definePlugin({
    name: "ShowMeYourName",
    description: "在暱稱旁顯示使用者名稱，或完全隱藏暱稱。",
    tags: ["Appearance", "Customisation"],
    authors: [Devs.Rini, Devs.TheKodeToad, Devs.rae],
    patches: [
        {
            find: '="SYSTEM_TAG"',
            replacement: {
                // The field is named "userName", but as this is unusual casing, the regex also matches username, in case they change it
                match: /(?<=onContextMenu:\i,children:)\i\?(?=.{0,100}?user[Nn]ame:)/,
                replace: "$self.renderUsername(arguments[0]),_oldChildren:$&"
            }
        },
    ],
    settings,

    renderUsername: ErrorBoundary.wrap(({ author, channel, message, isRepliedMessage, withMentionPrefix, userOverride }: UsernameProps) => {
        try {
            const { mode, friendNicknames, displayNames, inReplies } = settings.store;

            const user = userOverride ?? message.author;
            let username = StreamerModeStore.enabled
                ? user.username[0] + "…"
                : user.username;

            if (displayNames)
                username = user.globalName || username;

            let { nick } = author;

            const friendNickname = RelationshipStore.getNickname(author.authorId);

            if (friendNickname) {
                const shouldUseFriendNickname =
                    friendNicknames === "always" ||
                    (friendNicknames === "dms" && channel.isPrivate()) ||
                    (friendNicknames === "fallback" && !nick);

                if (shouldUseFriendNickname)
                    nick = friendNickname;
            }

            const prefix = withMentionPrefix ? "@" : "";

            if (isRepliedMessage && !inReplies || (username.toLowerCase() === nick.toLowerCase() && mode !== "user"))
                return <>{prefix}{nick}</>;

            if (mode === "user-nick")
                return <>{prefix}{username} <span className="vc-smyn-suffix">{nick}</span></>;

            if (mode === "nick-user")
                return <>{prefix}{nick} <span className="vc-smyn-suffix">{username}</span></>;

            if (mode === "nick")
                return <>{prefix}{nick}</>;

            return <>{prefix}{username}</>;
        } catch {
            return <>{author?.nick}</>;
        }
    }, { noop: true }),
});
