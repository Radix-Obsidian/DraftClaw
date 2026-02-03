import { supabase } from "./supabase-client.js";

// ⚠️ WARNING: This file is DISABLED and should NOT be used in production
// Mock data seeding has been replaced with real-time AI pick generation
// See: services/ai-pick-generator.service.ts for live pick generation

const AFFILIATE_LINKS = {
  fanduel: "https://fanduel.com/",
  draftkings: "https://draftkings.com/",
  betmgm: "https://betmgm.com/",
};

async function seedPicks() {
  console.log("⚠️  SEED DATA DISABLED - Use AI pick generator instead\n");
  console.log("This function no longer seeds mock data.");
  console.log("Real-time picks are generated automatically by the AI service.\n");
  return;

  // Sample picks data for NBA, UFC, and Soccer (EPL)
  const picks = [
    // NBA Picks
    {
      sport: "NBA",
      type: "lock",
      matchup: "Lakers vs Warriors",
      selection: "Lakers -4.5",
      odds: "-110",
      claw_edge: 12.4,
      anchor_take:
        "The Warriors are cooked. Curry's ankle is questionable and the Lakers are 8-2 ATS at home this month. LeBron is locked in.",
      confidence: 85,
      game_time: "7:30 PM ET",
      affiliate_links: AFFILIATE_LINKS,
      is_active: true,
    },
    {
      sport: "NBA",
      type: "trap",
      matchup: "Celtics vs Heat",
      selection: "FADE: Celtics -8.5",
      odds: "-110",
      claw_edge: -5.1,
      anchor_take:
        "Public is all over Boston here but Miami has covered 6 of their last 7 as underdogs. Butler is back and hungry. Take the points or stay away.",
      confidence: 72,
      game_time: "8:00 PM ET",
      affiliate_links: AFFILIATE_LINKS,
      is_active: true,
    },
    {
      sport: "NBA",
      type: "longshot",
      matchup: "Nuggets vs Suns",
      selection: "Suns ML",
      odds: "+180",
      claw_edge: 6.8,
      anchor_take:
        "Denver resting Jokic on back-to-back. KD and Booker are cooking lately. Value play at plus money.",
      confidence: 45,
      game_time: "9:30 PM ET",
      affiliate_links: { fanduel: AFFILIATE_LINKS.fanduel, draftkings: AFFILIATE_LINKS.draftkings },
      is_active: true,
    },
    // UFC Picks
    {
      sport: "UFC",
      type: "longshot",
      matchup: "UFC 315: Adesanya vs Pereira III",
      selection: "Adesanya by KO Rd 2",
      odds: "+450",
      claw_edge: 8.2,
      anchor_take:
        "Izzy's been studying tape. Pereira leaves his chin exposed when throwing the left hook. If Adesanya can slip it, lights out.",
      confidence: 42,
      game_time: "Saturday 10 PM ET",
      affiliate_links: { fanduel: AFFILIATE_LINKS.fanduel, draftkings: AFFILIATE_LINKS.draftkings },
      is_active: true,
    },
    {
      sport: "UFC",
      type: "lock",
      matchup: "UFC 315: Oliveira vs Makhachev II",
      selection: "Fight goes to decision",
      odds: "+140",
      claw_edge: 9.5,
      anchor_take:
        "Both fighters have elite cardio and ground game. Neither will gas or get finished. Bank on the judges.",
      confidence: 78,
      game_time: "Saturday 11 PM ET",
      affiliate_links: AFFILIATE_LINKS,
      is_active: true,
    },
    // Soccer (EPL) Picks
    {
      sport: "Soccer",
      type: "lock",
      matchup: "Arsenal vs Manchester City",
      selection: "Under 2.5 Goals",
      odds: "-105",
      claw_edge: 11.2,
      anchor_take:
        "Big match energy means tight defense from both sides. Last 5 meetings have all had 2 or fewer goals. Both managers prioritize not losing.",
      confidence: 82,
      game_time: "Sunday 11:30 AM ET",
      affiliate_links: AFFILIATE_LINKS,
      is_active: true,
    },
    {
      sport: "Soccer",
      type: "longshot",
      matchup: "Liverpool vs Chelsea",
      selection: "Both Teams to Score & Over 3.5",
      odds: "+175",
      claw_edge: 7.3,
      anchor_take:
        "Two attacking sides with leaky defenses lately. Anfield always delivers drama. Expect goals.",
      confidence: 55,
      game_time: "Saturday 12:30 PM ET",
      affiliate_links: { fanduel: AFFILIATE_LINKS.fanduel, betmgm: AFFILIATE_LINKS.betmgm },
      is_active: true,
    },
    {
      sport: "Soccer",
      type: "trap",
      matchup: "Tottenham vs Manchester United",
      selection: "FADE: Tottenham -0.5",
      odds: "-120",
      claw_edge: -4.2,
      anchor_take:
        "Public loves Spurs at home but United has been grinding out results. Classic trap game. Stay away or take United +0.5.",
      confidence: 65,
      game_time: "Sunday 9:00 AM ET",
      affiliate_links: AFFILIATE_LINKS,
      is_active: true,
    },
  ];

  // Insert picks
  console.log("📊 Inserting picks...");
  const { data: insertedPicks, error: picksError } = await supabase
    .from("picks")
    .insert(picks)
    .select();

  if (picksError) {
    console.error("❌ Failed to insert picks:", picksError);
  } else {
    console.log(`   ✅ Inserted ${insertedPicks?.length || 0} picks\n`);
  }

  // Sample ticker items
  const tickerItems = [
    { text: "🔒 Lakers -4.5 ✅ CASHED", type: "win" },
    { text: "🎯 Adesanya KO +450 ✅ BOOM", type: "win" },
    { text: "⚠️ Celtics -8.5 ❌ TRAP CALLED", type: "win" },
    { text: "🔒 Chiefs -3 ❌ LOSS", type: "loss" },
    { text: "🎯 Arsenal U2.5 ⏳ PENDING", type: "pending" },
  ];

  console.log("📰 Inserting ticker items...");
  const { data: insertedTicker, error: tickerError } = await supabase
    .from("ticker_items")
    .insert(tickerItems)
    .select();

  if (tickerError) {
    console.error("❌ Failed to insert ticker items:", tickerError);
  } else {
    console.log(`   ✅ Inserted ${insertedTicker?.length || 0} ticker items\n`);
  }

  // Create today's briefing
  const today = new Date().toISOString().split("T")[0];
  console.log("📋 Creating daily briefing...");
  const { error: briefingError } = await supabase.from("daily_briefings").insert({
    date: today,
    confidence_level: "HIGH",
    summary:
      "Strong slate today with multiple high-confidence plays across NBA and EPL. The Lakers look primed to cover at home, and Arsenal vs City is setting up for a low-scoring affair. Lock these in early.",
  });

  if (briefingError) {
    console.error("❌ Failed to create briefing:", briefingError);
  } else {
    console.log("   ✅ Created daily briefing\n");
  }

  console.log("✨ Seeding complete!");
}

// Run if executed directly
seedPicks().catch(console.error);
