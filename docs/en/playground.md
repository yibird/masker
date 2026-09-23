# Playground

Try every core masker interactively: switch types, edit the input, tweak `mask` / `keepStart` / `keepEnd` — the pane on the right and the code block **reflect real library output in real time**.

<Playground />

## Tips

- For **Email / Name**, `keepStart` and `keepEnd` are counted in graphemes
- For **Phone**, the kept digits apply to the national number (the country code is always preserved)
- For **Credit Card**, invalid short card numbers are returned unchanged
- For **Bank Account**, rules are separate from Credit Card; default keeps the last 4 only
- For **ID Card**, 15/18-digit shapes are recognised (default first 6 + last 4)
- For **Vehicle**, plate vs VIN is auto-detected (17 chars = VIN)
- For **MAC**, the first 3 octets (OUI) are kept by default
- For **Address**, the Playground sets `disableAutoPrefix: true` so pure `keepStart` experiments are easy; the doc examples still use the administrative-region heuristic by default
- For **JWT / IP / URL**, mainly toggle `mask` and the JWT `header` strategy

For more combinations, see the [API Reference](/en/reference/api) and [Recipes](/en/advanced/recipes).
