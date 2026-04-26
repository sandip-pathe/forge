import type { NicheBrief } from "@/types/brief";

export function createRubikDemoBrief(): NicheBrief {
  return {
    id: "demo-rubik",
    niche: "competitive Rubik's cube solvers",
    createdAt: new Date().toISOString(),
    founderContext: "I've been speedcubing for 6 years",
    groundedData: {
      reddit: {
        status: "success",
        subredditName: "Cubers",
        subscriberCount: 287493,
        topPosts: [
          {
            title: "My first sub-10 official solve",
            score: 1450,
            flair: "achievement",
          },
          {
            title: "Inspection anxiety before finals",
            score: 913,
            flair: "discussion",
          },
          { title: "Best drill for F2L lookahead?", score: 808, flair: "help" },
        ],
        topFlairs: ["discussion", "achievement", "help"],
      },
      appstore: {
        status: "success",
        results: [
          {
            id: "112233",
            name: "CubeTime Pro",
            rating: 4.2,
            reviewCount: 193,
            lastUpdated: "2025-10-12",
            sellerName: "Cube Labs",
            description: "Timer and solve tracking app.",
            url: "https://apps.apple.com/us/app/cubetime-pro/id112233",
          },
          {
            id: "445566",
            name: "Speed Cube Timer",
            rating: 3.9,
            reviewCount: 71,
            lastUpdated: "2024-08-03",
            sellerName: "FastSolve LLC",
            description: "Session logging and averages.",
            url: "https://apps.apple.com/us/app/speed-cube-timer/id445566",
          },
        ],
      },
      web: {
        status: "success",
        providerUsed: "serper",
        results: [
          {
            title: "r/Cubers weekly competition thread",
            url: "https://www.reddit.com/r/Cubers/",
            snippet: "Cubers discuss timed challenges, drills, and event prep.",
            domain: "reddit.com",
          },
          {
            title: "WCA competition preparation guide",
            url: "https://www.worldcubeassociation.org/",
            snippet:
              "Official event regulations, format, and competitor resources.",
            domain: "worldcubeassociation.org",
          },
          {
            title:
              "Forum thread: Is there a complete speedcubing practice app?",
            url: "https://www.speedsolving.com/",
            snippet:
              "Users compare fragmented tools for timing, analysis, and coaching.",
            domain: "speedsolving.com",
          },
        ],
      },
    },
    sections: {
      communityPulse: {
        primaryPlatform: "Reddit + WCA forums",
        subscriberCount: 287493,
        subscriberLabel: "r/Cubers subscribers",
        activityLevel: "High",
        activityRationale:
          "Large subreddit traffic and recurring competition-prep discussions indicate frequent active participation.",
        topThemes: [
          "Lookahead drills",
          "Competition nerves",
          "Equipment tuning",
        ],
        communityCharacter:
          "Highly competitive, peer-coached, and detail obsessed around tiny performance gains.",
      },
      painPoints: {
        points: [
          {
            title: "Practice data is fragmented across tools",
            signalStrength: "High",
            description:
              "Cubers split timing, algorithm notes, and video review across disconnected apps and spreadsheets.",
            evidence:
              "Threads asking for one place to track sessions, solves, and post-solve analysis keep resurfacing.",
          },
          {
            title: "Coaching feedback loops are manual",
            signalStrength: "Medium",
            description:
              "Most feedback happens through ad-hoc DMs or comments without structured drill progression.",
            evidence:
              "Posts requesting critique on solve videos show repeated demand for repeatable coaching workflows.",
          },
          {
            title: "Competition prep lacks structured plans",
            signalStrength: "Emerging",
            description:
              "People want event-specific warmups and stress-management routines but rely on community folklore.",
            evidence:
              "Forum discussions on inspection anxiety and finals preparation point to unmet prep-tool demand.",
          },
        ],
      },
      competitiveTeardown: {
        noAppsFound: false,
        noAppsFoundSignal: null,
        competitors: [
          {
            name: "CubeTime Pro",
            rating: 4.2,
            reviewCount: 193,
            lastUpdated: "2025-10-12",
            source: "appstore",
            weaknessTag: "Generic",
            whyItFails:
              "It tracks solves but misses competition-specific coaching loops that advanced cubers care about.",
          },
          {
            name: "Speed Cube Timer",
            rating: 3.9,
            reviewCount: 71,
            lastUpdated: "2024-08-03",
            source: "appstore",
            weaknessTag: "No community features",
            whyItFails:
              "It offers timing but no shared drills, peer benchmarking, or coach-to-athlete feedback workflow.",
          },
        ],
      },
      motherInsight: {
        insight:
          "Speedcubers already run elite micro-training systems socially, but their coaching knowledge is trapped in threads instead of encoded into repeatable digital practice loops.",
      },
      mvpIdea: {
        productName: "CubeCoach Loop",
        tagline:
          "A competition-first practice operating system for speedcubers that turns solve sessions into coachable progression loops.",
        coreFeatures: [
          "Session capture with split-level solve tagging and drill presets",
          "Coach review queue with timestamped critique and next-drill assignment",
          "Competition-mode prep plans with confidence scoring before event day",
        ],
        platformRecommendation: "mobile-first",
        platformRationale:
          "Most solve sessions and review clips happen on phones near physical practice setups.",
        monetizationModel: "Subscription at $8/month",
        monetizationRationale:
          "The community already pays for premium cubes and coaching, making performance tooling spend plausible.",
      },
      hypothesisRoadmap: {
        experiments: [
          {
            id: 1,
            assumption:
              "Competitive cubers want structured coach-feedback loops, not just timers.",
            howToRun:
              "Post a clickable prototype in r/Cubers asking for beta access from active competitors and include one workflow screenshot.",
            timeframe: "72 hours",
            yesSignal:
              "30+ beta requests with at least 10 users sharing current fragmented workflow screenshots.",
            noSignal:
              "Fewer than 8 beta requests suggests timer-only workflows are still considered sufficient.",
            yesThreshold: 30,
          },
          {
            id: 2,
            assumption:
              "Users will pay monthly for competition-focused progression tooling.",
            howToRun:
              "DM recent high-signal r/Cubers contributors with a concierge pilot offer and collect paid pre-orders.",
            timeframe: "7 days",
            yesSignal: "10+ paid pre-orders at $8/month from serious solvers.",
            noSignal:
              "If fewer than 3 pre-orders convert, pricing or value proposition likely needs reframing.",
            yesThreshold: 10,
          },
        ],
      },
      buildSignal: {
        verdict: "Green",
        verdictLabel: "Strong Signal",
        verdictRationale:
          "Large community activity, recurring workflow pain, and weak integrated alternatives point to a viable wedge.",
        dataPoints: [
          {
            point:
              "r/Cubers shows 287,493 subscribers with active training and competition threads.",
            valence: "positive",
          },
          {
            point:
              "Existing apps have moderate ratings but low review depth, suggesting limited product-market depth.",
            valence: "positive",
          },
          {
            point:
              "Forum discussions explicitly ask for unified training and review workflows.",
            valence: "positive",
          },
        ],
        founderEdge:
          "You already speak the community's workflow language, which improves interview quality and iteration speed.",
      },
    },
    generationMetadata: {
      webProviderUsed: "serper",
      isDemoBrief: true,
    },
  };
}
