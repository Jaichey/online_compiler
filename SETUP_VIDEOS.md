# Videos Module Setup Guide

## Overview
This guide explains how to set up the videos module for the Bhavishyath online compiler platform, including the Supabase schema and admin dashboard integration.

---

## Step 1: Create the Database Schema

### 1.1 Access Supabase SQL Editor
1. Go to your Supabase project: https://app.supabase.com
2. Navigate to **SQL Editor**
3. Click **New Query**

### 1.2 Copy and Execute the Schema
Copy the entire SQL code from `VIDEOS_SCHEMA.sql` and execute it in the SQL editor.

This will create:
- **videos** table - Main videos data
- **watched_videos** table - Track which videos users have watched
- **saved_videos** table - Bookmarks for users
- Row Level Security (RLS) policies for data protection
- Indexes for optimal query performance

---

## Step 2: Database Schema Details

### Videos Table Structure
```sql
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  instructor VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  video_url TEXT NOT NULL,
  duration VARCHAR(20) NOT NULL, -- Format: "HH:MM:SS"
  duration_seconds INTEGER NOT NULL,
  category VARCHAR(50) NOT NULL, -- dsa, algorithms, java, python, web, system-design
  tags TEXT[] DEFAULT '{}', -- Array of tags
  published_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_published BOOLEAN DEFAULT TRUE,
  views_count INTEGER DEFAULT 0
);
```

### Field Descriptions

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| id | UUID | Unique video ID | Auto-generated |
| title | VARCHAR(255) | Video title | "Complete DSA Course" |
| instructor | VARCHAR(255) | Instructor name | "Abdul Bari" |
| description | TEXT | Video description | "Master Data Structures..." |
| thumbnail_url | TEXT | Video thumbnail URL | "https://i.ytimg.com/vi/..." |
| video_url | TEXT | YouTube embed URL | "https://www.youtube.com/embed/..." |
| duration | VARCHAR(20) | Video duration | "12:45:30" |
| duration_seconds | INTEGER | Duration in seconds | 45930 |
| category | VARCHAR(50) | Video category | "dsa", "algorithms", "java", "python", "web", "system-design" |
| tags | TEXT[] | Array of tags | ["DSA", "Algorithms", "Beginner"] |
| published_date | DATE | Publication date | "2023-06-15" |
| created_at | TIMESTAMP | Creation timestamp | Auto-generated |
| updated_at | TIMESTAMP | Last update timestamp | Auto-generated |
| is_published | BOOLEAN | Publishing status | true/false |
| views_count | INTEGER | Total views | 150 |

### Categories Available
- **dsa** - Data Structures and Algorithms
- **algorithms** - Algorithms (general)
- **java** - Java Programming
- **python** - Python Programming
- **web** - Web Development
- **system-design** - System Design

---

## Step 3: Add Videos via Admin Dashboard

### 3.1 Access Admin Panel
1. Go to your admin dashboard: `admin-dashboard.html`
2. Click the **Videos** tab

### 3.2 Add a New Video
Fill in the form with the following information:

1. **Video Title** - The name of the video
   - Example: "Complete Data Structures and Algorithms Course"

2. **Instructor Name** - Name of the instructor
   - Example: "Abdul Bari"

3. **Description** - Detailed description of the video content
   - Example: "Master Data Structures & Algorithms from scratch..."

4. **Category** - Select one of the predefined categories
   - Data Structures / Algorithms / Java / Python / Web Development / System Design

5. **Tags** - Comma-separated tags for filtering
   - Example: "DSA, Algorithms, Beginner"

6. **Thumbnail URL** - Link to the video thumbnail image
   - Example: "https://i.ytimg.com/vi/0IAPZzGSbME/maxresdefault.jpg"
   - YouTube video thumbnails: `https://i.ytimg.com/vi/[VIDEO_ID]/maxresdefault.jpg`

7. **YouTube Embed URL** - YouTube video embed URL
   - Format: `https://www.youtube.com/embed/[VIDEO_ID]`
   - **Important**: Use `/embed/` not `/watch?v=`

8. **Duration** - Video duration in HH:MM:SS format
   - Example: "12:45:30" (12 hours, 45 minutes, 30 seconds)

9. **Published Date** - When the video was published
   - Example: "2023-06-15"

10. **Publish Video** - Checkbox to publish the video immediately
    - Unchecked videos won't be visible to users

### 3.3 How to Get YouTube Video Information

#### Get YouTube Video ID
- From URL: `https://www.youtube.com/watch?v=0IAPZzGSbME`
- Video ID: `0IAPZzGSbME`

#### Get Embed URL
- Replace: `https://www.youtube.com/watch?v=[VIDEO_ID]`
- With: `https://www.youtube.com/embed/[VIDEO_ID]`
- Example: `https://www.youtube.com/embed/0IAPZzGSbME`

#### Get Thumbnail URL
- URL: `https://i.ytimg.com/vi/[VIDEO_ID]/maxresdefault.jpg`
- Example: `https://i.ytimg.com/vi/0IAPZzGSbME/maxresdefault.jpg`

#### Get Video Duration
- Using YouTube API or check video details
- Format as HH:MM:SS
- Example: 12 hours 45 minutes 30 seconds → "12:45:30"

