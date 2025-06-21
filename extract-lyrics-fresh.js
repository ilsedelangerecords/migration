#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_SOURCE_PATH = path.join(__dirname, 'migration_data/old_website_clone');
const OUTPUT_LYRICS_PATH = path.join(__dirname, 'public/content/lyrics.json');

// URL-encoded filename mappings based on GitHub repository structure
const URL_ENCODED_MAPPINGS = {
  // The Common Linnets
  "Arms of salvation": "Arms%20of%20salvation%20lyrics.html",
  "As if only": "As%20if%20only.html", 
  "Before complete surrender": "Before%20complete%20surrender.html",
  "Better than that": "Better%20than%20that.html",
  "Broken but Home": "Broken%20but%20Home.html",
  "Calm after the storm": "Calm%20after%20the%20storm%2C%20lyrics.html",
  "Christmas around me": "Christmas%20around%20me.html",
  "Days of endless time": "Days%20of%20endless%20time.html",
  "Dust of Oklahoma": "Dust%20of%20Oklahoma.html",
  "Give me a reason": "Give%20me%20a%20reason.html",
  "Hearts on fire": "Hearts%20on%20fire%2C%20lyrics.html",
  "Hungry hands": "Hungry%20hands.html",
  "I like it like that": "I%20like%20it%20like%20that.html",
  "In your eyes": "In%20your%20eyes.html",
  "Indigo moon": "Indigo%20moon.html",
  "Jolene": "Jolene.html",
  "Kalverliefde": "Kalverliefde.html",
  "Love goes on": "Love%20goes%20on%2C%20lyrics.html",
  "Lovers & Liars": "Lovers%20%26%20Liars.html",
  "Proud": "Proud.html",
  "Runaway man": "Runaway%20man%2C%20lyrics.html",
  "Soho waltz": "Soho%20waltz.html",
  "Still loving after you": "Still%20loving%20after%20you%2C%20lyrics.html",
  "Sun Song": "Sun%20Song.html",
  "That part": "That%20part.html",
  "Time has no mercy": "Time%20has%20no%20mercy.html",
  "Walls of Jericho": "Walls%20of%20Jericho.html",
  "We dont make the wind blow": "We%20don%E2%80%99t%20make%20the%20wind%20blow%2C%20lyrics.html",
  "When love was king": "When%20love%20was%20king.html",
  "Where do i go with me": "Where%20do%20i%20go%20with%20me%2C%20lyrics.html",

  // Ilse DeLange
  "Adrift": "Adrift.html",
  "All alone": "All%20alone.html",
  "All i got to give": "All%20i%20got%20to%20give.html",
  "All of the women you'll ever need": "All%20of%20the%20women%20you'll%20ever%20need.html",
  "All that you do": "All%20that%20you%20do.html",
  "All the answers": "All%20the%20answers.html",
  "Almost": "Almost.html",
  "Als je iets kan doen": "Als%20je%20iets%20kan%20doen.html",
  "Always overcome": "Always%20overcome.html",
  "Angel eyes": "Angel%20eyes.html",
  "Around again": "Around%20again.html",
  "Back of my mind": "Back%20of%20my%20mind.html",
  "Beatiful distraction": "Beautiful%20distraction.html",
  "Before you let me go": "Before%20you%20let%20me%20go.html",
  "Better then rain": "Better%20then%20rain.html",
  "Beyond gravity": "Beyond%20gravity.html",
  "Blue bitttersweet": "Blue%20bittersweet.html",
  "Blue": "Blue.html",
  "Breathe in, breathe out": "Breathe%20in%2C%20breathe%20out.html",
  "Breathin'": "Breathin'.html",
  "Broken girl": "Broken%20girl.html",
  "But beautiful": "But%20beautiful.html",
  "Carousel": "Carousel.html",
  "Carry hope": "Carry%20hope.html",
  "Child of the wild blue yonder": "Child%20of%20the%20wild%20blue%20yonder.html",
  "Clean up": "Clean%20up.html",
  "Dance on the heartbreak": "Dance%20on%20the%20heartbreak.html",
  "Déjà Vu": "D%C3%A9j%C3%A0%20Vu.html",
  "De oorlog meegemaakt": "De%20oorlog%20meegemaakt.html",
  "Doluv2luvu": "Doluv2luvu.html",
  "Don't you let go of me": "Don%27t%20you%20let%20go%20of%20me.html",
  "Engel van m'n hart": "Engel%20van%20m%E2%80%99n%20hart.html",
  "Everywhere I go": "Everywhere%20I%20go.html",
  "Eyes straight ahead": "Eyes%20straight%20ahead.html",
  "Fall": "Fall.html",
  "Far away": "Far%20away.html",
  "Feels like rain": "Feels%20like%20rain.html",
  "Flying blind": "Flying%20blind.html",
  "Flying solo": "Flying%20solo.html",
  "Fold this world": "Fold%20this%20world.html",
  "Follow": "Follow.html",
  "Good thing": "Good%20thing.html",
  "Have a little faith in me": "Have%20a%20little%20faith%20in%20me.html",
  "Heartbeat": "Heartbeat.html",
  "Heavenless": "Heavenless.html",
  "Here I am": "Here%20I%20am.html",
  "high places": "high%20places.html",
  "Hurricane": "Hurricane.html",
  "I almost believed": "I%20almost%20believed.html",
  "I always will": "I%20always%20will.html",
  "I love you": "I%20love%20you.html",
  "I need for you": "I%20need%20for%20you.html",
  "I still cry": "I%20still%20cry.html",
  "I'd be yours": "I'd%20be%20yours.html",
  "Iedereen is van de wereld": "Iedereen%20is%20van%20de%20wereld.html",
  "If you had the heart": "If%20you%20had%20the%20heart.html",
  "I'll know": "I'll%20know.html",
  "I'm not so tough": "I'm%20not%20so%20tough.html",
  "Inside job": "Inside%20job.html",
  "It'll come to you": "It'll%20come%20to%20you.html",
  "Just kids": "Just%20kids.html",
  "Just like the moon": "Just%20like%20the%20moon.html",
  "Lay Your Weapons Down": "Lay%20Your%20Weapons%20Down.html",
  "Learning to swim": "Learning%20to%20swim.html",
  "Let go": "Let%20go.html",
  "Livin' on love": "Livin'%20on%20love.html",
  "Lonely too": "Lonely%20too.html",
  "Love won't hide": "Love%20won't%20hide.html",
  "Machine people": "Machine%20people.html",
  "Magic": "Magic.html",
  "Man in the moon": "Man%20in%20the%20moon.html",
  "Miracle": "Miracle.html",
  "Miss politician": "Miss%20politician.html",
  "Naked heart": "Naked%20heart.html",
  "New beginning": "New%20beginning.html",
  "Next to me": "Next%20to%20me.html",
  "No more you": "No%20more%20you.html",
  "No reason to be shy": "No%20reason%20to%20be%20shy.html",
  "Nobody really knows": "Nobody%20really%20knows.html",
  "Not waiting for you": "Not%20waiting%20for%20you.html",
  "Nothing left to break": "Nothing%20left%20to%20break.html",
  "OK": "OK.html",
  "Old tears": "Old%20tears.html",
  "Open je ogen": "Open%20je%20ogen.html",
  "Oud geboren": "Oud%20geboren.html",
  "Paper plane": "Paper%20plane.html",
  "Peaceful in mine": "Peaceful%20in%20mine.html",
  "Pirate of your soul": "Pirate%20of%20your%20soul.html",
  "Puzzle me": "Puzzle%20me.html",
  "Reach for the light": "Reach%20for%20the%20light.html",
  "Ride the wind": "Ride%20the%20wind.html",
  "Riding with the king": "Riding%20with%20the%20king.html",
  "Right with you": "Right%20with%20you.html",
  "Runaway": "Runaway.html",
  "Shine": "Shine.html",
  "Snow tonight": "Snow%20tonight.html",
  "So incredible": "So%20incredible.html",
  "Something amazing": "Something%20amazing.html",
  "Something inside so strong": "Something%20inside%20so%20strong.html",
  "Space cowboy": "Space%20cowboy.html",
  "Stay with me": "Stay%20with%20me.html",
  "Sure Pinocchio": "Sure%20Pinocchio.html",
  "Sun &shadow": "Sun%20&shadow.html",
  "Tab dancing on the highwire": "Tab%20dancing%20on%20the%20highwire.html",
  "Thank you": "Thank%20you.html",
  "The Angels Rejoiced Last Night": "The%20Angels%20Rejoiced%20Last%20Night.html",
  "The great escape": "The%20great%20escape.html",
  "The lonely one": "The%20lonely%20one.html",
  "The other side": "The%20other%20side.html",
  "The valley": "The%20valley.html",
  "They say (demo version)": "They%20say%20(demo%20version).html",
  "Time out": "Time%20out.html",
  "Time Will Have To Wait": "Time%20Will%20Have%20To%20Wait.html",
  "Turn around": "Turn%20around.html",
  "Untouchable": "Untouchable.html",
  "Was it love": "Was%20it%20love.html",
  "Watch me go": "Watch%20me.html",
  "Waterfall": "Waterfall.html",
  "We are diamonds": "We%20are%20diamonds.html",
  "We are one": "We%20are%20one.html",
  "We're alright": "We're%20alright.html",
  "What does your heart say now": "What%20does%20your%20heart%20say%20now.html",
  "When": "When.html",
  "When it's you": "When%20it's%20you.html",
  "When we don't talk": "When%20we%20don't%20talk.html",
  "When you put it like that": "When%20you%20put%20it%20like%20that.html",
  "Winter of love": "Winter%20of%20love.html",
  "Without you": "Without%20you.html",
  "World of hurt": "World%20of%20hurt.html",
  "Wouldn't that be something": "Wouldn't%20that%20be%20something.html",
  "You are the dream": "You%20are%20the%20dream.html"
};

