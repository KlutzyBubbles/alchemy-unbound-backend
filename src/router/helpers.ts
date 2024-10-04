export function isNumeric(n: string) {
    const removeChars = [
        '!',
        '@',
        '#',
        '$',
        '%',
        '^',
        '&',
        '*',
        '(',
        ')',
        '-',
        '_',
        '=',
        '+',
        '[',
        ']',
        '{',
        '}',
        '\\',
        '|',
        ';',
        ':',
        '\'',
        '"',
        ',',
        '<',
        '.',
        '>',
        '/',
        '?',
        '`',
        '~'
    ];
    let testString = n;
    for (const char of removeChars) {
        testString = testString.replaceAll(char, '');
    }
    return !isNaN(Number(testString)) && isFinite(Number(testString));
}
