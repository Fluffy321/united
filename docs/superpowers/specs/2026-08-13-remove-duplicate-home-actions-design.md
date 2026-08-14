# Remove Duplicate Home Actions

## Approved design

Keep the richer `Across your community` category deck on Home and remove the separate `Start here` action card. Both surfaces currently lead to the same core actions, so showing both makes an empty feed feel repetitive.

When there are no community posts, do not show an empty `From your community` heading. Home should end cleanly after the category deck until real posts exist. Loading and error feedback remain available, and real posts still appear under `From your community` once present.

No routes, data, or posting behavior change. Verify at iPhone width, run the normal JUnited checks, then push and deploy.
