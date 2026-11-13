/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { FormSwitch } from "@components/FormSwitch";
import { Heading } from "@components/Heading";
import { Paragraph } from "@components/Paragraph";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { Parser, TextInput, useEffect, useState } from "@webpack/common";

const RegexGuide = {
    "\\i": "用來比對識別字（變數名稱、類別名稱等）的特殊正規表示式跳脫序列",
    "$$": "插入 $",
    "$&": "插入完整的相符內容",
    "$`\u200b": "插入相符內容前面的子字串",
    "$'": "插入相符內容後面的子字串",
    "$n": "插入第 n 個擷取群組（$1、$2…）",
    "$self": "插入插件實例",
} as const;

export function ReplacementInput({ replacement, setReplacement, replacementError }) {
    const [isFunc, setIsFunc] = useState(false);
    const [error, setError] = useState<string>();

    function onChange(v: string) {
        setError(void 0);

        if (isFunc) {
            try {
                const func = (0, eval)(v);
                if (typeof func === "function")
                    setReplacement(() => func);

                else
                    setError("替換內容必須是函式");
            } catch (e) {
                setReplacement(v);
                setError((e as Error).message);
            }
        } else {
            setReplacement(v);
        }
    }

    useEffect(() => {
        if (isFunc)
            onChange(replacement);
        else
            setError(void 0);
    }, [isFunc]);

    return (
        <>
            <Heading className={Margins.bottom8}>替換內容</Heading>
            <TextInput
                value={replacement?.toString()}
                onChange={onChange}
                error={error ?? replacementError}
            />
            {!isFunc && (
                <div>
                    <Heading className={classes(Margins.top8, Margins.bottom8)}>速查表</Heading>

                    {Object.entries(RegexGuide).map(([placeholder, desc]) => (
                        <Paragraph key={placeholder}>
                            {Parser.parse("`" + placeholder + "`")}: {desc}
                        </Paragraph>
                    ))}
                </div>
            )}

            <FormSwitch
                className={Margins.top16}
                value={isFunc}
                onChange={setIsFunc}
                title={'將「替換內容」視為函式'}
                description='啟用後，將以函式方式執行「替換內容」'
                hideBorder
            />
        </>
    );
}
