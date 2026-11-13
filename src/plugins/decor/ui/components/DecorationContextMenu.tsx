/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { CopyIcon, DeleteIcon } from "@components/Icons";
import { Decoration } from "@plugins/decor/lib/api";
import { useCurrentUserDecorationsStore } from "@plugins/decor/lib/stores/CurrentUserDecorationsStore";
import { cl } from "@plugins/decor/ui";
import { copyToClipboard } from "@utils/clipboard";
import { confirmAction } from "@utils/discord";
import { ContextMenuApi, Menu, UserStore } from "@webpack/common";

export default function DecorationContextMenu({ decoration }: { decoration: Decoration; }) {
    const { delete: deleteDecoration } = useCurrentUserDecorationsStore();

    return <Menu.Menu
        navId={cl("decoration-context-menu")}
        onClose={ContextMenuApi.closeContextMenu}
        aria-label="裝飾品選項"
    >
        <Menu.MenuItem
            id={cl("decoration-context-menu-copy-hash")}
            label="複製裝飾品雜湊值"
            icon={CopyIcon}
            leadingAccessory={{ type: "icon", icon: CopyIcon }}
            action={() => copyToClipboard(decoration.hash)}
        />
        {decoration.authorId === UserStore.getCurrentUser().id &&
            <Menu.MenuItem
                id={cl("decoration-context-menu-delete")}
                label="刪除裝飾品"
                color="danger"
                icon={DeleteIcon}
                leadingAccessory={{ type: "icon", icon: DeleteIcon }}
                action={() => {
                    confirmAction({
                        title: "刪除裝飾品",
                        subtitle: `確定要刪除 ${decoration.alt} 嗎？`,
                        confirmText: "Delete",
                        cancelText: "Cancel",
                        onConfirm: () => deleteDecoration(decoration)
                    });
                }}
            />
        }
    </Menu.Menu>;
}
