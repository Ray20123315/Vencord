/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { CopyIcon } from "@components/Icons";
import { Devs } from "@utils/constants";
import { copyWithToast } from "@utils/discord";
import definePlugin, { OptionType } from "@utils/types";
import { findByPropsLazy } from "@webpack";
import { Menu } from "@webpack/common";

const { convertNameToSurrogate } = findByPropsLazy("convertNameToSurrogate");

interface Emoji {
    type: string;
    id: string;
    name: string;
}

interface Target {
    dataset: Emoji;
    firstChild: HTMLImageElement;
}

function getEmojiMarkdown(target: Target, copyUnicode: boolean): string {
    const { id: emojiId, name: emojiName } = target.dataset;

    if (!emojiId) {
        return copyUnicode
            ? convertNameToSurrogate(emojiName)
            : `:${emojiName}:`;
    }

    const url = new URL(target.firstChild.src);
    const hasParam = url.searchParams.get("animated") === "true";
    const isGif = url.pathname.endsWith(".gif");

    return `<${(hasParam || isGif) ? "a" : ""}:${emojiName.replace(/~\d+$/, "")}:${emojiId}>`;
}

const settings = definePluginSettings({
    copyUnicode: {
        type: OptionType.BOOLEAN,
        description: "複製預設表情符號（👽）時使用原始 Unicode 字元，而非 :name: 格式",
        default: true,
    },
});

export default definePlugin({
    name: "CopyEmojiMarkdown",
    description: "將表情符號複製成格式化字串，例如 <:blobcatcozy:1026533070955872337>。",
    tags: ["Emotes", "Utility"],
    authors: [Devs.HappyEnderman, Devs.Vishnya],
    settings,

    contextMenus: {
        "expression-picker"(children, { target }: { target: Target; }) {
            if (target.dataset.type !== "emoji" || !target.dataset.id) return;

            children.push(
                <Menu.MenuItem
                    id="vc-copy-emoji-markdown"
                    label="複製表情符號 Markdown"
                    action={() => {
                        copyWithToast(
                            getEmojiMarkdown(target, settings.store.copyUnicode),
                            "Success! Copied emoji markdown."
                        );
                    }}
                    leadingAccessory={{ type: "icon", icon: CopyIcon }}
                />
            );
        },
    },
});
