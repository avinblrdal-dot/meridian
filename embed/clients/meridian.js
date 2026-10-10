/* ============================================================================
 * CLIENT CONFIG — meridian  (Meridian's own website)
 * ----------------------------------------------------------------------------
 * Loaded by /embed/chat.js when a page carries:
 *
 *   <script src="/embed/chat.js" data-client="meridian" defer></script>
 *
 * Meridian's own site runs the exact same install a client gets. If it breaks
 * here, it is broken for everyone - which is the point of dogfooding it.
 *
 * AI IS ON, through /api/chat (Groq, free). The model is told to answer only
 * from the `faqs` below, and the server repeats that rule where nobody can
 * edit it. If the AI is down or over its limit, the widget falls back to the
 * written `faqs`, so it can't break. To go back to answers-only, set
 * ai.enabled to false.
 * ==========================================================================*/

window.MERIDIAN_CHAT_CONFIG = {

  /* ------------------------------------------------------------------
     1. THE BUSINESS
     ------------------------------------------------------------------ */
  business: {
    name: 'Meridian',

    // Meridian doesn't publish a phone number — the site routes everything
    // to the contact form. So the answers below say "the form at the bottom
    // of this page" rather than using {phone}. If you add a real number
    // later, put it here and swap the wording back.
    phone: '',

    // Used by {booking_link}, and handed to the AI as the booking link if
    // AI mode is ever turned on. A full URL, because the widget only turns
    // full http(s) URLs into links. No answer below uses it yet: they say
    // "the form at the bottom of this page", which reads better on the page
    // itself. If there's a Calendly link later, put it here.
    bookingLink: 'https://meridianaiservices.vercel.app/#contact',

    address: 'Frisco / Dallas-Fort Worth, TX',
  },

  /* ------------------------------------------------------------------
     2. GREETING + QUICK BUTTONS
     ------------------------------------------------------------------
     Most visitors tap rather than type. These four are the questions a
     salon owner actually has before they'll give you their email.
     ------------------------------------------------------------------ */
  greeting:
    "Hi - I'm Meridian's assistant. Ask me anything about what we do, what " +
    "it costs, or how we'd start with your business.",

  quickReplies: [
    'What does Meridian actually do?',
    'How much does it cost?',
    'What kind of businesses?',
    'How do we get started?',
  ],

  /* ------------------------------------------------------------------
     3. THE ANSWERS
     ------------------------------------------------------------------
     Every answer here is taken from copy already on this page. Nothing
     is promised that the site doesn't already promise. If you change the
     site copy, change it here too - a bot contradicting the page it sits
     on is worse than no bot.
     ------------------------------------------------------------------ */
  faqs: [
    {
      id: 'what',
      keywords: ['what do you do', 'what does meridian do', 'what is meridian',
                 'what does meridian', 'what you do', 'actually do',
                 'about', 'explain',
                 'services', 'service', 'offer', 'help with', 'ai',
                 'consultancy', 'consulting', 'who are you', 'purpose'],
      answer:
        "We're a hands-on AI consultancy for local salons, spas and studios. " +
        "We find where your time or money is leaking, build the fix ourselves, " +
        "and train you and your team to run it.",
    },
    {
      id: 'pricing',
      keywords: ['price', 'pricing', 'cost', 'how much', 'expensive', 'cheap',
                 'rate', 'rates', 'fee', 'quote', 'budget', 'afford', 'payment',
                 'pay', 'charge', 'charges', 'do you charge', 'invoice',
                 'free', 'is it free', 'audit free', 'free audit', 'no cost'],
      answer:
        "The AI Opportunity Audit is free, with no obligation to go further. " +
        "After that, a one-time Build & Setup is priced to scope, and the " +
        "monthly support plan is optional. We don't publish prices for those " +
        "because each one is priced to the business, so ask on the free intro " +
        "call - there's no pressure on it.",
    },
    {
      id: 'process',
      keywords: ['how does it work', 'how it works', 'process', 'steps',
                 'method', 'what happens', 'audit', 'timeline', 'how long',
                 'take', 'setup', 'install'],
      answer:
        "Four steps: a free AI Opportunity Audit to find the leak, a custom " +
        "build and setup we install ourselves, training for you and your " +
        "staff, and a before/after report so you can see what actually changed.",
    },
    {
      id: 'who',
      keywords: ['who is it for', 'what kind of business', 'what businesses',
                 'salon', 'barber', 'barbershop', 'spa', 'nail', 'gym',
                 'fitness', 'yoga', 'dance', 'studio', 'right for me',
                 'suitable', 'small', 'staff', 'restaurant', 'my business'],
      answer:
        "Owner-run salons, barbershops, nail and spa studios, and small " +
        "fitness, yoga and dance studios - roughly 15 staff or fewer. If you " +
        "personally handle the booking, the messages and the marketing, it's " +
        "built for you.",
    },
    {
      id: 'missedcalls',
      keywords: ['missed call', 'missed calls', 'missing call', 'missing calls',
                 'miss calls', 'phone', 'call back', 'callback', 'text back',
                 'voicemail', 'answer the phone', 'cant answer', 'ringing',
                 'busy', 'front desk'],
      answer:
        "That's one of the most common fixes. When a call goes unanswered the " +
        "caller gets an instant text with your booking link, so the booking " +
        "still lands instead of going to the salon down the road. There's an " +
        "animation of exactly how it works in the How It Works section above.",
    },
    {
      id: 'noshows',
      keywords: ['no show', 'no shows', 'noshow', 'cancel', 'cancellation',
                 'reminder', 'reminders', 'empty chair', 'gaps', 'rebook',
                 'late'],
      answer:
        "Automated reminders and one-tap rebooking, so a gap gets filled " +
        "instead of sitting empty. It's usually one of the first things an " +
        "Audit turns up.",
    },
    {
      id: 'tech',
      keywords: ['technical', 'tech', 'complicated', 'hard', 'difficult',
                 'learn', 'training', 'train', 'teach', 'not good with',
                 'computer', 'software', 'confusing', 'understand'],
      answer:
        "No tech background needed. We install everything ourselves rather " +
        "than handing you a how-to guide, then train you and your staff until " +
        "you're comfortable running it. The whole point is AI that's explained " +
        "to you, not sold to you.",
    },
    {
      id: 'location',
      keywords: ['where', 'where are you', 'based', 'based in', 'located',
                 'location', 'area', 'city', 'near', 'frisco', 'dallas', 'dfw',
                 'texas', 'remote', 'in person', 'travel', 'local'],
      answer:
        "We're based in Frisco and work across the Dallas-Fort Worth area. " +
        "Ask on the call if you're outside DFW - it depends on the project.",
    },
    {
      id: 'contact',
      keywords: ['contact', 'get started', 'get in touch', 'start', 'book',
                 'booking', 'intro call', 'book a call', 'free call', 'talk',
                 'speak', 'reach', 'email', 'sign up', 'next step', 'meeting',
                 'consultation', 'free consultation', 'phone number',
                 'call you', 'need from me', 'what do you need'],
      answer:
        "Fill in the form at the bottom of this page - your name, your " +
        "business, and what's eating your week. We'll set up a free intro " +
        "call, usually replying the same day.",
    },
    {
      id: 'pilot',
      keywords: ['pilot', 'discount', 'deal', 'founding', 'first client',
                 'reduced', 'trial', 'case study', 'results'],
      answer:
        "There are a limited number of pilot spots at a reduced rate right " +
        "now for founding clients, in exchange for documented results. Mention " +
        "it in the form if you're interested.",
    },
    {
      id: 'commitment',
      keywords: ['contract', 'commit', 'commitment', 'lock in', 'monthly',
                 'subscription', 'ongoing', 'cancel anytime', 'can i cancel',
                 'obligation', 'risk'],
      answer:
        "The monthly support plan is entirely optional - the Audit and the " +
        "build stand on their own. Start small, see whether it's working, and " +
        "only go further if it is.",
    },
    {
      id: 'founder',
      keywords: ['who runs', 'founder', 'avin', 'team', 'how many people',
                 'agency', 'company', 'behind'],
      answer:
        "Meridian is founded and run by Avin, who is hands-on with every " +
        "workflow and tool the business builds. You work with the person " +
        "doing the work, not an account manager.",
    },
    {
      id: 'other-industries',
      keywords: ['other industries', 'plumber', 'trades', 'home service',
                 'contractor', 'dentist', 'clinic', 'not a salon', 'different'],
      answer:
        "We're starting with beauty and wellness because we know that world, " +
        "but the same approach extends to other local service businesses - " +
        "home-service trades especially, where a missed call is a missed job. " +
        "Ask on the call.",
    },
    {
      // What Meridian does NOT do. With AI on, this is what stops the model
      // saying yes to "can you build me an app".
      id: 'scope',
      keywords: ['app', 'build me an app', 'mobile app', 'website', 'build a website',
                 'web design', 'custom software', 'social media', 'marketing',
                 'ads', 'seo', 'guarantee', 'guaranteed'],
      answer:
        "We don't build custom phone apps or full websites, and we don't run " +
        "ads or social media. We set up practical fixes inside the tools you " +
        "already use: reminders and rebooking, missed-call text-back, a chat " +
        "assistant for repeat questions, and review requests. We also can't " +
        "guarantee a number of bookings; the free Audit tells you honestly " +
        "what's likely to help.",
    },
    {
      // For visitors who don't know what they need yet. Kept LAST on
      // purpose: the matcher breaks ties in list order, so an existing
      // answer wins any tie. 'sure' / 'unsure' are single words (3 points,
      // same as any other single keyword) rather than the phrase "not sure"
      // (6 points), so "not sure about pricing" still gets the pricing
      // answer while a bare "not sure" lands here.
      id: 'unsure',
      keywords: ['which service', 'what do i need', 'what i need',
                 'where do i start', 'where should i start', 'where to start',
                 'sure', 'unsure', 'quiz', 'diagnostic', 'recommend',
                 'help me choose', 'help me decide'],
      answer:
        "Try the 2-minute diagnostic at " +
        "https://meridianaiservices.vercel.app/diagnostic - seven quick " +
        "questions about how your business runs, and it shows the one fix " +
        "we'd start with, and why. Or book the free Audit and we'll work it " +
        "out with you.",
    },
  ],

  /* ------------------------------------------------------------------
     4. WHEN IT DOESN'T KNOW
     ------------------------------------------------------------------
     Deliberately honest, and deliberately not using {phone} - there
     isn't one. On a site whose whole pitch is "explained to you, not
     sold to you", a bot that guesses would undercut the argument.
     ------------------------------------------------------------------ */
  fallback:
    "I'm not sure about that one - I'd rather say so than guess. Put it in " +
    "the form at the bottom of this page and Avin will answer it properly, " +
    "usually the same day.",

  /* ------------------------------------------------------------------
     5. AI MODE
     ------------------------------------------------------------------
     ON via /api/chat. The key lives only in Vercel's environment
     variables. Never paste a key below: anything in this file is visible
     to anyone who views the page source.
     ------------------------------------------------------------------ */
  ai: {
    enabled: true,
    provider: 'groq',
    apiKey: '',
    proxyUrl: 'https://meridianaiservices.vercel.app/api/chat',
    // Open mode: chats like a normal AI assistant, with the whole website
    // below as background. Facts about Meridian still only come from here.
    mode: 'open',
    about: [
      "Meridian is a hands-on AI consultancy for owner-run local businesses in Frisco and the Dallas-Fort Worth area, Texas: salons, barbershops, nail and spa studios, fitness studios, and yoga and dance studios. Ideal clients are owner-operated with roughly 15 or fewer staff, where the owner personally handles booking, messages and marketing. ",
      "The problem we solve: no-shows leaving chairs empty, calls and DMs going unanswered while the owner is with a client, and the same questions (hours, pricing, walk-ins) answered again and again. Many owners have heard they should use AI but haven't had the time, know-how or a reason to trust it.",
      "How it works: 1) AI Opportunity Audit: we sit down with the owner and find where time or money is leaking. 2) Custom Build & Setup: we build and install the fix ourselves, hands-on. 3) Owner & Staff Training: the team learns to run it, no tech background needed. 4) Before/After Impact Report: we measure the result, such as fewer no-shows, hours saved and more booked chairs. ",
      "What we often build: fewer no-shows (automated reminders and one-tap rebooking); no more missed bookings (instant text-back when a call goes unanswered); a front desk freed up (an assistant that answers repeat questions across calls, texts and DMs, like this chat); a stronger reputation (faster review replies and a simple system to earn more reviews). These are starting points, not a menu; the Audit decides what a business actually needs. ",
      "Why Meridian: hands-on, not hands-off. We build it rather than just advise, we teach the team so they are not dependent on us, and we are local and personal, one-on-one in DFW. ",
      "Pricing: the AI Opportunity Audit is free with no obligation. Build & Setup is a one-time project priced to scope. Ongoing Support is an optional, affordable monthly plan, priced to scope. No published prices beyond the free Audit. A limited number of pilot spots are offered at a reduced rate to founding clients in exchange for documented results. ",
      "Where we're headed: starting with beauty and wellness, later other local service businesses that lose time the same way, like home-service trades.",
      "Founder: Meridian is founded and built by Avin, who is hands-on with every AI workflow and tool. Meridian exists because local owners deserve AI that's simple, personal and explained to them, not sold to them.",
      "Ways to start: book a free intro call through the contact form at https://meridianaiservices.vercel.app/#contact, or take the 2-minute diagnostic at https://meridianaiservices.vercel.app/diagnostic.",
    ].join(' '),

    model: '',
    timeoutMs: 8000,
  },

  /* ------------------------------------------------------------------
     6. LOOK — matched to the site's design tokens in css/styles.css
     ------------------------------------------------------------------ */
  brand: {
    gold: '#B88C29',
    goldDark: '#96701E',
    navy: '#1B2233',
    position: 'right',
    teaser: 'Questions? Ask away',

    // On a CLIENT's widget this is their logo and the header shows their
    // brand. Here we are the business, so it's ours.
    logo: '/embed/meridian-logo.png',

    // The "Powered by Meridian" credit is pointless on Meridian's own site.
    poweredBy: false,
  },
};