---

## Step 4: View Videos on Videos Page

### 4.1 Access Videos Page
1. Go to `videos.html`
2. Videos will automatically load from Supabase

### 4.2 Features Available
- **Search** - Search by title, instructor, or tags
- **Filter by Category** - Filter videos by category
- **Sort** - Sort by newest, oldest, duration, or title
- **Save for Later** - Bookmark videos
- **Watch Tracking** - Videos mark as watched
- **View Stats** - See total duration, watched count

---

## Step 5: Database Queries

### Get All Published Videos
```sql
SELECT * FROM videos 
WHERE is_published = TRUE 
ORDER BY published_date DESC;
```

### Get Videos by Category
```sql
SELECT * FROM videos 
WHERE category = 'dsa' AND is_published = TRUE 
ORDER BY published_date DESC;
```

### Get User's Watched Videos
```sql
SELECT v.* FROM videos v
INNER JOIN watched_videos wv ON v.id = wv.video_id
WHERE wv.user_id = 'USER_ID'
ORDER BY wv.watched_at DESC;
```

### Get User's Saved Videos
```sql
SELECT v.* FROM videos v
INNER JOIN saved_videos sv ON v.id = sv.video_id
WHERE sv.user_id = 'USER_ID'
ORDER BY sv.saved_at DESC;
```

### Update Video Views
```sql
UPDATE videos 
SET views_count = views_count + 1 
WHERE id = 'VIDEO_ID';
```

---

## Step 6: API Integration

### Fetch Videos (JavaScript)
```javascript
const { data, error } = await supabase
  .from('videos')
  .select('*')
  .eq('is_published', true)
  .order('published_date', { ascending: false });

if (error) console.error(error);
else console.log(data);
```

### Save Video for User
```javascript
const { error } = await supabase
  .from('saved_videos')
  .insert([
    { user_id: userId, video_id: videoId }
  ]);
```

### Mark Video as Watched
```javascript
const { error } = await supabase
  .from('watched_videos')
  .insert([
    { user_id: userId, video_id: videoId }
  ]);
```

---

## Step 7: Sample Data

The schema includes 8 sample videos. To view them:

1. Execute the `VIDEOS_SCHEMA.sql` file
2. Go to Supabase → Videos table
3. You'll see 8 pre-populated videos:
   - Complete Data Structures and Algorithms Course (Abdul Bari)
   - Java Programming Full Course (Telusko)
   - Python for Beginners (Programming with Mosh)
   - System Design Interview Preparation (Gaurav Sen)
   - Web Development Full Course (freeCodeCamp)
   - Dynamic Programming Masterclass (Aditya Verma)
   - Graph Algorithms for Coding Interviews (William Fiset)
   - Java Collections Framework (Defog Tech)

---

## Step 8: Edit/Delete Videos

### Edit Video
1. Go to **Videos** tab in admin dashboard
2. Click **Edit** button on any video card
3. Form will populate with video data
4. Modify the fields
5. Click **Update Video**

### Delete Video
1. Go to **Videos** tab in admin dashboard
2. Click **Delete** button on any video card
3. Confirm deletion

---

## Step 9: Security & Permissions

### Row Level Security (RLS) Policies

**Videos Table:**
- ✅ Everyone can READ published videos
- ✅ Only admins can CREATE/UPDATE/DELETE videos

**Watched Videos Table:**
- ✅ Users can only see their own watched videos
- ✅ Users can only INSERT/DELETE their own records

**Saved Videos Table:**
- ✅ Users can only see their own saved videos
- ✅ Users can only INSERT/DELETE their own records

---

## Step 10: Troubleshooting

### Videos Not Loading
- Check if videos are marked as `is_published = TRUE`
- Verify Supabase connection in `videos.js`
- Check browser console for errors
- Ensure RLS policies are correctly set

### Videos Not Appearing in Admin
- Verify you're logged in as admin
- Check if admin role is set in users table
- Try refreshing the page

### YouTube Video Not Playing
- Verify YouTube embed URL format: `https://www.youtube.com/embed/[VIDEO_ID]`
- Check if the video is publicly available
- Ensure video URL is not blocked

### Database Errors
- Check Supabase project status
- Verify API keys are correct
- Check table permissions and RLS policies

---

## Step 11: File Structure

```
online-compiler/
├── admin-dashboard.html      ← Admin panel with videos section
├── videos.html               ← Videos page for users
├── videos.css                ← Videos styling
├── videos.js                 ← Videos JavaScript functionality
├── VIDEOS_SCHEMA.sql         ← Database schema (SQL)
└── SETUP_VIDEOS.md          ← This file
```

---

## Step 12: Next Steps

1. ✅ Create Supabase schema using `VIDEOS_SCHEMA.sql`
2. ✅ Test with sample videos
3. ✅ Add more videos via admin dashboard
4. 🔜 Create Study Materials module
5. 🔜 Create References module
6. 🔜 Set up email notifications for new videos

---

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify Supabase connection
3. Ensure all required fields are filled in the form
4. Check that YouTube URLs are in the correct format

---

## Version Info
- Created: January 2, 2026
- Schema Version: 1.0
- Last Updated: January 2, 2026
