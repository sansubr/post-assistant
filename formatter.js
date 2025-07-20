/**
 * A mapping of standard alphanumeric characters to their Unicode
 * mathematical sans-serif bold counterparts.
 */
const boldMap = {
    'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝘅', 'y': '𝘆', 'z': '𝘇',
    'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭',
    '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
};

/**
 * Converts a string of text into its bold Unicode equivalent.
 * @param {string} text The text to convert.
 * @returns {string} The text with characters replaced by bold Unicode characters.
 */
function convertToBoldUnicode(text) {
    return text.split('').map(char => boldMap[char] || char).join('');
}

/**
 * Formats a string for LinkedIn by converting markdown bold (`**text**`)
 * into Unicode bold characters.
 * @param {string} text The raw text from the AI.
 * @returns {string} The formatted text ready for LinkedIn.
 */
export function formatForLinkedIn(text) {
    // This regex finds all occurrences of text wrapped in double asterisks,
    // captures the text inside (p1), and replaces the whole match.
    return text.replace(/\*\*(.*?)\*\*/g, (match, p1) => {
        return convertToBoldUnicode(p1);
    });
}