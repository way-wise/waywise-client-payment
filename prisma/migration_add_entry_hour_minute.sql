-- Migration: Add entryHour and entryMinute columns to TimeEntry table
-- Run this SQL on your production database

ALTER TABLE "TimeEntry" 
ADD COLUMN IF NOT EXISTS "entryHour" INTEGER,
ADD COLUMN IF NOT EXISTS "entryMinute" INTEGER;

