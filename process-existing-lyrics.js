const fs = require('fs');
const path = require('path');

console.log('🎵 Processing existing lyrics data...');

// Read the existing lyrics file
const inputPath = path.join(__dirname, 'migration_data', 'extracted_content', 'lyrics.json');
const outputPath = path.join(__dirname, 'public', 'content', 'lyrics.json');

if (!fs.existsSync(inputPath)) {
    console.error('❌ Input lyrics file not found:', inputPath);
    process.exit(1);
}

// Read and parse the existing lyrics data
const rawData = fs.readFileSync(inputPath, 'utf8');
const existingLyrics = JSON.parse(rawData);

console.log(`📊 Found ${existingLyrics.length} songs in existing data`);

// Function to extract clean lyrics from the raw HTML content
function extractCleanLyrics(rawLyrics) {
    if (!rawLyrics || typeof rawLyrics !== 'string') {
        return null;
    }
    
    // Remove the website header and navigation
    let cleaned = rawLyrics.replace(/^﻿\s*/, ''); // Remove BOM
    cleaned = cleaned.replace(/www\.ilsedelangerecords\.nl.*?\n/, '');
    cleaned = cleaned.replace(/Home\s*Album\s*Singles\s*Live.*?\n/, '');
    
    // Split by lines and process
    const lines = cleaned.split('\n');
    const lyricsLines = [];
    let foundLyricsStart = false;
    let foundDisclaimerStart = false;
    
    // Common navigation/metadata patterns to skip
    const skipPatterns = [
        /^(Home|Album|Singles|Live|Other artist|Various artist|Items|Lyrics|TCL|Information|Disclaimer|Help wanted|Wanted|Released:|Catalog number:|Extra:|Top 40:|Top 100:|Record label|This|But|A special thanks)/i,
        /^\d{2}:/, // Track numbers like "01:"
        /^www\./, // Website links
        /Tip parade:/,
        /week \d+/,
        /chart/i,
        /^[A-Z][a-z]+ \d{4}$/, // Dates like "February 2016"
        /^Record label\s*:/,
        /^\d+ weeks?,/,
        /peaks? at number/,
        /No entry/,
        /chart during/,
        /position \d+/,
        /^(Livin'|Clean up|Here I am|The great|Incredible|Next to me|Ilse delange|Eye of|Miracle|After|2in1|2 Original|information|I'm not|I'd be|When we|Flying|No reason|Wouldn't|All the|The lonely|Reach for|I love you|Snow tonight|So incredible|We're alright|Beautiful|Carousel|Almost|DoLuv|Hurricane|Winter|We are|Dance on|Learning|Blue Bitter|When it's|Dear John|Wij -|Rosemary|KANE -|Ruud|Friends|Artiesten|Zucchero|Blof -|Muziek|The Dutch|Leave it|Hoop!|Verzameling|TMF|Behind|The Common|TLC|Paul de|The Boss|Eurovision|Vergeten|An Americana).*$/,
        /^(World of hurt|Livin' on love|Clean up|Here I am|The great escape|Incredible|Next to me|Ilse delange|Eye of the hurricane|Miracle|Afther the hurricane|Ilse delange 2018|The album collection|2in1|2 Original albums|Information|I'm not so though|I'd be yours|When we don't talk|Flying blind|I still cry|No reason to be shy|Wouldn't that be something|All the answers|The lonely one|Reach for the light|Snow tonight|So incredible|We're alright|Beautiful distraction|Carousel|Almost|DoLuv2LuvU|Hurricane|Winter of love|We are one|Dance on the heartbreak|Learning to swim|Blue Bittersweet|When it's you|Dear John|Live|Wij|Rosemary|KANE|Ruud|Friends|Artiesten|Zucchero|Blof|Muziek|The Dutch|Leave it|Hoop|Verzameling|TMF|Behind|The Common|TLC|Paul de|The Boss|Eurovision|Vergeten|An Americana)$/
    ];
    
    for (const line of lines) {
        const trimmed = line.trim();
        
        // Skip empty lines
        if (!trimmed) continue;
        
        // Check if we've hit the disclaimer/navigation section
        if (trimmed === 'Disclaimer' || trimmed.includes('Disclaimer') || 
            trimmed === 'Help wanted' || trimmed === 'Wanted' ||
            trimmed === 'World of hurt' && foundLyricsStart) {
            foundDisclaimerStart = true;
            break;
        }
        
        // Skip if we're in the disclaimer section
        if (foundDisclaimerStart) break;
        
        // Skip lines that match our skip patterns
        let shouldSkip = false;
        for (const pattern of skipPatterns) {
            if (pattern.test(trimmed)) {
                shouldSkip = true;
                break;
            }
        }
        if (shouldSkip) continue;
        
        // Skip album/song title repetitions that appear in navigation
        if (trimmed.length < 50 && (
            trimmed.includes('album') || 
            trimmed.includes('Album') ||
            trimmed.includes('single') ||
            trimmed.includes('Single') ||
            trimmed === 'information' ||
            trimmed === 'Information'
        )) continue;
        
        // If we haven't started collecting lyrics yet, look for the actual song title/first lyrics line
        if (!foundLyricsStart) {
            // Skip obvious metadata lines
            if (trimmed.includes(':') && trimmed.length < 30) continue;
            if (trimmed.match(/^\w+\s+\w+$/)) continue; // Two word titles that might be navigation
            foundLyricsStart = true;
        }
        
        if (foundLyricsStart && !foundDisclaimerStart) {
            lyricsLines.push(trimmed);
        }
    }
    
    // Join the lyrics and clean up
    let lyrics = lyricsLines.join('\n').trim();
    
    // Remove any remaining common navigation elements that might have slipped through
    lyrics = lyrics.replace(/^(Home|Album|Singles|Live|Other artist|Various artist|Items|Lyrics|TCL lyrics)\n?/gmi, '');
    lyrics = lyrics.replace(/\n(Home|Album|Singles|Live|Other artist|Various artist|Items|Lyrics|TCL lyrics)$/gmi, '');
    
    // Clean up any double newlines
    lyrics = lyrics.replace(/\n\n+/g, '\n\n');
    lyrics = lyrics.trim();
    
    // If lyrics are too short or seem to be just metadata, return null
    if (lyrics.length < 30 || lyrics.split('\n').length < 2) {
        return null;
    }
    
    return lyrics || null;
}

// Process the lyrics data
const processedLyrics = [];
const missingSongs = [];
let successCount = 0;

for (const song of existingLyrics) {
    const cleanLyrics = extractCleanLyrics(song.lyrics);
    
    if (cleanLyrics) {
        processedLyrics.push({
            title: song.title,
            artist: song.artist,
            lyrics: cleanLyrics
        });
        successCount++;
        console.log(`✅ Processed: "${song.title}" by ${song.artist}`);
    } else {
        missingSongs.push(`${song.title} (${song.artist})`);
        console.log(`⚠️  Could not extract clean lyrics for: "${song.title}" by ${song.artist}`);
    }
}

// Create the output structure
const output = {
    metadata: {
        extractedAt: new Date().toISOString(),
        totalSongs: existingLyrics.length,
        successfulExtractions: successCount,
        missingSongs: missingSongs.length,
        successRate: Math.round((successCount / existingLyrics.length) * 100),
        artists: [...new Set(existingLyrics.map(song => song.artist))],
        extractionMethod: "processed-from-existing-data"
    },
    lyrics: processedLyrics,
    missingSongs: missingSongs
};

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Write the processed lyrics
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

console.log(`\n✅ Successfully processed ${successCount}/${existingLyrics.length} songs (${output.metadata.successRate}% success rate)`);
console.log(`📁 Output written to: ${outputPath}`);
console.log(`📊 Processing Summary:`);
console.log(`   Total songs processed: ${existingLyrics.length}`);
console.log(`   Successfully processed: ${successCount}`);
console.log(`   Missing clean lyrics: ${missingSongs.length}`);

const artistCounts = {};
processedLyrics.forEach(song => {
    artistCounts[song.artist] = (artistCounts[song.artist] || 0) + 1;
});

Object.entries(artistCounts).forEach(([artist, count]) => {
    console.log(`   ${artist}: ${count} songs`);
});

if (missingSongs.length > 0) {
    console.log(`\n❌ Songs with missing or incomplete lyrics:`);
    missingSongs.slice(0, 10).forEach(song => console.log(`   - ${song}`));
    if (missingSongs.length > 10) {
        console.log(`   ... and ${missingSongs.length - 10} more`);
    }
}
