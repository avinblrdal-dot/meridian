/* ============================================================================
 * CLIENT CONFIG — ivy-lane  (SAMPLE, not a real business)
 * ----------------------------------------------------------------------------
 * Loaded by /embed/chat.js when a page carries:
 *
 *   <script src="/embed/chat.js" data-client="ivy-lane" defer></script>
 *
 * This is the one you show a prospect:
 *   /preview?client=ivy-lane
 *
 * Keep it here as a worked example of what a finished client config looks
 * like. Copy _TEMPLATE.js - not this file - when you take on a real client.
 * ==========================================================================*/

window.MERIDIAN_CHAT_CONFIG = {

  /* ------------------------------------------------------------------
     1. THE BUSINESS
     ------------------------------------------------------------------ */
  business: {
    name: 'Ivy Lane Hair Studio',

    // Shown when the bot can't answer something. Use the number a customer
    // should actually call.
    phone: '(512) 555-0142',

    // Where "book" questions send people.
    bookingLink: 'https://example.com/book',

    address: '218 Ivy Lane, Austin, TX 78704',
  },

  /* ------------------------------------------------------------------
     2. GREETING + QUICK BUTTONS
     ------------------------------------------------------------------
     The quick buttons matter more than they look. Most visitors won't
     type anything — they'll tap. Put your four most-asked questions here.
     ------------------------------------------------------------------ */
  greeting:
    "Hi! I'm the front desk assistant for Ivy Lane. Ask me anything — hours, " +
    "pricing, parking, or booking.",

  quickReplies: [
    'What are your hours?',
    'How much is a cut?',
    'Do you take walk-ins?',
    'Where do I park?',
  ],

  /* ------------------------------------------------------------------
     3. THE ANSWERS
     ------------------------------------------------------------------
     Each entry needs:
       id       – any unique short name
       keywords – words/phrases that should match this answer.
                  Include how REAL people type: misspellings, slang,
                  short forms. "cancel", "cancelation", "reschedule".
       answer   – written in the business's voice. Keep it short.
                  Two sentences is usually plenty.

     Keywords are matched loosely — plurals and word endings are handled
     for you, so "price" also catches "prices" and "pricing".
     ------------------------------------------------------------------ */
  faqs: [
    {
      id: 'hours',
      keywords: ['hours', 'open', 'close', 'closing', 'opening', 'what time',
                 'today', 'sunday', 'monday', 'weekend', 'late', 'early'],
      answer:
        "We're open Tuesday to Friday 9am-7pm, Saturday 9am-5pm, and closed " +
        "Sunday and Monday. Last appointment is an hour before close.",
    },
    {
      id: 'pricing',
      keywords: ['price', 'pricing', 'cost', 'how much', 'rate', 'charge',
                 'expensive', 'cheap', 'fee', 'quote'],
      answer:
        "Cuts start at $55, colour from $120, and balayage from $180. Exact " +
        "price depends on hair length and thickness, so we confirm at your " +
        "consultation before we start.",
    },
    {
      id: 'walkins',
      keywords: ['walk in', 'walkin', 'walk-in', 'appointment', 'appt',
                 'without booking', 'drop in', 'same day', 'today',
                 'squeeze me in', 'availability'],
      answer:
        "We take walk-ins when we can, but we're usually booked out, so an " +
        "appointment is much safer. Call us and we'll tell you what's free today.",
    },
    {
      id: 'booking',
      keywords: ['book', 'booking', 'reserve', 'schedule', 'make an appointment',
                 'available', 'slot'],
      answer:
        "You can book online any time, or give us a ring and we'll sort you out.",
    },
    {
      id: 'parking',
      keywords: ['park', 'parking', 'car', 'garage', 'lot', 'meter', 'drive'],
      answer:
        "There's free parking in the lot behind the building, off Ivy Lane. " +
        "Street parking out front is metered until 6pm.",
    },
    {
      id: 'cancellation',
      keywords: ['cancel', 'cancellation', 'reschedule', 'change my appointment',
                 'move my appointment', 'late', 'no show', 'refund'],
      answer:
        "Just let us know at least 24 hours ahead and there's no charge. " +
        "Under 24 hours we ask for 50% of the service.",
    },
    {
      id: 'location',
      keywords: ['where', 'address', 'located', 'location', 'directions',
                 'find you', 'near'],
      answer:
        "We're at 218 Ivy Lane, Austin TX 78704 — just off South Congress, " +
        "next to the coffee shop.",
    },
    {
      id: 'services',
      keywords: ['service', 'services', 'do you do', 'offer', 'treatment',
                 'extensions', 'colour', 'color', 'balayage', 'highlights',
                 'blow dry', 'keratin', 'perm'],
      answer:
        "We do cuts, colour, balayage, highlights, blow-dries and keratin " +
        "treatments. If you're after something specific, call and ask for Nina.",
    },
    {
      id: 'firsttime',
      keywords: ['first time', 'new client', 'never been', 'consultation',
                 'what to expect', 'nervous'],
      answer:
        "Every new client gets a free 15-minute consultation before we start, " +
        "so we can talk through what you want. Just mention it when you book.",
    },
    {
      id: 'payment',
      keywords: ['pay', 'payment', 'card', 'cash', 'venmo', 'apple pay',
                 'tip', 'gratuity', 'deposit'],
      answer:
        "We take card, cash, Apple Pay and Venmo. Tips are always appreciated " +
        "but never expected.",
    },
    {
      id: 'kids',
      keywords: ['kid', 'kids', 'child', 'children', 'toddler', 'family'],
      answer:
        "Yes, we cut kids' hair — $35 for under 12s. Best to book earlier in " +
        "the day when it's quieter.",
    },
    {
      id: 'giftcards',
      keywords: ['gift card', 'giftcard', 'voucher', 'gift certificate', 'present'],
      answer:
        "We sell gift cards in any amount, in the salon or over the phone.",
    },
  ],

  /* ------------------------------------------------------------------
     4. WHEN IT DOESN'T KNOW
     ------------------------------------------------------------------
     Deliberately honest. A bot that guesses a wrong price costs the
     business real money and real trust. {phone} and {booking_link} are
     filled in from the business block above.
     ------------------------------------------------------------------ */
  fallback:
    "I'm not sure about that one, sorry! Give us a call on {phone} and we'll " +
    "answer properly — or you can book in at {booking_link}.",

  /* ------------------------------------------------------------------
     5. AI MODE  (optional — leave off and everything still works)
     ------------------------------------------------------------------
     OFF by default, and that is the recommended setting for a real
     client website. Read this before turning it on.

     With AI off, the widget answers from the `faqs` list above using
     keyword matching. It is instant, free forever, works offline, and
     physically cannot invent a price that isn't in this file.

     With AI on, questions go to a language model along with the FAQ list
     as context, so it handles phrasings your keywords missed and answers
     more naturally.

     >>> THE SECURITY POINT <<<
     Anything in this file is visible to anyone who views the page source.
     If you put a real API key in `apiKey` on a public website, people can
     and will take it and spend your quota.

       - Demoing on your own laptop?  `apiKey` is fine.
       - Live on a client's website?  Use `proxyUrl` instead. See proxy/
         in this folder — it's a free serverless function that holds the
         key server-side. Takes about 5 minutes to deploy.
     ------------------------------------------------------------------ */
  ai: {
    // On for the demo salon only. Meridian's own site stays answers-only.
    // The key is NOT here: it lives in Vercel, behind /api/chat. Until a key
    // is set there, every answer quietly falls back to the written FAQs.
    enabled: true,

    // Ignored when proxyUrl is set; the server picks Groq, then Gemini.
    provider: 'groq',

    // LOCAL DEMOS ONLY. Never on a public site — see the warning above.
    apiKey: '',

    // PRODUCTION. Your deployed proxy endpoint, e.g.
    // 'https://your-project.vercel.app/api/chat'
    // When set, this is used and apiKey is ignored entirely.
    proxyUrl: 'https://meridianaiservices.vercel.app/api/chat',

    // Leave blank to use the provider's sensible default.
    model: '',

    // How long to wait before giving up and falling back to keyword
    // matching. Keeps a slow API from leaving the visitor staring at dots.
    timeoutMs: 8000,
  },

  /* ------------------------------------------------------------------
     6. LOOK
     ------------------------------------------------------------------ */
  brand: {
    gold: '#B88C29',
    goldDark: '#96701E',
    navy: '#1B2233',
    // Where the bubble sits: 'right' or 'left'
    position: 'right',
    // Text on the little prompt beside the bubble. Set to '' to hide it.
    teaser: 'Questions? Ask away',
    // The client's own logo, shown in the chat header. Falls back to their
    // initials if this is blank or the file 404s.
    logo: '',
  },
};
