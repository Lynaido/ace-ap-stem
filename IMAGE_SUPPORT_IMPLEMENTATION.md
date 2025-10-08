# Image Problem Support Implementation

## Overview
This document describes the implementation of image-based problem solving in the AAS application. Users can now upload images of math/science problems and generate solutions, hints, and concept notes from those images using OpenAI's Vision API.

## Changes Made

### Backend Changes

#### 1. OpenAI Service (`backend/src/services/openaiService.ts`)

**Updated Functions:**
- `generateSolution()` - Added support for image data via Vision API
- `generateHints()` - Added support for image data via Vision API
- `generateConceptNotes()` - Added support for image data via Vision API
- `generateConceptNotesFallback()` - Added imageData parameter for consistency

**New Parameters:**
All three main functions now accept an optional `imageData` parameter:
```typescript
imageData?: { url?: string; base64?: string; mimeType?: string }[]
```

**Key Features:**
- Automatically switches to GPT-4o (vision-capable model) when images are provided
- Converts base64 image data to data URLs for OpenAI API
- Supports multiple images per problem
- Filters for image MIME types only (excludes PDFs from vision processing)
- Enhanced system prompts to instruct the AI to analyze images carefully

**Example Image Message Format:**
```typescript
{
  role: 'user',
  content: [
    {
      type: 'text',
      text: prompt
    },
    {
      type: 'image_url',
      image_url: { 
        url: `data:image/jpeg;base64,${base64Data}` 
      }
    }
  ]
}
```

#### 2. Problems Controller (`backend/src/controllers/problemsController.ts`)

**Updated Functions:**
- `generateSolution()` - Retrieves associated images and passes them to OpenAI
- `generateHints()` - Retrieves associated images and passes them to OpenAI
- `generateConceptNotes()` - Retrieves associated images and passes them to OpenAI

**Implementation Details:**
Each function now:
1. Includes `assets: true` in the Prisma query to fetch associated images
2. Filters assets to only include images (checks `mimeType.startsWith('image/')`)
3. Converts image Buffer data to base64 strings
4. Passes the image data array to the OpenAI service
5. Logs when images are added to the generation process

**Code Pattern:**
```typescript
// Prepare image data if assets exist
let imageData: { url?: string; base64?: string; mimeType?: string }[] | undefined;
if (problem.assets && problem.assets.length > 0) {
  imageData = [];
  for (const asset of problem.assets) {
    if (asset.mimeType.startsWith('image/')) {
      if (asset.fileData) {
        const base64 = asset.fileData.toString('base64');
        imageData.push({
          base64,
          mimeType: asset.mimeType
        });
        logger.info(`Added image asset to solution generation: ${asset.fileName}`);
      }
    }
  }
}
```

### Frontend Changes

#### 3. API Utility (`src/utils/api.js`)

**New Function:**
- `problemAPI.associateAssets(id, assetIds)` - Associates uploaded assets with a problem

**Purpose:**
This function calls the existing backend endpoint `POST /api/problems/:id/assets` to link uploaded images with problems.

#### 4. Solve Problems Page (`src/pages/SolveProblemsPage.js`)

**Updated Functions:**
- `handleSolveProblem()` - Associates uploaded assets before generating solution
- `handleGenerateHints()` - Associates uploaded assets before generating hints
- `handleGenerateConceptNotes()` - Associates uploaded assets before generating concept notes

**Implementation Pattern:**
Each function now includes this code after creating the problem:
```javascript
// Associate uploaded asset with the problem if it exists
if (uploadedAsset?.id) {
  const { problemAPI } = await import('../utils/api');
  await problemAPI.associateAssets(created.id, [uploadedAsset.id]);
}
```

## How It Works - End to End

