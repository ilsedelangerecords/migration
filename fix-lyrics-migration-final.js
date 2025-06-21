#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_SOURCE_PATH = path.join(__dirname, 'migration_data/old_website_clone');
const OUTPUT_LYRICS_PATH = path.join(__dirname, 'public/content/lyrics.json');

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
    "Sure Pinocchio",    "Sun &shadow",
    "Tap dancing on the highwire",
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

// Specific filename mappings for songs that have different filenames
const FILENAME_MAPPINGS = {
  "We dont make the wind blow": ["We don’t make the wind blow, lyrics.html"],
  "Blue bitttersweet": ["Blue bittersweet.html", "Blue Bittersweet single.html"],
  "Sun &shadow": ["Sun & shadow lyricks.html"],
  "Tap dancing on the highwire": ["Tap dancing on the highwire.html"],  "Engel van m'n hart": ["Engel van m’n hart.html"],
  "Broken but Home": ["Broken but Home, lyrics.html"],
  "All of the women you'll ever need": ["All of the woman you'll ever need.html"],
  "Around again": ["araound again.html"],
  "Better then rain": ["Better than rain.html"],
  "Clean up": ["Clean up lyric.html"],
  "Miracle": ["Miracle lyric.html"],
  "Next to me": ["Next to me lyric.html"],
  "No reason to be shy": ["No reason to be shy.html"]
};

