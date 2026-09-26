/* ============================================================================
 * CLIENT CONFIG — TEMPLATE
 * ----------------------------------------------------------------------------
 * ONBOARDING A NEW CLIENT — the whole job, about 20 minutes
 *
 *   1. Copy this file to <slug>.js in this folder.
 *      The slug is lowercase letters, numbers and hyphens only, and it
 *      becomes part of the install line, so keep it recognisable:
 *      "ivy-lane", "coastline-barbers".
 *
 *   2. Fill in every ASK THEM below. Do not guess a price or a policy -
 *      a bot that quotes a wrong price starts an argument at a real front
 *      desk, and that lands on you.
 *
 *   3. Preview it before they see it:  /preview?client=<slug>
 *      Try to catch it out. Ask it things badly and misspelled.
 *
 *   4. Send them /install - it has the one line they paste, with
 *      instructions for Squarespace, Wix, WordPress and the rest.
 *
 *   5. When they change their prices, you edit THIS file and redeploy.
 *      Their website is never touched again.
 *
 * ----------------------------------------------------------------------------
 * THE ONE RULE
 *   Everything in this file is public - anyone can open it in a browser.
 *   Never put an API key, a password, or anything private in here.
 * ==========================================================================*/

window.MERIDIAN_CHAT_CONFIG = {

  /* ------------------------------------------------------------------
     1. THE BUSINESS
     ------------------------------------------------------------------ */
  business: {
    name: 'ASK THEM',                       // exactly as they write it
    phone: 'ASK THEM',                      // the number a customer should call
    bookingLink: 'https://ASK-THEM',        // full URL, including https://
    address: 'ASK THEM',
  },

  /* ------------------------------------------------------------------
     2. GREETING + QUICK BUTTONS
     ------------------------------------------------------------------
     The buttons matter more than they look: most visitors tap rather
     than type. Put their four most-asked questions here - ask the owner
     "what do people ring up and ask you all day?" and use those.
     ------------------------------------------------------------------ */
  greeting:
    "Hi! I'm the front desk assistant for ASK THEM. Ask me anything - " +
    "hours, pricing, parking, or booking.",

  quickReplies: [
    'What are your hours?',
    'How much is a ASK THEM?',
    'Do you take walk-ins?',
    'Where do I park?',
  ],

  /* ------------------------------------------------------------------
     3. THE ANSWERS
     ------------------------------------------------------------------
     WRITING KEYWORDS
       Include how real people type, not how you'd write it. Misspellings,
       slang, short forms. Plurals and word endings are handled for you, so
       'price' already catches 'prices' and 'pricing'.

       Multi-word phrases ('walk in', 'gift card') score higher than single
       words, so use a phrase for anything that really matters.

       Watch for a common word being claimed by two answers. 'call' in a
       booking entry will happily steal "I keep missing calls". If two
       answers compete, make the keywords more specific, not longer.

     WRITING ANSWERS
       Two sentences. Write how the owner talks. If they'd say "give us a
       ring", write that, not "please contact our reception team".

     DELETE any entry that doesn't apply, and ADD ones specific to them -
     a barbershop needs 'beard trim', a yoga studio needs 'first class free'
     and 'what should i bring'.
     ------------------------------------------------------------------ */
  faqs: [
    {
      id: 'hours',
      keywords: ['hours', 'open', 'close', 'closing', 'opening', 'what time',
                 'today', 'sunday', 'monday', 'weekend', 'late', 'early'],
      answer: 'ASK THEM - include the last appointment time, people ask.',
    },
    {
      id: 'pricing',
      keywords: ['price', 'pricing', 'cost', 'how much', 'rate', 'charge',
                 'expensive', 'cheap', 'fee', 'quote'],
      answer:
        'ASK THEM. If prices vary, say what they depend on and that it is ' +
        'confirmed before anything starts - that sentence prevents arguments.',
    },
    {
      id: 'walkins',
      keywords: ['walk in', 'walkin', 'walk-in', 'appointment', 'appt',
                 'without booking', 'drop in', 'same day', 'squeeze me in',
                 'availability'],
      answer: 'ASK THEM',
    },
    {
      id: 'booking',
      keywords: ['book', 'booking', 'reserve', 'schedule', 'make an appointment',
                 'available', 'slot'],
      answer: 'You can book online at {booking_link}, or give us a ring.',
    },
    {
      id: 'parking',
      keywords: ['park', 'parking', 'car', 'garage', 'lot', 'meter', 'drive'],
      answer: 'ASK THEM - and whether it is free, because that is the real question.',
    },
    {
      id: 'cancellation',
      keywords: ['cancel', 'cancellation', 'reschedule', 'change my appointment',
                 'move my appointment', 'no show', 'refund'],
      answer:
        'ASK THEM. Get this one exactly right - it is the answer most likely ' +
        'to be quoted back at them.',
    },
    {
      id: 'location',
      keywords: ['where', 'where are you', 'address', 'located', 'location',
                 'directions', 'find you', 'near', 'based'],
      answer: 'We\'re at {address}. ASK THEM for a landmark - it helps more than the street.',
    },
    {
      id: 'services',
      keywords: ['service', 'services', 'do you do', 'offer', 'treatment'],
      answer: 'ASK THEM - list what they do, and who to ask for if it is unusual.',
    },
    {
      id: 'firsttime',
      keywords: ['first time', 'new client', 'never been', 'consultation',
                 'what to expect', 'nervous'],
      answer:
        'ASK THEM. Worth including even if there is no formal process - a ' +
        'nervous first-timer is exactly the person who needs a reply at 10pm.',
    },
    {
      id: 'payment',
      keywords: ['pay', 'payment', 'card', 'cash', 'venmo', 'apple pay',
                 'tip', 'gratuity', 'deposit'],
      answer: 'ASK THEM',
    },
  ],

  /* ------------------------------------------------------------------
     4. WHEN IT DOESN'T KNOW
     ------------------------------------------------------------------
     Keep this honest. Saying "I'm not sure, call us" is a feature, and
     it is worth pointing that out to the owner when you demo it -
     it's the reason the bot can't cost them money.

     {phone}, {booking_link}, {business_name} and {address} are filled
     in from section 1.
     ------------------------------------------------------------------ */
  fallback:
    "I'm not sure about that one, sorry! Give us a call on {phone} and we'll " +
    "answer properly - or you can book in at {booking_link}.",

  /* ------------------------------------------------------------------
     5. AI MODE — leave OFF
     ------------------------------------------------------------------
     Off means the widget answers only from the list above and cannot
     invent anything. That is the right setting for a business whose
     prices and policies have to be exactly right.

     Turning it on needs the proxy in ../../../meridian-chatbot/proxy/
     deployed first. An API key typed below would be public - this file
     is served to every visitor.
     ------------------------------------------------------------------ */
  ai: {
    enabled: false,
    provider: 'gemini',
    apiKey: '',
    proxyUrl: '',
    model: '',
    timeoutMs: 8000,
  },

  /* ------------------------------------------------------------------
     6. LOOK
     ------------------------------------------------------------------
     Match their site, not Meridian's. Take the colours off their own
     website - a widget in their brand looks like it belongs to them,
     which is the whole idea.
     ------------------------------------------------------------------ */
  brand: {
    gold: '#B88C29',              // accent: bubble, links, send button
    goldDark: '#96701E',          // hover state for the above
    navy: '#1B2233',              // chat header background

    position: 'right',            // 'right' or 'left'
    teaser: 'Questions? Ask away',// prompt beside the bubble; '' hides it

    // Their logo for the chat header. A full URL to a file on their own
    // site works fine. Blank = their initials on a gold circle.
    logo: '',

    // The small "Powered by Meridian" credit in the chat footer.
    // Leave it on: it is free marketing on every client site you install.
    poweredBy: true,
  },
};
