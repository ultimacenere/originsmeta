import type { GuideCopy, GuideSlug } from "./guides";

/**
 * Testi in cinese semplificato delle guide della redazione (04/11/2026, ottava lingua del sito), le prime dieci (da origins-tcg-legendaries a three-pigs-midrange-guide; le altre in guides-zh-cn-b.ts): solo i testi,
 * il resto dalla versione inglese di guides.ts. Glossario, tono e ancore in pinyin: docs/cinese.md.
 */
export const zhCnTextA: Partial<Record<GuideSlug, GuideCopy>> = {
  "origins-tcg-legendaries": {
    title: "Origins TCG 的 12 张传说卡：卡牌、数据、补丁与卡组",
    metaTitle: "Origins TCG 传说卡：全部 12 张及其卡组",
    excerpt: "Origins TCG 全部 12 张可用传说卡一览：每张卡的费用、力量与生命值、卡牌文本、它们会生成的卡牌、历次平衡补丁的改动，以及在 OriginsMeta 上使用它们的卡组。每张卡都附有卡牌页面和卡组攻略的链接，方便你在构筑前逐一查看和比较。",
    faq: [
      {
        q: "Origins TCG 有多少张传说卡？",
        a: "可用的有十二张：2026年9月22日在游戏中核对过的 Dorothy、Dracula、Mulan、Queen of Hearts、Van Helsing、Wicked Stepmother、Merlin、King Arthur、Legion of the Dead、Three Not So Little Pigs 和 Robin Hood，以及随 2026年11月4日的补丁进入游戏、尚未在游戏中核对的 Dr. Frank。OriginsMeta 数据库里还保留着另外八张已经不在游戏中的传说卡。",
      },
      {
        q: "一副卡组可以放几张传说卡？",
        a: "一张。一副卡组由一张传说卡加十二张基础卡组成，每张基础卡各有两份，总共 25 张。在 Conquest 中你要带不止一副卡组：Big Bob's Playtest Battle 要求每副卡组的传说卡各不相同；Crimson Cup 的公告没有说明，我们的卡组构筑器会提示两副卡组用了同一张传说卡。",
      },
      {
        q: "哪张传说卡带领的卡组最多？",
        a: "截至 2026年9月25日是 Three Not So Little Pigs，在 OriginsMeta 上发布的 20 副卡组中带领了 4 副；Van Helsing 带领 3 副，Wicked Stepmother 一副也没有。这衡量的是在本站的人气，而不是强度，实时统计在强度榜的“最常用”页面。",
      },
      {
        q: "有传说法术吗？",
        a: "有，可用的传说卡中只有一张：Legion of the Dead，一张 7 法力的法术，会用 2/2 的 Zombie 填满你的战场。",
      },
    ],
    body: `
## 简而言之 {#jian-er-yan-zhi}

- Origins TCG 自 2026年10月27日起在 Steam 抢先体验中免费游玩，目前共有**十二张可用传说卡**：六张费用为 4 法力，一张为 5，一张为 6，三张为 7，一张为 8。第十二张是 Dr. Frank，随 [2026年11月4日的补丁](/zh-cn/news/balance-patch-1104-cyber-queen)进入游戏。
- 其中十一张是单位，一张是法术，即 Legion of the Dead。五张属于 Good，四张属于 Evil，三张属于 Neutral。
- 有四张会通过卡牌文本生成其他卡牌：Dracula、Van Helsing、Legion of the Dead 和 Three Not So Little Pigs。
- 在 11月之前就已在游戏中的十一张里，有七张在 2026年8月至 9月21日之间的平衡补丁中被改动过；Dracula、Van Helsing、Legion of the Dead 和 Robin Hood 没有变化。2026年9月29日的 [0.7 补丁](/zh-cn/news/patch-0-7)没有调整其中任何一张，2026年11月4日的补丁则让 Dorothy 变为 3/3。
- 截至 2026年9月25日 20:00 CEST 在 OriginsMeta 上发布的 20 副卡组，用到了当时游戏中十一张传说卡里的十张：Three Not So Little Pigs 带领四副，Van Helsing 三副，Wicked Stepmother 一副也没有。有六张传说卡拥有 OriginsMeta 为其某副卡组撰写的攻略。

下面的传说卡按费用排序，费用相同时按字母顺序排列。本攻略介绍每张卡的作用，而不是它有多强：想看强弱，可以看 [Analytics 中按传说卡统计的胜率](/zh-cn/analytics)（来自 OriginsMeta Tracker 记录的对局），以及汇集各项实时榜单的 [Origins TCG 强度榜](/zh-cn/tier-list)。OriginsMeta 的档位只会依据锦标赛结果和[排位天梯](/zh-cn/guides/origins-tcg-ranked)顶端的数据。

## 12 张传说卡一览 {#yi-lan}

| 传说卡 | 费用 | 力量/生命值 | 阵营 | 卡组 |
| --- | --- | --- | --- | --- |
| [Dorothy](/zh-cn/cards/dorothy) | 4 | 3/3 | Good | 2 |
| [Dracula](/zh-cn/cards/dracula) | 4 | 3/2 | Evil | 2 |
| [Mulan](/zh-cn/cards/mulan) | 4 | 2/4 | Good | 1 |
| [Queen of Hearts](/zh-cn/cards/queen-of-hearts) | 4 | 3/3 | Evil | 2 |
| [Van Helsing](/zh-cn/cards/van-helsing) | 4 | 3/4 | Good | 3 |
| [Wicked Stepmother](/zh-cn/cards/wicked-stepmother) | 4 | 4/6 | Evil | 0 |
| [Merlin](/zh-cn/cards/merlin) | 5 | 5/5 | Neutral | 1 |
| [Dr. Frank](/zh-cn/cards/dr-frank) | 6 | 2/2 | Evil | 0 |
| [King Arthur](/zh-cn/cards/king-arthur) | 7 | 7/7 | Good | 2 |
| [Legion of the Dead](/zh-cn/cards/legion-of-the-dead) | 7 | 法术 | Neutral | 2 |
| [Three Not So Little Pigs](/zh-cn/cards/three-not-so-little-pigs) | 7 | 3/3 | Neutral | 4 |
| [Robin Hood](/zh-cn/cards/robin-hood) | 8 | 4/4 | Good | 1 |

最后一列统计的是，在 2026年9月15日至 9月25日 20:00 CEST 期间于 OriginsMeta 发布的 20 副卡组中，每张传说卡带领了几副；那时 Dr. Frank 还没有进入游戏。它衡量的是在本站的人气，而不是强度或胜率；实时统计见[最常用](/zh-cn/tier-list/most-played)。

## 传说卡在卡组中的作用 {#zai-ka-zu-zhong}

- **每副卡组一张。** 一副卡组由一张传说卡加十二张基础卡组成，游戏会为每张基础卡自动加入第二份：根据 Koin Games 团队的 AMA，对局中共有 25 张牌。[卡组构筑器](/zh-cn/deck-builder) 会检查这条规则。
- **对手看得到它。** 封闭测试的 0.6.1 补丁（2026年8月14日）加入了在调度（mulligan）阶段预览对手传说卡的功能，见[官方补丁说明](https://store.steampowered.com/news/app/4429430/view/1840944183780414)。
- **在 Conquest 中它就是卡组的名字。** 在 Crimson Cup 中每位玩家带三副卡组，当你禁用对手的一副卡组时，你只能看到它的传说卡（[Crimson Cup 规则](/zh-cn/news/crimson-cup-format-check-in)）。公告没有说明三张传说卡是否必须不同；在 Big Bob's Playtest Battle 中是必须的。如何组合三副卡组：见我们的 [Conquest 攻略](/zh-cn/guides/origins-tcg-conquest)。

除 Dr. Frank 外，下面引用的卡牌文本都是 OriginsMeta 根据游戏内官方英文文本翻译的中文版本，尚未与游戏内的简体中文文本逐一核对。Dr. Frank 于 2026年11月4日进入游戏，我们还没有在游戏中读到他的卡牌：他的文本译自官方卡牌。费用和数据于 2026年9月22日逐张核对。传说出处和每个传说的介绍由 OriginsMeta 撰写。补丁为 [MetaShifting](/zh-cn/metashifting) 中追踪的那些：试玩测试更新 0.6.1、0.6.2 和 0.6.3（2026年8月）、2026年9月21日的试玩版补丁、2026年9月29日没有调整任何传说卡的 0.7 补丁，以及 2026年11月4日的补丁，它让 Dorothy 变为 3/3，并带来了 Dr. Frank；2026年10月27日的 0.8 补丁说明是抢先体验的第一份补丁说明，没有提到卡牌改动。这里不介绍传说之力：我们还没有从游戏中把它记录下来，记录之后会显示在每张卡的页面上。

## Dorothy {#dorothy}

**4 法力 · 3/3 · 单位 · Good** · 出处：绿野仙踪

> 我每回合都可以移动。
>
> 本局对局中友方每移动一次，我获得 +1⚔️/+1❤️。

- **传说。** L. Frank Baum 1900 年的小说中，被龙卷风带到奥兹国的堪萨斯女孩。
- **补丁。** 2026年9月21日的试玩版补丁：法力 5 → 4（[补丁说明](/zh-cn/news/demo-patch-notes-0921)）；2026年11月4日的补丁：从 1/1 变为 3/3（[补丁说明](/zh-cn/news/balance-patch-1104-cyber-queen)）。
- **OriginsMeta 上的卡组，2026年9月25日。** 两副：[Dorothy Combo](/zh-cn/decks/community/dorothy-combo-7503) 和 [Move/Combo](/zh-cn/decks/community/move-combo-075a)。
- **攻略。** [Dorothy 卡组攻略：Dorothy Combo](/zh-cn/guides/dorothy-combo-guide)。
- **卡牌页面。** [Dorothy，传说卡：数据与文本](/zh-cn/cards/dorothy)。

## Dracula {#dracula}

**4 法力 · 3/2 · 单位 · Evil** · 出处：哥特恐怖

> 当你弃牌时，将我从你的墓地移回手牌。
>
> 揭示时：召唤 Brides of Dracula [2⚔️/2❤️] 到此处的一个随机格位。

- **传说。** Bram Stoker 1897 年小说中的特兰西瓦尼亚伯爵。
- **生成的卡牌。** [Brides of Dracula](/zh-cn/cards/brides-of-dracula)，一个 2/2，根据其文本，它会对所在地点的对手屏障造成 1 点伤害，并在你每次弃一张牌时获得 +1❤️（生成的卡牌：其文本未在游戏中核实）。
- **补丁。** Dracula 没有变化。Brides of Dracula 在 0.6.2 补丁中从 3 法力降到 2 法力（[补丁说明](/zh-cn/news/patch-0-6-2)）。
- **OriginsMeta 上的卡组，2026年9月25日。** 两副：[Discard](/zh-cn/decks/community/discard-8bff) 和 [Dracula SUPER FUN](/zh-cn/decks/community/dracula-super-fun-d936)。
- **攻略。** 暂无：[把你的攻略发给我们](/zh-cn/guides/submit)。
- **卡牌页面。** [Dracula，传说卡：数据与文本](/zh-cn/cards/dracula)。

## Mulan {#mulan}

**4 法力 · 2/4 · 单位 · Good** · 出处：木兰辞

> 连击
>
> 当友方的揭示时能力触发时，重复一次。

- **传说。** 出自中国南北朝民歌《木兰辞》，代父从军的女战士。
- **补丁。** 0.6.2 补丁：数据不变，在重复友方揭示时（On Reveal）能力之外，她还获得了连击（Double Attack）（[补丁说明](/zh-cn/news/patch-0-6-2)）。
- **OriginsMeta 上的卡组，2026年9月25日。** 一副：[On Reveal Mid Range](/zh-cn/decks/community/on-reveal-mid-range-772e)。
- **攻略。** [Mulan 卡组攻略：On Reveal Mid Range](/zh-cn/guides/on-reveal-midrange-guide)。
- **卡牌页面。** [Mulan，传说卡：数据与文本](/zh-cn/cards/mulan)。

## Queen of Hearts {#queen-of-hearts}

**4 法力 · 3/3 · 单位 · Evil** · 出处：仙境

> 先攻
>
> 当友方的死亡时能力触发时，重复一次。

- **传说。** 仙境中暴躁的女王，对一切的回答都是“砍掉他们的头！”。
- **补丁。** 0.6.2 补丁：从 5 法力 3/5 改为 4 法力 3/3，在重复友方死亡时（On Death）能力之外，她还获得了先攻（First Strike）（[补丁说明](/zh-cn/news/patch-0-6-2)）。
- **OriginsMeta 上的卡组，2026年9月25日。** 两副：[Qoh](/zh-cn/decks/community/qoh-f876) 和 [Just f\\*\\*\\*in em](/zh-cn/decks/community/just-f-in-em-bdf2)。
- **攻略。** 暂无：[把你的攻略发给我们](/zh-cn/guides/submit)。
- **卡牌页面。** [Queen of Hearts，传说卡：数据与文本](/zh-cn/cards/queen-of-hearts)。

## Van Helsing {#van-helsing}

**4 法力 · 3/4 · 单位 · Good** · 出处：哥特恐怖

> 战斗前，如果 Van Helsing's Tools 不在你的手牌中，将其加入你的手牌。

- **传说。** Abraham Van Helsing，带领众人追捕 Dracula 的荷兰教授。
- **生成的卡牌。** [Van Helsing's Tools](/zh-cn/cards/van-helsings-tools)，让你从四张生成的卡牌中选择一张打出：[Holy Water](/zh-cn/cards/holy-water)、[Silver Bullet](/zh-cn/cards/silver-bullet)、[Garlic](/zh-cn/cards/garlic) 或 [Wooden Stake](/zh-cn/cards/wooden-stake)（生成的卡牌：其文本未在游戏中核实，Silver Bullet 的页面仍显示 0.6.2 补丁之前的文本；改动记录在它的平衡历史中）。
- **补丁。** Van Helsing 本身没有变化。0.6.2 补丁中 Van Helsing's Tools 变为免费（1 → 0 法力），它生成的 Silver Bullet 从 3 点伤害降到 1 点（[补丁说明](/zh-cn/news/patch-0-6-2)）；2026年9月21日的试玩版补丁之后，Silver Bullet 也可以指定屏障为目标，Wooden Stake 可以指定生命值全满的角色为目标，但如果目标在揭示时没有受伤，它仍然会失效（[补丁说明](/zh-cn/news/demo-patch-notes-0921)）。
- **OriginsMeta 上的卡组，2026年9月25日。** 三副：[Healing Healsing](/zh-cn/decks/community/healing-healsing-9411)、[Cure Control](/zh-cn/decks/community/cure-control-b630) 和 [CONTROL](/zh-cn/decks/community/control-2c2b)。
- **攻略。** [Van Helsing 卡组攻略：Healing Healsing](/zh-cn/guides/healing-healsing-guide) 以及[它的对局分析](/zh-cn/guides/healing-healsing-matchups)。
- **卡牌页面。** [Van Helsing，传说卡：数据与文本](/zh-cn/cards/van-helsing)。

## Wicked Stepmother {#wicked-stepmother}

**4 法力 · 4/6 · 单位 · Evil** · 出处：童话

> 死触
>
> 揭示时：给予你的邪恶角色死触。

- **传说。** 童话中的恶毒继母，从 Cinderella 的家到白雪公主的宫廷都有她的身影。
- **补丁。** 2026年9月21日的试玩版补丁：力量 3 → 4（[补丁说明](/zh-cn/news/demo-patch-notes-0921)）。
- **OriginsMeta 上的卡组，2026年9月25日。** 目前发布的 20 副中一副也没有：在[卡组构筑器](/zh-cn/deck-builder)里组一副，并附上攻略发布吧。
- **攻略。** 暂无：[把你的攻略发给我们](/zh-cn/guides/submit)。
- **卡牌页面。** [Wicked Stepmother，传说卡：数据与文本](/zh-cn/cards/wicked-stepmother)。

## Merlin {#merlin}

**5 法力 · 5/5 · 单位 · Neutral** · 出处：亚瑟王传说

> 重复你每回合打出的第一个法术。

- **传说。** 从蒙茅斯的杰弗里到马洛礼的笔下，促成亚瑟出生并辅佐他登上王位的巫师。
- **补丁。** 0.6.3 补丁：从 3/5 改为 5/5，+2 力量（[补丁说明](/zh-cn/news/patch-0-6-3)）。
- **OriginsMeta 上的卡组，2026年9月25日。** 一副：Spellcast。
- **攻略。** 暂无：[把你的攻略发给我们](/zh-cn/guides/submit)。
- **卡牌页面。** [Merlin，传说卡：数据与文本](/zh-cn/cards/merlin)。

## Dr. Frank {#dr-frank}

**6 法力 · 2/2 · 单位 · Evil** · 出处：哥特恐怖

> 战斗前，从你的墓地召唤一个随机角色到一个随机格位。

- **最新的传说卡。** 他随 [2026年11月4日的补丁](/zh-cn/news/balance-patch-1104-cyber-queen)进入游戏，是第 11 位首领 Cyber Queen 所用 Relentless 卡组中的传说卡，同时到来的还有另外七张卡（[Dr. Frank 的八张新卡](/zh-cn/news/dr-frank-boss-new-cards)）。上面的文本译自官方卡牌：我们还没有在游戏中读到它。
- **传说。** 维克多·弗兰肯斯坦，在玛丽·雪莱 1818 年的小说中拼造出活物的学生。
- **围绕他的卡牌。** [It's Alive](/zh-cn/cards/its-alive)，一张 3 法力的法术，效果与他相同，但只生效一次；还有两张具有重生（Rebirth）的卡，[Frank's Monster](/zh-cn/cards/franks-monster) 和 [Franken Bride](/zh-cn/cards/franken-bride)。在创作者们的预览中，他的传说之力会在对局开始时把 It's Alive 放入你的手牌。
- **补丁。** 自进入游戏以来没有改动。
- **OriginsMeta 上的卡组，2026年9月25日。** 一副也没有：那时他还不在游戏中。现在有多少卡组使用他，见[最常用](/zh-cn/tier-list/most-played)。
- **攻略。** 暂无：[把你的攻略发给我们](/zh-cn/guides/submit)。
- **卡牌页面。** [Dr. Frank，传说卡：数据与文本](/zh-cn/cards/dr-frank)。

## King Arthur {#king-arthur}

**7 法力 · 7/7 · 单位 · Good** · 出处：亚瑟王传说

> 护盾
>
> 揭示时：给予你的善良角色护盾。

- **传说。** 不列颠永恒之王，他从石中拔出宝剑，召集了圆桌骑士。
- **补丁。** 0.6.3 补丁：从 5/5 改为 7/7（[补丁说明](/zh-cn/news/patch-0-6-3)）。
- **OriginsMeta 上的卡组，2026年9月25日。** 两副：[King of Value Trade](/zh-cn/decks/community/king-of-value-trade-fd14) 和 [Glinda Reborn](/zh-cn/decks/community/glinda-reborn-2d6d)。
- **攻略。** [King Arthur 卡组攻略：King of Value Trade](/zh-cn/guides/king-of-value-trade-guide)。
- **卡牌页面。** [King Arthur，传说卡：数据与文本](/zh-cn/cards/king-arthur)。

## Legion of the Dead {#legion-of-the-dead}

**7 法力 · 法术 · Neutral** · 出处：哥特恐怖

> 用 Zombie [2⚔️/2❤️] 填满你的战场。

- **游戏中唯一的传说法术。**
- **传说。** 复活的亡者大军，死灵法师的最后手段。
- **生成的卡牌。** [Zombie](/zh-cn/cards/zombie)，2/2 的生成卡牌，数量为填满你的战场所需的张数。
- **补丁。** 没有改动。
- **OriginsMeta 上的卡组，2026年9月25日。** 两副：[The Trick-or-Treat Legion](/zh-cn/decks/community/the-trick-or-treat-legion-72c4) 和 [FACE IS THE PLACE](/zh-cn/decks/community/face-is-the-place-b049)。
- **攻略。** [Legion of the Dead 卡组攻略](/zh-cn/guides/trick-or-treat-legion-guide)。
- **卡牌页面。** [Legion of the Dead，传说卡：数据与文本](/zh-cn/cards/legion-of-the-dead)。

## Three Not So Little Pigs {#three-not-so-little-pigs}

**7 法力 · 3/3 · 单位 · Neutral** · 出处：童话

> 践踏
>
> 揭示时：召唤一只具有践踏的 Not So Little Pig [3⚔️/3❤️] 到其他每个地点的一个随机格位。

- **传说。** 用稻草、木棍和砖头盖房子的三只小猪，长大了，可没那么容易被吹倒。
- **生成的卡牌。** [Not So Little Pig](/zh-cn/cards/not-so-little-pig)，一个具有践踏（Trample）的 3/3，另外两个地点各一只。
- **补丁。** 0.6.2 补丁：从 4/4 改为 3/3，它召唤的小猪也相应变为 3/3（[补丁说明](/zh-cn/news/patch-0-6-2)）。
- **OriginsMeta 上的卡组，2026年9月25日。** 四副：[3 Pigs Mid Range](/zh-cn/decks/community/3-pigs-mid-range-6311)、[Value Board](/zh-cn/decks/community/value-board-c44a)、[VALUE MAXXING](/zh-cn/decks/community/value-maxxing-739d) 和 [AGGRO /MIDRANGE PIGS GM](/zh-cn/decks/community/aggro-midrange-pigs-gm-6931)。
- **攻略。** [Three Not So Little Pigs 卡组攻略](/zh-cn/guides/three-pigs-midrange-guide) 以及[它的对局分析](/zh-cn/guides/three-pigs-midrange-matchups)。
- **卡牌页面。** [Three Not So Little Pigs，传说卡：数据与文本](/zh-cn/cards/three-not-so-little-pigs)。

## Robin Hood {#robin-hood}

**8 法力 · 4/4 · 单位 · Good** · 出处：舍伍德

> 狙击 3
>
> 揭示时：对所有敌方造成 2 点伤害。

- **游戏中唯一一张 8 法力的传说卡。**
- **传说。** 舍伍德森林的绿林弓箭手，劫富济贫，自 14 世纪起便在民谣中传唱。
- **补丁。** 没有改动。
- **OriginsMeta 上的卡组，2026年9月25日。** 一副：[Buff](/zh-cn/decks/community/buff-6f60)。
- **攻略。** 暂无：[把你的攻略发给我们](/zh-cn/guides/submit)。
- **卡牌页面。** [Robin Hood，传说卡：数据与文本](/zh-cn/cards/robin-hood)。

## 已不在游戏中的传说卡 {#bu-zai-you-xi-zhong}

我们的数据库还保留着八张已经不在游戏中的传说卡：[Alice](/zh-cn/cards/alice)、[Beowulf](/zh-cn/cards/beowulf)、[Cinderella](/zh-cn/cards/cinderella)、[Death](/zh-cn/cards/death)、[Mirror Mirror](/zh-cn/cards/mirror-mirror)、[Red](/zh-cn/cards/red)、[Winnie-the-Pooh](/zh-cn/cards/winnie-the-pooh) 和 [Wizard of Oz](/zh-cn/cards/wizard-of-oz)。它们的页面保留着最后已知的数据，这些数据未在游戏中核实。Dr. Frank 原本也是其中之一，直到 2026年11月4日的补丁让他进入了游戏。团队在 AMA 中描述过一次包含完整传说卡阵容的正式发布：我们已知的日期都在[路线图](/zh-cn/guides/roadmap-and-dates)中。

## 数据来源 {#shu-ju-lai-yuan}

- **卡牌：** OriginsMeta [卡牌数据库](/zh-cn/cards)：可用卡牌的费用、数据和英文文本于 2026年9月22日在游戏中逐张核对，中文文本为 OriginsMeta 的翻译，尚未与游戏内文本核对。数据为 2026年11月4日补丁的版本。Dr. Frank 的费用、数据和文本来自 Koin Games 于 2026年11月2日公布的官方卡牌，尚未在游戏中核对。
- **补丁：** Steam 上的官方补丁说明，在 [MetaShifting](/zh-cn/metashifting) 中逐卡整理。
- **卡组：** 2026年9月15日至 9月25日 20:00 CEST 在 OriginsMeta 发布的 20 副卡组（[所有 Origins TCG 卡组](/zh-cn/decks)）；之后的统计见[最常用](/zh-cn/tier-list/most-played)。

每当补丁改动传说卡或游戏加入新的传说卡时，我们都会更新本攻略。
`,
  },
  "origins-tcg-ranked": {
    title: "Origins TCG 排位赛：Grandmaster、段位与抢先体验第一赛季",
    metaTitle: "Origins TCG 排位：Grandmaster、第一赛季与 VP",
    excerpt: "Origins TCG 排位赛全解：游戏自 2026年10月27日起进入抢先体验，本文介绍 Grandmaster 段位及其全球排行榜、第一赛季的时间与限定奖励、胜利点数（VP）的增减规则，以及封闭测试期间官方补丁说明透露的天梯信息和我们仍不知道的事情。",
    faq: [
      {
        q: "Origins TCG 的排位赛是什么时候开放的？",
        a: "2026年10月15日，随着 Koin Games 在 Steam 上名为“Ranked is here!”的更新开放，比 Steam Next Fest 早了四天；9月21日团队曾表示排位会在新品节开始时上线。自 2026年10月27日起，排位赛在游戏的抢先体验版本（0.8 更新）中进行。",
      },
      {
        q: "Origins TCG 的最高段位是什么？",
        a: "Grandmaster，天梯的最高段位。2026年10月27日的 0.8 更新开放了 Grandmaster 段位并启用了 Grandmaster 排行榜，所有 Grandmaster 玩家在榜上争夺全球排名。",
      },
      {
        q: "排位赛有什么奖励？",
        a: "对于抢先体验的第一个排位赛季，Koin Games 宣布将为以最高段位结束赛季的玩家提供限定奖励，其中包括纪念其排名的奖励。根据 11月6日的路线图 AMA，第一赛季于 2026年12月2日结束。",
      },
      {
        q: "试玩版的进度会转移到抢先体验吗？",
        a: "会。Koin Games 2026年10月27日的公告写道，你的账号、收藏、进度“以及其他一切现在都在 Origins 的抢先体验版本中”；在官方 Discord 上，工作室负责人补充说试玩版可以卸载了。",
      },
    ],
    body: `
## 简而言之 {#jian-er-yan-zhi}

- 排位模式于 **2026年10月15日** 开放，比 Steam Next Fest 早四天，Koin Games 将这次更新命名为“Ranked is here!”。自 **2026年10月27日** 起，排位在 Origins TCG 的抢先体验版本中进行，游戏在 Steam 上免费（0.8 更新）。
- 0.8 更新开放了 **Grandmaster 段位**，并启用了 **Grandmaster 排行榜**，所有 Grandmaster 玩家在榜上争夺全球排名：在此之前，天梯止步于 Grandmaster 门前。
- 抢先体验的**第一个排位赛季**根据 [11月6日的路线图 AMA](/zh-cn/news/origins-tcg-roadmap-ama-recap) 于 2026年12月2日结束，之后每个赛季持续六周；以最高段位结束赛季的玩家将获得限定奖励。
- 封闭测试的官方补丁说明在 8月确认了：段位、Grandmaster 为最高段位，以及在排位对局中赢得和失去的**胜利点数**（VP）：说明中提到 +10 和 −10 的变化，而自 0.6.2 补丁起，房间对战不再给予 VP。

每当有关于排位的新公告，我们都会更新本攻略。

## 排位何时开放 {#he-shi-kai-fang}

2026年9月21日，在关于[试玩版第一次大更新](https://store.steampowered.com/news/app/4429430/view/1844115010502611)的公告中，Koin Games 写道，将“在 Steam Next Fest 开始时开启排位模式，并附带独家排位奖励”。9月24日，官方 Discord 上的 Crimson Cup 公告再次提到这一点（[我们的文章](/zh-cn/news/crimson-cup-format-check-in#demo-playtest)）。

排位提前四天到来：2026年10月15日，[“Ranked is here!”](https://store.steampowered.com/news/app/4429430/view/1846651706679257)更新开启了排位，天梯暂时止步于 Grandmaster。随后 [Steam Next Fest](https://store.steampowered.com/sale/nextfest) 于 10月19日至 26日举行，Crimson Cup 也同期进行：关于新品节的一切都在我们的 [Steam Next Fest 攻略](/zh-cn/guides/steam-next-fest-2026)中。

2026年10月27日，试玩版结束，Origins TCG 通过 0.8 更新进入抢先体验（[Koin 的公告](https://store.steampowered.com/news/app/4429430/view/1847286114049982)）。团队写道：“排位天梯的顶端终于开放了”：玩家现在可以晋升到 Grandmaster 段位，Grandmaster 排行榜也已启用。抢先体验第一赛季为以最高段位结束的玩家准备了限定奖励，其中包括纪念其排名的奖励；第一赛季将于 12月2日结束。

## 测试期天梯告诉我们什么 {#ce-shi-qi-tian-ti}

从 8月中旬到 2026年10月15日封闭测试关闭，排位一直在封闭测试中运行，有三份官方补丁说明描述了它：

- **0.6.1 补丁，2026年8月14日。** 排位天梯是这次更新的重点，“Grandmaster 段位拥有全球排位排行榜”（[补丁说明](https://store.steampowered.com/news/app/4429430/view/1840944183780414)）。该版本的一个已知漏洞：玩家到达 Grandmaster 后，VP（胜利点数）显示会出错。
- **0.6.2 补丁，2026年8月21日。** Grandmaster 联赛现在会正确显示每位玩家的排名、VP 和段位，房间对战不再给予 VP。该版本的两个已知漏洞：VP 的得失是正常的，但总数变化时显示的 +10 和 −10 暂时消失了；Grandmaster 对局结束时不显示 VP 变化，尽管点数确实在变化（[补丁说明](https://store.steampowered.com/news/app/4429430/view/1841579228669961)）。
- **0.6.3 补丁，2026年8月27日。** 在最高段位中，结算界面显示的是占位数值而不是玩家自己的数据；现在段位、VP 总数和 VP 变化都能正确显示，+10 和 −10 不再叠在变化中的 VP 总数上，对局结束时应当总能显示结果、胜利点数和排名（[补丁说明](https://store.steampowered.com/news/app/4429430/view/1842212951301184)）。

综合起来：天梯由多个段位组成，**Grandmaster 是最高段位**（0.6.3 补丁称之为“最高段位”），拥有为每位玩家排名的全球排行榜；排位对局会改变你的胜利点数，测试期说明中的变化为 +10 或 −10（自 0.6.2 起房间对战不会）。说明中提到的“Diamond IV”只是错误显示的占位数值之一：它们没有列出 Grandmaster 以下的段位。我们对第一个排位补丁的总结见 [0.6.1 补丁：排位天梯与 Grandmaster](/zh-cn/news/patch-0-6-1-ranked)。

## 排位与卡组解锁 {#ka-zu-jie-suo}

在封闭测试中，根据玩家 2026年9月14日在 Steam 论坛上的说法，赢下三场排位再加上击败一次 AI 首领，就能解锁一副卡组；一位开发者回复说，团队正在考虑让这些解锁对局只限 PvE（[我们的文章](/zh-cn/news/playtest-feedback-deck-unlock)）。在 9月21日的试玩版更新中，Koin 确认每个人都保留了试玩版或测试中进度更靠前的那一份（[我们的文章](/zh-cn/news/demo-first-big-update#progress)）。随着 2026年10月27日进入抢先体验，一切又迁移了一次：账号、收藏和进度现在都在抢先体验版本中。

## 现在在哪里玩排位 {#zai-na-li-wan}

- **Origins TCG** 自 2026年10月27日起在 [Steam](https://store.steampowered.com/app/4429430/Origins_TCG/) 抢先体验中免费游玩，排位就在其中。试玩版已经结束，其进度已转移到抢先体验：Koin 的工作室负责人在官方 Discord 上写道，试玩版可以卸载了。
- **封闭测试**从 8月起就有排位，已于 2026年10月15日关闭。
- 准备卡组：[卡组构筑器](/zh-cn/deck-builder)和社区发布的[所有 Origins TCG 卡组](/zh-cn/decks)，每副都附有可粘贴到 Origins 中的游戏代码（KGBLDC…）。带领这些卡组的 [12 张传说卡](/zh-cn/guides/origins-tcg-legendaries)在我们的攻略中逐一介绍。
- 对于用三副卡组以 Conquest 赛制进行的锦标赛，比如 CoachCrono 于 2026年10月25日夺冠的 Crimson Cup：见[如何构筑三副卡组](/zh-cn/guides/origins-tcg-conquest)。

## OriginsMeta 将如何利用排位 {#originsmeta}

Crimson Cup 决赛已于 2026年10月25日举行。OriginsMeta 的档位只依据锦标赛结果和排位天梯顶端的数据；截至 2026年11月9日，[强度榜](/zh-cn/tier-list)页面汇集了各项实时榜单：[Analytics](/zh-cn/analytics) 中按传说卡统计的胜率、社区强度榜、卡牌评分和使用率最高的卡牌。

## 我们尚不知道的 {#shang-bu-zhi-dao}

- 具体哪些排名能获得第一赛季的限定奖励，以及奖励是什么。
- 一共有多少个段位，以及 Grandmaster 以下各段位的名称：官方说明没有列出。
- 在每个段位中，胜负是否总是像测试期说明那样 +10 和 −10 VP。
- 下一赛季开始时段位会如何变化。
- 排位进度是否会延续到 1.0 版本；根据 Steam 页面，Koin 计划在 2027年3月17日左右发布 1.0（日期可能会变）。

## 来源 {#lai-yuan}

Koin Games 在 Steam 上的官方公告：[0.6.1 补丁](https://store.steampowered.com/news/app/4429430/view/1840944183780414)（2026年8月14日）、[0.6.2 补丁](https://store.steampowered.com/news/app/4429430/view/1841579228669961)（8月21日）、[0.6.3 补丁](https://store.steampowered.com/news/app/4429430/view/1842212951301184)（8月27日）、[Big Bob's Playtest Battle](https://store.steampowered.com/news/app/4429430/view/1841579228677617)（8月25日）、[试玩版第一次大更新](https://store.steampowered.com/news/app/4429430/view/1844115010502611)（9月21日）、[“Ranked is here!”](https://store.steampowered.com/news/app/4429430/view/1846651706679257)（10月15日）和[“Goodbye Demo, Welcome Early Access”](https://store.steampowered.com/news/app/4429430/view/1847286114049982)（2026年10月27日，即 0.8 补丁说明，也发布在官方 Discord 上）；官方 Discord 上的 Crimson Cup 公告（9月24日）。8月和 9月的公告于 2026年9月25日阅读，10月的公告于 2026年10月28日阅读。
`,
  },
  "origins-tcg-conquest": {
    title: "Origins TCG 的 Conquest：如何构筑三副通过独特卡牌规则的卡组",
    metaTitle: "Origins TCG Conquest：如何构筑你的三副卡组",
    excerpt: "如何为 Origins TCG 的 Conquest 赛制组建三副卡组的阵容：独特卡牌如何计算、两副卡组最多能共用几张牌、卡组构筑器的 Conquest 检查怎么用，以及 OriginsMeta 上哪些真实的社区卡组组合能通过这条规则、哪些只差一张牌，附带完整的统计数字。",
    faq: [
      {
        q: "两副 Conquest 卡组共用的卡牌怎么算？",
        a: "取每副卡组的 13 张不同卡牌，即传说卡和十二张基础卡，无论有几份都只算一次：两副卡组之间的独特卡牌数等于 13 减去它们共用的卡牌数。最少需要 8 张独特卡牌，所以两副卡组最多只能共用 5 张。这是 OriginsMeta 的解读，因为 Koin Games 没有说明具体怎么计算；规则本身见我们关于 Crimson Cup 规则的文章。",
      },
      {
        q: "我的两副 Conquest 卡组可以用同一张传说卡吗？",
        a: "在 8月的 Big Bob's Playtest Battle 中不行：每副卡组都需要不同的传说卡。Crimson Cup 2026年9月9日和 24日的公告没有明确说明；由于禁用时你只能看到传说卡，我们的卡组构筑器会提示两副卡组用了同一张传说卡。",
      },
      {
        q: "一张卡的两份算两张卡吗？",
        a: "按 OriginsMeta 的解读不算：一张卡无论有几份都只算一次，所以每副卡组都有 13 张卡需要比较，即传说卡和十二张基础卡。",
      },
      {
        q: "怎么检查我的三副卡组？",
        a: "在 OriginsMeta 卡组构筑器的“锦标赛（3 副卡组）”模式中：Conquest 检查会计算每两副卡组之间的独特卡牌数，列出共用的卡牌，并提示两副卡组用了同一张传说卡。",
      },
    ],
    body: `
## 简而言之 {#jian-er-yan-zhi}

- **Conquest** 指的是带上不止一副彼此差异足够大的卡组，并禁用对手的一副卡组（Koin Games，2026年8月25日）；在 Big Bob's Playtest Battle 中，每副卡组还必须使用不同的传说卡。
- 在 **Crimson Cup**（2026年10月19日至 25日）中，你要带三副卡组，每两副之间至少有 8 张独特卡牌。规则、日期、奖品和签到见[我们关于 Crimson Cup 规则的文章](/zh-cn/news/crimson-cup-format-check-in)：本攻略讲的是如何构筑这三副卡组。
- Koin 没有说明独特卡牌如何计算。OriginsMeta 将每张卡只算一次，无论有几份，传说卡也算在内：这样两副卡组最多只能共用 5 张卡。
- [卡组构筑器](/zh-cn/deck-builder)的“锦标赛（3 副卡组）”模式会检查这一切。
- 在截至 2026年9月25日 20:00 CEST 于 OriginsMeta 发布的 20 副卡组中，传说卡不同的 176 对组合里有 174 对通过规则；未通过的两对都含有 Buff，都只差一张卡。

## Conquest 的要求 {#sai-zhi}

Koin Games 在 2026年8月28日的 [Big Bob's Playtest Battle](/zh-cn/news/big-bobs-playtest-battle) 中首次使用 Conquest。8月25日的 [Steam 公告](https://store.steampowered.com/news/app/4429430/view/1841579228677617)是这样描述的：“你必须在锦标赛开始前提交多副彼此不同的卡组，并有机会禁用对手的一副卡组”。那一次每副卡组都需要不同的传说卡，且至少相差九张卡。

对于 Crimson Cup，2026年9月9日和 24日的公告规定了以下规则：

- **三副卡组**；公告没有说明传说卡是否必须不同（在 Big Bob's 中是必须的，而且禁用时你只能看到传说卡）；
- 每两副卡组之间**至少 8 张独特卡牌**；
- 卡表在四强之前保密：禁用对手的一副卡组时，你只能看到它的传说卡；
- 对局为三局两胜，总决赛为五局三胜；五局三胜中没有禁用，你必须用全部三副卡组取胜。

锦标赛在当时的 Steam 试玩版上进行，使用其卡池。2026年9月29日推出了 [0.7 补丁](/zh-cn/news/patch-0-7)，团队称之为锦标赛前的最后一次平衡补丁：Bagheera、Mind Palace 和 Spellbook 的费用各增加 1，Twister Toss 被重做，因此在此之前组建的阵容值得重新检查。

## 独特卡牌如何计算 {#ru-he-ji-suan}

每副卡组都有 **13 张不同的卡牌**：传说卡和十二张基础卡，基础卡的第二份由游戏自动加入（对局中共 25 张）。Crimson Cup 的公告没有说明 8 张独特卡牌如何计算。以下是 OriginsMeta 的解读，也是我们的卡组构筑器和我们的锦标赛所采用的：

1. 每张卡只算**一次**，无论有几份；
2. **传说卡也算**：两张不同的传说卡总是构成一张卡的差异；
3. 卡组 A 和卡组 B 之间的独特卡牌，是 A 中 B 没有的卡：**13 减去共用的卡牌数**。

所以“至少 8 张独特卡牌”意味着你的任意两副卡组之间**最多共用 5 张卡**。

**刚好卡在下限的一对。** [3 Pigs Mid Range](/zh-cn/decks/community/3-pigs-mid-range-6311)（Three Not So Little Pigs）和 [On Reveal Mid Range](/zh-cn/decks/community/on-reveal-mid-range-772e)（Mulan）共用五张卡：En Passant、Ali Baba、Bagheera、Frog Prince 和 Ellen Trechend。在对局中，它们占每副卡组 25 张牌中的十张，但只算五张：13 − 5 = **8 张独特卡牌**，正好是下限。再多一张共用的卡，这对组合就无法通过了。

**差一张卡的一对。** [Buff](/zh-cn/decks/community/buff-6f60)（Robin Hood）和 [FACE IS THE PLACE](/zh-cn/decks/community/face-is-the-place-b049)（Legion of the Dead）共用六张卡：Musketeer、Defense Matrix、Bagheera、Three Blind Mice、Glinda 和 Galahad。13 − 6 = **7**：要让它们同时上场，这六张中必须有一张从其中一副卡组里移除。

如果 Koin 的计算方式不同，比如逐份计算，数字就会改变：规则一旦明确，我们会立即更新本攻略和构筑器。

## 在卡组构筑器中构筑三副卡组 {#ka-zu-gou-zhu-qi}

1. 打开[卡组构筑器](/zh-cn/deck-builder)，从“单个卡组”切换到 **“锦标赛（3 副卡组）”**。
2. 卡组 A、B 和 C 各有自己的标签页。从卡池中构筑，或在 **导入** 中粘贴游戏代码（KGBLDC…）：导入只会更改你当前所在的卡组。
3. 在任意社区卡组页面上，**“在卡组构筑器中打开”**会把该卡表载入当前卡组，另外两副保持不变：这是快速尝试已发布卡组组合的方法。
4. **“Conquest 检查”**框会显示每一对卡组相差多少张独特卡牌：达到下限及以上为绿色并带 ✓，低于下限为红色并带 ✗。鼠标悬停在数字上会列出共用的卡牌。下限为 8，即 Crimson Cup 的数值，你可以修改它（Big Bob's Playtest Battle 要求 9）。该检查还会提示两副卡组用了同一张传说卡。
5. 当三副卡组都合法且差异足够大时，框中会显示 **OK ✓**。用“复制游戏代码”复制每副卡组，然后粘贴到 Origins 中。

构筑器会在你的浏览器中随时保存这三副卡组。在 OriginsMeta 上创建的[锦标赛](/zh-cn/tournaments)也可以使用 Conquest，每位玩家 2 到 4 副卡组，下限由组织者选择，每个锦标赛的构筑器都会应用这些规则。可供选择的传说卡全部收录在[我们的 12 张传说卡攻略](/zh-cn/guides/origins-tcg-legendaries)中。

Crimson Cup 是 Steam Next Fest 期间的锦标赛，而排位在几天前的 10月15日刚刚开放：关于新品节的一切都在我们的 [Steam Next Fest 攻略](/zh-cn/guides/steam-next-fest-2026)中，[排位如今如何运作](/zh-cn/guides/origins-tcg-ranked)（自 2026年10月27日起处于抢先体验）则有专门的攻略。

## 通过规则的社区卡组，以及两对没通过的 {#she-qu-zu-he}

截至 2026年9月25日 20:00 CEST，OriginsMeta 上共有 20 副已发布的卡组，由 10 张不同的传说卡带领。这构成 190 种可能的组合：

- 14 对共用同一张传说卡：卡组构筑器会提示它们，在 Big Bob's Playtest Battle 中它们也不能进入同一阵容。它们往往是同一份卡表的不同版本，比如 [Healing Healsing](/zh-cn/decks/community/healing-healsing-9411)、[Cure Control](/zh-cn/decks/community/cure-control-b630) 和 [CONTROL](/zh-cn/decks/community/control-2c2b)，这三副 Van Helsing 卡组的 13 张卡中有 12 张相同；
- 其余 176 对中，**174 对通过** 8 张卡的规则，其中 30 对完全没有共用的卡；
- 两对未通过，都是 7 张，都含有 Buff：上面提到的 Buff 和 FACE IS THE PLACE，以及 Buff 和 [AGGRO /MIDRANGE PIGS GM](/zh-cn/decks/community/aggro-midrange-pigs-gm-6931)（Three Not So Little Pigs），它们共用 Bagheera、Mind Palace、Three Blind Mice、Beast、Glinda 和 Galahad。

一些组合及其真实数据：

| 组合 | 传说卡 | 共用卡牌 | 独特卡牌差异 | 8 张或以上？ |
| --- | --- | --- | --- | --- |
| [Dracula SUPER FUN](/zh-cn/decks/community/dracula-super-fun-d936) + [Qoh](/zh-cn/decks/community/qoh-f876) | Dracula、Queen of Hearts | 无 | 13 | 是 |
| [3 Pigs Mid Range](/zh-cn/decks/community/3-pigs-mid-range-6311) + [Healing Healsing](/zh-cn/decks/community/healing-healsing-9411) | Three Not So Little Pigs、Van Helsing | 1：Ali Baba | 12 | 是 |
| [Dorothy Combo](/zh-cn/decks/community/dorothy-combo-7503) + [On Reveal Mid Range](/zh-cn/decks/community/on-reveal-mid-range-772e) | Dorothy、Mulan | 1：En Passant | 12 | 是 |
| Spellcast + [The Trick-or-Treat Legion](/zh-cn/decks/community/the-trick-or-treat-legion-72c4) | Merlin、Legion of the Dead | 2：Golden Egg、Impundulu | 11 | 是 |
| [King of Value Trade](/zh-cn/decks/community/king-of-value-trade-fd14) + [Healing Healsing](/zh-cn/decks/community/healing-healsing-9411) | King Arthur、Van Helsing | 4：Shahrazad、Ali Baba、Boitata、Spellbook | 9 | 是 |
| [Qoh](/zh-cn/decks/community/qoh-f876) + [Value Board](/zh-cn/decks/community/value-board-c44a) | Queen of Hearts、Three Not So Little Pigs | 5：Bagheera、Baby Bear、Mind Palace、Ellen Trechend、Cockatrice | 8 | 是，正好在下限 |
| [Buff](/zh-cn/decks/community/buff-6f60) + [FACE IS THE PLACE](/zh-cn/decks/community/face-is-the-place-b049) | Robin Hood、Legion of the Dead | 6 | 7 | 否 |

有九对正好是 8 张：

- [3 Pigs Mid Range](/zh-cn/decks/community/3-pigs-mid-range-6311) + [On Reveal Mid Range](/zh-cn/decks/community/on-reveal-mid-range-772e)
- [AGGRO /MIDRANGE PIGS GM](/zh-cn/decks/community/aggro-midrange-pigs-gm-6931) + [FACE IS THE PLACE](/zh-cn/decks/community/face-is-the-place-b049)
- [CONTROL](/zh-cn/decks/community/control-2c2b) + Spellcast
- [Cure Control](/zh-cn/decks/community/cure-control-b630) + [Glinda Reborn](/zh-cn/decks/community/glinda-reborn-2d6d)
- [Cure Control](/zh-cn/decks/community/cure-control-b630) + Spellcast
- [FACE IS THE PLACE](/zh-cn/decks/community/face-is-the-place-b049) + [Glinda Reborn](/zh-cn/decks/community/glinda-reborn-2d6d)
- [Healing Healsing](/zh-cn/decks/community/healing-healsing-9411) + Spellcast
- [Qoh](/zh-cn/decks/community/qoh-f876) + [Value Board](/zh-cn/decks/community/value-board-c44a)
- [Qoh](/zh-cn/decks/community/qoh-f876) + [VALUE MAXXING](/zh-cn/decks/community/value-maxxing-739d)

在已发布卡组可能组成的 1,140 种三副组合中，有 867 种拥有三张不同的传说卡，且三对组合都通过规则。

这些是统计数字，不是建议：它们说明哪些卡组在规则下可以放在一起，而不是哪套阵容能赢。每副卡组怎么玩，见其页面上作者的攻略。

## 我们尚不知道的 {#shang-bu-zhi-dao}

- Koin 如何计算 8 张独特卡牌：9月24日的公告没有说明。
- Crimson Cup 的三副卡组是否必须使用不同的传说卡：公告没有说明。
- 最终的卡池：暂定卡池自 9月21日起已在游戏中。按团队的说法，9月29日的 0.7 补丁是锦标赛前的最后一次平衡补丁，但其说明没有表明卡池是否已经确定。

## 来源 {#lai-yuan}

Koin Games 在 Steam 上的公告：[8月25日](https://store.steampowered.com/news/app/4429430/view/1841579228677617)（Big Bob's Playtest Battle）、[2026年9月9日](https://store.steampowered.com/news/app/4429430/view/1843481262690278)（Steam Next Fest 的锦标赛）和[2026年9月29日](https://store.steampowered.com/news/app/4429430/view/1844751498235283)（0.7 补丁）；官方 Discord 上的 Crimson Cup 公告（9月24日）；以及截至 2026年9月25日 20:00 CEST 在 OriginsMeta 上发布的卡组，使用与卡组构筑器相同的函数统计。
`,
  },
  "origins-tcg-locations": {
    title: "Origins TCG 地点：三条战线如何改变每一局",
    metaTitle: "Origins TCG 地点详解",
    excerpt: "地点是牌桌上的第三位玩家：它们会让伤害翻倍、改变费用、移动你的角色。本文讲解 Origins TCG 的地点如何在前三个回合逐一出现、多久出现一次、有哪几类效果、哪些地点能直接决定胜负，以及构筑卡组时该如何把它们考虑进去，避免在不利的战场上束手无策。",
    faq: [
      {
        q: "Origins TCG 有多少个地点？",
        a: "OriginsMeta 目前记录了 44 个，尚未在游戏中逐一核对。Steam 官方页面提到有一个超过一百个地点的轮换池。",
      },
      {
        q: "一局中的地点什么时候能看到？",
        a: "前三个回合每回合揭示一个：第一个从开局就已知，第二个在第二回合出现，第三个在第三回合出现。从第四回合起，整个战场一览无余。",
      },
      {
        q: "地点对双方玩家都有效吗？",
        a: "是的。地点是那条战线的规则，而不是给先到者的加成：Amplifying Amphitheatre 会让你的伤害翻倍，也会让对手的伤害翻倍。",
      },
      {
        q: "在哪里可以看到完整列表？",
        a: "在 OriginsMeta 的地点页面，有搜索、按效果类型筛选，以及部分地点会召唤的卡牌的链接。",
      },
    ],
    body: `
## 为什么地点比看上去更重要

Origins TCG 在**三个地点**上进行，每个地点都带有一条规则，整局对局中都作用于那条战线。这是卡表无法控制的部分：两位玩家可以带着同样的二十五张牌坐下，却打出完全不同的两局，因为一个战场让伤害翻倍，另一个让所有卡牌的费用减一。

OriginsMeta 目前记录了 **44 个地点**。2026年10月28日阅读的 [Steam 官方页面](https://store.steampowered.com/app/4429430/Origins_TCG/)提到“一个超过 100 个地点的轮换池”。包含所有效果的完整列表在[地点页面](/zh-cn/locations)上，可以搜索和筛选；本攻略讲的是如何利用它们。

## 它们如何出现

三个地点在**前三个回合中每回合揭示一个**。第一个从开局就在桌上，第二个在第二回合出现，第三个在第三回合出现。从第四回合起，再没有隐藏的信息，你面对的是一个完全可见的战场。

正是这个节奏，让前几个回合不只是关于费用曲线：在第一回合，你把卡牌投入一条战线时，还不知道它两边的邻居是什么。把一个角色留一回合，看清它该去哪里，往往比按曲线把它打进错误的战线更有价值。

## 它们出现的频率

自 2026年9月29日的 [0.7 补丁](/zh-cn/news/patch-0-7)起，每个地点都有稀有度：普通、稀有、非常稀有或超稀有。稀有度决定了地点出现的频率。团队是这样说的：大多数对局里会遇到熟悉的地点，而有些你只会“千载难逢”地见到一次。补丁说明没有说明哪个地点是哪种稀有度：一旦得知，我们会把它加到[地点页面](/zh-cn/locations)上。

## 效果的类别

在我们的列表中，地点按它们对对局的影响分组。这些分组值得了解，因为它们需要不同的应对。

- **伤害。** Amplifying Amphitheatre 让那里的所有伤害翻倍，Burnturn Arena 在战斗后削减每个角色，Soul Artillery 在有单位死亡时打击双方屏障。小体型的单位不再安全。
- **法力与费用。** Gold Spinning Wheel 让所有卡牌费用减一，Castle in the Clouds 只让费用七及以上的卡牌减一，Treasurer's Office 让费用加一，Mana Battery 让你保留没有花掉的法力。这些决定了谁在节奏上领先。
- **抽牌与弃牌。** The Sultan's Court 每回合给你一张必须用掉的牌，Knowledge Vault 奖励先填满这条战线的一方，Junkyard 从双方各拿走一张，Nostradamus' Call 在第六回合开始时摧毁双方的牌库。
- **移动。** Conveyor Belt 在战斗后把所有角色向右滑动，Ballroom 把一个随机角色送回手牌，Open Meadow 赋予移动（Move）。
- **召唤与复制。** Cloning Lab 用你刚打出的卡牌的复制填满你的格位，Reflecting Pool 在另一个地点复制它，Sherwood Forest 不断产出 [Merry Men](/zh-cn/cards/merry-man)，Hundred Acre Woods 在双方各放一个 [Christopher Robin](/zh-cn/cards/christopher-robin)。
- **赋予关键词。** Stomping Grounds 赋予践踏（Trample），The Colosseum 赋予连击（Double Attack），Windmill Ridge 赋予守卫（Defender），Poison Grounds 给邪恶角色死触（Deathtouch），Blessed Grounds 给善良角色护盾（Shield）。
- **能力。** Mirror Dimension 重复揭示时（On Reveal），Burial Grounds 重复死亡时（On Death），Anti-Magic Vault 完全移除能力，Wonderland 颠倒攻击顺序。
- **消灭与屏障。** The Gallows 会消灭任何进入那里的单位对面的敌人，The Hill 在战斗后消灭所有并列力量最低的角色，Wall of Dumpty 吞掉你打出的第一个角色，Broken Gate 让屏障以 10 点而不是 40 点生命值回归。

## 决定胜负的地点

其中有几个，一出现就值得立刻认出来，因为它们会改变你该如何使用手牌。

- **Cloning Lab。** 你在那里打出的任何牌都会被复制到你在那条战线的空格位中。一个带有好用揭示时效果的廉价单位会变成三个，这条战线一回合就能定下来。
- **Mirror Dimension。** 每个揭示时都会发生两次。它对整条战线做的事，就是 [Mulan](/zh-cn/cards/mulan) 对一副卡组做的事，而且可以和她叠加。
- **The Gallows。** 任何在那里进场的单位都会消灭它对面的敌人。它把你最便宜的角色变成解场，并惩罚先投入的一方。
- **Anti-Magic Vault。** 角色失去所有能力。依靠触发效果构筑的卡组在那里无事可做；由白板单位组成的卡组则突然如鱼得水。
- **Amplifying Amphitheatre。** 所有伤害翻倍，双向生效。像 [Ellen Trechend](/zh-cn/cards/ellen-trechend) 这样带践踏的终结者能直接穿过屏障结束对局；对手的也一样。
- **Nostradamus' Call。** 双方牌库在第六回合开始时被摧毁。无论你的计划是什么，都必须在第五回合前完成。

## 构筑时考虑地点

你无法选择战场，但你可以构筑一副在战场上很少束手无策的卡组。

1. **不要把一切押在同一种触发上。** 只靠揭示时运转的卡组，遇到 Anti-Magic Vault 就会丢掉一条战线。保留几张作为白板单位也够用的卡。
2. **留一张远程输出卡。** 打击屏障的地点（Overloaded Circuit、"Human" Cannon、Soul Artillery）奖励那些能从远处终结一条战线、而不是硬磨的卡组。
3. **廉价角色收益最大。** 每个赋予关键词或复制单位的地点，用在两费卡上都比用在七费卡上更赚：昂贵的部分由地点替你完成了。
4. **注意惩罚先投入的战线。** The Hill、Wall of Dumpty 和 The Gallows 都会惩罚先填满一条战线的玩家。面对未知的战场，投入一条战线的第二张牌往往比第一张更安全。

## 我们还想核实的内容

这份列表包含目前记录的 44 个地点。我们还没有像 2026年9月22日核对 122 张卡牌那样，在游戏中逐一核对这些地点：核对之后，[地点页面](/zh-cn/locations)会注明，并附上日期和数量。
`,
  },
  "on-reveal-midrange-guide": {
    title: "On Reveal Mid Range：Mulan 中速卡组怎么玩",
    metaTitle: "Origins TCG Mulan 卡组攻略：On Reveal Mid Range",
    excerpt: "On Reveal Mid Range 卡组攻略：这副由 Mulan 带领、能重复每个揭示时能力的中速卡组，适合天梯、竞技和锦标赛。本文讲解它的完整卡表、获胜思路、调度时该留哪些牌、逐回合打法、拖延时间的卡怎么用、对局分析，以及作者指出的弱点。",
    faq: [
      {
        q: "Mulan 在这副卡组里起什么作用？",
        a: "Mulan 是一张 4 法力 2/4、具有连击的卡，当友方的揭示时能力触发时，她会重复一次。卡表中有九张卡带有揭示时，所以她能把每一张都变成两次。",
      },
      {
        q: "调度时留哪些牌？",
        a: "能在第四回合接上 Mulan 的曲线：放在中间格位的 Bagheera、Baby Bear，然后是 Black Knight 或 Frog Prince。如果预计对局会打得很长，Mary 也值得保留。",
      },
      {
        q: "哪个揭示时从 Mulan 那里获益最大？",
        a: "Mowgli，它的 6 法力揭示时会在另一个随机地点召唤一只 6/6 的 Baloo：重复之后，场上就有两只 Baloo。Ellen Trechend 和 Fairy Godmother 也会翻倍。",
      },
      {
        q: "怎样试用这副卡组？",
        a: "在 OriginsMeta 上打开卡组页面，点击“在卡组构筑器中打开”，或点击“复制游戏代码”，把代码（KGBLDC…）粘贴到 Origins 中。",
      },
    ],
    body: `
**写于 0.7 补丁之前。** 这副卡组和这篇攻略发布于 2026年9月29日的 [0.7 补丁](/zh-cn/news/patch-0-7)之前：卡表和打法并不是 0.7 版本的标准答案。卡牌表格显示的是当前的费用和数据。

## 一段话介绍这副卡组

**On Reveal Mid Range** 是一副由 [Mulan](/zh-cn/cards/mulan) 带领的**中速**（Midrange）卡表，由本站工作人员 [Davdas](/zh-cn/authors/davdas) 于 2026年9月22日发布在 OriginsMeta 上，标签为**天梯**、**竞技**和**锦标赛**。思路正如作者在[卡组页面](/zh-cn/decks/community/on-reveal-mid-range-772e)上所说：Mulan“让你把揭示时（On Reveal）能力用到极致”，卡表的构筑目标是每回合都有一个值得重复的效果。它能顶住快攻卡组，也能给控制卡组施压，因为同样的卡既能拖延时间，又能铺场。

## 卡表

二十五张牌：传说卡加十二张各带两份的卡。数据于 2026年9月22日[在游戏中逐张核对](/zh-cn/deck-builder)，Bagheera 的新费用来自 2026年9月29日的 [0.7 补丁](/zh-cn/news/patch-0-7)；2026年10月27日的 0.8 补丁说明（抢先体验）没有提到卡牌改动。

| 卡牌 | 费用 | 作用 |
| --- | --- | --- |
| [Mulan](/zh-cn/cards/mulan) ★ | 4 | 2/4，连击；友方揭示时触发时，重复一次 |
| [Bagheera](/zh-cn/cards/bagheera) | 2 | 1/1；在中间格位揭示时获得 +2⚔️/+2❤️ |
| [Baby Bear](/zh-cn/cards/baby-bear) | 3 | 1/1；当敌方伤害你在此处的屏障时反击 1 点，死亡时将一只 4/4 的 Papa Bear 加入你的手牌 |
| [Mary](/zh-cn/cards/mary) | 3 | 1/1；揭示时将一只 Little Lamb 加入手牌，死亡时你的 Lamb 永久获得 +3⚔️/+3❤️ |
| [Black Knight](/zh-cn/cards/black-knight) | 3 | 2/2；揭示时对其对面的敌人造成 2 点伤害 |
| [Frog Prince](/zh-cn/cards/frog-prince) | 3 | 2/2；揭示时，+3⚔️ 或 +3❤️，任你选择 |
| [Ali Baba](/zh-cn/cards/ali-baba) | 3 | 2/3；每当它伤害对手的屏障时抽一张牌 |
| [White Queen](/zh-cn/cards/white-queen) | 4 | 3/3；揭示时将**任意**角色移回其拥有者的手牌 |
| [Fairy Godmother](/zh-cn/cards/fairy-godmother) | 5 | 3/3；揭示时给予另一个友方 +3⚔️/+3❤️ |
| [Mowgli](/zh-cn/cards/mowgli) | 6 | 2/2；揭示时在另一个随机地点召唤 Baloo（6/6） |
| [Ellen Trechend](/zh-cn/cards/ellen-trechend) | 8 | 践踏；揭示时，其所在地点每有一张敌方卡牌，它获得 +3⚔️/+3❤️ |
| [Bullseye](/zh-cn/cards/bullseye) | 1 | 法术：对**任意**角色造成 3 点伤害 |
| [En Passant](/zh-cn/cards/en-passant) | 3 | 法术：移动一个友方，并对其对面的角色造成等同于其力量的伤害 |

十个单位和两张法术，其中九张带有揭示时。这就是这副卡组的核心：Mulan 不是终结者，而是倍增器。

## 这副卡组如何获胜

Mulan 会重复友方的揭示时，所以在她之后打出的每张牌都价值翻倍。最好的三次重复：

- **Mowgli** 费用为六，在另一个随机地点召唤一只 6/6 的 Baloo。重复之后就是两只 Baloo：一张牌就填满了两条你原本没有争夺的战线。
- **Ellen Trechend** 其所在地点每有一张敌方卡牌就获得 +3⚔️/+3❤️，并且拥有践踏（Trample）。打进一条拥挤的战线，她自己就已经是威胁；重复之后，增益会在战斗前生效两次。
- **Fairy Godmother** 给予另一个友方 +3⚔️/+3❤️。两次触发可以集中在同一个单位上，也可以分给两个，取决于对手能解掉什么。

Mulan 还拥有**连击**（Double Attack），所以她自己的 2/4 身材在交换中比数字看起来更强。

## 调度

寻找一条能在第四回合接上 Mulan 又不落后的曲线：放在中间格位的 **Bagheera**（一费的 3/3），然后是 **Baby Bear**，再然后是 **Black Knight** 或 **Frog Prince**。如果预计对局会打得很长，就留下 **Mary**：她加入你手牌的 Lamb 是一个廉价单位，而如果 Mary 死亡，你已经打出的 Lamb 会永久成长。

## 逐回合打法

1. **第 1–3 回合：占据空间，但不要过度投入。** Bagheera 放中间，Baby Bear 放在你预计首先遭到攻击的地方，Black Knight 放在你想消灭的目标对面。每条战线一张牌就够了：这副卡组希望 Mulan 登场时场面是均衡的，而不是拥挤的。
2. **第 4 回合：Mulan。** 从这里开始，出牌的顺序比牌本身更重要。每回合都问自己哪个揭示时值得翻倍，并把它打在 Mulan 所在的地点。
3. **第 5–6 回合：价值卡。** 先 Fairy Godmother，然后在六费时打 Mowgli。White Queen 是这份卡表的应对卡：它能将**任意**角色移回其拥有者的手牌，所以可以在对手终结者登场的当回合把它解掉，或者把你自己的 Mary 收回来重新打出。
4. **第 7–8 回合：收尾。** 把 Ellen Trechend 打进对手填满的战线；用 En Passant 移动一个友方，打击其对面的单位，为践踏伤害打开通路。

## 如何使用拖延时间的卡

作者把 **White Queen、Mary 和 En Passant** 称为“为你争取时间”的卡，正是它们让这副卡组能够扛住快攻的开局。White Queen 不是解场：角色会回到拥有者的手牌，可以再次打出，所以要把她用在昂贵的单位上，或者已经被增益过的单位上。En Passant 同时是解场和调整站位，也是对付那些挡在你最好的牌前面的阻挡者的答案。

## 对局分析

排位数据并不公开，所以下面是 OriginsMeta 对卡表的解读，而不是胜率。

- **对阵快攻卡组。** Baby Bear 和以 2/5 打出的 Frog Prince 能守住战线；Bullseye 一费就能处理三点生命值的单位。不要过早用掉 White Queen：你会需要它来对付第一个大威胁。
- **对阵控制卡组。** Ali Baba 是在你压制屏障时保持手牌充足的那张卡。不要把一切投入同一个地点：一次清场被一张 Mowgli 回应，是你承受得起的波动；空手则不行。
- **对阵其他中速卡表。** 这副卡组和 [3 Pigs Mid Range](/zh-cn/decks/community/3-pigs-mid-range-6311)、[King of Value Trade](/zh-cn/decks/community/king-of-value-trade-fd14) 打的是同一种游戏：谁从每张牌中榨取更多价值，谁就赢。翻倍揭示时恰恰就是这样，所以要保护好 Mulan，只有在不得不时才在她之前打出廉价的揭示时卡。

## 作者眼中的弱点

卡组页面列出了两点：**良好的曲线往往至关重要**，以及**你可能会耗尽应对手段**。两者出自同一个原因——这副卡组没有群体解场，只有两张法术。如果你必须在现在用掉一张牌和留着它以后翻倍之间选择，那就现在用：Mulan 重复你打出的东西，但她不会带回任何东西。

## 接下来去哪里

- [卡组页面](/zh-cn/decks/community/on-reveal-mid-range-772e)上有卡表及法力曲线和出处图表、作者的笔记、“在卡组构筑器中打开”按钮，以及可粘贴到 Origins 中的游戏代码。
- 卡牌数据为 [2026年9月29日 0.7 补丁](/zh-cn/news/patch-0-7)的版本，该补丁把 Bagheera 从一费改为两费；2026年10月27日的 0.8 补丁说明（抢先体验）没有提到卡牌改动；每张卡的页面都有自己的平衡历史。
`,
  },
  "king-of-value-trade-guide": {
    title: "King of Value Trade：King Arthur 中速卡组怎么玩",
    metaTitle: "King Arthur 卡组攻略：King of Value Trade",
    excerpt: "King of Value Trade 卡组攻略：这副由 King Arthur 带领的中速卡组，目标是在每次交换中以一换二。本文讲解它的完整卡表、护盾与先攻如何获胜、调度时该留哪些牌、逐回合打法、作者的两条笔记、对局分析，以及作者指出的弱点。",
    faq: [
      {
        q: "Origins TCG 里的“价值交换”是什么？",
        a: "让你的一张牌应对对手的两张牌，或者用一张便宜的牌换掉一张昂贵的牌。这副卡组正是围绕这个思路构筑的：护盾、先攻和增益让你的角色在打赢的战斗中存活下来。",
      },
      {
        q: "调度时留哪些牌？",
        a: "按曲线打出很稳的 Bagheera 和 Roo，以及用于前几回合的 Musketeer 和 Shield Maiden。对阵快攻卡组时留 Cowardly Lion；对阵控制卡组时留 Ali Baba。",
      },
      {
        q: "为什么 9月21日补丁之后 Roo 很好用？",
        a: "2026年9月21日的试玩版补丁把 Roo 从 2/3 改为 2/4（+1 生命值），仍然是两费并保留移动关键词，所以它能在大多数早期交换中存活，而不是亏本交换。",
      },
      {
        q: "Spellbook 是必需的吗？",
        a: "不是。它每回合提供一张随机法术，带来资源和不可预测性，但卡组页面说这份卡表没有它也能赢。",
      },
    ],
    body: `
**写于 0.7 补丁之前。** 这副卡组和这篇攻略发布于 2026年9月29日的 [0.7 补丁](/zh-cn/news/patch-0-7)之前：卡表和打法并不是 0.7 版本的标准答案。卡牌表格显示的是当前的费用和数据。

## 一段话介绍这副卡组

**King of Value Trade** 是一副由 [King Arthur](/zh-cn/cards/king-arthur) 带领的**中速**（Midrange）卡表，由本站工作人员 [Davdas](/zh-cn/authors/davdas) 于 2026年9月22日发布在 OriginsMeta 上，标签为**天梯**。名字就说明了打法：“几乎每张牌都想以一换二”，也就是用你的一张牌应对对手的两张牌。做到的次数足够多，场面自然就归你了，不需要任何一个华丽的终结回合。

## 卡表

二十五张牌：传说卡加十二张各带两份的卡。

| 卡牌 | 费用 | 作用 |
| --- | --- | --- |
| [King Arthur](/zh-cn/cards/king-arthur) ★ | 7 | 7/7，具有护盾；揭示时给予你的善良角色护盾 |
| [Bagheera](/zh-cn/cards/bagheera) | 2 | 1/1；在中间格位揭示时获得 +2⚔️/+2❤️ |
| [Musketeer](/zh-cn/cards/musketeer) | 2 | 2/1，具有先攻 |
| [Roo](/zh-cn/cards/roo) | 2 | 2/4，具有移动 |
| [Shahrazad](/zh-cn/cards/shahrazad) | 2 | 1/4；每当一张牌进入你的手牌时，为你在此处的屏障治疗 1 点伤害 |
| [Shield Maiden](/zh-cn/cards/shield-maiden) | 3 | 3/1，具有护盾 |
| [Dark Omen](/zh-cn/cards/dark-omen) | 3 | 法术：消灭**任意**角色 |
| [Cowardly Lion](/zh-cn/cards/cowardly-lion) | 3 | 2/5，具有守卫 |
| [Ali Baba](/zh-cn/cards/ali-baba) | 3 | 2/3；每当它伤害对手的屏障时抽一张牌 |
| [Spellbook](/zh-cn/cards/spellbook) | 4 | 法术：从此以后，每回合手牌中获得一张随机法术，在战斗前弃掉 |
| [Lancelot](/zh-cn/cards/lancelot) | 4 | 4/4；你在其所在地点打出的每个善良角色获得 +2⚔️/+2❤️ |
| [Fairy Godmother](/zh-cn/cards/fairy-godmother) | 5 | 3/3；揭示时给予另一个友方 +3⚔️/+3❤️ |
| [Boitata](/zh-cn/cards/boitata) | 5 | 5/5；瞄准你屏障的法术和能力伤害，改为打击对手在此处的屏障 |

十个单位和两张法术，十三张卡中有十张是善良角色：这不是巧合，正是这一点让这张传说卡值七费。

## 这副卡组如何获胜

三个关键词承担了主要工作。

- **护盾**（Shield）吸收第一次伤害。King Arthur 一次性给予你所有善良角色护盾，[Shield Maiden](/zh-cn/cards/shield-maiden) 则自带护盾：一个带护盾的 3/1 能和 3/3 交换，并留在场上。
- [Musketeer](/zh-cn/cards/musketeer) 的**先攻**（First Strike）意味着敌人在还手之前就先承受伤害：两费就能解掉一个更大的单位。
- [Lancelot](/zh-cn/cards/lancelot) 和 [Fairy Godmother](/zh-cn/cards/fairy-godmother) 的**增益**把势均力敌的战斗变成一边倒。Lancelot 会增益在他所在地点打出的每个善良角色，所以他奖励你持续经营这条战线，而不是把兵力摊薄。

[Ali Baba](/zh-cn/cards/ali-baba) 是引擎：每当它伤害屏障，你就抽一张牌。[Shahrazad](/zh-cn/cards/shahrazad) 是同一思路的另一半——每当一张牌进入你的手牌，她就为你在她所在地点的屏障治疗一点伤害，所以抽牌既让你领先，也让你活下来。

## 调度

**Bagheera 必留**，而 **Roo** 现在也值得在每手牌中保留：[9月21日的试玩版补丁](/zh-cn/news/demo-patch-notes-0921)把它改为 2/4，所以它能在早期交换中存活。**Musketeer** 和 **Shield Maiden** 让你在第二和第三回合取得领先。对阵快攻卡组时留下 **Cowardly Lion**，它的守卫（Defender）能守住战线；对阵控制卡组时留下 **Ali Baba**，它能把一次没人阻拦的屏障攻击变成手牌。如果预计对局会打得很长，留下 **Spellbook** 也是合理的选择。

## 逐回合打法

1. **第 1–3 回合：以小换大。** Bagheera 放中间，Musketeer 放在 1 或 2 点生命值的单位对面，Roo 放在你之后可能想移动的地方。每一场不损失单位就能打赢的战斗，都等于多赚了一张牌。
2. **第 4–5 回合：守住一条战线。** 先打 Lancelot，然后在他所在的地点打出善良角色：每个都会比原本大 +2⚔️/+2❤️。五费的 Boitata 是一个 5/5，还能把瞄准你屏障的敌方法术伤害反弹到对手的屏障上。
3. **第 6–7 回合：传说卡。** King Arthur 是一个带护盾的 7/7，他的揭示时（On Reveal）会给予你场上所有善良角色护盾。不要在空场时打出他：价值在护盾上，不在身材上。
4. **Dark Omen，在关键时刻使用。** 三费消灭**任意**角色，是应对那张你在战斗中赢不了的牌的答案：一个被增益过的单位、一个挡错战线的守卫、一张敌方传说卡。

## 作者的两条笔记

- **Fairy Godmother 不只是终结手段。** 卡组页面指出，她也可以用来保护 Ali Baba、Shahrazad 或 Cowardly Lion：在对的单位上加 +3❤️，意味着引擎能再活一个回合。
- **Dark Omen 必须用得精准。** 只有两份且没有其他解场，用错一次目标，真正的威胁就会活下来。

## 对局分析

排位数据并不公开，所以这是 OriginsMeta 对卡表的解读，而不是胜率。

- **对阵快攻卡组。** Cowardly Lion 和 Shahrazad 一起构成安全网：守卫承受攻击，治疗补回穿透进来的屏障伤害。如果后面会来更大的单位，不要过早用 Shield Maiden 去换一个 1 点生命值的单位。
- **对阵控制卡组。** 先 Ali Baba，再来第二张。卡组页面说得很清楚：当对手翻找应对手段时，这份卡表想要持续抽牌。把 Dark Omen 留给能终结对局的那张牌，而不是对手打出的第一张牌。
- **对阵用法术伤害你屏障的卡组**（[Healing Healsing](/zh-cn/decks/community/healing-healsing-9411) 和其他带 Boitata 的卡表）。谁先放下 Boitata，谁就能把这些伤害反转：卡表中有两份，值得留一张，而不是两张都折在同一场战斗中。

## 作者眼中的弱点

卡组页面列出了三点：**没有范围解场**、**Dark Omen 必须用得精准**，以及**你需要读懂对手的计划**。前两点来自卡表本身：除了 Dark Omen 之外，没有任何能直接解掉角色的牌，所以你放任成长的场面就会一直壮大。第三点是最坦诚的部分——这副卡组一次交换一次交换地积累价值，而每一次交换都是一个决定。

## 接下来去哪里

- [卡组页面](/zh-cn/decks/community/king-of-value-trade-fd14)上有完整卡表和图表、作者的笔记、“在卡组构筑器中打开”按钮，以及游戏代码（KGBLDC…）。
- 卡牌数据为 [2026年9月29日 0.7 补丁](/zh-cn/news/patch-0-7)的版本，该补丁把 Bagheera 提高到两费、Spellbook 提高到四费（Spellbook 加入的法术不能再是 Spellbook）；2026年10月27日的 0.8 补丁说明（抢先体验）没有提到卡牌改动。
`,
  },
  "dorothy-combo-guide": {
    title: "Dorothy Combo：9月21日补丁后的移动卡组怎么玩",
    metaTitle: "Dorothy 卡组攻略：Dorothy Combo",
    excerpt: "Dorothy Combo 卡组攻略：围绕 9月21日补丁增强重建的移动卡组。本文讲解 Dorothy 如何随着每次移动成长、要寻找哪些组合技、调度时该留哪些牌、逐回合打法、对阵快攻、控制和其他移动卡组的对局分析，以及这份卡表目前仍然做不到的事情。",
    faq: [
      {
        q: "Dorothy 是如何成长的？",
        a: "Dorothy 每回合都可以移动，本局对局中友方每移动一次，她就获得 +1⚔️/+1❤️。计数针对整局对局而不是单个回合，所以你在任何地方的每一次移动都会让她变大。",
      },
      {
        q: "这副卡组要寻找哪些移动组合技？",
        a: "Card Soldier，移动后会在原来的格位召唤一个自己的复制；Pegasus，移动后力量翻倍；以及 Magic Carpet，揭示时会把你的其他友方向左或向右移动一格。",
      },
      {
        q: "这副卡组有竞技性吗？",
        a: "作者称它是一副娱乐和天梯卡组，并坦言它可能还没有达到顶级水平，但在 9月21日的增强之后，情况有所变化。",
      },
      {
        q: "怎样试用这副卡组？",
        a: "在 OriginsMeta 上打开卡组页面，点击“在卡组构筑器中打开”，或把游戏代码（KGBLDC…）复制到 Origins 中。",
      },
    ],
    body: `
**写于 0.7 补丁之前。** 这副卡组和这篇攻略发布于 2026年9月29日的 [0.7 补丁](/zh-cn/news/patch-0-7)之前：卡表和打法并不是 0.7 版本的标准答案。卡牌表格显示的是当前的费用和数据。

## 一段话介绍这副卡组

**Dorothy Combo** 是一副由 [Dorothy](/zh-cn/cards/dorothy) 带领的**组合技**（Combo）卡表，由本站工作人员 [Davdas](/zh-cn/authors/davdas) 于 2026年9月22日发布在 OriginsMeta 上，标签为**天梯**和**娱乐**。这是一副移动卡组，在 [2026年9月21日的试玩版补丁](/zh-cn/news/demo-patch-notes-0921)之后重建，该补丁增强了 Dorothy、[Roo](/zh-cn/cards/roo) 和 [Magic Carpet](/zh-cn/cards/magic-carpet) 等卡牌。作者的评价在[卡组页面](/zh-cn/decks/community/dorothy-combo-7503)上，我们原样保留：这可能还不是一份顶级卡表，但情况有所变化。

## 卡表

二十五张牌：传说卡加十二张各带两份的卡。

| 卡牌 | 费用 | 作用 |
| --- | --- | --- |
| [Dorothy](/zh-cn/cards/dorothy) ★ | 4 | 3/3；每回合都可以移动，本局对局中友方每移动一次获得 +1⚔️/+1❤️ |
| [Twister Toss](/zh-cn/cards/twister-toss) | 1 | 法术：将一个友方移动到任意格位；如果那里已有另一张卡，两者交换位置 |
| [Card Soldier](/zh-cn/cards/card-soldier) | 2 | 3/1；移动后，在原来的格位召唤一个自己的复制 |
| [Roo](/zh-cn/cards/roo) | 2 | 2/4，具有移动 |
| [Basilisk](/zh-cn/cards/basilisk) | 2 | 1/2，具有死触 |
| [Pegasus](/zh-cn/cards/pegasus) | 3 | 2/4；移动后力量翻倍 |
| [Flying Monkey](/zh-cn/cards/flying-monkey) | 3 | 4/1；揭示时将**任意**其他角色移动到此处的一个随机格位 |
| [Wicked Witch of the West](/zh-cn/cards/wicked-witch-of-the-west) | 3 | 1/5；在伤害中存活时，将一只 Flying Monkey 加入你的手牌，并向左移动一格 |
| [Kanga](/zh-cn/cards/kanga) | 3 | 2/3；战斗前，本回合移动过的友方获得 +1⚔️/+1❤️ |
| [En Passant](/zh-cn/cards/en-passant) | 3 | 法术：移动一个友方，并对其对面的角色造成等同于其力量的伤害 |
| [Spellbook](/zh-cn/cards/spellbook) | 4 | 法术：从此以后，每回合手牌中获得一张随机法术，在战斗前弃掉 |
| [Magic Carpet](/zh-cn/cards/magic-carpet) | 4 | 4/4；揭示时将你的其他友方向左移动一格，或向右移动一格 |
| [Hare](/zh-cn/cards/hare) | 5 | 4/1，具有先攻和移动 |

九个单位和三张法术，几乎每张牌要么会移动，要么奖励移动。

## 这副卡组如何获胜

Dorothy 是一个会计数的 3/3：**本局对局中友方每移动一次，+1⚔️/+1❤️**。计数不会重置，而且统计的是整个战场上的移动，所以像 [Twister Toss](/zh-cn/cards/twister-toss) 这样的廉价法术永远不会浪费——一费就能让你的传说卡永久 +1。在几次移动之后于第五回合打出，Dorothy 登场时就是一个像样的单位，并且之后每回合继续成长，因为她自己也会移动（Move）。

这份卡表的核心是三个组合技：

1. **Card Soldier 加任意移动。** 一个两费的 3/1，每次移动都会留下一个自己的复制：配合 Twister Toss 或 Magic Carpet，它一张牌就能填满一条战线。
2. **Pegasus 加任意移动。** 移动后力量翻倍：2/4 变成 4/4，再加上 Kanga 在战斗前给的 +1⚔️，就是一个 5 力量的单位，而对手只把它当作三费卡看待。
3. **Magic Carpet 作为引擎。** 它把你*所有*其他友方朝你选择的方向移动一格：一张牌，多次触发——一个 Card Soldier 复制、一只力量翻倍的 Pegasus、Dorothy 身上的点数，以及 Kanga 对所有移动过的单位的增益。

## 调度

作者没有关于调度的笔记，所以这是 OriginsMeta 的解读。留下廉价的移动启动卡 **Twister Toss** 和 **Roo**，再加上两个奖励移动的单位之一，**Card Soldier** 或 **Pegasus**。Magic Carpet 是你在第四回合想要的牌，而不是起手牌。如果完全没有廉价卡，一手从第三回合才开始动的牌，对一副希望从第一回合就开始计数的卡组来说太慢了。

## 逐回合打法

1. **第 1–2 回合：启动计数。** Card Soldier 或 Roo，然后对它使用 Twister Toss。每一次移动都会让 Dorothy 永久 +1，即使场面看起来很平静。
2. **第 3 回合：选择战线。** Pegasus、Witch 或 Kanga。[Wicked Witch of the West](/zh-cn/cards/wicked-witch-of-the-west) 是能自己产生价值的那张：一个能扛住大多数攻击的 1/5，每次存活你都会获得一只 Flying Monkey，而她会向左移动一格——Dorothy 又多一点。
3. **第 4 回合：Magic Carpet。** 选择能把你的 Card Soldier 推向空格位、并把 Pegasus 带进一场它现在能打赢的战斗的方向。
4. **第 5 回合及以后：Dorothy，然后收尾。** 自 9月21日补丁起她的费用为 4，但第四回合属于 Carpet，晚一回合她登场时计数会更高。Hare 具有先攻和移动：它在对手应对之前出手，并让计数继续增长。具有死触（Deathtouch）的 [Basilisk](/zh-cn/cards/basilisk) 是应对一个大到无法正面交战的单位的廉价答案，而 En Passant 能把力量翻倍的 Pegasus 变成解场。

## 这副卡组做不到的事

作者列出了两个弱点，而且都很坦诚：**你可能会被手里的牌严重卡住**，以及**有些组合技并不稳定**。两者出自同一个原因——[Flying Monkey](/zh-cn/cards/flying-monkey) 会把角色移动到一个*随机*格位，Card Soldier 的复制会出现在它离开的格位，而 Magic Carpet 会移动所有单位，包括你希望留在原地的友方。打出 Carpet 之前先规划好方向，也不要指望某个特定的格位是空的。

## 对局分析

排位数据并不公开：这是对卡表的解读，而不是胜率。

- **对阵快攻卡组。** Witch 和 Roo 守住早期战线；Basilisk 的死触应对第一个大单位。Dorothy 可以等：在后期计数较高时她更强。
- **对阵控制卡组。** 这是有利的对局。Card Soldier 的复制和 Flying Monkey 会不断回来，所以一次清场不会清空你的场面。清场之后在手里留一张 Twister Toss，用来重启计数。
- **对阵其他移动卡组。** 谁移动得更多，谁的 Dorothy 就更大，但 Flying Monkey 能移动*任意*角色：用它把敌方的 Pegasus 从它即将翻倍的格位里拖出来。

## 接下来去哪里

- [卡组页面](/zh-cn/decks/community/dorothy-combo-7503)上有完整卡表、图表、作者的笔记、“在卡组构筑器中打开”按钮和游戏代码。
- 这份卡表背后的增强见 [9月21日补丁说明](/zh-cn/news/demo-patch-notes-0921)；MetaShifting 在[它自己的页面](/zh-cn/metashifting)上追踪每一次改动。
- 卡牌数据为 [2026年9月29日 0.7 补丁](/zh-cn/news/patch-0-7)的版本，该补丁把 Spellbook 从三费提高到四费，并重做了 Twister Toss；2026年10月27日的 0.8 补丁说明（抢先体验）没有提到卡牌改动。表格中对 Twister Toss 的描述来自补丁说明：我们还没有在游戏中读到它的新文本。
`,
  },
  "trick-or-treat-legion-guide": {
    title: "The Trick-or-Treat Legion：Legion of the Dead 卡组怎么玩",
    metaTitle: "Legion of the Dead 卡组攻略",
    excerpt: "Legion of the Dead 卡组攻略：一份以不可预测为目标的卡表。本文讲解 Zombie 铺场如何运作、Golden Egg 与 Boogeyman 的组合技、各种“恶作剧”卡的用法、调度时该留哪些牌、逐回合打法、对局分析，以及作者指出的弱点。",
    faq: [
      {
        q: "Legion of the Dead 有什么作用？",
        a: "它是一张 7 法力的传说法术：用 Zombie（2⚔️/2❤️）填满你的战场。一张牌，占满所有空格位。",
      },
      {
        q: "Golden Egg 和 Boogeyman 的组合技是什么？",
        a: "Boogeyman 是一张 4 法力的 7/7，揭示时会消灭其所在地点力量最低的友方，包括它自己。Golden Egg 是一个 0/1，死亡时在其格位召唤一只 5/5 的 Golden Goose：先放下 Egg，Boogeyman 的能力就会把它变成一只 Goose，而不是消灭你自己的单位。",
      },
      {
        q: "调度时留哪些牌？",
        a: "Bagheera 和 Thumbelina，最好再配上 Bullseye。Golden Egg 加 Boogeyman 这一对也值得留在起手牌中。",
      },
      {
        q: "为什么 Mind Palace 很重要？",
        a: "这副卡组清空手牌很快：没有 Mind Palace 抽的两张牌，你会在传说卡登场之前就无牌可出。",
      },
    ],
    body: `
**写于 0.7 补丁之前。** 这副卡组和这篇攻略发布于 2026年9月29日的 [0.7 补丁](/zh-cn/news/patch-0-7)之前：卡表和打法并不是 0.7 版本的标准答案。卡牌表格显示的是当前的费用和数据。

## 一段话介绍这副卡组

**The Trick-or-Treat Legion** 是一副由 [Legion of the Dead](/zh-cn/cards/legion-of-the-dead) 带领的**邪恶**卡表，由本站工作人员 [Davdas](/zh-cn/authors/davdas) 于 2026年9月22日发布在 OriginsMeta 上，标签为**天梯**、**竞技**和**锦标赛**。Legion 卡组有好几个版本在流传；按作者的说法，这一版想要提高不可预测性，把每回合都能对对手场面“搞个恶作剧”的卡牌组合在一起。完整卡表和图表在[卡组页面](/zh-cn/decks/community/the-trick-or-treat-legion-72c4)上。

## 卡表

二十五张牌：传说卡加十二张各带两份的卡。

| 卡牌 | 费用 | 作用 |
| --- | --- | --- |
| [Legion of the Dead](/zh-cn/cards/legion-of-the-dead) ★ | 7 | 传说法术：用 Zombie（2⚔️/2❤️）填满你的战场 |
| [Bullseye](/zh-cn/cards/bullseye) | 1 | 法术：对**任意**角色造成 3 点伤害 |
| [Thumbelina](/zh-cn/cards/thumbelina) | 1 | 2/2，没有能力 |
| [Bagheera](/zh-cn/cards/bagheera) | 2 | 1/1；在中间格位揭示时获得 +2⚔️/+2❤️ |
| [Morgiana](/zh-cn/cards/morgiana) | 2 | 2/3；阻止其所在地点的**所有**揭示时能力触发 |
| [Mind Palace](/zh-cn/cards/mind-palace) | 3 | 法术：抽 2 张牌 |
| [Asanbosam](/zh-cn/cards/asanbosam) | 3 | 5/5；揭示时弃掉一张随机的偶数费用卡牌 |
| [Golden Egg](/zh-cn/cards/golden-egg) | 3 | 0/1；死亡时在其格位召唤一只 Golden Goose（5/5） |
| [Flying Monkey](/zh-cn/cards/flying-monkey) | 3 | 4/1；揭示时将**任意**其他角色移动到此处的一个随机格位 |
| [En Passant](/zh-cn/cards/en-passant) | 3 | 法术：移动一个友方，并对其对面的角色造成等同于其力量的伤害 |
| [Boogeyman](/zh-cn/cards/boogeyman) | 4 | 7/7；揭示时消灭此处力量最低的友方，包括它自己 |
| [White Queen](/zh-cn/cards/white-queen) | 4 | 3/3；揭示时将**任意**角色移回其拥有者的手牌 |
| [Impundulu](/zh-cn/cards/impundulu) | 5 | 3/6；攻击时将一张 Lightning Strike 加入你的手牌，在下一回合战斗前弃掉 |

十个单位和三张法术。三张廉价卡不是凑数的：这副卡组需要在传说卡登场前掌控场面，因为 Zombie 只会填满*空*格位。

## 这副卡组如何获胜

三张牌负责输出——**Boogeyman、Asanbosam 和 Impundulu**——其余的牌都是为了保护它们或为它们开路。

- **Boogeyman** 是一张四费的 7/7，是卡表中性价比最高的牌，但有个代价：揭示时（On Reveal）它会消灭其所在地点力量最低的友方，包括它自己。把它放进空战线，它会消灭自己；把它放在 [Golden Egg](/zh-cn/cards/golden-egg) 旁边，死的就是 Egg，并在其格位留下一只 5/5 的 Golden Goose。这就是作者指出的组合技：两张牌，一个 7/7 加一个 5/5。
- **Asanbosam** 是一张三费的 5/5，揭示时会让对手随机弃掉一张偶数费用的牌。
- **Impundulu** 把每一次攻击都变成你手牌中的一张 [Lightning Strike](/zh-cn/cards/lightning-strike)：可重复的伤害，只要你在下一次战斗前用掉它。

**传说卡**的作用是终结对局，而不是开启对局：七费的*用 Zombie 填满你的战场*会一次占满所有空格位。它最好的时机是在一次交换清空你这一侧之后的那个回合，或者打进那两个你没有争夺的地点。

## “恶作剧”

[En Passant](/zh-cn/cards/en-passant)、[Flying Monkey](/zh-cn/cards/flying-monkey) 和 [White Queen](/zh-cn/cards/white-queen) 就是作者所说的每回合搞个恶作剧的卡。

- **En Passant** 移动一个友方，并对其对面的角色造成等同于其力量的伤害：用在 Boogeyman 或 Golden Goose 上，就是五到七点伤害，同时还能调整站位。
- **Flying Monkey** 将**任意**其他角色移动到其所在地点的一个随机格位：它能把敌方的阻挡者拖出战线，或者把你自己的单位带到战斗发生的地方。格位是随机的，所以它是恶作剧，而不是计划。
- **White Queen** 将**任意**角色移回其拥有者的手牌：敌方的终结者离场一回合，或者你自己的 Golden Egg 回到手中，在第二个 Boogeyman 旁边重新打出。

[Morgiana](/zh-cn/cards/morgiana) 是低调的那张：在她所在的地点，双方的揭示时都完全不会触发。把她放在对手揭示时伤害最大的地方——但要记住，她也会阻止你的揭示时，包括 Boogeyman 的。

## 调度

作者的笔记简短而清楚：**Bagheera 和 Thumbelina 配上 Bullseye 是完美的开局**，而 **Golden Egg 加 Boogeyman 即使在起手牌中也能决定胜负**。放在中间格位的 Bagheera 是一费的 3/3；Thumbelina 是一个白板 2/2，一费就能提供不用多想的场面存在感。

## 逐回合打法

1. **第 1–2 回合：低成本占据空间。** Bagheera 放中间，Thumbelina 放在你预计会发生战斗的地方，Bullseye 打任何三点生命值的单位。
2. **第 3 回合：第一个威胁。** 以 5/5 打出 Asanbosam，或者把 Golden Egg 放进下回合 Boogeyman 要去的战线。
3. **第 4 回合：Boogeyman。** 有 Egg 就打在 Egg 旁边，否则放在你损失得起的最小单位旁边——永远不要打进空战线。
4. **第 5–6 回合：施压与补牌。** Impundulu 开始产出 Strike；Mind Palace 补充手牌。作者说得很明确：没有 Mind Palace，这副卡组会过早耗尽手牌。
5. **第 7 回合：Legion of the Dead。** 每个空格位都变成一个 2/2。打出之前先数一数格位：在大量交换之后的回合，它能多给你两三个单位。

## 对局分析

排位数据并不公开，所以这是 OriginsMeta 对卡表的解读。

- **对阵铺场卡组。** Zombie 只出现在空格位上，所以对手铺得越宽，传说卡对你的帮助越小。先用 Bullseye 和 Boogeyman 打开场面，把 Flying Monkey 留给被增益过的单位。
- **对阵控制卡组。** Asanbosam 的弃牌和 Impundulu 的 Strike 是不依赖场面存活的压力。清场之后留一张 Boogeyman：四费的 7/7 是重建场面最快的方式。
- **对阵揭示时卡组**（例如 [On Reveal Mid Range](/zh-cn/decks/community/on-reveal-mid-range-772e)，它用 Mulan 重复每个揭示时）。这正是 Morgiana 发挥作用的地方：把她放在对手堆叠能力的地点，接受你自己的揭示时在那里也会失效，然后正常争夺另外两条战线。

## 作者眼中的弱点

卡组页面列出了两点：**Mind Palace 非常重要，这样你才不会过早耗尽手牌**，以及 **Boogeyman 需要一个有效目标，或者 Morgiana**。第二点值得再强调一次：只有当那个地点里有其他力量更低的单位时，这个 7/7 的身材才好用。Golden Egg 是最便宜的保险，传说卡的 Zombie 则是后期的保险。

## 接下来去哪里

- [卡组页面](/zh-cn/decks/community/the-trick-or-treat-legion-72c4)上有卡表和图表、作者的笔记、“在卡组构筑器中打开”按钮，以及游戏代码（KGBLDC…）。
- 卡牌数据为 [2026年9月29日 0.7 补丁](/zh-cn/news/patch-0-7)的版本，该补丁把 Bagheera 从一费提高到两费、Mind Palace 从两费提高到三费；2026年10月27日的 0.8 补丁说明（抢先体验）没有提到卡牌改动。
`,
  },
  "three-pigs-midrange-guide": {
    title: "3 Pigs Mid Range：Three Not So Little Pigs 中速卡组怎么玩",
    metaTitle: "Three Not So Little Pigs 卡组攻略",
    excerpt: "3 Pigs Mid Range 卡组攻略：这副由 Three Not So Little Pigs 带领的中速卡组，适合天梯和竞技。本文讲解它的完整卡表、如何先赢场面再收尾、调度时该留哪些牌、逐回合打法，以及为什么保持费用曲线对这副卡组如此重要。",
    faq: [
      {
        q: "哪张传说卡带领 3 Pigs Mid Range？",
        a: "Three Not So Little Pigs，一张 7 法力、具有践踏的 3/3：它的揭示时会在其他每个地点召唤一只具有践踏的 Not So Little Pig，所以一张牌就能在每条战线上放一个单位。",
      },
      {
        q: "调度时留哪些牌？",
        a: "始终寻找 Bagheera、Ali Baba、Big Bad Wolf 和 Rumple。对阵带有危险的 4 点生命值卡牌（如 Van Helsing 或 Glinda）的卡组时，也要留下 Axe Throw。",
      },
      {
        q: "这副卡组如何终结对局？",
        a: "用 En Passant，它移动一个友方并打击其对面的角色；用 Ellen Trechend，她的践踏会把伤害推进屏障；还有 Impundulu 每次攻击时加入你手牌的 Lightning Strike。",
      },
      {
        q: "怎样试用这副卡组？",
        a: "在 OriginsMeta 上打开卡组页面，点击“在卡组构筑器中打开”，或点击“复制游戏代码”，把游戏代码（KGBLDC…）粘贴到 Origins 中。构筑器会检查 1 张传说卡 + 12 张卡 × 2 的规则。",
      },
    ],
    body: `
**写于 0.7 补丁之前。** 这副卡组和这篇攻略发布于 2026年9月29日的 [0.7 补丁](/zh-cn/news/patch-0-7)之前：卡表和打法并不是 0.7 版本的标准答案。卡牌表格显示的是当前的费用和数据。

## 一段话介绍这副卡组

**3 Pigs Mid Range** 是本站工作人员 [Davdas](/zh-cn/authors/davdas) 于 2026年9月15日在 OriginsMeta 上发布的第二副卡组。这是一副由 [Three Not So Little Pigs](/zh-cn/cards/three-not-so-little-pigs) 带领的**中速**（Midrange）卡表，标签为**天梯**和**竞技**。思路很简单：在前几个回合赢下场面，至少在一个地点取得领先，然后用那些惩罚“躲在屏障后面就安全”的对手的牌收尾。完整卡表、构成图表和游戏代码在[卡组页面](/zh-cn/decks/community/3-pigs-mid-range-6311)上；本攻略讲解如何驾驶它。第二篇攻略介绍[对局分析、关键互动与 Conquest](/zh-cn/guides/three-pigs-midrange-matchups)。

## 卡表

二十五张牌：传说卡加十二张各带两份的卡。

| 卡牌 | 费用 | 定位 |
| --- | --- | --- |
| [Three Not So Little Pigs](/zh-cn/cards/three-not-so-little-pigs) ★ | 7 | 传说卡：践踏，揭示时在其他每个地点召唤一只具有践踏的 Not So Little Pig |
| [Bagheera](/zh-cn/cards/bagheera) | 2 | 两费卡，打在中间格位时会成长 |
| [Rumple](/zh-cn/cards/rumple) | 2 | 2/2，下回合给你 +1 法力 |
| [Axe Throw](/zh-cn/cards/axe-throw) | 2 | 对任意角色造成 4 点伤害 |
| [Piglet](/zh-cn/cards/piglet) | 2 | 揭示时增益其所在地点的其他友方 |
| [Mind Palace](/zh-cn/cards/mind-palace) | 3 | 抽 2 张牌 |
| [Big Bad Wolf](/zh-cn/cards/big-bad-wolf) | 3 | 3/3，每次战斗后获得 +1/+1 |
| [Wicked Witch of the West](/zh-cn/cards/wicked-witch-of-the-west) | 3 | 1/5：在伤害中存活时，将一只 Flying Monkey 加入你的手牌，并向左移动一格 |
| [En Passant](/zh-cn/cards/en-passant) | 3 | 移动一个友方，并对其对面的角色造成等同于其力量的伤害 |
| [Ali Baba](/zh-cn/cards/ali-baba) | 3 | 2/3，伤害对手的屏障时抽一张牌 |
| [Frog Prince](/zh-cn/cards/frog-prince) | 3 | 揭示时选择 +3 力量或 +3 生命值 |
| [Impundulu](/zh-cn/cards/impundulu) | 5 | 3/6：每次攻击时将一张 Lightning Strike 加入你的手牌 |
| [Ellen Trechend](/zh-cn/cards/ellen-trechend) | 8 | 践踏；揭示时其所在地点每有一张敌方卡牌就会成长 |

九个单位和三张法术。除了 Impundulu、Pigs 和 Ellen Trechend 之外，所有牌的费用都在三费及以下，这就是作者称这条曲线“非常稳固”的原因：第一到第四回合总有牌可出。

## 这副卡组如何获胜

打法来自卡组页面：在前几个回合掌控场面，至少在一个地点取得领先，然后用三张牌收尾。

- **En Passant** 移动一个友方，并对其对面的角色造成等同于其力量的伤害：它能为你的大型单位扫清道路，或者把已经成长的 Big Bad Wolf 变成解场。
- **Ellen Trechend** 具有践踏（Trample），揭示时（On Reveal）其所在地点每有一张敌方卡牌就会成长：对手在一条战线上投入得越多，她打得越狠，而践踏会把多余的伤害穿过阻挡者打进屏障。卡组页面称她为“几乎犯规的终结者”。
- **Impundulu**，如果你前几个回合打得好，它每次攻击都会奖励你一张 Lightning Strike。每张 Strike 都必须在下一次战斗前用掉，否则会被弃掉，所以每回合要为它预留两点法力。

传说卡是两个阶段之间的桥梁。七费的 Three Not So Little Pigs 一张牌就能在另外两个地点各放一只具有践踏的小猪，外加它自己的 3/3 践踏身材。按曲线打出时，它会在 Ellen Trechend 登场的前一回合把整个场面重新填满。

## 调度

始终寻找 **Bagheera、Ali Baba、Big Bad Wolf 和 Rumple**：它们能按曲线提供良好的开局，并支援已经在场的小猪。对阵带有危险的 4 点生命值卡牌（如 Van Helsing 或 Glinda）的卡组时，也要留下 **Axe Throw**：它正好对任意角色造成四点伤害。Ellen Trechend 和 Impundulu 不是你想要的起手牌：这副卡组之后会用 Mind Palace 和 Ali Baba 找到它们。

## 逐回合打法

1. **第 1–3 回合：拿下场面。** Bagheera 放在中间格位，然后是 Rumple 或 Piglet，再然后是一张三费卡。第二回合打 Rumple 意味着第三回合有四点法力，可以打 Wolf 加 Bagheera，或者 Witch 加一张法术。Wicked Witch of the West 是这副卡组的城墙：五点生命值让她能扛住大多数早期攻击，每次存活你都会获得一只 Flying Monkey，而她会向左移动一格。
2. **第 4–6 回合：选一条战线施压。** Ali Baba 想要打屏障：每打中一次你就抽一张牌。Frog Prince 要么是能以小换大的 5/2，要么是能守住战线的 2/5；看清对手揭示了什么之后再选择。Impundulu 在五费时登场，从第一次攻击起就开始产出 Lightning Strike。
3. **第 7–8 回合：终结者。** 七费打 Pigs（如果上回合打了 Rumple，六费就能打），八费把 Ellen Trechend 打进对手卡牌最多的地点。同一回合用 En Passant 把威胁移到对手意想不到的地方，或者解掉挡路的那个阻挡者。

## 保持曲线

卡组页面对主要弱点说得很清楚：“断曲线会大大降低它的潜力”。这份卡表没有清场，也没有治疗屏障的手段，所以你跳过的每一个回合都等于白送给对手。有两个习惯会有帮助。不要为了一个“完美”回合而留着 Rumple：额外的法力在早期更值钱。也不要为了等更好的目标而把 Lightning Strike 留在手里：打在屏障上的 Strike 仍然是三点伤害，不用就会浪费掉。

## 接下来去哪里

- [卡组页面](/zh-cn/decks/community/3-pigs-mid-range-6311)上有卡表及法力曲线、出处和关键词图表、作者的笔记、通往[卡组构筑器](/zh-cn/deck-builder)的“在卡组构筑器中打开”按钮，以及可粘贴到 Origins 中的游戏代码（KGBLDC…）。
- [对局分析、关键互动与 Conquest](/zh-cn/guides/three-pigs-midrange-matchups) 是本攻略的第二部分。
- 卡牌数据为 2026年9月21日试玩版补丁的版本，于 9月22日在游戏中核对，并加入了 2026年9月29日 [0.7 补丁](/zh-cn/news/patch-0-7)的改动：Bagheera 现在为两费，Mind Palace 为三费；2026年10月27日的 0.8 补丁说明（抢先体验）没有提到卡牌改动。这份卡表中有几张卡在 0.6.2 和 0.6.3 中被改动过，而且自 9月21日起 Frog Prince 不再清除已有的增益：请查看每张卡页面上的平衡历史。
`,
  },
  "origins-tcg-explained": {
    title: "五分钟了解 Origins TCG",
    excerpt: "五分钟读懂 Origins TCG：这是什么游戏、一局对局如何在三条战线上以同时行动的回合进行、“免费竞技”是什么意思、有哪些游戏模式，以及如何在今天就通过 Steam 免费游玩这款由 Koin Games 开发、以公有领域传说为角色的数字集换式卡牌游戏。",
    faq: [
      {
        q: "Origins TCG 是什么？",
        a: "一款由 Koin Games 开发的数字集换式卡牌游戏，Koin Games 是一家总部位于美国佛罗里达州坦帕、成立于 2021年的工作室。游戏的角色来自公有领域的传说——Robin Hood、Mulan、Queen of Hearts、Dracula 等等——在同一个原创世界中被重新演绎。",
      },
      {
        q: "一局对局要多长时间？",
        a: "大约七分钟。双方玩家在三条战线上同时行动，所以没有人需要等待对手的回合。",
      },
      {
        q: "一副卡组有多少张牌？",
        a: "二十五张，围绕一张拥有标志性能力的传说卡构筑。Mulan 会重复你友方的揭示时能力，Queen of Hearts 会重复它们的死亡时能力。",
      },
      {
        q: "Origins TCG 可以免费玩吗？",
        a: "可以。Origins TCG 在 Steam 上免费游玩，自 2026年10月27日起处于抢先体验阶段，Koin Games 表示它将永远免费游玩、免费竞技，不过抢先体验会包含“一些付费的高级功能”。竞技所需的每一张卡都能通过游玩获得；花钱只能买到卡牌的收藏版本。",
      },
    ],
    body: `
## 这是什么游戏

Origins TCG 是一款由 **Koin Games** 开发的数字集换式卡牌游戏，Koin Games 是一家总部位于美国佛罗里达州坦帕的工作室，由业内资深人士于 2021年创立。游戏的角色来自公有领域的传说，在同一个原创世界中被重新演绎：Robin Hood、Mulan、Queen of Hearts、Winnie-the-Pooh、King Arthur、Dracula 等等。

它的卖点是**免费竞技**（free-to-compete）：竞技所需的每一张卡都能通过游玩获得。花钱只能买到卡牌的收藏版本，这些版本可以评级、交换和出售。开发者称之为“零氪金致胜”（zero pay-to-win）。

## 一局对局如何进行

- **三条战线。** 你和对手同时在三个战场上交锋。每条战线都有自己的地点，从一个超过一百个地点的池中抽取，这些地点会轮换，并改变那个战场的规则。
- **同时行动的回合。** 双方玩家同时行动，所以不用等待。一局对局大约七分钟。
- **卡牌会攻击。** 与单纯“比战线点数”的游戏不同，单位之间会互相战斗：力量（Power）是你造成的伤害，生命值（Health）是你能承受的伤害。
- **关键词。** 游戏使用揭示时（On Reveal，卡牌打出时触发）、死亡时（On Death）、先攻（First Strike）、连击（Double Attack）和死触（Deathtouch）等关键词。
- **一张传说卡带领整副卡组。** 卡组为 25 张牌，每副卡组都围绕一张拥有标志性能力的传说卡构筑：Mulan 会重复你友方的揭示时能力，Queen of Hearts 会重复它们的死亡时能力。目前有十二张可用的传说卡：[全部 12 张传说卡，逐张介绍](/zh-cn/guides/origins-tcg-legendaries)。

## 游戏模式

试玩版有新手教程、对抗拥有各自 AI 的首领的任务，以及在线对战；自 2026年10月27日起，游戏进入抢先体验阶段，你在试玩版中的账号、收藏和进度都已转移过来。封闭测试的 0.6.1 补丁加入了**排位天梯**，段位最高到 Grandmaster，并有全球排行榜和胜利点数。排位于 2026年10月15日向所有人开放，10月27日的 0.8 更新开放了 Grandmaster 段位及其排行榜：具体如何运作，见我们的 [Origins TCG 排位攻略](/zh-cn/guides/origins-tcg-ranked)。

## 现在怎么玩

1. 在 [Steam 页面](https://store.steampowered.com/app/4429430/Origins_TCG/)获取 Origins TCG：它免费游玩，自 2026年10月27日起处于抢先体验阶段。如果你玩过试玩版，你的账号和收藏已经在里面了，试玩版可以卸载。自 0.8 更新起，收藏版卡牌可以在 Steam 市场上购买、出售和挂牌。
2. 加入[官方 Discord](https://discord.gg/originstcg)，参加锦标赛、与团队的 AMA，以及后续版本的试玩测试。
3. 自 2026年9月29日的 [0.7 补丁](/zh-cn/news/patch-0-7)起，游戏支持 13 种语言：英语、法语、意大利语、德语、西班牙语（西班牙）、日语、韩语、波兰语、葡萄牙语（巴西）、葡萄牙语（葡萄牙）、俄语、简体中文和西班牙语（拉丁美洲）。2026年10月28日阅读的 Steam 页面列出了同样 13 种界面语言，完整语音仅有英语。移动版计划于 2027年推出。

## 游戏的发展方向

自 2026年10月27日起，Origins TCG 随 0.8 更新在 Steam 上进入抢先体验，Koin 的目标是在 2027年3月左右推出 1.0 版本：根据 Steam 页面，“大约 2027年3月17日”，日期可能会变。在此之前，试玩版于 2026年9月21日迎来第一次大更新，9月29日推出了锦标赛前的最后一次平衡补丁 0.7；排位于 10月15日开放，而工作室迄今最大的锦标赛 Crimson Cup 在 Steam Next Fest 期间举行，由 CoachCrono 于 10月25日夺冠。Alpha Edition 的 Kickstarter 于 2026年10月27日开启。请参阅[路线图](/zh-cn/guides/roadmap-and-dates)和我们的 [Kickstarter 攻略](/zh-cn/guides/origins-tcg-kickstarter)。
`,
  },
};
