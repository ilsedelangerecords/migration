-- CreateTable
CREATE TABLE "artists" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "activeFrom" INTEGER,
    "activeTo" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "labels" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "foundedYear" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "releases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "releaseType" TEXT NOT NULL,
    "primaryArtistId" TEXT NOT NULL,
    "releaseDate" DATETIME,
    "labelId" TEXT,
    "description" TEXT,
    "coverId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "releases_primaryArtistId_fkey" FOREIGN KEY ("primaryArtistId") REFERENCES "artists" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "releases_labelId_fkey" FOREIGN KEY ("labelId") REFERENCES "labels" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "editions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "releaseId" TEXT NOT NULL,
    "catalogNumber" TEXT,
    "format" TEXT NOT NULL,
    "region" TEXT,
    "extraNotes" TEXT,
    "coverId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "editions_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "songs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "lyricsId" TEXT,
    "writers" TEXT,
    "isCover" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "songs_lyricsId_fkey" FOREIGN KEY ("lyricsId") REFERENCES "lyrics" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "editionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "songId" TEXT NOT NULL,
    "duration" INTEGER,
    "isBonus" BOOLEAN NOT NULL DEFAULT false,
    "guestArtists" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tracks_editionId_fkey" FOREIGN KEY ("editionId") REFERENCES "editions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "tracks_songId_fkey" FOREIGN KEY ("songId") REFERENCES "songs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lyrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "songId" TEXT,
    "text" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "chart_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "releaseId" TEXT NOT NULL,
    "chartName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "entryDate" DATETIME NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "chart_entries_releaseId_fkey" FOREIGN KEY ("releaseId") REFERENCES "releases" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "description" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "media_assets_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "releases" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "artists_name_key" ON "artists"("name");

-- CreateIndex
CREATE UNIQUE INDEX "labels_name_key" ON "labels"("name");

-- CreateIndex
CREATE UNIQUE INDEX "songs_lyricsId_key" ON "songs"("lyricsId");

-- CreateIndex
CREATE UNIQUE INDEX "tracks_editionId_position_key" ON "tracks"("editionId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "lyrics_songId_key" ON "lyrics"("songId");
