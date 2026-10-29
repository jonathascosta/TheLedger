import { ACHIEVEMENTS, type GameState } from '@ledger/engine';
import { Badge } from '../art/Badges.tsx';
import { t, tk } from '../i18n/index.ts';
import { Page } from '../ui/Page.tsx';

export function Achievements({ state }: { state: GameState }) {
  const earned = ACHIEVEMENTS.filter((a) => state.meta.achievements[a.id] !== undefined).length;
  return (
    <Page>
      <div class="between">
        <h1 class="h1">{t('achievements.title')}</h1>
        <p class="small">{t('achievements.count', { earned, total: ACHIEVEMENTS.length })}</p>
      </div>
      <div class="grid3" style={{ rowGap: '14px', textAlign: 'center' }}>
        {ACHIEVEMENTS.map((a) => {
          const got = state.meta.achievements[a.id] !== undefined;
          const hidden = a.secret && !got;
          const name = hidden ? t('achievements.secret') : tk(`ach.${a.id}.name`);
          const desc = hidden ? t('achievements.secretDesc') : tk(`ach.${a.id}.desc`);
          return (
            <div
              key={a.id}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              aria-label={`${name}: ${desc}`}
            >
              <Badge id={a.id} style={a.style} earned={got} text={name} size={76} />
              <p
                class="hand"
                style={{
                  fontWeight: 700,
                  fontSize: '18px',
                  lineHeight: 1,
                  marginTop: '2px',
                  color: got ? 'var(--ink)' : 'var(--pencil)',
                }}
              >
                {name}
              </p>
              <p
                class="tiny"
                style={{ lineHeight: 1.2, color: got ? 'var(--ink-soft)' : 'var(--pencil)' }}
              >
                {desc}
              </p>
            </div>
          );
        })}
      </div>
    </Page>
  );
}
