# Il cinese semplificato su OriginsMeta

Ottava lingua del sito dal 04/11/2026 (richiesta di Pierluigi: "traduciamo il sito in cinese semplificato?"). Indirizzo
`/zh-cn`, `hreflang="zh-Hans"`, `<html lang="zh-Hans">`, `og:locale` zh_CN, chiave `"zh-cn"` (fra virgolette, ha il
trattino) accanto a `ru` in tutto il codice. Chi ha il browser in cinese, semplificato o tradizionale (`zh*`), arriva qui.

Scelte di Pierluigi del 04/11/2026:

- **Prima il nucleo, news dopo**: interfaccia, carte, luoghi, FAQ, guide e le news dal 20/10/2026 in poi. Le news più
  vecchie non sono tradotte: restano fuori da liste, feed e sitemap di /zh-cn e la loro pagina rimanda all'inglese
  (`untranslated` e `newsInLocale` in `src/lib/data/news.ts`). Una news nuova si scrive anche in cinese.
- **Testi delle carte PROVVISORI**: Pierluigi non sapeva se il gioco avesse il cinese, ma le note della patch 0.7 del
  29/09/2026 e la pagina Steam lo elencano fra le 13 lingue del gioco (public/llms.txt). Si parte quindi con una
  traduzione nostra col glossario qui sotto, come il russo il pomeriggio del 20/10/2026; il passo dopo è leggere i testi
  ufficiali delle 122 carte nella demo in «简体中文» (trascrizione in `docs/testi-ufficiali/zh-cn.tsv`,
  `node scripts/official-texts.mjs zh-cn --apply`, `"zh-cn"` in `officialTextLocales`) e allineare il glossario a quello
  del gioco.

## Varietà e tono

- Cinese semplificato standard della Cina continentale, registro dei siti di giochi: si dà del **你** (mai 您, tranne
  nelle pagine legali: privacy, termini, cookie, dove si usa 您).
- Gergo dei giocatori cinesi di card game digitali (Hearthstone, Marvel Snap, Legends of Runeterra in cinese): 卡组,
  环境 (meta), 强度榜 (tier list), 调度 (mulligan), 流派 (archetipo), 上分 solo nel gergo.
- Nomi di carte, luoghi, mazzi, eventi, prodotti, creator e del sito **in inglese**, senza virgolette: Merlin, Queen of
  Hearts, Crimson Cup, Steam Next Fest, Demo 2.0, MetaShifting, Conquest, OriginsMeta Tracker, Analytics, Theory Craft.
  Le etichette di allineamento del sito restano Good / Evil / Neutral; nel testo delle carte si scrive 善良 / 邪恶.
- **Spazio fra cinese e lettere o cifre latine** («使用 Merlin 的卡组», «3 点伤害», «Origins TCG 强度榜»), nessuno
  prima o dopo la punteggiatura cinese.
- Punteggiatura cinese a larghezza piena: ，。：；！？、（）; virgolette “…” (dentro: ‘…’), titoli di opere 《…》,
  trattino ——, puntini ……. Numeri, URL, codici e nomi inglesi restano con i caratteri latini.
- Date «2026年11月4日», «11月4日»; giorni «周三» o «星期三»; ore «16:30»; numeri «10,000» o «1万» nei testi discorsivi;
  decimali col punto «3.5»; percentuali «98%».
- La dicitura di non affiliazione: «非官方粉丝网站，与 Koin Games 无关联»: non si toglie mai.

## Glossario di gioco (nostro, finché il gioco non ha il cinese)

Le carte parlano in terza persona («造成 3 点伤害», «给予……», «召唤……»), i personaggi in prima persona
(«我获得……», «我移动到……»); l'imperativo solo per pescare, scartare e scegliere («抽一张牌», «弃一张牌», «选择……»).

