// Widget config for ivy-lane. Loaded by /embed/chat.js via data-client="ivy-lane".
// Everything here is public; never put a key in this file.

window.Meridian = window.Meridian || {};
window.Meridian.config = {

  business: {
    name: 'Ivy Lane Hair Studio',

    // Shown when the bot can't answer something. Use the number a customer
    // should actually call.
    phone: '(512) 555-0142',

    // Where "book" questions send people.
    bookingLink: 'https://example.com/book',

    address: '218 Ivy Lane, Austin, TX 78704',
  },

  greeting:
    "Hi! I'm the front desk assistant for Ivy Lane. Ask me anything, hours, " +
    "pricing, parking, or booking.",

  quickReplies: [
    'What are your hours?',
    'How much is a cut?',
    'Do you take walk-ins?',
    'Where do I park?',
  ],

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
        "We're at 218 Ivy Lane, Austin TX 78704, just off South Congress, " +
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
        "Yes, we cut kids' hair, $35 for under 12s. Best to book earlier in " +
        "the day when it's quieter.",
    },
    {
      id: 'giftcards',
      keywords: ['gift card', 'giftcard', 'voucher', 'gift certificate', 'present'],
      answer:
        "We sell gift cards in any amount, in the salon or over the phone.",
    },
  ],

  fallback:
    "I'm not sure about that one, sorry! Give us a call on {phone} and we'll " +
    "answer properly, or you can book in at {booking_link}.",

  ai: {
    enabled: true,
    proxyUrl: 'https://meridianaiservices.vercel.app/api/chat',
    businessId: 'ivy-lane',
    timeoutMs: 8000,
  },

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