// Additional mappings for problematic files based on the URLs you provided
const ADDITIONAL_MAPPINGS = {
  "We dont make the wind blow": [
    "We%20don%E2%80%99t%20make%20the%20wind%20blow,%20lyrics.html",
    "We don't make the wind blow, lyrics.html"
  ],
  "All of the women you'll ever need": [
    "All%20of%20the%20woman%20you'll%20ever%20need.html",
    "All of the woman you'll ever need.html"
  ],
  "Around again": [
    "araound%20again.html",
    "araound again.html",
    "Around again.html"
  ],
  "Better then rain": [
    "Better%20than%20rain.html",
    "Better than rain.html"
  ],
  "Clean up": [
    "Clean%20up%20lyric.html",
    "Clean up lyric.html"
  ],
  "Engel van m'n hart": [
    "Engel%20van%20m%E2%80%99n%20hart.html",
    "Engel van m'n hart.html"
  ],
  "Miracle": [
    "Miracle%20lyric.html",
    "Miracle lyric.html"
  ],
  "Next to me": [
    "Next%20to%20me%20lyric.html",
    "Next to me lyric.html"
  ],  "Tab dancing on the highwire": [
    "Tap%20dancing%20on%20the%20highwire.html",
    "Tap dancing on the highwire.html"
  ],  "Sun &shadow": [
    "Sun & shadow lyricks.html",
    "Sun%20&shadow.html",
    "Sun &shadow.html"
  ]
};

