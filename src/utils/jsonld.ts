/**
 * Serialize an object to a JSON-LD string safe for inlining via `set:html`.
 *
 * `JSON.stringify` does NOT escape `<`, so a data value containing the literal
 * `</script>` would break out of the surrounding <script> tag. Escaping `<` to
 * its unicode form keeps the JSON valid while making tag-breakout impossible.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
