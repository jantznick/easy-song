-- CreateEnum
CREATE TYPE "MagicCodeType" AS ENUM ('LOGIN', 'EMAIL_VERIFICATION');

-- CreateEnum
CREATE TYPE "SongMode" AS ENUM ('PLAY_MODE', 'STUDY_MODE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "passwordHash" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "playback" JSONB NOT NULL DEFAULT '{"autoplay":false,"autoscroll":true,"loop":false}',
    "display" JSONB NOT NULL DEFAULT '{"fontSize":"medium","defaultTranslation":false,"theme":"dark"}',
    "language" JSONB NOT NULL DEFAULT '{"learning":"Spanish","interface":"English"}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MagicCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "code" VARCHAR(6) NOT NULL,
    "type" "MagicCodeType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MagicCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SongHistory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "song" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "mode" "SongMode" NOT NULL,
    "videoId" TEXT NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE INDEX "MagicCode_email_code_type_idx" ON "MagicCode"("email", "code", "type");

-- CreateIndex
CREATE INDEX "MagicCode_expiresAt_idx" ON "MagicCode"("expiresAt");

-- CreateIndex
CREATE INDEX "SongHistory_userId_playedAt_idx" ON "SongHistory"("userId", "playedAt");

-- CreateIndex
CREATE INDEX "SongHistory_videoId_idx" ON "SongHistory"("videoId");

-- CreateIndex
CREATE INDEX "SongHistory_playedAt_idx" ON "SongHistory"("playedAt");

-- AddForeignKey
ALTER TABLE "UserPreferences" ADD CONSTRAINT "UserPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MagicCode" ADD CONSTRAINT "MagicCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SongHistory" ADD CONSTRAINT "SongHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
