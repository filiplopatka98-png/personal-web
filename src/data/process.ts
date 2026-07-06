export interface ProcessStep {
  num: string;
  title: string;
  desc: string;
}

export const processSteps: Record<'sk' | 'en', ProcessStep[]> = {
  sk: [
    { num: '01', title: 'Discovery call', desc: '30 min zadarmo. Spýtam sa otázok, mi povieš čo riešiš. Ak si sadneme, pošlem ponuku.' },
    { num: '02', title: 'Ponuka & zmluva', desc: 'Do 3 dní pošlem ponuku s rozpočtom, harmonogramom a rozsahom. Po podpise 30 % záloha.' },
    { num: '03', title: 'Discovery workshop', desc: '2-hodinový workshop, kde mapujeme cieľ, publikum a obsah. Výstup: brief + sitemap.' },
    { num: '04', title: 'Dizajn', desc: '1–2 kolá dizajnu vo Figme. Pravidelná spätná väzba každý piatok cez Loom.' },
    { num: '05', title: 'Build', desc: 'Práca v sprintoch po týždňoch. Staging URL od prvého dňa, môžeš sledovať postup.' },
    { num: '06', title: 'Launch', desc: 'Krátky pre-launch checklist (SEO, analytics, redirects). Po launchi 1–6 mesiacov podpory podľa balíčka.' },
  ],
  en: [
    { num: '01', title: 'Discovery call', desc: '30 min free. I ask questions, you tell me what you need. If we click, I send a proposal.' },
    { num: '02', title: 'Proposal & contract', desc: 'Within 3 days you get a proposal with budget, schedule, and scope. 30% deposit on signing.' },
    { num: '03', title: 'Discovery workshop', desc: '2-hour workshop mapping goals, audience, and content. Output: brief + sitemap.' },
    { num: '04', title: 'Design', desc: '1–2 design rounds in Figma. Weekly Loom feedback every Friday.' },
    { num: '05', title: 'Build', desc: 'Weekly sprints. Staging URL from day one, you watch progress live.' },
    { num: '06', title: 'Launch', desc: 'Short pre-launch checklist (SEO, analytics, redirects). 1–6 months of support after launch depending on package.' },
  ],
};
