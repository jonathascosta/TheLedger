import type { ComponentChildren } from 'preact';
import { t } from '../i18n/index.ts';
import { useSponsorNotice, useWatching, watch } from '../sponsor.ts';

interface Props {
  /** What the sponsor offers, in a few words. */
  title: string;
  /** The reward, written out. */
  reward: string;
  /** A line under the reward: what is running, what is left today. */
  detail?: ComponentChildren;
  /** Grants the reward; called only when the ad was watched to the end. */
  onEarned: () => void;
  /** Called when the ad was closed early (the closing sponsor then seals without it). */
  onSkipped?: () => void;
  /** Nothing left to offer today (the clipping stays, greyed). */
  spent?: boolean;
}

/** A sponsor's clipping taped onto the page, stamped SPONSORED (docs/PRODUCT.md, Sponsors). */
export function Sponsor({ title, reward, detail, onEarned, onSkipped, spent = false }: Props) {
  const busy = useWatching();
  const onClick = async (): Promise<void> => {
    if (spent) return;
    const outcome = await watch();
    if (outcome === 'earned') onEarned();
    else if (outcome === 'skipped') onSkipped?.();
  };
  return (
    <div class={spent ? 'sponsor spent' : 'sponsor'}>
      <span class="sponsor-tape" aria-hidden="true" />
      <span class="sponsor-mark" aria-hidden="true">
        {t('sponsor.mark')}
      </span>
      <p class="sponsor-title">{title}</p>
      <p class="sponsor-reward">{reward}</p>
      {detail !== undefined && <p class="tiny">{detail}</p>}
      <button
        type="button"
        class="btn sponsor-btn"
        disabled={busy || spent}
        aria-label={`${t('sponsor.mark')}: ${title}. ${reward}`}
        onClick={() => void onClick()}
      >
        {busy ? t('sponsor.loading') : spent ? t('sponsor.spent') : t('sponsor.watch')}
      </button>
    </div>
  );
}

/** Says why a sponsor gave nothing: closed early, or no ad to show. */
export function SponsorNotice() {
  const notice = useSponsorNotice();
  if (!notice) return null;
  return (
    <div class="toast" role="status" key={notice}>
      {notice === 'skipped' ? t('sponsor.skipped') : t('sponsor.none')}
    </div>
  );
}
