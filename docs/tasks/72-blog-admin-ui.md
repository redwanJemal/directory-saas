# Task 72: Blog — Admin UI

## Summary
Build the admin panel UI for managing blog posts. Rich text editor for content, image upload for covers, publish/draft workflow, and post listing with filters.

## Required Changes

### 72.1 Admin Sidebar
- Add "Blog" item to admin sidebar (icon: FileText) between "Reviews" and "Users"
- Show published post count badge

### 72.2 Blog Posts List Page (`/blog`)
- Table with columns: Title, Category, Status (badge: draft/published/archived), Country, Views, Published Date, Actions
- Filters: status dropdown, category dropdown, country dropdown, search by title
- Sort: newest first, most viewed, title A-Z
- Row actions: Edit, Publish/Unpublish, Delete
- "New Post" button in header

### 72.3 Blog Post Editor Page (`/blog/new` and `/blog/:id/edit`)
- Title input (large, prominent)
- Slug input (auto-generated from title, editable)
- Category select dropdown
- Country select (optional — for country-specific guides)
- Tags input (comma-separated or chip input)
- Cover image URL input with preview
- Content editor — use a textarea with markdown support (or a simple rich text editor)
  - For MVP: use a tall textarea with markdown preview toggle
  - Show character count and estimated read time
- Excerpt textarea (auto-generated from first 300 chars of content if empty)
- SEO section (collapsible): meta title, meta description
- Action buttons: "Save Draft", "Publish", "Preview"
- If editing published post: "Unpublish" option

### 72.4 Blog Post Preview
- Preview modal or side panel showing the post as it would appear publicly
- Rendered markdown content
- Cover image, title, excerpt, tags, read time

### 72.5 i18n
- Add all blog admin strings to en.json, am.json, ar.json

## Acceptance Criteria
- [ ] Blog list page with filters and actions
- [ ] Post editor with markdown content area
- [ ] Publish/unpublish workflow
- [ ] Cover image preview
- [ ] Auto-generated slug and read time
- [ ] SEO fields
- [ ] All admin apps build successfully
