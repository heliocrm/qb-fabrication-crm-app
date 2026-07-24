# QB Fabrication CRM — project backlog

Cross-cutting items that are intentionally not in the current soft-launch builds.

## Admin feature flags

Build an Admin tool with on/off toggles for modules and functions as the product grows, for example:

- Material Pull module
- Batch / Pull workspace
- Web Push / email channels
- Catalog sources
- Future inventory / receiving features

Support hierarchy and permission overlays over time (who can enable what), without shipping new `OrganizationRole` values for every seat.

## Material Pull — location options

Done: `MATERIAL_PULL_LOCATIONS` in `lib/material-pull-config.ts` uses shop equipment/area names (Angle Master, Shear, Brake, Beam Line, Plate Burner, Blacktop). Future: admin-editable list if locations change often.

## Material catalog shape hierarchy

Group the searchable material picker by shape family (angles, WF, HSS, pipe) for faster browse on the floor.
