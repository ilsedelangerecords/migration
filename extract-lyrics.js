#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_SOURCE_PATH = path.join(__dirname, 'migration_data/old_website_clone');
const OUTPUT_LYRICS_PATH = path.join(__dirname, 'public/content/lyrics.json');
const PREVIEW_OUTPUT_PATH = path.join(__dirname, 'public/content/lyrics_preview.txt');

// Song data with URL-decoded filenames based on the GitHub repository mapping
const SONGS_DATA = {
  "The Common Linnets": [
    { title: "Arms of salvation", filename: "Arms of salvation lyrics.html" },
    { title: "As if only", filename: "As if only.html" },
    { title: "Before complete surrender", filename: "Before complete surrender.html" },
    { title: "Better than that", filename: "Better than that.html" },
    { title: "Broken but Home", filename: "Broken but Home.html" },
    { title: "Calm after the storm", filename: "Calm after the storm, lyrics.html" },
    { title: "Christmas around me", filename: "Christmas around me.html" },
    { title: "Days of endless time", filename: "Days of endless time.html" },
    { title: "Dust of Oklahoma", filename: "Dust of Oklahoma.html" },
    { title: "Give me a reason", filename: "Give me a reason.html" },
    { title: "Hearts on fire", filename: "Hearts on fire, lyrics.html" },
    { title: "Hungry hands", filename: "Hungry hands.html" },
    { title: "I like it like that", filename: "I like it like that.html" },
    { title: "In your eyes", filename: "In your eyes.html" },
    { title: "Indigo moon", filename: "Indigo moon.html" },
    { title: "Jolene", filename: "Jolene.html" },
    { title: "Kalverliefde", filename: "Kalverliefde.html" },
    { title: "Love goes on", filename: "Love goes on, lyrics.html" },
    { title: "Lovers & Liars", filename: "Lovers & Liars.html" },
    { title: "Proud", filename: "Proud.html" },
    { title: "Runaway man", filename: "Runaway man, lyrics.html" },
    { title: "Soho waltz", filename: "Soho waltz.html" },
    { title: "Still loving after you", filename: "Still loving after you, lyrics.html" },
    { title: "Sun Song", filename: "Sun Song.html" },
    { title: "That part", filename: "That part.html" },
    { title: "Time has no mercy", filename: "Time has no mercy.html" },
    { title: "Walls of Jericho", filename: "Walls of Jericho.html" },
    { title: "We don't make the wind blow", filename: "We don't make the wind blow, lyrics.html" },
    { title: "When love was king", filename: "When love was king.html" },
    { title: "Where do I go with me", filename: "Where do i go with me, lyrics.html" }
  ],
  "Ilse DeLange": [
    { title: "Adrift", filename: "Adrift.html" },
    { title: "All alone", filename: "All alone.html" },
    { title: "All I got to give", filename: "All i got to give.html" },
    { title: "All of the women you'll ever need", filename: "All of the women you'll ever need.html" },
    { title: "All that you do", filename: "All that you do.html" },
    { title: "All the answers", filename: "All the answers.html" },
    { title: "Almost", filename: "Almost.html" },
    { title: "Als je iets kan doen", filename: "Als je iets kan doen.html" },
    { title: "Always overcome", filename: "Always overcome.html" },
    { title: "Angel eyes", filename: "Angel eyes.html" },
    { title: "Around again", filename: "Around again.html" },
    { title: "Back of my mind", filename: "Back of my mind.html" },
    { title: "Beautiful distraction", filename: "Beautiful distraction.html" },
    { title: "Before you let me go", filename: "Before you let me go.html" },
    { title: "Better then rain", filename: "Better then rain.html" },
    { title: "Beyond gravity", filename: "Beyond gravity.html" },
    { title: "Blue bittersweet", filename: "Blue bittersweet.html" },
    { title: "Blue", filename: "Blue.html" },
    { title: "Breathe in, breathe out", filename: "Breathe in, breathe out.html" },
    { title: "Breathin'", filename: "Breathin'.html" },
    { title: "Broken girl", filename: "Broken girl.html" },
    { title: "But beautiful", filename: "But beautiful.html" },
    { title: "Carousel", filename: "Carousel.html" },
    { title: "Carry hope", filename: "Carry hope.html" },
    { title: "Child of the wild blue yonder", filename: "Child of the wild blue yonder.html" },
    { title: "Clean up", filename: "Clean up.html" },
    { title: "Dance on the heartbreak", filename: "Dance on the heartbreak.html" },
    { title: "Déjà Vu", filename: "Déjà Vu.html" },
    { title: "De oorlog meegemaakt", filename: "De oorlog meegemaakt.html" },
    { title: "Doluv2luvu", filename: "Doluv2luvu.html" },
    { title: "Don't you let go of me", filename: "Don't you let go of me.html" },
    { title: "Engel van m'n hart", filename: "Engel van m'n hart.html" },
    { title: "Everywhere I go", filename: "Everywhere I go.html" },
    { title: "Eyes straight ahead", filename: "Eyes straight ahead.html" },
    { title: "Fall", filename: "Fall.html" },
    { title: "Far away", filename: "Far away.html" },
    { title: "Feels like rain", filename: "Feels like rain.html" },
    { title: "Flying blind", filename: "Flying blind.html" },
    { title: "Flying solo", filename: "Flying solo.html" },
    { title: "Fold this world", filename: "Fold this world.html" },
    { title: "Follow", filename: "Follow.html" },
    { title: "Good thing", filename: "Good thing.html" },
    { title: "Have a little faith in me", filename: "Have a little faith in me.html" },
    { title: "Heartbeat", filename: "Heartbeat.html" },
    { title: "Heavenless", filename: "Heavenless.html" },
    { title: "Here I am", filename: "Here I am.html" },
    { title: "High places", filename: "high places.html" },
    { title: "Hurricane", filename: "Hurricane.html" },
    { title: "I almost believed", filename: "I almost believed.html" },
    { title: "I always will", filename: "I always will.html" },
    { title: "I love you", filename: "I love you.html" },
    { title: "I need for you", filename: "I need for you.html" },
    { title: "I still cry", filename: "I still cry.html" },
    { title: "I'd be yours", filename: "I'd be yours.html" },
    { title: "Iedereen is van de wereld", filename: "Iedereen is van de wereld.html" },
    { title: "If you had the heart", filename: "If you had the heart.html" },
    { title: "I'll know", filename: "I'll know.html" },
    { title: "I'm not so tough", filename: "I'm not so tough.html" },
    { title: "Inside job", filename: "Inside job.html" },
    { title: "It'll come to you", filename: "It'll come to you.html" },
    { title: "Just kids", filename: "Just kids.html" },
    { title: "Just like the moon", filename: "Just like the moon.html" },
    { title: "Lay Your Weapons Down", filename: "Lay Your Weapons Down.html" },
    { title: "Learning to swim", filename: "Learning to swim.html" },
    { title: "Let go", filename: "Let go.html" },
    { title: "Livin' on love", filename: "Livin' on love.html" },
    { title: "Lonely too", filename: "Lonely too.html" },
    { title: "Love won't hide", filename: "Love won't hide.html" },
    { title: "Machine people", filename: "Machine people.html" },
    { title: "Magic", filename: "Magic.html" },
    { title: "Man in the moon", filename: "Man in the moon.html" },
    { title: "Miracle", filename: "Miracle.html" },
    { title: "Miss politician", filename: "Miss politician.html" },
    { title: "Naked heart", filename: "Naked heart.html" },
    { title: "New beginning", filename: "New beginning.html" },
    { title: "Next to me", filename: "Next to me.html" },
    { title: "No more you", filename: "No more you.html" },
    { title: "No reason to be shy", filename: "No reason to be shy.html" },
    { title: "Nobody really knows", filename: "Nobody really knows.html" },
    { title: "Not waiting for you", filename: "Not waiting for you.html" },
    { title: "Nothing left to break", filename: "Nothing left to break.html" },
    { title: "OK", filename: "OK.html" },
    { title: "Old tears", filename: "Old tears.html" },
    { title: "Open je ogen", filename: "Open je ogen.html" },
    { title: "Oud geboren", filename: "Oud geboren.html" },
    { title: "Paper plane", filename: "Paper plane.html" },
    { title: "Peaceful in mine", filename: "Peaceful in mine.html" },
    { title: "Pirate of your soul", filename: "Pirate of your soul.html" },
    { title: "Puzzle me", filename: "Puzzle me.html" },
    { title: "Reach for the light", filename: "Reach for the light.html" },
    { title: "Ride the wind", filename: "Ride the wind.html" },
    { title: "Riding with the king", filename: "Riding with the king.html" },
    { title: "Right with you", filename: "Right with you.html" },
    { title: "Runaway", filename: "Runaway.html" },
    { title: "Shine", filename: "Shine.html" },
    { title: "Snow tonight", filename: "Snow tonight.html" },
    { title: "So incredible", filename: "So incredible.html" },
    { title: "Something amazing", filename: "Something amazing.html" },
    { title: "Something inside so strong", filename: "Something inside so strong.html" },
    { title: "Space cowboy", filename: "Space cowboy.html" },
    { title: "Stay with me", filename: "Stay with me.html" },
    { title: "Sure Pinocchio", filename: "Sure Pinocchio.html" },
    { title: "Sun & shadow", filename: "Sun &shadow.html" },
    { title: "Tab dancing on the highwire", filename: "Tab dancing on the highwire.html" },
    { title: "Thank you", filename: "Thank you.html" },
    { title: "The Angels Rejoiced Last Night", filename: "The Angels Rejoiced Last Night.html" },
    { title: "The great escape", filename: "The great escape.html" },
    { title: "The lonely one", filename: "The lonely one.html" },
    { title: "The other side", filename: "The other side.html" },
    { title: "The valley", filename: "The valley.html" },
    { title: "They say (demo version)", filename: "They say (demo version).html" },
    { title: "Time out", filename: "Time out.html" },
    { title: "Time Will Have To Wait", filename: "Time Will Have To Wait.html" },
    { title: "Turn around", filename: "Turn around.html" },
    { title: "Untouchable", filename: "Untouchable.html" },
    { title: "Was it love", filename: "Was it love.html" },
    { title: "Watch me go", filename: "Watch me go.html" },
    { title: "Waterfall", filename: "Waterfall.html" },
    { title: "We are diamonds", filename: "We are diamonds.html" },
    { title: "We are one", filename: "We are one.html" },
    { title: "We're alright", filename: "We're alright.html" },
    { title: "What does your heart say now", filename: "What does your heart say now.html" },
    { title: "When", filename: "When.html" },
    { title: "When it's you", filename: "When it's you.html" },
    { title: "When we don't talk", filename: "When we don't talk.html" },
    { title: "When you put it like that", filename: "When you put it like that.html" },
    { title: "Winter of love", filename: "Winter of love.html" },
    { title: "Without you", filename: "Without you.html" },
    { title: "World of hurt", filename: "World of hurt.html" },
    { title: "Wouldn't that be something", filename: "Wouldn't that be something.html" },
    { title: "You are the dream", filename: "You are the dream.html" }
  ]
};

