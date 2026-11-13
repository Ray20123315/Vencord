/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { Divider } from "@components/Divider";
import { ErrorCard } from "@components/ErrorCard";
import { Heading } from "@components/Heading";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { CspBlockedUrls, useCspErrors } from "@utils/cspViolations";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { promptToRestart } from "@utils/promptToRestart";
import { useForceUpdater } from "@utils/react";

export function CspErrorCard() {
    if (IS_WEB) return null;

    const errors = useCspErrors();
    const forceUpdate = useForceUpdater();

    if (!errors.length) return null;

    const isImgurHtmlDomain = (url: string) => url.startsWith("https://imgur.com/");

    const allowUrl = async (url: string) => {
        const { origin: baseUrl, host } = new URL(url);

        const result = await VencordNative.csp.requestAddOverride(baseUrl, ["connect-src", "img-src", "style-src", "font-src"], "Vencord Themes");
        if (result !== "ok") return;

        CspBlockedUrls.forEach(url => {
            if (new URL(url).host === host) {
                CspBlockedUrls.delete(url);
            }
        });

        forceUpdate();
        promptToRestart("relaunch");
    };

    const hasImgurHtmlDomain = errors.some(isImgurHtmlDomain);

    return (
        <ErrorCard>
            <Heading className={Margins.bottom8}>遭封鎖的資源</Heading>
            <Paragraph>部分圖片、樣式或字型來自未允許的網域，因此遭到封鎖。</Paragraph>
            <Paragraph>強烈建議將資源移至 GitHub 或 Imgur；如果你完全信任來源，也可以允許對應網域。</Paragraph>
            <Paragraph>
                After allowing a domain, you have to fully close (from tray / task manager) and restart {IS_DISCORD_DESKTOP ? "Discord" : "Vesktop"} to apply the change.
            </Paragraph>

            <Heading className={classes(Margins.top16, Margins.bottom8)}>遭封鎖的網址</Heading>
            <div className="vc-settings-csp-list">
                {errors.map((url, i) => (
                    <div key={url}>
                        {i !== 0 && <Divider className={Margins.bottom8} />}
                        <div className="vc-settings-csp-row">
                            <Link href={url}>{url}</Link>
                            <Button variant="secondary" onClick={() => allowUrl(url)} disabled={isImgurHtmlDomain(url)}>
                                Allow
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {hasImgurHtmlDomain && (
                <>
                    <Divider className={classes(Margins.top8, Margins.bottom16)} />
                    <Paragraph>
                        Imgur 連結應使用以下格式的直接連結： <code>https://i.imgur.com/...</code>
                    </Paragraph>
                    <Paragraph>如需取得直接連結，請在圖片上按右鍵並選擇「複製圖片網址」。</Paragraph>
                </>
            )}
        </ErrorCard>
    );
}
