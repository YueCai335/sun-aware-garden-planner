# ADR-0010: Use Mapbox for Address-Guided Map Initialization

- Status: Accepted
- Date: 2026-08-29

## Context

ADR-0009 establishes an address-guided first-use workflow. That workflow needs
interactive satellite imagery, address search, a browser-friendly integration,
clear operating costs, and a path to a public product.

The project uses Next.js and requires a map component that can display the
user's confirmed garden geometry above the provider base layer. The provider
also needs a clear boundary between visual source data and garden data owned by
the user.

## Decision

Use Mapbox GL JS for the interactive web map and Mapbox Search JS for address
search in the address-guided map feature.

- Render the map in a client-only Next.js component and use a Mapbox public
  access token supplied through a local environment variable.
- Create a dedicated public web token with URL restrictions for local
  development and the deployed application. The token receives only the scopes
  required by the implemented Mapbox features.
- Use temporary geocoding for live search. The application does not cache the
  Mapbox search response or provider imagery.
- Persist user-entered address text and user-confirmed garden geometry as
  planner data. Future backend persistence requires a privacy and provider-term
  review before it stores any location-derived provider data.
- Display Mapbox attribution and retain required provider notices in the map UI.
- Track map loads and search use in the provider dashboard before public launch.

## Why This Option

- Mapbox provides satellite maps, web-map rendering, and address search through
  a coherent JavaScript and React-oriented product family.
- The portfolio project gains a recognizable geospatial integration while
  retaining direct ownership of garden-specific geometry and solar analysis.
- The current pricing model provides a practical early-stage allowance for map
  loads and temporary search requests, with explicit usage measurement as the
  product grows.
- URL-restricted public tokens support a safer browser integration than placing
  an unrestricted account token in the application.

## Alternatives Considered

### Google Maps Platform

Google Maps provides strong imagery coverage and a mature API. Its billing,
content handling rules, and provider-specific integration constraints create a
heavier first implementation for this portfolio stage.

### MapLibre with a Separate Tile and Search Provider

MapLibre is a capable open-source renderer. It still requires separate choices
for satellite tiles and address search, and its Next.js worker setup adds
integration work before the product has a visible address-to-yard workflow.

### Manual Image Upload as the Only First-Use Flow

Image upload remains a fallback for user-owned or permitted imagery. It leaves
new users responsible for locating, scaling, and aligning their own yard image.

## Consequences

- The frontend gains Mapbox GL JS and Mapbox Search JS dependencies when the
  map feature is implemented.
- The project requires documented local and deployed environment configuration
  for a public Mapbox token. `.env.local` remains outside Git.
- The first map release needs empty, loading, token-missing, search-failure,
  and provider-attribution states.
- Mapbox search and imagery remain display inputs. The planner's polygon
  boundaries, obstacle geometry, corrections, and later sky captures remain
  the data used for product analysis.
- Map usage requires cost monitoring before the public product phase.

## Revisit When

Reconsider this choice when projected usage exceeds the selected plan, a
required location workflow conflicts with provider terms, self-hosted map data
becomes justified, or a product requirement needs a capability Mapbox cannot
provide.
