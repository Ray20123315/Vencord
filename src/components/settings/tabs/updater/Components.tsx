/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { Card } from "@components/Card";
import { ErrorCard } from "@components/ErrorCard";
import { Flex } from "@components/Flex";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { promptTo重新啟動 } from "@utils/promptTo重新啟動";
import { changes, checkForUpdates, update, updateError } from "@utils/updater";
import { React, showToast, useState } from "@webpack/common";

import { runWithDispatch } from "./runWithDispatch";

export interface CommonProps {
    repo: string;
    repoPending: boolean;
}

export function HashLink({ repo, hash, disabled = false }: { repo: string, hash: string, disabled?: boolean; }) {
    return (
        <Link href={`${repo}/commit/${hash}`} disabled={disabled}>
            {hash}
        </Link>
    );
}

export function Changes({ updates, repo, repoPending }: CommonProps & { updates: typeof changes; }) {
    return (
        <Card style={{ padding: "0 0.5em" }} defaultPadding={false}>
            {updates.map(({ hash, author, message }) => (
                <div
                    key={hash}
                    style={{
                        marginTop: "0.5em",
                        marginBottom: "0.5em"
                    }}
                >
                    <code>
                        <HashLink {...{ repo, hash }} disabled={repoPending} />
                    </code>

                    <span style={{
                        marginLeft: "0.5em",
                        color: "var(--text-default)"
                    }}>
                        {message} - {author}
                    </span>
                </div>
            ))}
        </Card>
    );
}

export function Newer(props: CommonProps) {
    return (
        <>
            <Paragraph className={Margins.bottom8}>
                你的本機版本包含較新的提交，請先暫存或重設這些變更。
            </Paragraph>
            <Changes {...props} updates={changes} />
        </>
    );
}

export function Updatable(props: CommonProps) {
    const [updates, setUpdates] = useState(changes);
    const [isChecking, setIsChecking] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const isOutdated = (updates?.length ?? 0) > 0;

    return (
        <>
            {!updates && updateError ? (
                <>
                    <Paragraph>檢查更新失敗。詳細資訊請查看主控台</Paragraph>
                    <ErrorCard style={{ padding: "1em" }}>
                        <p>{updateError.stderr || updateError.stdout || "發生未知錯誤"}</p>
                    </ErrorCard>
                </>
            ) : (
                <Paragraph className={Margins.bottom8}>
                    {isOutdated ? (updates.length === 1 ? "有 1 項更新" : `有 ${updates.length} 項更新`) : "已是最新版本！"}
                </Paragraph>
            )}

            {isOutdated && <Changes updates={updates} {...props} />}

            <Flex className={classes(Margins.bottom8, Margins.top8)}>
                {isOutdated && (
                    <Button
                        disabled={isUpdating || isChecking}
                        onClick={runWithDispatch(setIsUpdating, async () => {
                            if (await update()) {
                                setUpdates([]);

                                promptTo重新啟動("relaunch", {
                                    title: "更新成功！",
                                    subtitle: "已成功更新。要立即重新啟動以套用變更嗎？",
                                    confirmText: "重新啟動",
                                    cancelText: "稍後再說！"
                                });
                            }
                        })}
                    >
                        立即更新
                    </Button>
                )}
                <Button
                    disabled={isUpdating || isChecking}
                    onClick={runWithDispatch(setIsChecking, async () => {
                        const outdated = await checkForUpdates();

                        if (outdated) {
                            setUpdates(changes);
                        } else {
                            setUpdates([]);

                            showToast({ text: "沒有找到更新！", position: "bottom" });
                        }
                    })}
                >
                    檢查更新
                </Button>
            </Flex>
        </>
    );
}
