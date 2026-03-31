// src/utils/allergenDetection.js

// Each group contains all keywords (FR + EN) associated with one allergen family.
// If the user's profile allergen matches any keyword in a group, all keywords
// in that group are used to search the ingredients text and allergen tags.
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

/**
 * Returns the expanded keyword list for a given allergen name.
 * If the allergen matches a known group, all keywords in that group are returned.
 * Otherwise, falls back to just the allergen itself.
 */
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
 * Detects which allergens from the user profile are present in the product.
 * Checks both the ingredients text and the declared allergen tags.
 *
 * @param {string[]} profileAllergens - allergen names from user profile
 * @param {string|null} ingredientsText - raw ingredients text from OFF
 * @param {string[]} allergenTags - allergen tags array from OFF (e.g. ["en:gluten"])
 * @returns {string[]} - subset of profileAllergens that were detected
 */
export function detectAllergens(profileAllergens, ingredientsText, allergenTags) {
  const text = (ingredientsText || '').toLowerCase()
  const tags = (allergenTags || []).map(t => t.replace(/^[a-z]{2}:/, '').toLowerCase())

  return profileAllergens.filter(allergen => {
    const keywords = getKeywords(allergen)
    const inIngredients = keywords.some(kw => text.includes(kw))
    const inTags = tags.some(tag => keywords.some(kw => tag.includes(kw) || kw.includes(tag)))
    return inIngredients || inTags
  })
}
