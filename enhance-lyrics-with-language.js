const fs = require('fs');
const path = require('path');

console.log('🔧 Enhancing lyrics database: Adding language field and improving formatting...\n');

// Language detection patterns
const dutchPatterns = [
    // Common Dutch words/phrases
    'je', 'de', 'het', 'een', 'van', 'en', 'is', 'dat', 'op', 'met', 'voor', 'aan', 'zijn',
    'ik', 'jij', 'hij', 'zij', 'wij', 'jullie', 'hun', 'deze', 'die', 'waar', 'wat',
    'waarom', 'hoe', 'wanneer', 'zoals', 'omdat', 'maar', 'ook', 'nog', 'wel', 'niet',
    // Dutch song-specific words
    'liefde', 'hart', 'ogen', 'leven', 'wereld', 'tijd', 'gevoel', 'dromen', 'zingen',
    'muziek', 'stem', 'alleen', 'samen', 'altijd', 'nooit', 'misschien', 'tegen',
    // Dutch titles we know
    'oorlog meegemaakt', 'engel van', 'iedereen is van de wereld', 'open je ogen', 
    'oud geboren', 'kalverliefde', 'als je iets kan doen'
];

const englishIndicators = [
    // Strong English indicators
    'the', 'and', 'you', 'that', 'for', 'are', 'with', 'this', 'have', 'from', 'they',
    'know', 'want', 'been', 'good', 'much', 'some', 'time', 'very', 'when', 'come',
    'here', 'just', 'like', 'long', 'make', 'many', 'over', 'such', 'take', 'than',
    'them', 'well', 'were', 'will', 'your'
];

// Detect language of lyrics
function detectLanguage(lyrics, title) {
    // Clean lyrics for analysis (remove metadata)
    const cleanedLyrics = lyrics
        .replace(/\[Lyrics not yet extracted\][\s\S]*/, '') // Remove placeholder text
        .replace(/Other artist\nVarious artist/g, '') // Remove metadata
        .replace(/Information/g, '') // Remove navigation
        .replace(/Disclaimer[\s\S]*/, '') // Remove footer
        .toLowerCase();
    
    // Check title for obvious Dutch indicators
    const titleLower = title.toLowerCase();
    const dutchTitlePatterns = ['als je', 'van m\'n', 'je ogen', 'oorlog', 'engel van', 'iedereen is'];
    if (dutchTitlePatterns.some(pattern => titleLower.includes(pattern))) {
        return 'nl';
    }
    
    // Count Dutch vs English patterns in lyrics
    let dutchScore = 0;
    let englishScore = 0;
    
    const words = cleanedLyrics.split(/\s+/).filter(word => word.length > 2);
    
    words.forEach(word => {
        const cleanWord = word.replace(/[^\w]/g, '');
        if (dutchPatterns.includes(cleanWord)) {
            dutchScore++;
        }
        if (englishIndicators.includes(cleanWord)) {
            englishScore++;
        }
    });
    
    // Special cases for known Dutch songs
    if (titleLower.includes('kalverliefde') || 
        titleLower.includes('oorlog') || 
        titleLower.includes('engel van') ||
        titleLower.includes('iedereen is') ||
        titleLower.includes('open je ogen') ||
        titleLower.includes('oud geboren') ||
        cleanedLyrics.includes('nederlandse') ||
        cleanedLyrics.includes('holland')) {
        return 'nl';
    }
    
    // If we have significantly more Dutch indicators
    if (dutchScore > englishScore && dutchScore > 3) {
        return 'nl';
    }
    
    // Default to English (most songs are English)
    return 'en';
}

