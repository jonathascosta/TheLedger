# The Ledger: Business Simulator — product

What we are building and why. [ARCHITECTURE.md](ARCHITECTURE.md) says how the code is put
together; [PLAN.md](PLAN.md) says in which order it gets built.

## The idea

An idle business game where the whole game is the player's accounting notebook. The player
stamps invoices, opens businesses, hires managers, and grows a portfolio far wider than the
genre usually offers: stocks, bonds, real estate, commodities, crypto, startups, art and energy.
When growth slows, the player closes the volume, earns goodwill and starts the next volume
faster. Everything is drawn: no photographs anywhere.

The reference is _Business Empire: RichMan_ (businesses, stocks, real estate, crypto) and
_AdVenture Capitalist_ (managers, upgrades, the prestige reset). What we add:

1. **A look of its own:** the ledger. Ruled paper, a red margin, ink that draws the charts as
   they happen, stickers for purchases, rubber stamps and wax seals for achievements, clippings
   from a newspaper for the news.
2. **More kinds of investment**, each with its own rule, unlocked one by one.
3. **Achievements** that are stamped into the book and survive every reset.

Platforms: the web (the website, playable in any browser) and iPhone (the same app wrapped with
Capacitor). Languages: English and Brazilian Portuguese, following the device, switchable in
Settings.

## Art direction

The approved mock-ups live in the design canvas (owner's link). The rules:

- **Paper:** cream paper (`#F4EDDC`) with pale blue rules every 28 px, a red margin line on the
  left and a faint grain. Screens are pages of the notebook.
- **Three hands write on it:** Caveat (by hand: amounts, notes, names), Courier Prime (the
  typewriter: entries, tickers, receipts) and IM Fell English (print: the newspaper, seals,
  covers). The fonts ship with the app.
- **Ink:** navy ink for text and lines, green ink for profit, red ink for loss and alerts, a
  yellow highlighter for key moments, gold leaf on the leather cover.
- **Gestures of the notebook:** charts drawn in ink (a line that draws itself), areas shaded in
  pencil hatching, things circled in red, stickers for businesses, tape for clippings, a strike
  through what was sold, rubber stamps for buttons that commit money (Buy, Sell, Collect), wax
  seals and stamps for achievements.
- **Navigation:** index tabs at the bottom of the page: Ledger, Market, Portfolio, Achievements.
- **The notebook grows with the player:** a recycled notepad under $1 million of net worth, a
  spiral notebook from $1 million, a leather-bound ledger with gold leaf from $1 billion.

## A first session

1. The player opens the game: a blank recycled notepad. The first page is the **front desk**:
   an invoice to stamp. Every tap stamps **PAID** and pays the invoice.
2. With $4 the player opens the first business, the **Corner Café**, stuck into the ledger as
   a sticker. Its till fills; a tap on the till collects it and starts the next cycle.
3. More businesses open; tills fill faster than the player can tap. The newspaper's
   **classifieds** offer managers, who collect for the player and keep working while the game is
   closed.
4. Upgrades multiply profits; milestones at levels 25, 50, 100… double a business's speed.
5. At $100 thousand the **Market** opens; later bonds, real estate, commodities, crypto,
   startups, art and energy. The **morning paper** brings events with a decision.
6. The player leaves and comes back: an adding machine prints the receipt of what the night
   shift earned.
7. Growth slows. A pencilled note says what closing the volume would give. The player closes
   it: the book is sealed and shelved, goodwill is earned, and volume II starts faster.

## Core loops

| Loop  | Length  | What the player does                                             |
| :---- | :------ | :--------------------------------------------------------------- |
| Micro | seconds | Stamp invoices, collect tills                                    |
| Meso  | minutes | Buy levels and upgrades, hire managers, invest, answer the paper |
| Macro | days    | Close the volume, earn goodwill, spend it on partners            |
| Meta  | weeks   | The shelf of volumes, the covers, the achievements               |

## Money

- **Cash** pays for everything. **Net worth** is cash plus the value of every holding (shares,
  bonds, properties, commodities, coins, startup stakes, art, energy parks). Businesses are not
  counted in net worth; their income is.
- **Income per second** is what the businesses (and rents, bonds and parks) earn on average.
- Amounts are written in full up to a million (`$4,812,360`) and then with names: million,
  billion, trillion, quadrillion, quintillion, sextillion, septillion, octillion, nonillion,
  decillion; beyond that in scientific notation. Buttons use short forms (`$48K`, `$1.2M`,
  `$3.4B`, `$5T`, `Qa`, `Qi`, `Sx`, `Sp`, `Oc`, `No`, `Dc`); Portuguese uses `mil`, `mi`, `bi`,
  `tri` and then the same short forms.

## The front desk (the clicker)

- An invoice sits on the desk. Each tap stamps it and pays its value: the larger of $2 and 0.3%
  of the current income per second, times the combo multiplier, times the desk upgrades.
- **The desk is a boost, not the game.** Early on the $2 floor gets the first businesses open;
  later, fully upgraded and at full combo, stamping 3 to 6 times a second roughly doubles the
  income while the player taps; without desk upgrades it adds a few percent.
- Ten stamps fill an invoice; the next one slides in.
- **Combo:** taps less than 1.2 s apart add a tally mark (up to 20). The multiplier is ×1, ×1.5
  from 5 marks, ×1.75 from 10 and ×2 from 15. A pause resets it.
- Desk upgrades multiply the stamp's value.

## Businesses

Ten businesses, opened in order. Each has a level (the number of units owned); buying a level
costs `baseCost × growth^level`. A cycle pays `baseRevenue × level × multipliers`.

| #   | Business (EN / PT)                         | Base cost | Growth | Revenue per cycle |  Cycle |
| :-- | :----------------------------------------- | --------: | -----: | ----------------: | -----: |
| 1   | Corner Café / Café da Esquina              |         4 |   1.07 |                 1 |    1 s |
| 2   | Golden Wheat Bakery / Padaria Trigo Bom    |        60 |   1.15 |                60 |    3 s |
| 3   | Bubbles Laundromat / Lavanderia Bolhas     |       720 |   1.14 |               540 |    6 s |
| 4   | Nonna's Pizza / Pizzaria da Nonna          |     8,640 |   1.13 |             4,320 |   12 s |
| 5   | Yellow Cab Co. / Táxis Amarelos            |   103,680 |   1.12 |            51,840 |   24 s |
| 6   | Seaside Hotel / Hotel Beira-Mar            |   1.244 M |   1.11 |           622,080 |   96 s |
| 7   | Starlight Cinema / Cine Estrela            |   14.93 M |   1.10 |           7.465 M |  384 s |
| 8   | Riverside Rovers FC / Ribeirinha FC        |   179.2 M |   1.09 |           89.58 M | 1536 s |
| 9   | Nest Egg Bank / Banco Pé-de-Meia           |   2.150 B |   1.08 |           1.075 B | 6144 s |
| 10  | Black Gold Refinery / Refinaria Ouro Negro |   25.80 B |   1.07 |           29.67 B |   10 h |

- **Till:** without a manager, a finished cycle waits in the till until the player taps
  **Collect**; collecting starts the next cycle. With a manager, cycles run on their own.
- **Milestones:** at levels 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 and 1000 the
  business's cycle time halves (a cycle never gets shorter than 0.1 s; past that, profit doubles
  instead).
