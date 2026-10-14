// Copy to clients/<slug>.js for a new business. Everything here is public.

window.Meridian = window.Meridian || {};
window.Meridian.config = {

  business: {
    name: 'ASK THEM',                       // exactly as they write it
    phone: 'ASK THEM',                      // the number a customer should call
    bookingLink: 'https://ASK-THEM',        // full URL, including https://
    address: 'ASK THEM',
  },

  greeting:
    "Hi! I'm the front desk assistant for ASK THEM. Ask me anything - " +
    "hours, pricing, parking, or booking.",

  quickReplies: [
    'What are your hours?',
    'How much is a ASK THEM?',
    'Do you take walk-ins?',
    'Where do I park?',
  ],

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

  fallback:
    "I'm not sure about that one, sorry! Give us a call on {phone} and we'll " +
    "answer properly - or you can book in at {booking_link}.",

  ai: {
    enabled: false,
    proxyUrl: '',
    businessId: '',
    timeoutMs: 8000,
  },

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
