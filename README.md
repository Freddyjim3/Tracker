# Content Tracker MVP

Simple browser-based app for capturing content ideas, tracking task progress, and exporting reports.

## Screens

- Dashboard: summary cards, quick add form, workflow board
- Content List: filtered cards with progress bars and task checklists
- Calendar: deadline and publish-date overview
- Exports: CSV and HTML exports by custom date range or month
- Detail Editor: update content fields or delete a content item

## Workflow Stages

- Idea Capture
- Research & Validation
- Script Writing
- Recording / Voiceover
- Video Editing
- Thumbnail Design
- Upload & Publish

## Data Model

- `content`
  - `id`
  - `title`
  - `description`
  - `category`
  - `platform`
  - `status`
  - `priority`
  - `createdAt`
  - `deadline`
  - `publishDate`
  - `tags`
  - `notes`
  - `metrics`
  - `tasks`
- `task`
  - `id`
  - `title`
  - `done`

## Run

Open `index.html` in a browser.

## Supabase Setup

1. Run the SQL in `supabase-schema.sql` in your Supabase SQL editor.
2. Put your project URL and anon key into `supabase-config.js`.
3. Open the app and use the Account panel to register or log in.
4. After login, content and project/channel metadata will sync to Supabase.

## Current Storage

Data is stored in browser `localStorage` under `content-tracker-app-v1`.
When logged in with Supabase, the app also syncs to the cloud.