- **Buying:** ×1, ×10, ×100 or Max, chosen once for the whole ledger.
- Each business has its page: its sketch, its level and next milestone, its upgrades and its
  manager.

## Managers

- Hired from the **classifieds** page of the newspaper: one candidate per business the player
  owns and has no manager for. A candidate has a name, a pencil portrait made from parts, a short
  CV line, a trait and a price (`baseCost × 250`, the café's at $1,000).
- **Traits:** _Perfectionist_ (+10% profit for that business), _Negotiator_ (levels of that
  business 10% cheaper), _Night owl_ (that business earns offline at +15 points).
- A manager collects every cycle by itself, while playing and while away.
- Managers leave when the volume is closed; the _Old friends_ partner halves their price.

## Upgrades

Paid in cash, bought once per volume, shown in the business's page and on the Upgrades page of the ledger (which also holds the ledger
and desk upgrades).

- **Business upgrades:** eight per business, each **×3** profit for that business. The k-th
  (k = 0…7) costs `baseCost × 2,500 × 40^k`. Each has its own name in a story that takes the
  business from a corner shop to a multinational (the café: espresso machine, pastry counter,
  terrace, own roastery, second shop, oat milk, champion barista, national franchise).
- **Ledger upgrades:** six that multiply every business's profit by 3, from $1 billion, each
  1,000 times dearer than the last.
- **Desk upgrades:** five that double the stamp's value, from $100, each 25 times dearer.

## Investments

Each class unlocks the first time the volume's **peak net worth** reaches its threshold. Prices
move on a market tick every 5 seconds, drawn from random walks seeded by the volume, so a volume's
market can be replayed exactly (in tests and in support). The Portfolio tab shows the split as a pie coloured in
pencil, the classes, and the locked ones.

