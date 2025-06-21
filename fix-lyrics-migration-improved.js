#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATION_SOURCE_PATH = path.join(__dirname, 'migration_data/old_website_clone');
const OUTPUT_LYRICS_PATH = path.join(__dirname, 'public/content/lyrics.json');

// Complete list of all songs from both artists with filename mappings for problematic cases
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

// Specific filename mappings for songs that have different filenames
const FILENAME_MAPPINGS = {
  "We dont make the wind blow": ["We don't make the wind blow, lyrics.html", "We don't make the wind blow.html"],
  "Blue bitttersweet": ["Blue bittersweet.html", "Blue Bittersweet single.html"],
  "Sun &shadow": ["Sun & shadow lyricks.html"],
  "Tab dancing on the highwire": ["Tap dancing on the highwire.html"],
  "Engel van m'n hart": ["Engel van m'n hart.html"]
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
  /^the common linnets$/i,
  /^common linnets$/i,
  /^albums$/i,
  /^singles$/i,
  /^live concerts$/i,
  /^band$/i,
  /^biography$/i,
  /^discography$/i,
  /^contact$/i,
  /^home$/i,
  /^main$/i,
  /^index$/i,
  /^navigation$/i,
  /^menu$/i,
  /^copyright$/i,
  /^terms$/i,
  /^privacy$/i,
  /^disclaimer$/i,
  /^search$/i,
  /^site map$/i,
  /^guestbook$/i,
  /^newsletter$/i,
  /^news$/i,
  /^updates$/i,
  /^events$/i,
  /^gallery$/i,
  /^photos$/i,
  /^videos$/i,
  /^media$/i,
  /^press$/i,
  /^links$/i,
  /^downloads$/i,
  /^merchandise$/i,
  /^shop$/i,
  /^store$/i,
  /^fan club$/i,
  /^forum$/i,
  /^chat$/i,
  /^social$/i,
  /^facebook$/i,
  /^twitter$/i,
  /^instagram$/i,
  /^youtube$/i,
  /^spotify$/i,
  /^apple music$/i,
  /^itunes$/i,
  /^amazon$/i,
  /^google play$/i,
  /^deezer$/i,
  /^soundcloud$/i,
  /^bandcamp$/i,
  /^reverbnation$/i,
  /^myspace$/i,
  /^lastfm$/i,
  /^last\.fm$/i,
  /^musicbrainz$/i,
  /^discogs$/i,
  /^allmusic$/i,
  /^wikipedia$/i,
  /^genius$/i,
  /^azlyrics$/i,
  /^lyricsmania$/i,
  /^metrolyrics$/i,
  /^songlyrics$/i,
  /^lyricsmode$/i,
  /^lyricsfreak$/i,
  /^lyricfind$/i,
  /^lyricwiki$/i,
  /^sing365$/i,
  /^elyrics$/i,
  /^stlyrics$/i,
  /^lyricstime$/i,
  /^directlyrics$/i,
  /^lyricsdepot$/i,
  /^lyricsreg$/i,
  /^lyricsworld$/i,
  /^lyricsplanet$/i,
  /^lyricshome$/i
];

function sanitizeTitle(title) {
  if (!title) return null;
  
  // Remove any leading/trailing whitespace
  let sanitized = title.trim();
  
  // Check if this title should be filtered out
  for (const pattern of FILTER_PATTERNS) {
    if (pattern.test(sanitized)) {
      return null;
    }
  }
  
  return sanitized;
}

function findLyricsFile(songTitle, artist) {
  const sourceDir = MIGRATION_SOURCE_PATH;
  
  // First, check if there's a specific filename mapping
  if (FILENAME_MAPPINGS[songTitle]) {
    for (const mappedFilename of FILENAME_MAPPINGS[songTitle]) {
      const filePath = path.join(sourceDir, mappedFilename);
      if (fs.existsSync(filePath)) {
        console.log(`Found (mapped): ${mappedFilename} for "${songTitle}"`);
        return filePath;
      }
    }
  }
  
  // Generate potential filenames
  const potentialFilenames = [
    `${songTitle} lyrics.html`,
    `${songTitle}.html`,
    `${songTitle.toLowerCase()} lyrics.html`,
    `${songTitle.toLowerCase()}.html`,
    // Handle case variations
    `${songTitle.charAt(0).toUpperCase() + songTitle.slice(1).toLowerCase()}.html`,
    `${songTitle.charAt(0).toUpperCase() + songTitle.slice(1).toLowerCase()} lyrics.html`,
  ];
  
  // Try each potential filename
  for (const filename of potentialFilenames) {
    const filePath = path.join(sourceDir, filename);
    if (fs.existsSync(filePath)) {
      console.log(`Found: ${filename} for "${songTitle}"`);
      return filePath;
    }
  }
  
  console.log(`⚠️  Could not find lyrics file for: "${songTitle}" by ${artist}`);
  return null;
}

function extractLyricsFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract all p.Normal spans with C-2 class (the actual lyrics content)
    const lyricsMatches = content.match(/<p class="Normal"><span class="C-2">(.*?)<\/span><\/p>/g);
    
    if (lyricsMatches && lyricsMatches.length > 0) {
      let lyrics = lyricsMatches
        .map(match => {
          // Extract the inner content
          const innerMatch = match.match(/<p class="Normal"><span class="C-2">(.*?)<\/span><\/p>/);
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
      
      // Only return if we have substantial content
      if (lyrics.length > 20) {
        return lyrics;
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return null;
  }
}

function extractSongMetadata(content, songTitle, artist) {
  const metadata = {
    title: songTitle,
    artist: artist,
    album: null,
    year: null,
    writers: null,
    duration: null
  };
  
  // Try to extract additional metadata from the HTML content
  // This is optional and may not be available for all songs
  
  return metadata;
}

function migrateLyrics() {
  console.log('🎵 Starting improved lyrics migration...');
  
  const allSongs = [];
  const missingSongs = [];
  const successfulSongs = [];
  
  // Process each artist
  for (const [artist, songs] of Object.entries(SONG_LIST)) {
    console.log(`📀 Processing ${artist} songs...`);
    
    for (const song of songs) {
      const filePath = findLyricsFile(song, artist);
      
      if (filePath) {
        const lyrics = extractLyricsFromFile(filePath);
        
        if (lyrics) {
          const metadata = extractSongMetadata(null, song, artist);
          
          const songData = {
            ...metadata,
            lyrics: lyrics,
            sourceFile: path.basename(filePath)
          };
          
          const sanitizedTitle = sanitizeTitle(song);
          if (sanitizedTitle) {
            allSongs.push(songData);
            successfulSongs.push(`${song} (${artist})`);
          }
        } else {
          console.log(`⚠️  Could not extract lyrics from file for: "${song}" by ${artist}`);
          missingSongs.push(`${song} (${artist}) - file found but no lyrics extracted`);
        }
      } else {
        missingSongs.push(`${song} (${artist}) - file not found`);
      }
    }
  }
  
  // Write the output
  const outputDir = path.dirname(OUTPUT_LYRICS_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const output = {
    metadata: {
      extractedAt: new Date().toISOString(),
      totalSongs: Object.values(SONG_LIST).flat().length,
      successfulExtractions: allSongs.length,
      missingSongs: missingSongs.length,
      artists: Object.keys(SONG_LIST)
    },
    songs: allSongs,
    missingSongs: missingSongs
  };
  
  fs.writeFileSync(OUTPUT_LYRICS_PATH, JSON.stringify(output, null, 2));
  
  console.log(`✅ Successfully migrated ${allSongs.length}/${Object.values(SONG_LIST).flat().length} songs`);
  console.log(`📁 Output written to: ${OUTPUT_LYRICS_PATH}`);
  console.log(`📊 Migration Summary:`);
  console.log(`   Total songs processed: ${Object.values(SONG_LIST).flat().length}`);
  console.log(`   Successfully migrated: ${allSongs.length}`);
  console.log(`   Missing: ${missingSongs.length}`);
  
  const commonLinnetsCount = allSongs.filter(song => song.artist === 'The Common Linnets').length;
  const ilseCount = allSongs.filter(song => song.artist === 'Ilse DeLange').length;
  
  console.log(`   The Common Linnets: ${commonLinnetsCount} songs`);
  console.log(`   Ilse DeLange: ${ilseCount} songs`);
  
  if (missingSongs.length > 0) {
    console.log(`\n❌ Missing songs details:`);
    missingSongs.forEach(song => console.log(`   - ${song}`));
  }
}

// Run the migration
migrateLyrics();
