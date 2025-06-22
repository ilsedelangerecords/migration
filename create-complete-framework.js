const fs = require('fs');
const path = require('path');

console.log('🎵 Creating missing songs extraction script...\n');

// Read the complete analysis
const analysisPath = path.join(__dirname, 'complete-song-analysis.json');
const analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf8'));

// Read current lyrics
const processedLyricsPath = path.join(__dirname, 'public', 'content', 'lyrics.json');
const processedLyrics = JSON.parse(fs.readFileSync(processedLyricsPath, 'utf8'));

// Function to determine likely artist based on song characteristics
const determineArtist = (songTitle) => {
    const tclIndicators = [
        "Arms of salvation", "As if only", "Before complete surrender", "Better than that",
        "Broken but Home", "Calm after the storm", "Christmas around me", "Days of endless time",
        "Dust of Oklahoma", "Give me a reason", "Hearts on fire", "Hungry hands", "I like it like that",
        "In your eyes", "Indigo moon", "Jolene", "Kalverliefde", "Love goes on", "Lovers & Liars",
        "Proud", "Runaway man", "Soho waltz", "Still loving after you", "Sun Song", "That part",
        "Time has no mercy", "Walls of Jericho", "We don't make the wind blow", "When love was king",
        "Where do i go with me"
    ];
    
    return tclIndicators.includes(songTitle) ? "The Common Linnets" : "Ilse DeLange";
};

// Create placeholder entries for missing songs
const missingIlseSongs = analysis.missingSongs.ilse.map(song => ({
    title: song.title,
    artist: "Ilse DeLange",
    lyrics: `[MISSING: Lyrics need to be extracted from ${song.filename}]\n\nThis song was identified as missing from the original extraction.\nHTML file: ${song.filename}\nExpected in complete 161-song catalog.`,
    extractionStatus: "missing",
    sourceFile: song.filename
}));

const missingTCLSongs = analysis.missingSongs.tcl.map(song => ({
    title: song.title,
    artist: "The Common Linnets", 
    lyrics: `[MISSING: Lyrics need to be extracted from ${song.filename}]\n\nThis song was identified as missing from the original extraction.\nHTML file: ${song.filename}\nExpected in complete 161-song catalog.`,
    extractionStatus: "missing",
    sourceFile: song.filename
}));

// Create enhanced dataset with placeholders
const enhancedLyrics = {
    metadata: {
        extractedAt: new Date().toISOString(),
        totalSongs: processedLyrics.lyrics.length + missingIlseSongs.length + missingTCLSongs.length,
        extractedSongs: processedLyrics.lyrics.length,
        placeholderSongs: missingIlseSongs.length + missingTCLSongs.length,
        targetCompletion: "161 songs (131 Ilse DeLange + 30 The Common Linnets)",
        artists: ["The Common Linnets", "Ilse DeLange"],
        extractionMethod: "processed-with-missing-placeholders",
        completeness: `${processedLyrics.lyrics.length}/161 songs extracted (${Math.round(processedLyrics.lyrics.length/161*100)}%)`
    },
    lyrics: [
        ...processedLyrics.lyrics,
        ...missingIlseSongs,
        ...missingTCLSongs
    ]
};

// Sort by artist then title
enhancedLyrics.lyrics.sort((a, b) => {
    if (a.artist !== b.artist) {
        return a.artist.localeCompare(b.artist);
    }
    return a.title.localeCompare(b.title);
});

// Update counts
const finalIlseCount = enhancedLyrics.lyrics.filter(s => s.artist === 'Ilse DeLange').length;
const finalTCLCount = enhancedLyrics.lyrics.filter(s => s.artist === 'The Common Linnets').length;
const extractedSongs = enhancedLyrics.lyrics.filter(s => !s.lyrics.startsWith('[MISSING:')).length;
const missingSongsCount = enhancedLyrics.lyrics.filter(s => s.lyrics.startsWith('[MISSING:')).length;

console.log(`📊 ENHANCED DATASET CREATED:`);
console.log(`- Total songs: ${enhancedLyrics.lyrics.length}/161`);
console.log(`- Ilse DeLange: ${finalIlseCount} songs`);
console.log(`- The Common Linnets: ${finalTCLCount} songs`);
console.log(`- Extracted lyrics: ${extractedSongs} songs`);
console.log(`- Missing placeholders: ${missingSongsCount} songs`);

// Save enhanced dataset
const enhancedPath = path.join(__dirname, 'public', 'content', 'lyrics-complete-framework.json');
fs.writeFileSync(enhancedPath, JSON.stringify(enhancedLyrics, null, 2));

console.log(`\n💾 Complete framework saved to: lyrics-complete-framework.json`);

// Create extraction instruction list
const extractionInstructions = {
    overview: "Instructions for extracting the remaining 41 songs to achieve 100% parity",
    currentStatus: {
        extracted: extractedSongs,
        missing: missingSongsCount,
        total: 161
    },
    instructions: {
        step1: "Look for individual HTML files in the migration source data",
        step2: "Extract lyrics content from each HTML file",
        step3: "Replace placeholder entries with actual lyrics",
        step4: "Verify final count reaches exactly 161 songs"
    },
    missingFiles: analysis.missingSongs.total.map(song => ({
        title: song.title,
        filename: song.filename,
        expectedArtist: determineArtist(song.title),
        priority: "high"
    }))
};

fs.writeFileSync(
    path.join(__dirname, 'lyrics-extraction-instructions.json'),
    JSON.stringify(extractionInstructions, null, 2)
);

console.log(`📋 Extraction instructions saved to: lyrics-extraction-instructions.json`);

// Check if we can find any of the HTML files in the current directory structure
console.log(`\n🔍 SEARCHING FOR MISSING SONG FILES...`);

const searchForFiles = async () => {
    let filesFound = 0;
    let filesToCheck = [
        ...missingIlseSongs.map(s => s.sourceFile),
        ...missingTCLSongs.map(s => s.sourceFile)
    ];
    
    for (const filename of filesToCheck) {
        // Check if file exists in any common locations
        const possiblePaths = [
            path.join(__dirname, filename),
            path.join(__dirname, 'migration_data', filename),
            path.join(__dirname, 'migration_data', 'old_website_clone', filename),
            path.join(__dirname, 'migration_scripts', filename),
        ];
        
        let found = false;
        for (const checkPath of possiblePaths) {
            if (fs.existsSync(checkPath)) {
                console.log(`✅ Found: ${filename} at ${checkPath}`);
                filesFound++;
                found = true;
                break;
            }
        }
        
        if (!found) {
            // Just note it's missing, don't spam the output
            // console.log(`❌ Missing: ${filename}`);
        }
    }
    
    console.log(`\n📁 Files found: ${filesFound}/${filesToCheck.length}`);
    
    if (filesFound === 0) {
        console.log(`\n⚠️  No HTML files found in current directory structure.`);
        console.log(`   The missing songs may need to be extracted from a different source.`);
        console.log(`   However, we have created a complete framework with placeholders.`);
    }
};

searchForFiles();

console.log(`\n🎯 SUMMARY:`);
console.log(`✅ Created complete 161-song framework`);
console.log(`✅ Identified all ${missingSongsCount} missing songs`);
console.log(`✅ Ready for lyrics extraction when source files are available`);
console.log(`✅ Current extraction represents ${Math.round(extractedSongs/161*100)}% completion`);

if (enhancedLyrics.lyrics.length === 161) {
    console.log(`\n🎉 FRAMEWORK COMPLETE: All 161 songs accounted for!`);
} else {
    console.log(`\n⚠️  Framework total: ${enhancedLyrics.lyrics.length}/161 songs`);
}
