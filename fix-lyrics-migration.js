#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_SOURCE_PATH = path.join(__dirname, '../migration_scripts/migration_data/old_website_clone');
const OUTPUT_LYRICS_PATH = path.join(__dirname, '../public/content/lyrics.json');

// Complete list of all songs from both artists
const SONG_LIST = {
  "The Common Linnets": [
    "Arms of salvation",
    "As if only",
    "Before complete surrender",
    "Better than that",
    "Broken but Home",
    "Calm after the storm",
    "Christmas around me",
    "Days of endless time", 
    "Dust of Oklahoma",
    "Give me a reason",
    "Hearts on fire",
    "Hungry hands",
    "I like it like that",
    "In your eyes",
    "Indigo moon",
    "Jolene",
    "Kalverliefde",
    "Love goes on",
    "Lovers & Liars",
    "Proud",
    "Runaway man",
    "Soho waltz",
    "Still loving after you",
    "Sun Song",
    "That part",
    "Time has no mercy",
    "Walls of Jericho",
    "We dont make the wind blow",
    "When love was king",
    "Where do i go with me"
  ],
  "Ilse DeLange": [
    "Adrift",
    "All alone",
    "All i got to give",
    "All of the women you'll ever need",
    "All that you do",
    "All the answers",
    "Almost",
    "Als je iets kan doen",
    "Always overcome",
    "Angel eyes",
    "Around again",
    "Back of my mind",
    "Beatiful distraction",
    "Before you let me go",
    "Better then rain",
    "Beyond gravity",
    "Blue bitttersweet",
    "Blue",
    "Breathe in, breathe out",
    "Breathin'",
    "Broken girl",
    "But beautiful",
    "Carousel",
    "Carry hope",
    "Child of the wild blue yonder",
    "Clean up",
    "Dance on the heartbreak",
    "Déjà Vu",
    "De oorlog meegemaakt",
    "Doluv2luvu",
    "Don't you let go of me",
    "Engel van m'n hart",
    "Everywhere I go",
    "Eyes straight ahead",
    "Fall",
    "Far away",
    "Feels like rain",
    "Flying blind",
    "Flying solo",
    "Fold this world",
    "Follow",
    "Good thing",
    "Have a little faith in me",
    "Heartbeat",
    "Heavenless",
    "Here I am",
    "high places",
    "Hurricane",
    "I almost believed",
    "I always will",
    "I love you",
    "I need for you",
    "I still cry",
    "I'd be yours",
    "Iedereen is van de wereld",
    "If you had the heart",
    "I'll know",
    "I'm not so tough",
    "Inside job",
    "It'll come to you",
    "Just kids",
    "Just like the moon",
    "Lay Your Weapons Down",
    "Learning to swim",
    "Let go",
    "Livin' on love",
    "Lonely too",
    "Love won't hide",
    "Machine people",
    "Magic",
    "Man in the moon",
    "Miracle",
    "Miss politician",
    "Naked heart",
    "New beginning",
    "Next to me",
    "No more you",
    "No reason to be shy",
    "Nobody really knows",
    "Not waiting for you",
    "Nothing left to break",
    "OK",
    "Old tears",
    "Open je ogen",
    "Oud geboren",
    "Paper plane",
    "Peaceful in mine",
    "Pirate of your soul",
    "Puzzle me",
    "Reach for the light",
    "Ride the wind",
    "Riding with the king",
    "Right with you",
    "Runaway",
    "Shine",
    "Snow tonight",
    "So incredible",
    "Something amazing",
    "Something inside so strong",
    "Space cowboy",
    "Stay with me",
    "Sure Pinocchio",
    "Sun &shadow",
    "Tab dancing on the highwire",
    "Thank you",
    "The Angels Rejoiced Last Night",
    "The great escape",
    "The lonely one",
    "The other side",
    "The valley",
    "They say (demo version)",
    "Time out",
    "Time Will Have To Wait",
    "Turn around",
    "Untouchable",
    "Was it love",
    "Watch me go",
    "Waterfall",
    "We are diamonds",
    "We are one",
    "We're alright",
    "What does your heart say now",
    "When",
    "When it's you",
    "When we don't talk",
    "When you put it like that",
    "Winter of love",
    "Without you",
    "World of hurt",
    "Wouldn't that be something",
    "You are the dream"
  ]
};

/**
 * Convert song title to potential filename patterns
 */
function generateFilenamePatterns(title) {
  const patterns = [];
  
  // Basic cleanup
  const cleaned = title
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/&/g, 'and');
  
  // Pattern 1: exact title + lyrics.html
  patterns.push(`${title} lyrics.html`);
  patterns.push(`${title}, lyrics.html`);
  
  // Pattern 2: title + .html
  patterns.push(`${title}.html`);
  
  // Pattern 3: cleaned variants
  patterns.push(`${cleaned} lyrics.html`);
  patterns.push(`${cleaned}.html`);
  
  return patterns;
}

/**
 * Extract clean lyrics content from HTML
 */
