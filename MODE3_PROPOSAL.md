# Mode 3: Study Mode - Implementation Proposal

## Overview
Mode 3 provides a deep-dive learning experience where users can study the meaning, context, and cultural nuances of song lyrics in a structured, section-by-section format.

## Audio Snippet Playback Strategy

### Approach: YouTube Player with Timestamp Seeking
- **Embed a mini YouTube player** at the top of the Study page (collapsible/expandable)
- Use the existing `seekTo()` method from the YouTube API to jump to specific timestamps
- Each line/section will have a **play button** that:
  1. Seeks the player to the line's `start_ms` timestamp
  2. Optionally auto-plays for a short duration (e.g., 3-5 seconds) or until `end_ms`
  3. Can be paused/resumed by the user

### Implementation Details
- Reuse the `react-youtube` component already in use
- Store player reference in a ref (similar to SongPlayerPage)
- Convert `start_ms` to seconds: `start_ms / 1000`
- For multi-line sections, play from first line's start to last line's end
- Add visual feedback (highlighting) when a snippet is playing

### Alternative Consideration
- Could use YouTube's `start` and `end` URL parameters to create embedded clips
- However, `seekTo()` is more flexible and doesn't require separate iframe instances

## Data Structure: Hybrid Approach

### Primary Data Source: Structured Format (sample.json style)
The structured format provides:
- **Section-based organization** (Intro, Verse 1, Chorus, Verse 2, etc.)
- **Section-level explanations** for context
- **Line-level explanations** for detailed meaning
- **Grouped lyrics** that make semantic sense together

### Fallback/Supplement: Original Timestamped Data
To ensure no content is missed:
- Compare structured sections against original timestamped lines
- Identify **gaps** in coverage (time ranges not covered by structured sections)
- Create a **"Additional Content"** or **"Miscellaneous"** section at the bottom
- This section shows any lines from the original data that weren't included in structured sections
- Maintains timestamps for audio playback

### Data Merging Strategy
1. **Load both data sources** (structured + original)
   - Fetch main song file: `/api/songs/:videoId` (contains all timestamped lines)
   - Fetch study file: `/api/songs/:videoId/study` (contains structured sections)
   - If study file doesn't exist, fall back to showing original format
2. **Map structured sections** to time ranges
3. **Identify uncovered time ranges** from original data
   - Compare timestamps in structured sections vs. all lines in main song file
   - Find lines in main file that aren't covered by any structured section
4. **Group uncovered lines** into logical chunks (if possible) or list chronologically
5. **Display structured sections first**, then "Additional Content" section

### Data File Structure
- **Separate folders approach**:
  - Main song file: `data/songs/{videoId}.json` - Contains all timestamped lines for Karaoke mode
  - Study file: `data/study/{videoId}.json` - Contains only structured sections for Study mode
  - Benefits:
    - Smaller data sizes for API fetches (Karaoke doesn't need structured data, Study doesn't need all raw lines)
    - Easier data generation (can generate study data separately)
    - Cleaner separation of concerns
    - Organized folder structure (similar to `raw-lyrics` folder)
- Backend API should have separate endpoint: `/api/songs/:videoId/study` to fetch study data
- Frontend will fetch both files when in Study mode (main song for additional content, study file for structured sections)

### Example Structure
See `backend/SAMPLE_STUDY_FORMAT.json` for the complete example.

```typescript
interface StudySong {
  // ... existing Song fields (videoId, title, artist, thumbnailUrl)
  structuredSections: StructuredSection[];  // From structured format
  // Note: additionalContent is computed at runtime, not stored
}

interface StructuredSection {
  title: string;                    // "Verse 1", "Chorus", "Intro", etc.
  sectionExplanation?: string;      // Overall context for the section
  lines: StructuredLine[];
}

interface StructuredLine {
  spanish: string;
  english: string;
  explanation: string | null;       // null means explanation is in next line
  start_ms: number;                 // For audio playback
  end_ms: number;                   // Play until this timestamp
}
```

### Explanation Grouping Logic
- When `explanation: null`, the explanation is provided in the next line with a non-null explanation
- For audio playback: When playing a line with `explanation: null`, find the first line in that explanation group (the first consecutive line with null before the non-null explanation) and use that line's `start_ms` for playback
- This ensures we play the complete phrase being explained, not just the fragment

## UI/UX Design