// Song lists by artist
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
 * URL decode a filename
 */
function urlDecode(str) {
  return decodeURIComponent(str);
}

/**
 * Find lyrics file using multiple strategies
 */
function findLyricsFile(songTitle, artist) {
  const sourceDir = MIGRATION_SOURCE_PATH;
  
  // Strategy 1: Try URL-encoded mapping first
  if (URL_ENCODED_MAPPINGS[songTitle]) {
    const encodedFilename = URL_ENCODED_MAPPINGS[songTitle];
    const decodedFilename = urlDecode(encodedFilename);
    
    // Try both encoded and decoded versions
    for (const filename of [encodedFilename, decodedFilename]) {
      const filePath = path.join(sourceDir, filename);
      if (fs.existsSync(filePath)) {
        console.log(`Found (URL mapping): ${filename} for "${songTitle}"`);
        return filePath;
      }
    }
  }
  
  // Strategy 2: Try additional mappings for problematic files
  if (ADDITIONAL_MAPPINGS[songTitle]) {
    for (const mappedFilename of ADDITIONAL_MAPPINGS[songTitle]) {
      const decodedFilename = urlDecode(mappedFilename);
      
      for (const filename of [mappedFilename, decodedFilename]) {
        const filePath = path.join(sourceDir, filename);
        if (fs.existsSync(filePath)) {
          console.log(`Found (additional mapping): ${filename} for "${songTitle}"`);
          return filePath;
        }
      }
    }
  }
  
  // Strategy 3: Try common filename patterns
  const patterns = [
    `${songTitle}.html`,
    `${songTitle} lyrics.html`,
    `${songTitle}, lyrics.html`,
    `${songTitle.toLowerCase()}.html`,
    `${songTitle.toLowerCase()} lyrics.html`
  ];
  
  for (const pattern of patterns) {
    const filePath = path.join(sourceDir, pattern);
    if (fs.existsSync(filePath)) {
      console.log(`Found (pattern): ${pattern} for "${songTitle}"`);
      return filePath;
    }
  }
  
  console.warn(`⚠️  Could not find lyrics file for: "${songTitle}" by ${artist}`);
  return null;
}

/**
 * Extract lyrics from HTML with better spacing preservation
 */