/**
 * Extract lyrics from HTML content with preserved formatting
 */
function extractLyricsWithFormatting(htmlContent, title) {
  if (!htmlContent) return null;
  
  // Remove script and style tags completely
  let content = htmlContent
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<!--.*?-->/gs, '');
  
  // Strategy 1: Look for specific patterns (p.Normal with C-1 or C-2 spans)
  const lyricsMatches = content.match(/<p class="Normal"><span class="C-[12]">(.*?)<\/span><\/p>/g);
  
  if (lyricsMatches && lyricsMatches.length > 0) {
    let lyrics = lyricsMatches
      .map(match => {
        const innerMatch = match.match(/<p class="Normal"><span class="C-[12]">(.*?)<\/span><\/p>/);
        if (innerMatch) {
          let line = innerMatch[1];
          // Convert <br> tags to newlines but preserve within-line spacing
          line = line.replace(/<br\s*\/?>/gi, '\n');
          // Clean HTML entities but preserve spacing
          line = line
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
          return line;
        }
        return '';
      })
      .filter(line => {
        const trimmed = line.trim();
        return trimmed !== '' && 
               !trimmed.toLowerCase().includes('catalog number') && 
               !trimmed.toLowerCase().includes('released:') &&
               !trimmed.toLowerCase().includes('record label');
      })
      .join('\n')
      .trim();
    
    if (lyrics.length > 20) {
      return lyrics;
    }
  }
  
  // Strategy 2: Fallback - strip HTML but preserve line structure
  content = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Split into lines and filter
  const lines = content.split('\n')
    .map(line => line.trim())
    .filter(line => {
      if (line.length < 3) return false;
      const lower = line.toLowerCase();
      return !lower.includes('home') &&
             !lower.includes('album') &&
             !lower.includes('singles') &&
             !lower.includes('facebook') &&
             !lower.includes('javascript') &&
             !lower.includes('catalog number') &&
             !lower.includes('released:') &&
             !lower.includes('record label') &&
             !lower.includes('www.ilsedelangerecords');
    });
  
  // Find lyrics content after title
  let foundTitle = false;
  let lyricsLines = [];
  
  for (const line of lines) {
    if (!foundTitle && line.toLowerCase().includes(title.toLowerCase())) {
      foundTitle = true;
      continue;
    }
    
    if (foundTitle) {
      // Skip obvious non-lyrics patterns
      if (line.match(/^[A-Z\s]{3,}$/) || // All caps headers
          line.match(/^\d+$/) || // Just numbers
          line.match(/^[A-Z]{2,4}$/)) { // Acronyms
        continue;
      }
      lyricsLines.push(line);
    }
  }
  
  return lyricsLines.join('\n').trim();
}

