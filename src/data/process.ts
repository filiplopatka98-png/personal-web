export interface ProcessStep {
  num: string;
  title: string;
  desc: string;
}

export const processSteps: Record<'sk' | 'en', ProcessStep[]> = {
  sk: [
    { num: '01', title: 'Úvodný hovor', desc: '30 minút zadarmo. Spýtam sa pár otázok, vy mi poviete, čo riešite. Ak si sadneme, pošlem ponuku.' },
    { num: '02', title: 'Ponuka', desc: 'Do 3 dní pošlem ponuku s cenou, termínom a rozsahom. Stačí ju potvrdiť e-mailom — bez zmlúv a bez zálohy.' },
    { num: '03', title: 'Podklady', desc: 'Pošlem vám pár otázok k cieľu webu, k vašim zákazníkom a k obsahu. Vy dodáte texty, fotky a odpovede a ja z toho zložím zadanie a mapu stránok. Bez dlhých stretnutí.' },
    { num: '04', title: 'Návrh', desc: 'Návrh vzhľadu uvidíte priamo v prehliadači, nie ako obrázok. Pripomienky zapracujem v 1–2 kolách úprav.' },
    { num: '05', title: 'Build', desc: 'Pracujem po týždňových etapách. Od prvého dňa dostanete odkaz na rozostavaný web, takže vidíte priebeh naživo.' },
    { num: '06', title: 'Launch', desc: 'Pred spustením prejdem krátky checklist (SEO, analytika, presmerovania). Pri odovzdaní zaručím na mobile skóre aspoň 90 a 30 dní po spustení opravujem chyby zdarma. Potom sa môžem o web starať v rámci údržby od 39 €/mesiac.' },
  ],
  en: [
    { num: '01', title: 'Intro call', desc: '30 min free. I ask questions, you tell me what you need. If we click, I send a proposal.' },
    { num: '02', title: 'Proposal', desc: 'Within 3 days you get a proposal with price, timeline and scope. Just confirm it by e-mail — no contracts, no deposit.' },
    { num: '03', title: 'Materials', desc: 'I send you a few questions about the goal of the site, your customers and the content. You send texts, photos and answers, and I turn them into a brief and a sitemap. No long meetings.' },
    { num: '04', title: 'Design', desc: 'You see the design right in the browser, not as a picture. I work your feedback in over 1–2 rounds of changes.' },
    { num: '05', title: 'Build', desc: 'I work in weekly stages. From day one you get a link to the work-in-progress site, so you can follow along live.' },
    { num: '06', title: 'Launch', desc: 'Short pre-launch checklist (SEO, analytics, redirects). At handover I guarantee a mobile score of at least 90, and for 30 days after launch I fix bugs for free. After that I can look after the site with maintenance from €39/month.' },
  ],
};
