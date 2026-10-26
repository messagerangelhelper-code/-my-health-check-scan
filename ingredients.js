// What My Health Check Scan looks for, and why.
// Every status below was checked against official sources in October 2026.
// Food rules are changing quickly: review this file every few months and
// update the "status" lines and LAST_REVIEWED when something changes.

export const LAST_REVIEWED = "October 2026";

// Levels, from most to least serious:
//   removed   - the FDA has ended (or is ending) its approval in U.S. food
//   restricted - banned in other countries and/or some U.S. states, still allowed by the FDA
//   phaseout  - the FDA has asked companies to phase it out; some states remove it from school food
//   review    - officially under safety review, or only allowed for a narrow use
export const LEVELS = {
  removed: { label: "Being removed from U.S. food", short: "Removed", rank: 4 },
  restricted: { label: "Banned in other places", short: "Banned elsewhere", rank: 3 },
  phaseout: { label: "Being phased out", short: "Phasing out", rank: 2 },
  review: { label: "Under review", short: "Under review", rank: 1 },
};

const SRC = {
  fdaRed3: { name: "FDA: Red No. 3 revoked", url: "https://www.fda.gov/food/food-additives-petitions/fda-revoke-authorization-use-red-no-3-food-and-ingested-drugs" },
  fdaBvo: { name: "FDA: Brominated vegetable oil", url: "https://www.fda.gov/food/food-additives-petitions/brominated-vegetable-oil-bvo" },
  hhsDyes: { name: "HHS/FDA: phasing out petroleum-based dyes", url: "https://www.hhs.gov/press-room/hhs-fda-to-phase-out-petroleum-based-synthetic-dyes-in-nations-food-supply.html" },
  caAb418: { name: "California Food Safety Act (AB 418)", url: "https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202320240AB418" },
  efsaTio2: { name: "EFSA: titanium dioxide no longer considered safe", url: "https://www.efsa.europa.eu/en/news/titanium-dioxide-e171-no-longer-considered-safe-when-used-food-additive" },
  euDyeWarning: { name: "EU food additives law (warning label for some dyes)", url: "https://eur-lex.europa.eu/eli/reg/2008/1333/oj" },
  fdaOrangeB: { name: "FDA ends Orange B, proposes ending Citrus Red No. 2 (July 2026)", url: "https://www.nutritionaloutlook.com/view/fda-finalizes-orange-b-revocation-proposes-remove-citrus-red-no-2" },
  prop65Bha: { name: "California Prop 65: BHA", url: "https://oehha.ca.gov/proposition-65/chemicals/butylated-hydroxyanisole" },
  stateTracker: { name: "State food additive laws tracker", url: "https://regbase.com/state-food-additive-tracker/" },
  fdaAda: { name: "FDA: azodicarbonamide questions and answers", url: "https://www.fda.gov/food/food-additives-petitions/frequently-asked-questions-azodicarbonamide-ada" },
};

const DYE_PHASEOUT =
  "In April 2025 the FDA asked food companies to stop using petroleum-based dyes by the end of 2026. So far this is voluntary. Several states are removing these dyes from school meals.";
const DYE_WHY = "Some studies link synthetic food dyes to hyperactivity and attention problems in some children.";
const EU_WARNING = " In the EU, foods with this dye must carry a warning that it \"may have an adverse effect on activity and attention in children.\"";

