import {
  buyClub,
  CLUB_SALE,
  CLUBS,
  clubOf,
  sellClub,
  stars,
  strength,
  bondCap,
  bondRate,
  buyArt,
  buyPark,
  buyProperty,
  CLASS_UNLOCKS,
  investStartup,
  isUnlocked,
  lend,
  lotInfo,
  PARKS,
  passStartup,
  pitchInfo,
  PROPERTIES,
  PROPERTY_SALE,
  rentRate,
  sellArt,
  sellProperty,
  withdraw,
  type AssetClass,
  type GameState,
} from '@ledger/engine';
import { useState } from 'preact/hooks';
import { CityMap } from '../art/CityMap.tsx';
import { Icon } from '../art/Doodles.tsx';
import { t, tk } from '../i18n/index.ts';
import { act } from '../store.ts';
import { Page } from '../ui/Page.tsx';
import { duration, money, moneyShort } from '../ui/format.ts';

function Locked({
  state,
  cls,
  children,
}: {
  state: GameState;
  cls: AssetClass;
  children: preact.ComponentChildren;
}) {
  if (isUnlocked(state, cls)) return <>{children}</>;
  const at = CLASS_UNLOCKS.find((c) => c.id === cls)?.at ?? 0;
  return (
    <div class="locked-card">
      <Icon.lock />
      <span class="hand" style={{ fontSize: '21px' }}>
        {t('common.locked', { amount: moneyShort(at) })}
      </span>
    </div>
  );
}

export function Bonds({ state }: { state: GameState }) {
  const v = state.volume;
  const cap = bondCap(state);
  return (
    <Page>
      <h1 class="h1">{t('bonds.title')}</h1>
      <p class="small">{t('bonds.subtitle')}</p>
      <Locked state={state} cls="bonds">
        <div class="index-card stack" style={{ gap: '4px' }}>
          <p class="h2">{t('bonds.held', { amount: money(v.bonds) })}</p>
          <p class="hand profit" style={{ fontSize: '21px' }}>
            {t('bonds.rate', { amount: moneyShort(v.bonds * bondRate(state)) })}
          </p>
          <p class="tiny">{t('bonds.cap', { amount: moneyShort(cap) })}</p>
        </div>
        <div class="grid2">
          <button
            type="button"
            class="btn"
            disabled={v.cash <= 0 || v.bonds >= cap}
            onClick={() => act((s) => lend(s, s.volume.cash * 0.1))}
          >
            {t('bonds.lend10')}
          </button>
          <button
            type="button"
            class="btn alt"
            disabled={v.cash <= 0 || v.bonds >= cap}
            onClick={() => act((s) => lend(s, s.volume.cash))}
          >
            {t('bonds.lendMax')}
          </button>
        </div>
        <button
          type="button"
          class="stamp-btn red"
          style={{ alignSelf: 'center' }}
          disabled={v.bonds <= 0}
          onClick={() => act((s) => withdraw(s))}
        >
          {t('bonds.withdraw')}
        </button>
      </Locked>
    </Page>
  );
}

