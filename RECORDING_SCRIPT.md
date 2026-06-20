# Screen-Recording Script (5–6 min)

Read this conversationally — it's written to be spoken, not read verbatim. Bracketed notes are actions, not narration.

**Before you hit record:** the Render free-tier backend sleeps after 15 min idle. Hit https://nudge-ticketing-backend.onrender.com/docs once, 1–2 minutes before recording, so the instance is already warm — otherwise the first live "Find Similar Resolved Issues" click could sit on a 30–60s cold-start spinner that isn't in this script.

---

**[0:00 – 0:30] Cold open**

"Hey — I want to show you the ticketing tool I built for The/Nudge, and I want to start with the one sentence that drove almost every decision in here: the AI layer was designed to prevent tickets from being created, not just to process them faster. Everything I'm about to show you is in service of that one idea."

**[0:30 – 3:00] Ticket-raising flow + similarity check — the differentiator**

[Navigate to `/new`]

"So here's the employee side. Say someone's working from home and their VPN won't connect — pretty common IT request." [Type a title and description close to a seeded ticket, e.g. "Can't connect to VPN from home" / "My VPN keeps saying authentication failed even though my password is right."]

"Now, before they even submit, they hit 'Find Similar Resolved Issues.'" [Click button] "This is the whole product thesis in one click — we're embedding what they just typed, running a similarity search against every ticket we've already resolved, and showing them the answer before a ticket even exists."

[Wait for results to load] "And there it is — a previously resolved ticket at roughly a 70-percent match, same VPN issue, same fix: the certificate had expired, IT reissued it. If that's the user's problem, they're done. No ticket, no wait, no agent involved at all. That's the deflection — that's the actual goal here, not speed, prevention."

"If it doesn't solve their problem, no harm — they just keep going."

**[3:00 – 4:00] Editable category suggestion**

[Click "Continue to Submit"] "Now if they do submit, Claude looks at the title and description and suggests a category — here it's IT, with a one-line reason: mentions VPN and authentication." [Point at the reasoning text] "Important detail: this is a suggestion, not a lock. It's an editable dropdown — if Claude gets it wrong, the employee or an agent can just change it. We never auto-classify silently."

[Fill in name, click "Confirm & Create Ticket"] "And that creates the ticket and drops us into the detail view, with an Activity Log tracking every status change with a timestamp — that's standing in for what would be an email or Slack notification in production."

**[4:00 – 5:00] Agent board + resolution-notes gate**

[Navigate to `/agent`] "On the agent side, it's a four-column board — Open, In Progress, Resolved, Closed — filterable by department." [Move a ticket from Open to In Progress] "Moving through the early stages is free."

[Try to move a ticket straight to Resolved without notes] "But here's a deliberate gate: you cannot resolve a ticket without writing resolution notes." [Show the block] "This isn't just a UI nicety — it's enforced because those notes are the actual text that gets retrieved later. If agents skip this, the similarity search has nothing to show the next person. So it's a hard requirement, not a suggestion." [Fill in notes, complete the transition]

**[5:00 – 5:45] Analytics dashboard**

[Navigate to `/analytics`] "Last stop — analytics. Ticket count by category, by status, average resolution time, and the percentage breakdown of recurring categories, so a manager can see at a glance where the volume's actually coming from."

**[5:45 – 6:00] Close**

"So that's the build — full ticket lifecycle, one genuinely deep AI feature instead of three shallow ones, and that feature is aimed at the moment before a ticket exists, not after. Prevent the ticket, don't just process it faster."