| Inglese | Cinese |
| --- | --- |
| On Reveal | 揭示时 |
| On Death | 死亡时 |
| On Kill | 击杀时 |
| Ongoing | 持续 |
| Shield | 护盾 («给予任意角色护盾») |
| Trample | 践踏 |
| Deathtouch | 死触 |
| Defender | 守卫 |
| Rebirth | 重生 |
| First Strike | 先攻 |
| Double Attack | 连击 |
| Snipe N | 狙击 N |
| Move (parola chiave e verbo) | 移动 |
| Stun | 眩晕 |
| ANY / ALL | 任意 / 所有 (in grassetto dove l'inglese è maiuscolo) |
| deal N damage | 造成 N 点伤害 |
| heal N damage | 治疗 N 点伤害 |
| draw a card | 抽一张牌 / 抽 2 张牌 |
| discard | 弃一张牌, «当我被弃掉时» |
| summon | 召唤……到一个随机格位 |
| return to hand | 将……移回其拥有者的手牌 |
| destroy | 消灭 |
| ally / enemy / opponent | 友方 / 敌方 / 对手 |
| slot / location | 格位 / 地点 |
| barrier | 屏障 |
| spell / character | 法术 / 角色 |
| Legendary (la carta Leggendaria) | 传说卡 |
| Power / Health | 力量 / 生命值 |
| cost | 费用 («费用最低», «偶数费用») |
| mana | 法力 («+1 法力») |
| round / game | 回合 / 对局 |
| before / after combat | 战斗前 / 战斗后 |
| at the start of the round | 回合开始时 |
| graveyard | 墓地 |
| permanently | 永久 |
| Choose one: … OR … | 选择一项：……或…… |
| deck / decklist | 卡组 / 卡表 |
| deck code | 卡组代码 |
| tier list | 强度榜 |
| meta | 环境 |
| mulligan | 调度 |
| archetype (Aggro, Control, Combo, Tempo, Swarm, Big…) | 流派; i nomi dei flussi restano in inglese |
| win rate / play rate | 胜率 / 使用率 |
| patch / balance patch | 补丁 / 平衡补丁 |
| boss / mission | 首领 / 任务 |
| demo | 试玩版 (Demo 2.0 resta così) |
| wishlist (Steam) | 愿望单 |
| tournament / bracket / playoffs | 锦标赛 / 对阵表 / 季后赛 |

Nelle guide per chi inizia la prima citazione di ogni parola chiave porta l'inglese fra parentesi: «揭示时（On Reveal）».

## Nomi dell'interfaccia

Menu: 新闻 · 强度榜 · 数据库 · 攻略 · 卡牌 · 地点 · 常见问题 · Analytics · Tracker · 卡组 · 单个卡组 · 锦标赛卡组 ·
卡组构筑器 · 轮抽 (Draft) · 赛事与活动 · 市场 · 漫画 · 关于我们 · 作者. Ruoli (tag): Staff, Creator, 作者, Pro, Community;
chi ha pubblicato: «发布者»; filtro «角色». Account: «我的资料», «你的公开主页», «编辑我的公开主页», «我的卡组»;
«登录» / «退出登录»; donazione «支持我们».

## SEO

- Le regole di lunghezza restano quelle delle altre lingue, contate in caratteri (gli stessi test): `metaTitle` con
  «Origins TCG» entro 60, `description` ed excerpt 120–158, H1 delle news entro 110. In cinese un titolo corto è meglio:
  non va allungato per riempire.
- Ancore `{#…}` in pinyin senza toni, parole separate dal trattino: «简而言之» → `{#jian-er-yan-zhi}`, «有什么变化» →
  `{#you-shen-me-bian-hua}`. Gli URL restano quelli inglesi (slug uguali in tutte le lingue); i link interni hanno il
  prefisso `/zh-cn/`.
- Font: le pagine cinesi tengono Unbounded, Manrope e JetBrains Mono per lettere e cifre e prendono gli ideogrammi da
  Noto Sans SC (`--font-cjk`) e, per i post-it a penna, da Long Cang (`--font-cjk-hand`): istanze senza preload in
  `src/app/[locale]/layout.tsx`, dichiarate dopo i font latini in `globals.css`.

## Dove stanno i testi

Interfaccia `src/lib/dictionaries/zh-cn.ts`; news `src/lib/data/news-zh-cn.ts` (solo quelle tradotte); guide
`src/lib/content/guides-zh-cn.ts`; carte `src/lib/data/card-lore-zh-cn.ts`; chiave `"zh-cn"` accanto a `ru` in tutto il
resto (storico, luoghi, FAQ, etichette). Database: blocco `-- ===== 04/11/2026: CINESE SEMPLIFICATO =====` di
`schema.sql`; finché non è applicato, `"zh-cn"` sta in `DB_PENDING_LOCALES` (`src/lib/community/translate.ts`).