/**
 * Process a single song
 */
function processSong(songData, artist) {
  const { title, filename } = songData;
  const filePath = path.join(MIGRATION_SOURCE_PATH, filename);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${filename} for "${title}"`);
    return null;
  }
  
  try {
    const htmlContent = fs.readFileSync(filePath, 'utf8');
    const lyrics = extractLyricsWithFormatting(htmlContent, title);
    
    if (lyrics && lyrics.length > 20) {
      console.log(`✅ Extracted: "${title}" by ${artist}`);
      return {
        id: title.toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/--+/g, '-'),
        title: title,
        artist: artist,
        content: lyrics,
        language: /[àáâãäåçèéêëìíîïñòóôõöùúûüý]/i.test(lyrics) || 
                 /\b(de|het|een|en|van|voor|naar|met|op|in|aan|door|over|onder|tussen|bij|na|zonder|tegen)\b/i.test(lyrics) ? "nl" : "en",
        verified: false,
        source: "migration",
        sourceFile: filename
      };
    } else {
      console.warn(`⚠️  No lyrics found in: ${filename} for "${title}"`);
      return null;
    }
  } catch (error) {
    console.error(`❌ Error reading ${filename}:`, error.message);
    return null;
  }
}

/**
 * Generate preview file for human verification
 */
function generatePreview(extractedLyrics) {
  let preview = `LYRICS EXTRACTION PREVIEW\n`;
  preview += `Generated: ${new Date().toISOString()}\n`;
  preview += `Total songs extracted: ${extractedLyrics.length}\n`;
  preview += `${'='.repeat(80)}\n\n`;
  
  for (const song of extractedLyrics) {
    preview += `TITLE: ${song.title}\n`;
    preview += `ARTIST: ${song.artist}\n`;
    preview += `LANGUAGE: ${song.language}\n`;
    preview += `SOURCE: ${song.sourceFile}\n`;
    preview += `${'-'.repeat(40)}\n`;
    preview += `${song.content}\n`;
    preview += `${'='.repeat(80)}\n\n`;
  }
  
  return preview;
}

/**
 * Main migration function
 */
function extractAllLyrics() {
  console.log('🎵 Starting comprehensive lyrics extraction...\n');
  
  const extractedLyrics = [];
  const missingSongs = [];
  
  // Process all songs for both artists
  for (const [artist, songs] of Object.entries(SONGS_DATA)) {
    console.log(`\n📀 Processing ${artist} (${songs.length} songs)...`);
    
    for (const songData of songs) {
      const result = processSong(songData, artist);
      
      if (result) {
        extractedLyrics.push(result);
      } else {
        missingSongs.push(`${songData.title} (${artist})`);
      }
    }
  }
  
  // Sort by artist and title
  extractedLyrics.sort((a, b) => {
    if (a.artist !== b.artist) {
      return a.artist.localeCompare(b.artist);
    }
    return a.title.localeCompare(b.title);
  });
  
  // Create output directory
  const outputDir = path.dirname(OUTPUT_LYRICS_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Generate preview file
  const preview = generatePreview(extractedLyrics);
  fs.writeFileSync(PREVIEW_OUTPUT_PATH, preview);
  
  // Create final output
  const totalSongs = Object.values(SONGS_DATA).flat().length;
  const output = {
    metadata: {
      extractedAt: new Date().toISOString(),
      totalSongs: totalSongs,
      successfulExtractions: extractedLyrics.length,
      missingSongs: missingSongs.length,
      successRate: Math.round((extractedLyrics.length / totalSongs) * 100),
      artists: Object.keys(SONGS_DATA),
      extractionMethod: "format-preserving"
    },
    lyrics: extractedLyrics,
    missingSongs: missingSongs
  };
  
  fs.writeFileSync(OUTPUT_LYRICS_PATH, JSON.stringify(output, null, 2));
  
  // Summary
  console.log(`\n✅ Extraction completed!`);
  console.log(`📊 Results: ${extractedLyrics.length}/${totalSongs} songs (${Math.round((extractedLyrics.length / totalSongs) * 100)}% success rate)`);
  console.log(`📁 JSON output: ${OUTPUT_LYRICS_PATH}`);
  console.log(`📄 Preview file: ${PREVIEW_OUTPUT_PATH}`);
  
  const tcl = extractedLyrics.filter(l => l.artist === 'The Common Linnets').length;
  const ilse = extractedLyrics.filter(l => l.artist === 'Ilse DeLange').length;
  console.log(`   The Common Linnets: ${tcl} songs`);
  console.log(`   Ilse DeLange: ${ilse} songs`);
  
  if (missingSongs.length > 0) {
    console.log(`\n❌ Missing songs (${missingSongs.length}):`);
    missingSongs.forEach(song => console.log(`   - ${song}`));
  }
  
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Review the preview file: ${PREVIEW_OUTPUT_PATH}`);
  console.log(`   2. Check formatting and content quality`);
  console.log(`   3. If satisfied, run cleanup script to remove HTML files`);
}

// Run the extraction
extractAllLyrics();
