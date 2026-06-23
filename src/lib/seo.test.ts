import { describe, it, expect } from 'vitest';
import { computeSeo, slugify, type SeoInput } from './seo';

const longBody = () => {
  const para = 'Goede jeugdvoetbal training draait om plezier herhaling en duidelijke uitleg voor elke speler. ';
  return `<p>${para.repeat(55)}</p><h2>Praktische tips</h2>`
    + `<p>Lees ook <a href="/blog/andere-tip">dit artikel</a> en bekijk de <a href="https://knvb.nl">KNVB-richtlijnen</a>.</p>`;
};

const perfectPost = (): SeoInput => ({
  title: 'Jeugdvoetbal trainingstips voor jonge spelers',
  meta_title: 'Jeugdvoetbal trainingstips',
  meta_description: 'Praktische jeugdvoetbal trainingstips voor coaches en ouders om jonge spelers met plezier beter te laten worden vandaag.',
  excerpt: 'Praktische tips voor betere jeugdvoetbaltrainingen.',
  body: longBody(),
  keywords: ['jeugdvoetbal', 'training', 'tips'],
  cover_image_url: 'https://example.com/cover.jpg',
});

describe('computeSeo', () => {
  it('geeft 100 voor een volledig geoptimaliseerde post', () => {
    const r = computeSeo(perfectPost());
    const failed = r.checks.filter((c) => !c.ok).map((c) => c.label);
    expect(failed).toEqual([]);
    expect(r.score).toBe(100);
  });

  it('geeft een lage score voor een lege/zwakke post', () => {
    const r = computeSeo({
      title: 'Hi', meta_title: null, meta_description: null, excerpt: '',
      body: '<p>kort</p>', keywords: [], cover_image_url: null,
    });
    expect(r.score).toBeLessThan(30);
  });

  it('detecteert ontbrekende interne link', () => {
    const p = perfectPost();
    p.body = p.body.replace('href="/blog/andere-tip"', 'href="https://elders.nl"');
    const r = computeSeo(p);
    expect(r.checks.find((c) => c.label === 'Interne link aanwezig')?.ok).toBe(false);
    expect(r.score).toBeLessThan(100);
  });

  it('detecteert ontbrekende externe link', () => {
    const p = perfectPost();
    p.body = p.body.replace('https://knvb.nl', '/blog/intern-2');
    expect(computeSeo(p).checks.find((c) => c.label === 'Externe link aanwezig')?.ok).toBe(false);
  });

  it('keurt te lange titel af', () => {
    const p = perfectPost();
    p.title = 'Dit is een veel te lange titel over jeugdvoetbal training die ver boven de zestig tekens uitkomt';
    expect(computeSeo(p).checks.find((c) => c.label === 'Titellengte 30–60 tekens')?.ok).toBe(false);
  });

  it('vereist het focus-keyword in de tekst', () => {
    const p = perfectPost();
    p.keywords = ['onvindbaarwoord'];
    const r = computeSeo(p);
    expect(r.checks.find((c) => c.label === 'Focus-keyword in tekst')?.ok).toBe(false);
    expect(r.checks.find((c) => c.label === 'Focus-keyword in titel')?.ok).toBe(false);
  });
});

describe('slugify', () => {
  it('maakt kebab-case zonder accenten', () => {
    expect(slugify('Café & Bar!! Test')).toBe('cafe-bar-test');
  });
  it('verwijdert leestekens en dubbele streepjes', () => {
    expect(slugify('Jeugdvoetbal: 10 Tips!')).toBe('jeugdvoetbal-10-tips');
  });
  it('trimt leidende/sluitende streepjes', () => {
    expect(slugify('  ---Hallo Wereld---  ')).toBe('hallo-wereld');
  });
  it('beperkt de lengte tot 70 tekens', () => {
    expect(slugify('a'.repeat(120)).length).toBeLessThanOrEqual(70);
  });
});