export function Estate({ state }: { state: GameState }) {
  const v = state.volume;
  const firstForSale =
    PROPERTIES.find((p) => !v.properties.includes(p.id))?.id ?? PROPERTIES[0]!.id;
  const [selected, setSelected] = useState<string>(firstForSale);
  const def = PROPERTIES.find((p) => p.id === selected)!;
  const owned = v.properties.includes(selected);
  const factor =
    rentRate(state) > 0 && v.properties.length > 0
      ? rentRate(state) /
        PROPERTIES.filter((p) => v.properties.includes(p.id)).reduce((s, p) => s + p.rent, 0)
      : 1;
  return (
    <Page>
      <div class="between">
        <h1 class="h1">{t('estate.title')}</h1>
        <p class="small">
          {t('estate.count', {
            owned: v.properties.length,
            sale: PROPERTIES.length - v.properties.length,
          })}
        </p>
      </div>
      <Locked state={state} cls="realEstate">
        <div style={{ position: 'relative', transform: 'rotate(-0.8deg)', marginLeft: '-26px' }}>
          <span
            class="tape"
            style={{ top: '-9px', left: '30px', transform: 'rotate(-6deg)', zIndex: 1 }}
          />
          <span
            class="tape"
            style={{ top: '-8px', right: '30px', transform: 'rotate(7deg)', zIndex: 1 }}
          />
          <CityMap
            owned={v.properties}
            selected={selected}
            prices={Object.fromEntries(PROPERTIES.map((p) => [p.id, moneyShort(p.price)]))}
            names={Object.fromEntries(PROPERTIES.map((p) => [p.id, tk(`property.${p.id}`)]))}
            districts={{
              oldTown: t('district.oldTown'),
              hilltop: t('district.hilltop'),
              harbour: t('district.harbour'),
              riverLane: t('district.riverLane'),
            }}
            label={t('estate.mapLabel')}
            yours={t('estate.yours')}
            thisOne={t('estate.thisOne')}
            onPick={setSelected}
          />
        </div>
        <div class="row">
          <div class="grow">
            <h2 class="h2">{tk(`property.${selected}`)}</h2>
            <p class="small">
              {tk(`district.${def.district}`)} ·{' '}
              {owned
                ? t('estate.owned', { rent: moneyShort(def.rent * factor) })
                : t('estate.forSale', {
                    rent: moneyShort(
                      def.rent * (state.meta.partners.includes('estateAgent') ? 2 : 1),
                    ),
                  })}
            </p>
          </div>
          {owned ? (
            <button
              type="button"
              class="stamp-btn red"
              onClick={() => act((s) => sellProperty(s, selected))}
            >
              {t('market.sell')}
              <br />
              <span style={{ fontSize: '13px' }}>{moneyShort(def.price * PROPERTY_SALE)}</span>
            </button>
          ) : (
            <button
              type="button"
              class="stamp-btn green"
              disabled={v.cash < def.price}
              onClick={() => act((s) => buyProperty(s, selected))}
            >
              {t('market.buy')}
              <br />
              <span style={{ fontSize: '13px' }}>{moneyShort(def.price)}</span>
            </button>
          )}
        </div>
      </Locked>
    </Page>
  );
}

