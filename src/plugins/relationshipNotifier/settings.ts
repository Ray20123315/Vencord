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
import { OptionType } from "@utils/types";

export default definePluginSettings({
    notices: {
        type: OptionType.BOOLEAN,
        description: "被移除時也在畫面頂端顯示通知（如果不想錯過通知，建議啟用）。",
        default: false
    },
    offlineRemovals: {
        type: OptionType.BOOLEAN,
        description: "若離線期間遭到移除，啟動 Discord 時通知你。",
        default: true
    },
    friends: {
        type: OptionType.BOOLEAN,
        description: "好友將你移除時通知",
        default: true
    },
    friendRequestCancels: {
        type: OptionType.BOOLEAN,
        description: "好友邀請被取消時通知",
        default: true
    },
    servers: {
        type: OptionType.BOOLEAN,
        description: "遭伺服器移除時通知",
        default: true
    },
    groups: {
        type: OptionType.BOOLEAN,
        description: "遭群組聊天移除時通知",
        default: true
    }
});
