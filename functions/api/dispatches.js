// Cloudflare Pages Function: /api/dispatches
// Serves the live board dispatch feed for the trust ticker on the hero.
// Returns JSON array of recent dispatches — sorted newest first.
// CORS-open: called client-side from e5enclave.com
// DAG: e5-sovereign-overhaul-2026-0525

export async function onRequestGet(context) {
  const dispatches = [
    {
      title: "The Agentic Nonprofit: How AI Is Rebuilding Back-Office Operations From the Ground Up",
      date: "2026-05-13",
      category: "Dispatch",
      permalink: "/blog/agentic-nonprofit-ai-operations/",
      excerpt: "E5 Enclave does not use AI as a tool. E5 Enclave runs on it — an agentic-first staff under human direction.",
      readTime: "6 min read",
      author: "Israel Lee Armstead"
    },
    {
      title: "What Is an Enclave Economy? The E5 Framework",
      date: "2026-05-16",
      category: "Dispatch",
      permalink: "/blog/what-is-an-enclave-economy/",
      excerpt: "An enclave economy is not a euphemism for poverty. It is not a consolation prize for communities locked out of mainstream markets.",
      readTime: "5 min read",
      author: "Israel Lee Armstead"
    },
    {
      title: "The New Black Land Trust Movement",
      date: "2026-05-10",
      category: "Analysis",
      permalink: "/blog/new-black-land-trust-movement/",
      excerpt: "Community land trusts are one of the oldest tools in the Black sovereignty toolkit. Here is why the moment is now.",
      readTime: "7 min read",
      author: "Israel Lee Armstead"
    },
    {
      title: "Liberty City Is Not a Metaphor",
      date: "2026-05-06",
      category: "Doctrine",
      permalink: "/blog/liberty-city-is-not-a-metaphor/",
      excerpt: "The name of the neighborhood is Liberty City. It is not ironic. It is not poetic. It is a declaration that was made before most of us were born.",
      readTime: "4 min read",
      author: "Israel Lee Armstead"
    },
    {
      title: "From Food Apartheid to Food Sovereignty",
      date: "2026-04-28",
      category: "FarmBlock",
      permalink: "/blog/food-apartheid-to-food-sovereignty/",
      excerpt: "The phrase 'food desert' describes a symptom. Food apartheid names the system. FarmBlock is the remedy.",
      readTime: "5 min read",
      author: "Israel Lee Armstead"
    },
    {
      title: "Cooperative Economics as Reparations",
      date: "2026-04-20",
      category: "Economic",
      permalink: "/blog/cooperative-economics-as-reparations/",
      excerpt: "Reparations are not a check. They are a system. Cooperative ownership is one of the oldest forms of economic repair.",
      readTime: "6 min read",
      author: "Israel Lee Armstead"
    }
  ];

  // Sort newest first
  dispatches.sort((a, b) => new Date(b.date) - new Date(a.date));

  return new Response(JSON.stringify({
    dispatches,
    count: dispatches.length,
    updated: new Date().toISOString(),
    source: "e5enclave.com/blog"
  }), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600"
    }
  });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
