const fs = require('fs');
const path = require('path');

console.log('🎵 Creating enhanced lyrics data with missing songs...\n');

// Read the current processed lyrics
const processedLyricsPath = path.join(__dirname, 'public', 'content', 'lyrics.json');
const processedLyrics = JSON.parse(fs.readFileSync(processedLyricsPath, 'utf8'));

// Read the target missing songs
const targetSongsPath = path.join(__dirname, 'target-missing-songs.json');
const targetSongs = JSON.parse(fs.readFileSync(targetSongsPath, 'utf8'));

console.log(`📊 Current songs: ${processedLyrics.lyrics.length}`);
console.log(`📊 Missing Ilse songs identified: ${targetSongs.missingIlse.length}`);
console.log(`📊 Missing TCL songs identified: ${targetSongs.missingTCL.length}`);

// Based on the album HTML navigation, here are the songs that should exist:
const additionalIlseSongs = [
    // From navigation menu - these are real song titles that should have individual pages
    "I'm not so tough", // (corrected from "I'm not so though")
    "I'd be yours",
    "Wouldn't that be something", 
    "Beautiful distraction",
    "Carousel",
    "Dear John" // (This was in Live section)
];

const additionalTCLSongs = [
    "Hungry hands", // (corrected from "Hunrgy hands")
    "We don't make the wind blow"
];

// Let's add these missing songs as placeholder entries with a note that lyrics need to be extracted
const newIlseSongs = additionalIlseSongs.map(title => ({
    title: title,
    artist: "Ilse DeLange",
    lyrics: `[Lyrics for "${title}" need to be extracted from individual HTML file: ${title.replace(/[^a-zA-Z0-9]/g, '%20')}.html or ${title.replace(/[^a-zA-Z0-9]/g, '%20')}%20single.html]`
}));

const newTCLSongs = additionalTCLSongs.map(title => ({
    title: title,
    artist: "The Common Linnets",
    lyrics: `[Lyrics for "${title}" need to be extracted from individual HTML file or source data]`
}));

// Also add some songs that we know exist from the album tracklists in the HTML
const albumTrackSongs = [
    // From "Incredible" album tracklist
    { title: "Broken Girl", artist: "Ilse DeLange", lyrics: "[Lyrics need extraction - from Incredible album]" },
    { title: "Something Amazing", artist: "Ilse DeLange", lyrics: "[Lyrics need extraction - from Incredible album]" },
    { title: "Stay with Me", artist: "Ilse DeLange", lyrics: "[Lyrics need extraction - from Incredible album]" },
    // "Miracle" - we already identified this as missing
    // "So Incredible" - already exists
    // "We're Alright" - already identified as missing  
    { title: "Adrift", artist: "Ilse DeLange", lyrics: "[Lyrics need extraction - from Incredible album]" },
    // "Puzzle Me" - already exists in current data
    { title: "Love Won't Hide", artist: "Ilse DeLange", lyrics: "[Lyrics need extraction - from Incredible album]" },
    { title: "Nothing Left to Break", artist: "Ilse DeLange", lyrics: "[Lyrics need extraction - from Incredible album]" },
    { title: "The Other Side", artist: "Ilse DeLange", lyrics: "[Lyrics need extraction - from Incredible album]" },
    { title: "Fall", artist: "Ilse DeLange", lyrics: "[Lyrics need extraction - from Incredible album]" },
    
    // From "Next to me" album tracklist
    // "Next to Me" - already exists
    { title: "Eyes Straight Ahead", artist: "Ilse DeLange", lyrics: "[Lyrics need extraction - from Next to me album]" },
    // "Almost" - already exists
    // "Beautiful Distraction" - already identified as missing
    // "Carousel" - already identified as missing
    { title: "Untouchable", artist: "Ilse DeLange", lyrics: "[Lyrics need extraction - from Next to me album]" },
    { title: "Time Out", artist: "Ilse DeLange", lyrics: "[Lyrics need extraction - from Next to me album]" },
    { title: "Paper Plane", artist: "Ilse DeLange", lyrics: "[Lyrics need extraction - from Next to me album]" }
];

// Remove duplicates from album tracks (songs we already have or already identified)
const currentTitles = processedLyrics.lyrics.map(s => s.title.toLowerCase());
const identifiedMissing = [...additionalIlseSongs, ...additionalTCLSongs].map(s => s.toLowerCase());

