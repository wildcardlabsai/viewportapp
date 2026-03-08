

## PageFrame App — Improvement Suggestions

After reviewing every page and component, here are the issues and improvements organized by area:

---

### Landing Page

1. **Hero mock browser shows "app.pageframe.app"** — should match actual domain or be generic
2. **Footer has "Admin" link publicly visible** under Legal section — security concern, should be hidden or removed
3. **Footer links are all dead** (#) — About, Blog, Careers, Contact, API Docs, Changelog, Cookie Policy, Privacy Policy, Terms of Service all go nowhere
4. **No social proof** — no testimonials, customer logos, or usage stats on the landing page
5. **No mobile hamburger menu** on the landing navbar — nav links are hidden on mobile with no way to access them
6. **"Now in public beta" badge** — may be outdated, consider updating or removing

### Auth Page

7. **Demo sign-in creates accounts with hardcoded credentials** (`demo@pageframe.app` / `demo123456`) — security risk, anyone can access this account's data
8. **"or" divider + Demo button shows even on the "magic link sent" screen** — should be hidden when mode is "sent"
9. **No password reset/forgot password flow** — users have no way to recover their account
10. **No form validation feedback** (e.g., password too short) before submission

### Dashboard (New Capture)

11. **No visual preview** of what the capture will look like before submitting
12. **No recent captures widget** or quick-access section — have to navigate to History every time
13. **No URL validation** — invalid URLs are accepted without feedback until the backend fails
14. **"brand" button variant used but never defined in button.tsx** — should verify this exists or captures will have unstyled buttons

### History

15. **Limited to 50 jobs** with no pagination or "load more" — users with heavy usage can't access older captures
16. **No date range filter** — only project filter exists
17. **No bulk actions** — can't delete, download, or share multiple captures at once
18. **No delete capability** — users cannot delete individual captures from history

### Projects

19. **No confirmation dialog before deleting a project** — immediate destructive action
20. **Capture counts fetched with N+1 queries** (one query per project in a loop) — performance issue
21. **No project detail view** — can't click into a project to see its captures
22. **No project description editing** — only name can be changed

### Schedules

23. **Next run time is hardcoded to +1 hour** regardless of the cron expression selected — incorrect behavior
24. **No indication of how many captures a schedule has produced** — no history link per schedule
25. **No confirmation before deleting a schedule**

### Team

26. **Cannot invite members by email** — shows user IDs which is unusable; note says "coming soon"
27. **Members display truncated UUIDs instead of names/emails** — poor UX
28. **No role management** — can't change member roles after adding
29. **No team-scoped projects or captures** — teams exist but don't connect to any functionality

### Settings

30. **No avatar/profile picture upload**
31. **No password change option**
32. **No account deletion option**
33. **No notification preferences**

### Admin Panel

34. **Admin link publicly accessible in footer** — should be hidden
35. **`fetchUsers` makes a redundant first call** (line 60-61) that does nothing with the result before making the real call on line 65
36. **No pagination** for users table — will break with many users
37. **No audit log** of admin actions
38. **"Back to App" navigates to "/" instead of "/dashboard"** — inconsistent with logo behavior elsewhere

### Shared Capture Page

39. **Password protection doesn't actually verify the password** — `handlePassword` just sets `authenticated = true` without checking the input against the hash
40. **No metadata shown** — no info about when it was captured, what device, the URL, etc.

### 404 Page

41. **Minimal styling** — no branding, no logo, doesn't match the app's design language
42. **"Return to Home" should go to /dashboard if authenticated**

### General Design & UX

43. **No loading skeletons** — all pages show a spinner instead of skeleton placeholders
44. **No empty state illustrations** — just icons and text, could be more engaging
45. **No toast for successful signout**
46. **Dark mode toggle doesn't persist** — uses class toggle without localStorage, resets on refresh
47. **No onboarding flow** for new users — no tutorial, guided tour, or welcome screen
48. **No keyboard shortcuts** for power users
49. **Sidebar doesn't highlight sub-routes** — e.g., visiting /history doesn't highlight if route matching is exact

---

### Recommended Priority (High Impact)

I'd suggest tackling these in order of impact:

1. **Fix the password bypass on shared captures** (security bug, item 39)
2. **Remove public admin link from footer** (security, item 34)
3. **Remove or secure demo sign-in** (security, item 7)
4. **Fix dark mode persistence** (item 46)
5. **Add forgot password flow** (item 9)
6. **Fix the landing mobile nav** (item 5)
7. **Add delete captures in History** (item 18)
8. **Fix the redundant admin fetch call** (item 35)
9. **Add confirmation dialogs for destructive actions** (items 19, 25)
10. **Improve 404 page with branding** (item 41)

Would you like me to implement any of these? I can tackle them individually or as a batch.