function extractLyricsFromHTML(htmlContent, title) {
  if (!htmlContent) return '';
  
  // Remove script and style tags
  let content = htmlContent
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<!--.*?-->/gs, '');
  
  // Remove HTML tags but preserve line breaks
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
  
  // Split into lines and clean up
  const lines = content.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  const lyricsLines = [];
  let foundTitle = false;
  let skipNextLines = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();
    
    if (skipNextLines > 0) {
      skipNextLines--;
      continue;
    }
    
    // Skip navigation and metadata
    if (lineLower.includes('home') ||
        lineLower.includes('album') ||
        lineLower.includes('singles') ||
        lineLower.includes('facebook') ||
        lineLower.includes('disclaimer') ||
        lineLower.includes('help wanted') ||
        lineLower.includes('wanted') ||
        lineLower.includes('information') ||
        lineLower.includes('javascript') ||
        lineLower.includes('setmenus') ||
        lineLower.includes('setrollovers') ||
        lineLower.includes('activebutton') ||
        lineLower.includes('nav_') ||
        lineLower.includes('wpscripts') ||
        lineLower.includes('wpimages') ||
        lineLower.includes('background') ||
        lineLower.includes('font-') ||
        lineLower.includes('color:') ||
        lineLower.includes('position:') ||
        lineLower.includes('display:') ||
        lineLower.includes('margin:') ||
        lineLower.includes('padding:') ||
        lineLower.includes('www.ilsedelangerecords') ||
        line.length < 3) {
      continue;
    }
    
    // Look for title occurrence
    if (!foundTitle && lineLower.includes(title.toLowerCase())) {
      foundTitle = true;
      skipNextLines = 2; // Skip a few lines after title
      continue;
    }
    
    // Start collecting lyrics after title found
    if (foundTitle) {
      // Skip obvious non-lyrics patterns
      if (line.match(/^[A-Z\s]{3,}$/) || // All caps headers
          lineLower.includes('lyrics') && line.length < 20 ||
          line.match(/^\d+$/) || // Just numbers
          line.match(/^[A-Z]{2,4}$/) // Acronyms like TCL
         ) {
        continue;
      }
      
      lyricsLines.push(line);
    }
  }
  
  return lyricsLines.join('\n').trim();
}

/**
 * Find and process a song file
 */
function findAndProcessSong(title, artist) {
  const patterns = generateFilenamePatterns(title);
  
  for (const pattern of patterns) {
    const filePath = path.join(MIGRATION_SOURCE_PATH, pattern);
    
    if (fs.existsSync(filePath)) {
      console.log(`Found: ${pattern} for "${title}"`);
      
      try {
        const htmlContent = fs.readFileSync(filePath, 'utf8');
        const lyrics = extractLyricsFromHTML(htmlContent, title);
        
        if (lyrics && lyrics.length > 50) { // Minimum viable lyrics length
          return {
            id: title.toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/--+/g, '-'),
            title: title,
            artist: artist,
            album: "",
            content: lyrics,
            language: /[àáâãäåçèéêëìíîïñòóôõöùúûüý]/i.test(lyrics) || 
                    /\b(de|het|een|en|van|voor|naar|met|op|in|aan|door|over|onder|tussen|bij|na|zonder|tegen)\b/i.test(lyrics) ? "nl" : "en",
            verified: false,
            source: "migration"
          };
        }
      } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
      }
    }
  }
  
  console.warn(`⚠️  Could not find lyrics file for: "${title}" by ${artist}`);
  return null;
}

/**
 * Main migration function
 */
function migrateLyrics() {
  console.log('🎵 Starting comprehensive lyrics migration...\n');
  
  const allLyrics = [];
  let foundCount = 0;
  let totalCount = 0;
  
  // Process all songs for both artists
  for (const [artist, songs] of Object.entries(SONG_LIST)) {
    console.log(`\n📀 Processing ${artist} songs...`);
    
    for (const title of songs) {
      totalCount++;
      const lyricsData = findAndProcessSong(title, artist);
      
      if (lyricsData) {
        allLyrics.push(lyricsData);
        foundCount++;
      }
    }
  }
  
  // Sort by artist and title
  allLyrics.sort((a, b) => {
    if (a.artist !== b.artist) {
      return a.artist.localeCompare(b.artist);
    }
    return a.title.localeCompare(b.title);
  });
  
  // Write the output file
  try {
    fs.writeFileSync(OUTPUT_LYRICS_PATH, JSON.stringify(allLyrics, null, 2));
    console.log(`\n✅ Successfully migrated ${foundCount}/${totalCount} songs`);
    console.log(`📁 Output written to: ${OUTPUT_LYRICS_PATH}`);
    
    // Summary
    console.log('\n📊 Migration Summary:');
    console.log(`   Total songs processed: ${totalCount}`);
    console.log(`   Successfully migrated: ${foundCount}`);
    console.log(`   Missing: ${totalCount - foundCount}`);
    
    const tcl = allLyrics.filter(l => l.artist === 'The Common Linnets').length;
    const ilse = allLyrics.filter(l => l.artist === 'Ilse DeLange').length;
    console.log(`   The Common Linnets: ${tcl} songs`);
    console.log(`   Ilse DeLange: ${ilse} songs`);
    
  } catch (error) {
    console.error('❌ Error writing output file:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateLyrics();
