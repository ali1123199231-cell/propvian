export interface BlogPost {
  slug: string
  title: string
  description: string
  publishedAt: string
  updatedAt?: string
  author: string
  category: string
  tags: string[]
  readingTime: number
  featured?: boolean
  sections: BlogSection[]
}

export interface BlogSection {
  type: 'h2' | 'h3' | 'p' | 'ul' | 'ol' | 'cta' | 'tip' | 'faq'
  content?: string
  items?: string[]
  faqs?: { q: string; a: string }[]
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'airbnb-smart-lock-automation',
    title: 'How to Automate Airbnb Guest Access with TTLock',
    description:
      'A complete guide to automating Airbnb guest check-in using TTLock smart locks. Learn how to automatically generate door codes from your Airbnb reservations and eliminate the hassle of manual code management.',
    publishedAt: '2025-01-15',
    updatedAt: '2025-05-01',
    author: 'Propvian Team',
    category: 'Airbnb Hosting',
    tags: ['Airbnb', 'TTLock', 'Smart Lock', 'Automation', 'Self Check-In'],
    readingTime: 8,
    featured: true,
    sections: [
      {
        type: 'p',
        content:
          "If you manage Airbnb rentals, you know the frustration: a new reservation comes in, you need to generate a door code, send it to the guest, then remember to revoke it after checkout. Multiply that by five properties and you've got a part-time job in code management. Smart lock automation changes all of that.",
      },
      {
        type: 'h2',
        content: 'Why manual code management is a problem',
      },
      {
        type: 'p',
        content:
          "When you handle door codes manually, you're always one forgotten revocation away from a security incident. Past guests retaining access after checkout isn't just inconvenient — it's a liability. And when you're managing multiple properties, or the reservations start rolling in during a busy season, the manual workflow breaks down fast.",
      },
      {
        type: 'ul',
        items: [
          'Forgetting to revoke codes after checkout leaves your property exposed',
          'Sending the wrong code to the wrong guest creates confusion and bad reviews',
          'Manual workflows don\'t scale beyond 2–3 properties',
          'Last-minute bookings often mean scrambling to set up access in time',
          'No audit trail means you can\'t verify who had access and when',
        ],
      },
      {
        type: 'h2',
        content: 'How TTLock automation works',
      },
      {
        type: 'p',
        content:
          'TTLock is a smart lock platform widely used in short-term rental properties. The locks connect to a mobile app and cloud API, which allows software like Propvian to create and revoke time-limited door codes programmatically. When you connect your Airbnb calendar and your TTLock, the system handles the entire access lifecycle automatically.',
      },
      {
        type: 'ol',
        items: [
          'A new reservation appears on your Airbnb calendar',
          'Propvian syncs the reservation details including check-in and check-out times',
          'A unique door code is generated in TTLock, valid only during the reservation window',
          'You receive a notification with the guest name, arrival time, and the code — ready to copy and send',
          'On checkout day, the code is automatically revoked',
        ],
      },
      {
        type: 'h2',
        content: 'Setting up the integration: step by step',
      },
      {
        type: 'h3',
        content: 'Step 1: Connect your TTLock account',
      },
      {
        type: 'p',
        content:
          'Start by authorizing your TTLock account in Propvian. This uses the official TTLock OAuth flow, which means Propvian never sees your TTLock password — only a secure access token that can be revoked at any time. Once authorized, your locks appear in the Propvian dashboard.',
      },
      {
        type: 'h3',
        content: 'Step 2: Add your Airbnb iCal feed',
      },
      {
        type: 'p',
        content:
          "In your Airbnb hosting settings, you'll find a calendar export link (iCal URL). Paste this into Propvian under Integrations. Propvian syncs the calendar every 15 minutes, so new reservations are picked up quickly. Each property in Airbnb maps to a property in Propvian, which in turn links to one or more TTLock locks.",
      },
      {
        type: 'h3',
        content: 'Step 3: Enable automation',
      },
      {
        type: 'p',
        content:
          'Once your lock and calendar are connected, enable automation from the dashboard. The system will immediately process any existing upcoming reservations, generate codes for them, and notify you. From that point on, every new booking gets handled automatically.',
      },
      {
        type: 'tip',
        content:
          "Propvian notifies you before each arrival with the generated code. You then copy and send it to the guest via Airbnb chat. We intentionally don't contact guests directly — you stay in full control of the guest communication.",
      },
      {
        type: 'h2',
        content: 'What automation handles for you',
      },
      {
        type: 'ul',
        items: [
          'Automatic code generation for every confirmed reservation',
          'Time-limited codes that match your exact check-in and check-out times',
          'Automatic code revocation after checkout — no manual cleanup',
          'Host notifications before each arrival with guest name and code',
          'Cancelled reservation handling — codes revoked immediately when a reservation is cancelled',
          'Full access log for every property',
        ],
      },
      {
        type: 'h2',
        content: 'What you still do manually',
      },
      {
        type: 'p',
        content:
          "Automation handles the technical side, but the guest relationship remains yours. Propvian doesn't contact guests directly — you'll still send the code via Airbnb message, WhatsApp, or SMS. This is intentional: guests trust messages from their host, not from unknown third-party software. Think of Propvian as the system that always has the right code ready when you need it.",
      },
      {
        type: 'h2',
        content: 'Cost and trial',
      },
      {
        type: 'p',
        content:
          'Propvian is free for the first month with no credit card required. After the trial, it\'s $2 per lock per month. For most hosts, one or two locks per property is typical, making the cost minimal compared to the hours saved.',
      },
      {
        type: 'faq',
        faqs: [
          {
            q: 'Does Propvian work with all TTLock locks?',
            a: 'Propvian works with any lock supported by the TTLock platform. TTLock manufactures a wide range of smart lock hardware sold under various brand names. If your lock connects to the TTLock app, it will work with Propvian.',
          },
          {
            q: 'How quickly does the code get generated after a booking?',
            a: 'Propvian syncs your Airbnb calendar every 15 minutes. New reservations are detected within that window and codes are generated immediately after sync. For last-minute bookings, codes are typically ready within 15 minutes of the reservation being confirmed.',
          },
          {
            q: 'What happens if my internet goes down?',
            a: "TTLock codes are stored on the lock itself. Once a code is programmed, it works without internet — the lock operates standalone. So if your internet goes down after a code has been set, guests can still enter. However, Propvian needs internet connectivity to create or revoke codes.",
          },
          {
            q: 'Can I still generate codes manually?',
            a: 'Yes. Automation handles routine reservations, but you can always create manual codes, override check-in/out times, or add ad-hoc codes through the Propvian dashboard.',
          },
        ],
      },
      {
        type: 'cta',
        content: 'Start automating your Airbnb guest access',
      },
    ],
  },
  {
    slug: 'booking-com-smart-lock-automation',
    title: 'Booking.com Smart Lock Automation: Complete Guide',
    description:
      "Learn how to automate guest access for your Booking.com properties using TTLock smart locks. Sync reservations automatically and eliminate manual code management.",
    publishedAt: '2025-01-22',
    author: 'Propvian Team',
    category: 'Property Management',
    tags: ['Booking.com', 'TTLock', 'Smart Lock', 'Automation', 'Property Management'],
    readingTime: 7,
    featured: true,
    sections: [
      {
        type: 'p',
        content:
          "Booking.com is the world's largest accommodation booking platform, and it brings a specific challenge for smart lock management: the iCal feed format is slightly different from Airbnb's, the reservation data is less detailed, and cancellations need to be handled carefully. Here's how to automate it properly.",
      },
      {
        type: 'h2',
        content: 'The Booking.com iCal integration',
      },
      {
        type: 'p',
        content:
          "Booking.com provides an iCal calendar export from your extranet. This calendar contains all your confirmed reservations, including arrival and departure dates. Propvian connects to this feed and syncs it on a regular schedule — typically every 15 to 30 minutes.",
      },
      {
        type: 'ul',
        items: [
          'Log in to your Booking.com extranet',
          'Go to Property → Rates & Availability → Export Calendar',
          'Copy the iCal export link',
          'Add it to Propvian under your property\'s integrations',
        ],
      },
      {
        type: 'h2',
        content: 'How codes are generated for Booking.com reservations',
      },
      {
        type: 'p',
        content:
          "Once the calendar is connected, Propvian creates a unique door code for each confirmed reservation. The code is valid from check-in time on arrival day to check-out time on departure day. Because Booking.com's iCal doesn't include check-in/out times, Propvian uses the default times you configure for each property.",
      },
      {
        type: 'h2',
        content: 'Handling cancellations',
      },
      {
        type: 'p',
        content:
          "When a guest cancels on Booking.com, the reservation disappears from the iCal feed on the next sync. Propvian detects the removal and automatically revokes the associated door code. This ensures that cancelled guests never retain access to your property.",
      },
      {
        type: 'tip',
        content:
          "Set a dedicated default check-in time per property in Propvian. If a Booking.com guest is arriving at 3pm and your default is 2pm, you can adjust the reservation manually in Propvian after the fact.",
      },
      {
        type: 'h2',
        content: 'Managing multiple Booking.com properties',
      },
      {
        type: 'p',
        content:
          "If you have multiple properties on Booking.com, each property gets its own iCal feed URL. In Propvian, you create a property for each listing and connect the corresponding iCal URL. Each property is then linked to its own TTLock lock or set of locks. The dashboard gives you a consolidated view across all properties.",
      },
      {
        type: 'h2',
        content: 'Mixing Airbnb and Booking.com',
      },
      {
        type: 'p',
        content:
          "Many hosts list the same property on both platforms. Propvian handles this by maintaining a single lock per property — regardless of which platform the reservation came from, the right code gets generated and the overlapping lock availability is managed correctly.",
      },
      {
        type: 'faq',
        faqs: [
          {
            q: 'Does Propvian support Booking.com natively?',
            a: 'Yes. Propvian supports Booking.com via the standard iCal calendar feed that Booking.com provides in the extranet. This is the same method that most channel managers and calendar sync tools use.',
          },
          {
            q: 'Why is the iCal sync not instant on Booking.com?',
            a: "Booking.com's iCal feed updates in near-real-time when reservations change, but there's typically a delay of a few minutes before changes appear. Propvian syncs the feed on a 15–30 minute cycle, so new reservations are processed within that window.",
          },
          {
            q: 'Can I use Propvian if I only have Booking.com (no Airbnb)?',
            a: "Absolutely. Propvian works with any iCal-compatible booking platform. You can connect Booking.com, Airbnb, VRBO, or any other platform that exports an iCal feed. You don't need to use all of them — just the platforms you list on.",
          },
        ],
      },
      {
        type: 'cta',
        content: 'Automate your Booking.com guest access',
      },
    ],
  },
  {
    slug: 'best-smart-locks-airbnb-hosts',
    title: 'Best Smart Locks for Airbnb Hosts in 2025',
    description:
      'A practical guide to choosing the right smart lock for your Airbnb rental. We cover keypad locks, app-controlled locks, and TTLock-compatible models that work with automation software.',
    publishedAt: '2025-02-05',
    author: 'Propvian Team',
    category: 'Equipment & Hardware',
    tags: ['Smart Lock', 'Airbnb', 'TTLock', 'Hardware', 'Keypad Lock'],
    readingTime: 9,
    sections: [
      {
        type: 'p',
        content:
          "The right smart lock can make or break your self check-in setup. There are dozens of options on the market, ranging from basic keypad locks to cloud-connected models that integrate with booking platforms. This guide covers what to look for and which locks work best for short-term rental automation.",
      },
      {
        type: 'h2',
        content: 'What to look for in a rental property smart lock',
      },
      {
        type: 'ul',
        items: [
          'Temporary code support — can you create codes that expire automatically?',
          'No app required for guests — guests should be able to enter with just a code',
          'Battery life — most rentals don\'t have someone on-site to change batteries regularly',
          'Wi-Fi or Bluetooth connectivity for remote management',
          'Weather resistance if it\'s an exterior door in a harsh climate',
          'Easy installation — ideally replaces a standard deadbolt without complex wiring',
          'API or third-party integration support for automation',
        ],
      },
      {
        type: 'h2',
        content: 'Why TTLock-compatible locks are ideal for automation',
      },
      {
        type: 'p',
        content:
          "TTLock is a firmware platform used in a wide variety of smart locks. The key advantage for rental hosts is the TTLock cloud API, which allows third-party software to create and delete access codes remotely and programmatically. This is what makes full automation possible — rather than generating codes through an app manually, software like Propvian handles it automatically based on your reservation calendar.",
      },
      {
        type: 'p',
        content:
          "Many lock brands sold on Amazon and specialist sites run the TTLock firmware. Look for locks that explicitly mention TTLock compatibility or mention the TTLock app in their documentation.",
      },
      {
        type: 'h2',
        content: 'Key features to prioritize for Airbnb rentals',
      },
      {
        type: 'h3',
        content: 'Time-limited codes',
      },
      {
        type: 'p',
        content:
          "Time-limited (or time-based) codes only work during a specified window. For a guest checking in Saturday at 3pm and leaving Monday at 11am, the code only works during those hours. TTLock supports this natively, and automation software can set the exact window to match each reservation.",
      },
      {
        type: 'h3',
        content: 'No app requirement for guests',
      },
      {
        type: 'p',
        content:
          "Avoid locks that require guests to download an app to enter. Guests are often arriving tired from a flight, with poor cell service, and the last thing they want to do is create an account in a lock app. A simple 6-digit PIN on a keypad is frictionless and universally understood.",
      },
      {
        type: 'h3',
        content: 'Battery life and low-battery alerts',
      },
      {
        type: 'p',
        content:
          "Most quality smart locks run on AA batteries and last 6–12 months under typical usage. Look for locks that send low-battery alerts to the management app before they die — running out of battery with a guest arriving is a nightmare scenario you want to avoid.",
      },
      {
        type: 'h2',
        content: 'Installation considerations',
      },
      {
        type: 'p',
        content:
          "Most residential smart locks are designed to replace a standard deadbolt and use the existing door prep (hole patterns). Installation typically takes 15–30 minutes with basic tools. For fire doors or doors with non-standard hardware, verify compatibility before purchasing.",
      },
      {
        type: 'faq',
        faqs: [
          {
            q: 'Do I need a hub or gateway for TTLock?',
            a: "It depends on the lock model. Some TTLock locks connect via Bluetooth (local, requires phone nearby), while others have a Wi-Fi module built in. For remote management and automation, you need either a Wi-Fi lock or a TTLock gateway device connected to your property's Wi-Fi. The gateway allows the cloud API to communicate with the lock even when no one is physically present.",
          },
          {
            q: 'What happens to door codes if there\'s a power outage?',
            a: "Smart lock keypads are battery-powered, not mains-powered, so they work through power outages. The codes stored on the lock continue to work. The only impact is that creating or revoking codes requires internet connectivity, so those operations would queue until connectivity is restored.",
          },
          {
            q: 'Can I use different locks on different doors of the same property?',
            a: "Yes. You can connect multiple locks to a single property in Propvian. All locks for a reservation receive the same code — so the guest's code works on the main door, the gate, and any secondary entrance.",
          },
        ],
      },
      {
        type: 'cta',
        content: 'Connect your TTLock and automate guest access',
      },
    ],
  },
  {
    slug: 'self-checkin-improves-guest-experience',
    title: 'How Self Check-In Improves Guest Experience (and Host Reviews)',
    description:
      'Self check-in isn\'t just a convenience for hosts — it meaningfully improves the guest experience. Here\'s why keyless entry boosts review scores and how to implement it properly.',
    publishedAt: '2025-02-18',
    author: 'Propvian Team',
    category: 'Guest Experience',
    tags: ['Self Check-In', 'Guest Experience', 'Airbnb Reviews', 'Smart Lock'],
    readingTime: 6,
    sections: [
      {
        type: 'p',
        content:
          "Self check-in has shifted from a niche perk to an expected feature on short-term rental platforms. Guests actively filter for it on Airbnb. When done well — with the right code sent at the right time — it leads to smoother arrivals, fewer questions, and better reviews.",
      },
      {
        type: 'h2',
        content: "Why guests prefer self check-in",
      },
      {
        type: 'ul',
        items: [
          'Flight delays, traffic, and schedule changes are common — guests don\'t want to coordinate with a host in real time',
          'Early arrivals or late-night check-ins become feasible without burdening anyone',
          'Privacy — not all guests want to make small talk when they arrive',
          'Airbnb highlights self check-in as a key amenity in search results',
          'The experience feels modern, professional, and well-organized',
        ],
      },
      {
        type: 'h2',
        content: 'The self check-in workflow that works',
      },
      {
        type: 'p',
        content:
          "The key to a successful self check-in experience is timing and clarity. The guest needs the code before they arrive, the instructions need to be unambiguous, and the code has to work. Anything that breaks that chain leads to a frustrated guest and a support call.",
      },
      {
        type: 'ol',
        items: [
          'Reservation is confirmed — code is generated immediately in the background',
          'A day before check-in, send the guest a message with the code and step-by-step instructions',
          'Include photos of the door and keypad in your check-in message',
          'Code is time-limited — it only activates from check-in time, not before',
          'On checkout, the code expires automatically',
        ],
      },
      {
        type: 'h2',
        content: 'How smart locks make it reliable',
      },
      {
        type: 'p',
        content:
          "The failure mode of DIY self check-in is human error. You forget to generate the code. You send the wrong one. You forget to revoke it. Smart lock automation eliminates these failure points — the code is generated the moment the reservation is confirmed, the revocation happens automatically on checkout, and you always have the current code in your dashboard if the guest needs it resent.",
      },
      {
        type: 'h2',
        content: 'What to include in your check-in message',
      },
      {
        type: 'ul',
        items: [
          'The door code',
          'Exact location of the keypad (with a photo if possible)',
          'How to enter: press *, enter code, press # (or your lock\'s specific sequence)',
          'What to do if the code doesn\'t work (contact number)',
          'Parking instructions',
          'Wi-Fi password',
          'Your checkout time and process',
        ],
      },
      {
        type: 'h2',
        content: 'Self check-in and your review score',
      },
      {
        type: 'p',
        content:
          "Airbnb's review system includes a specific category for Check-in experience. Hosts with seamless self check-in consistently score higher in this category. The correlation is intuitive: a smooth arrival sets a positive tone for the entire stay. Guests who struggle at the door — even briefly — start their experience already frustrated, and that colors everything that follows.",
      },
      {
        type: 'tip',
        content:
          "Add a short video walkthrough to your check-in message. A 30-second screen recording showing where the keypad is and how to use it reduces check-in support messages by a significant margin.",
      },
      {
        type: 'faq',
        faqs: [
          {
            q: 'Is self check-in safe for guests?',
            a: "Self check-in is very safe when implemented with time-limited codes. The guest's code is unique to their reservation and expires automatically at checkout. No past guest can reuse a previous code. This is actually more secure than physical keys, which can be copied.",
          },
          {
            q: 'What do I do if a guest can\'t get in?',
            a: "Have a backup plan: a management app where you can view or regenerate the code instantly, a secondary entry point, or a lockbox with a physical key as a last resort. With automation, you'll always know the current active code — no more searching through texts trying to remember what you sent.",
          },
          {
            q: 'Do all Airbnb guests want self check-in?',
            a: "Most do, especially experienced Airbnb users. Some guests, particularly elderly travelers or those unfamiliar with the concept, may prefer a key or in-person greeting. A brief message before arrival asking if they have any questions gives anxious guests a chance to reach out.",
          },
        ],
      },
      {
        type: 'cta',
        content: 'Set up self check-in automation',
      },
    ],
  },
  {
    slug: 'how-to-automatically-generate-guest-door-codes',
    title: 'How to Automatically Generate Guest Door Codes',
    description:
      'A technical and practical guide to setting up automatic door code generation for short-term rental properties. From reservation sync to TTLock code creation.',
    publishedAt: '2025-03-04',
    author: 'Propvian Team',
    category: 'Automation',
    tags: ['Automation', 'Door Codes', 'TTLock', 'Reservations', 'Access Codes'],
    readingTime: 7,
    sections: [
      {
        type: 'p',
        content:
          "Automatic door code generation sounds complex, but the underlying concept is simple: when a reservation is confirmed, create a time-limited code on your smart lock. When the reservation ends, remove it. The challenge is connecting the reservation calendar to the lock API reliably and handling edge cases like cancellations, date changes, and early checkouts.",
      },
      {
        type: 'h2',
        content: 'The components of automated access code management',
      },
      {
        type: 'ul',
        items: [
          'A reservation data source — Airbnb, Booking.com, or any iCal-compatible calendar',
          'A smart lock with API access — TTLock is the most automation-friendly option',
          'A background job that monitors the calendar for changes',
          'Logic to create, update, and revoke codes based on reservation status',
          'Host notifications so you always know what code to give the guest',
        ],
      },
      {
        type: 'h2',
        content: 'How iCal sync works',
      },
      {
        type: 'p',
        content:
          "Most booking platforms export a standard iCal (.ics) calendar file. This file contains events representing reservations — each event has a start date (check-in), end date (check-out), and a unique identifier. Automation software fetches this file periodically, compares it to the previously seen state, and processes any changes (new reservations, cancellations, date modifications).",
      },
      {
        type: 'h2',
        content: 'The code generation lifecycle',
      },
      {
        type: 'ol',
        items: [
          'New reservation detected in iCal → create a TTLock code with validity matching check-in to check-out times',
          'Date change detected → delete old code, create new code with updated validity',
          'Cancellation detected → delete the code immediately',
          'Checkout time reached → TTLock time-limited code expires automatically (backup: scheduled deletion)',
          'Notification sent to host before each check-in with guest name and code',
        ],
      },
      {
        type: 'h2',
        content: 'Time zones and check-in times',
      },
      {
        type: 'p',
        content:
          "One of the most common edge cases is time zones. Your iCal feed may report dates in UTC while your property is in a different time zone. Automation software needs to know the property's local time zone to set correct code validity windows. Additionally, most iCal feeds only include dates, not specific check-in/out times. Propvian lets you configure default check-in and check-out times per property.",
      },
      {
        type: 'h2',
        content: 'Handling overlapping reservations',
      },
      {
        type: 'p',
        content:
          "Back-to-back reservations (one guest checking out as another checks in) require careful code management. The outgoing guest's code must expire before or exactly at checkout time, and the incoming guest's code must activate from check-in time. Using TTLock's native time-limited code feature handles this cleanly — the lock enforces the time boundaries independently of any software state.",
      },
      {
        type: 'tip',
        content:
          "Set your outgoing code expiry 30 minutes before your default checkout time and your incoming code activation 30 minutes after your default check-in time. This gives you a buffer for cleaning and prevents any overlap.",
      },
      {
        type: 'h2',
        content: 'What happens with manual bookings?',
      },
      {
        type: 'p',
        content:
          "Not every reservation comes through Airbnb or Booking.com. Direct bookings, corporate rentals, and last-minute deals often happen outside the automated platforms. Propvian lets you create manual reservations in the dashboard for these cases, and the same automation applies — a code gets generated and managed automatically.",
      },
      {
        type: 'faq',
        faqs: [
          {
            q: 'What if the API call to TTLock fails when generating a code?',
            a: "Propvian retries failed code generation attempts automatically. If after multiple retries the code still can't be created, you receive an alert so you can handle it manually. Failures are rare — the TTLock API is generally reliable.",
          },
          {
            q: 'Can I set different check-in times per reservation?',
            a: "Yes. While default times are set per property, you can override the check-in and check-out time for any individual reservation in the Propvian dashboard. The code validity will be updated accordingly.",
          },
          {
            q: 'Is there a limit to how many codes TTLock supports?',
            a: "TTLock locks support multiple simultaneous codes — typically dozens to hundreds, depending on the hardware model. For a rental property with sequential guests, you'd typically have at most 2–3 codes active at any given time, well within any lock's capacity.",
          },
        ],
      },
      {
        type: 'cta',
        content: 'Automate your guest door codes',
      },
    ],
  },
  {
    slug: 'vacation-rental-automation-guide',
    title: 'Vacation Rental Automation: What You Can (and Can\'t) Automate in 2025',
    description:
      'A clear-eyed guide to vacation rental automation. We cover what\'s worth automating, what requires human judgment, and how to build a system that scales without losing the personal touch.',
    publishedAt: '2025-03-20',
    author: 'Propvian Team',
    category: 'Property Management',
    tags: ['Vacation Rental', 'Automation', 'Property Management', 'Airbnb', 'Short-Term Rental'],
    readingTime: 10,
    sections: [
      {
        type: 'p',
        content:
          "The vacation rental industry has embraced automation enthusiastically — sometimes too enthusiastically. Not everything benefits from being automated, and the hosts who scale successfully are the ones who automate the right things while keeping human judgment in the loop where it matters. Here's a practical breakdown.",
      },
      {
        type: 'h2',
        content: 'What you should automate',
      },
      {
        type: 'h3',
        content: 'Guest access (door codes)',
      },
      {
        type: 'p',
        content:
          "This is the single highest-ROI automation in the industry. Manual code management is time-consuming, error-prone, and doesn't scale. Automated code generation and revocation tied to your reservation calendar eliminates the entire workflow. Once set up, it runs in the background while you focus on other things.",
      },
      {
        type: 'h3',
        content: 'Cleaning task scheduling',
      },
      {
        type: 'p',
        content:
          "When a guest checks out, a cleaning task should appear automatically. If you work with a cleaning crew, they should receive a notification with the property address, expected checkout time, and next check-in time so they know the window they have. This is table-stakes automation for multi-property operators.",
      },
      {
        type: 'h3',
        content: 'Calendar synchronization',
      },
      {
        type: 'p',
        content:
          "If you list on multiple platforms, calendar sync prevents double-bookings. When a reservation is confirmed on Airbnb, the dates are automatically blocked on Booking.com and VRBO. This is critical at scale — manual calendar management across multiple platforms is where double-bookings happen.",
      },
      {
        type: 'h3',
        content: 'Reservation data aggregation',
      },
      {
        type: 'p',
        content:
          "Pulling all reservations from all platforms into a single dashboard gives you visibility without tab-switching. You see upcoming arrivals, current guests, and recent checkouts in one place.",
      },
      {
        type: 'h2',
        content: 'What you should not automate',
      },
      {
        type: 'h3',
        content: 'Guest communication (mostly)',
      },
      {
        type: 'p',
        content:
          "Automated check-in instructions? Yes. Automated pre-arrival messages? With care. But automated responses to guest questions, complaints, or special requests are a recipe for poor reviews. Guests can tell when they're talking to a bot, and the experience is jarring in a context where they're paying for hospitality.",
      },
      {
        type: 'h3',
        content: 'Pricing decisions',
      },
      {
        type: 'p',
        content:
          "Dynamic pricing tools can help, but setting your pricing on autopilot without human review leads to surprises — sometimes pricing too high during local events you didn't know about, sometimes underpricing during peak demand. Use dynamic pricing as a starting point, not the final word.",
      },
      {
        type: 'h3',
        content: 'Guest screening',
      },
      {
        type: 'p',
        content:
          "Automated tools can flag suspicious bookings, but accepting or declining a guest requires human judgment. The factors that matter most — gut feel, booking context, the nature of a stay — aren't reliably captured by an algorithm.",
      },
      {
        type: 'h2',
        content: 'Building a sustainable automation stack',
      },
      {
        type: 'p',
        content:
          "The best automation stack for a short-term rental operator typically combines a few focused tools rather than one all-in-one platform. Specialized tools that do one thing well are usually more reliable and easier to maintain than generic platforms that try to do everything.",
      },
      {
        type: 'ul',
        items: [
          'Smart lock automation (Propvian) — handles the entire access code lifecycle',
          'Channel manager — syncs availability across platforms, handles reservations',
          'Cleaning management — task assignment and tracking for cleaning crews',
          'Dynamic pricing — rate optimization based on demand signals',
          'Property management system — the central hub for guest data and reporting',
        ],
      },
      {
        type: 'h2',
        content: 'How automation affects the guest experience',
      },
      {
        type: 'p',
        content:
          "Guests don't experience your automation directly — they experience the outcomes. A guest who gets clear check-in instructions with a code that works doesn't know or care whether you generated it manually or automatically. The automation is in service of the outcome. When automation fails — a code doesn't work, a cleaning wasn't scheduled — the guest feels it immediately.",
      },
      {
        type: 'tip',
        content:
          "Always have a human fallback. Every automated process should have a clearly defined manual override. Know what to do when the automation fails, and make sure your guests have a way to reach you directly.",
      },
      {
        type: 'faq',
        faqs: [
          {
            q: 'How many properties can I manage with automation before I need staff?',
            a: "The number varies by property type and market, but most operators find they can manage 5–10 properties solo with a good automation stack and reliable cleaners. Beyond that, the edge cases, guest communication, and maintenance coordination typically require at least part-time help.",
          },
          {
            q: 'Does automation reduce the personal touch that guests appreciate?',
            a: "Only if you automate the wrong things. Automating door codes doesn't reduce personal touch — it removes friction from arrival. Automating your responses to a guest's complaint does reduce personal touch. The distinction matters: automate processes, not relationships.",
          },
        ],
      },
      {
        type: 'cta',
        content: 'Start with the most impactful automation',
      },
    ],
  },
  {
    slug: 'manage-multiple-airbnb-locks',
    title: 'How to Manage Multiple Airbnb Locks Efficiently',
    description:
      'Managing smart locks across multiple Airbnb properties doesn\'t have to be complex. Here\'s how to set up a system that keeps every property secure without eating up your time.',
    publishedAt: '2025-04-10',
    author: 'Propvian Team',
    category: 'Property Management',
    tags: ['Multi-Property', 'Airbnb', 'Smart Lock', 'Property Management', 'TTLock'],
    readingTime: 6,
    sections: [
      {
        type: 'p',
        content:
          "One property is manageable. Two is busier. Five is a business. The jump from managing one Airbnb to managing several is where the systems you've been getting by with — texting codes, using the TTLock app manually — break down completely. Here's how to build a multi-property lock management system that actually scales.",
      },
      {
        type: 'h2',
        content: 'The multi-property problem',
      },
      {
        type: 'p',
        content:
          "With multiple properties, the number of door codes you're managing multiplies quickly. If each property has 10 reservations per month, that's 10 codes to create, send, and revoke per property. At five properties, that's 50 code management events per month — a significant time investment if done manually, and a significant failure surface.",
      },
      {
        type: 'h2',
        content: 'Setting up a multi-property system',
      },
      {
        type: 'ol',
        items: [
          'Create each property in Propvian with its own name and time zone',
          'Connect the corresponding Airbnb and Booking.com iCal feeds per property',
          'Connect the TTLock lock(s) at each property to the corresponding Propvian property',
          'Set default check-in and check-out times for each property separately',
          'Enable automation globally — all properties run the same logic',
        ],
      },
      {
        type: 'h2',
        content: 'Property-level configuration matters',
      },
      {
        type: 'p',
        content:
          "Each property has its own quirks. One property might have a 2pm check-in while another allows 3pm. One property is in UTC-5 while another is in UTC+1. A good multi-property system lets you configure these per-property defaults so the automation generates codes with the right validity windows for each location.",
      },
      {
        type: 'h2',
        content: 'Notifications per property',
      },
      {
        type: 'p',
        content:
          "As a multi-property operator, you need to know which property has an arriving guest and which code to give them — without digging through a dashboard. Propvian sends notifications that include the property name, guest name, arrival time, and code. You can forward this directly to your cleaner or co-host at that property.",
      },
      {
        type: 'h2',
        content: 'Delegating to co-hosts or property managers',
      },
      {
        type: 'p',
        content:
          "If you work with co-hosts or local property managers, they can be added to your Propvian organization with access limited to specific properties. They see the codes and reservations for their properties and receive the same notifications without having visibility into your other listings.",
      },
      {
        type: 'tip',
        content:
          "Create a shared communication template for your cleaners that includes the checkout time, next check-in time, and a reminder to check that the lock is working. Send it automatically alongside your cleaning task notifications.",
      },
      {
        type: 'faq',
        faqs: [
          {
            q: 'Is the cost per lock or per property?',
            a: "Propvian is priced at $2 per lock per month. If a property has two doors, each with its own lock, that's $4 per month for that property. If a property has a single main entrance, it's $2.",
          },
          {
            q: 'Can I connect locks from different properties to one account?',
            a: "Yes, one Propvian account handles all your properties. You manage everything from a single dashboard with property-level filtering. Each lock is assigned to a specific property, and automation is configured per property.",
          },
        ],
      },
      {
        type: 'cta',
        content: 'Scale your lock management across all properties',
      },
    ],
  },
  {
    slug: 'ttlock-setup-guide',
    title: 'TTLock Setup Guide: Connect Your Lock and Get Started',
    description:
      'A practical walkthrough for setting up TTLock and connecting it to your short-term rental management workflow. Covers account setup, lock pairing, and integration with automation software.',
    publishedAt: '2025-04-28',
    author: 'Propvian Team',
    category: 'Guides',
    tags: ['TTLock', 'Setup Guide', 'Smart Lock', 'Getting Started'],
    readingTime: 8,
    sections: [
      {
        type: 'p',
        content:
          "TTLock is a versatile smart lock platform used by hosts worldwide for rental property access management. If you've just received a TTLock-compatible lock or you're evaluating whether to switch, this guide walks you through everything from unboxing to integrating with your reservation calendar.",
      },
      {
        type: 'h2',
        content: 'What is TTLock?',
      },
      {
        type: 'p',
        content:
          "TTLock is a firmware and cloud platform — not a specific lock brand. Dozens of manufacturers make locks that run the TTLock firmware, which means they all work with the TTLock app and the TTLock cloud API. This is what makes TTLock attractive for automation: the standardized API allows software to create, modify, and revoke door codes programmatically without manufacturer-specific integrations.",
      },
      {
        type: 'h2',
        content: 'Step 1: Install and pair the lock',
      },
      {
        type: 'p',
        content:
          "Follow your lock manufacturer's instructions to physically install the lock. Once installed, download the TTLock app (iOS or Android), create a TTLock account, and pair the lock using the app. Pairing is Bluetooth-based and typically takes 1–2 minutes.",
      },
      {
        type: 'h2',
        content: 'Step 2: Set up gateway for remote access (optional but recommended)',
      },
      {
        type: 'p',
        content:
          "For full remote management, you'll need a TTLock gateway (also called a G2 or Wi-Fi gateway). This small device plugs into a power outlet near the lock, connects to your property's Wi-Fi, and relays commands between the TTLock cloud and the lock. Without a gateway, you can only manage the lock when your phone is within Bluetooth range.",
      },
      {
        type: 'tip',
        content:
          "Place the gateway within Bluetooth range of the lock — typically within 5–10 meters with no obstacles. Most gateways have a signal indicator that shows connection quality.",
      },
      {
        type: 'h2',
        content: 'Step 3: Test code creation in the TTLock app',
      },
      {
        type: 'p',
        content:
          "Before connecting to any automation software, verify that the lock is working correctly by creating a test access code through the TTLock app. Set a specific validity window (e.g., valid for the next hour) and test that the code opens the lock, then expires when expected.",
      },
      {
        type: 'h2',
        content: 'Step 4: Connect to Propvian',
      },
      {
        type: 'p',
        content:
          "In Propvian, navigate to Locks and click Add Lock. You'll be prompted to authorize your TTLock account — this is an OAuth flow that grants Propvian permission to manage codes on your behalf without sharing your TTLock password. Your locks will then appear in Propvian, ready to be assigned to properties.",
      },
      {
        type: 'h2',
        content: 'Step 5: Connect your booking calendar',
      },
      {
        type: 'p',
        content:
          "Add your Airbnb, Booking.com, or other booking platform calendar in the Integrations section. Once the calendar is synced and the lock is assigned to a property, you can enable automation. The system will process upcoming reservations and generate codes automatically.",
      },
      {
        type: 'h2',
        content: 'Troubleshooting common TTLock issues',
      },
      {
        type: 'ul',
        items: [
          "Code not working: verify the lock's clock is synced correctly — time-limited codes depend on accurate time",
          "Gateway offline: check that the gateway is plugged in and within range of both the lock and the Wi-Fi router",
          "Lock not found in app: re-pair the lock by holding the reset button as specified in your lock's manual",
          "Code generation failing: check that your TTLock account has sufficient balance (some regions use a credit system) or that the gateway is online",
        ],
      },
      {
        type: 'faq',
        faqs: [
          {
            q: 'Do I need to keep my phone at the property for TTLock to work?',
            a: "No. With a Wi-Fi gateway installed at the property, the lock communicates with the TTLock cloud over the internet. You can manage it remotely from anywhere. The gateway handles the local Bluetooth communication so your phone doesn't need to be present.",
          },
          {
            q: 'What TTLock lock models work with Propvian?',
            a: "Propvian works with all lock models that support the TTLock cloud API. This includes virtually every lock that works with the official TTLock app. Check your lock's packaging or documentation for TTLock branding or app compatibility.",
          },
          {
            q: 'Is TTLock secure?',
            a: "TTLock uses AES encryption for communication between the app, gateway, and lock. Time-limited codes add an additional security layer — even if a code is intercepted, it only works during the specified validity window. For rental properties, this is meaningfully more secure than physical keys.",
          },
        ],
      },
      {
        type: 'cta',
        content: 'Connect your TTLock to Propvian',
      },
    ],
  },
  {
    slug: 'how-to-increase-direct-bookings',
    title: 'How to Increase Direct Bookings for Hotels and Vacation Rentals (Without Quitting the OTAs)',
    description: 'A practical guide to how to increase direct bookings for hotels and short-term rentals: build a channel that wins repeat guests and saves you 3-15% per stay, without breaking Airbnb rules.',
    publishedAt: '2026-06-18',
    author: 'Propvian Team',
    category: 'Direct Bookings',
    tags: ['direct bookings', 'vacation rental marketing', 'short-term rentals', 'OTA fees', 'guest retention'],
    readingTime: 9,
    featured: true,
    sections: [
      {
        type: 'p',
        content: "Every host who has been at this for more than a season has the same quiet realization: the guest who just left a five-star review, the one who said they’d be back next summer, books their return trip through Airbnb again. You pay the commission a second time on a guest you already won. That is the gap a direct booking channel closes."
      },
      {
        type: 'p',
        content: "This guide is for independent operators running anywhere from one cabin to a dozen apartments. It is not a pitch to abandon the OTAs — they are still the best discovery engine ever built for travel. It is about building a second channel that captures the guests you have already earned, so you stop renting your own repeat business back from a platform."
      },
      {
        type: 'h2',
        content: 'Set a realistic target before you start'
      },
      {
        type: 'p',
        content: "The honest answer to how to get more direct bookings starts with a number that is not 100 percent. Hosts who chase a fully direct business usually burn out and lose the OTA visibility that fills their slow weeks. A healthier goal for most small operators is moving 20 to 40 percent of total bookings to your own site within the first year or two, weighted heavily toward repeat guests and referrals."
      },
      {
        type: 'p',
        content: "Why that range? Cold travelers searching “cabin near Asheville” will keep finding you on the OTAs, and that is fine. Your direct channel wins the warm traffic: people who already stayed with you, friends they recommend you to, and anyone who finds your property name and searches for it directly. Those guests convert without a commission attached, and they are far more likely to come back."
      },
      {
        type: 'p',
        content: "Run the math on what that actually saves. A property renting at $1,500 a month loses roughly $45 to $225 every month to OTA fees in the 3 to 15 percent range. Shift even a third of your nights to direct and the savings compound fast — and unlike the commission, that money does not scale up as your rates rise."
      },
      {
        type: 'h2',
        content: 'The foundation: a booking site guests actually trust'
      },
      {
        type: 'p',
        content: "You cannot drive traffic to a channel that does not exist yet. Before any marketing, you need a website where a guest can see real availability, pick dates, and pay — in the same number of taps the OTA gives them. If your “direct option” is a contact form and a back-and-forth email thread, guests will quietly give up and rebook on the platform they trust."
      },
      {
        type: 'p',
        content: "A direct booking site that converts needs a few non-negotiables:"
      },
      {
        type: 'ul',
        items: [
          "Real-time availability that is never wrong. Nothing kills trust faster than a guest booking a date you already filled on Airbnb. A one-way iCal sync that pulls your OTA calendars every 15 minutes blocks those dates automatically so you never double-book.",
          "Instant payment to your own account. Guests expect to pay and be done. Direct Stripe and PayPal checkout, with funds landing in your account rather than a platform holding them, removes the friction and the wait.",
          "A mobile-first design. Most travel browsing happens on a phone. If your site is awkward to scroll or the date picker fights the thumb, you lose the booking.",
          "Your own domain and an HTTPS padlock. A custom domain like yourcabin.com signals you are a real business, not a hobby listing. The padlock signals their card is safe.",
          "Clear photos, pricing, and house rules up front. Guests are comparing you to the OTA listing they already saw. Give them the same confidence without the comparison tax."
        ]
      },
      {
        type: 'p',
        content: "This is exactly the stack Propvian was built to give a non-technical host: a drag-and-drop builder with 16-plus section types and 6 templates, a calendar with hold timers and buffer days backed by a database constraint that makes overlapping bookings impossible, and direct Stripe and PayPal checkout — all for a flat $10 per active property per month, no commission. To be clear about what it is not: there is no two-way channel manager here. The iCal sync is one-way, pulling OTA bookings in to block your calendar, which is what a host of this size actually needs."
      },
      {
        type: 'tip',
        content: "Put your direct-site URL everywhere the OTA does not control: your physical signage, the welcome guide in the property, your business cards, your email signature, and your social profiles. A QR code on the fridge that opens your booking page is one of the cheapest, highest-converting things you can do."
      },
      {
        type: 'h2',
        content: 'How to win repeat guests the right way (and stay within the rules)'
      },
      {
        type: 'p',
        content: "This is where hosts get nervous, and where bad advice gets people in trouble, so let us be precise. Airbnb’s terms prohibit soliciting a guest to take their current, active reservation off the platform — you cannot tell someone mid-stay to cancel and rebook with you direct. Do not do that."
      },
      {
        type: 'p',
        content: "What is entirely different, and is how real hosts build this channel, is reaching a past guest after their stay is complete, through your own contact details, to invite them to book directly next time. Once someone has stayed and you have their email from a direct interaction or your own guest communications, a friendly follow-up offering a returning-guest rate is your business talking to your customer. That is not a violation — it is just retention."
      },
      {
        type: 'p',
        content: "A simple, compliant sequence that works:"
      },
      {
        type: 'ol',
        items: [
          "During the stay, deliver a genuinely great experience and leave a printed welcome guide that includes your direct site and a small thank-you for booking.",
          "A few days after checkout, send a thank-you message through your own channels and ask for feedback — this is also when you collect or confirm their email for future contact.",
          "Weeks or months later, reach out directly with a returning-guest offer: a small discount, early access to peak dates, or a promo code that only works on your site.",
          "Tag and remember your best guests. A past guest who books direct twice is worth more than ten cold OTA arrivals.",
          "Make referrals easy. Give happy guests a code they can pass to friends, so word-of-mouth lands on your site instead of a search result."
        ]
      },
      {
        type: 'p',
        content: "Tools like automated booking confirmations, a guest messaging inbox, and promo codes turn this from a sticky-note system into something you can run across a dozen properties without losing track. The goal is not to trick anyone off a platform — it is to own the relationship with guests you have already earned."
      },
      {
        type: 'h2',
        content: 'Make the direct option the obvious choice'
      },
      {
        type: 'p',
        content: "Once the site exists and you are collecting guests, a few habits steadily increase hotel direct bookings without a marketing budget."
      },
      {
        type: 'ul',
        items: [
          "Give people a reason. A modest direct-only discount or a perk like a free late checkout often costs you less than the OTA commission you would have paid anyway.",
          "Be findable by name. When a guest who saw your OTA listing searches your property name later, your own site should be the first result they hit. A custom domain and clear branding do most of this work.",
          "Watch your numbers. Use your booking analytics to see which channel each reservation came from and which promo codes actually move people, then double down on what works.",
          "Reduce check-in friction. Self-check-in removes a common booking hesitation; an optional smart-lock integration can automate it if your properties need it.",
          "Keep the OTAs healthy. Your platform listings are still feeding the top of your funnel. Protect those reviews and rankings — they are what makes your direct channel grow."
        ]
      },
      {
        type: 'p',
        content: "None of this happens overnight. The hosts who succeed treat direct bookings as a flywheel: every stay adds a guest to the list, every follow-up brings a few back, and over a couple of seasons a meaningful slice of your calendar fills without a commission attached."
      },
      {
        type: 'h2',
        content: 'Frequently asked questions'
      },
      {
        type: 'faq',
        faqs: [
          {
            q: "Will I get banned from Airbnb for taking direct bookings?",
            a: "Not for having a direct booking site or for inviting past guests to book directly next time. The line you cannot cross is soliciting a guest to move their current, active reservation off the platform during their stay. Reaching out after a completed stay through your own contact details to offer a future direct booking is standard retention and does not violate the terms."
          },
          {
            q: "What percentage of my bookings can realistically become direct?",
            a: "For most independent hosts, 20 to 40 percent within a year or two is a healthy, achievable target, with the bulk coming from repeat guests and referrals. Chasing 100 percent usually means sacrificing the OTA discovery that fills your slow periods, so a blended approach almost always earns more overall."
          },
          {
            q: "How do I avoid double-booking between my site and the OTAs?",
            a: "Use a calendar that syncs with your OTA listings. Propvian pulls your Airbnb and Booking.com calendars via one-way iCal every 15 minutes and blocks those dates on your direct site, while a database-level constraint makes it impossible for two bookings to overlap. Note this is one-way: it imports OTA bookings to block your dates, it does not push your direct bookings back out."
          },
          {
            q: "Do I need to be technical to build a direct booking site?",
            a: "No. A no-code builder lets you assemble a mobile-responsive site by dragging sections into place and choosing a template. You connect your own Stripe or PayPal account so payments go straight to you, point your custom domain at it, and you are taking bookings without writing code."
          },
          {
            q: "How much does a direct channel actually save versus OTA fees?",
            a: "OTA platforms typically take 3 to 15 percent per booking. On a property renting at $1,500 a month that is $45 to $225 every month. A flat $10 per property per month with no commission means the savings grow as your rates and occupancy do, instead of the fee growing with them."
          }
        ]
      },
      {
        type: 'cta',
        content: "Build your direct booking channel with Propvian"
      }
    ]
  },
  {
    slug: 'direct-booking-vs-ota',
    title: 'Direct Booking vs OTA: An Honest Breakdown for Vacation Rental Hosts',
    description: 'A fair, specific look at direct booking vs Airbnb and other OTAs, what each channel actually wins at, and how to split your effort without torching your bookings.',
    publishedAt: '2026-06-18',
    author: 'Propvian Team',
    category: 'Direct Bookings',
    tags: ['Direct Bookings', 'OTA', 'Airbnb', 'Booking Strategy', 'Vacation Rentals'],
    readingTime: 7,
    sections: [
      {
        type: 'p',
        content: "Most hosts ask the wrong version of this question. It is not \"should I use Airbnb or my own site\" — it is \"which job am I hiring each channel to do?\" Once you frame it that way, the direct booking vs OTA debate stops being a loyalty test and starts being a math and logistics problem. Below is the honest version, including the parts that make direct booking harder than the influencers admit."
      },
      {
        type: 'h2',
        content: 'Where the money actually goes'
      },
      {
        type: 'p',
        content: "Start with the fees, because that is the reason most hosts go looking for an alternative in the first place. The structures differ enough that a flat percentage is misleading."
      },
      {
        type: 'ul',
        items: [
          "Airbnb: under the common split-fee model the host pays roughly 3%, while the guest separately pays a service fee usually in the 14-16% range. That guest fee does not come out of your payout, but it does inflate the price the traveler sees, which quietly affects your conversion and your reviews on \"value.\"",
          "Vrbo: generally around 5% host commission plus payment processing on top.",
          "Booking.com: typically 15-18% commission, paid entirely by the host. This is the one that stings, because the whole cut lands on your side of the ledger.",
          "Direct booking through your own site: you pay normal Stripe or PayPal card processing (roughly 3% plus a fixed fee), and with Propvian a flat $10/month per active property. No per-booking commission."
        ]
      },
      {
        type: 'p',
        content: "Put real numbers on it. On a property doing $1,500 a month, OTA commissions in the 3-15% range cost you somewhere between $45 and $225 every month. The flat-fee direct alternative is $10 plus your card processing. Over a year that gap is the difference between a new mattress and a new kitchen. None of this means OTAs are a rip-off — it means you are paying for something. The question is whether you still need what you are paying for."
      },
      {
        type: 'h2',
        content: 'What OTAs genuinely do better'
      },
      {
        type: 'p',
        content: "Here is the part the direct-booking crowd tends to skip. Airbnb, Vrbo, and Booking.com are not just expensive listing pages. They are demand engines that took a decade and billions of dollars to build, and they hand you that demand on day one."
      },
      {
        type: 'p',
        content: "Cold discovery is the big one. When a traveler in another country who has never heard of your town opens an app and searches \"cabin near the lake,\" the OTA puts you in front of them. Your own website cannot do that on its own — nobody is googling a property they do not know exists. OTAs also carry built-in trust. A first-time guest will hand their card to Airbnb without a second thought because of the reviews, the brand, and the resolution center sitting behind the booking. That trust is borrowed, but it is real, and it converts strangers who would never book a website they have never seen."
      },
      {
        type: 'p',
        content: "They also handle the messy parts: dispute mediation, a standardized review system, and a payment flow guests already understand. You pay a commission, but you are renting a sales team, a fraud department, and a marketing budget you could never afford alone."
      },
      {
        type: 'h2',
        content: 'What direct booking genuinely does better'
      },
      {
        type: 'p',
        content: "Direct booking wins on the relationship and the margin — but mostly with guests who already know you. A repeat guest, a referral from a past guest, a follower from your local Instagram: these people do not need Airbnb to feel safe booking with you. Sending them to a 15% commission channel to rebook a place they have already stayed in is pure leakage."
      },
      {
        type: 'p',
        content: "When you own the booking, you own the data. You get the guest's real email, you can run a promo code for the shoulder season, you can pitch them directly next year, and you can build a list that is yours rather than the platform's. You also stop living under the algorithm. OTA ranking can change overnight, and a tweak to the search formula can quietly cut your visibility in half with no warning and no appeal. A direct booking is not subject to anyone's ranking experiment."
      },
      {
        type: 'p',
        content: "Be honest about the tradeoff, though. Direct booking does not come with Airbnb's resolution center for free. Stripe and PayPal both offer their own buyer-and-seller protections and chargeback processes, which are not nothing, but they are not a hospitality dispute service that knows what a \"the hot tub was cold\" complaint should cost. You are taking on more of the relationship, and that includes the awkward parts."
      },
      {
        type: 'h2',
        content: 'The hotel comparison is instructive'
      },
      {
        type: 'p',
        content: "The hotel direct booking vs OTA fight has been running for years, and hotels figured something out that vacation rental hosts can copy. They never abandoned the OTAs — Expedia and Booking.com still drive enormous volume. Instead they used the OTA to acquire a guest once, then spent everything on getting that guest to book direct the second time: loyalty points, member rates, free breakfast for booking on the brand site. The OTA became the top of the funnel, and the direct channel became where the margin lived. That blended model, not a clean break, is what actually works."
      },
      {
        type: 'h2',
        content: 'A realistic blended strategy'
      },
      {
        type: 'p',
        content: "Do not delete your listings. Use each channel for the job it is best at."
      },
      {
        type: 'ol',
        items: [
          "Keep your OTA listings live for cold discovery — they are your acquisition channel for strangers, and worth the commission for that.",
          "Stand up your own direct booking site as the place repeat guests, referrals, and your social audience land. Make it the obvious destination on your business cards, welcome book, and checkout follow-up.",
          "Connect the two so you never double-book. Propvian does a one-way iCal pull from Airbnb and Booking.com every 15 minutes, blocking already-booked OTA dates on your direct calendar automatically.",
          "Capture the guest data you only get from direct — email, return-stay promo codes, a list that is actually yours.",
          "Nudge the rebook. After a great stay, send guests to your own site with a returning-guest discount. Even shifting 20% of your repeat business off the OTA pays for the whole setup many times over."
        ]
      },
      {
        type: 'tip',
        content: "Do not put your direct-site URL inside your Airbnb listing or messages — Airbnb hides off-platform contact details and can penalize or remove listings for steering. Hand out your site in your printed welcome book, on the property, and in your post-checkout email instead, where platform rules do not apply."
      },
      {
        type: 'p',
        content: "Propvian is built for exactly this side of the equation. It is not a channel manager and it will not replace your OTA listings — it is a no-code site builder with a real availability calendar (hold system, buffer days, seasonal pricing, and a database constraint that makes overlapping bookings impossible), direct Stripe and PayPal payments that land in your own account, and the iCal sync to keep everything aligned. It fits independent hosts running roughly 1-15 properties, which is most of the people reading this."
      },
      {
        type: 'faq',
        faqs: [
          {
            q: "Is direct booking always cheaper than an OTA?",
            a: "On fees, almost always — a flat $10/month plus card processing beats a 3-18% commission on most properties. But \"cheaper\" assumes the booking would have happened anyway. For a stranger who found you through Airbnb's search, the commission bought you a guest you would not otherwise have. Direct is cheapest on bookings you were going to get regardless: repeats and referrals."
          },
          {
            q: "Will I lose guest protection if I book direct instead of through Airbnb?",
            a: "You lose Airbnb's resolution center, which mediates disputes between hosts and guests. You do not lose all protection — Stripe and PayPal provide their own payment-dispute and chargeback handling. It is a real difference, though, so it is worth having a clear cancellation policy and a security-deposit process of your own before you take direct bookings at volume."
          },
          {
            q: "How do I avoid double-booking across my OTA and my direct site?",
            a: "Sync calendars. Propvian pulls availability from Airbnb and Booking.com via one-way iCal every 15 minutes and blocks those dates on your direct calendar, so an OTA booking can never collide with a direct one. Note that it is one-way: a direct booking is held safely on Propvian, but you should also block those dates manually on the OTA if you want them hidden there too."
          },
          {
            q: "Should a host with just one or two properties even bother with a direct site?",
            a: "Yes, if you get any repeat or referral business. The fee savings on even a handful of direct bookings a year usually cover the cost, and you start building a guest list you control. If you run a single property that lives entirely on cold OTA discovery and never sees a return guest, the payoff is smaller — be honest with yourself about where your bookings come from."
          }
        ]
      },
      {
        type: 'cta',
        content: "Build your direct booking site and keep more of every stay."
      }
    ]
  },
  {
    slug: 'best-direct-booking-software-independent-hotels',
    title: 'Best Direct Booking Software & Property Management Software for Airbnb Hosts',
    description: 'Comparing property management software for Airbnb and vacation rentals versus lightweight direct booking software, so independent hosts can pick the right tool without overpaying.',
    publishedAt: '2026-06-18',
    author: 'Propvian Team',
    category: 'Direct Bookings',
    tags: ['direct bookings', 'property management software', 'vacation rental software', 'PMS comparison', 'booking engine', 'independent hosts'],
    readingTime: 8,
    sections: [
      {
        type: 'p',
        content: "Most lists of the best direct booking software treat every product as a competitor to every other product, then rank them one through ten. That ranking is misleading. A tool built to push rates across a dozen OTAs for a 60-unit portfolio and a tool built to take a guest's card on your own website are solving different problems. Comparing them on a single scoreboard is how hosts end up paying for a channel manager they never switch on."
      },
      {
        type: 'p',
        content: "So this guide splits the field into two honest categories, tells you plainly which one you belong in, and gives you a checklist you can use no matter which product you choose. We build one of these tools, Propvian, so we will be upfront about where it fits and where it genuinely does not."
      },
      {
        type: 'h2',
        content: 'Two categories, not one ranking'
      },
      {
        type: 'p',
        content: "The first category is full property management software for Airbnb and vacation rental hosts, usually bundled with a channel manager. These platforms exist to manage distribution: they sync your availability and rates two ways across multiple booking sites at once, so when a room sells on one site it closes everywhere within minutes. Many also add front-desk, housekeeping, owner-statement, or point-of-sale modules. That machinery is expensive to build and maintain, which is why these products tend to cost more and often hide pricing behind a demo call."
      },
      {
        type: 'p',
        content: "The second category is the lightweight direct-booking tool. Its job is narrow on purpose: give you a website and a booking engine so guests can reserve and pay you directly, with no commission skimmed off the top. It assumes you already keep your Airbnb or Booking.com listings up to date yourself. It is not trying to be your operations hub. For a host who lists on one or two OTAs and just wants a commission-free channel of their own, the heavy distribution machinery is dead weight."
      },
      {
        type: 'p',
        content: "Neither category is better. They answer different questions. The trick is knowing which question is yours before you start reading feature tables."
      },
      {
        type: 'h2',
        content: 'When a full PMS is the right call (and worth paying for)'
      },
      {
        type: 'p',
        content: "Be honest with yourself here, because picking the wrong category is the most expensive mistake. You want a full PMS with a real channel manager if any of these describe you:"
      },
      {
        type: 'ul',
        items: [
          "You manage roughly 20 units or more, where manual calendar updates stop being realistic.",
          "You distribute across four or more OTAs at the same time and need two-way rate and inventory sync to avoid double bookings.",
          "You run a management company with multiple owners and need owner statements, trust accounting, or per-owner reporting.",
          "You need hotel-style operations: front desk, housekeeping schedules, or point-of-sale."
        ]
      },
      {
        type: 'p',
        content: "If that is you, the channel-manager functionality is genuinely worth the money. Do not try to economize your way out of it with a website builder. The tools commonly evaluated in this tier include Cloudbeds, which leans hotel-PMS-first and often adds front-desk and POS modules; Hostaway, generally aimed at property management companies running larger multi-unit, multi-owner portfolios; and Guesty, which positions itself for larger portfolios and management companies with a broad integrations marketplace. As commonly described, these tend toward quote-based or demo-led pricing rather than flat self-serve rates, so check their current pricing pages directly rather than trusting any number you read in a blog."
      },
      {
        type: 'h2',
        content: 'When a lightweight direct-booking tool is the right call'
      },
      {
        type: 'p',
        content: "The other camp fits a much more common situation than the big-PMS marketing implies. You run somewhere between one and fifteen properties. You already manage your OTA listings yourself and you are fine doing that. What you actually want is a direct channel: a website where repeat guests and referrals can book you without Airbnb or Booking.com taking a cut. The math is simple. Every direct booking you take is the commission you keep."
      },
      {
        type: 'p',
        content: "In this tier you will see vacation-rental-focused products. Lodgify, for instance, bundles a website builder with a booking engine and a two-way channel manager, though the channel manager is historically gated to higher tiers and pricing scales with property count. Smoobu is a lighter channel manager popular with smaller portfolios. And there is Propvian, which is deliberately the most stripped-down of the group: a direct booking website builder with no channel manager at all."
      },
      {
        type: 'h3',
        content: 'Where Propvian fits, and where it does not'
      },
      {
        type: 'p',
        content: "Propvian does one thing: it turns your properties into a bookable website you fully control. The builder is no-code drag-and-drop, with 16-plus section types, six templates, mobile-responsive layouts, and custom domain support. The availability calendar is real-time, with a hold system, buffer days, and seasonal pricing rules, backed by a database constraint that makes overlapping bookings impossible rather than merely unlikely. Payments run straight through your own Stripe or PayPal account, so funds never pass through us. Pricing is flat: ten dollars per active property per month, no commission, no sales call, with a 30-day free trial that does not ask for a card."
      },
      {
        type: 'p',
        content: "Here is the honest limitation. Propvian syncs availability one way only. It pulls iCal feeds from Airbnb and Booking.com every fifteen minutes to block dates that are already booked on those sites, so your direct calendar stays accurate. It does not push your direct bookings back out to the OTAs, and it is not a channel manager. If you need two-way sync across several platforms, this is the wrong tool and you should buy something in the first category instead. If you mostly want a commission-free front door for your own properties, the one-way pull is usually all the protection you need."
      },
      {
        type: 'h2',
        content: 'The evaluation checklist (use it on any tool)'
      },
      {
        type: 'p',
        content: "Whichever direction you lean, run every candidate through the same five questions. These cut through the feature lists faster than any review can."
      },
      {
        type: 'ul',
        items: [
          "Commission vs. flat fee: Does the tool take a percentage of each booking, or charge a predictable flat rate? On direct bookings, a commission quietly undoes the reason you wanted a direct channel in the first place.",
          "Who controls the payment processor: Do guest funds land in your own Stripe or PayPal account, or does the vendor hold the money and pay you out later? Direct control means faster cash and fewer disputes.",
          "Custom domain support: Can the booking site live on your own domain? A site stuck on a vendor subdomain hurts trust and your search ranking.",
          "Sync direction: Is calendar sync one-way or two-way, and across how many OTAs? Match this to how many channels you actually run, not the maximum the vendor advertises.",
          "Setup time: Can you launch this week without onboarding calls, or does it require a sales-led implementation? Be realistic about how much of your own time the rollout will eat."
        ]
      },
      {
        type: 'tip',
        content: "Count the OTAs you genuinely keep live before you shop. Hosts routinely buy two-way channel managers to sync three platforms when they only ever actively use one. The channel manager you do not need is the single most common overspend in this market."
      },
      {
        type: 'h2',
        content: 'So which is the best direct booking software?'
      },
      {
        type: 'p',
        content: "There is no single winner, because the question only makes sense once you have placed yourself in a category. Managing a large, multi-OTA, multi-owner operation? A full PMS with a real channel manager is the best direct booking software for you, and the cost is justified. Running a handful of properties and you simply want a commission-free way to take direct reservations alongside the OTAs you already manage? A lightweight direct booking tool will serve you better, cost less, and launch faster. Use the checklist, ignore the feature counts you will never touch, and pick for the operation you actually run."
      },
      {
        type: 'faq',
        faqs: [
          {
            q: "Is Propvian property management software for Airbnb hosts?",
            a: "Not in the full sense of the term. Property management software for Airbnb and vacation rentals usually means a platform with a two-way channel manager, owner reporting, and sometimes housekeeping or front-desk tools. Propvian is narrower by design: it is a direct booking website and calendar, not a replacement for that operational layer. If you manage 20+ units or need multi-OTA rate sync, look at the PMS-class tools in this guide instead. If you just want a commission-free direct channel alongside the OTAs you already manage, Propvian covers that without the PMS price tag."
          },
          {
            q: "Do I still need Airbnb and Booking.com if I use direct booking software?",
            a: "Usually yes, especially early on. OTAs are how new guests discover you. The point of direct booking software is not to replace them but to give repeat and referral guests a commission-free way to rebook with you. Propvian even pulls your OTA calendars in so those bookings block your direct dates automatically."
          },
          {
            q: "What is the difference between a channel manager and a direct booking tool?",
            a: "A channel manager keeps your rates and availability in sync across multiple booking sites at once, typically two-way, and is built for distribution at scale. A direct booking tool focuses on one channel, your own website, so guests can reserve and pay you directly without commission. Some products bundle both; lighter tools like Propvian deliberately do only the latter."
          },
          {
            q: "Is flat-fee pricing really cheaper than commission?",
            a: "For direct bookings, almost always. A commission scales with your revenue, so the more you sell the more you pay, which is exactly backwards for a channel meant to save you money. A flat fee, like Propvian's ten dollars per active property per month, stays the same whether you take one booking or fifty."
          },
          {
            q: "How long does it take to launch a direct booking site?",
            a: "With a self-serve no-code builder you can often have a working site live within a day, since there is no sales call or implementation project. PMS-class platforms aimed at larger operators frequently involve onboarding, so budget more time and ask about it before you commit."
          }
        ]
      },
      {
        type: 'cta',
        content: "Build your commission-free booking site and try it on your own properties."
      }
    ]
  },
]