function extractLyricsFromHTML(htmlContent, title) {
  if (!htmlContent) return '';
  
  // Strategy 1: Look for specific HTML patterns with better spacing preservation
  const lyricsMatches = htmlContent.match(/<p class="Normal"><span class="C-[12]">(.*?)<\/span><\/p>/g);
  
  if (lyricsMatches && lyricsMatches.length > 5) { // Need substantial content
    let lyrics = lyricsMatches
      .map(match => {
        const innerMatch = match.match(/<p class="Normal"><span class="C-[12]">(.*?)<\/span><\/p>/);
        if (innerMatch) {
          return innerMatch[1];
        }
        return '';
      })
      .map(line => {
        // Clean up each line while preserving spacing
        return line
          .replace(/<br\s*\/?>/gi, '') // Remove br tags but preserve line structure
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();
      })
      .filter(line => {
        // Filter out metadata lines
        const lineLower = line.toLowerCase();
        return line !== '' && 
               line !== '<br>' && 
               !lineLower.includes('catalog number') && 
               !lineLower.includes('released:') &&
               !lineLower.includes('record label') &&
               line.length > 1;
      });
    
    // Join with proper line breaks and clean up
    const result = lyrics.join('\n')
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newlines
      .trim();
    
    // Only return if we have substantial lyrical content
    if (result.length > 50 && !result.toLowerCase().includes('this was the dutch single')) {
      return result;
    }
  }
  
  // Strategy 2: Fallback to content extraction with better filtering
  let content = htmlContent
    .replace(/<script[^>]*>.*?<\/script>/gis, '')
    .replace(/<style[^>]*>.*?<\/style>/gis, '')
    .replace(/<!--.*?-->/gs, '');
  
  // Remove HTML tags but preserve structure
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
  
  // Split into lines and apply sophisticated filtering
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
    
    // Enhanced filtering for navigation and metadata
    if (lineLower.includes('home') ||
        lineLower.includes('album') ||
        lineLower.includes('singles') ||
        lineLower.includes('facebook') ||
        lineLower.includes('disclaimer') ||
        lineLower.includes('information') ||
        lineLower.includes('javascript') ||
        lineLower.includes('nav_') ||
        lineLower.includes('wpscripts') ||
        lineLower.includes('www.ilsedelangerecords') ||
        lineLower.includes('catalog number') ||
        lineLower.includes('released:') ||
        lineLower.includes('record label') ||
        lineLower.includes('media markt') ||
        lineLower.includes('this was the dutch single') ||
        lineLower.includes('eurovision') ||
        line.length < 3) {
      continue;
    }
    
    // Look for title occurrence to start collecting lyrics
    if (!foundTitle && lineLower.includes(title.toLowerCase().substring(0, 10))) {
      foundTitle = true;
      skipNextLines = 1;
      continue;
    }
    
    // Start collecting lyrics after title found
    if (foundTitle) {
      // Skip obvious non-lyrics patterns
      if (line.match(/^[A-Z\s]{4,}$/) || // All caps headers
          line.match(/^\d+[\.:]\s/) || // Track listings
          line.match(/^\d+$/) || // Just numbers
          line.match(/^[A-Z]{2,4}$/) || // Acronyms
          lineLower.includes('lyrics') && line.length < 20) {
        continue;
      }
      
      lyricsLines.push(line);
    }
  }
  
  // Clean up collected lyrics
  const result = lyricsLines.join('\n')
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize spacing
    .trim();
  
  return result;
}

/**
 * Process a single song
 */
function processSong(title, artist) {
  const filePath = findLyricsFile(title, artist);
  
  if (!filePath) {
    return null;
  }
  
  try {
    const htmlContent = fs.readFileSync(filePath, 'utf8');
    const lyrics = extractLyricsFromHTML(htmlContent, title);
    
    if (lyrics && lyrics.length > 20) { // Reduced minimum threshold for edge cases
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
        sourceFile: path.basename(filePath)
      };
    } else {
      console.warn(`⚠️  Extracted content too short for: "${title}" by ${artist}`);
      return null;
    }
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Main migration function
 */
function migrateLyrics() {
  console.log('🎵 Starting fresh lyrics migration with URL-encoded mappings...\n');
  
  const allLyrics = [];
  const missingSongs = [];
  let foundCount = 0;
  let totalCount = 0;
  
  // Process all songs for both artists
  for (const [artist, songs] of Object.entries(SONG_LIST)) {
    console.log(`\n📀 Processing ${artist} songs...`);
    
    for (const title of songs) {
      totalCount++;
      const lyricsData = processSong(title, artist);
      
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
  
  // Write the output file
  const output = {
    metadata: {
      extractedAt: new Date().toISOString(),
      totalSongs: totalCount,
      successfulExtractions: foundCount,
      missingSongs: missingSongs.length,
      successRate: Math.round((foundCount / totalCount) * 100),
      artists: Object.keys(SONG_LIST),
      extractionMethod: "url-encoded-mapping-with-spacing-preservation"
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