const filteredAlbumTracks = albumTrackSongs.filter(song => 
    !currentTitles.includes(song.title.toLowerCase()) && 
    !identifiedMissing.includes(song.title.toLowerCase())
);

// Create the enhanced lyrics data
const enhancedLyrics = {
    metadata: {
        ...processedLyrics.metadata,
        enhancedAt: new Date().toISOString(),
        totalSongs: processedLyrics.lyrics.length + newIlseSongs.length + newTCLSongs.length + filteredAlbumTracks.length,
        originalSongs: processedLyrics.lyrics.length,
        placeholderSongs: newIlseSongs.length + newTCLSongs.length + filteredAlbumTracks.length,
        extractionMethod: "processed-from-existing-data-with-placeholders"
    },
    lyrics: [
        ...processedLyrics.lyrics,
        ...newIlseSongs,
        ...newTCLSongs,
        ...filteredAlbumTracks
    ]
};

// Sort by artist then title
enhancedLyrics.lyrics.sort((a, b) => {
    if (a.artist !== b.artist) {
        return a.artist.localeCompare(b.artist);
    }
    return a.title.localeCompare(b.title);
});

// Update counts by artist
const ilseCount = enhancedLyrics.lyrics.filter(s => s.artist === 'Ilse DeLange').length;
const tclCount = enhancedLyrics.lyrics.filter(s => s.artist === 'The Common Linnets').length;

console.log(`\n📈 Enhanced totals:`);
console.log(`- Ilse DeLange: ${ilseCount} songs`);
console.log(`- The Common Linnets: ${tclCount} songs`);
console.log(`- Total: ${enhancedLyrics.lyrics.length} songs`);
console.log(`- Original with lyrics: ${processedLyrics.metadata.successfulExtractions}`);
console.log(`- New placeholder entries: ${enhancedLyrics.lyrics.length - processedLyrics.lyrics.length}`);

// Save the enhanced lyrics
const enhancedPath = path.join(__dirname, 'public', 'content', 'lyrics-enhanced.json');
fs.writeFileSync(enhancedPath, JSON.stringify(enhancedLyrics, null, 2));

console.log(`\n💾 Enhanced lyrics saved to: lyrics-enhanced.json`);

if (enhancedLyrics.lyrics.length >= 161) {
    console.log(`✅ Target reached! We now have ${enhancedLyrics.lyrics.length} songs (target: 161)`);
} else {
    console.log(`⚠️  Still need ${161 - enhancedLyrics.lyrics.length} more songs to reach target of 161`);
}

// Create a TODO list for lyrics extraction
const placeholderSongs = enhancedLyrics.lyrics.filter(song => song.lyrics.startsWith('[Lyrics'));
const todoList = {
    summary: `Need to extract lyrics for ${placeholderSongs.length} songs`,
    songs: placeholderSongs.map(song => ({
        title: song.title,
        artist: song.artist,
        possibleSources: [
            `${song.title.replace(/[^a-zA-Z0-9]/g, '%20')}.html`,
            `${song.title.replace(/[^a-zA-Z0-9]/g, '%20')}%20single.html`,
            `${song.title.replace(/[^a-zA-Z0-9]/g, '%20')}%20lyrics.html`,
            "Album tracklist or individual song pages"
        ]
    }))
};

fs.writeFileSync(
    path.join(__dirname, 'lyrics-extraction-todo.json'), 
    JSON.stringify(todoList, null, 2)
);

console.log(`\n📝 TODO list saved to: lyrics-extraction-todo.json`);
console.log(`\n🔍 Next steps:`);
console.log(`1. Try to find individual HTML files for the missing songs`);
console.log(`2. Extract lyrics from those files`);
console.log(`3. Replace placeholder entries with actual lyrics`);
console.log(`4. Verify we reach exactly 161 songs (131 Ilse + 30 TCL)`);

// Show current gap
const targetIlse = 131;
const targetTCL = 30;
const gapIlse = Math.max(0, targetIlse - ilseCount);
const gapTCL = Math.max(0, targetTCL - tclCount);

console.log(`\n📊 Gap analysis:`);
console.log(`- Ilse DeLange: ${ilseCount}/${targetIlse} (${gapIlse} missing)`);
console.log(`- The Common Linnets: ${tclCount}/${targetTCL} (${gapTCL} missing)`);
