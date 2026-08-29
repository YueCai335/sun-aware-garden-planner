# ADR-0012: Use Address-First Parcel Candidates With User Confirmation

- Status: Accepted
- Date: 2026-08-29
- Complements: [ADR-0008](0008-use-metric-reference-grid-and-polygon-yard-boundary.md), [ADR-0009](0009-use-address-guided-map-initialization-and-point-sky-calibration.md), and [ADR-0010](0010-use-mapbox-for-address-guided-map-initialization.md)

## Context

Users can recognize their yard quickly on a satellite map, while a blank grid
requires them to reproduce a property by hand before the product provides any
value. An address supplies a geographic anchor and true-north orientation.
Licensed parcel data can supply a candidate property polygon in supported
regions. Building footprints, map features, and future image understanding can
supply additional candidate geometry.

A cadastral parcel describes land ownership. A usable growing area also depends
on houses, decks, driveways, pools, access areas, canopy, and the user's garden
intent. Solar analysis needs geometry that the user has reviewed and confirmed.

## Decision

Adopt an address-first yard setup workflow with licensed parcel candidates and
explicit user confirmation.

1. An address search establishes the map center, geographic anchor, and
   true-north orientation. The map is displayed north-up by default.
2. A parcel-data adapter requests a candidate property polygon only from a
   provider whose coverage, license, cost, retention, and display terms support
   the product workflow.
3. The map displays the candidate parcel, source label, and availability state.
   The user can adopt it, adjust vertices, or start with a map-anchored polygon.
4. The user defines the usable garden area within the parcel and confirms
   important solar obstacles. The confirmed geometry is the input to all solar
   calculations.
5. The application converts confirmed geographic geometry into a local
   metre-based coordinate system for dimensions, shadow projection, and
   heatmap sampling. It retains the geographic anchor and derived north
   orientation for map display and future persistence.
6. React-Konva remains the current precision correction surface while the
   map-backed editing experience is introduced. The map becomes the primary
   onboarding surface.

## Why This Option

- The address immediately connects the planner to the user's real property.
- North orientation and geographic scale derive from the selected location.
- Parcel candidates reduce repetitive tracing in regions with suitable data.
- Explicit confirmation handles imagery age, tree canopy, local improvements,
  and the difference between a cadastral parcel and a usable garden.
- The local metric model from ADR-0008 continues to support deterministic and
  testable solar geometry.

## Alternatives Considered

### Satellite-Image Segmentation as the Boundary Source

Computer vision can propose visual features in a later phase. Satellite imagery
cannot consistently establish cadastral boundaries, growing-area intent, or
obscured geometry at residential scale.

### Manual Metric Grid as the Primary Setup Flow

The metric grid remains valuable for precision correction. Address-first
initialization reduces the setup effort before users see their real yard.

### Scrape Provincial Cadastre Websites

Provincial cadastral viewers can support human research. A public application
requires an authorized data integration with defined service and retention
terms.

### Treat Every Parcel as the Growing Area

The parcel is a useful ownership reference. The product needs a separate,
user-confirmed growing-area polygon for gardening and solar analysis.

## Consequences

- The future backend gains a parcel-data adapter and source metadata for each
  imported candidate.
- Product availability becomes region-aware. Areas without a licensed data
  source use map-anchored drawing or a permitted image workflow.
- The frontend needs visible candidate, source, loading, unsupported-region,
  and confirmation states.
- User-confirmed geometry remains separate from provider imagery and temporary
  geocoding results.
- Future PostGIS persistence stores geographic geometry, a local analysis
  frame, confirmed garden geometry, and source provenance.

## Revisit When

Revisit this decision when the project selects its first parcel-data provider,
adds a supported region, validates map-backed editing on real yards, or gains
evidence that an image-understanding proposal improves correction speed and
accuracy.
