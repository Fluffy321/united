# Newsletter Feature for Community Groups

## Overview
Premium feature allowing group admins to draft and send periodic email newsletters summarizing top discussions and upcoming events to community members.

## Components Created

### 1. Backend Function: `sendGroupNewsletter`
**Location:** `functions/sendGroupNewsletter.js`

**Purpose:** Sends newsletter emails to group members using payment provider email integration.

**Parameters:**
- `groupId`: Community group ID
- `groupName`: Group name for sender branding
- `memberUserIds`: Array of user IDs (backend resolves to emails)
- `subject`: Email subject line
- `htmlContent`: HTML email body

**Functionality:**
- Fetches member emails from User entity
- Sends personalized emails via `Core.SendEmail` integration
- Tracks sent/failed counts
- Creates NewsletterLog record

### 2. Entity: `NewsletterLog`
**Location:** `entities/NewsletterLog.json`

**Schema:**
- `group_id`: Group identifier
- `sent_by_user_id`: Admin who sent
- `sent_by_name`: Sender name
- `subject`: Newsletter subject
- `recipients_count`: Total recipients
- `sent_count`: Successfully sent
- `failed_count`: Failed deliveries
- `sent_date`: Timestamp

### 3. Component: `NewsletterComposer`
**Location:** `components/groups/NewsletterComposer.jsx`

**Features:**
- **3-step workflow:** Compose → Preview → Send
- **Auto-generate content:** Loads top 5 discussions and upcoming events
- **Customizable subject line:** Pre-filled with group name and date
- **Optional admin message:** Personal note section
- **Content toggles:** Include/exclude discussions and events
- **Live preview:** iframe rendering of HTML email
- **Professional template:** Branded header, sections, footer

**Email Template Sections:**
- Header with group name and date
- Optional admin message (amber highlight)
- Top Discussions (with likes/comments counts)
- Upcoming Events (with date, time, location)
- Footer with unsubscribe link

### 4. Component: `NewsletterHistoryModal`
**Location:** `components/groups/NewsletterHistoryModal.jsx`

**Features:**
- Displays last 20 newsletters sent
- Shows delivery statistics (sent/failed counts)
- Visual success rate progress bar
- Color-coded status indicators
- Empty state for no newsletters

### 5. Integration: `GroupAnalyticsDashboard`
**Location:** `components/groups/GroupAnalyticsDashboard.jsx`

**Updates:**
- Added "Send Newsletter" button (gradient blue-purple)
- Added "History" button to view past newsletters
- Both buttons only visible to premium users
- Member email loading on component mount

## User Flow

### Sending a Newsletter

1. **Access:** Group admin clicks "Analytics" tab → "Send Newsletter" button
2. **Load Content:** Click "📥 Load Latest Discussions & Events"
3. **Compose:**
   - Edit subject line (auto-filled)
   - Add optional personal message
   - Toggle discussions/events inclusion
4. **Preview:** Click "Preview Newsletter" to see HTML rendering
5. **Send:** Click "Send to X Members" → Backend processes emails
6. **Confirmation:** Toast notification with delivery stats

### Viewing History

1. Click "History" button in Analytics Dashboard
2. View list of past newsletters with:
   - Subject line
   - Send date
   - Sender name
   - Recipient count
   - Delivery success rate
   - Sent/Failed breakdown

## Premium Gating

**Access Control:**
- Only visible when `user.subscription_status === 'premium'`
- Group admin role required
- Upgrade prompt shown for non-premium users ($9.99/month)

## Technical Implementation

### Email Template Design
- **Responsive:** 600px max-width, mobile-friendly
- **Branded:** Gradient header (group colors)
- **Structured:** Clear sections with icons
- **Professional:** Clean typography, proper spacing

### Backend Processing
```javascript
// Fetch member emails from User entity
const allUsers = await base44.entities.User.list();
const memberEmails = allUsers
  .filter(u => memberUserIds.includes(u.id))
  .map(u => u.email);

// Send individually for better deliverability
for (const email of memberEmails) {
  await base44.integrations.Core.SendEmail({...});
}
```

### Error Handling
- Try-catch on each email send
- Tracks failed vs successful sends
- Logs errors for debugging
- Returns detailed results to frontend

## Future Enhancements

1. **Scheduling:** Allow admins to schedule newsletters for future dates
2. **Templates:** Multiple template designs (minimal, colorful, etc.)
3. **Analytics:** Open rates, click-through rates tracking
4. **Segmentation:** Send to specific member segments
5. **A/B Testing:** Test different subject lines
6. **Unsubscribe Management:** Real unsubscribe link handling
7. **PDF Export:** Download newsletter as PDF attachment

## Files Modified

- ✅ `functions/sendGroupNewsletter.js` (created)
- ✅ `entities/NewsletterLog.json` (created)
- ✅ `components/groups/NewsletterComposer.jsx` (created)
- ✅ `components/groups/NewsletterHistoryModal.jsx` (created)
- ✅ `components/groups/GroupAnalyticsDashboard.jsx` (updated)

## Usage Example

```javascript
// From GroupAnalyticsDashboard
<button onClick={() => setShowNewsletter(true)}>
  <Mail className="w-4 h-4" />
  Send Newsletter
</button>

// NewsletterComposer handles the rest
<NewsletterComposer
  group={group}
  memberEmails={memberUserIds}
  onClose={() => setShowNewsletter(false)}
  onSent={(data) => console.log('Sent:', data)}
/>
```

## Testing Checklist

- [ ] Premium user can access newsletter feature
- [ ] Non-premium user sees upgrade prompt
- [ ] Group admin can load discussions and events
- [ ] Email preview renders correctly in iframe
- [ ] Newsletter sends successfully to members
- [ ] Delivery stats shown in toast notification
- [ ] Newsletter appears in history modal
- [ ] Failed sends are tracked and displayed
- [ ] Mobile-responsive email template