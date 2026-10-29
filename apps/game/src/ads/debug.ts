import { t } from '../i18n/index.ts';
import type { AdProvider } from './ads.ts';

/**
 * The test card, to try sponsors without an ad network (`?ads=test`): a full-screen card with two
 * ways out, watched to the end (the reward) or closed early (none). It counts the ads it showed in
 * `data-rewarded`, for the end-to-end tests.
 */
export class DebugAds implements AdProvider {
  readonly available = true;
  private readonly doc: Document;
  private shown = 0;
  private showing = false;

  constructor(doc: Document) {
    this.doc = doc;
  }

  showRewarded(): Promise<boolean> {
    if (this.showing) return Promise.resolve(false);
    this.showing = true;
    this.shown++;
    const doc = this.doc;
    const card = doc.createElement('div');
    card.className = 'test-ad';
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'true');
    card.setAttribute('aria-label', t('ads.test.title'));
    card.dataset.rewarded = String(this.shown);
    const inner = doc.createElement('div');
    inner.className = 'test-ad-card';
    const title = doc.createElement('p');
    title.className = 'h2';
    title.textContent = t('ads.test.title');
    const body = doc.createElement('p');
    body.textContent = t('ads.test.body');
    inner.append(title, body);
    card.append(inner);
    const behind = [...doc.body.children].filter(
      (child): child is HTMLElement => !child.hasAttribute('inert'),
    );
    return new Promise((resolve) => {
      const close = (reward: boolean): void => {
        this.showing = false;
        card.remove();
        for (const element of behind) element.toggleAttribute('inert', false);
        resolve(reward);
      };
      const button = (label: string, className: string, reward: boolean): HTMLButtonElement => {
        const b = doc.createElement('button');
        b.type = 'button';
        b.className = className;
        b.textContent = label;
        b.addEventListener('click', () => close(reward), { once: true });
        return b;
      };
      const finish = button(t('ads.test.finish'), 'stamp-btn green', true);
      inner.append(finish, button(t('ads.test.skip'), 'btn-link', false));
      for (const element of behind) element.toggleAttribute('inert', true);
      doc.body.append(card);
      finish.focus();
    });
  }
}
