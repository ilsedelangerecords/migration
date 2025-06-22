const fs = require('fs');
const path = require('path');

console.log('🎵 Extracting actual song titles from navigation lists...\n');

// Read the raw extracted lyrics data
const rawLyricsPath = path.join(__dirname, 'migration_data', 'extracted_content', 'lyrics.json');
const rawLyrics = JSON.parse(fs.readFileSync(rawLyricsPath, 'utf8'));

// Get a sample of the navigation section to identify the pattern
const sampleEntry = rawLyrics[0];
const lyrics = sampleEntry.lyrics;
const lines = lyrics.split('\n');

console.log('📋 Looking at navigation section pattern from first entry:\n');

// Find where the actual song list starts
let songListStarted = false;
let songTitles = [];

lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // The song list typically starts after "information" lines and includes recognizable song titles
    if (trimmed === "I'm not so though" || 
        (trimmed === "World of hurt" && lines[index-1]?.trim() === "information")) {
        songListStarted = true;
        console.log(`Found song list starting at: "${trimmed}"`);
    }
    
    if (songListStarted) {
        // Print first 30 lines to see the pattern
        if (songTitles.length < 30) {
            console.log(`${songTitles.length + 1}. "${trimmed}"`);
            songTitles.push(trimmed);
        }
    }
});

// Now let's look for actual Ilse DeLange songs that should be there
const knownIlseSongs = [
    "I'm not so tough",  // This might be "I'm not so though" misspelled
    "World of hurt",
    "I'd be yours", 
    "When we don't talk",
    "Flying blind",
    "Livin' on love",
    "I still cry",
    "No reason to be shy",
    "Wouldn't that be something",
    "All the answers",
    "The great escape",
    "The lonely one",
    "Reach for the light",
    "I love you",
    "Snow tonight",
    "So incredible",
    "Miracle",
    "Puzzle me",
    "We're alright",
    "Next to me",
    "Beautiful distraction",
    "Carousel",
    "Almost",
    "DoLuv2LuvU",
    "Hurricane",
    "Winter of love",
    "We are one",
    "Dance on the heartbreak",
    "Learning to swim",
    "Blue Bittersweet",
    "OK",
    "Dear John"
];

const knownTCLSongs = [
    "Calm after the storm",
    "Give me a reason", 
    "Love goes on",
    "Christmas around me",
    "Hungry hands",
    "We don't make the wind blow",
    "Hearts on fire",
    "In your eyes"
];

console.log('\n🎤 Checking which known Ilse DeLange songs are missing from our current data:\n');

// Read current processed data
const processedLyricsPath = path.join(__dirname, 'public', 'content', 'lyrics.json');
const processedLyrics = JSON.parse(fs.readFileSync(processedLyricsPath, 'utf8'));
const currentIlseTitles = processedLyrics.lyrics
    .filter(song => song.artist === 'Ilse DeLange')
    .map(song => song.title.toLowerCase());

const currentTCLTitles = processedLyrics.lyrics
    .filter(song => song.artist === 'The Common Linnets')
    .map(song => song.title.toLowerCase());

const missingIlse = knownIlseSongs.filter(song => 
    !currentIlseTitles.includes(song.toLowerCase())
);

const missingTCL = knownTCLSongs.filter(song => 
    !currentTCLTitles.includes(song.toLowerCase())
);

console.log(`Missing Ilse DeLange songs (${missingIlse.length}):`);
missingIlse.forEach((song, index) => {
    console.log(`${index + 1}. ${song}`);
});

console.log(`\n🎸 Missing The Common Linnets songs (${missingTCL.length}):`);
missingTCL.forEach((song, index) => {
    console.log(`${index + 1}. ${song}`);
});

// Save the list of songs we should try to extract
const targetSongs = {
    missingIlse,
    missingTCL,
    totalMissing: missingIlse.length + missingTCL.length
};

fs.writeFileSync(
    path.join(__dirname, 'target-missing-songs.json'), 
    JSON.stringify(targetSongs, null, 2)
);

console.log(`\n💾 Target missing songs saved to target-missing-songs.json`);
console.log(`📊 Total songs to recover: ${targetSongs.totalMissing}`);

// Now let's see if we need to examine the original HTML files or if there's another source
console.log(`\n🔍 Current status:`);
console.log(`- Have: ${processedLyrics.lyrics.length} songs`);
console.log(`- Need: 161 songs`);
console.log(`- Missing: ${161 - processedLyrics.lyrics.length} songs`);
console.log(`- Identifiable from navigation: ${targetSongs.totalMissing} songs`);

if (targetSongs.totalMissing + processedLyrics.lyrics.length >= 161) {
    console.log(`✅ If we can extract these songs, we should reach our target!`);
} else {
    console.log(`⚠️  We'll still be short by ${161 - (targetSongs.totalMissing + processedLyrics.lyrics.length)} songs`);
}
