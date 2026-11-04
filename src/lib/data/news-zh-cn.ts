import type { NewsCopy } from "./news-fr";

/**
 * Testi in cinese semplificato delle news (04/11/2026, ottava lingua del sito), una voce per slug con gli stessi campi
 * della versione inglese di news.ts. A differenza delle altre lingue qui possono mancare news: Pierluigi ha scelto
 * "prima il nucleo, news dopo", quindi si parte dalle news dal 20/10/2026 e una news assente resta fuori da /zh-cn
 * (`untranslated` in news.ts). Regole e glossario in docs/cinese.md.
 *
 * Tradotte dall'inglese il 04/11/2026: le otto news dal 20/10/2026 in poi, più le patch notes del 4/11
 * (balance-patch-1104-cyber-queen) e la correzione Cyber Queen / Dr. Frank Leggendaria nelle due news del 2 e 4/11.
 * Ancore in pinyin senza toni; i link alle news
 * più vecchie, che in cinese non ci sono, vanno all'inglese (`/en/news/…`, ammesso da `linkProblem` in newsMeta.ts).
 * Nell'intervista a SouL le etichette "**Davdas:**" e "**SouL:**" tengono i due punti latini: `markSpeakers` di
 * Markdown.tsx colora solo quelle.
 */
export const zhCnText: Record<string, NewsCopy> = {
  "balance-patch-1104-cyber-queen": {
    title: "Origins TCG 11月4日补丁说明：十张卡牌平衡调整，Cyber Queen 成为第 11 位首领",
    metaTitle: "Origins TCG 11月4日补丁：Obliterate 10 费，三熊涨价",
    description:
      "Origins TCG 11月4日补丁说明：Obliterate 涨到 10 法力，三只熊的费用各增加 1，Dorothy 变为 3/3，Genie 和 Searing Light 变便宜。第 11 位首领 Cyber Queen 同时登场，带来以 Dr. Frank 为传说卡的 Relentless 卡组。",
    summary:
      "Origins TCG 抢先体验的第一个平衡补丁于今天 11月4日 UTC 时间 14:00 左右（北京时间 22:00）上线，无需更新客户端。十张卡牌有改动：Obliterate 涨到 10 法力，Baby Bear、Mama Bear 和 Papa Bear 的费用各增加 1，Dorothy 变为 3/3，Genie 和 Searing Light 费用降低。同时到来的还有第 11 位首领 Cyber Queen，她使用 Relentless 卡组，传说卡是 Dr. Frank。",
    highlights: [
      { label: "今天 UTC 14:00 左右上线", text: "无需更新客户端", anchor: "he-shi-shang-xian" },
      { label: "第 11 位首领：Cyber Queen", text: "使用 Relentless 卡组，传说卡是 Dr. Frank", anchor: "cyber-queen" },
      { label: "十张卡牌有改动", text: "五个削弱、五个增强，只改费用和数值", anchor: "suo-you-gai-dong" },
      { label: "三只熊的费用各加 1", text: "Baby Bear 是 Crimson Cup 中使用率最高的卡", anchor: "san-zhi-xiong" },
      { label: "Obliterate 涨到 10 法力", anchor: "obliterate" },
      { label: "Dorothy 变为 3/3", text: "仍然是 4 法力", anchor: "dorothy" },
    ],
    body: `## 何时上线 {#he-shi-shang-xian}

Koin Games 于 11月4日 UTC 时间 09:08（北京时间 17:08）在官方 Discord 上发布了补丁说明：更新“应该会在”大约五小时后上线，也就是 UTC 时间 14:00 左右（北京时间 22:00），而且无需更新客户端。这是抢先体验的第一个平衡补丁，也就是 Koin 承诺在 Dr. Frank 到来当天推出的那个（[我们 11月2日的新闻](/zh-cn/news/balance-patch-dr-frank-roadmap-ama)）。

OriginsMeta 上的卡牌和卡组构筑器已经显示新的数值。

## 第 11 位首领：Cyber Queen 和 Relentless 卡组 {#cyber-queen}

新首领是 Cyber Queen，她使用 Relentless 卡组。这副卡组的传说卡是 Dr. Frank，玩法围绕从墓地带回角色展开：一个全新的流派，还有几张新卡可以尝试。我们在 [Dr. Frank 的八张新卡](/zh-cn/news/dr-frank-boss-new-cards)中逐一介绍过它们。

更正：直到今天，我们一直把 Dr. Frank 称为新首领。补丁说明明确指出，首领是 Cyber Queen，Dr. Frank 是她卡组中的传说卡。

## 所有平衡改动 {#suo-you-gai-dong}

格式：角色为“法力 · 力量/生命值”，法术只列法力。

| 卡牌 | 改动前 | 改动后 | 改了什么 |
| --- | --- | --- | --- |
| Baby Bear | 2 · 1/1 | 3 · 1/1 | 费用增加 1 |
| Mama Bear | 6 · 6/6 | 7 · 6/6 | 费用增加 1 |
| Papa Bear | 4 · 4/4 | 5 · 4/4 | 费用增加 1 |
| Obliterate | 9 | 10 | 费用增加 1 |
| Guy of Gisborne | 6 · 4/4 | 6 · 3/4 | 力量 -1 |
| Dorothy | 4 · 1/1 | 4 · 3/3 | 力量 +2，生命值 +2 |
| Banshee | 2 · 1/1 | 2 · 2/1 | 力量 +1 |
| Esmeralda | 2 · 2/2 | 2 · 2/3 | 生命值 +1 |
| Genie | 6 · 4/4 | 5 · 4/4 | 费用减少 1 |
| Searing Light | 4 | 3 | 费用减少 1 |

五个削弱，五个增强。没有任何卡牌改动文本或能力：只改费用和数值。团队表示，这些改动来自围绕这些卡牌的“大量热烈讨论”。

## 三只熊全部涨价 {#san-zhi-xiong}

Baby Bear、Mama Bear 和 Papa Bear 的费用各增加 1 法力。三者都会惩罚伤害你在其所在地点屏障的敌人：Baby Bear 对它造成 1 点伤害，Papa Bear 造成 3 点，Mama Bear 则消灭它。

Baby Bear 是 Crimson Cup 全部四场资格赛中使用率最高的卡：在 Koin 的官方统计表中，46% 到 50% 的卡组都带了它。涨到 3 法力后，它不再是几乎必带的选择。

## Obliterate 涨到 10 法力 {#obliterate}

Obliterate 是游戏中最贵的法术，现在需要 10 法力。在 Crimson Cup 资格赛中，21% 到 24% 的卡组使用了它。团队开玩笑说，X 上那条要求削弱它的帖子收获了那么多点赞，他们差点把它的伤害改成 -12，可惜游戏引擎处理不了负数伤害。

## Dorothy 变为 3/3 {#dorothy}

传说卡 Dorothy 仍然是 4 法力，但从 1/1 变为 3/3：她不会再被 1 点伤害打死。Banshee 获得 +1 力量，Esmeralda 获得 +1 生命值，Genie（5）和 Searing Light（3）的费用各减少 1。Guy of Gisborne 是唯一一张费用不变却丢了数值的卡：从 4/4 变为 3/4。

## 接下来 {#jie-xia-lai}

如果你的卡组里有 Obliterate、三只熊或 Guy of Gisborne，检查一下你的法力曲线：[MetaShifting](/zh-cn/metashifting) 会逐个补丁显示每一项改动，在 [Theory craft](/zh-cn/theory-craft) 中你可以马上按新费用重组卡表。Koin 希望大家打几局之后反馈意见：改过头了、改得不够，还是像金发姑娘说的那样，刚刚好。`,
  },
  "dr-frank-boss-new-cards": {
    title: "Dr. Frank 将于 11月4日登陆 Origins TCG：新首领的传说卡和八张新卡",
    metaTitle: "Origins TCG 的 Dr. Frank：传说卡和 8 张新卡一览",
    description:
      "Dr. Frank 是首领 Cyber Queen 的 Relentless 卡组中的传说卡，将于 11月4日（周三）登陆 Origins TCG，同时到来的还有一个平衡补丁和八张新卡。我们逐一介绍这八张卡牌的费用、数值和效果，整理创作者们的第一印象，并告诉你如何提前用它们组建卡组。",
    summary:
      "Dr. Frank 是 Origins TCG 新首领 Cyber Queen 卡组中的传说卡，将于 2026年11月4日（周三）登场，比原计划提前了一周，因为玩家们在 Steam 上达到了 500 条评测。他带来了八张新卡，Koin Games 让旗下的创作者们公开了这些卡牌：Dr. Frank 本身是一张传说卡，八张中有六张属于 Evil 阵营。同一天还会推出一个平衡补丁。",
    highlights: [
      { label: "11月4日（周三）", text: "Dr. Frank 带着新卡到来，出现在首领 Cyber Queen 的卡组中", anchor: "dao-lai" },
      { label: "提前一周", text: "玩家们达到了 Koin 要求的 500 条 Steam 评测", anchor: "ti-qian-yi-zhou" },
      { label: "八张新卡", text: "一张传说卡、一张法术和六个角色，其中六张是 Evil", anchor: "ba-zhang-xin-ka" },
      { label: "墓地回归", text: "Dr. Frank 和 It's Alive 从你的墓地召唤角色", anchor: "mu-di" },
      { label: "新关键词", text: "Red Knight 带来了持续，目前游戏中没有任何卡牌拥有它", anchor: "red-knight" },
      { label: "平衡补丁", text: "Koin 的工作室负责人说它会和 Dr. Frank 一起推出", anchor: "ping-heng" },
      { label: "现在就试试", text: "在我们的 Theory craft 中用这八张卡组建卡组", anchor: "theory-craft" },
    ],
    faq: [
      {
        q: "Dr. Frank 什么时候登陆 Origins TCG？",
        a: "2026年11月4日（周三），比原计划提前一周，因为玩家们在 Steam 上达到了 500 条评测。在我们发布这篇文章时，Koin 还没有公布具体时间。",
      },
      {
        q: "Dr. Frank 的新卡有哪些？",
        a: "共八张：Dr. Frank（传说卡，6 法力，2/2）、It's Alive（法术，3）、Frank's Monster（6，5/4）、Franken Bride（5，4/4）、Morgan le Fay（2，1/3）、Doppelganger（4，2/2）、Necromancer（4，2/2）和 Red Knight（2，4/1）。",
      },
      {
        q: "Dr. Frank 会和平衡补丁一起来吗？",
        a: "会：Koin 的工作室负责人 Mawr 写道，平衡补丁将于 11月4日随 Dr. Frank 一起推出。当时改动内容尚未公布。",
      },
      {
        q: "我现在就能用新卡组建卡组吗？",
        a: "在 OriginsMeta 上可以：在更新上线之前，这八张卡都在 Theory craft 中，这是我们收录了游戏中尚未出现的卡牌的卡组构筑器。",
      },
    ],
    body: `## Dr. Frank 于 11月4日（周三）到来 {#dao-lai}

“下一位首领 Dr. Frank 将于下周来到 Origins，他的卡组里满是新卡。”Koin Games 于 2026年10月31日万圣节在 Steam 上发布了这条消息，帖子标题为“Happy Halloween, Dr. Frank is coming”：日期是 **11月4日（周三）**。在补丁说明发布之前，我们写的是 Dr. Frank 是第 12 个任务的首领，也就是对战游戏 AI 的任务中的下一个：11月4日的补丁说明明确指出，首领是第 11 位首领 Cyber Queen，Dr. Frank 是她的 Relentless 卡组中的传说卡（[补丁说明](/zh-cn/news/balance-patch-1104-cyber-queen#cyber-queen)）。在我们发布这篇文章时，Koin 还没有公布更新的具体时间。

## 多亏了评测，提前一周 {#ti-qian-yi-zhou}

Dr. Frank 原本要晚一周才来。10月29日，Koin 的 apix 在官方 Discord 上向玩家们提出了一个约定：前一天大约有 10,000 人玩过游戏，但只有 200 人在 Steam 上留下了评测；如果到周末能有 500 条评测，第 12 个任务就会在下周推出，“比计划更早”。目标不到两天就达成了。10月31日，Koin 的工作室负责人 Mawr 写道：“你们做到了！500 条评测！首领将提前一周到来。”Steam 上的宣传图也是这么说的：“因为你们达成了目标，Dr. Frank 将整整提前一周上线。”

## 八张新卡 {#ba-zhang-xin-ka}

11月2日，Koin 让旗下创作者提前看到了“全部八张新的 Origins 卡牌”，并提供了用于公开它们的官方图片：就是下面图片中的这些卡。八张中有六张是 Evil。这八张卡原本就已经在我们的数据库中，属于已从游戏中移除的卡牌，费用和数值也都相同。

| 卡牌 | 费用 | 数值 | 类型与关键词 |
|---|---|---|---|
| [Dr. Frank](/zh-cn/cards/dr-frank) | 6 | 2/2 | 传说卡，Evil |
| [It's Alive](/zh-cn/cards/its-alive) | 3 | – | 法术 |
| [Frank's Monster](/zh-cn/cards/franks-monster) | 6 | 5/4 | Evil，重生 |
| [Franken Bride](/zh-cn/cards/franken-bride) | 5 | 4/4 | Evil，重生 |
| [Morgan le Fay](/zh-cn/cards/morgan-le-fay) | 2 | 1/3 | Evil，揭示时 |
| [Doppelganger](/zh-cn/cards/doppelganger) | 4 | 2/2 | Evil |
| [Necromancer](/zh-cn/cards/necromancer) | 4 | 2/2 | Evil，揭示时 |
| [Red Knight](/zh-cn/cards/red-knight) | 2 | 4/1 | 践踏，持续 |

### Dr. Frank 和 It's Alive：墓地回归 {#mu-di}

![Koin Games 官方的 Dr. Frank 和 It's Alive 卡牌：Dr. Frank，传说卡，6 法力，2/2；It's Alive，3 法力的法术](/media/news-dr-frank-graveyard.webp)

Dr. Frank 是一张传说卡：“战斗前，从你的墓地召唤一个随机角色到一个随机格位。”It's Alive 是一张 3 法力的法术，效果相同但只生效一次：“从你的墓地召唤一个随机角色到一个随机格位。”Koin 没有说明 It's Alive 是否就是 Dr. Frank 在对局开始时放入你手牌的那张卡：ZulsoiD 在他的视频里是这样介绍的，Robip 也认为很有可能。

### Frank's Monster 和 Franken Bride：重生 {#chong-sheng}

![Koin Games 官方的 Frank's Monster 和 Franken Bride 卡牌，两者都是 Evil 并拥有重生](/media/news-dr-frank-rebirth.webp)

两张卡都有**重生**，也就是 Mummy 和 Phuong Hoang 的关键词，而且两者在回来时都会触发效果。Frank's Monster，6 法力 5/4：“当我从墓地进场时，我的 ⚔️ 翻倍。”Franken Bride，5 法力 4/4：“当我从墓地进场时，治疗你此处屏障的 4 点伤害。”在创作者们的视频中，Monster 回来时是 10/1，Bride 回来时是 4/1。

### Morgan le Fay、Doppelganger 和 Necromancer：弃牌 {#qi-pai}

![Koin Games 官方的 Morgan le Fay、Doppelganger 和 Necromancer 卡牌：三个适合弃牌卡组的 Evil 角色](/media/news-dr-frank-discard.webp)

三张适合弃牌卡组的卡，也就是围绕 Dracula、Koschei 和 Aladdin 构筑的卡组。

- [Morgan le Fay](/zh-cn/cards/morgan-le-fay)，2 法力 1/3：“揭示时：弃掉你最右边的一张牌。将一张随机法术加入你的手牌，并使其费用减少 2。”
- [Doppelganger](/zh-cn/cards/doppelganger)，4 法力 2/2：“当你弃掉一个角色时，我变成该角色的复制品。”
- [Necromancer](/zh-cn/cards/necromancer)，4 法力 2/2：“揭示时：随机弃一张牌，将 2 个 Zombie [2⚔️/2❤️] 加入你的手牌。如果你弃掉的是一张 Evil 卡牌，改为召唤这些 Zombie。”

### Red Knight 带来了持续 {#red-knight}

![Koin Games 官方的 Red Knight 卡牌：2 法力，4/1，践踏和持续](/media/news-dr-frank-red-knight.webp)

[Red Knight](/zh-cn/cards/red-knight)，2 法力 4/1：“践踏。持续：我对面的角色拥有践踏。”**持续**表示一项只要卡牌在场上就始终生效的能力，而目前游戏中没有任何卡牌拥有它：只要 Red Knight 在场，它对面的角色也拥有践踏。

## 同一天的平衡补丁 {#ping-heng}

“平衡补丁将在明天 Dr. Frank 到来时推出”，Mawr 于 11月3日在 Discord 上写道。改动内容尚未公开：补丁说明一发布我们就会整理出来，[MetaShifting](/zh-cn/metashifting) 也会逐张显示改动。在此之前，OriginsMeta 上的数据仍是 [0.7 补丁](/en/news/patch-0-7)的数据。本周的其他日期，从 11月6日（周五）的路线图 AMA 到排位第 1 赛季的结束，都在[我们 11月2日的文章](/zh-cn/news/balance-patch-dr-frank-roadmap-ama)里。

## 创作者怎么说 {#chuang-zuo-zhe}

ZulsoiD 在他 [11月3日的视频](https://www.youtube.com/watch?v=tU9muG1MZts)中逐一介绍了全部八张卡。以下是他的第一印象，属于个人观点而非数据：

- Dr. Frank 和 It's Alive 能为中速和控制卡组带来价值：用一张 3 法力的法术带回一个费用 4 或以上的角色，本身就已经赚了。以这种方式召唤的角色不会触发揭示时效果，所以 Boogeyman 和 Asanbosam 回来时没有它们的副作用。
- Frank's Monster 是“目前最强的重生卡”：一个能阻挡两次的 5/4。
- 在想要拖慢伤害节奏的卡组里，Franken Bride 可以取代 Bridge Troll 的位置。
- Morgan le Fay 的价值更多在于弃牌而不是法术，虽然 7 费的 Obliterate 或 3 费的 Rain of Arrows 也都很不错。先打出 Ugly Duckling，再打出 Morgan le Fay 弃掉 Aladdin：Aladdin 进场，Ugly Duckling 随之变身。
- Doppelganger 需要费用 4 或以上的角色，尤其是 Dracula 和 Koschei。
- Necromancer 他不太看好：目前的弃牌卡组很少使用 Evil 卡（King Shahryar、Dracula、Koschei），而多花一点法力，Three Musketeers 就能提供类似的场面，还带先攻。
- Red Knight 是适合快攻卡组的卡，每次增益都会让它变强，例如配合 Glinda，但它可能难以对付 Baby Bear、Bagheera 和 Musketeer，这几张卡目前都非常常见。

Robip 也[用意大利语](https://www.youtube.com/watch?v=L5CfgUtIYA4)介绍了这八张卡。

## 现在就在 OriginsMeta 上试试 {#theory-craft}

这八张卡都在[卡牌数据库](/zh-cn/cards)中，打开“不在游戏中”筛选即可看到；在 [Theory craft](/zh-cn/theory-craft) 中你已经可以用它们组建卡组：你发布的卡组会出现在 [Theory craft 卡组](/zh-cn/theory-craft/decks)中。更新进入游戏后，我们会把它们标记为游戏卡牌，并核对它们在所有语言中的文本；用它们组建的卡组随后会自动移到单个卡组中。

## 我们还不知道的 {#hai-bu-zhi-dao}

- 11月4日的更新具体几点上线。
- Dr. Frank 和他的卡牌如何解锁，以及第一天能否在排位赛中使用。
- It's Alive 是否就是 Dr. Frank 在对局开始时给你的那张卡。
- 平衡补丁改了什么。

来源：Steam 帖子“Happy Halloween, Dr. Frank is coming”（2026年10月31日）及其宣传图；apix（10月29日）和 Mawr（10月31日和 11月3日）在 Origins TCG 官方 Discord 上的消息；Koin Games 提供给创作者用于公开卡牌的卡图（11月2日）；ZulsoiD 的视频（11月3日）。插画：Don Flores（Dr. Frank、It's Alive、Frank's Monster、Necromancer），Alina Kapustina（Franken Bride），Lucas Machado（Doppelganger、Red Knight），Koin Team（Morgan le Fay）。`,
  },
  "balance-patch-dr-frank-roadmap-ama": {
    title: "Origins TCG：周三迎来平衡补丁和 Dr. Frank，周五举行路线图 AMA",
    metaTitle: "Origins TCG：周三平衡补丁，周五路线图 AMA",
    description:
      "Origins TCG 抢先体验的第一个平衡补丁和新首领将于 11月4日（周三）到来，路线图 AMA 则于 11月6日（周五）在官方 Discord 举行。这里汇总了本周的所有日期、排位第 1 赛季的结束时间，以及 Koin 正在开发的内容。",
    summary:
      "Origins TCG 本周有两个重要日期。11月4日（周三）将推出抢先体验的第一个平衡补丁，同时到来的还有新首领 Cyber Queen 和她满是新卡的卡组，卡组的传说卡是 Dr. Frank；11月6日（周五）UTC 时间 21:00，Koin Games 将在官方 Discord 举办路线图 AMA。补丁说明已于 11月4日发布。",
    highlights: [
      { label: "周三的平衡补丁", text: "11月4日，抢先体验的第一个；补丁说明已在当天发布", anchor: "ping-heng-bu-ding" },
      { label: "Dr. Frank 到来", text: "新首领 Cyber Queen 卡组中的传说卡，提前一周登场", anchor: "dr-frank" },
      { label: "周五的路线图 AMA", text: "11月6日 UTC 21:00，在官方 Discord", anchor: "lu-xian-tu-ama" },
      { label: "排位第 1 赛季", text: "在 12月7日那一周结束", anchor: "pai-wei" },
      { label: "开发中", text: "更快的动画、更多锦标赛、游戏内的 Collector Pass", anchor: "kai-fa-zhong" },
    ],
    faq: [
      {
        q: "Origins TCG 的下一个平衡补丁什么时候推出？",
        a: "2026年11月4日（周三），Koin 的工作室负责人 Mawr 在官方 Discord 上宣布。这是自 9月29日 0.7 补丁以来的第一个平衡补丁；补丁说明尚未发布。",
      },
      {
        q: "Origins TCG 的路线图 AMA 什么时候举行？",
        a: "2026年11月6日（周五）UTC 时间 21:00（中欧时间 22:00，北京时间 11月7日 05:00），在官方 Discord 的 #live-events 频道。",
      },
      {
        q: "Origins TCG 里的 Dr. Frank 是什么？",
        a: "任务模式新首领 Cyber Queen 卡组中的传说卡：它们将于 11月4日带着满是新卡的卡组到来，因为游戏达到了 500 条 Steam 评测，所以提前了一周。",
      },
      {
        q: "排位第 1 赛季什么时候结束？",
        a: "据 Koin 所说，在 2026年12月7日那一周；具体日期仍可能变动。",
      },
    ],
    body: `**11月4日更新：**补丁说明已经发布（[我们的文章](/zh-cn/news/balance-patch-1104-cyber-queen)）：十张卡牌有改动，新首领是第 11 位首领 Cyber Queen，她使用 Relentless 卡组，传说卡是 Dr. Frank。下文中凡是把 Dr. Frank 称为新首领的地方，请理解为首领卡组中的传说卡。

## 11月4日（周三）：平衡补丁 {#ping-heng-bu-ding}

Origins TCG 抢先体验的第一个平衡补丁将于 2026年11月4日（周三）推出。11月2日（周一），版主 Senith 在官方 Discord 的 #the-courtyard 频道转达了 Koin Games 工作室负责人 Mawr 的一条消息：“我想你们会对 11月4日周三到来的平衡更新感到满意。”当天晚上，Koin 团队的 apix 在 X 上写道，“第一个真正的平衡补丁就要来了”（[他的帖子](https://x.com/apixtwts/status/2117383252478456012)）。

这是自 2026年9月29日 [0.7 补丁](/en/news/patch-0-7)以来卡牌的第一次改动：10月27日开启抢先体验的 [0.8 更新](/zh-cn/news/origins-tcg-early-access-0-8)没有改动任何卡牌。补丁说明尚未发布，所以我们还不知道哪些卡牌会改动，也不知道更新几点上线。补丁说明一发布，我们就会整理出每张卡改动前后的对比，[卡牌数据库](/zh-cn/cards)、[卡组构筑器](/zh-cn/deck-builder)和 [MetaShifting](/zh-cn/metashifting) 也会显示新的数值。

## 同一天：Dr. Frank 和新首领 {#dr-frank}

周三还会迎来下一位首领 Dr. Frank。Koin 于 10月31日在 Steam 上宣布了这一消息（“[Happy Halloween, Dr. Frank is coming](https://store.steampowered.com/news/app/4429430/view/1847920302242676)”）：这位首领“会带来一副满是新卡的卡组”，并且比原计划提前一周到来。原因写在帖子的宣传图里，Discord 上也有：社区达到了 500 条 Steam 评测，当晚 Koin 在 #announcements 中写道“首领将提前一周到来”。11月2日，apix 在 Discord 上确认：“周三上新首领”。

首领是任务模式中的对手，由 AI 操控。我们的数据库中已经有一张 [Dr. Frank](/zh-cn/cards/dr-frank) 传说卡，它已不在游戏中：其页面显示的是最后已知的数据，未在游戏中核实，首领版本可能与之不同。Koin 还没有说明他卡组中的新卡是否也会进入玩家的收藏。

## 11月6日（周五）：路线图 AMA {#lu-xian-tu-ama}

11月6日（周五）UTC 时间 21:00（美国东部时间 16:00，中欧时间 22:00，北京时间 11月7日 05:00），Koin 将举办“Super Secret Early Access Roadmap AMA”，一场关于抢先体验路线图的问答。这是官方 Discord 上的一个活动，在 #live-events 频道，由 apix 创建。Koin Games 的创始人兼 CEO Tim Jooste 在 11月1日发布于 #announcements 的帖子中，把它列为“What's next”的第一项，但没有更多细节。

在同一个帖子里，他还宣布了另外两件事，同样没有日期：一个“Tell Your Local TCG Shop About Origins Day”，详情“即将公布”；以及一份竞技赛事的概览，涵盖锦标赛、奖励和赛制。上一次 AMA 是在 10月2日，公布了排位赛的日期和关于新卡的第一批数字（[我们的文章](/en/news/building-origins-ama-design-balance)）；目前已确认的日期都在我们的[路线图](/zh-cn/guides/roadmap-and-dates)中。直播结束后我们会整理 AMA 的内容。

## 排位第 1 赛季在 12月7日那一周结束 {#pai-wei}

10月31日，#game-announcements 中又公布了一个日期：抢先体验的第一个排位赛季将于 12 月初结束，“在 12月7日那一周”。Koin 解释说，目前还无法结束一个赛季：实现这一功能的技术将随赛季结束时的大型更新一起推出，所以具体日期仍可能变动。这个日期很快会在游戏中显示。天梯和 Grandmaster 如何运作，见我们的[排位赛攻略](/zh-cn/guides/origins-tcg-ranked)。

## Koin 还在开发什么 {#kai-fa-zhong}

apix 在 11月2日的帖子中列出了正在进行的更新：更快的动画、更多锦标赛、平衡补丁、新卡（“cards cards cards”）、游戏内的 Collector Pass、下一个排位赛季，以及“大量打磨”。他还写道，第一套卡牌中大约 60-70% 目前已经可用。除了补丁之外，这些都还没有日期。

## 我们还不知道的 {#hai-bu-zhi-dao}

- 平衡补丁改动哪些卡牌，以及周三几点上线。
- Dr. Frank 的新卡是否会进入收藏和卡组构筑器。
- 路线图 AMA 会涉及哪些内容，以及是否会有录像。
- 排位第 1 赛季的确切最后一天。

来源：Origins TCG 官方 Discord 上 #the-courtyard（2026年11月2日，18:11 UTC）、#announcements（10月31日 01:41 UTC 和 11月1日 00:05 UTC）以及 #game-announcements（10月31日 22:56 UTC）中的消息；同一服务器上的“Super Secret Early Access Roadmap AMA”活动（11月3日查阅）；10月31日的 Steam 帖子（16:41 UTC）；apix 11月2日在 X 上的帖子。`,
  },
  "origins-tcg-early-access-0-8": {
    title: "告别试玩版：Origins TCG 以 0.8 补丁登陆 Steam 抢先体验",
    metaTitle: "Origins TCG 抢先体验：0.8 补丁说明",
    description:
      "Origins TCG 的试玩版已经结束：自 2026年10月27日起，游戏以抢先体验的形式在 Steam 上免费开放，新增 Grandmaster 段位和全球排行榜、卡牌评级以及 Steam 市场交易，你的账号、收藏和进度都已完整保留下来。",
    summary:
      "2026年10月27日，Koin Games 结束了 Origins TCG 的试玩版，并以 0.8 版本在 Steam 上推出抢先体验。游戏仍然免费，你的账号和收藏都已转移过来；Grandmaster 段位已经开放并配有全球排行榜，评级卡牌出现在游戏中，收藏卡牌可以在 Steam 市场交易。补丁说明没有列出任何卡牌改动。",
    highlights: [
      { label: "告别试玩版", text: "自 10月27日起，Origins TCG 在 Steam 上以抢先体验免费开放", anchor: "qiang-xian-ti-yan" },
      { label: "什么都没丢", text: "账号、收藏和进度都已转移到抢先体验", anchor: "jin-du" },
      { label: "Grandmaster 开放", text: "全球排行榜，第一个赛季计划在 12 月初结束", anchor: "grandmaster" },
      { label: "卡牌评级", text: "收藏卡牌现在会显示 1 到 10 的评级", anchor: "ping-ji" },
      { label: "Steam 市场交易", text: "收藏卡牌可以购买、出售和挂牌", anchor: "shi-chang" },
      { label: "没有卡牌改动", text: "卡牌数值仍是 0.7 补丁的数值", anchor: "ka-pai" },
      { label: "通往 1.0 之路", text: "Koin 的目标是在 2027年3月17日左右结束抢先体验", anchor: "tong-wang-1-0" },
    ],
    faq: [
      {
        q: "Origins TCG 还是免费的吗？",
        a: "是的。自 2026年10月27日起，它以抢先体验的形式在 Steam 上免费开放；Koin 表示它将保持免费游玩、免费竞技，抢先体验期间会有一些付费的高级功能。",
      },
      {
        q: "我会失去试玩版的进度吗？",
        a: "不会。根据 0.8 补丁说明，账号、收藏和进度都已转移到抢先体验版，试玩版可以卸载。",
      },
      {
        q: "0.8 补丁改动了卡牌吗？",
        a: "补丁说明没有列出任何卡牌改动：数值仍是 2026年9月29日 0.7 补丁的数值。",
      },
      {
        q: "Origins TCG 什么时候结束抢先体验？",
        a: "Koin 的目标大约是 2027年3月17日，Steam 页面称这是一个大致日期。",
      },
    ],
    body: `## 告别试玩版，迎来抢先体验 {#qiang-xian-ti-yan}

2026年10月27日（周二），Koin Games 关闭了 Origins TCG 的试玩版，并以 0.8 版本在 Steam 上推出了抢先体验。补丁说明于 UTC 时间 18:06（中欧时间 19:06）发布在官方 Discord 上，两分钟后发布在 Steam 上，标题为“Goodbye Demo, Welcome Early Access”：“这次更新标志着 Origins TCG 试玩版正式结束，也是我们迈向 1.0 的最后冲刺的开始！”

Origins TCG 仍然免费：[Steam 页面](https://store.steampowered.com/app/4429430/Origins_TCG/)将其标注为免费游玩，Koin 写道，无论在抢先体验期间还是正式发售之后，游戏都“将永远保持免费游玩、免费竞技”，并补充说“抢先体验期间会有一些付费的高级功能”。Steam 上原来的试玩版页面已经不存在了：下载和第一场对局的内容见我们的 [Steam 游玩指南](/zh-cn/guides/play-the-demo)。

## 你的账号和收藏都已转移 {#jin-du}

“你的账号、收藏、进度以及其他一切，现在都在 Origins 的抢先体验版中。”在 Discord 上，Koin 的工作室负责人 Mawr 补充说，所有进度都已迁移，试玩版可以卸载。只有一样东西没有带过来：试玩版的评测分数，抢先体验重新开始计算。10月28日，游戏页面显示 22 条评测中 100% 为好评。

## Grandmaster 开放 {#grandmaster}

排位天梯的顶端随 0.8 开放：玩家现在可以晋升到 Grandmaster 段位，Grandmaster 排行榜也已启用，这是与所有其他 Grandmaster 玩家一起竞争的全球排名。抢先体验的第一个排位赛季为最终排名最高的玩家准备了限量版奖励，其中包括纪念其名次的奖励。Koin 计划在“12 月初的某个时候”结束第 1 赛季，并会确认具体日期。天梯如何运作，见我们的[排位赛攻略](/zh-cn/guides/origins-tcg-ranked)。

## 卡牌评级登陆游戏 {#ping-ji}

收藏卡牌可以拥有 1 到 10 的评级，它们的外观现在会“通过各种瑕疵和效果”体现这一评级。Koin 称这“还只是第一版”，并请玩家在 Discord 上反馈哪些地方好、哪些地方不好。

## Steam 市场上的收藏卡牌 {#shi-chang}

“收藏卡牌现在可以在 Steam 市场上购买、出售和挂牌。”初始的游戏卡牌永远归你所有，可以一直用来游玩；收藏版本则是你可以拥有、评级、收集，并且现在还可以交易的版本。不是卡牌的收藏类外观物品暂时还不能交易：它们会在未来的更新中开放，尚无日期。收藏和游玩如何结合，见我们的[收藏经济攻略](/zh-cn/guides/collector-economy)。

## 0.8 没有卡牌改动 {#ka-pai}

0.8 补丁说明没有列出平衡改动、新卡或新的卡牌文本。OriginsMeta 上的卡牌数值仍是 2026年9月29日 [0.7 补丁](/en/news/patch-0-7)的数值，因此[卡牌数据库](/zh-cn/cards)、[卡组构筑器](/zh-cn/deck-builder)和[强度榜](/zh-cn/tier-list)都是最新的。

## 通往 1.0 之路 {#tong-wang-1-0}

“0.8 不是终点”：Koin 预计 Origins 在 1.0 之前还会“发生相当大的变化”，系统会扩展，界面会重做，还会有一些“留不下来”的实验。Steam 页面给出了结束抢先体验的大致日期，“大约 2027年3月17日”，并说明“可能会变动”。同一天，也就是 10月27日，Koin 还开启了 [Alpha Edition 的 Kickstarter](/zh-cn/news/kickstarter-alpha-edition-reward-tiers)。

## 我们还不知道的 {#hai-bu-zhi-dao}

- 排位第 1 赛季的确切结束日期及其完整奖励列表。
- 不是卡牌的收藏类外观物品何时可以交易。
- 抢先体验的“付费高级功能”会是什么。

来源：Origins TCG 官方 Discord #game-announcements 中的“0.8 patch notes”（2026年10月27日，18:06 UTC），Steam 上内容相同的帖子“Goodbye Demo, Welcome Early Access”（18:08 UTC），以及 2026年10月28日查阅的 Origins TCG Steam 页面。`,
  },
  "kickstarter-alpha-edition-reward-tiers": {
    title: "Origins TCG Kickstarter：Alpha Edition 的八个支持档位，从 24 美元到 9,999 美元",
    metaTitle: "Origins TCG Kickstarter：全部八个支持档位",
    description:
      "Origins TCG Alpha Edition Kickstarter 的全部八个档位，从 24 美元到 9,999 美元：密封卡包、补充包盒和整箱，Kickstarter 独占的 Big Bob Commander，以及 Golden Slab 宣传卡。所有奖励均为数字产品。",
    summary:
      "Alpha Edition 的 Kickstarter 共有八个支持档位，从 24 美元的 Worthy 到 9,999 美元的 Legend: Winnie-the-Pooh。每个档位都包含 Alpha Supporter Title 和永久的 Collector Pass；从 Aspirant（99 美元）起会有密封的补充包盒和整箱、Kickstarter 独占的 Big Bob Commander，更高的档位还有 Golden Slab 宣传卡。所有奖励都是数字产品。",
    highlights: [
      { label: "八个档位，24 至 9,999 美元", text: "从 6 包的卡包组合到 30 箱密封整箱", anchor: "dang-wei" },
      { label: "每个档位都有", text: "Alpha Supporter Title 和永久的 Collector Pass", anchor: "mei-ge-dang-wei" },
      { label: "Kickstarter 独占", text: "Aspirant 起有 Big Bob Commander，Apprentice 起有 Golden Big Bob", anchor: "du-zhan" },
      { label: "宣传卡和 slab", text: "Alt Art Promo Box，Van Helsing 和 Rapunzel 的 Golden Slab，顶端是 Winnie-the-Pooh", anchor: "xuan-chuan-ka" },
      { label: "全部为数字产品", text: "Koin 在每个档位上都写明：奖励是数字产品", anchor: "shu-zi" },
      { label: "仍待确认", text: "众筹的结束日期，以及档位是否限量", anchor: "hai-bu-zhi-dao" },
    ],
    faq: [
      {
        q: "Origins TCG Kickstarter 最便宜的档位是多少钱？",
        a: "Worthy，24 美元：一个密封的 6 包 Alpha Booster Bundle、Alpha Supporter Title 和永久的 Origins TCG Collector Pass。",
      },
      {
        q: "哪些档位包含密封的补充包盒或整箱？",
        a: "Aspirant（99 美元）有一盒 24 包，Apprentice（199 美元）有两盒。从 Hero（499 美元）起是密封整箱：Hero 一箱，Champion 两箱，Icon 六箱，Legend 三十箱。",
      },
      {
        q: "Kickstarter 的奖励是实体的吗？",
        a: "不是。Koin Games 在每张奖励图上都写明，所有 Kickstarter 奖励都是数字产品。",
      },
    ],
    body: `## 八个档位，从 24 美元到 9,999 美元 {#dang-wei}

Koin Games 的 **Myths and Legends Alpha Edition** Kickstarter 共有八个支持档位。从最便宜到最贵：

| 档位 | 价格 | 密封产品 | 卡包数 |
| --- | --- | --- | --- |
| Worthy | $24 | 1 个 Alpha Booster Bundle | 6 |
| Aspirant | $99 | 1 盒 Alpha Booster Box | 24 |
| Apprentice | $199 | 2 盒 Alpha Booster Box | 48 |
| Hero | $499 | 1 箱 Alpha Booster Box Case | 144 |
| Champion | $999 | 2 箱 Alpha Booster Box Case | 288 |
| Icon | $2,499 | 6 箱 Alpha Booster Box Case | 864 |
| Myth: Winnie-the-Pooh | $4,999 | 30 箱 Alpha Booster Box Case | 4,320 |
| Legend: Winnie-the-Pooh | $9,999 | 30 箱 Alpha Booster Box Case | 4,320 |

价格单位为美元。下面的图片是 Koin Games 为每个档位制作的奖励卡。档位和奖励的名称保留英文，与 Koin 的写法一致。

### Worthy，24 美元 {#worthy}

![Koin Games 的 Worthy 档位宣传图，24 美元：一个 6 包的密封 Alpha Booster Bundle 和 Collector Pass](/media/kickstarter/worthy.webp)

入门档位：一个 6 包的密封 **Alpha Booster Bundle**、**Alpha Supporter Title** 和**永久的 Origins TCG Collector Pass**。

### Aspirant，99 美元 {#aspirant}

![Koin Games 的 Aspirant 档位宣传图，99 美元：一盒密封的 Alpha 补充包、Big Bob 表情、Collector Pass、Founder 礼包和 Big Bob Commander](/media/kickstarter/aspirant.webp)

一盒 24 包的密封 **Alpha Booster Box**。在 Worthy 的基础上，它还增加了 **Founder Collector Capsule**（头像、卡背、一个 Founder 表情和一个 Founder slab）、Kickstarter 独占的 **Big Bob Commander**，以及包含 3 个表情的 **Big Bob Emote Pack**。

### Apprentice，199 美元 {#apprentice}

![Koin Games 的 Apprentice 档位宣传图，199 美元：两盒密封的 Alpha 补充包、Big Bob Commander、Alpha Alt Art Promo Box、Collector Pass 和 Golden Big Bob Commander](/media/kickstarter/apprentice.webp)

两盒密封补充包，48 包。增加了 Kickstarter 独占的 **Golden Big Bob Commander**、**Golden Big Bob Emote Pack** 和 **Alpha Alt Art Promo Box**。

### Hero，499 美元 {#hero}

![Koin Games 的 Hero 档位宣传图，499 美元：一箱密封的补充包整箱、Alpha Alt Art Promo Box、Alpha Gameboard、两个 Big Bob Commander 和 Van Helsing Golden Slab 宣传卡](/media/kickstarter/hero.webp)

一箱密封的 **Alpha Booster Box Case**，144 包。增加了 **Alpha Gameboard** 和 **Van Helsing Golden Slab Promo**。

### Champion，999 美元 {#champion}

![Koin Games 的 Champion 档位宣传图，999 美元：两箱密封的补充包整箱，以及 Van Helsing 和 Rapunzel 的 Golden Slab 宣传卡](/media/kickstarter/champion.webp)

两箱密封整箱，288 包，附带 **Van Helsing 和 Rapunzel Golden Slab Promo**。

### Icon，2,499 美元 {#icon}

![Koin Games 的 Icon 档位宣传图，2,499 美元：六箱密封的补充包整箱、Van Helsing 和 Rapunzel 的 slab，以及一套 Alternate Art 宣传 slab](/media/kickstarter/icon.webp)

六箱密封整箱，864 包。增加了 **Guaranteed Premium Alternate Art Promo Set**。

### Myth: Winnie-the-Pooh，4,999 美元 {#myth}

![Koin Games 的 Myth: Winnie-the-Pooh 档位宣传图，4,999 美元：密封的补充包整箱、Alternate Art 宣传卡套装，以及一张 Winnie-the-Pooh 宣传 slab 和他的金色表情](/media/kickstarter/myth.webp)

第一个以角色命名的档位。除了 Icon 的全部内容，它还增加了 **Golden Commander Skin**、一个 **Golden Emote** 和 **Serialized Character Profile Promo**。根据其宣传图上的奖励列表，它包含 30 箱密封整箱，4,320 包。

### Legend: Winnie-the-Pooh，9,999 美元 {#legend}

![Koin Games 的 Legend: Winnie-the-Pooh 档位宣传图，9,999 美元：三十箱密封的补充包整箱和两张 Winnie-the-Pooh 宣传 slab，其中一张是金色的](/media/kickstarter/legend.webp)

最高档位：30 箱密封整箱，4,320 包，包含 Myth 的全部内容以及 **Serialized Signature Character Profile Promo**。

## 每个档位都包含什么 {#mei-ge-dang-wei}

- **每个档位**，包括 Worthy：**Alpha Supporter Title** 和**永久的 Origins TCG Collector Pass**。
- **Aspirant 及以上**：**Founder Collector Capsule**（头像、卡背、一个 Founder 表情、一个 Founder slab）、**Big Bob Commander** 及其表情包。
- **Apprentice 及以上**：**Golden Big Bob Commander**、它的表情包和 **Alpha Alt Art Promo Box**。
- **Hero 及以上**：**Alpha Gameboard**。

## Kickstarter 独占 {#du-zhan}

Koin 将两项奖励标为 **Kickstarter Exclusive**：**Big Bob Commander**，从 Aspirant 起每个档位都有；以及 **Golden Big Bob Commander**，从 Apprentice 起。两者各自附带一个包含 3 个表情的表情包。

## 宣传卡和 slab {#xuan-chuan-ka}

较高的档位会增加无法从卡包中开出的宣传卡：Apprentice 起的 **Alpha Alt Art Promo Box**，Hero 起的 **Van Helsing Golden Slab**，Champion 起的 **Van Helsing 和 Rapunzel**，Icon 起的 **Guaranteed Premium Alternate Art Promo Set**，以及 Myth 和 Legend 中带编号的 **Winnie-the-Pooh** 宣传卡。

## 所有奖励都是数字产品 {#shu-zi}

每张宣传图上都有 Koin 的同一句话：“All Kickstarter rewards are a digital product”（所有 Kickstarter 奖励均为数字产品）。根据 Koin 的官方页面，卡包、补充包盒和整箱都是 Steam 库存物品，你可以打开、保持密封或进行交易，而且 Alpha Edition 永远不会再版。每种稀有度的官方开出概率在我们的 [Kickstarter 页面](/zh-cn/kickstarter)上，关于这次众筹的一切，包括日期和来源，都在我们的 [Kickstarter 攻略](/zh-cn/guides/origins-tcg-kickstarter)中。

## 如何支持 {#ru-he-zhi-chi}

我们的 [Kickstarter 页面](/zh-cn/kickstarter)总结了 Alpha Edition 的内容，页面上的按钮会通过我们的推荐链接带你前往众筹页面：如果你从那里支持，Koin Games 会向 OriginsMeta 支付一笔佣金，而你的价格不变。如果你以 VIP 身份预注册过，请使用 Koin 发给你的 VIP 链接：你的 15% 折扣与它绑定。

## 我们还不知道的 {#hai-bu-zhi-dao}

- 众筹何时结束，以及是否有档位限制支持人数。
- 奖励何时到达你的 Steam 库存。`,
  },
  "crimson-cup-coachcrono-wins": {
    title: "CoachCrono 赢得 Origins TCG Crimson Cup：四名决赛选手中有三名意大利人",
    metaTitle: "CoachCrono 赢得 Origins TCG Crimson Cup",
    description:
      "CoachCrono 从败者组一路杀回，在总决赛中击败 SouL，赢得 Origins TCG Crimson Cup 冠军；四名决赛选手中有三名意大利人。这里有他的晋级之路、四名决赛选手的完整卡组，以及整整一周锦标赛的回顾和预选赛的各项数据。",
    summary:
      "CoachCrono 赢得了 Crimson Cup，这是 Origins TCG 迄今为止规模最大的锦标赛：他从败者组杀回，在总决赛中击败 SouL，带走了 1/1 的 Dracula 宣传卡。四名决赛选手中有三名是意大利人：CoachCrono、SouL 和 Felixnxx。下面是他的晋级之路、决赛的卡组，以及一周锦标赛的回顾。",
    highlights: [
      { label: "CoachCrono 夺冠", text: "从败者组杀回，据官方帖子，决赛日战绩 9-3", anchor: "duo-guan" },
      { label: "四人中有三名意大利人", text: "CoachCrono、SouL 和 Felixnxx；第四名决赛选手是 OrdinaryHarry", anchor: "yi-da-li" },
      { label: "总决赛前只输一场", text: "输给了 SouL，而他随后正是击败 SouL 夺冠", anchor: "jin-ji" },
      { label: "每套阵容都有 Pigs", text: "四套阵容都有 Three Not So Little Pigs，三套有 Van Helsing", anchor: "ka-zu" },
      { label: "一周的锦标赛", text: "五场预选赛、双败淘汰的季后赛和全程直播的决赛", anchor: "jin-biao-sai" },
      { label: "仍然缺少", text: "总决赛比分，以及 Koin 的季后赛和决赛数据表", anchor: "hai-bu-zhi-dao" },
    ],
    faq: [
      {
        q: "谁赢得了 Origins TCG Crimson Cup？",
        a: "CoachCrono，2026年10月25日：他从败者组杀回，在总决赛中击败了 SouL。Koin Games 在官方 Discord 上宣布了这一消息，Origins TCG 也在 X 上发了帖。",
      },
      {
        q: "CoachCrono 用哪些卡组赢得了 Crimson Cup？",
        a: "Three Not So Little Pigs、Van Helsing 和 Legion of the Dead，赛制为 Conquest。三份完整卡表及游戏代码都在 OriginsMeta 的 Crimson Cup 页面上。",
      },
      {
        q: "Crimson Cup 的决赛选手有哪些？",
        a: "CoachCrono（第一）、SouL（第二）、Felixnxx（第三）和 OrdinaryHarry（第四）。四人中有三名意大利人：CoachCrono、SouL 和 Felixnxx。",
      },
      {
        q: "CoachCrono 赢得了什么？",
        a: "根据官方冠军宣传图，奖品是 1/1 的 Dracula 宣传卡、两整箱补充包和 1,500 美元。",
      },
    ],
    body: `## CoachCrono 是 Crimson Cup 冠军 {#duo-guan}

恭喜你，Coach。10月25日（周日），[CoachCrono](/zh-cn/u/coachcrono) 赢得了 Crimson Cup，这是 Koin Games 为 Steam Next Fest 那一周收官的锦标赛。Koin Games 的 apix 在官方 Discord 上宣布了这一消息（“Congrats to @CoachCrono for winning our Origins Crimson Cup”），Origins TCG 在 X 上的官方帖子这样总结：他从败者组打上来，“今天战绩 9-3”。

奖品与官方冠军宣传图上的一致：1/1 的 Dracula 宣传卡、两整箱补充包和 1,500 美元。CoachCrono 也是 OriginsMeta 上的 Creator：他的频道和卡组都在他的个人主页上。

## 四名决赛选手中的三名意大利人 {#yi-da-li}

四名选手进入了决赛，其中三名是意大利人：CoachCrono、SouL 和 Felixnxx。第四名是 OrdinaryHarry。在一场对所有人开放、预选赛覆盖美洲、欧洲和亚洲的锦标赛中，这对意大利的 Origins TCG 玩家圈子来说是一个了不起的成绩。

最终排名，来自 Tourney Bot 上的季后赛对阵表和 Koin 的公告：

1. CoachCrono
2. SouL
3. Felixnxx
4. OrdinaryHarry

## 他的晋级之路 {#jin-ji}

10月24日（周六）的季后赛采用双败淘汰、三局两胜：输一场掉入败者组，输两场就被淘汰。CoachCrono 在胜者组赢下了前六场比赛，其中一场的对手是另一位 OriginsMeta 创作者 agraveinstream，随后在半决赛中以 0-2 输给了 SouL。从那以后他再也没输过：2-1 击败 eotboltyou 进入四强，接着在决赛中 2-0 击败 OrdinaryHarry、2-0 击败 Felixnxx，并在总决赛中战胜了此前一场未输的 SouL。

另一边，SouL 在胜者组一路不败，在胜者组决赛中 2-1 击败 Felixnxx。Felixnxx 则在另一场半决赛中 2-1 击败了 OrdinaryHarry。完整的晋级过程，一场一场都在我们的[季后赛对阵表](/zh-cn/analytics/crimson-cup/playoffs)中。

## 决赛的卡组 {#ka-zu}

Koin 在决赛日公布了四名决赛选手的卡表：按照规则，从前 4 名开始卡表会公开。CoachCrono 的夺冠阵容：

- [Three Not So Little Pigs](/zh-cn/cards/three-not-so-little-pigs)：Bullseye、Glinda、Golden Egg、Guy of Gisborne、Mind Palace、Mummy、Obliterate、Reinforcements、Sandman、Stroke of Midnight、Three Blind Mice、Trash for Treasure；
- [Van Helsing](/zh-cn/cards/van-helsing)：Ali Baba、Baby Bear、Bridge Troll、Dark Omen、First Aid、Forbidden Knowledge、Phuong Hoang、Puck、Searing Light、Shahrazad、Spellbook、Tin Woodman；
- [Legion of the Dead](/zh-cn/cards/legion-of-the-dead)：Asanbosam、Baby Bear、Boogeyman、Bridge Troll、Dark Omen、En Passant、Golden Egg、Morgiana、Mummy、Obliterate、Paul Bunyan、Trash for Treasure。

其他阵容：SouL 带了 Merlin、Mulan 和 Three Not So Little Pigs；Felixnxx 带了 Van Helsing、Legion of the Dead 和 Three Not So Little Pigs；OrdinaryHarry 带了 Mulan、Van Helsing 和 Three Not So Little Pigs。

12 份卡表中的几个数字。四套阵容都有 Three Not So Little Pigs，三套有 Van Helsing，两套有 Legion of the Dead 和 [Mulan](/zh-cn/cards/mulan)，一套有 [Merlin](/zh-cn/cards/merlin)：其余六张传说卡都没有进入决赛。[Baby Bear](/zh-cn/cards/baby-bear) 是最常见的卡牌（12 副卡组中有 7 副），其次是 Golden Egg、Mind Palace、Obliterate 和 Tin Woodman（各 6 副）。完整卡表、游戏代码和卡组构筑器链接都在我们的 [Crimson Cup 页面](/zh-cn/analytics/crimson-cup#finals)上。

## 锦标赛回顾 {#jin-biao-sai}

用 apix 的话说，Crimson Cup 是 Koin Games 有史以来规模最大的锦标赛：10月19日至22日之间进行了五场对所有人开放的预选赛（AMER #1、EMEA #1、AMER #2、APAC 和 EMEA #2），每场晋级 32 人，另有 96 个外卡名额，10月24日进行 256 人的季后赛，10月25日进行决赛，全程直播。赛制为 Conquest：三副卡组，每两副之间至少有 8 张不同的独有卡牌，设有禁用阶段，卡表在前 4 名之前不公开。奖励总价值 10,000 美元。详细规则见我们的 [Crimson Cup 规则](/en/news/crimson-cup-format-check-in)。

在 Koin 公布了官方数据表的四场预选赛中，Van Helsing 始终是被禁用最多的传说卡（从 AMER #1 的 44.4% 到 EMEA #2 的 55.1%），Three Not So Little Pigs 是被带得最多的，Baby Bear 是使用最多的卡牌。决赛呈现了同样的环境：每套阵容都有 Pigs，三套有 Van Helsing，12 副卡组中有 7 副带 Baby Bear。所有预选赛的数据都在我们的 [Crimson Cup 页面](/zh-cn/analytics/crimson-cup)上。

## 我们还不知道的 {#hai-bu-zhi-dao}

- 总决赛的比分：Tourney Bot 上没有结果，Koin 也没有写；官方帖子只给出了当天的 9-3。
- 季后赛和决赛的数据表（禁用、带入的卡组、使用最多的卡牌）：Koin 在预选赛之后于官方 Discord 公布了这些数据，但季后赛和决赛的还没有。数据一出，就会放到我们的 Crimson Cup 页面上。`,
  },
  "crimson-cup-meta-report-emea-1-amer-2": {
    title: "Crimson Cup 环境报告：Van Helsing 仍是禁用最多的传说卡，King Arthur 在欧洲和美洲待遇迥异",
    metaTitle: "Origins TCG Crimson Cup：EMEA #1 与 AMER #2 数据",
    description:
      "Origins TCG Crimson Cup 的 EMEA #1 和 AMER #2 预选赛官方数据：Van Helsing 的禁用率分别为 51.1% 和 48.4%，King Arthur 在欧洲只有 6.3%，在美洲却达到 24%。所有预选赛并排对比。",
    summary:
      "Koin Games 公布了 Crimson Cup 另外两场预选赛 EMEA #1 和 AMER #2 的官方数据。Van Helsing 再次成为禁用最多的传说卡（51.1% 和 48.4%），Three Not So Little Pigs 依然是被带得最多的，Baby Bear 依然是使用最多的卡牌。新的变化来自 King Arthur：它在欧洲的禁用率为 6.3%，在美洲却是 24%。我们的 Crimson Cup 页面现在把所有预选赛并排对比。",
    highlights: [
      { label: "Van Helsing，处处被禁", text: "三场预选赛中禁用最多，EMEA #1 为 51.1%，AMER #2 为 48.4%", anchor: "jin-yong" },
      { label: "King Arthur 区分了两个赛区", text: "欧洲禁用率 6.3%，美洲两场预选赛为 22.7% 和 24%", anchor: "king-arthur" },
      { label: "Robin Hood 开始让人忌惮", text: "从 AMER #1 的 11.8% 升到接近五分之一", anchor: "robin-hood" },
      { label: "Pigs 依然被带得最多", text: "约占四分之一的卡组，禁用率每次都略有上升", anchor: "dai-ru" },
      { label: "Baby Bear 三场都排第一", text: "50.1% 和 46.1%；Bagheera 和 Stroke of Midnight 进入前 20", anchor: "ka-pai" },
      { label: "所有预选赛并排对比", text: "我们 Crimson Cup 页面的新栏目", anchor: "ye-mian" },
    ],
    faq: [
      {
        q: "在 Crimson Cup 各场预选赛中，哪张传说卡被禁用最多？",
        a: "Van Helsing，在三场有官方数据的预选赛中都是如此：根据 Koin Games 的数据，AMER #1 为 44.4%，EMEA #1 为 51.1%，AMER #2 为 48.4%。Merlin 每次都排第二（42.2%、48.6%、47.5%）。",
      },
      {
        q: "Crimson Cup 的环境在欧洲和美洲有区别吗？",
        a: "基本没有：被禁用和被带入的传说卡相同，Baby Bear 在各地都是使用最多的卡牌。例外是 King Arthur，它在 EMEA #1 的禁用率为 6.3%，而在美洲两场预选赛中为 22.7% 和 24.0%。",
      },
      {
        q: "在哪里可以看到 Crimson Cup 每场预选赛的数据？",
        a: "在我们 Analytics 中的 Crimson Cup 页面：每场预选赛一个标签页，有 Koin 的数据表和与天梯的对比，还有一个把所有预选赛并排对比的栏目。",
      },
    ],
    body: `## 又两场预选赛，同样的数据表 {#shu-ju}

在 EMEA #1（10月20日）和 AMER #2（10月21日）之后，Koin Games 在官方 Discord 上公布了与第一场预选赛之后相同的两张数据表：每张传说卡在禁用阶段的表现，以及提交的卡组中使用最多的 20 张卡牌。五场预选赛已经进行了三场，现在可以对比这些数字了：哪些从一场预选赛延续到下一场，哪些在欧洲和美洲之间有所不同。第一场 AMER #1 的数据，见我们 [10月20日的环境报告](/zh-cn/news/crimson-cup-meta-report-amer-1)。

## 三场中三次：Van Helsing 第一，Merlin 第二 {#jin-yong}

禁用率是指一张传说卡在被对手于禁用阶段看到的次数中，被禁用的比例（卡表在前 4 名之前不公开，所以禁用时你只能看到传说卡：[规则](/en/news/crimson-cup-format-check-in#decklists)）。

| 传说卡 | AMER #1 | EMEA #1 | AMER #2 |
|---|---|---|---|
| Van Helsing | 44.4% | 51.1% | 48.4% |
| Merlin | 42.2% | 48.6% | 47.5% |
| Three Not So Little Pigs | 32.8% | 34.9% | 36.1% |
| Dorothy | 23.1% | 10.0% | 33.3% |
| King Arthur | 22.7% | 6.3% | 24.0% |
| Robin Hood | 11.8% | 19.6% | 18.6% |
| Mulan | 20.3% | 15.3% | 14.0% |
| Legion of the Dead | 19.2% | 15.4% | 10.6% |
| Queen of Hearts | 21.0% | 8.0% | 12.0% |
| Dracula | 14.1% | 14.5% | 9.2% |
| Wicked Stepmother | 11.1% | 0% | 8.3% |

Van Helsing 在 EMEA #1 的 272 次中被禁用 139 次，在 AMER #2 的 186 次中被禁用 90 次：在欧洲超过半数。Merlin 在三场预选赛中都排第二，尽管它出现在不到十分之一的卡组中。Dorothy 和 Wicked Stepmother 在每场预选赛中于禁用阶段被看到的次数都不到 30 次（Dorothy 在 AMER #2 只有 9 次）：它们的数字波动很大，说明不了太多。

## King Arthur：在美洲被禁，在欧洲几乎没人禁 {#king-arthur}

各场预选赛之间差距最大的是 King Arthur：在 AMER #1 的 66 次中被禁用 15 次（22.7%），在 EMEA #1 的 63 次中被禁用 4 次（6.3%），在 AMER #2 的 75 次中被禁用 18 次（24.0%）。样本量相近，所以这不是噪声：在美洲的两场预选赛中，玩家大约每四次禁一次，在欧洲则几乎从不禁用。Queen of Hearts 呈现出方向相同但较小的差距（美洲 21.0% 和 12.0%，欧洲 8.0%）。我们的解读：美洲玩家更忌惮 King Arthur 卡组；EMEA #2 将告诉我们欧洲的看法是否不同。

## Robin Hood 不再是最不受忌惮的 {#robin-hood}

AMER #1 之后，Robin Hood 是被看到至少 30 次的传说卡中禁用最少的（11.8%）。在接下来的两场预选赛中，它几乎每五次就被禁一次：EMEA #1 的 102 次中被禁 20 次，AMER #2 的 43 次中被禁 8 次。现在最不受忌惮的变成了其他传说卡：欧洲的 King Arthur（6.3%），AMER #2 的 Dracula（9.2%）和 Legion of the Dead（10.6%）。Legion 的禁用率一次比一次低（19.2%、15.4%、10.6%），但它仍然出现在大约十分之一的卡组中。

## Pigs 被带得最多，禁用率每次都略有上升 {#dai-ru}

Koin 数据表中带有各传说卡的卡组占比：

| 传说卡 | AMER #1 | EMEA #1 | AMER #2 |
|---|---|---|---|
| Three Not So Little Pigs | 23.3% | 23.4% | 24.0% |
| Van Helsing | 18.7% | 19.7% | 20.1% |
| Legion of the Dead | 9.3% | 9.7% | 9.8% |
| Merlin | 9.8% | 9.7% | 9.0% |
| Dracula | 7.4% | 5.8% | 7.2% |
| Mulan | 6.7% | 8.3% | 7.0% |
| King Arthur | 6.4% | 5.7% | 6.5% |
| Robin Hood | 7.2% | 7.7% | 6.5% |
| Queen of Hearts | 6.5% | 6.7% | 6.5% |
| Dorothy | 3.2% | 2.3% | 2.2% |
| Wicked Stepmother | 1.5% | 0.9% | 1.2% |

Three Not So Little Pigs 在每场预选赛中都出现在接近四分之一的卡组中（EMEA #1 216 副，AMER #2 214 副），而它的禁用率每次都在上升：32.8%、34.9%、36.1%。Pigs 和 Van Helsing 加起来超过了卡组总数的十分之四。其他传说卡的排名几乎没有变化：这届锦标赛的环境很稳定。

## 卡牌：Baby Bear 第一，15 张卡始终在前 20 {#ka-pai}

包含该卡牌的卡组占全部提交卡组的比例，按 Koin 公布的数据，以 AMER #2 的顺序排列。短横线表示该卡牌不在那场预选赛的前 20 中：并不是零，我们也不做估计。

| # | 卡牌 | AMER #2 | EMEA #1 | AMER #1 |
|---|---|---|---|---|
| 1 | Baby Bear | 46.1% | 50.1% | 47.2% |
| 2 | Mind Palace | 33.8% | 33.0% | 31.7% |
| 3 | Spellbook | 32.5% | 32.5% | 32.4% |
| 4 | Roo | 31.3% | 32.6% | 33.7% |
| 5 | Trash for Treasure | 29.0% | 31.0% | 29.9% |
| 6 | Golden Egg | 27.9% | 29.3% | 30.2% |
| 7 | Ali Baba | 26.9% | 28.8% | 28.2% |
| 8 | Scarecrow | 25.9% | 25.6% | 22.1% |
| 9 | Dark Omen | 25.7% | 28.7% | 27.4% |
| 10 | Impundulu | 24.7% | 21.1% | 22.3% |
| 11 | Bagheera | 23.5% | 22.7% | — |
| 12 | Tin Woodman | 23.3% | 25.4% | 21.6% |
| 13 | Sandman | 23.2% | 22.8% | 23.9% |
| 14 | Mummy | 22.2% | 26.6% | 24.9% |
| 15 | Bullseye | 21.8% | — | 21.6% |
| 16 | Defense Matrix | 21.2% | — | 22.1% |
| 17 | Forbidden Knowledge | 21.1% | 23.2% | 22.3% |
| 18 | En Passant | 21.0% | 23.5% | 21.7% |
| 19 | Shahrazad | 20.8% | — | 20.3% |
| 20 | Stroke of Midnight | 20.5% | 23.1% | — |

Baby Bear 在三场预选赛中都是使用最多的卡牌，在欧洲出现在一半的卡组中（50.1%）。Spellbook 纹丝不动（32.4%、32.5%、32.5%）。有十五张卡在每场预选赛中都进入了前 20。Bagheera 和 Stroke of Midnight 在 EMEA #1 进入前 20，并在 AMER #2 保持住了；EMEA #1 的前 20 中还有 Obliterate（23.8%）、Jekyll（21.2%）和 Reinforcements（21.0%），它们不在 AMER #2 的表中。

## 这对 APAC 和 EMEA #2 意味着什么 {#xia-yi-chang}

最后两场预选赛 APAC 和 EMEA #2 于 10月22日进行。我们的解读：

- Van Helsing 和 Merlin 在各地几乎每两次就被禁一次：带它们的人应该准备好用另外两副卡组来打；
- Pigs 是被带得最多的传说卡，禁用率也一次比一次高：带的人越多，越容易吸引禁用；
- 在欧洲，King Arthur 到目前为止几乎从未被禁：如果 EMEA #2 证实这一点，它就是那里最有可能留在场上的传说卡。

## 所有预选赛并排对比 {#ye-mian}

我们的 [Crimson Cup 页面](/zh-cn/analytics/crimson-cup)新增了一个栏目，[预选赛对比](/zh-cn/analytics/crimson-cup#across)：禁用率、带入的卡组和使用最多的卡牌，每场预选赛一列，既有汇总，也有每场之间的变化。每场预选赛的页面保持不变，仍有与天梯的对比；卡牌页面，比如 [King Arthur](/zh-cn/cards/king-arthur) 和 [Baby Bear](/zh-cn/cards/baby-bear)，会显示最近一场预选赛的数据。

## 数据来源 {#lai-yuan}

- Koin Games 在 EMEA #1 之后（2026年10月21日查阅）和 AMER #2 之后（2026年10月22日查阅）于[官方 Discord](https://discord.gg/originstcg) 上公布的数据表。
- AMER #1 的数据表于 2026年10月20日查阅，见我们的[第一篇环境报告](/zh-cn/news/crimson-cup-meta-report-amer-1)。`,
  },
  "crimson-cup-meta-report-amer-1": {
    title: "Crimson Cup 环境报告：AMER #1 中 Van Helsing 禁用最多，Pigs 被带得最多",
    metaTitle: "Origins TCG Crimson Cup 环境报告：AMER #1 禁用",
    description:
      "Origins TCG Crimson Cup AMER #1 预选赛的 Koin 官方数据：Van Helsing 禁用率 44.4%，Pigs 出现在 168 副卡组中，Baby Bear 出现在 47.2% 的卡组里，还有锦标赛与天梯之间的差距。",
    summary:
      "Koin Games 公布了 Crimson Cup 的第一批官方数据，来自 AMER #1 预选赛：哪些传说卡被禁用、玩家带了哪些传说卡，以及使用最多的卡牌。Van Helsing 是禁用最多的（44.4%），Three Not So Little Pigs 是被带得最多的（168 副卡组），Baby Bear 出现在 47.2% 的卡组中。所有数字，按预选赛逐场并与天梯对比，都在我们新的 Crimson Cup 页面上。",
    highlights: [
      { label: "Van Helsing，必禁之选", text: "在被看到的次数中有 44.4% 被禁，Merlin 以 42.2% 紧随其后", anchor: "jin-yong" },
      { label: "Pigs 被带得最多", text: "168 副卡组，占提交卡组的 23.3%，禁用率仍有 32.8%", anchor: "dai-ru" },
      { label: "Robin Hood，最不受忌惮", text: "禁用率只有 11.8%，却是天梯中最强的之一", anchor: "robin-hood" },
      { label: "Baby Bear 出现在近半卡组中", text: "47.2%，其后是 Roo、Spellbook 和 Mind Palace", anchor: "ka-pai" },
      { label: "锦标赛与天梯", text: "Pigs 和 Van Helsing 的带入率高于天梯使用率，Legion 则相反", anchor: "tian-ti" },
      { label: "Crimson Cup 专属页面", text: "Koin 的数据按预选赛逐场呈现，在 Analytics 和卡牌页面上", anchor: "ye-mian" },
    ],
    faq: [
      {
        q: "Crimson Cup 中哪张传说卡被禁用最多？",
        a: "Van Helsing：根据 Koin Games 的官方数据，在 2026年10月19日的 AMER #1 预选赛中，对手在 216 次中禁用了它 96 次（44.4%）。其后是 Merlin（42.2%）和 Three Not So Little Pigs（32.8%）。",
      },
      {
        q: "Crimson Cup 中使用最多的卡牌是哪些？",
        a: "Baby Bear，出现在 AMER #1 提交卡组的 47.2% 中，其后是 Roo（33.7%）、Spellbook（32.4%）、Mind Palace（31.7%）和 Golden Egg（30.2%）。Koin 公布了前 20 名。",
      },
      {
        q: "Crimson Cup 的卡表公开吗？",
        a: "暂时不公开：卡表在前 4 名之前都不公开。Koin 公布的是汇总数据（禁用、传说卡和使用最多的卡牌），我们在 Analytics 的 Crimson Cup 页面上按预选赛逐场整理。",
      },
    ],
    body: `## Koin 公布的数据 {#shu-ju}

在 10月19日的第一场 Crimson Cup 预选赛 AMER #1 之后，Koin Games 在官方 Discord 上公布了两张数据表：每张传说卡在禁用阶段的表现，以及提交的卡组中使用最多的卡牌。这些是汇总数据：卡表在前 4 名之前不公开（[规则](/en/news/crimson-cup-format-check-in#decklists)），所以看不到单份卡表，但它们说明了玩家忌惮什么、信任什么。我们把它们和天梯数据放在一起，做成了一个新页面：[Crimson Cup 数据](/zh-cn/analytics/crimson-cup)。

## 禁用：Van Helsing 第一，Merlin 紧随其后 {#jin-yong}

在 Crimson Cup 中，你只能看到对手的三张传说卡，然后禁掉他们的一副卡组。禁用率是指一张传说卡在被对手于禁用阶段看到的次数中，被禁用的比例。

| 传说卡 | 禁用率 | 被禁 / 被看到 | 卡组数 | 最远轮次 |
|---|---|---|---|---|
| Van Helsing | 44.4% | 96/216 | 135 | 4 |
| Merlin | 42.2% | 38/90 | 71 | 4 |
| Three Not So Little Pigs | 32.8% | 86/262 | 168 | 4 |
| Dorothy | 23.1% | 6/26 | 23 | 4 |
| King Arthur | 22.7% | 15/66 | 46 | 4 |
| Queen of Hearts | 21.0% | 13/62 | 47 | 4 |
| Mulan | 20.3% | 13/64 | 48 | 4 |
| Legion of the Dead | 19.2% | 19/99 | 67 | 4 |
| Dracula | 14.1% | 9/64 | 53 | 4 |
| Robin Hood | 11.8% | 8/68 | 52 | 4 |
| Wicked Stepmother | 11.1% | 1/9 | 11 | 3 |

Van Helsing 几乎每两次就被禁一次。Merlin 是个意外：被带的次数少得多（71 副卡组），但只要出现，就有 42.2% 的时候被禁，尽管它在天梯中的胜率只有 48.1%。十一张传说卡中有十张在第 4 轮（32 名晋级者的那一轮）有卡组：只有 Wicked Stepmother 止步于第 3 轮。

## Pigs 被带得最多 {#dai-ru}

Three Not So Little Pigs 出现在 168 副卡组中，占 Koin 数据表所统计卡组的 23.3%：几乎每四副卡组就有一副，超过任何其他传说卡。它的禁用率仍有 32.8%，所以带它的人常常要靠另外两副卡组取胜。其后是 Van Helsing，135 副卡组（18.7%），然后是 Merlin（71）和 Legion of the Dead（67）；垫底的是 Dorothy（23）和 Wicked Stepmother（11）。

## Robin Hood，最不受忌惮 {#robin-hood}

在被看到至少 30 次的传说卡中，Robin Hood 被禁用得最少：68 次中被禁 8 次，11.8%。然而在天梯中它是最强的三张之一：胜率 60.6%，与 Pigs（60.7%）和 Van Helsing（59.8%）不相上下，而在我们 [10月19日的环境报告](/en/news/meta-report-2026-10-19#triangle)中，它正是克制 Van Helsing 的那一张。在锦标赛中它被带得较少（52 副卡组，7.2%），而且几乎从未被禁。我们的解读：目前它是最常留在场上的传说卡。

## 出现在近半卡组中的卡牌 {#ka-pai}

包含该卡牌的卡组占全部提交卡组的比例，按 Koin 公布的数据：统计的是所有报名者，而不只是打过比赛的人。

| # | 卡牌 | 卡组占比 | 卡组数 |
|---|---|---|---|
| 1 | Baby Bear | 47.2% | 341 |
| 2 | Roo | 33.7% | 244 |
| 3 | Spellbook | 32.4% | 234 |
| 4 | Mind Palace | 31.7% | 229 |
| 5 | Golden Egg | 30.2% | 218 |
| 6 | Trash for Treasure | 29.9% | 216 |
| 7 | Ali Baba | 28.2% | 204 |
| 8 | Dark Omen | 27.4% | 198 |
| 9 | Mummy | 24.9% | 180 |
| 10 | Sandman | 23.9% | 173 |
| 11 | Impundulu | 22.3% | 161 |
| 12 | Forbidden Knowledge | 22.3% | 161 |
| 13 | Scarecrow | 22.1% | 160 |
| 14 | Defense Matrix | 22.1% | 160 |
| 15 | En Passant | 21.7% | 157 |
| 16 | Bullseye | 21.6% | 156 |
| 17 | Tin Woodman | 21.6% | 156 |
| 18 | Reinforcements | 21.3% | 154 |
| 19 | Obliterate | 20.9% | 151 |
| 20 | Shahrazad | 20.3% | 147 |

Baby Bear 在天梯中已经是 0.7 补丁使用最多的卡牌，在锦标赛中更是出现在近一半的卡组里。Koin 只公布前 20 名：其他卡牌不在表中，我们也不做估计。

## 锦标赛与天梯 {#tian-ti}

与天梯相比，也就是在 0.7 补丁上用 OriginsMeta Tracker 记录的对局（10月20日查阅），这些差距说明了玩家在关键时刻信任什么：

- **Pigs 和 Van Helsing** 在锦标赛中被带的比例高于它们在天梯中的使用率：分别是 23.3% 的卡组对比 17.4% 的天梯出场率，以及 18.7% 对比 13.2%。
- **Legion of the Dead** 则相反：天梯 15.3%，锦标赛卡组 9.3%；Dracula 是 10.6% 对比 7.4%。
- 卡牌方面，**Obliterate**（天梯 34.9%，锦标赛 20.9%）、**Golden Egg** 和 **Mummy** 下降最多；**Shahrazad** 和 **Scarecrow** 上升。两种统计方式不同（提交的卡组与记录的对局），所以更适合把卡牌互相比较，而不是只看单个差距。

## 这对接下来的预选赛意味着什么 {#xia-yi-chang}

我们对 EMEA #1、AMER #2、APAC 和 EMEA #2 的解读：

- 带 Van Helsing 或 Pigs 就要做好被禁的准备，Van Helsing 几乎每两次就会被禁一次：第三副卡组和前两副同样重要；
- Robin Hood 很少被禁，而且在天梯中克制 Van Helsing：它是最有可能留在场上的传说卡；
- Merlin 吸引的禁用远超它在天梯中的成绩：放进三副卡组的组合里，它可以替你的另外两副卡组挡下禁用。

## Crimson Cup 专属页面 {#ye-mian}

从今天起，Analytics 新增了一个 [Crimson Cup 页面](/zh-cn/analytics/crimson-cup)，按预选赛逐场展示 Koin 的官方数据：禁用率、卡组数、使用最多的卡牌以及与天梯的对比。传说卡和最常用卡牌的页面也会显示它们在 Crimson Cup 中的数据，比如 [Van Helsing](/zh-cn/cards/van-helsing) 和 [Baby Bear](/zh-cn/cards/baby-bear)。每当 Koin 公布一场预选赛的数据，我们就会补充上去。

## 数据来源 {#lai-yuan}

- Koin Games 在 AMER #1 预选赛之后于[官方 Discord](https://discord.gg/originstcg) 上公布的数据表，2026年10月20日查阅。
- 天梯：在 0.7 补丁上用 OriginsMeta Tracker 记录的对局，普通对局和排位赛合计，2026年10月20日在我们的 [Crimson Cup 页面](/zh-cn/analytics/crimson-cup)上查阅。`,
  },
  "soul-crimson-cup-interview": {
    title: "与 Crimson Cup 决赛选手 SouL 聊聊：克制 Van Helsing 的阵容和 Origins TCG 的未来",
    metaTitle: "SouL 专访：Origins TCG Crimson Cup 决赛选手",
    description:
      "Origins TCG Crimson Cup 亚军 SouL 讲述他为击败 Van Helsing 而打造的 Pigs、Mulan 和 Merlin 阵容，聊聊 Origins TCG 的未来，并附上他的三份完整卡表和可以直接复制的游戏代码。",
    summary:
      "SouL 在 Crimson Cup 获得亚军，只在总决赛中被 CoachCrono 拦下。在这次对谈中，他讲述了自己和 Nimer、Lord Von 一起为击败 Van Helsing 打造的阵容，为什么他认为 Merlin 需要削弱，以及为什么 Origins TCG 具备成长所需的一切。他的三份卡表现已成为一套锦标赛卡组，游戏代码可以直接复制。",
    faq: [
      {
        q: "SouL 在 Crimson Cup 用了哪些卡组？",
        a: "Three Not So Little Pigs、Mulan 和 Merlin，赛制为 Conquest。这三份卡表由 Koin Games 在决赛日公布，现已作为锦标赛卡组收录在 OriginsMeta 上，游戏代码可以直接复制。",
      },
      {
        q: "SouL 为什么选择 Pigs、Mulan 和 Merlin？",
        a: "为了击败 Van Helsing，在他看来那是环境中的顶级卡组：一副快攻、一副中速和一副控制，都调整成了以组合技的方式来打。这个思路来自 Nimer，和 Lord Von 一起测试，再由 SouL 打磨完善。",
      },
      {
        q: "SouL 认为他阵容中最强的是哪副卡组？",
        a: "Merlin：三副中最稳定的一副，也是他最喜欢的，“绝对需要削弱”。在他看来最弱的是 Mulan，整个锦标赛中对手从来没有禁过它。",
      },
    ],
    body: `SouL 是进入 [Crimson Cup](/zh-cn/analytics/crimson-cup) 决赛的**三名意大利人之一**，这是 Origins TCG 迄今为止规模最大的锦标赛：他在胜者组一路不败，只在总决赛中输给了 [CoachCrono](/zh-cn/news/crimson-cup-coachcrono-wins)。他在 OriginsMeta 上拥有 Pro 身份：他的频道和卡组都在[他的个人主页](/zh-cn/u/soulontwitch)上。

我们因为其他竞技游戏相识多年，所以这与其说是一次采访，不如说是两个爱好者之间的聊天。对谈录制于决赛刚结束的那几天，正好是 [Alpha Edition Kickstarter](/zh-cn/kickstarter) 上线的那一天。提问者是 Luigi “[Davdas](/zh-cn/authors/davdas)” Ragoni。

SouL 的三份卡表，也就是 Koin Games 在决赛日公布的那三份，现在已成为一套[锦标赛卡组](/zh-cn/decks/tournament/soul-crimson-cup-lineup)：**你可以在下文找到它们，游戏代码可以直接复制**。

![SouL，Crimson Cup 决赛选手，OriginsMeta 上的 Pro](/media/news-soul-photo.webp)

## 余温犹在的锦标赛 {#jin-biao-sai}

**Davdas:** 你好 SouL，在游戏圈里我们的路交汇过那么多次，这次能再见到你真的很开心，而且是在你取得了一个很棒的成绩之后：你打进了一款全新游戏的第一场锦标赛的决赛。感觉怎么样？

**SouL:** 你好 Luigi！这有点像回到了我们以前经常碰面的那些老游戏的时候，因为那些也是竞技类的数字游戏。

这些年我更多转向了实体卡牌，但 **Origins 把我带回了当年在线上游戏里比赛的日子**。

**Davdas:** 我们会聊聊你的卡表和你的选择，也会聊聊这款游戏，因为幕布目前只拉开了一半：我想往后面看一看，想象一下它能变成什么样，对我们和对你来说都是。但首先，趁着热乎，就在比赛结束几个小时之后：这场锦标赛怎么样？整个活动、持续时间、比赛本身？

**SouL:** 在我看来非常好，毕竟这是一家刚进入这个行业的公司组织的第一场锦标赛，而且就在今天，我们录制的这一天，他们正式开启了 Kickstarter：我们正处在一款还没正式推出就已经非常成功的游戏的起点。

除了一些所有玩家都知道的小技术问题，比如因为人太多、比赛太多导致机器人变慢，整体真的很好。参赛的有很多有意思的名字，有知名的国际选手，有 Thijs 这种级别的 Hearthstone 主播，还有一批扎实的意大利卡牌玩家。

我们可以直接说：**前 4 名的四个位置里，我们意大利人拿下了三个**。这非常了不起。里面有我认识的人，有我认为很强的人，再加上我自己的成绩，我会说结果非常好。

[![Koin Games 官方的 Crimson Cup 宣传图：预选赛、季后赛、决赛和 10,000 美元奖励](/media/news-crimson-cup.webp)](/zh-cn/analytics/crimson-cup)

## Origins TCG 在意大利 {#yi-da-li}

**Davdas:** 这对我们国家来说是一次巨大的成功：它把人们聚在一起，也让 Origins 更强大，而 Origins 现在才刚开始走向海外市场，走向世界上的每一个国家。对于这样一款游戏，你对意大利市场有什么期待？意大利玩家能让它成为一款头部游戏吗？

**SouL:** 我觉得可以。有意思的是，我们一直都是**欧洲最活跃的社区之一**，至少在线上卡牌游戏里是这样。

直到今天，我们在 Magic: The Gathering Online 上仍然拥有最大的社区之一，在 Hearthstone 上，意大利社区也一直是最大的之一，这些年我们出了很多人才、很多优秀的选手，我就不一一列举了，还有很多大牌内容创作者。没有哪一款数字卡牌游戏在我们国家不火的。

在我看来 Origins 完全有机会：如果你愿意这么比较的话，**它一点也不输给黄金时代的 Hearthstone**。时代当然变了，但我相信很多人都能享受这款游戏。事实上这已经很明显了：已经有很多人在享受它了。没必要假装不是这样。

## 阵容：Pigs、Mulan 和 Merlin {#zhen-rong}

> “7 轮中有 6 轮，我遇到的对手都带了 Van Helsing：我只要不禁它，就总能把他们碾过去。”

**Davdas:** 希望如此。你也知道，我自己和 Blizzard、和 Hearthstone 本身有一段特别的渊源，我看到了一些相似之处。我们跟读者直说吧：这更像是朋友之间的聊天，而不是采访。

不过我不想跳过锦标赛：我们先聊卡表，然后再回到 Origins 会变成什么、我们有什么期待。你做了一个大胆的选择，因为你带了 Three Not So Little Pigs、Mulan 和 Merlin，三副截然不同的卡组：一副快攻、一副中速和一副控制。从你这几周的思考和测试来看，为什么是这三份卡表？

**SouL:** 没错。我先说实话：这个阵容的思路我没什么功劳，因为实际上是我的两个朋友测试出来的。他们一起练习，是两位都打得很好的意大利选手：**Nimer 和 Lord Von**。

我们选这几副卡组，是因为正如你说的，从定位上看它们分别是快攻、中速和控制，但**我们按照把它们变成组合技卡组的思路做了修改**。我们的目标是**治疗流 Van Helsing，我们认为它是环境中的顶级卡组**，它也是我在预选赛中用来晋级、进入周六邀请赛的卡组。

我当时带的是一套纯控制加治疗的阵容，有 Van Helsing，另外几副卡组看起来像别的东西，其实是没有 Van Helsing 的 Van Helsing 治疗卡组。所以我想：大家会借鉴我的做法，而且有这个想法的不只我一个，所以锦标赛里会满是 Van Helsing。结果我们判断对了。

[![Van Helsing，Crimson Cup 上需要击败的卡组：SouL 的阵容就是为碾压它而打造的](/cards/cover/van-helsing.webp)](/zh-cn/cards/van-helsing)

### Merlin：更持续的伤害，更少依赖 Obliterate {#merlin}

最初的想法来自 Nimer。我知道之后跟他说：我觉得你完全是对的，给我看看你的卡组。我看了他的卡组，做了一些改动。

比如 Merlin，他原来的构筑有点“卡手”，怎么说呢：它缺少一种多打出一点伤害的手段，**只能指望连续打出两张 Obliterate**。我不喜欢这种东西，因为如果你的两张 Obliterate 都在卡组最底下……那你就输了！

所以**我加入了 Puck、Jekyll 和 First Aid**，这样就有了帮你控制场面的治疗，而治疗配合 Puck 又能打到对手，帮你把对局收尾。

### Pigs：用 Glinda 和 Sandman 铺出巨型场面 {#pigs}

Three Not So Little Pigs 是三副中组合技成分最少的，因为它打得相当快攻，但这副卡组的目的，尤其是对 Van Helsing 时，是**把资源留在手上，在对手揭示时打出 Glinda 和 Sandman**。

然后你在一个回合里铺满场面，也许是两张 Reinforcements 加上其他 1 法力法术，这副卡组里多的是这种牌，以便**在几个回合里触发 Glinda 五次、六次、七次**，铺出一个巨型场面。通常你会在对手只有 7 法力的时候这么做，这样他们当然就没法用 Forbidden Knowledge 来应对。

这个选择非常成功：7 轮中有 6 轮，我遇到的对手都带了 Van Helsing，所以我只要不禁它，就总能把他们碾过去。除了一轮之外，我每轮都是 2-0 获胜，那一轮我 2-1 赢下，因为对手没有带 Van Helsing：那是我打过的唯一一场胶着的三局两胜。其他的我都是一边倒地赢下来的。

## SouL 的三份卡表 {#ka-biao}

{{decklists}}

## 最好的卡组和需要改的卡组 {#ka-zu}

> “这个 Merlin 不可能输：它绝对需要削弱。”

**Davdas:** 撇开只能说明部分问题的数据，也撇开你手握卡牌时的感觉，如果你允许我这么说的话：哪副卡组表现最好，三副中你会改哪一副？

**SouL:** 说实话，**三副都表现得非常好**。没有哪副卡组掉链子，就连我后来输给 Crono 的决赛也是。

最糟糕的一场失利是 Mulan 的，它输给了 Crono 的 Van Helsing，这本不该发生：我们就是要击败 Van Helsing，而且在瑞士轮最后一轮我恰好就是对上 Crono，2-0 赢了他，把他的 Van Helsing 碾了过去。决赛五局三胜的第一局，我对 Van Helsing 输了，因为出现了一组对我的阵容来说非常不走运的地点组合。

三副卡组都没有发挥失常。我大概唯一不太想要的是 Mulan：他们经常禁我的 Pigs，经常禁我的 Merlin，**却从来没禁过 Mulan**。所以它可能是三副中最弱的，但它补全了这套组合技阵容的最后一环。

**最好的卡组一定是 Merlin**：它不仅是我在游戏里最喜欢的卡组，也绝对是所有卡组中最稳定的。这个 Merlin 不可能输，在我看来它绝对需要削弱：它强得离谱。

[![Merlin，SouL 最喜欢的卡组，在他看来也是阵容中最稳定的一副](/cards/cover/merlin.webp)](/zh-cn/cards/merlin)

## 对阵 CoachCrono 的决赛 {#jue-sai}

**Davdas:** 对阵 Coach 的决赛打得怎么样？从某种意义上说这几乎是一场友谊赛，尽管奖品丰厚，大家也都想拼到最后：能感觉到竞争，但你们对彼此都非常有风度。你们互相认识、互相支持，作为主播有那种社区的感觉，而且还是一场全意大利人的决赛。哪里出了问题？

**SouL:** 先说说 Crono，因为他让我笑了好久。我和 Crono 认识很久了：早在 Teamfight Tactics 的年代我们就一起开始直播。我们不是那种会聊其他话题的朋友，但在游戏、合作和 Twitch 互相 raid 方面我们一直有联系，决赛时我们都很放松。

决赛前我去了他的 Discord，和他以及他的观众聊天，因为 **Crono 拒绝给直播加延迟**。他整个锦标赛都是在可以被“窥屏”的状态下打的，这很要命，因为 Origins 是那种如果你被窥屏、对手能预判你所有操作就会一败涂地的游戏。但他毫不在意。

到了我们俩的决赛，我跟他说：“Crono，求你了，能加个延迟吗？至少能在你的手牌上盖一条黑条吗？我不会窥你的屏，但大家都认识我们：你知道有多少人可能给我传信息吗？我可以把自己关起来、下线，但信鸽还是会从窗户飞进来的！”他说：**“不用，我完全不在乎，我相信你。”**真的太好笑了。

### 第一局、地点和 2-2 {#xi-lie-sai}

其实没什么好说的：**Crono 打得非常好**。第一局的地点对他来说确实非常幸运，他在直播里也承认了，但这很明显，因为我的阵容就是为摧毁他的阵容而打造的。

客观上我是占优的一方，而他之所以能拿下，是因为第一局打得特别好：在那些对我不利、对他有利的地点上，他把握住了每一个机会。他一开始就处于劣势，非常专注，知道自己在决赛里骑的是一匹较弱的马，但他牢牢抓住了机会，在第一局就偷下了胜利。

那一局彻底扭转了形势，因为对手一旦让他的 Van Helsing 赢下一局，**突然间落后的就变成了我**。那时我防守得不错，扳回了两局，把这场比赛拖到了 **2-2**。

决胜局里他的快攻卡组打出了一条精彩的曲线，把我碾压了：那一局根本没有赢的办法，于是他带走了那张著名的金色 Dracula。

[![Koin Games 为 Crimson Cup 冠军 CoachCrono 制作的官方宣传图：1/1 的 Dracula 宣传卡、两整箱补充包和 1,500 美元](/media/news-crimson-cup-winner.webp)](/zh-cn/news/crimson-cup-coachcrono-wins)

## Origins 为什么能成功 {#wei-shen-me}

> “这是一款为竞技而生的游戏。我给它六个月，它就会爆发。”

**Davdas:** 再次祝贺这场比赛、你们的体育精神和成绩，祝贺你，也祝贺 Crono，他很快也会来做客。Origins 现在的优势是什么？是什么让它有可能成为市场上的有力竞争者，并在玩家手中显得与众不同？

**SouL:** 线上卡牌游戏可以说有，也可以说没有，因为在真正专注于竞技的游戏里，在我看来大概只剩下 Hearthstone 了。而它是一款非常老的游戏，很多人都玩过：很多人厌倦了它的竞技圈，也有很多人回来了。

但在一个几乎只有 Hearthstone 的格局里，**肯定还有第二款游戏的位置**，而 Origins 的核心理念完全不同。所以我认为，凭借它的这些想法，成功的条件是具备的。

### 免费竞技 {#mian-fei-jing-ji}

说说个人喜好：这款游戏完全是“免费竞技”（free to compete），他们是这么叫的。**他们把所有卡牌都给你，你可以玩任何卡组**：真的只要两个小时的教程，你就解锁了一切，卡牌到手的速度快到你都来不及全部读一遍。

你可以在最高水平上竞争，在家里就能参加 Crimson Cup 这样的锦标赛，不用花一分钱，还能赢得像 Crono 那样的奖品，**一张编号 1/1 的卡牌**。好吧，它是数字的，但同样编号的实体卡牌能值 3 万、4 万、5 万，甚至 10 万美元。

如果这张卡哪怕只值历史上最值钱的那些卡牌的十分之一，而 Crono 能把它卖给收藏家，或者自己留着，我不知道他打算怎么做，但如果它值 10,000 美元，**那他就是坐在家里赢下了这份奖品**。这是无价的，很多人，尤其是年轻人，都会想要获得这样的机会。

[![Koin Games 的“Zero pay to win”宣传图：每位玩家都能通过赢得对局获得所有卡牌，无需花钱](/media/ls-zero-pay-to-win.webp)](/zh-cn/kickstarter)

### 收藏的良性循环 {#shou-cang}

我玩很多实体卡牌游戏，在那些游戏里参加比赛，也经常旅行，但旅行要花钱，实体卡牌也要花钱：不是每个人都负担得起这种奢侈。

**线上游戏就像一股清新的空气**：我可以随时随地玩，用手机玩，在 Discord 上和朋友一起玩，不需要和任何人见面，哪怕朋友离得很远也行，因为 Origins 对我没有任何限制。

它是免费的，它是一款电子游戏，背后有懂行的人推动它前进，还有收藏的一面，而我们都知道，如今正是收藏在支撑着竞技，因为发现金奖励对所有人来说都是个难题，无论是实体卡牌公司还是数字卡牌公司。

但如果我能发放独一无二的编号卡牌，制作令人惊叹的卡图，花钱请优秀的画师为 Winnie-the-Pooh 或 Merlin 绘制独一无二的插画，并且知道有一天它会被在乎竞技的人在锦标赛中使用，被在乎这类产品的收藏家买下，**那我们就在创造实体卡牌游戏多年来赖以生存的良性循环**。

[![Koin Games 关于 Collector Pack 的宣传图：异画、Frame Broken 和 Storybook 卡牌及其出现概率](/media/ls-collector-pack.webp)](/zh-cn/kickstarter)

我认为这款游戏诞生、成长并拥有长久竞技生命所需的条件都已具备，而这正是它的创造者想赋予它的。我最喜欢 Origins 的恰恰就是这一点：它是一款为竞技而生的游戏。

就像它的创造者 Timothy 常说的：我们想做出最好的竞技类线上卡牌游戏，因为现在还没有这样的游戏。我给它六个月，它就会爆发。

## 他给 Koin Games 的建议 {#jian-yi}

**Davdas:** 你现在会给 Origins 什么建议？这款游戏天生借鉴了我们已经熟悉的游戏，但它做得非常好：它把可玩性、重玩价值、延续性和乐趣编织在一起，汲取了其他作品中最好的东西，或者至少是最好的想法。我首先想到的是你提到的 Hearthstone，还有 Artifact、Snap，这些游戏都在市场上有过高光时刻，有的持续得更久，有的玩家更多，各有各的故事。

我们喜欢 Origins，它的理念正让我们越来越着迷，但它还没有正式推出：外面很多玩家甚至不知道它的存在，我们现在的卡牌并不是真正意义上的第一套系列，我们打锦标赛时用的东西，在部分卡牌和部分机制上还显得不够完整。然而它已经有了非常鲜明的个性。如果你能就接下来的步骤给 Origins 提建议，你会说什么？

**SouL:** 我还是从非常个人的喜好出发，因为你说的每一点都很到位。我认为他们正处在一个转型阶段，而这个转型就发生在今天，随着 Kickstarter 的上线。

我给这样一款游戏的建议是**永远不要改变**，因为在我看来，很多游戏犯下的一个大错就是改变。他们必须建立自己的受众，而他们的受众是不同的：**那是一群竞技玩家和收藏家**。如果从现在起他们永远不改变自己的愿景，我认为他们会有光明的未来。

也许不会有爆炸式的增长，不像他们如果更多地迎合市场的短期需求可能得到的那样，但如果他们坚持自己的个性，就能建立起**一批可能永远不会停止玩这款游戏的核心受众**。

说到底，我们谈论的是一款追求竞技和收藏的游戏，所以这需要时间，很多很多时间：制作卡图、建立竞技社区、举办锦标赛、吸引外面的竞技玩家，包括那些现在还不玩 Origins、但他们的意见能影响别人的人，让他们说：“这款游戏很酷，来试试锦标赛吧，在家就能玩，完全免费。”这就是他们必须作为产品个性传播出去的东西，我认为只要他们永不改变，就能做到。

SouL 提到的 Kickstarter 就是 Alpha Edition 的那一个：奖励、概率和日期都在我们的 [Kickstarter 页面](/zh-cn/kickstarter)上。

## 玩家希望在 OriginsMeta 这样的网站上找到什么 {#originsmeta}

**Davdas:** 谢谢你来到 OriginsMeta。能在隔了一段时间之后再次见到你、和你聊一聊，对我来说是一种荣幸，也希望以后能更常这样。

**SouL:** 等我在另一场锦标赛里再拿个第二，我就回来！*（笑）*

**Davdas:** 相信我，我们会邀请你来做更多事情的。OriginsMeta，也就是我们现在所在的这个网站，是一个想要全力支持这款游戏的平台。我们和 Koin Games 的人保持着直接联系，他们正在发行这款游戏、向全世界介绍它，而我们也在尽一切努力用工具和社区来支持它。从你的角度来看，当你访问一个如此深入报道你喜欢的游戏的网站时，你希望找到什么？除了一个可以浏览卡牌列表的舒适区之外，你还想要什么？

**SouL:** 我这么说可能显得有偏向，但我想跟你说实话：**你们已经有了**。我在锦标赛中就用了你们的网站，看数据。我是工科背景，但撇开这个不说，我一直热爱统计：**对我来说，统计就是一切**。

我的阵容正是源于 Van Helsing 明显是所有卡组中最强的这一事实，所以我想要一套能击败它的阵容。而我是通过查看其他锦标赛和排行榜的数据发现这一点的，**用的正是你们网站收集的数据**。所以对我来说，这是永远不能缺少的东西。

一款竞技游戏需要统计数据，也需要懂得解读它们的人，而你们能给玩家的一种支持，不仅是呈现统计数据，还要**通过像这篇这样的文章提供对数据的解读**，邀请那些对环境有自己见解的人来分享。对我来说，这正是我参与的游戏中不可或缺的、极其宝贵的附加价值。

[![OriginsMeta 页面上 Crimson Cup 四场预选赛中传说卡的禁用率：Van Helsing 在每一场都是被禁用最多的](/media/news-soul-ban-rate-en.webp)](/zh-cn/analytics/crimson-cup#across)

SouL 提到的数据都在我们的 [Crimson Cup 页面](/zh-cn/analytics/crimson-cup#across)上：在 Koin 公布了官方数据表的四场预选赛中，**Van Helsing 始终是被禁用最多的传说卡**，Merlin 总体排第二，Mulan 则远远落后。天梯数据来自用 OriginsMeta Tracker 记录的对局，在 [Analytics](/zh-cn/analytics) 中。

**Davdas:** 谢谢你，SouL，非常感谢你的分享和建议，最重要的是，再次祝贺你取得这么好的成绩。

**SouL:** 谢谢你，也谢谢 OriginsMeta。`,
  },
};
