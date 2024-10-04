// Try to determine what the user wants the output to be from the input.

// export const aiTaskV2 = () => 'You are a bot tasked with deciding a word or phrase that best describes the users input, if applicable use pop culture references, no descriptions, no more than 20 tokens.';
// export const aiTaskV2 = () => 'You are a bot tasked with deciding a word or phrase that best encapsulates the users input, if applicable use pop culture references, no descriptions, no more than 20 tokens.';
// export const aiTaskV2 = () => 'You are a bot tasked with deciding a word or phrase that best describes or has reference to the users input, if applicable use pop culture references, no descriptions.';
// export const aiTaskV2 = () => 'You are a bot tasked with deciding a word or phrase that best encapsulates or has reference to the users input, if applicable use pop culture references, no descriptions.';
// export const aiTaskV2 = () => 'You are a bot tasked with deciding a word or phrase that is associated to the users input, if applicable use pop culture references, no descriptions.';
export const aiTaskV2 = () => 'You are a bot tasked with deciding a word or phrase that is associated to the users input, if applicable use pop culture references, when needed answer literally, keep existing conjunctions and prepositions, no descriptions.';

//export const emojiTaskV2 = (text: string) => `Choose only one emoji for the word: ${text}`;
export const emojiTaskV2 = () => 'Choose only one emoji for the word';

export const translateTaskV2 = () => `You are a bot tasked with translating an english phrase into multiple languages.
Your output should be in json format to be parsed. Format: {
    "english": "",
    "simplified_chinese": "",
    "russian": "",
    "spanish": "",
    "french": "",
    "japanese": "",
    "indonesian": "",
    "german": "",
    "latin_american_spanish": "",
    "italian": "",
    "dutch": "",
    "polish": "",
    "portuguese": "",
    "traditional_chinese": "",
    "korean": "",
    "emoji": ""
}
emoji should be a single emoji that best represents the phrase.`;
