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

import { Button } from "@components/Button";
import { CodeBlock } from "@components/CodeBlock";
import { Divider } from "@components/Divider";
import { Flex } from "@components/Flex";
import { Heading } from "@components/Heading";
import { SettingsTab, wrapTab } from "@components/settings/tabs/BaseTab";
import { debounce } from "@shared/debounce";
import { copyWithToast } from "@utils/discord";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { stripIndent } from "@utils/text";
import { ReplaceFn } from "@utils/types";
import { search } from "@webpack";
import { React, TextInput, useMemo, useState } from "@webpack/common";

import { FullPatchInput } from "./FullPatchInput";
import { PatchPreview } from "./PatchPreview";
import { ReplacementInput } from "./ReplacementInput";

const findCandidates = debounce(function ({ find, setModule, setError }) {
    const candidates = search(find);
    const keys = Object.keys(candidates);
    const len = keys.length;

    if (len === 0)
        setError("沒有相符項目。該模組可能尚未載入？");
    else if (len !== 1)
        setError("找到多個相符項目，請縮小篩選範圍");
    else
        setModule([keys[0], candidates[keys[0]]]);
});

function PatchHelper() {
    const [find, setFind] = useState("");
    const [match, setMatch] = useState("");
    const [replacement, setReplacement] = useState<string | ReplaceFn>("");

    const [parsedFind, setParsedFind] = useState<string | RegExp>("");

    const [findError, setFindError] = useState<string>();
    const [matchError, setMatchError] = useState<string>();
    const [replacementError, setReplacementError] = useState<string>();

    const [module, setModule] = useState<[number, Function]>();

    const code = useMemo(() => {
        const find = parsedFind instanceof RegExp ? parsedFind.toString() : JSON.stringify(parsedFind);
        const replace = typeof replacement === "function" ? replacement.toString() : JSON.stringify(replacement);

        return stripIndent`
            {
                find: ${find},
                replacement: {
                    match: /${match.replace(/(?<!\\)\//g, "\\/")}/,
                    replace: ${replace}
                }
            }
        `;
    }, [parsedFind, match, replacement]);

    function onFindChange(v: string) {
        setFind(v);

        try {
            let parsedFind = v as string | RegExp;
            if (/^\/.+?\/$/.test(v)) parsedFind = new RegExp(v.slice(1, -1));

            setFindError(void 0);
            setParsedFind(parsedFind);

            if (v.length) {
                findCandidates({ find: parsedFind, setModule, setError: setFindError });
            }
        } catch (e: any) {
            setFindError((e as Error).message);
        }
    }

    function onMatchChange(v: string) {
        setMatch(v);

        try {
            new RegExp(v);
            setMatchError(void 0);
        } catch (e: any) {
            setMatchError((e as Error).message);
        }
    }

    return (
        <SettingsTab>
            <Heading className={Margins.bottom8}>完整修補內容</Heading>
            <FullPatchInput
                setFind={onFindChange}
                setParsedFind={setParsedFind}
                setMatch={onMatchChange}
                setReplacement={setReplacement}
            />

            <Heading className={classes(Margins.top8, Margins.bottom8)}>尋找</Heading>
            <TextInput
                type="text"
                value={find}
                onChange={onFindChange}
                error={findError}
            />

            <Heading className={classes(Margins.top8, Margins.bottom8)}>比對</Heading>
            <TextInput
                type="text"
                value={match}
                onChange={onMatchChange}
                error={matchError}
            />

            <div className={Margins.top8} />
            <ReplacementInput
                replacement={replacement}
                setReplacement={setReplacement}
                replacementError={replacementError}
            />

            <Divider />
            {module && (
                <PatchPreview
                    module={module}
                    match={match}
                    replacement={replacement}
                    setReplacementError={setReplacementError}
                />
            )}

            {!!(find && match && replacement) && (
                <>
                    <Heading className={classes(Margins.top20, Margins.bottom8)}>程式碼</Heading>
                    <CodeBlock lang="js" content={code} />
                    <Flex className={Margins.top16}>
                        <Button onClick={() => copyWithToast(code)}>
                            複製到剪貼簿
                        </Button>
                        <Button onClick={() => copyWithToast("```ts\n" + code + "\n```")}>
                            複製為程式碼區塊
                        </Button>
                    </Flex>
                </>
            )}
        </SettingsTab>
    );
}

export default !IS_STANDALONE ? wrapTab(PatchHelper, "修補工具") : null;
