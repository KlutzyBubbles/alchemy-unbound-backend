import keywordSet from 'emojilib';

// This value was picked experimentally.
// Substring search returns a lot of noise for shorter search words.
const MIN_WORD_LENGTH_FOR_SUBSTRING_SEARCH = 1;

// We keep this async in case we need to to become async in the future
export default async function getEmojiFromText(searchQuery: string): Promise<string[]> {
    const regexSource = searchQuery.toLowerCase().split(/\s/g)
        .map(v => v.replaceAll(/\W/g, ''))
        .filter(v => v.length > 0)
        .map(v => v.length < MIN_WORD_LENGTH_FOR_SUBSTRING_SEARCH ? `^${v}$` : v)
        .join('|');

    if (regexSource.length === 0) {
        return [];
    }

    const regex = new RegExp(regexSource);
    const emojisUnsorted: {
        emoji: string,
        count: number,
        firstIndex: number
    }[] = [];
    let emojis: string[] = [];

    for (const emojiCharacter of Object.keys(keywordSet)) {
        const emojiKeywords = keywordSet[emojiCharacter] ?? [];

        const matches = emojiKeywords.map(keyword => regex.test(keyword));
        let matchCount = 0;
        let matchArea = 0;
        let foundMatch = false;
        matches.forEach((item) => {
            if (!foundMatch) {
                matchArea++;
            }
            if (item) {
                foundMatch = true;
                matchCount++;
            }
        });
        if (matchCount > 0) {
            emojisUnsorted.push({
                emoji: emojiCharacter,
                count: matchCount,
                firstIndex: matchArea
            });
        }
    }

    emojis = emojisUnsorted.sort((a, b) => {
        if (a.count !== b.count) {
            return a.count > b.count ? 1 : 0;
        } else {
            if (a.firstIndex !== b.firstIndex) {
                return a.firstIndex < b.firstIndex ? 1 : 0;
            } else {
                return a.emoji.localeCompare(b.emoji);
            }
        }
    }).map((record) => record.emoji);

    return emojis;
}