// Improve lyrics formatting by detecting verse/chorus patterns
function improveFormatting(lyrics) {
    if (lyrics.startsWith('[Lyrics not yet extracted]')) {
        return lyrics; // Don't format placeholder text
    }
    
    // Remove website metadata and navigation
    let cleaned = lyrics
        .replace(/^.*?www\.ilsedelangerecords\.nl[^\n]*\n/, '')
        .replace(/^.*?Home\nAlbum[\s\S]*?TCL lyrics\n/, '')
        .replace(/^.*?Home\nAlbum[\s\S]*?Lyrics\n/, '')
        .replace(/Other artist\nVarious artist\n/, '')
        .replace(/Released:.*?\n/g, '')
        .replace(/Catalog number:.*?\n/g, '')
        .replace(/Extra:.*?\n/g, '')
        .replace(/Record label.*?\n/g, '')
        .replace(/Top \d+:.*?\n/g, '')
        .replace(/Tip parade:.*?\n/g, '')
        .replace(/A special thanks.*?\n/g, '');
    
    // Remove the long navigation section at the end
    cleaned = cleaned.replace(/\nDisclaimer[\s\S]*$/, '');
    cleaned = cleaned.replace(/\nHelp wanted[\s\S]*$/, '');
    cleaned = cleaned.replace(/\nWanted[\s\S]*$/, '');
    
    // Remove repetitive "Information" lines
    cleaned = cleaned.replace(/\nInformation\n/g, '\n');
    cleaned = cleaned.replace(/\ninformation\n/g, '\n');
    
    // Clean up extra whitespace but preserve intentional line breaks
    const lines = cleaned.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Try to detect and preserve verse/chorus structure
    const formattedLines = [];
    let previousLineWasEmpty = false;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const nextLine = lines[i + 1];
        
        // Skip metadata lines
        if (line.includes('www.') || 
            line.includes('Home') || 
            line.includes('Album') ||
            line.includes('Singles') ||
            line.includes('Live') ||
            line.includes('Items') ||
            line.includes('Lyrics') ||
            line.includes('TCL') ||
            line.includes('catalog') ||
            line.includes('Released') ||
            line.includes('Record label') ||
            line.includes('Top 40') ||
            line.includes('Top 100') ||
            line.includes('thanks to') ||
            line.match(/^\d+:/)) {
            continue;
        }
        
        formattedLines.push(line);
        
        // Add spacing between verses/choruses
        if (nextLine && 
            !nextLine.includes('www.') &&
            !nextLine.includes('catalog') &&
            (line.length > 20 || 
             (formattedLines.length > 1 && formattedLines[formattedLines.length - 2].length > 20))) {
            
            // Detect common patterns that indicate verse/chorus breaks
            const isEndOfSection = 
                line.toLowerCase().includes('chorus') ||
                line.toLowerCase().includes('verse') ||
                (nextLine && nextLine[0] && nextLine[0] === nextLine[0].toUpperCase() && 
                 line[line.length - 1] && '.,!?'.includes(line[line.length - 1]));
            
            if (isEndOfSection && !previousLineWasEmpty) {
                formattedLines.push(''); // Add blank line for spacing
                previousLineWasEmpty = true;
            } else {
                previousLineWasEmpty = false;
            }
        }
    }
    
    return formattedLines.join('\n').trim();
}

// Load current lyrics database
const lyricsPath = path.join(__dirname, 'public', 'content', 'lyrics.json');
const lyricsData = JSON.parse(fs.readFileSync(lyricsPath, 'utf8'));

console.log(`📊 Processing ${lyricsData.lyrics.length} songs...\n`);

// Process each song
const enhancedLyrics = lyricsData.lyrics.map((song, index) => {
    const language = detectLanguage(song.lyrics, song.title);
    const improvedLyrics = improveFormatting(song.lyrics);
    
    console.log(`[${index + 1}/${lyricsData.lyrics.length}] ${song.title} (${song.artist}) - Language: ${language}`);
    
    return {
        title: song.title,
        artist: song.artist,
        language: language,
        lyrics: improvedLyrics
    };
});

// Count languages
const languageCounts = enhancedLyrics.reduce((acc, song) => {
    acc[song.language] = (acc[song.language] || 0) + 1;
    return acc;
}, {});

console.log(`\n📊 Language Distribution:`);
console.log(`🇬🇧 English: ${languageCounts.en || 0} songs`);
console.log(`🇳🇱 Dutch: ${languageCounts.nl || 0} songs`);

// Update metadata
const enhancedMetadata = {
    ...lyricsData.metadata,
    lastUpdated: new Date().toISOString(),
    enhancements: {
        languageFieldAdded: true,
        formattingImproved: true,
        metadataRemoved: true
    },
    languageDistribution: {
        english: languageCounts.en || 0,
        dutch: languageCounts.nl || 0
    },
    schema: {
        title: "string",
        artist: "string", 
        language: "string (ISO 639-1 code: 'en' for English, 'nl' for Dutch)",
        lyrics: "string (formatted with proper spacing)"
    }
};

// Create enhanced output
const enhancedOutput = {
    metadata: enhancedMetadata,
    lyrics: enhancedLyrics
};

// Save enhanced version
fs.writeFileSync(lyricsPath, JSON.stringify(enhancedOutput, null, 2));

console.log(`\n✅ Enhancement complete!`);
console.log(`📁 Updated: ${lyricsPath}`);
console.log(`🎯 Added language field to all ${enhancedLyrics.length} songs`);
console.log(`🎨 Improved formatting and removed metadata`);

// Create enhancement report
const enhancementReport = {
    timestamp: new Date().toISOString(),
    action: 'lyrics-enhancement',
    songsProcessed: enhancedLyrics.length,
    languageDistribution: languageCounts,
    enhancements: [
        'Added language field (en/nl) to all songs',
        'Improved lyrics formatting with proper spacing',
        'Removed website metadata and navigation text',
        'Detected and preserved verse/chorus structure where possible'
    ],
    newSchema: {
        title: 'Song title',
        artist: 'Artist name (Ilse DeLange or The Common Linnets)',
        language: 'ISO 639-1 language code (en for English, nl for Dutch)',
        lyrics: 'Formatted lyrics text with improved spacing'
    }
};

fs.writeFileSync(
    path.join(__dirname, 'lyrics-enhancement-report.json'),
    JSON.stringify(enhancementReport, null, 2)
);

console.log(`📄 Enhancement report saved: lyrics-enhancement-report.json`);