// match: phrases as they appear on U.S. labels. e: E-numbers (used on many imported labels and in the food database).
export const INGREDIENTS = [
  {
    id: "red3", name: "Red No. 3 (erythrosine)", level: "removed", e: ["e127"],
    match: [/\bred\s*(?:no\.?|#)?\s*3\b/, /\berythrosine?\b/],
    status: "The FDA revoked its approval in January 2025. Food companies must remove it by January 15, 2027. California's ban also starts January 1, 2027.",
    why: "It's being removed under a law that bars additives shown to cause cancer in animals; high doses caused cancer in male rats.",
    sources: [SRC.fdaRed3, SRC.caAb418],
  },
  {
    id: "bvo", name: "Brominated vegetable oil (BVO)", level: "removed", e: ["e443"],
    match: [/\bbrominated vegetable oil\b/, /\bbvo\b/],
    status: "The FDA revoked its approval in July 2024. Companies had until August 2, 2025 to remove it, so it should no longer be in U.S. food.",
    why: "Studies found it can build up in the body and harm the thyroid.",
    sources: [SRC.fdaBvo, SRC.caAb418],
  },
  {
    id: "orangeb", name: "Orange B", level: "removed", e: [],
    match: [/\borange\s*b\b/],
    status: "The FDA ended its approval in July 2026. It was only allowed on hot dog and sausage casings and was no longer being used.",
    why: "A petroleum-based dye the FDA called outdated.",
    sources: [SRC.fdaOrangeB],
  },
  {
    id: "citrusred2", name: "Citrus Red No. 2", level: "review", e: ["e121"],
    match: [/\bcitrus\s*red\s*(?:no\.?|#)?\s*2\b/],
    status: "Only allowed on the skins of some fresh oranges. In July 2026 the FDA proposed ending its approval.",
    why: "A petroleum-based dye. Don't use colored orange peel for zest or cooking.",
    sources: [SRC.fdaOrangeB],
  },
  {
    id: "bromate", name: "Potassium bromate", level: "restricted", e: ["e924"],
    match: [/\bpotassium bromate\b/, /\bbromated\b/],
    status: "Not allowed in food in the EU, the UK or Canada. California bans it starting January 1, 2027. Still allowed by the FDA.",
    why: "Used to strengthen bread dough. It has been linked to cancer in animal studies.",
    sources: [SRC.caAb418, SRC.stateTracker],
  },
  {
    id: "propylparaben", name: "Propylparaben", level: "restricted", e: ["e216"],
    match: [/\bpropyl\s*paraben\b/],
    status: "Not allowed as a food additive in the EU. California bans it in food starting January 1, 2027. Still allowed by the FDA.",
    why: "A preservative that has been studied for effects on hormones.",
    sources: [SRC.caAb418],
  },
  {
    id: "tio2", name: "Titanium dioxide", level: "restricted", e: ["e171"],
    match: [/\btitanium dioxide\b/],
    status: "Banned as a food additive in the EU since 2022. Still allowed in the U.S.; some states are removing it from school food.",
    why: "EU food-safety experts said in 2021 it could no longer be considered safe, because they couldn't rule out harm to DNA.",
    sources: [SRC.efsaTio2, SRC.stateTracker],
  },
  {
    id: "ada", name: "Azodicarbonamide", level: "restricted", e: ["e927", "e927a"],
    match: [/\bazodicarbonamide\b/],
    status: "Not allowed in food in the EU. Still allowed in U.S. bread as a dough conditioner.",
    why: "When bread is baked, it breaks down into substances that have raised health questions.",
    sources: [SRC.fdaAda],
  },
  {
    id: "red40", name: "Red No. 40 (Allura Red)", level: "phaseout", e: ["e129"],
    match: [/\bred\s*(?:no\.?|#)?\s*40\b/, /\ballura red\b/],
    status: DYE_PHASEOUT, why: DYE_WHY + EU_WARNING, sources: [SRC.hhsDyes, SRC.euDyeWarning, SRC.stateTracker],
  },
  {
    id: "yellow5", name: "Yellow No. 5 (tartrazine)", level: "phaseout", e: ["e102"],
    match: [/\byellow\s*(?:no\.?|#)?\s*5\b/, /\btartrazine\b/],
    status: DYE_PHASEOUT, why: DYE_WHY + EU_WARNING, sources: [SRC.hhsDyes, SRC.euDyeWarning, SRC.stateTracker],
  },
  {
    id: "yellow6", name: "Yellow No. 6 (Sunset Yellow)", level: "phaseout", e: ["e110"],
    match: [/\byellow\s*(?:no\.?|#)?\s*6\b/, /\bsunset yellow\b/],
    status: DYE_PHASEOUT, why: DYE_WHY + EU_WARNING, sources: [SRC.hhsDyes, SRC.euDyeWarning, SRC.stateTracker],
  },
  {
    id: "blue1", name: "Blue No. 1 (Brilliant Blue)", level: "phaseout", e: ["e133"],
    match: [/\bblue\s*(?:no\.?|#)?\s*1\b/, /\bbrilliant blue\b/],
    status: DYE_PHASEOUT, why: DYE_WHY, sources: [SRC.hhsDyes, SRC.stateTracker],
  },
  {
    id: "blue2", name: "Blue No. 2 (indigo carmine)", level: "phaseout", e: ["e132"],
    match: [/\bblue\s*(?:no\.?|#)?\s*2\b/, /\bindigo\s*carmine\b/, /\bindigotine?\b/],
    status: DYE_PHASEOUT, why: DYE_WHY, sources: [SRC.hhsDyes, SRC.stateTracker],
  },
  {
    id: "green3", name: "Green No. 3 (Fast Green)", level: "phaseout", e: ["e143"],
    match: [/\bgreen\s*(?:no\.?|#)?\s*3\b/, /\bfast green\b/],
    status: DYE_PHASEOUT, why: DYE_WHY, sources: [SRC.hhsDyes, SRC.stateTracker],
  },
  {
    id: "bha", name: "BHA (butylated hydroxyanisole)", level: "review", e: ["e320"],
    match: [/\bbha\b/, /\bbutylated hydroxyanisole\b/],
    status: "In February 2026 the FDA began a new review of its safety. California lists it as a chemical known to cause cancer (Prop 65). West Virginia passed a ban, which is currently blocked in court.",
    why: "A preservative that has caused cancer in animal studies.",
    sources: [SRC.prop65Bha, SRC.stateTracker],
  },
];

// The big allergens U.S. labels must declare. "tags" are the food database's codes.
export const ALLERGENS = [
  { id: "milk", name: "Milk", tags: ["en:milk"], words: [/(?<!coconut |almond |oat |soy |rice |cashew )\bmilk\b/, /\bwhey\b/, /\bcasein(?:ate)?\b/, /(?<!cocoa |peanut |shea |nut |almond |apple |cashew |sunflower )\bbutter\b/, /\bcream\b(?! of tartar)/, /\bcheese\b/, /\blactose\b/, /\byogh?urt\b/] },
  { id: "eggs", name: "Eggs", tags: ["en:eggs"], words: [/\beggs?\b/, /\balbumin\b/] },
  { id: "peanuts", name: "Peanuts", tags: ["en:peanuts"], words: [/\bpeanuts?\b/] },
  { id: "treenuts", name: "Tree nuts", tags: ["en:nuts"], words: [/\balmonds?\b/, /\bcashews?\b/, /\bwalnuts?\b/, /\bpecans?\b/, /\bhazelnuts?\b/, /\bpistachios?\b/, /\bmacadamia\b/, /\bbrazil nuts?\b/] },
  { id: "wheat", name: "Wheat / gluten", tags: ["en:gluten"], words: [/\bwheat\b/, /\bbarley\b/, /\brye\b/, /\bmalt\b/, /\bspelt\b/, /\bsemolina\b/, /\bgluten\b/] },
  { id: "soy", name: "Soy", tags: ["en:soybeans"], words: [/\bsoy(?:a|bean|beans)?\b/] },
  { id: "fish", name: "Fish", tags: ["en:fish"], words: [/\bfish\b/, /\banchov(?:y|ies)\b/, /\bsalmon\b/, /\btuna\b/, /\bcod\b/] },
  { id: "shellfish", name: "Shellfish", tags: ["en:crustaceans", "en:molluscs"], words: [/\bshrimp\b/, /\bcrab\b/, /\blobster\b/, /\bprawns?\b/, /\bclams?\b/, /\boysters?\b/, /\bmussels?\b/, /\bscallops?\b/] },
  { id: "sesame", name: "Sesame", tags: ["en:sesame-seeds"], words: [/\bsesame\b/, /\btahini\b/] },
];

// Things people choose to avoid for their own reasons. Not banned, just personal.
export const AVOID_OPTIONS = [
  { id: "dyes", name: "Artificial dyes", ingredientIds: ["red3", "red40", "yellow5", "yellow6", "blue1", "blue2", "green3", "citrusred2", "orangeb"], e: [], words: [/\bartificial colou?rs?\b/] },
  { id: "hfcs", name: "High-fructose corn syrup", e: [], words: [/\bhigh[\s-]*fructose corn syrup\b/, /\bhfcs\b/] },
  { id: "sugar", name: "Added sugar", e: [], words: [/\bsugar\b/, /\bcorn syrup\b/, /\bdextrose\b/, /\bfructose\b/, /\bglucose syrup\b/, /\bsucrose\b/, /\binvert sugar\b/, /\bcane syrup\b/, /\bagave\b/, /\bmolasses\b/, /\bbrown rice syrup\b/, /\bhoney\b/] },
  { id: "sweeteners", name: "Artificial sweeteners", e: ["e950", "e951", "e954", "e955", "e961", "e962", "e969"], words: [/\baspartame\b/, /\bsucralose\b/, /\bacesulfame\b/, /\bace[\s-]?k\b/, /\bsaccharin\b/, /\bneotame\b/, /\badvantame\b/] },
  { id: "seedoils", name: "Seed oils", e: [], words: [/\bsoybean oil\b/, /\bcanola oil\b/, /\brapeseed oil\b/, /\bcorn oil\b/, /\bcottonseed oil\b/, /\bsunflower oil\b/, /\bsafflower oil\b/, /\bgrapeseed oil\b/, /\brice bran oil\b/, /(?<!brominated )\bvegetable oil\b/] },
  { id: "msg", name: "MSG", e: ["e621"], words: [/\bmonosodium glutamate\b/, /\bmsg\b/] },
  { id: "nitrites", name: "Nitrates / nitrites", e: ["e249", "e250", "e251", "e252"], words: [/\b(?:sodium|potassium) nitr(?:ite|ate)\b/] },
  { id: "palm", name: "Palm oil", e: [], words: [/\bpalm(?: kernel)? oil\b/, /\bpalm fat\b/] },
  { id: "carrageenan", name: "Carrageenan", e: ["e407"], words: [/\bcarrageenan\b/] },
  { id: "caffeine", name: "Caffeine", e: [], words: [/\bcaffeine\b/] },
];
