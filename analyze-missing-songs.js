const fs = require('fs');
const path = require('path');

console.log('🎵 Analyzing lyrics data to identify missing songs...\n');

// Read the raw extracted lyrics data
const rawLyricsPath = path.join(__dirname, 'migration_data', 'extracted_content', 'lyrics.json');
const rawLyrics = JSON.parse(fs.readFileSync(rawLyricsPath, 'utf8'));

// Read the processed lyrics data
const processedLyricsPath = path.join(__dirname, 'public', 'content', 'lyrics.json');
const processedLyrics = JSON.parse(fs.readFileSync(processedLyricsPath, 'utf8'));

console.log(`📊 Raw entries: ${rawLyrics.length}`);
console.log(`📊 Processed entries: ${processedLyrics.lyrics.length}`);
console.log(`📊 Target total: 161 (131 Ilse DeLange + 30 The Common Linnets)\n`);

// Extract all song titles mentioned in the navigation lists
const extractSongTitlesFromNavigation = () => {
    const allMentionedSongs = new Set();
    
    rawLyrics.forEach(entry => {
        const lyrics = entry.lyrics;
        
        // Extract the navigation section (after "information" sections)
        const lines = lyrics.split('\n');
        let inSongList = false;
        
        lines.forEach(line => {
            const trimmed = line.trim();
            
            // Start collecting after seeing multiple "Information" lines
            if (trimmed === "I'm not so though" || trimmed === "World of hurt" || 
                trimmed === "I'd be yours" || trimmed === "When we don't talk") {
                inSongList = true;
            }
            
            // Stop at collaboration/compilation sections
            if (trimmed.includes("Wij - De oorlog") || trimmed.includes("Rosemary's sons") ||
                trimmed.includes("KANE -") || trimmed.includes("Ruud Hermans")) {
                inSongList = false;
            }
            
            if (inSongList && trimmed && 
                !trimmed.includes("Information") && 
                !trimmed.includes("information") &&
                !trimmed.startsWith("Live") &&
                !trimmed.includes("vol.") &&
                trimmed !== "Disclaimer" &&
                trimmed !== "Help wanted" &&
                trimmed !== "Wanted") {
                
                allMentionedSongs.add(trimmed);
            }
        });
    });
    
    return Array.from(allMentionedSongs).sort();
};

// Get current song titles from processed data
const currentSongs = processedLyrics.lyrics.map(song => song.title).sort();
const currentIlseSongs = processedLyrics.lyrics.filter(song => song.artist === 'Ilse DeLange').map(song => song.title).sort();
const currentTCLSongs = processedLyrics.lyrics.filter(song => song.artist === 'The Common Linnets').map(song => song.title).sort();

console.log(`📈 Current Ilse DeLange songs: ${currentIlseSongs.length}/131`);
console.log(`📈 Current The Common Linnets songs: ${currentTCLSongs.length}/30\n`);

// Extract all mentioned songs from navigation
const mentionedSongs = extractSongTitlesFromNavigation();
console.log(`🔍 Total unique songs mentioned in navigation: ${mentionedSongs.length}\n`);

// Find songs mentioned but not extracted
const missingSongs = mentionedSongs.filter(song => 
    !currentSongs.some(current => current.toLowerCase() === song.toLowerCase())
);

console.log(`❌ Songs mentioned but not extracted (${missingSongs.length}):`);
missingSongs.forEach((song, index) => {
    console.log(`${index + 1}. ${song}`);
});

// Common patterns that might indicate Ilse vs TCL songs
const potentialIlseSongs = missingSongs.filter(song => {
    const lower = song.toLowerCase();
    return !lower.includes('tcl') && 
           !lower.includes('common') && 
           !lower.includes('linnets') &&
           !lower.includes('christmas') &&
           !lower.includes('eurovision') &&
           !lower.includes('after the storm'); // This is a TCL album
});

const potentialTCLSongs = missingSongs.filter(song => {
    const lower = song.toLowerCase();
    return lower.includes('tcl') || 
           lower.includes('common') || 
           lower.includes('linnets') ||
           lower.includes('christmas') ||
           lower.includes('eurovision') ||
           lower.includes('after the storm') ||
           song === 'Hungry hands' ||
           song === "We don't make the wind blow";
});

console.log(`\n🎤 Potential missing Ilse DeLange songs (${potentialIlseSongs.length}):`);
potentialIlseSongs.forEach((song, index) => {
    console.log(`${index + 1}. ${song}`);
});

console.log(`\n🎸 Potential missing The Common Linnets songs (${potentialTCLSongs.length}):`);
potentialTCLSongs.forEach((song, index) => {
    console.log(`${index + 1}. ${song}`);
});

// Calculate what we need to reach 161 total
const totalNeeded = 161;
const totalCurrent = processedLyrics.lyrics.length;
const shortfall = totalNeeded - totalCurrent;

console.log(`\n📊 SUMMARY:`);
console.log(`Current total: ${totalCurrent}`);
console.log(`Target total: ${totalNeeded}`);
console.log(`Shortfall: ${shortfall}`);
console.log(`Potential recoverable: ${missingSongs.length}`);

if (missingSongs.length >= shortfall) {
    console.log(`✅ We have enough mentioned songs to potentially reach the target!`);
} else {
    console.log(`⚠️  We may need to investigate other sources for the remaining songs.`);
}

// Export the missing songs list for further processing
const outputData = {
    summary: {
        currentTotal: totalCurrent,
        targetTotal: totalNeeded,
        shortfall: shortfall,
        missingSongsFound: missingSongs.length
    },
    currentSongs: {
        ilse: currentIlseSongs,
        tcl: currentTCLSongs
    },
    missingSongs: {
        all: missingSongs,
        potentialIlse: potentialIlseSongs,
        potentialTCL: potentialTCLSongs
    }
};

const outputPath = path.join(__dirname, 'missing-songs-analysis.json');
fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
console.log(`\n💾 Analysis saved to: ${outputPath}`);
