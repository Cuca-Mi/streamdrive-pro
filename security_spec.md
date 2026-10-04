# Security Specification & Test Matrix

## 1. Data Invariants
1. A UserProfile can only be read or modified by its respective owner or by the admin (`cucamiguilito@gmail.com`).
2. A Channel can be read by any authenticated or guest user, but can only be updated/deleted by its original creator (`ownerId`) or system admin.
3. User Favorites (`/users/{userId}/favorites/{favId}`) are private to that user. No other user can read or write someone else's favorites.
4. Metric entries (`/metrics/{metricId}`) are write-only by signed-in users with valid timestamps and read-only by the administrator or the user who recorded them.
5. AdminReports (`/adminReports/{reportId}`) are strictly accessible and writable by administrators (`cucamiguilito@gmail.com`).
6. All text fields have strict length boundaries to prevent Denial-of-Wallet attacks.

## 2. The Dirty Dozen Attack Payloads
1. **Attack 1 (Profile Impersonation):** User B attempts to write to `/users/userA` with User B's auth token. (Must FAIL with PERMISSION_DENIED)
2. **Attack 2 (Ghost Field Injection):** Malicious user attempts to inject `{ "isAdmin": true, "vip": 9999 }` into their profile. (Must FAIL)
3. **Attack 3 (Channel Hijack):** User B attempts to edit or delete a channel owned by User A. (Must FAIL)
4. **Attack 4 (Channel ID Poisoning):** User attempts to create a channel with a 50KB string as channelId. (Must FAIL)
5. **Attack 5 (URL Exploitation):** User attempts to submit a 10MB payload as stream URL. (Must FAIL)
6. **Attack 6 (Favorites Snooping):** User B queries `/users/userA/favorites`. (Must FAIL)
7. **Attack 7 (Metrics Forgery):** User attempts to forge metrics with mismatched userId. (Must FAIL)
8. **Attack 8 (Admin Report Tampering):** Non-admin user attempts to create or read `/adminReports/sampleReport`. (Must FAIL)
9. **Attack 9 (Unauthenticated Channel Destruction):** Guest attempts to delete a channel. (Must FAIL)
10. **Attack 10 (Future Timestamp Manipulation):** User injects false timestamp `2099-01-01` into metrics. (Must FAIL)
11. **Attack 11 (Oversized Description Flooding):** Payload contains 100,000 character strings to exhaust storage. (Must FAIL)
12. **Attack 12 (Self-Elevation of Role):** Non-admin registers profile with `role: "admin"`. (Must FAIL)
