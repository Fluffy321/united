# Five Towns live traffic

JUnited reads nearby crashes, closures, and roadwork from the official 511NY Events API through the protected `five-towns-traffic` Supabase Edge Function.

## One-time setup

1. Register or sign in at [511NY developer documentation](https://511ny.org/developers/doc) and request a developer API key.
2. Find the JUnited Supabase project reference in the project dashboard URL.
3. Store the key directly in Supabase:

   ```bash
   npx supabase secrets set NY511_API_KEY='<key>' --project-ref '<project-ref>'
   ```

4. Deploy the function with normal Supabase request authorization enabled:

   ```bash
   npx supabase functions deploy five-towns-traffic --project-ref '<project-ref>' --use-api
   ```

Do not use `--no-verify-jwt`. Do not put the key in a `VITE_` variable, Vercel, Git, chat, screenshots, browser code, or logs. Supabase makes newly set secrets available without another function deployment.

## Verification

- With no secret or a provider error, Home says `Live traffic unavailable` and links to 511NY.
- After a successful 511NY response with no relevant nearby event, Home says `No nearby 511NY incidents`.
- When an event is present within 12 miles of the Five Towns center, Home shows the event description and road with 511NY as the source.
- The function returns only a maximum of 20 normalized incidents and never returns the provider key.

511NY currently requires a developer key and documents a limit of ten calls every 60 seconds. JUnited polls no more often than every five minutes per active client and sends short cache headers with successful responses.
