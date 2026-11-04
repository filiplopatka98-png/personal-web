export interface ProcessStep {
  num: string;
  title: string;
  desc: string;
}

export const processSteps: Record<'sk' | 'en', ProcessStep[]> = {
  sk: [
    { num: '01', title: 'Úvodný hovor', desc: '30 minút zadarmo. Spýtam sa pár otázok, vy mi poviete, čo riešite. Ak si sadneme, pošlem ponuku.' },
    { num: '02', title: 'Ponuka', desc: 'Do 3 dní pošlem ponuku s cenou, termínom a rozsahom. Stačí ju potvrdiť e-mailom — bez zmlúv a bez zálohy.' },
    { num: '03', title: 'Úvodný workshop', desc: '2-hodinový workshop, kde mapujeme cieľ, publikum a obsah. Výstup: zadanie a mapa stránok.' },
    { num: '04', title: 'Návrh', desc: 'Návrh vzhľadu uvidíte priamo v prehliadači, nie ako obrázok. Pripomienky zapracujem v 1–2 kolách úprav.' },
    { num: '05', title: 'Build', desc: 'Pracujem po týždňových etapách. Od prvého dňa dostanete odkaz na rozostavaný web, takže vidíte priebeh naživo.' },
    { num: '06', title: 'Launch', desc: 'Krátky pre-launch checklist (SEO, analytics, redirects). Po launchi 1–6 mesiacov podpory podľa balíčka.' },
  ],
  en: [
    { num: '01', title: 'Intro call', desc: '30 min free. I ask questions, you tell me what you need. If we click, I send a proposal.' },
    { num: '02', title: 'Proposal', desc: 'Within 3 days you get a proposal with price, timeline and scope. Just confirm it by e-mail — no contracts, no deposit.' },
    { num: '03', title: 'Kickoff workshop', desc: '2-hour workshop mapping goals, audience, and content. Output: brief + sitemap.' },
    { num: '04', title: 'Design', desc: 'You see the design right in the browser, not as a picture. I work your feedback in over 1–2 rounds of changes.' },
    { num: '05', title: 'Build', desc: 'I work in weekly stages. From day one you get a link to the work-in-progress site, so you can follow along live.' },
    { num: '06', title: 'Launch', desc: 'Short pre-launch checklist (SEO, analytics, redirects). 1–6 months of support after launch depending on package.' },
  ],
};
