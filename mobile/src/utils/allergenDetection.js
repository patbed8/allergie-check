// src/utils/allergenDetection.js

// Each group contains all keywords (FR + EN) associated with one allergen family.
const ALLERGEN_GROUPS = [
  ['arachide', 'arachides', 'peanut', 'peanuts', 'cacahuète', 'cacahuètes', 'groundnut', 'groundnuts'],
  ['gluten', 'blé', 'wheat', 'seigle', 'rye', 'orge', 'barley', 'avoine', 'oat', 'oats', 'épeautre', 'spelt', 'kamut', 'triticale'],
  ['lait', 'milk', 'lactosérum', 'whey', 'caséine', 'casein', 'lactose', 'beurre', 'butter', 'crème', 'cream', 'fromage', 'cheese', 'yogourt', 'yogurt', 'yaourt', 'lactalbumine', 'lactalbumin', 'lactoglobuline'],
  ['oeuf', 'oeufs', 'œuf', 'œufs', 'egg', 'eggs', 'albumine', 'albumin', 'lysozyme', 'mayonnaise'],
  ['noix', 'nut', 'nuts', 'noisette', 'noisettes', 'hazelnut', 'hazelnuts', 'amande', 'amandes', 'almond', 'almonds', 'cajou', 'cashew', 'pistache', 'pistaches', 'pistachio', 'pistachios', 'macadamia', 'pécan', 'pecan', 'pacane', 'noix du brésil', 'brazil nut', 'châtaigne', 'chestnut', 'noix de pin', 'pine nut'],
  ['soja', 'soya', 'soy', 'soybeans', 'tofu', 'edamame', 'tempeh', 'miso', 'okara', 'lecithine de soja', 'soy lecithin'],
  ['poisson', 'fish', 'saumon', 'salmon', 'thon', 'tuna', 'morue', 'cod', 'tilapia', 'anchois', 'anchovy', 'sardine', 'sardines', 'pangasius', 'truite', 'trout', 'flétan', 'halibut', 'sole', 'merlu', 'hake', 'aiglefin', 'haddock', 'maquereau', 'mackerel', 'doré', 'walleye'],
  ['crustacé', 'crustacés', 'crustacean', 'crustaceans', 'crevette', 'crevettes', 'shrimp', 'prawn', 'prawns', 'homard', 'lobster', 'crabe', 'crab', 'langoustine', 'langoustines', 'écrevisse', 'crayfish'],
  ['mollusque', 'mollusques', 'mollusk', 'mollusks', 'moule', 'moules', 'mussel', 'mussels', 'huître', 'huîtres', 'oyster', 'oysters', 'pétoncle', 'pétoncles', 'scallop', 'scallops', 'palourde', 'palourdes', 'clam', 'clams', 'calmar', 'squid', 'pieuvre', 'octopus'],
  ['fruits de mer', 'seafood', 'shellfish'],
  ['sésame', 'sesame', 'tahini', 'tahine'],
  ['sulfite', 'sulfites', 'sulphite', 'sulphites', 'so2', 'dioxyde de soufre', 'sulphur dioxide', 'sulfur dioxide', 'métabisulfite', 'metabisulfite'],
  ['moutarde', 'mustard'],
  ['céleri', 'celeriac', 'celery', 'céleri-rave'],
  ['lupin', 'lupine', 'lupin flour', 'farine de lupin'],
]

function getKeywords(allergen) {
  const lower = allergen.toLowerCase()
  for (const group of ALLERGEN_GROUPS) {
    if (group.some(kw => lower.includes(kw) || kw.includes(lower))) {
      return group
    }
  }
  return [lower]
}

/**
 * Returns all known synonyms (FR + EN) for a given allergen name.
 * Used to display allergen details to the user.
 */
export function getAllergenSynonyms(allergen) {
  return getKeywords(allergen)
}

function detectAllergens(list, text, tags) {
  return (list || []).filter(allergen => {
    const keywords = getKeywords(allergen)
    const inIngredients = keywords.some(kw => text.includes(kw))
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
  const text = (ingredientsText || '').toLowerCase()
  const tags = (allergenTags || []).map(t => t.replace(/^[a-z]{2}:/, '').toLowerCase())

  return profiles
    .map(profile => ({
      profileName: profile.name,
      detectedAllergies: detectAllergens(profile.allergies, text, tags),
      detectedIntolerances: detectAllergens(profile.intolerances, text, tags),
    }))
    .filter(r => r.detectedAllergies.length > 0 || r.detectedIntolerances.length > 0)
}