### Layout Structure
```
┌─────────────────────────────────────────┐
│  [Back] Song Title              [Karaoke]│
├─────────────────────────────────────────┤
│  [Mini Video Player - Collapsible]      │
│  ┌─────────────────────────────────┐   │
│  │  [YouTube Player - Small]       │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  [Section Navigation Sidebar]           │
│  • Intro                                │
│  • Chorus                               │
│  • Verse 1                              │
│  • Verse 2                              │
│  • Additional Content                   │
├─────────────────────────────────────────┤
│  [Main Content Area]                    │
│  ┌─────────────────────────────────┐   │
│  │  Verse 1                        │   │
│  │  [Section Explanation]          │   │
│  │                                 │   │
│  │  [▶] Spanish line 1             │   │
│  │      English translation        │   │
│  │      Explanation text...        │   │
│  │                                 │   │
│  │  [▶] Spanish line 2             │   │
│  │      ...                        │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Key Features
1. **Section Cards**
   - **All sections collapsed by default**
   - Expandable/collapsible sections
   - Section title with icon
   - Section-level explanation at the top (shown when expanded)
   - Lines listed below
   - Easy way to work through sections one by one (e.g., "Expand Next" button or sequential expansion)

2. **Line Display**
   - Play button (▶) on the left
   - Spanish text (primary, larger)
   - English translation (secondary, italic)
   - Explanation (detailed, smaller text, muted color)
   - **Audio playback**: Plays from the start of the explanation group (if explanation is null, find first line in group) until `end_ms`
   - Visual separation between lines

3. **Section Navigation**
   - Sticky sidebar with section list
   - Click to scroll to section
   - Active section highlighting
   - Scroll spy to show current section

4. **Video Player**
   - Collapsible mini player at top
   - Shows current playback position
   - Can be expanded to larger view
   - Auto-seeks when play button clicked

5. **Additional Content Section**
   - Clearly labeled as "Additional Content" or "Miscellaneous"
   - Same line format as structured sections
   - Grouped by time proximity if possible
   - Note explaining these are parts not in main study sections

## Navigation Flow

### Access Points
1. **From SongPlayerPage (Karaoke Mode)**
   - "Study Mode" button in header
   - Navigates to `/songs/:videoId/study`

2. **From SongListPage**
   - Could add "Study" option on song cards (future enhancement)

3. **Direct URL**
   - `/songs/:videoId/study` route

### Return Navigation
- "Back to Karaoke" button in Study page header
- Breadcrumb navigation option

## Implementation Plan

### Phase 1: Core Structure
1. Create `SongStudyPage.tsx` component
2. Add route `/songs/:videoId/study` in `App.tsx`
3. Add "Study Mode" button to `SongPlayerPage`
4. Update TypeScript types for structured data format

### Phase 2: Data Handling
1. **Backend**: 
   - Add endpoint `/api/songs/:videoId/study` to serve study files
     - Looks for `data/study/{videoId}.json` file
     - Returns 404 if study file doesn't exist (frontend handles gracefully)
2. **Frontend**: Update API utility to fetch study data
   - New function: `fetchStudyData(videoId)`
   - Fetches both main song and study file in parallel
3. Create utility function to merge structured + original data
4. Implement gap detection algorithm (compare timestamps)
5. Handle both scenarios (study file exists vs. doesn't - fallback to original format)

### Phase 3: UI Components
1. Build section card component
2. Build line display component with play button
3. Implement section navigation sidebar
4. Add collapsible mini video player

### Phase 4: Audio Integration
1. Integrate YouTube player with seekTo functionality
2. Implement play button handlers
3. Add visual feedback during playback
4. Handle auto-play duration logic

### Phase 5: Polish
1. Smooth scrolling between sections
2. Active section highlighting
3. Responsive design for mobile
4. Loading states and error handling

## Technical Considerations

### Data Format Detection
- Check if song data has `structuredSections` field
- If yes, use hybrid approach
- If no, fall back to original format (flatten sections)

### Backward Compatibility
- Must work with existing song data (current format)
- Gracefully handle missing structured data
- Show all content regardless of format

### Performance
- Lazy load sections if needed
- Virtual scrolling for very long songs
- Efficient gap detection algorithm

### Future Enhancements
- Bookmarking specific lines/sections
- Notes/highlights feature
- Quiz mode integration (Mode 4)
- Export study notes

## Questions/Decisions - RESOLVED

1. **Audio Playback Duration** ✅
   - **Answer**: Play until `end_ms` since we have it
   - **Important**: Be conscious that `start_ms` might include previous lyrics that had `null` explanation value
   - **Implementation**: When a line has `explanation: null`, find the first line in that explanation group (first line with null before the non-null explanation) and use that line's `start_ms` for playback. This ensures we play the complete phrase being explained.

2. **Section Expansion** ✅
   - **Answer**: All sections collapsed by default
   - **Implementation**: User should have an easy way to work through them one by one (e.g., "Expand Next" button, or sequential expansion)

3. **Additional Content Grouping** ✅
   - **Answer**: TBD - will handle later
   - **Note**: For now, can display chronologically or group by time proximity

4. **Data Generation** ✅
   - **Answer**: Will be part of the data pipeline, handled separately
   - **Implementation**: Given the sample JSON format, the general data format can be modified, or we could have another file that handles it (e.g., `songId.study.json`)

5. **Missing Data Handling** ✅
   - **Answer**: Handle this later
   - **Note**: For now, gracefully handle missing structured data by falling back to original format

## Sample Data Format

See `backend/data/study/KU5V5WZVcVE.json` for a complete example of the expected JSON structure.

### File Structure
- **Main song file**: `backend/data/songs/{videoId}.json` - Contains all timestamped lines for Karaoke mode
- **Study file**: `backend/data/study/{videoId}.json` - Contains only structured sections for Study mode
- Study file is optional - if it doesn't exist, Study mode falls back to original format

### Key points:
- `structuredSections` array contains organized song parts
- Each section has `title`, optional `sectionExplanation`, and `lines` array
- Each line has `spanish`, `english`, `explanation` (can be null), `start_ms`, and `end_ms`
- Explanation grouping: null explanations mean the next non-null explanation covers the group
- Audio playback should start from the first line of an explanation group when playing a line with null explanation
- Study file only needs `videoId`, `title`, `artist`, and `structuredSections` (no need for `thumbnailUrl` or all timestamped lines)

## Next Steps

1. ✅ Review and approve proposal
2. Implement Phase 1 (core structure)
3. Test with existing data
4. Iterate on UI/UX based on feedback
5. Plan data generation pipeline for structured format (separate task)