// Common navigation and website footer patterns to filter out
const FILTER_PATTERNS = [
  /^live$/i,
  /^other artist$/i,
  /^various artist$/i,
  /^items$/i,
  /^tcl other$/i,
  /^tcl various$/i,
  /^world of hurt$/i,
  /^livin['\s]*on love$/i,
  /^clean up$/i,
  /^here i am$/i,
  /^the great escape$/i,
  /^incredible$/i,
  /^next to me$/i,
  /^ilse delange$/i,
  /^eye of the hurricane$/i,
  /^miracle$/i,
  /^afther the hurricane$/i,
  /^ilse delange 2018$/i,
  /^2in1$/i,
  /^i['\s]*m not so though$/i,
  /^i['\s]*d be yours$/i,
  /^when we don['\s]*t talk$/i,
  /^flying blind$/i,
  /^i still cry$/i,
  /^no reason to be shy$/i,
  /^wouldn['\s]*t that be something$/i,
  /^all the answers$/i,
  /^the lonely one$/i,
  /^reach for the light$/i,
  /^i love you$/i,
  /^snow tonight$/i,
  /^so incredible$/i,
  /^puzzle me$/i,
  /^we['\s]*re alright$/i,
  /^beautiful distraction$/i,
  /^carousel$/i,
  /^almost$/i,
  /^doluv2luvu$/i,
  /^hurricane$/i,
  /^winter of love$/i,
  /^we are one$/i,
  /^dance on the heartbreak$/i,
  /^learning to swim$/i,
  /^blue bittersweet$/i,
  /^when it['\s]*s you$/i,
  /^dear john$/i,
  /^live \(in amsterdam\)$/i,
  /^live in ahoy$/i,
  /^live in gelredome$/i,
  /^information$/i,
  /^wij - de oorlog meegemaakt$/i,
  /^rosemary['\s]*s sons - shine$/i,
  /^kane - before you let me go$/i,
  /^ruud hermans - stills$/i,
  /^friends for war child\.04$/i,
  /^artiesten voor azie$/i,
  /^zucchero - blue$/i,
  /^kane - high places$/i,
  /^blof - open je ogen$/i,
  /^muziek \d+ daagse$/i,
  /^the dutch country top 100/i,
  /^muziek \d+ daagse - \d+ jaar hits$/i,
  /^leave it up to love$/i,
  /^live on stage, vol\. i$/i,
  /^hoop!$/i,
  /^verzameling nederlande hits$/i,
  /^tmf awards \d+$/i,
  /^friends for war child$/i,
  /^behind the scene$/i,
  /^the common linnets$/i,
  /^calm after the storm$/i,
  /^give me a reason$/i,
  /^love goes on$/i,
  /^christmas around me$/i,
  /^hunrgy hands$/i,
  /^we don['\s]*t make the wind blow$/i,
  /^hearts on fire$/i,
  /^in your eyes$/i,
  /^paul de leeuw - kalverliefde$/i,
  /^the bosshoss - jolene$/i,
  /^the bosshoss - i like it like that$/i,
  /^after the storm$/i,
  /^eurovision song contest$/i,
  /^vergeten lietjes$/i,
  /^an americana christmas$/i,
  /^disclaimer$/i,
  /^help wanted$/i,
  /^wanted$/i
];

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
  
  // Pattern 4: case variations
  patterns.push(`${title.charAt(0).toUpperCase() + title.slice(1).toLowerCase()}.html`);
  patterns.push(`${title.charAt(0).toUpperCase() + title.slice(1).toLowerCase()} lyrics.html`);
  
  return patterns;
}

/**
 * Extract clean lyrics content from HTML using multiple strategies
 */
function extractLyricsFromHTML(htmlContent, title) {
  if (!htmlContent) return '';
    // Strategy 1: Look for specific HTML patterns (p.Normal with C-2 or C-1 spans)
  const lyricsMatches = htmlContent.match(/<p class="Normal[2]?"><span class="C-[12]">(.*?)<\/span><\/p>/g);
  
  if (lyricsMatches && lyricsMatches.length > 0) {
    let lyrics = lyricsMatches      .map(match => {
        const innerMatch = match.match(/<p class="Normal[2]?"><span class="C-[12]">(.*?)<\/span><\/p>/);
        if (innerMatch) {
          return innerMatch[1];
        }
        return '';
      })
      .filter(line => line.trim() !== '' && line !== '<br>') // Filter out empty lines and standalone <br> tags
      .map(line => {
        // Clean up each line
        return line
          .replace(/<br\s*\/?>/gi, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();
      })
      .filter(line => line !== '') // Remove any remaining empty lines
      .join('\n');
    
    // Only return if we have substantial content and it looks like lyrics
    if (lyrics.length > 20 && !lyrics.toLowerCase().includes('catalog number') && !lyrics.toLowerCase().includes('released:')) {
      return lyrics;
    }
  }
  
  // Strategy 2: Fall back to the original approach (strip all HTML and filter)
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
        lineLower.includes('catalog number') ||
        lineLower.includes('released:') ||
        lineLower.includes('record label') ||
        line.length < 3) {
      continue;
    }
    
    // Check against filter patterns
    let shouldFilter = false;
    for (const pattern of FILTER_PATTERNS) {
      if (pattern.test(line)) {
        shouldFilter = true;
        break;
      }
    }
    if (shouldFilter) continue;
    
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
  
  // Additional cleanup: remove trailing navigation/metadata
  while (lyricsLines.length > 0) {
    const lastLine = lyricsLines[lyricsLines.length - 1];
    let shouldRemove = false;
    
    for (const pattern of FILTER_PATTERNS) {
      if (pattern.test(lastLine)) {
        shouldRemove = true;
        break;
      }
    }
    
    if (shouldRemove) {
      lyricsLines.pop();
    } else {
      break;
    }
  }
  
  return lyricsLines.join('\n').trim();
}

/**
 * Find and process a song file
 */
function findAndProcessSong(title, artist) {
  // Special case handlers for problematic character encodings
  const specialCases = {
    "We dont make the wind blow": "We don’t make the wind blow, lyrics.html",
    "Engel van m'n hart": "Engel van m’n hart.html"
  };
  
  if (specialCases[title]) {
    const allFiles = fs.readdirSync(MIGRATION_SOURCE_PATH);
    const exactMatch = allFiles.find(f => f === specialCases[title]);
    
    if (exactMatch) {
      const filePath = path.join(MIGRATION_SOURCE_PATH, exactMatch);
      console.log(`Found (special case): ${exactMatch} for "${title}"`);
      
      try {
        const htmlContent = fs.readFileSync(filePath, 'utf8');
        const lyrics = extractLyricsFromHTML(htmlContent, title);
        
        console.log(`   → Extracted ${lyrics ? lyrics.length : 0} characters from ${exactMatch}`);
        
        if (lyrics && lyrics.length > 50) {
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
            source: "migration",
            sourceFile: exactMatch
          };
        } else {
          console.log(`   → Content too short or filtered out for ${exactMatch}`);
        }
      } catch (error) {
        console.error(`Error reading special case ${filePath}:`, error.message);
      }
    }
  }
  
  // First, check if there's a specific filename mapping
  if (FILENAME_MAPPINGS[title]) {
    for (const mappedFilename of FILENAME_MAPPINGS[title]) {
      const filePath = path.join(MIGRATION_SOURCE_PATH, mappedFilename);
      
      // Try to find the file even if there are character encoding differences
      const allFiles = fs.readdirSync(MIGRATION_SOURCE_PATH);
      const matchingFile = allFiles.find(f => {
        // Normalize both strings for comparison
        const normalizedFile = f.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const normalizedMapping = mappedFilename.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return normalizedFile === normalizedMapping || f === mappedFilename;
      });
      
      if (matchingFile) {
        const actualFilePath = path.join(MIGRATION_SOURCE_PATH, matchingFile);
        console.log(`Found (mapped): ${matchingFile} for "${title}"`);
        
        try {
          const htmlContent = fs.readFileSync(actualFilePath, 'utf8');
          const lyrics = extractLyricsFromHTML(htmlContent, title);
          
          console.log(`   → Extracted ${lyrics ? lyrics.length : 0} characters from ${matchingFile}`);
          
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
              source: "migration",
              sourceFile: matchingFile
            };
          } else {
            console.log(`   → Content too short or filtered out for ${matchingFile}`);
          }
        } catch (error) {
          console.error(`Error reading mapped ${actualFilePath}:`, error.message);
        }
      }
    }
  }
  
  // Generate and try standard filename patterns
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
            source: "migration",
            sourceFile: pattern
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
  console.log('🎵 Starting optimized lyrics migration...\n');
  
  const allLyrics = [];
  const missingSongs = [];
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
      } else {
        missingSongs.push(`${title} (${artist})`);
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
  
  // Create output directory if it doesn't exist
  const outputDir = path.dirname(OUTPUT_LYRICS_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write the output file with enhanced metadata
  const output = {
    metadata: {
      extractedAt: new Date().toISOString(),
      totalSongs: totalCount,
      successfulExtractions: foundCount,
      missingSongs: missingSongs.length,
      successRate: Math.round((foundCount / totalCount) * 100),
      artists: Object.keys(SONG_LIST),
      extractionMethod: "optimized-html-and-fallback"
    },
    lyrics: allLyrics,
    missingSongs: missingSongs
  };
  
  try {
    fs.writeFileSync(OUTPUT_LYRICS_PATH, JSON.stringify(output, null, 2));
    console.log(`\n✅ Successfully migrated ${foundCount}/${totalCount} songs (${Math.round((foundCount / totalCount) * 100)}% success rate)`);
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
    
    if (missingSongs.length > 0) {
      console.log(`\n❌ Missing songs:`);
      missingSongs.forEach(song => console.log(`   - ${song}`));
    }
    
  } catch (error) {
    console.error('❌ Error writing output file:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateLyrics();