| Class       | Opens at | Rule                                                                                    |
| :---------- | -------: | :-------------------------------------------------------------------------------------- |
| Businesses  |       $0 | As above                                                                                |
| Stocks      |   $100 K | Six companies with their own drift and volatility; buy and sell shares; small dividends |
| Bonds       |     $1 M | Lend up to three hours of business income; it earns 1% an hour, withdrawable any time   |
| Real estate |    $10 M | Eight properties on the city map; each pays rent per second and can be sold at 90%      |
| Commodities |    $50 M | Gold (calm), oil (moves with the news) and coffee; bought and sold by the unit          |
| Crypto      |   $250 M | Three coins with wild swings                                                            |
| Startups    |     $1 B | A pitch at a time: invest the ask; after a few minutes it fails or returns 1× to 100×   |
| Art         |    $10 B | Pieces at auction; value creeps up with noise; selling at auction lands at 80% to 130%  |
| Energy      |   $100 B | Solar and wind parks: dear, steady income                                               |

The fictional companies: New Moon Telecom (NMTC), Iron Blue Mining (IRNB), Golden
Cocoa (GLDC), Nimbus Cloud (NMBS), Skylark Airlines (SKYL), Petro Atlantic (PATL). Coins:
Pennycoin (PNY), Hashbrown (HSH), Stardust (SDT). No real brand appears in the game.

## The morning paper

- Once the Market is open, a new edition arrives every 4 minutes of play (a badge on the Gazette). It carries one event
  drawn from a seeded list: a headline, an engraving, two short columns and its effect on the
  market (for example: a tanker stuck in the strait, oil +18%, airlines −12%).
- The player answers with one of three choices, cut out like coupons: a bold bet (10% of cash,
  win ×1.4 or lose to ×0.75), a careful move (5% of cash, ×1.08 or ×0.95) or holding steady.
  The result is written into the ledger.
- The paper's second page is the **classifieds** (managers).

## Away from the game

- When the player comes back after more than a minute, an adding machine prints a receipt:
  each business with a manager, rents, bond interest and park income, for the time away (at most
  12 hours), at the offline rate: 10%, plus 15 points with the _Night manager_ partner, plus
  _Night owl_ managers for their business. Market prices move on meanwhile.
- **Collect** adds it. (Doubling it with a rewarded ad comes later, on iPhone.)

## Achievements

Rubber stamps and wax seals on their own page, kept across volumes: first business, every
business, levels, managers, first million, billion and trillion, stamps and combos, the first
share, _Sold at the top_, _Nerves of steel_ (hold during a crash), _Collector_ (one asset of
every class), _Unicorn_ (a startup at 100×), properties, volumes closed, goodwill. A few are
secret until earned. A new one arrives with a stamp on the screen.

## Closing the volume (the reset)

- **Goodwill** is earned from the money made in all volumes (business income, stamps, rents,
  interest, dividends and trading profits):
  `total = floor(150 × sqrt(lifetime earnings / 10^15))`; closing a volume claims
  `total − claimed so far`.
- Each goodwill point held adds **2%** to all business profit.
- Closing the volume resets cash, businesses, managers, upgrades and investments; it keeps
  goodwill, partners, achievements, the shelf and the settings. Volumes are numbered in order:
  Vol. I, II, III…
- A pencilled note in the ledger suggests closing when the claim would at least double the
  goodwill held (and is at least 25), which a steady player reaches in about 20 hours of play.
- **The ceremony:** the book closes, a wax seal drops on it and it goes to the **shelf**, where
  every past volume shows its number, its peak net worth and the goodwill it earned.
- **Partners** are bought with goodwill (spent goodwill no longer adds its 2%):

| Partner       | Goodwill | Effect                                      |
| :------------ | -------: | :------------------------------------------ |
| Night manager |       10 | Offline earnings +15 points                 |
| Stamp maker   |       15 | Stamps ×3                                   |
| Head start    |       25 | Every volume starts with $10,000            |
| Old friends   |       50 | Managers half price                         |
| Bond desk     |       60 | Bonds earn twice as much                    |
| Insider       |       75 | The paper hints which way each choice leans |
| Fast tills    |      150 | Every cycle 1.5× faster                     |
| Estate agent  |      200 | Rents ×2                                    |

## Saving

The game saves on the device every few seconds, when it goes to the background and on every
purchase. One save, versioned; a newer version migrates older saves. Settings can erase it after
a confirmation.

## Later (not in the first release)

The dynasty (retiring to an heir, eras), special editions (two-week themed notebooks), royalties,
sports clubs, satellites and the IPO, the stock rules on post-it notes, Game Center achievements
and leaderboards, cloud saves, rewarded and interstitial ads, in-app purchases (cosmetic covers,
time savers; never pay-to-win), haptics on every stamp, local notifications, a big-number type
past 10^308, the balance simulator with calibration bands.
