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
- **The cash strip:** once a page scrolls past its top, a thin strip pinned at the top of the page
  keeps the cash and the income per second in sight, so the player always knows what there is to
  spend.
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

| Loop  | Length          | What the player does                                             |
| :---- | :-------------- | :--------------------------------------------------------------- |
| Micro | seconds         | Stamp invoices, collect tills                                    |
| Meso  | minutes         | Buy levels and upgrades, hire managers, invest, answer the paper |
| Macro | days            | Close the volume, earn goodwill, spend it on partners            |
| Meta  | weeks           | The shelf of volumes, the covers, the achievements               |
| Era   | weeks to months | Retire to an heir: a new era of the notebook, legacy points      |

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
- **The golden invoice:** after every 5 to 10 minutes of play (drawn from the volume's seed; the
  wait starts again after an absence), a golden invoice shows on the front desk and on the ledger
  page at once, for 30 seconds; on any other screen it is missed. A tap on either takes it and
  pays one minute of business income at the current rate (every multiplier included). Where a
  sponsor is offered (see Sponsors), the tap offers it: watching pays fifteen minutes instead, and
  the invoice waits while the ad plays. After the day's sponsored invoices it still comes and pays
  its one minute.

## Businesses

Ten businesses, opened in order. Each has a level (the number of units owned); buying a level
costs `baseCost × growth^level`. A cycle pays `baseRevenue × level × multipliers`.

| #   | Business (EN / PT)                                   | Base cost | Growth | Revenue per cycle |  Cycle |
| :-- | :--------------------------------------------------- | --------: | -----: | ----------------: | -----: |
| 1   | Corner Café / Café da Esquina                        |         4 |   1.07 |                 1 |    1 s |
| 2   | Golden Wheat Bakery / Padaria Trigo Bom              |        60 |   1.15 |                60 |    3 s |
| 3   | Bubbles Laundromat / Lavanderia Bolhas               |       720 |   1.14 |               540 |    6 s |
| 4   | Fresh Ink Print Shop / Gráfica Tinta Fresca          |     8,640 |   1.13 |             4,320 |   12 s |
| 5   | Yellow Cab Co. / Táxis Amarelos                      |   103,680 |   1.12 |            51,840 |   24 s |
| 6   | Seaside Hotel / Hotel Beira-Mar                      |   1.244 M |   1.11 |           622,080 |   96 s |
| 7   | Anchor Insurance / Seguradora Âncora                 |   14.93 M |   1.10 |           7.465 M |  384 s |
| 8   | High Tide Shipyard / Estaleiro Maré Alta             |   179.2 M |   1.09 |           89.58 M | 1536 s |
| 9   | Transcontinental Railway / Ferrovia Transcontinental |   2.150 B |   1.08 |           1.075 B | 6144 s |
| 10  | Albatross Airways / Companhia Aérea Albatroz         |   25.80 B |   1.07 |           29.67 B |   10 h |

- **Till:** without a manager, a finished cycle waits in the till until the player taps
  **Collect**; collecting starts the next cycle. With a manager, cycles run on their own.
- **Milestones:** at levels 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 and 1000 the
  business's cycle time halves (a cycle never gets shorter than 0.1 s; past that, profit doubles
  instead).
- **Buying:** ×1, ×10, ×100 or Max, chosen once for the whole ledger. Opening a business always
  buys its first level, whatever the mode.
- Each business has its page: its sketch, its level and next milestone, its upgrades and its
  manager.

## Managers

