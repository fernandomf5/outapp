I will remove the Video Downloader, Media Converter, and Document Converter features from the app, including their UI components, dashboard sections, and sidebar menu items.

### Technical Details

**1. Remove UI Components:**
- Delete `src/components/VideoDownloaderPanel.tsx`
- Delete `src/components/MediaConverterPanel.tsx`
- Delete `src/components/DocumentConverterPanel.tsx`

**2. Update Sidebar:**
- Remove the following items from `advancedResourcesItems` in `src/components/layout/UserSidebar.tsx`:
    - `video_downloader` (Video Downloader)
    - `media_converter` (Media Converter)
    - `document_converter` (Document Converter)

**3. Update Dashboard:**
- Remove imports and corresponding `TabsContent` sections for:
    - `VideoDownloaderPanel`
    - `MediaConverterPanel`
    - `DocumentConverterPanel`
- Remove references in `src/pages/Dashboard.tsx`

**4. Update Admin Dashboard:**
- Remove feature selection options for these resources in `src/pages/AdminDashboard.tsx`.

**5. Cleanup Edge Functions:**
- Check for and recommend deleting any related Supabase Edge Functions (e.g., `video-downloader`).

This will fully remove these features from the user's view and the codebase.
