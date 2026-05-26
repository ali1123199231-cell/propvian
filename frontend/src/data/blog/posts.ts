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
]
