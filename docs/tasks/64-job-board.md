# Task 64: Job Board Module

## Summary
Simple job board where businesses can post job openings and job seekers can browse and apply. Focus on the Ethiopian community in the Gulf.

## Required Changes
- Create JobPosting model: title, description, type (full-time/part-time/freelance), salary range, location, providerProfileId, expiresAt
- Create JobApplication model: jobPostingId, applicantName, phone, email, message, resumeUrl
- Provider endpoints: CRUD for job postings
- Public endpoints: list/filter jobs by city/category/type
- Jobs page on web app with filters
- Simple apply form (name, phone, email, message, optional resume)
- Job postings on business profile page
- "Latest Jobs" section on homepage (optional)

## Acceptance Criteria
- [ ] Businesses can post/manage job listings
- [ ] Public job board with filters
- [ ] Simple application flow
- [ ] Jobs appear on business profiles