- Hired from the **classifieds** page of the newspaper: one candidate per business the player
  owns and has no manager for. A candidate has a name, a pencil portrait made from parts, a short
  CV line, a trait and a price (`baseCost × 250`, the café's at $1,000).
- **Traits:** _Perfectionist_ (+10% profit for that business), _Negotiator_ (levels of that
  business 10% cheaper), _Night owl_ (that business earns offline at +15 points).
- A manager collects every cycle by itself, while playing and while away.
- A dot on the ledger's Classifieds card says a candidate can be hired with the cash at hand;
  candidates the player cannot pay for yet are listed without it.
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

| Class       | Opens at | Rule                                                                                                   |
| :---------- | -------: | :----------------------------------------------------------------------------------------------------- |
| Businesses  |       $0 | As above                                                                                               |
| Stocks      |   $100 K | Six companies with their own drift and volatility; buy and sell shares; small dividends                |
| Bonds       |     $1 M | Lend up to three hours of business income (without the sponsorship); 1% an hour, withdrawable any time |
| Real estate |    $10 M | Eight properties on the city map; each pays rent per second and can be sold at 90%                     |
| Commodities |    $50 M | Gold (calm), oil (moves with the news) and coffee; bought and sold by the unit                         |
| Crypto      |   $250 M | Three coins with wild swings                                                                           |
| Startups    |     $1 B | A pitch at a time: invest the ask; after a few minutes it fails or returns 1× to 100×                  |
| Art         |    $10 B | Pieces at auction; value creeps up with noise; selling at auction lands at 80% to 130%                 |
| Energy      |   $100 B | Solar and wind parks: dear, steady income                                                              |
| Clubs       |     $1 T | Six sports clubs; each plays a match every 10 minutes of play: prize money and a value that moves      |

The fictional companies: New Moon Telecom (NMTC), Iron Blue Mining (IRNB), Golden
Cocoa (GLDC), Nimbus Cloud (NMBS), Skylark Airlines (SKYL), Petro Atlantic (PATL). Coins:
Pennycoin (PNY), Hashbrown (HSH), Stardust (SDT). No real brand appears in the game.

**Sports clubs** (football). Six fictional clubs, each with a price (the first $1 trillion, each
next four times dearer) and a strength `s` between 0 and 1 that the volume's seed draws, shown as
one to five stars:

| Club (EN / PT)                                    |    Price |
| :------------------------------------------------ | -------: |
| Millbrook Athletic / Atlético Moinho              |     $1 T |
| Harbour Rovers / Andarilhos do Porto              |     $4 T |
| Northgate United / União Portão Norte             |    $16 T |
| Redfield City / Cidade de Campo Rubro             |    $64 T |
| Ironbridge Wanderers / Errantes da Ponte de Ferro |   $256 T |
| Royal Alder / Real Amieiro                        | $1.02 Qa |

- **Match days:** every 10 minutes of play each owned club plays (seeded): a win with
  probability `0.30 + 0.30·s`, a draw with 0.25, a loss otherwise. Matches are played only in
  play, like the paper's editions; after an absence the match-day clock starts again.
- **Prize:** a win pays 0.85 × the club's **price** (not its value), a draw a third of that, a
  loss nothing; an average club earns about 0.45 × its price a match day, half what a park of
  that price earns. Prizes are not business profit: the sponsorship, the Gold Edition, goodwill
  and legacy do not multiply them. They count in lifetime earnings.
- **Value:** a win lifts the club's value 4%, a loss takes 3% off; the value stays between half
  and four times the price. It moves only while the club is owned and stays where it is when
  sold. A club is bought at its current value (the price until it has played) and sold at 90% of
  it. Clubs count in net worth at their value.
- The last five results show as a row of W, D and L. _Collector_ still asks for one asset of each
  of the nine other classes; clubs are not required. An achievement, _Chairman_, for the first
  club.

**Post-its.** Each investment's page carries a yellow post-it with its rule in a sentence or
two (the Market's for stocks, commodities and crypto; the class pages for the rest). A tap on
its corner folds it away; Settings can bring them all back.

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
- **Collect** adds it; **Collect ×2** with a sponsor (the audit, see Sponsors).

**Notes from the night shift** (iPhone): local notifications, nothing from a server. The game
asks for permission at a hire ("The night shift can leave you a note when there is something to
collect"): the first hire, or, for a player who already has managers and was never asked, the
first launch with a manager. Settings has a switch; when iOS permission was declined, the switch
says to allow notes in the iPhone's Settings. When the game goes to the background it schedules
the notes; when it comes back it removes them, pending and delivered:

- **The receipt is full:** 12 hours after leaving, when an absence stops counting (only when
  something earns while away: a manager, rents, bonds or parks).
- **The sponsorship ends:** when the banked sponsorship runs out, if that is at least ten minutes
  away.
- **Tills full:** when every open business without a manager has a till waiting, if that is at
  least five minutes away.

Notes are taken in order of their time. One due in the quiet hours (22:00 to 8:00, device time)
moves to 8:00; one due less than an hour after the note before it moves to an hour after it, and
then the quiet-hours rule applies again.

## Achievements

Rubber stamps and wax seals on their own page, kept across volumes and eras: first business, every
business, levels, managers, first million, billion and trillion, stamps and combos, the first
share, _Sold at the top_, _Nerves of steel_ (hold during a crash), _Collector_ (one asset of
every class), _Unicorn_ (a startup at 100×), properties, volumes closed, goodwill. A few are
secret until earned. _Chairman_ (the first club) and _Heir_ (the first retirement) join them. A new one arrives with a stamp on the screen.

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
  goodwill held (and is at least 25), which the simulated player of Balance reaches in about 13 hours and a person in about a day of play.
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

## The dynasty (retiring to an heir)

Beyond closing volumes there is a slower loop: the founder retires and an heir takes the book on,
in a new **era** of the notebook.

- **When:** Retire is offered on the Partners page once the goodwill claimed in this era,
  counting what closing now would claim, reaches 1,000 (the closing sponsor's bonus is not
  claimed goodwill): about six or seven closings. A pencilled note on the shelf says how close
  the founder is.
- **Retiring** first closes the current volume, as Close the volume does (an uncollected absence
  receipt is collected first); its claim counts. The closing sponsor is not offered at Retire,
  since goodwill held starts again.
- **Legacy:** retiring earns `floor(sqrt(goodwill claimed in the era))` legacy points (31 at
  1,000, 44 at 2,000), never spent. Legacy is a factor of its own on all business profit,
  ×(1 + 0.2 × legacy), multiplying with goodwill, the Gold Edition and the sponsorship.
- **What the heir keeps:** legacy, the partners, achievements, the shelf (each entry with its
  era), the Gold Edition, the settings, and the sponsors' timers and daily counts. **What starts
  again:** goodwill held and goodwill claimed, lifetime earnings, and the volume (Vol. I of the
  new era).
- **The pace:** the heir starts below the founder's last pace (×7.2 from 31 legacy points,
  against the founder's goodwill) and is meant to pass it within a few closings; each era goes
  faster than the one before.
- **Eras:** the founder's era is the cream ledger. The heirs' eras change the paper and ink of
  every page: II, the 1950s (green ledger paper, blue-black ink); III, the 1980s (continuous
  printer paper with grey bars); IV, the 2010s (graph paper, ballpoint blue). Era V looks like
  era I, VI like II, and so on; only the numeral changes. The covers still follow net worth
  (notepad, spiral notebook, leather ledger). From era II the ledger's header reads
  "Era II · Helena Costa · Vol. I".
- **The family:** the surname is drawn once from the game's start and kept; each era's head has a
  first name from the era's seed.
- **The ceremony:** the founder's pen is laid on the closed book, the shelf adds a row for the new
  era and the new era's first page opens.
- An achievement, _Heir_, for the first retirement. The backup code carries the era and legacy,
  and its preview shows the era.

## Sponsors (rewarded ads)

The game has no ad the player did not ask for: no interstitials, no banners. A **sponsor** is a
clipping taped onto the page, stamped SPONSORED, that offers a reward for watching a short ad.
The player taps it, watches, and gets the reward; an ad that is closed early or fails to load
gives nothing and costs nothing. Rewards scale with the game (minutes of income or multipliers),
so they matter as much in volume IX as in volume I. Daily limits reset at the device's midnight
(changing the device's clock resets them too; that is accepted).

| Offer           | Where                | Reward                                       | Limit           |
| :-------------- | :------------------- | :------------------------------------------- | :-------------- |
| Overtime        | Front desk           | Stamps ×3 for 3 minutes                      | 6 a day         |
| Golden invoice  | Desk and ledger page | 15 minutes of business income instead of one | 10 a day        |
| Audit           | The absence receipt  | The receipt pays twice                       | One per receipt |
| Sponsorship     | Ledger page          | Business profit ×2 for 4 hours               | 3 a day         |
| Headhunter      | Classifieds          | New candidates; one is a star                | 3 a day         |
| Closing sponsor | Closing the volume   | +10% goodwill on that closing                | The closing     |

- **Overtime** counts clock time: it runs on in the background and while away. Taken again while
  it runs, it adds 3 more minutes. It multiplies on top of the Stamp maker and the desk upgrades.
- **The sponsorship** doubles business profit, so also the stamps and the golden invoice (both
  follow business income); not rents, bonds or parks. Its time runs on the clock, in play and
  away, and banks: taken again, it adds 4 hours to what is left. An absence's receipt doubles the
  business lines for the part of the absence it covered, counted from when the player left.
- **The audit** doubles the whole receipt, sponsored lines included (they pay ×4). A receipt that
  merged with an earlier uncollected one is still one receipt.
- **The headhunter** shows when at least one open business has no manager. The new candidates
  replace the old ones until the next headhunter or the end of the volume; the star is drawn from
  the volume's seed and the headhunter's count. A star's trait counts twice: _Perfectionist_ +20%
  profit, _Negotiator_ levels 20% cheaper, _Night owl_ +30 points offline. A star costs what any
  candidate costs and stays a star once hired.
- **The closing sponsor** is offered after the player confirms the closing and before the seal;
  the ad closed early closes the volume without it. The bonus is 10% of the claim, rounded up, and
  is added to the goodwill held but not to the goodwill claimed, so later claims stay the same.
  The shelf shows it.
- Overtime and the sponsorship survive closing a volume.
- Sponsors exist on iPhone. The website shows none until its ad network is approved; there the
  golden invoice still pays its one minute.
- Before the first ad the iPhone app asks for the consent that the law and Apple require (the
  Google consent form where it applies, then Apple's tracking prompt); declining still shows ads,
  not personalised.

## The Gold Edition (the purchase)

One purchase, once, on iPhone: the **Gold Edition** of the ledger.

- **×3 business profit, for good:** it survives every closing, like goodwill. Business profit
  includes the stamps, the golden invoice and the receipt's business lines; not rents, bonds or
  parks.
- **Sponsors without ads:** every sponsor offer is granted with a tap, no ad. The daily limits
  stay, so with the three daily sponsorships a Gold player runs at ×6 for twelve hours a day and
  ×3 the rest: that is the intended ceiling.
- A gold ribbon bookmark on the ledger's header.
- **Restore purchases** in Settings brings it back on a new device or after reinstalling.
- The flag is kept in the save. At launch the store confirms it; it is removed only when the store
  answers that the purchase is not owned (a refund), never when the store cannot be reached.
  Erasing the game or restoring a backup keeps this device's Gold Edition.

Why ×3: it is what one ledger upgrade gives (there are six, each 1,000 times dearer than the
last), so every volume goes faster while goodwill, the partners and the upgrades still matter. A
larger factor would make the purchase the game's main lever.

## Saving

The game saves on the device every few seconds, when it goes to the background and on every
purchase. One save, versioned; a newer version migrates older saves. Settings can erase it after
a confirmation.

**Backup:** Settings can copy a **backup code**, one line of text that holds the game, to paste on
another device, iPhone or website alike (Settings, Restore from a code, into a text field). It
holds everything in the save (the daily counts, the running sponsorship and the language setting
included) except the price and net-worth histories (they start again from the restored prices)
and the Gold Edition, which belongs to the device (Restore purchases brings it back). The code is scrambled and signed: a code changed by
hand, or cut short, is refused. The signature stops casual edits, not a determined player with
the app's code. Before restoring, the game shows what the code holds (volume, net worth, the date
it was made) and asks to confirm, since it replaces the game on this device. The restored game
goes on from the moment it is restored: the time since the code was made earns nothing there,
since it earned on the other device.

## Later (not in the first release)

Special editions (two-week themed notebooks), royalties, satellites and the IPO, Game Center
achievements and leaderboards, cloud saves, ads on the website (once its ad network is
approved), more purchases (cosmetic covers), a big-number type past 10^308.

## Balance

A simulated player (`pnpm test:calibration`) plays a new game (era I, Vol. I, no goodwill,
partners, legacy or Gold Edition) on its own, so a change that breaks the pace fails a test. It
plays without breaks, collects every till each second, stamps once a second, hires a manager once
it costs less than a minute of income, and buys whatever affordable level or upgrade pays back
soonest (desk upgrades once they cost less than a minute of income); it leaves investments, the
paper and sponsors alone. It plays better than most people, so a person reaches each mark later.

| Mark                      | Band          | Measured when the bands were set |
| :------------------------ | :------------ | :------------------------------- |
| $1 million net worth      | 5 to 25 min   | 15 min                           |
| $1 billion net worth      | 30 min to 4 h | 2 h 48 min                       |
| Closing suggested (first) | 10 to 30 h    | 13 h                             |

Stamps stay under half of all earnings at four taps a second, over the first 30 hours (43% when
the bands were set).
