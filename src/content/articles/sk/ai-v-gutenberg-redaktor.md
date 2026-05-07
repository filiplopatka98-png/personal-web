---
title: "Claude / GPT v Gutenberg redaktorovi: 3 use-casy bez halucinácií"
date: 2025-11-12
read: 7
tags: ["AI", "WordPress", "UX"]
excerpt: "Tri konkrétne AI integrácie do Gutenbergu, ktoré nehalucinujú a redaktori ich naozaj používajú. Plus skeleton plugin kódu na štart."
featured: false
---

Väčšina "AI v WordPresse" pluginov ti ponúkne "Generate full article" tlačidlo. Hrôza — output je plochý, faktograficky neistý a Google ho čoraz častejšie penalizuje. Ale je pár vecí, ktoré AI vie spraviť skvele a redaktori ich budú reálne používať.

Tu sú tri use-casy, ktoré som tento rok dodal pre tri rôzne magazíny. Všetky sú "low hallucination risk" — AI dostane konkrétny kontext a má presne definovaný output.

## Use case 1: Translate selected block

Redaktor selectne odsek, klikne v sidebare "Preložiť do EN/DE/HU", AI vráti preklad ako nový block. Nič viac.

Prečo to funguje:
- vstup je obmedzený (jeden block, nie celý článok)
- output je deterministický (preklad textu, nie kreatívny obsah)
- redaktor vidí výsledok pred aplikáciou
- žiadny risk že AI vymyslí fakty — preložiť sa dá len to, čo už v texte je

Pri Claude 3.5 Sonnet pre slovenčinu/češtinu je kvalita lepšia ako DeepL pre marketingový copy s tonalitou. GPT-4o je o čosi rýchlejší, kvalitatívne porovnateľný.

## Use case 2: Summarize do 280-char excerpt

WordPress má `post_excerpt` pole. 90 % redaktorov ho ignoruje (excerpt sa potom auto-generuje z prvého odseku). AI tlačidlo "Generuj excerpt z článku" pošle plné body, dostane späť 1–2 vety pod 280 znakov.

Kontext je celý článok — AI nemá kde halucinovať, len kondenzuje. Pre meta description / OG tags je to tiež zlato.

Prompt skeleton:

```ts
const prompt = `
Si SEO copywriter. Sumarizuj nasledujúci článok do MAX 280 znakov.
Píš v 1-2 vetách, slovensky, vecne, bez "v dnešnej dobe" fluffu.
Output JSON: {"excerpt": "..."}.

Článok:
${articleContent}
`;
```

Output schema validation cez `zod`. Ak Claude vráti čokoľvek > 280 chars, retry s `Ten excerpt mal ${len} znakov, treba pod 280.`. Po dvoch failoch fallback na truncate.

## Use case 3: Image alt text z featured image

Accessibility win + SEO win. Redaktor uploadne obrázok, klikne "Generuj alt text", AI zo screenshot-u vráti popis. Vision modely (GPT-4o, Claude 3.5 Sonnet) sú v tomto solídne — pre produktové fotky ~95 % accuracy.

Guardrails:
- max 125 znakov (sweet spot pre SEO + screenreaders)
- zakaž "Image of...", "Picture of..." prefix
- ak AI vráti brand name (Nike, Apple), flag for review — vision modely občas hallucinujú logá

## Skeleton plugin

```php
// my-ai-blocks.php
add_action('enqueue_block_editor_assets', function() {
    wp_enqueue_script(
        'my-ai-sidebar',
        plugins_url('build/index.js', __FILE__),
        ['wp-plugins', 'wp-edit-post', 'wp-element', 'wp-components']
    );
});

add_action('rest_api_init', function() {
    register_rest_route('myai/v1', '/translate', [
        'methods' => 'POST',
        'callback' => 'myai_translate_handler',
        'permission_callback' => fn() => current_user_can('edit_posts'),
    ]);
});

function myai_translate_handler($req) {
    $text = sanitize_textarea_field($req['text']);
    $lang = sanitize_key($req['lang']);

    if (strlen($text) > 5000) {
        return new WP_Error('too_long', 'Max 5000 znakov', ['status' => 400]);
    }

    $response = wp_remote_post('https://api.anthropic.com/v1/messages', [
        'headers' => [
            'x-api-key' => MYAI_ANTHROPIC_KEY,
            'anthropic-version' => '2023-06-01',
            'content-type' => 'application/json',
        ],
        'body' => wp_json_encode([
            'model' => 'claude-3-5-sonnet-20241022',
            'max_tokens' => 1500,
            'messages' => [[
                'role' => 'user',
                'content' => "Prelož do $lang. Zachovaj tonalitu. Vráť len preklad, žiadny komentár.\n\n$text"
            ]],
        ]),
        'timeout' => 30,
    ]);

    if (is_wp_error($response)) return $response;

    $body = json_decode(wp_remote_retrieve_body($response), true);
    return ['translation' => $body['content'][0]['text'] ?? ''];
}
```

JS sidebar (zjednodušene):

```js
import { registerPlugin } from '@wordpress/plugins';
import { PluginSidebar } from '@wordpress/edit-post';
import { Button, SelectControl } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';

const Sidebar = () => {
    const selectedBlock = useSelect((s) =>
        s('core/block-editor').getSelectedBlock()
    );
    const { updateBlockAttributes } = useDispatch('core/block-editor');
    const [lang, setLang] = useState('en');
    const [loading, setLoading] = useState(false);

    const translate = async () => {
        setLoading(true);
        const res = await wp.apiFetch({
            path: '/myai/v1/translate',
            method: 'POST',
            data: { text: selectedBlock.attributes.content, lang }
        });
        updateBlockAttributes(selectedBlock.clientId, {
            content: res.translation
        });
        setLoading(false);
    };

    return (
        <PluginSidebar name="myai" title="AI Assistant">
            <SelectControl value={lang} onChange={setLang} options={[
                { label: 'EN', value: 'en' },
                { label: 'DE', value: 'de' },
                { label: 'HU', value: 'hu' },
            ]} />
            <Button isPrimary onClick={translate} isBusy={loading}>
                Preložiť block
            </Button>
        </PluginSidebar>
    );
};

registerPlugin('myai-sidebar', { render: Sidebar });
```

## Bezpečnostné guardrails (nezabudni)

- API kľúč v `wp-config.php` cez `define('MYAI_ANTHROPIC_KEY', '...')`, NIE v DB
- nonce check na REST endpointe (`permission_callback`)
- rate limit per user (transient counter, 100 calls/deň/redaktor stačí)
- log usage do custom table — uvidíš kto AI používa a koľko ťa to stojí
- input length cap (5000 znakov pre translate, 25000 pre summarize)

## TL;DR

AI v Gutenbergu má zmysel, keď je vstup obmedzený a output overiteľný. Translate, summarize, alt text — tri features, ktoré redaktori používajú denne. "Generate full article" tlačidlo zahodže. Náklady pri stredne aktívnej redakcii: $15–40/mes na Claude/OpenAI API. Hodnota: hodiny ušetreného času na rutinných úlohách.
