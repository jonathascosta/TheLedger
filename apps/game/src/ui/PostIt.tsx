import type { AssetClass, GameState } from '@ledger/engine';
import { t, tk } from '../i18n/index.ts';
import { act } from '../store.ts';

/**
 * A yellow post-it with an investment class's rule (docs/PRODUCT.md, Investments). A tap on its
 * corner folds it away for good; Settings brings them all back.
 */
export function PostIt({
  state,
  cls,
}: {
  state: GameState;
  cls: Exclude<AssetClass, 'businesses'>;
}) {
  if (state.settings.postits.includes(cls)) return null;
  return (
    <div class="postit" role="note">
      <p>{tk(`postit.${cls}`)}</p>
      <button
        type="button"
        class="postit-fold"
        aria-label={t('postit.fold')}
        onClick={() => act((s) => s.settings.postits.push(cls))}
      >
        ×
      </button>
    </div>
  );
}
