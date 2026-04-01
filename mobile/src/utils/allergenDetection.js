// src/utils/allergenDetection.js

// Each group contains all keywords (FR + EN) associated with one allergen family.
const ALLERGEN_GROUPS = [
  ['arachide', 'arachides', 'peanut', 'peanuts', 'cacahuète', 'cacahuètes', 'cacahuete', 'cacahuetes', 'groundnut', 'groundnuts'],
  ['gluten', 'blé', 'ble', 'wheat', 'seigle', 'rye', 'orge', 'barley', 'avoine', 'oat', 'oats', 'épeautre', 'epeautre', 'spelt', 'kamut', 'triticale'],
  ['lait', 'milk', 'lactosérum', 'lactoserum', 'whey', 'caséine', 'caseine', 'casein', 'lactose', 'beurre', 'butter', 'crème', 'creme', 'cream', 'fromage', 'cheese', 'yogourt', 'yogurt', 'yaourt', 'lactalbumine', 'lactalbumin', 'lactoglobuline'],
  ['oeuf', 'oeufs', 'œuf', 'œufs', 'egg', 'eggs', 'albumine', 'albumin', 'lysozyme', 'mayonnaise'],
  ['noix', 'nut', 'nuts', 'noisette', 'noisettes', 'hazelnut', 'hazelnuts', 'amande', 'amandes', 'almond', 'almonds', 'cajou', 'cashew', 'pistache', 'pistaches', 'pistachio', 'pistachios', 'macadamia', 'pécan', 'pecan', 'pacane', 'noix du brésil', 'noix du bresil', 'brazil nut', 'châtaigne', 'chataigne', 'chestnut', 'noix de pin', 'pine nut'],
  ['soja', 'soya', 'soy', 'soybeans', 'tofu', 'edamame', 'tempeh', 'miso', 'okara', 'lécithine de soja', 'lecithine de soja', 'soy lecithin'],
  ['poisson', 'fish', 'saumon', 'salmon', 'thon', 'tuna', 'morue', 'cod', 'tilapia', 'anchois', 'anchovy', 'sardine', 'sardines', 'pangasius', 'truite', 'trout', 'flétan', 'fletan', 'halibut', 'sole', 'merlu', 'hake', 'aiglefin', 'haddock', 'maquereau', 'mackerel', 'doré', 'dore', 'walleye'],
  ['crustacé', 'crustacés', 'crustace', 'crustaces', 'crustacean', 'crustaceans', 'crevette', 'crevettes', 'shrimp', 'prawn', 'prawns', 'homard', 'lobster', 'crabe', 'crab', 'langoustine', 'langoustines', 'écrevisse', 'ecrevisse', 'crayfish'],
  ['mollusque', 'mollusques', 'mollusk', 'mollusks', 'moule', 'moules', 'mussel', 'mussels', 'huître', 'huîtres', 'huitre', 'huitres', 'oyster', 'oysters', 'pétoncle', 'pétoncles', 'petoncle', 'petoncles', 'scallop', 'scallops', 'palourde', 'palourdes', 'clam', 'clams', 'calmar', 'squid', 'pieuvre', 'octopus'],
  ['fruits de mer', 'seafood', 'shellfish'],
  ['sésame', 'sesame', 'tahini', 'tahine'],
  ['sulfite', 'sulfites', 'sulphite', 'sulphites', 'so2', 'dioxyde de soufre', 'sulphur dioxide', 'sulfur dioxide', 'métabisulfite', 'metabisulfite'],
  ['moutarde', 'mustard'],
  ['céleri', 'celeri', 'celeriac', 'celery', 'céleri-rave', 'celeri-rave'],
  ['lupin', 'lupine', 'lupin flour', 'farine de lupin'],
]

// Strip accents to normalize French text (e.g. "épeautre" → "epeautre")
function stripAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function getKeywords(allergen) {
  const lower = stripAccents(allergen.toLowerCase())
  for (const group of ALLERGEN_GROUPS) {
    if (group.some(kw => stripAccents(kw) === lower || lower.includes(stripAccents(kw)) || stripAccents(kw).includes(lower))) {
      return group
    }
  }
  return [allergen.toLowerCase()]
}

/**
 * Returns all known synonyms (FR + EN) for a given allergen name.
 * Used to display allergen details to the user.
 */
export function getAllergenSynonyms(allergen) {
  return getKeywords(allergen)
}

// Remove "X-free", "free of X", and "sans X" claims so they don't trigger false positives.
// Uses word boundaries to avoid mangling unrelated text.
function removeFreeOfClaims(text) {
  let cleaned = text
  // English: "gluten-free", "nut free", "dairy-free" etc.
  cleaned = cleaned.replace(/\b(\w+)[-\s]free\b/gi, '')
  // English: "free of gluten", "free of nuts"
  cleaned = cleaned.replace(/\bfree\s+of\s+[\w\s,]+(?=[.,;)]|$)/gi, '')
  // French: "sans gluten", "sans noix", "sans arachides ni noix"
  cleaned = cleaned.replace(/\bsans\s+[\w\s,]+(?:ni\s+[\w\s,]+)*(?=[.,;)]|$)/gi, '')
  return cleaned
}

// Check if keyword appears as a whole word (not as substring of another word).
// Multi-word keywords (e.g. "noix du brésil") use simple includes since they're specific enough.
function keywordInText(kw, text) {
  if (kw.includes(' ')) {
    return text.includes(kw) || text.includes(stripAccents(kw))
  }
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(?:^|[\\s,;:()])${escaped}(?:s|es)?(?=[\\s,;:().]|$)`, 'i')
  return re.test(text) || re.test(stripAccents(text))
}

function detectAllergens(list, text, tags) {
  return (list || []).filter(allergen => {
    const keywords = getKeywords(allergen)
    const inIngredients = keywords.some(kw => keywordInText(kw, text))
    const inTags = tags.some(tag => keywords.some(kw => tag.includes(kw) || kw.includes(tag)))
    return inIngredients || inTags
  })
}

/**
 * Runs detection across all profiles simultaneously.
 * Profiles use { allergies: string[], intolerances: string[] }.
 *
 * @returns {{ profileName: string, detectedAllergies: string[], detectedIntolerances: string[] }[]}
 *   Only profiles with at least one detection.
 */
export function detectAllProfiles(profiles, ingredientsText, allergenTags) {
  const text = removeFreeOfClaims((ingredientsText || '').toLowerCase())
  const tags = (allergenTags || []).map(t => t.replace(/^[a-z]{2}:/, '').toLowerCase())

  return profiles
    .map(profile => ({
      profileName: profile.name,
      detectedAllergies: detectAllergens(profile.allergies, text, tags),
      detectedIntolerances: detectAllergens(profile.intolerances, text, tags),
    }))
    .filter(r => r.detectedAllergies.length > 0 || r.detectedIntolerances.length > 0)
}
