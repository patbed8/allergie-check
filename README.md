# Allergie Check

A mobile app for fast food allergen detection at the grocery store.

-----

## Description

Allergie Check lets users detect allergens in grocery store food products in seconds. Set up your allergy profile once, then scan products while shopping to get an instant alert if a matching allergen is found.

### Two input modes

- **Barcode scan** — Queries the Open Food Facts database to automatically retrieve the product’s ingredient list and declared allergens.
- **OCR (label photo)** — The user photographs the product label directly; text is extracted and analyzed to identify allergens present.

-----

## Tech Stack

|Layer                |Technology             |Notes                                       |
|---------------------|-----------------------|--------------------------------------------|
|Mobile frontend      |React Native + Expo    |Single codebase for iOS & Android           |
|Barcode scanning     |expo-barcode-scanner   |Native Expo, easy integration               |
|Product database     |Open Food Facts API    |Free, Canadian coverage, no API key required|
|OCR                  |Google ML Kit (offline)|Free, works without internet connection     |
|Smart detection (v2) |Claude API (Anthropic) |Semantic analysis of allergen derivatives   |
|Profile storage (MVP)|AsyncStorage           |Simple, local, no backend required          |
|Profile storage (v2) |Supabase               |Free tier, multi-device, built-in auth      |

-----

## Development Phases

|Phase      |Description                              |Status       |
|-----------|-----------------------------------------|-------------|
|**Phase 1**|Web prototype — business logic validation|🔄 In progress|
|**Phase 2**|Mobile MVP with barcode scan             |⏳ Planned    |
|**Phase 3**|OCR label reading                        |⏳ Planned    |
|**Phase 4**|Smart detection + app store publication  |⏳ Planned    |

-----

## Phase 1 — Web Prototype

> Validates the core detection logic in a simple React web app before tackling mobile constraints.

**Stack:** Vite + React  
**Features:**

- Manual barcode input → Open Food Facts API query
- User allergy profile configuration (custom allergens)
- Keyword-based allergen detection (French + English)
- Visual alert (safe / warning)

-----

## Getting Started

> ⚙️ Setup instructions will be added at the end of Phase 1.

```bash
# Clone the repo
git clone https://github.com/patbed8/allergie-check.git
cd allergie-check
```

-----

## Project Structure

> 🗂️ Project structure will be documented at the end of Phase 1.

-----

## License

[MIT](LICENSE)

-----

## Resources

- [Open Food Facts API](https://world.openfoodfacts.org/data)
- [Expo Documentation](https://docs.expo.dev)
- [Google ML Kit — Text Recognition](https://developers.google.com/ml-kit/vision/text-recognition)
- [Supabase](https://supabase.com/docs)