export function Startups({ state }: { state: GameState }) {
  const v = state.volume;
  const pitch = v.startup;
  const info = pitch ? pitchInfo(state, pitch.index) : null;
  const now = Date.now();
  return (
    <Page>
      <h1 class="h1">{t('startups.title')}</h1>
      <p class="small">{t('startups.subtitle')}</p>
      <Locked state={state} cls="startups">
        {pitch && info ? (
          <div class="index-card stack" style={{ gap: '6px' }}>
            <p class="caps">Pitch #{pitch.index}</p>
            <p class="h2">
              {t('startups.pitch', { name: info.name, sector: tk(`sector.${info.sector}`) })}
            </p>
            <p class="hand" style={{ fontSize: '20px' }}>
              {t('startups.ask', { amount: money(pitch.ask) })}
            </p>
            {pitch.maturesAt !== null ? (
              <p class="hand loss" style={{ fontSize: '21px' }}>
                {t('startups.matures', { duration: duration((pitch.maturesAt - now) / 1000) })}
              </p>
            ) : (
              <div class="row" style={{ justifyContent: 'center', gap: '16px' }}>
                <button
                  type="button"
                  class="stamp-btn green"
                  disabled={v.cash < pitch.ask}
                  onClick={() => act((s) => investStartup(s, Date.now()))}
                >
                  {t('startups.invest')}
                </button>
                <button type="button" class="btn alt" onClick={() => act((s) => passStartup(s))}>
                  {t('startups.pass')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <p class="hand" style={{ fontSize: '20px' }}>
            {t('startups.waiting')}
          </p>
        )}
        {v.startupResults.length > 0 && (
          <>
            <p class="caps">{t('startups.history')}</p>
            {v.startupResults
              .slice(-8)
              .reverse()
              .map((r) => {
                const i = pitchInfo(state, r.index);
                const text =
                  r.stake === 0
                    ? t('startups.passed')
                    : r.multiple === 0
                      ? t('startups.failed')
                      : t('startups.returned', { multiple: r.multiple });
                return (
                  <p
                    key={r.index}
                    class="hand"
                    style={{
                      fontSize: '19px',
                      textDecoration: r.stake > 0 && r.multiple === 0 ? 'line-through' : 'none',
                    }}
                  >
                    #{r.index} {i.name} ·{' '}
                    <span class={r.multiple > 1 ? 'profit' : 'muted'}>{text}</span>
                  </p>
                );
              })}
          </>
        )}
      </Locked>
    </Page>
  );
}

export function Art({ state }: { state: GameState }) {
  const v = state.volume;
  const lot = v.artLot;
  const now = Date.now();
  const lotName = (n: number): string => {
    const i = lotInfo(state, n);
    return t('art.piece', { kind: tk(`artKind.${i.kind}`), number: i.number });
  };
  const owned = lot ? v.art.some((a) => a.lot === lot.lot) : false;
  return (
    <Page>
      <h1 class="h1">{t('art.title')}</h1>
      <p class="small">{t('art.subtitle')}</p>
      <Locked state={state} cls="art">
        {lot && (
          <div class="index-card stack" style={{ gap: '6px' }}>
            <p class="caps">
              {t('art.lot', { lot: lot.lot })} ·{' '}
              {t('art.closes', { duration: duration((lot.closesAt - now) / 1000) })}
            </p>
            <div
              style={{
                alignSelf: 'center',
                width: '140px',
                height: '110px',
                border: '8px solid var(--gold)',
                outline: '2px solid var(--gold-dark)',
                backgroundColor: 'var(--paper)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg aria-hidden="true" viewBox="0 0 120 90" width="120" height="90">
                <g
                  filter="url(#wobble)"
                  fill="none"
                  style={{ stroke: 'var(--ink)' }}
                  stroke-width="1.8"
                >
                  <path
                    d={`M0 ${60 + (lot.lot % 5) * 4} C30 ${40 + (lot.lot % 7) * 3}, 70 70, 120 ${50 + (lot.lot % 3) * 6}`}
                    fill="url(#hatch-green)"
                  />
                  <circle cx={30 + (lot.lot % 6) * 12} cy="24" r="10" fill="url(#hatch-red)" />
                </g>
              </svg>
            </div>
            <p class="h2 center">{lotName(lot.lot)}</p>
            <p class="hand center" style={{ fontSize: '19px' }}>
              {t('art.by', { artist: lotInfo(state, lot.lot).artist })}
            </p>
            <button
              type="button"
              class="stamp-btn green"
              style={{ alignSelf: 'center' }}
              disabled={owned || v.cash < lot.price}
              onClick={() => act((s) => buyArt(s))}
            >
              {owned ? t('common.owned') : t('art.bid', { amount: moneyShort(lot.price) })}
            </button>
          </div>
        )}
        <p class="caps">{t('art.collection')}</p>
        {v.art.length === 0 && (
          <p class="hand" style={{ fontSize: '19px' }}>
            {t('art.empty')}
          </p>
        )}
        {v.art.map((a) => (
          <div key={a.lot} class="row">
            <div class="grow">
              <p class="h3" style={{ fontSize: '20px' }}>
                {lotName(a.lot)}
              </p>
              <p class="tiny">
                {t('art.worth', { amount: moneyShort(a.value) })} · {lotInfo(state, a.lot).artist}
              </p>
            </div>
            <button type="button" class="btn" onClick={() => act((s) => sellArt(s, a.lot))}>
              {t('art.sell')}
            </button>
          </div>
        ))}
      </Locked>
    </Page>
  );
}

export function Energy({ state }: { state: GameState }) {
  const v = state.volume;
  return (
    <Page>
      <h1 class="h1">{t('energy.title')}</h1>
      <p class="small">{t('energy.subtitle')}</p>
      <Locked state={state} cls="energy">
        {PARKS.map((p) => {
          const owned = v.parks.includes(p.id);
          return (
            <div key={p.id} class="row" style={{ minHeight: '60px' }}>
              <div class="grow">
                <p class="h3">{tk(`park.${p.id}`)}</p>
                <p class="small profit">{t('energy.income', { amount: moneyShort(p.income) })}</p>
              </div>
              {owned ? (
                <p class="hand profit" style={{ fontSize: '22px' }}>
                  ✓ {t('common.owned')}
                </p>
              ) : (
                <button
                  type="button"
                  class="stamp-btn green"
                  style={{ fontSize: '17px' }}
                  disabled={v.cash < p.price}
                  onClick={() => act((s) => buyPark(s, p.id))}
                >
                  {t('energy.build', { amount: moneyShort(p.price) })}
                </button>
              )}
            </div>
          );
        })}
      </Locked>
    </Page>
  );
}

/** A club's crest: a shield in the club's colours, a stripe and its initial. */
function Crest({ index, name }: { index: number; name: string }) {
  const colour = `var(--pie-${(index % 10) + 1})`;
  return (
    <svg aria-hidden="true" viewBox="0 0 40 46" width="38" height="44">
      <g style={{ stroke: 'var(--ink)' }} stroke-width="2" stroke-linejoin="round">
        <path
          d="M4 5 L36 5 L36 22 C36 34 28 40 20 43 C12 40 4 34 4 22 Z"
          style={{ fill: colour }}
        />
        <path d="M4 14 L36 14" style={{ stroke: 'var(--paper-white)' }} stroke-width="5" />
      </g>
      <text
        x="20"
        y="34"
        text-anchor="middle"
        font-family="IM Fell English, serif"
        font-size="15"
        style={{ fill: 'var(--paper-white)' }}
      >
        {name.charAt(0)}
      </text>
    </svg>
  );
}

export function Clubs({ state }: { state: GameState }) {
  const v = state.volume;
  return (
    <Page>
      <h1 class="h1">{t('clubs.title')}</h1>
      <p class="small">{t('clubs.subtitle')}</p>
      <Locked state={state} cls="clubs">
        {CLUBS.map((def, i) => {
          const club = clubOf(state, def);
          const name = tk(`club.${def.id}`);
          const s = stars(strength(state, def.id));
          return (
            <div key={def.id} class="row" style={{ minHeight: '64px', alignItems: 'flex-start' }}>
              <Crest index={i} name={name} />
              <div class="grow">
                <p class="h3">{name}</p>
                <p class="small" aria-label={t('clubs.stars', { count: s })}>
                  {'★'.repeat(s)}
                  {'☆'.repeat(5 - s)} · {t('clubs.prize', { amount: moneyShort(def.price * 0.85) })}
                </p>
                <p class="small">
                  {t('clubs.value', { amount: moneyShort(club.value) })}
                  {club.results.length > 0 && (
                    <span aria-label={t('clubs.results')}>
                      {' · '}
                      {club.results.map((r, k) => (
                        <b key={k} class={r === 'W' ? 'profit' : r === 'L' ? 'loss' : ''}>
                          {tk(`clubs.result.${r}`)}
                        </b>
                      ))}
                    </span>
                  )}
                </p>
              </div>
              {club.owned ? (
                <button
                  type="button"
                  class="stamp-btn red"
                  style={{ fontSize: '16px' }}
                  onClick={() => act((st) => sellClub(st, def.id))}
                >
                  {t('clubs.sell', { amount: moneyShort(club.value * CLUB_SALE) })}
                </button>
              ) : (
                <button
                  type="button"
                  class="stamp-btn green"
                  style={{ fontSize: '16px' }}
                  disabled={v.cash < club.value}
                  onClick={() => act((st) => buyClub(st, def.id))}
                >
                  {t('clubs.buy', { amount: moneyShort(club.value) })}
                </button>
              )}
            </div>
          );
        })}
      </Locked>
    </Page>
  );
}
