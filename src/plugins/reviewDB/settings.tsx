/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
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

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { openInviteModal } from "@utils/discord";
import { OptionType } from "@utils/types";

import { authorize, getToken } from "./auth";
import { openBlockModal } from "./components/BlockedUserModal";
import { cl } from "./utils";

export const settings = definePluginSettings({
    authorize: {
        type: OptionType.COMPONENT,
        component: () => (
            <Button onClick={() => authorize()}>
                Authorize with ReviewDB
            </Button>
        )
    },
    notifyReviews: {
        type: OptionType.BOOLEAN,
        description: "啟動時通知新評論",
        default: true,
    },
    showWarning: {
        type: OptionType.BOOLEAN,
        description: "在評論清單頂端顯示尊重他人的提醒",
        default: true,
    },
    hideTimestamps: {
        type: OptionType.BOOLEAN,
        description: "隱藏評論時間戳記",
        default: false,
    },
    hideBlockedUsers: {
        type: OptionType.BOOLEAN,
        description: "隱藏已封鎖使用者的評論",
        default: true,
    },
    buttons: {
        type: OptionType.COMPONENT,
        component: () => (
            <div className={cl("button-grid")} >
                <Button onClick={openBlockModal}>管理已封鎖的使用者</Button>

                <Button
                    variant="positive"
                    onClick={() => {
                        VencordNative.native.openExternal("https://github.com/sponsors/mantikafasi");
                    }}
                >
                    Support ReviewDB development
                </Button>

                <Button variant="link" onClick={async () => {
                    let url = "https://reviewdb.mantikafasi.dev";
                    const token = await getToken();
                    if (token)
                        url += "/api/redirect?token=" + encodeURIComponent(token);

                    VencordNative.native.openExternal(url);
                }}>
                    ReviewDB website
                </Button>


                <Button variant="link" onClick={() => openInviteModal("eWPBSbvznt")}>
                    ReviewDB Support Server
                </Button>
            </div >
        )
    }
}).withPrivateSettings<{
    lastReviewId?: number;
    reviewsDropdownState?: boolean;
}>();