### User Flow:
1. User uploads an image of a problem
2. Image is stored in PostgreSQL as binary data (`ProblemAsset` table)
3. User enters a subject and clicks "Get Solution", "Get Hints", or "Get Concept Notes"
4. Frontend creates a problem and associates the uploaded asset with it
5. Frontend calls the generation endpoint
6. Backend retrieves the problem with its associated images
7. Backend converts image data to base64
8. Backend sends the image along with the prompt to OpenAI's Vision API
9. OpenAI analyzes the image and generates appropriate response
10. Response is saved and returned to the frontend

### Technical Flow:
```
Frontend Upload
    ↓
POST /api/uploads (stores image in DB)
    ↓
Returns asset with ID
    ↓
POST /api/problems (creates problem)
    ↓
POST /api/problems/:id/assets (links asset to problem)
    ↓
POST /api/problems/:id/solutions (generates solution)
    ↓
Controller retrieves problem + assets
    ↓
Converts images to base64
    ↓
Calls OpenAI with Vision API
    ↓
Returns generated content
```

## Database Schema

The existing schema already supports this feature:

**ProblemAsset Table:**
- `id` - Unique identifier
- `problemId` - Foreign key to Problem (nullable initially, set via association)
- `fileName` - Original filename
- `fileSize` - Size in bytes
- `mimeType` - MIME type (e.g., 'image/jpeg', 'image/png')
- `fileData` - Binary data (Bytes type in Prisma)
- `storageLocation` - 'postgres' or 's3'

**Problem Table:**
- `id` - Unique identifier
- `assets` - Relation to ProblemAsset[]

## OpenAI Models Used

- **Without Images:** GPT-4o-mini (cost-effective)
- **With Images:** GPT-4o (vision-capable)

The model selection is automatic based on the presence of image data.

## Supported Image Formats

- JPEG (image/jpeg)
- PNG (image/png)
- GIF (image/gif)
- WebP (image/webp)

Note: PDFs are stored but not currently passed to the Vision API.

## Limitations & Considerations

1. **File Size:** 10MB maximum per upload (enforced by multer)
2. **Storage:** Images are stored in PostgreSQL as binary data
3. **Token Usage:** Vision API calls use more tokens than text-only
4. **Model Cost:** GPT-4o is more expensive than GPT-4o-mini
5. **Multiple Images:** Supports multiple images per problem

## Testing the Feature

### Manual Testing Steps:
1. Start the backend server
2. Start the frontend application
3. Navigate to "Solve Problems" page
4. Click "Upload Image" tab
5. Upload an image of a math/science problem
6. Select the subject
7. Click "Get Solution", "Get Hints", or "Get Concept Notes"
8. Verify that the AI analyzes the image and generates appropriate content

### Expected Behavior:
- The AI should read text from the image
- The AI should interpret diagrams, graphs, and equations
- The solution should reference specific elements from the image
- The quality should be comparable to text-based problems

## Future Enhancements

1. **PDF Support:** Extend Vision API support to PDF pages
2. **Image Preprocessing:** Enhance image quality before sending to API
3. **OCR Fallback:** Use OCR for text extraction if Vision API fails
4. **Multi-page PDFs:** Handle multi-page PDF documents
5. **Image Compression:** Compress images to reduce token usage
6. **Caching:** Cache image analysis results to avoid redundant API calls

## Troubleshooting

### Common Issues:

**Image not being analyzed:**
- Check that the asset is properly associated with the problem
- Verify the MIME type starts with 'image/'
- Check backend logs for image processing messages

**Vision API errors:**
- Ensure OpenAI API key has Vision API access
- Check image size and format compatibility
- Verify base64 encoding is correct

**No images in API call:**
- Confirm `assets: true` is included in Prisma query
- Check that imageData array is not empty
- Verify buffer to base64 conversion is working

### Debug Logging:
Look for these log messages:
- "Added image asset to solution generation: [filename]"
- "Generating solution with OpenAI" (check hasImages flag)
- "Using vision-capable model: gpt-4o"

## Conclusion

This implementation enables the AAS application to process image-based problems using OpenAI's Vision API. The feature seamlessly integrates with the existing problem-solving workflow and provides users with the ability to upload pictures of homework problems and receive AI-generated solutions, hints, and concept notes.
