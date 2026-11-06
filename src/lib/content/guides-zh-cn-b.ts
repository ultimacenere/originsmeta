import type { GuideCopy, GuideSlug } from "./guides";

/**
 * Testi in cinese semplificato delle guide della redazione (04/11/2026, ottava lingua del sito), le altre dieci (da three-pigs-midrange-matchups a streaming-tools; le prime in guides-zh-cn.ts): solo i testi,
 * il resto dalla versione inglese di guides.ts. Glossario, tono e ancore in pinyin: docs/cinese.md.
 */
export const zhCnTextB: Partial<Record<GuideSlug, GuideCopy>> = {
  "three-pigs-midrange-matchups": {
    title: "3 Pigs Mid Range：对局分析、关键互动与 Conquest",
    metaTitle: "Three Not So Little Pigs 卡组对局分析",
    excerpt: "3 Pigs Mid Range 攻略第二部分：这套以 Three Not So Little Pigs 为核心的中速卡组如何赢下对局。本文讲解决定胜负的五个关键互动，对阵 Van Helsing 控制、铺场卡组和其他中速卡组的打法，需要避免的常见失误，以及它在 Conquest 中的搭配。",
    faq: [
      {
        q: "Ellen Trechend 对付铺满的场面有什么用？",
        a: "她在揭示时会因其所在地点的每张敌方卡牌而成长，并拥有践踏，所以对手堆满的那一路正是她最好的目标：超出阻挡者生命值的伤害会打进屏障。",
      },
      {
        q: "如何对阵 Van Helsing 卡组？",
        a: "把 Axe Throw 留给生命值为 4 的 Van Helsing，趁 Forbidden Knowledge 还没到 8 费可用之前尽早施压；Boitata 在场时，把 Lightning Strike 打向角色，而不是屏障。",
      },
      {
        q: "3 Pigs Mid Range 和 Healing Healsing 能在 Conquest 中一起使用吗？",
        a: "可以。两套卡组的传说卡不同，只共用一张卡 Ali Baba，因此相差 12 张不同的卡牌（含传说卡），超过 Crimson Cup 要求任意两套卡组之间至少相差的 8 张。",
      },
    ],
    body: `
**写于 0.7 补丁之前。** 这套卡组和本攻略发布于 2026年9月29日的 [0.7 补丁](/zh-cn/news/patch-0-7)之前：卡表和打法思路不能作为 0.7 版本的标准。卡牌表格中显示的是当前的费用和数值。

## 开始之前

这是 **3 Pigs Mid Range** 攻略的第二部分。这是一套以 [Three Not So Little Pigs](/zh-cn/cards/three-not-so-little-pigs) 为核心的中速卡组，由 OriginsMeta 团队成员 [Davdas](/zh-cn/authors/davdas) 于 2026年9月15日发布。[第一部分](/zh-cn/guides/three-pigs-midrange-guide)介绍了卡表、打法思路、调度和逐回合打法。本篇讨论决定对局的互动、各个对局，以及这套卡组标注的赛制。作者的笔记在[卡组页面](/zh-cn/decks/community/3-pigs-mid-range-6311)上；下面的对局分析是 OriginsMeta 根据 0.6.3 补丁的卡牌文本做出的解读；9月21日试玩版补丁和 9月29日 [0.7 补丁](/zh-cn/news/patch-0-7)（将 Bagheera 的费用提高到 2，Mind Palace 提高到 3）的改动见 [MetaShifting](/zh-cn/metashifting)。

## 需要掌握的五个互动

1. **Rumple 衔接终结者。** Rumple 让你下回合获得 +1 法力。第五回合打出，你就能在第六回合揭示 Three Not So Little Pigs，比对手预期的 7 费卡早整整一回合；第六回合打出，则能让 Ellen Trechend 在第七回合登场。
2. **Wicked Witch 和她的 Flying Monkey。** Witch 是 1/5：她很少被一次攻击打死，每当她承受伤害后存活，你就会获得一张 [Flying Monkey](/zh-cn/cards/flying-monkey) 到手牌，而她向左移动一格。Monkey 的揭示时效果会将任意另一个角色（你的或对手的）移动到其所在地点的一个随机格位：用它把敌方阻挡者拖出你正用践踏突破的那一路，或者把 Wolf 带到交战的地方。
3. **En Passant 用在成长后的角色上。** 这张法术移动一个友方角色，并对其正对面的角色造成等同于其力量的伤害。用在已经战斗过两次的 Big Bad Wolf 身上，就是 5 点伤害外加一次换位；用在 Ellen Trechend 身上，则是一次解场，同时把她的践踏带到屏障最薄弱的地方。它也是对付停在你某只猪面前的阻挡者的办法。
4. **Impundulu 的 Lightning Strike。** 每次攻击都会加入一张 [Lightning Strike](/zh-cn/cards/lightning-strike)：2 费对任意角色或屏障造成 3 点伤害，必须在下一次战斗前使用。这是可重复的定点 3 点伤害：足以解掉当前卡池中大多数前期卡，或者在场面已经归你时直接打屏障。
5. **Piglet 配猪。** Piglet 的揭示时效果会强化其所在地点的其他友方角色。Pigs 登场后的下一回合，一只 Piglet 放在 Not So Little Pig 旁边，就能造出一个打得更疼的践踏身材：卡组页面写道，调度保留的牌“支援已经在场上的猪”。

## 对局分析

排位数据尚未公开，因此以下是对卡表的解读，而不是胜率。

**对阵 Van Helsing 控制，例如同一作者的 [Healing Healsing](/zh-cn/decks/community/healing-healsing-9411)。** 调度笔记说要保留 Axe Throw，指的就是这个对局：Van Helsing 是 3/4，4 点伤害能在他的 Tools 开始每次战斗都到手之前把他解掉。尽早打出伤害，因为控制卡组想撑到 8 费打出 Forbidden Knowledge，它会消灭场上所有角色，你的和对手的都不例外。不要在同一个时间窗口同时下 Pigs 和 Ellen Trechend：留一个终结者到清场后的下一回合。Boitata 在场时，法术对其屏障造成的伤害会改为对你的屏障造成，所以在它离场之前，把 Lightning Strike 打向角色。

**对阵铺场卡组（Swarm 类卡表、Mulan）。** 对手铺得越宽，Ellen Trechend 就越大：她会因其所在地点的每张敌方卡牌而成长。让 Witch 在对手大量下牌的那一路当墙，Frog Prince 以 2/5 而不是 5/2 的形态打出，Axe Throw 留给强化其他角色的那张牌。[Mulan](/zh-cn/cards/mulan) 会重复其友方角色的揭示时效果，所以她是首要目标。

**对阵其他中速卡组（King Arthur、Robin Hood）。** 节奏决定胜负：谁掉了费用曲线，谁就输。Rumple 在这里最强，而 Impundulu 的 Lightning Strike 是均势场面上的胜负手。[Robin Hood](/zh-cn/cards/robin-hood) 的揭示时效果对所有敌人造成 2 点伤害，能杀死 Bagheera、Piglet 和刚下的 Rumple，但杀不死 Witch 或以 2/5 打出的 Frog Prince：到了 8 费，不要往一路堆小单位。[King Arthur](/zh-cn/cards/king-arthur) 给予善良角色护盾，所以 Axe Throw 要留到护盾被消耗之后。

## 需要避免的失误

- **把 Pigs 当救命稻草。** 这张传说卡会在其他地点的随机格位召唤猪：当那几路已经有 Wolf 或 Witch 并肩作战时它最强，而不是在一切都已经输掉的时候。
- **捏着 Rumple 不下。** 它是一个带额外效果的 2/2 身材，而这个效果在第二到第六回合价值最高。
- **浪费 Lightning Strike。** 它们会在下一次战斗前被弃掉：打在屏障上的一发，总比白白丢掉的一发好。
- **忘记弱点。** 卡组页面列出了弱点：没有群体解场，也没有给己方屏障的治疗。除非你在场面上已经领先，否则不要和会回血的卡组拼速度。

## Conquest 与“竞技”标签

这套卡组同时标注了天梯和竞技。Conquest 赛制最早用于 Big Bob's Playtest Battle，也是 Steam Next Fest 期间 [Crimson Cup](/zh-cn/news/crimson-cup-format-check-in) 的赛制：你要报名三套传说卡各不相同的卡组，且任意两套卡组之间至少相差 8 张不同的卡牌（规则于 2026年9月24日公布）。3 Pigs Mid Range 天然适合与同一作者的另一套卡表 [Healing Healsing](/zh-cn/decks/community/healing-healsing-9411) 搭配：传说卡不同，唯一共用的卡是 Ali Baba，因此两者相差 12 张不同的卡牌（含传说卡）。[卡组构筑器](/zh-cn/deck-builder)的锦标赛模式会替你计算差异。
`,
  },
  "healing-healsing-guide": {
    title: "Healing Healsing：Van Helsing 控制卡组玩法攻略",
    metaTitle: "Van Helsing 卡组攻略：Healing Healsing",
    excerpt: "Healing Healsing 卡组攻略：以 Van Helsing 为核心的控制卡组，靠治疗、过牌和清场取胜。本文介绍完整卡表、取胜思路、Van Helsing's Tools 的四种用法、调度时该保留哪些牌，以及从第一回合到 Forbidden Knowledge 的逐回合打法。",
    faq: [
      {
        q: "Healing Healsing 的传说卡是哪张？",
        a: "Van Helsing，4 费 3/4：每次战斗前，如果你手中没有 Van Helsing's Tools，他就将其加入你的手牌。这是一张“选择一项”的卡，可以打出 Holy Water、Silver Bullet、Garlic 或 Wooden Stake。",
      },
      {
        q: "调度时保留哪些牌？",
        a: "保留 Ali Baba、Baby Bear、Scarecrow、Van Helsing 和 Spellbook；对阵快攻时再保留 Jill。Shahrazad 和 Phuong Hoang 不是你在前几回合想要的牌。",
      },
      {
        q: "什么时候打出 Forbidden Knowledge？",
        a: "到 8 点法力时，也就是从第八或第九回合起，最好是在对手先揭示的回合：对手先把牌下到场上，然后这张法术消灭场上所有角色。",
      },
      {
        q: "连自己的场面也一起消灭，这套卡组靠什么赢？",
        a: "靠卡牌优势：Spellbook、Scarecrow 和 Ali Baba 让手牌保持充足，Baby Bear 死亡后留下 Papa Bear，Jekyll 在手中会变成 Hyde，而治疗让 Phuong Hoang 不断成长，直到对手再也拿不出解法。",
      },
    ],
    body: `
**写于 0.7 补丁之前。** 这套卡组和本攻略发布于 2026年9月29日的 [0.7 补丁](/zh-cn/news/patch-0-7)之前：卡表和打法思路不能作为 0.7 版本的标准。卡牌表格中显示的是当前的费用和数值。

## 一段话了解这套卡组

**Healing Healsing** 是 OriginsMeta 上发布的第一套卡组，由网站团队成员 [Davdas](/zh-cn/authors/davdas) 于 2026年9月15日发布。这是一套以 [Van Helsing](/zh-cn/cards/van-helsing) 为核心的**控制**卡表，标注用于**天梯**。思路是在前几回合存活下来并积累价值，靠治疗扛住伤害，同时让 [Phuong Hoang](/zh-cn/cards/phuong-hoang) 随每次治疗成长，等你有了 8 点法力，再用 [Forbidden Knowledge](/zh-cn/cards/forbidden-knowledge) 清场。完整卡表、构成图表和卡组代码都在[卡组页面](/zh-cn/decks/community/healing-healsing-9411)上；本攻略讲解如何驾驭它。第二篇攻略介绍[对局、关键互动和需要避免的失误](/zh-cn/guides/healing-healsing-matchups)。

## 卡表

25 张牌：传说卡，加上 12 张各带两份的卡牌。

| 卡牌 | 费用 | 作用 |
| --- | --- | --- |
| [Van Helsing](/zh-cn/cards/van-helsing) ★ | 4 | 传说卡：战斗前，如果你手中没有 Van Helsing's Tools，就将其加入你的手牌 |
| [Baby Bear](/zh-cn/cards/baby-bear) | 3 | 对伤害你屏障的敌人造成伤害；死亡时将 Papa Bear 加入你的手牌 |
| [Scarecrow](/zh-cn/cards/scarecrow) | 2 | 揭示时：抽一张牌 |
| [Shahrazad](/zh-cn/cards/shahrazad) | 2 | 1/4：每当有一张牌进入你的手牌，为你的屏障治疗 1 点伤害 |
| [Ali Baba](/zh-cn/cards/ali-baba) | 3 | 2/3，对对手的屏障造成伤害时抽一张牌 |
| [Jill](/zh-cn/cards/jill) | 3 | 2/4：每当她受到伤害，为你的屏障治疗 2 点伤害 |
| [Spellbook](/zh-cn/cards/spellbook) | 4 | 本局剩余时间里，每回合开始时获得一张随机法术 |
| [Phuong Hoang](/zh-cn/cards/phuong-hoang) | 4 | 重生、移动；每当一个友方角色或屏障被治疗，获得 +1/+1 |
| [Jekyll](/zh-cn/cards/jekyll) | 4 | 揭示时治疗 3 点伤害；如果战斗后仍在手牌中，变为 Hyde，一个带践踏的 5/3 |
| [Searing Light](/zh-cn/cards/searing-light) | 3 | 对一个敌人造成 4 点伤害，并为你在该地点的屏障治疗 4 点伤害 |
| [Boitata](/zh-cn/cards/boitata) | 5 | 5/5：法术和能力对你的屏障造成的伤害，改为对对手的屏障造成 |
| [Tin Woodman](/zh-cn/cards/tin-woodman) | 6 | 揭示时为其所在地点的任意另一个角色或屏障治疗 8 点伤害 |
| [Forbidden Knowledge](/zh-cn/cards/forbidden-knowledge) | 8 | 消灭所有角色 |

9 个单位和 3 张法术；几乎所有牌的费用都在 2 到 4 之间，顶端是 Boitata、Tin Woodman 和 Forbidden Knowledge。3 张牌过牌，5 张治疗，1 张清场。

## 卡组如何取胜

卡组页面上的思路，分四步：

1. **控制前几回合**，同时用 Spellbook 和 Ali Baba 迅速积累价值。
2. **撑到第八或第九回合**，打出 Forbidden Knowledge 夺回主动权。尽量在对手先揭示的回合打出，这样法术结算时对手的牌都在场上。
3. **靠卡牌优势和价值取胜。** 对手卡组的资源应该会先耗尽，而你仍有足够的治疗来提升 Phuong Hoang 的伤害。
4. **保持控制。** 多出来的牌让你能长时间掌控场面。

有两个引擎让这一切运转。第一个是**进入你手牌的牌**：Van Helsing 每次战斗前加入他的 Tools，Spellbook 每回合开始时加入一张法术，Scarecrow 和 Ali Baba 过牌，而通过 Shahrazad，这些牌每一张都会治疗 1 点。第二个是**治疗**：每一次治疗，从 Shahrazad 的 1 点到 Tin Woodman 的 8 点，都给 Phuong Hoang +1/+1。在场上待了几回合的 Phuong 才是这套卡组真正的威胁，她还带有重生和移动关键词（见她的卡牌页面）。

## Van Helsing's Tools

传说卡本身是 4 费 3/4。关键在于每次战斗前、你手中没有时他会加入的那张牌：[Van Helsing's Tools](/zh-cn/cards/van-helsings-tools) 自 0.6.2 补丁起免费，让你从四种效果中选择一项。

- [Holy Water](/zh-cn/cards/holy-water)：移除任意角色的所有能力。
- [Silver Bullet](/zh-cn/cards/silver-bullet)：对任意角色造成伤害。
- [Garlic](/zh-cn/cards/garlic)：眩晕任意角色。
- [Wooden Stake](/zh-cn/cards/wooden-stake)：消灭任意受伤的角色。

“如果你手中没有”是要记住的条件：每回合都要用掉 Tools，否则 Van Helsing 就不会再加入它们。Wooden Stake 正是卡组页面所说这套卡表原本缺少的单体解场：先用 Baby Bear 的点射、Searing Light 或 Silver Bullet 让角色受伤，再用木桩钉死它。

## 调度

保留 **Ali Baba、Baby Bear、Scarecrow、Van Helsing 和 Spellbook**。对阵快攻卡组时也保留 **Jill**：每当她受到伤害，就为你的屏障治疗 2 点。Shahrazad 和 Phuong Hoang 在前几回合没用：它们是收益，不是铺垫，所以换掉。

## 逐回合打法

1. **第 1–3 回合：铺垫。** 第二回合下 Scarecrow 或 Baby Bear，第三回合下 Spellbook 或 Ali Baba。Spellbook 是第三回合的最佳选择：从那以后你每回合开始都多一张法术，而 Shahrazad 会把其中每一张都变成一次治疗。
2. **第 4–5 回合：Van Helsing 和第一批治疗。** 第四回合下 Van Helsing，或用 Jekyll 治疗一个受伤的单位或屏障。场上至少有一个治疗来源后，再下 Phuong Hoang。第五回合下 Boitata：从此，法术和能力对你任何屏障造成的伤害，都会改为对对手在该地点的屏障造成。
3. **第 6–7 回合：稳住局面。** Tin Woodman 的 8 点治疗给受压的屏障，Searing Light 打最大的威胁，每次战斗都用 Tools。
4. **第 8 或 9 回合：Forbidden Knowledge。** 双方所有角色全部死亡。你这边损失更少：Baby Bear 在你手中留下 Papa Bear，留在手中的 Jekyll 已经变成 Hyde，Tools 会在下一次战斗前回来，而且你整局都比对手抽了更多牌。

## 接下来

- [卡组页面](/zh-cn/decks/community/healing-healsing-9411)有带法力曲线和关键词图表的卡表、作者笔记、通往[卡组构筑器](/zh-cn/deck-builder)的“在卡组构筑器中打开”按钮，以及可以粘贴到 Origins 中的卡组代码（KGBLDC……）。
- [对局、关键互动和需要避免的失误](/zh-cn/guides/healing-healsing-matchups)是本攻略的第二部分。
- 卡牌数值为 2026年9月21日试玩版补丁的数值，于 9月22日在游戏中核对，并包含 2026年9月29日 [0.7 补丁](/zh-cn/news/patch-0-7)的改动：Spellbook 现在费用为 4，且它加入的法术不会再是 Spellbook；2026年10月27日（抢先体验）的 0.8 补丁说明没有提到任何卡牌改动。这份卡表中的 Scarecrow、Van Helsing's Tools 和其他卡牌在 0.6.2 和 0.6.3 中有过改动，且自 9月21日起 Wooden Stake 也可以选择满生命值的角色为目标：平衡历史见各卡牌页面。
`,
  },
  "healing-healsing-matchups": {
    title: "Healing Healsing：对局分析、关键互动与常见失误",
    metaTitle: "Van Helsing 卡组对局：Healing Healsing",
    excerpt: "Healing Healsing 攻略第二部分：Van Helsing 控制卡组的治疗与过牌互动，对阵 3 Pigs Mid Range、快攻铺场和其他控制卡组的打法，会让你输给快攻的常见失误，以及它在 Conquest 赛制中如何与其他卡组搭配。",
    faq: [
      {
        q: "Healing Healsing 里最强的互动是什么？",
        a: "Shahrazad 配合 Van Helsing 和 Spellbook：每次战斗前的 Tools 和每回合开始时的法术，都会通过 Shahrazad 各治疗 1 点，而每次治疗都给 Phuong Hoang +1/+1。",
      },
      {
        q: "如何对阵 3 Pigs Mid Range？",
        a: "不要把一路堆满：Ellen Trechend 会因其所在地点的每张敌方卡牌而成长。Boitata 留着应对 Lightning Strike，用治疗扛住猪的践踏伤害，Forbidden Knowledge 留到 Pigs 登场后的下一回合。",
      },
      {
        q: "用这套卡组最容易因为什么输？",
        a: "过早打出 Forbidden Knowledge；让 Van Helsing's Tools 留在手里，导致他不再加入新的；以及在没有任何治疗目标之前就打出 Phuong Hoang。",
      },
    ],
    body: `
**写于 0.7 补丁之前。** 这套卡组和本攻略发布于 2026年9月29日的 [0.7 补丁](/zh-cn/news/patch-0-7)之前：卡表和打法思路不能作为 0.7 版本的标准。卡牌表格中显示的是当前的费用和数值。

## 开始之前

这是 **Healing Healsing** 攻略的第二部分。这套 Van Helsing 控制卡组由 OriginsMeta 团队成员 [Davdas](/zh-cn/authors/davdas) 于 2026年9月15日发布，是网站上的第一套社区卡组。[第一部分](/zh-cn/guides/healing-healsing-guide)介绍了卡表、打法思路、调度和逐回合打法。本篇讨论决定对局的互动、各个对局，以及代价最大的失误。作者的笔记在[卡组页面](/zh-cn/decks/community/healing-healsing-9411)上；下面的对局分析是 OriginsMeta 根据 0.6.3 补丁的卡牌文本做出的解读；9月21日试玩版补丁和 9月29日 [0.7 补丁](/zh-cn/news/patch-0-7)（将 Spellbook 的费用提高到 4）的改动见 [MetaShifting](/zh-cn/metashifting)。

## 需要掌握的五个互动

1. **Shahrazad 与一切让你获得手牌的效果。** 每当有一张牌进入你的手牌，[Shahrazad](/zh-cn/cards/shahrazad) 就为你在其所在地点的屏障治疗 1 点伤害。Van Helsing 每次战斗前加入他的 Tools，Spellbook 每回合开始时加入一张法术，Scarecrow 和 Ali Baba 过牌，Baby Bear 死亡时加入 Papa Bear。Shahrazad 和 Van Helsing 同时在场时，你每回合都能回血，而且不用花一张牌。
2. **每次治疗都在喂养 Phuong Hoang。** 每当一个友方角色或屏障被治疗，[Phuong Hoang](/zh-cn/cards/phuong-hoang) 就获得 +1/+1。Tin Woodman 的揭示时效果是一次 8 点的治疗，所以只算一次 +1/+1；对 Phuong 来说，Shahrazad 的多次小治疗比一次大治疗更有价值。
3. **Jekyll 与 Hyde。** [Jekyll](/zh-cn/cards/jekyll) 的揭示时效果为其所在地点的任意另一个角色或屏障治疗 3 点伤害。战斗后仍留在手中，他会变成 [Hyde](/zh-cn/cards/hyde)，一个带践踏的 5/3；而留在手中的 Hyde 又会变回 Jekyll：同一张牌是治疗者还是终结者，取决于你何时打出它。
4. **Boitata 克制直伤。** 如果一个法术或能力将对你的某个屏障造成伤害，[Boitata](/zh-cn/cards/boitata) 会改为对对手在该地点的屏障造成这些伤害。对阵用 Lightning Strike 或 Searing Light 收尾的卡组，Boitata 会把对手的斩杀能力变成你的。
5. **Baby Bear 一家。** [Baby Bear](/zh-cn/cards/baby-bear) 会对伤害你在其所在地点屏障的任何敌人造成伤害，死亡时将 [Papa Bear](/zh-cn/cards/papa-bear) 加入你的手牌；Papa Bear 打得更疼，死亡时加入 [Mama Bear](/zh-cn/cards/mama-bear)，而 Mama Bear 会消灭伤害你屏障的敌人。一张 2 费卡换来三个身材，也是 Forbidden Knowledge 结算时最理想的在场单位。

## 对局分析

排位数据尚未公开，因此以下是对卡表的解读，而不是胜率。

**对阵 3 Pigs Mid Range（同一作者的[另一套卡组](/zh-cn/decks/community/3-pigs-mid-range-6311)）和其他中速卡表。** 他们的终结者 Ellen Trechend 会因其所在地点的每张敌方卡牌而成长：把你的单位分散开，不要堆在同一路。Impundulu 的 Lightning Strike 正是 Boitata 的用武之地。Axe Throw 造成 4 点伤害，恰好等于 Van Helsing 的生命值：预料到他会被解掉，不要只靠他来解场。Pigs 在 7 费登场，用践踏填满每一路：Forbidden Knowledge 就留到那时，晚一回合再打。

**对阵快攻和铺场卡组。** 调度笔记说要保留 Jill，指的就是这个对局：每当她受到伤害，就为你的屏障治疗 2 点。Baby Bear 惩罚每个打穿的攻击者，Jekyll 治疗关键目标，Tin Woodman 的 8 点治疗能把一道屏障拉回安全线。不要用 Tools 一个一个追着解对手的单位；先稳住屏障，撑到 8 费，让 Forbidden Knowledge 清掉整个场面。

**对阵其他控制卡组。** 卡牌优势决定胜负，而这套卡组的过牌比大多数卡组都多：Spellbook 是要保护、要先打出的牌。Hyde 留给被清空的那一路，Holy Water 留给撑起对手卡组的传说卡能力，比如会重复友方揭示时效果的 [Mulan](/zh-cn/cards/mulan)，或会重复友方死亡时效果的 [Queen of Hearts](/zh-cn/cards/queen-of-hearts)。

## 需要避免的失误

- **过早打出 Forbidden Knowledge。** 卡组页面的建议是等到对手先揭示的回合，让法术结算时对手的牌都在场上。对着空荡荡的一路清场，就是白白浪费 8 点法力。
- **让 Tools 留在手里。** 只有当你手中没有 Tools 时，Van Helsing 才会加入它们。每次战斗都用掉，哪怕目标很小。
- **在治疗之前下 Phuong Hoang。** 一个无从成长的 4 费 2/3 是张弱牌；同一张牌在 Shahrazad 和 Spellbook 就位后，就是你的胜利手段。调度笔记把她和 Shahrazad 一起列为起手不该保留的牌。
- **把过牌当成奢侈品。** 卡组页面提醒：“需要 Forbidden Knowledge 的时候却找不到它，会非常痛苦。”Scarecrow、Ali Baba 和 Spellbook 就是你找到它的途径，所以即使场面不需要，也要尽早打出它们。

## Conquest

这套卡组只标注了天梯，但它适合 Conquest 阵容：传说卡与 3 Pigs Mid Range 不同，只共用一张卡 Ali Baba，因此两套卡表相差 12 张不同的卡牌（含传说卡），超过 [Crimson Cup](/zh-cn/news/crimson-cup-format-check-in) 要求任意两套卡组之间至少相差的 8 张。[卡组构筑器](/zh-cn/deck-builder)会在锦标赛模式下计算差异。
`,
  },
  "roadmap-and-dates": {
    title: "路线图与日期：从试玩版到抢先体验和 1.0",
    metaTitle: "Origins TCG 路线图与发售日期",
    excerpt: "Origins TCG 所有已确认的日期一览：从 Steam 上的第一篇公告，到免费试玩版、排位模式、Steam Next Fest 期间的 Crimson Cup，再到 2026年10月27日开启的抢先体验和 Kickstarter，以及 1.0 正式版、手机版等接下来的计划。",
    faq: [
      {
        q: "Origins TCG 什么时候在 Steam 上线？",
        a: "2026年10月27日以免费游戏的形式开启抢先体验，版本为 0.8。根据 Steam 页面，Koin Games 的目标是“大约”在 2027年3月17日以 1.0 版本结束抢先体验：这个日期可能会变。",
      },
      {
        q: "Crimson Cup 是什么时候举行的？",
        a: "2026年10月19日至25日，Steam Next Fest 期间：19日至22日进行五场地区资格赛，24日季后赛，25日决赛，CoachCrono 夺冠。奖品总价值 10,000 美元，其中包括一张独家 1/1 宣传卡。",
      },
      {
        q: "Origins TCG 有手机版吗？",
        a: "暂时没有。手机版和手机开包已宣布将于 2027年推出。2025年11月，游戏曾在部分地区的 App Store 软启动，之后工作室才把卡牌交易转移到 Steam。",
      },
      {
        q: "免费试玩版是什么时候推出的？",
        a: "2026年7月15日至16日在 Steam 上推出，试玩玩家可获得独家收藏品。排位天梯于 2026年8月14日随 0.6.1 补丁进入封闭测试，并于 10月15日进入试玩版。试玩版于 2026年10月27日结束，游戏随即转入抢先体验。",
      },
    ],
    body: `
## 试玩版之前

- **2025年8月。** Koin Games 与 Immutable 宣布“Project O”：一款为手机打造、玩家真正拥有卡牌的竞技 TCG。
- **2025年11月。** 在部分地区的 App Store 软启动（0.1.0 版本）。
- **2026年初。** 工作室将卡牌交易转移到 Steam 市场，放弃独立的链上模式。
- **2026年3月。** CEO 被拍到手持实体金属卡牌。尚未公布任何产品或日期。

## 2026年逐月回顾

| 日期 | 发生了什么 |
| --- | --- |
| 5月6日 | Steam 页面上线，开放愿望单 |
| 6月3日 | 官方 Discord 向所有人开放 |
| 7月15–16日 | Steam 免费试玩版推出，附带独家收藏品 |
| 7月21日 | 首批数据：1,000+ 名玩家、13,000+ 场对局，游戏时长中位数 1 小时 51 分 |
| 7月22日 | 与 CEO Tim Jooste 和设计负责人 Kevin Lambert 的 AMA |
| 7月24日 | 第一场试玩版锦标赛 |
| 7月24–26日 | Origins 参加 Fort Lauderdale 的 Card Party |
| 8月7日 | 第一次“Demo 2.0”测试：5 套新卡组、70+ 张卡牌、卡组构筑 |
| 8月14日 | [0.6.1 补丁](https://store.steampowered.com/news/app/4429430/view/1840944183780414)：排位天梯 |
| 8月19日 | Creator Program AMA |
| 8月21日 | [0.6.2 补丁](https://store.steampowered.com/news/app/4429430/view/1841579228669961)：23 张卡牌平衡调整 |
| 8月27日 | [0.6.3 补丁](https://store.steampowered.com/news/app/4429430/view/1842212951301184) |
| 8月28日 | Big Bob's Playtest Battle，第一场 Conquest 锦标赛，130+ 人报名 |
| 9月9日 | [Next Fest 锦标赛公布](https://store.steampowered.com/news/app/4429430/view/1843481262690278) |
| 9月10日 | 官方 Discord 上的 Kickstarter AMA：Alpha Edition、稀有度、评级、交易、VIP 折扣 |
| 9月17日 | [Koin Games 的 CEO 公布 Kickstarter 日期](https://x.com/TimothyJooste/status/2100700207285445011)：Alpha Edition 众筹于 10月27日开启 |
| 9月21日 | [试玩版第一次大更新](https://store.steampowered.com/news/app/4429430/view/1844115010502611)：全新界面和棋盘、收藏者教程、测试卡包、平衡调整、Crimson Cup 暂定卡池 |
| 9月24日 | [Crimson Cup 规则](/zh-cn/news/crimson-cup-format-check-in)：三套卡组的 Conquest，签到 |
| 9月29日 | [0.7 补丁](/zh-cn/news/patch-0-7)，Crimson Cup 前的最后一个平衡补丁：Twister Toss 重做，Bagheera、Mind Palace 和 Spellbook 费用 +1，地点有了稀有度，支持 13 种语言 |
| 10月15日 | [“Ranked is here!”](https://store.steampowered.com/news/app/4429430/view/1846651706679257)：试玩版开放排位模式，天梯暂时止于 Grandmaster |
| 10月19–26日 | Steam Next Fest：据 [Koin Games](https://store.steampowered.com/news/app/4429430/view/1847286114049639) 公布，愿望单超过 20,000 个，试玩版下载 30,000 次，超过 300 人直播本作 |
| 10月19–25日 | Crimson Cup，Steam Next Fest 的锦标赛：五场地区资格赛，24日季后赛，25日决赛，CoachCrono 夺冠；奖品总价值 10,000 美元，Twitch 观看人数峰值超过 5,000 |
| 10月27日 | [试玩版结束，随 0.8 更新开启抢先体验](https://store.steampowered.com/news/app/4429430/view/1847286114049982)：Grandmaster 段位开放，卡牌评级，收藏卡登陆 Steam 市场；同一天，Alpha Edition 的 Kickstarter 开启 |
| 11月4日 | [补丁说明](/zh-cn/news/balance-patch-1104-cyber-queen)：十张卡调整，Cyber Queen 成为第 11 号首领 |
| 11月6日 | 官方 Discord 上的[路线图 AMA](/zh-cn/news/origins-tcg-roadmap-ama-recap)：直到 2 月的抢先体验计划 |

## 接下来

- **现在。** Origins TCG 已在 Steam 免费开启抢先体验，而 Alpha Edition 的 Kickstarter 正在进行中，日期由 Koin Games 的 CEO 于 9月17日公布：详情见我们的 [Kickstarter 攻略](/zh-cn/guides/origins-tcg-kickstarter)。
- **2026年11月10日。** 针对掉线和作弊的更新，不含平衡调整。
- **2026年11月17日。** 平衡补丁，预计会调整 Sherwood Forest。
- **2026年11月。** 抢先体验的第一场月度锦标赛，采用 Conquest 赛制，约 400 个名额；Koin 将在 11月9日那一周公布细节。
- **2026年12月2日。** 当前排位赛季结束，第一次大型更新上线：Collector Pass、Prestige、胶囊、新地点和称号。之后一个赛季持续到 1 月中旬，另一个从 1 月中旬到 2 月。
- **2027年2月。** 完整的 Myths and Legends 系列，约 218 张卡，同时发放所有 Kickstarter 奖励；标准版进入实体店。
- **抢先体验结束时。** Myths and Legends Open，面向通过月度锦标赛晋级的玩家。
- **2027年3月17日前后。** 1.0 版本：Steam 页面写道，Koin 的目标是“大约在 2027年3月17日”结束抢先体验，这个日期可能会变。
- **2027年。** 手机版和手机开包。在 11月6日的 AMA 中，Koin 表示移动版的开发现在开始，暂无日期。在 AMA 中，团队描述了一次完整发布，届时将推出完整的传说卡阵容，包括 King Arthur、Dracula、Winnie-the-Pooh、Alice、Beowulf、Cinderella、Sweeney Todd、Frankenstein 和 Sherlock Holmes。

日期来自官方 Steam 公告和游戏的 Steam 页面（于 2026年10月28日查阅）、工作室的 Discord，Kickstarter 的日期则来自 Koin Games CEO 的帖子。2026年11月之后的日期来自 [11月6日的路线图 AMA](/zh-cn/news/origins-tcg-roadmap-ama-recap)，可能会变。日期有变时，我们会更新本页。
`,
  },
  "collector-economy": {
    title: "两种收藏方式：Origins 的经济系统如何运作",
    metaTitle: "Origins TCG 收藏经济系统详解",
    excerpt: "Origins TCG 的竞技卡牌全部免费获得；收藏版卡牌限量发行、经过数字评级，并可在 Steam 市场交易。本文梳理 Alpha Edition、神包、评级和交易等已确认的信息，以及价格、手续费等尚未确认的部分，并说明为什么收藏版不会影响环境。",
    faq: [
      {
        q: "收藏版卡牌会让卡组更强吗？",
        a: "不会。所有竞技卡牌都在游戏中获得，收藏版只是同一批卡牌的限量版本：它们带编号、经过数字评级、可以交易，但效果完全相同。",
      },
      {
        q: "Alpha Edition 是什么？",
        a: "Myths & Legends: Alpha Edition 是第一个收藏版本，仅限预购：每个补充包 5 张卡，每盒 24 包，每箱 6 盒，共七个稀有度等级，从 Collectible Card（每包都有）到 Storybook（每 1,200 包出 1 张），以上信息来自官方预注册页面。印量售完后，不会再生产 Alpha 盒。",
      },
      {
        q: "Origins 的卡牌在哪里交易？",
        a: "在 Steam 市场：自 2026年10月27日的 0.8 更新（抢先体验的第一个版本）起，收藏卡可以在那里购买、出售和挂单。入门游戏卡永远归你使用；不属于卡牌的收藏类装饰品暂时还不能交易，将在未来的更新中开放。",
      },
      {
        q: "什么是神包（God pack）？",
        a: "一种罕见的卡包，其中每张卡都是传说级或更高稀有度。收藏版还带有评级：2026年7月的 Card Party 上，团队给每位抽到 10/10 Alternate Art 的玩家送了一个 Slab。",
      },
    ],
    body: `
## 双轨分离

Origins 把大多数卡牌游戏混在一起的两件事分开了：

1. **游玩。** 所有竞技卡牌都在游戏中获得。花钱买的任何东西都不会让你的卡组更强。
2. **收藏。** 卡牌的限量版本以带编号的印量发行，**经过数字评级**，可以与其他玩家购买、出售和交易。

工作室自己的加载画面称之为“数字世界里的真正收藏”和“两种收藏方式”。

## 已确认的内容

- **评级卡牌。** 收藏版带有评级；7月的 Card Party 上，团队给每位抽到 **10/10 Alternate Art** 的玩家送了一个 Slab。较低的评级和不同的系列也存在，价值各不相同。自 2026年10月27日的 0.8 更新起，1 到 10 的评级会通过“各种瑕疵和效果”显示在游戏内的收藏卡上，用 Koin 的话说，这“还只是第一版”。
- **神包（God pack）。** 罕见的卡包，其中每张卡都是传说级或更高。
- **Alpha Edition。** 第一个收藏版本“Myths & Legends: Alpha Edition”仅限预购：每个补充包 5 张卡，每盒 24 包，每箱 6 盒，共七个稀有度等级，从 Collectible Card（每包都有）到 Storybook（每 1,200 包出 1 张），信息来自[官方预注册页面](https://founder.origins-tcg.com)。印量售完后，不会再生产 Alpha 盒。Alpha 系列是 2026年9月10日官方 Discord 上 Kickstarter AMA 的话题之一。
- **在 Steam 上交易。** 自 2026年10月27日 Origins TCG 进入抢先体验时的 0.8 更新起，收藏卡可以在 Steam 市场购买、出售和挂单（[Koin 的公告](https://store.steampowered.com/news/app/4429430/view/1847286114049982)）。入门游戏卡永远归你使用；不属于卡牌的收藏类装饰品暂时还不能交易，将在未来的更新中开放。Koin 还曾宣布，未拆封产品可以在 Steam 社区市场和关联交易平台上交易：0.8 的更新说明还没有涉及这部分。
- **手机版稍后推出。** 手机开包计划于 2027年推出。

## 尚未确认的内容

- Alpha 预购以外的补充包和盒装的欧元价格。
- Steam 标准手续费之外的交易平台费用。
- CEO 在 2026年3月展示的实体金属卡牌是否会发售。

## 为什么这对环境很重要

因为收藏版卡牌只是外观，强度榜只需要关注卡牌本身，而不必关心版本。从物品上架的第一天起，OriginsMeta 就会追踪 Steam 市场价格，让收藏也拥有和游玩一样的数据。
`,
  },
  "steam-next-fest-2026": {
    title: "Origins TCG 在 Steam Next Fest 2026：数据、排位与 Crimson Cup",
    metaTitle: "Origins TCG 的 Steam Next Fest 2026 回顾",
    excerpt: "Origins TCG 在 2026年10月19日至26日 Steam Next Fest 期间的完整回顾：排位模式开放，CoachCrono 夺冠的 Crimson Cup 锦标赛赛程与奖品，官方公布的愿望单和下载数据，以及节后游戏转入 Steam 抢先体验的经过。",
    faq: [
      {
        q: "2026年10月的 Steam Next Fest 是什么时候？",
        a: "从太平洋时间 10月19日周一 10:00（美东 13:00、英国 18:00、中欧 19:00）到 2026年10月26日周一。Origins TCG 带着免费试玩版参加，试玩版在 9月21日和 29日更新过，排位模式自 10月15日开放。节后第二天，即 10月27日，试玩版结束，游戏在 Steam 转入抢先体验。",
      },
      {
        q: "Origins TCG 的锦标赛是什么时候？",
        a: "2026年10月19日至25日：19日至22日进行五场资格赛，每场 512 个名额（两场 AMER、两场 EMEA、一场 APAC），然后 24日季后赛，25日决赛，CoachCrono 夺冠。",
      },
      {
        q: "玩家可以参加任意一场资格赛吗？",
        a: "可以。Koin Games 表示，无论你住在哪里，都可以参加任意一场资格赛，但请玩家只报名自己确实能参加的场次。",
      },
      {
        q: "参赛要花钱吗？",
        a: "不用。试玩版在 Steam 上免费，锦标赛在官方 Discord 报名。Origins TCG 是 free-to-compete（免费竞技）的游戏，而且自 2026年10月27日起，游戏本身在 Steam 上以抢先体验的形式免费开玩。",
      },
      {
        q: "Conquest 赛制是什么？",
        a: "在 Crimson Cup 中，每位玩家提交三套卡组，任意两套之间至少相差 8 张不同的卡牌。卡表在四强之前保持隐藏：你禁用对手的一套卡组时，只能看到它的传说卡。五局三胜的比赛没有禁用环节，你必须用三套卡组都赢下一局。Koin Games 最早在 8月28日的 Big Bob's Playtest Battle 上测试了这个赛制。",
      },
    ],
    body: `
## 节展与锦标赛

- **Steam Next Fest 2026年10月档：10月19日至26日。** [Valve 的可玩试玩版节展](https://store.steampowered.com/sale/nextfest)从太平洋时间 10月19日周一 10:00（美东 13:00、英国 18:00、中欧 19:00）持续到 10月26日周一。[Origins TCG](https://store.steampowered.com/app/4429430/Origins_TCG/) 带着免费试玩版参加，试玩版在 9月21日迎来第一次大更新，并于 10月15日开放了**排位模式**。
- **Origins TCG 锦标赛：10月19日至25日。** Koin Games 称之为“我们有史以来规模最大的锦标赛”：一场为期多天的赛事，流程为资格赛 → 季后赛 → 决赛，全程线上、在游戏内进行。**CoachCrono** 于 10月25日周日夺冠。

## 节展进展如何

2026年10月27日，Koin Games 公布了这一周的数据（[Steam 公告](https://store.steampowered.com/news/app/4429430/view/1847286114049639)）：超过 **20,000 个愿望单**，试玩版 **30,000 次下载**，超过 **300 人**直播本作，Crimson Cup 期间同时观看人数峰值超过 **5,000**，当时位列 Twitch 上 TCG 类第 2。256 名玩家参加了季后赛，周日 CoachCrono 赢得总决赛，因此将获得 1/1 Dracula 锦标赛宣传卡。

同一天几个小时后，试玩版结束：Origins TCG 随 0.8 更新在 Steam 转入**抢先体验**，依然免费，Grandmaster 段位开放，收藏卡可以在 Steam 市场交易（[Koin 的公告](https://store.steampowered.com/news/app/4429430/view/1847286114049982)）。试玩版的账号、收藏和进度全部保留。现在怎么玩，见我们的 [Steam 版 Origins TCG 游玩指南](/zh-cn/guides/play-the-demo)。

## 试玩版为节展带来了什么

8月三次封闭测试（[0.6.1](https://store.steampowered.com/news/app/4429430/view/1840944183780414)、[0.6.2](https://store.steampowered.com/news/app/4429430/view/1841579228669961) 和 [0.6.3](https://store.steampowered.com/news/app/4429430/view/1842212951301184) 补丁，均记录在我们的 [MetaShifting](/zh-cn/metashifting) 中）测试过的试玩版大更新，提前到 [2026年9月21日](https://store.steampowered.com/news/app/4429430/view/1844115010502611)上线：全新界面和棋盘、收藏者教程、可开启的测试卡包、新的语音台词、平衡调整，以及 Crimson Cup 的暂定卡池，好让玩家为锦标赛构筑卡组。进度从试玩版和测试版中更靠前的那一个继承。

封闭测试中的卡组、卡牌和首领都进入了免费试玩版，卡组构筑也一样：每个人都能构筑自己的 25 张卡组（1 张传说卡加 12 张卡牌，每张两份）。我们的[卡牌数据库](/zh-cn/cards)收录了 9月22日在游戏中核对过的 122 张卡牌。

Koin 曾承诺**排位模式**会“随 Steam Next Fest 开始”上线，“并带有排位专属奖励”（9月21日的 Steam 公告）。它提前四天到来，于 2026年10月15日上线，天梯暂时止于 Grandmaster。它现在如何运作，包括自 10月27日开放的 Grandmaster 段位，见我们的 [Origins TCG 排位攻略](/zh-cn/guides/origins-tcg-ranked)。

## 锦标赛流程

1. **资格赛，10月19日至22日。** 共五场，每场 512 个名额，每场晋级 32 人：AMER 场 19日 19:00（EST），EMEA 场 20日 19:00（CEST），AMER 场 21日 21:00（EST），APAC 场 22日 19:00（SGT），EMEA 场 22日 19:00（CEST），另有 96 个外卡名额。19日的 AMER 资格赛和 22日的 EMEA 资格赛是 10月5日新增的；同一天，官方赛程图还把 21日的 AMER 资格赛改到 21:00（EST），晋级人数从 64 改为 32，外卡名额从 128 改为 96（[我们的文章](/zh-cn/news/crimson-cup-prizepool-qualifiers)）。用 Koin 的话说，“无论你住在哪里，都可以参加**任意**一场资格赛”：玩家可以报名不止一场。
2. **季后赛和决赛，10月24日至25日。** 季后赛于 24日进行，共 256 个名额（10:00 EST / 16:00 CEST / 22:00 SGT），其中四名玩家晋级 25日 10:00 EST（15:00 CET / 22:00 SGT）的决赛，CoachCrono 夺冠。内容创作者获得外卡邀请，直接进入季后赛。
3. **赛制。** 根据 9月9日和 24日公告的官方规则：**三套卡组的 Conquest**，任意两套之间至少相差 8 张不同的卡牌；卡表在四强之前保持隐藏，所以你禁用对手的一套卡组时，只能看到它的传说卡。**三局两胜，总决赛五局三胜**：五局三胜没有禁用环节，你必须用三套卡组都赢下一局。详情见[我们关于规则的文章](/zh-cn/news/crimson-cup-format-check-in)。
4. **签到。** 每场资格赛开始前两小时开放签到，开始前五分钟与卡组提交一同截止；随后有一个先到先得的短暂窗口，把空出的名额分给候补玩家。错过签到的玩家无法参赛。
5. **使用哪个版本。** 锦标赛在试玩版上进行，只能使用试玩版中的卡牌；获得过不同更新的封闭测试已于 10月15日关闭。锦标赛前的最后一个平衡补丁 [0.7 补丁](/zh-cn/news/patch-0-7)于 2026年9月29日推出，比第一场资格赛早三周。
6. **奖品。** 用 Koin 自己的话说，**奖品总价值 10,000 美元**，分为现金、收藏品和独家宣传卡。10月5日公布了明细：冠军获得一张 1/1 Dracula 宣传卡、两箱补充包和 1,500 美元现金；亚军获得一张 1/8 Dracula 宣传卡、一箱补充包和 750 美元；第三、四名获得一张 1/8 宣传卡、两盒补充包和 350 美元；八强获得一盒补充包、一张 1/8 宣传卡和 125 美元；十六强获得一盒补充包和一张 Finalist Plus 卡；三十二强获得十包补充包和一张 Finalist 卡；之后直到前 256 名，依次获得 8 包、4 包和 2 包（[完整奖励表](/zh-cn/news/crimson-cup-prizepool-qualifiers#prizes)）。这场锦标赛名为 **Crimson Cup**——名字出自 Koin 自己的宣传图，并不是社区起的外号。
7. **地点池。** 有七个地点不在锦标赛中，用 Koin 的话说，它们“随机性太强”：Junkyard、Cloning Lab、Reflecting Pool、Amplifying Amphitheatre、Giant's Beacon、The Colosseum 和 Nostradamus' Call。试玩版的房间对战使用同样的地点池，方便练习。每个地点的效果见我们的[地点页面](/zh-cn/locations)。
8. **练习赛。** Crimson Cup 之前，Koin 每周举办没有奖励的练习赛，在 Discord 上公告，让玩家和真人而不是机器人对战。

报名在[官方 Discord](https://discord.gg/originstcg) 进行。

## 现在就上手：五步走

1. 获取 [Steam 上的 Origins TCG](https://store.steampowered.com/app/4429430/Origins_TCG/)：游戏免费开玩，自 2026年10月27日起处于抢先体验。如果你玩过试玩版，账号和收藏都已经在那里了。
2. 阅读[五分钟了解 Origins TCG](/zh-cn/guides/origins-tcg-explained) 和[卡牌数据库](/zh-cn/cards)：数值为 9月29日 0.7 补丁的数值，于 9月22日在游戏中逐张核对；10月27日的 0.8 补丁说明没有提到任何卡牌改动。
3. 在我们的[卡组构筑器](/zh-cn/deck-builder)中构筑三套 Conquest 卡组：它会标出传说卡相同的两套卡组，并计算卡组之间不同的卡牌数。用真实社区卡组一步步讲解：[如何构筑 Conquest 阵容](/zh-cn/guides/origins-tcg-conquest)。
4. 研究[社区发布的卡组](/zh-cn/decks)：每份卡表都附有构成图表、作者笔记、在构筑器中打开的按钮，以及可以粘贴到 Origins 中的卡组代码。发布你自己的卡组并附上攻略，让其他玩家来评分。
5. 关注[新闻](/zh-cn/news)：每条公告都会在一天内整理成文，并附上来源链接。

## OriginsMeta 如何报道这一周

节展期间，我们在 [Crimson Cup 页面](/zh-cn/analytics/crimson-cup)上发布了每场资格赛的官方数据，决赛则见[我们关于 CoachCrono 夺冠的文章](/zh-cn/news/crimson-cup-coachcrono-wins)。本攻略的资料来源：8月4日、8月25日、[9月9日](https://store.steampowered.com/news/app/4429430/view/1843481262690278)、[9月21日](https://store.steampowered.com/news/app/4429430/view/1844115010502611)、[9月29日](https://store.steampowered.com/news/app/4429430/view/1844751498235283)、[10月5日](https://store.steampowered.com/news/app/4429430/view/1845383656394214)、[10月15日](https://store.steampowered.com/news/app/4429430/view/1846651706679257) 和 [2026年10月27日](https://store.steampowered.com/news/app/4429430/view/1847286114049639)的官方 Steam 公告，以及 [Steam Next Fest 日程](https://store.steampowered.com/sale/nextfest)。
`,
  },
  "is-origins-tcg-pay-to-win": {
    title: "Origins TCG 是 pay-to-win 吗？“免费竞技”详解",
    metaTitle: "Origins TCG 是 pay-to-win 吗？不氪金也能赢",
    excerpt: "Koin Games 把 Origins TCG 宣传为第一款免费竞技（free-to-compete）、零 pay-to-win 的卡牌游戏。本文说明花钱到底能买到什么，收藏版卡牌和竞技卡牌如何分开，它和 Hearthstone 等游戏有何不同，以及仍需注意的几点真实疑虑。",
    faq: [
      {
        q: "Origins TCG 免费吗？",
        a: "免费。Origins TCG 在 Steam 上免费开玩，自 2026年10月27日起处于抢先体验。Koin Games 写道，它“将永远保持免费游玩和免费竞技”，无论是抢先体验期间还是正式发售之后。参与竞技所需的每一张卡都能通过游玩获得。",
      },
      {
        q: "要买卡包才能赢吗？",
        a: "不用。官方 Steam 页面写道，花钱“永远不会解锁更强的卡牌，也不会带来任何游戏优势”。付费卡包里是限量、经过数字评级的收藏版卡牌，而不是额外的强度。",
      },
      {
        q: "那花钱买的是什么？",
        a: "收藏品：限量版、带编号并经过评级的卡牌版本，以补充包、盒和箱的形式出售，可以与其他玩家购买、出售和交易。",
      },
      {
        q: "我可以出售自己的卡牌吗？",
        a: "收藏卡可以：自 2026年10月27日的 0.8 更新起，收藏卡可以在 Steam 市场购买、出售和挂单，在 Steam 上的收入会进入你的 Steam 钱包。入门游戏卡永远归你使用；不属于卡牌的收藏类装饰品暂时还不能交易。",
      },
      {
        q: "有战令或付费的进度加速吗？",
        a: "截至 2026年10月28日，还没有任何此类内容被明确公布。Steam 页面写道，抢先体验“将包含一些付费高级功能”，但没有列出具体内容，并表示花钱永远不会解锁更强的卡牌。Koin 公布更多信息后，我们会更新本页。",
      },
    ],
    body: `
## 简短的回答

不是，这是设计使然。2026年10月28日查阅的 Origins TCG Steam 页面说得很直白：“花钱永远不会解锁更强的卡牌，也不会带来任何游戏优势”。页面还写道，游戏“将永远保持免费游玩和免费竞技，无论是抢先体验期间还是正式发售之后”，并补充说“抢先体验将包含一些付费高级功能”。在抢先体验之前，同一页面称它为“第一款免费竞技的 TCG”，而一张官方加载画面用一句话概括：**零 pay-to-win**。

这是承诺。本页解释它在实践中意味着什么，以及还存在哪些真实的疑虑。

## “免费竞技”是什么意思

Origins 把大多数数字卡牌游戏混在一起的两件事分开了：

1. **竞技。** 构筑竞技卡组所需的每一张卡都在游戏中获得。测试卡组和[卡牌数据库](/zh-cn/cards)里没有任何花钱才能拿到的东西，入门游戏卡永远归你使用。
2. **收藏。** 同一批卡牌的限量版本以带编号的印量发行，**经过数字评级**，可以购买、出售和交易：自 2026年10月27日的 0.8 更新起，在 Steam 市场上进行。它们只是外观：一张评级过的 Mulan 和你自己赚来的 Mulan 效果完全相同。

所以你花钱买的卡包是收藏品，而不是强度。第一个收藏版本“Myths & Legends: Alpha Edition”仅限预购，分为 5 张卡的补充包、24 包一盒和 6 盒一箱，共七个稀有度等级；见 [Origins 的经济系统如何运作](/zh-cn/guides/collector-economy)。

## 与其他游戏对比

在 Hearthstone 或 MTG Arena 中，你买的卡包里就是你用来对战的卡牌，所以花钱能缩短凑齐收藏的路。在 Origins 中，通往竞技卡组的路是游玩；花钱买的是旁边的收藏架。“零 pay-to-win”的说法，正是建立在这个区别上。

## 真实的疑虑

- **时间依然是成本。** 免费卡牌要靠游玩获得；凑齐一套竞技卡组需要多少场对局，目前尚未公布。卡组构筑随 2026年9月21日的试玩版更新到来：我们还没有测算需要肝多久，测算后会公布数据。
- **细节尚待公布。** Steam 页面写道，抢先体验“将包含一些付费高级功能”，但没有列出具体内容。Alpha 预购以外的价格、Steam 标准手续费之外的交易平台费用，以及任何进度加速，都还没有公布。没有迹象表明会有战令，但也没有排除这种可能。
- **市场价值不等于现金。** 在 Steam 社区市场出售所得会进入你的 Steam 钱包。关联交易平台能否真正提现，尚未确认。
- **卡包是随机的。** 在内容描述中，Steam 页面列出了“游戏内购买”和“基于概率的游戏内购买”：收藏卡包里有什么全凭运气，尽管它永远不会改变卡组的强度。

## 为什么这对环境很重要

因为收藏版只是外观，强度榜只需要评判卡牌，而不必关心版本；免费玩家发布在 OriginsMeta 上的卡组，和任何人的一样强。每有新的官方声明，我们都会更新本页；资料来源：Origins TCG 的 Steam 页面（于 2026年10月28日查阅）、Koin Games 2026年10月27日关于 0.8 更新的公告、官方加载画面，以及 Koin Games 2026年7月和 8月的 AMA。
`,
  },
  "play-the-demo": {
    title: "如何在 Steam 上免费下载并游玩 Origins TCG",
    metaTitle: "如何在 Steam 上玩 Origins TCG",
    excerpt: "在 Steam 上免费游玩 Origins TCG 抢先体验版的完整指南：Windows 与 macOS 配置要求、下载与安装步骤、如何切换游戏语言（包括简体中文）、教程和第一场对局怎么打、0.8 更新带来了哪些新内容，以及原来的免费试玩版和你的进度后来怎么样了。",
    faq: [
      {
        q: "Origins TCG 免费吗？",
        a: "免费。它在 Steam 上免费开玩，自 2026年10月27日起处于抢先体验，支持 Windows 和 macOS。Koin Games 表示游戏将永远保持免费游玩和免费竞技，不过抢先体验将包含“一些付费高级功能”。",
      },
      {
        q: "Origins TCG 支持哪些语言？",
        a: "自 2026年9月29日的 0.7 补丁起支持 13 种语言：英语、法语、意大利语、德语、西班牙语（西班牙）、日语、韩语、波兰语、葡萄牙语（巴西）、葡萄牙语（葡萄牙）、俄语、简体中文和西班牙语（拉丁美洲）。2026年10月28日查阅的 Steam 页面列出了同样的 13 种界面语言，完整语音仅有英语。",
      },
      {
        q: "运行需要什么配置？",
        a: "最低配置：Windows 10 64 位，Intel i3-6100 或 AMD FX-6300，8 GB 内存，GTX 750 Ti 或 R9 270X，2 GB 可用空间；Mac 上需要 macOS 10.14 或更高版本，Apple M1 或双核 Intel i5，以及支持 Metal 的显卡。",
      },
      {
        q: "试玩版的进度会保留吗？",
        a: "会。Koin Games 写道，你的账号、收藏、进度“以及其他一切，现在都在 Origins 的抢先体验版中”；在官方 Discord 上，工作室负责人补充说所有进度都已转移，可以卸载试玩版。",
      },
      {
        q: "0.8 更新有什么新内容？",
        a: "它于 2026年10月27日结束了试玩版并开启抢先体验：Grandmaster 段位开放，并有全球 Grandmaster 排行榜；收藏卡显示 1 到 10 的评级；收藏卡可以在 Steam 市场购买、出售和挂单。补丁说明没有提到任何卡牌改动。",
      },
    ],
    body: `
## 你能得到什么

自 **2026年10月27日**起，Origins TCG 在 Steam 上以**抢先体验**的形式免费开玩，支持 Windows 和 macOS：那天的 0.8 更新结束了自 2026年7月15日起在 Steam 上提供的试玩版（[Koin 的公告](https://store.steampowered.com/news/app/4429430/view/1847286114049982)）。评价分数为抢先体验重新计算：2026年10月28日，游戏页面显示“好评”，22 篇评测中 100% 为好评。一局大约七分钟：双方同时在三个地点行动，这些地点从一百多个地点组成的池中抽取，会轮换并改变棋盘的规则。

语言：自 2026年9月29日的 [0.7 补丁](/zh-cn/news/patch-0-7)起，游戏支持 **13 种语言**：英语、法语、意大利语、德语、西班牙语（西班牙）、日语、韩语、波兰语、葡萄牙语（巴西）、葡萄牙语（葡萄牙）、俄语、简体中文和西班牙语（拉丁美洲）。2026年10月28日查阅的 Steam 页面列出了同样的 13 种界面语言，完整语音**仅有英语**。

## 配置要求

| | 最低配置 | 推荐配置 |
| --- | --- | --- |
| Windows | Windows 10 64 位，Intel i3-6100 或 AMD FX-6300，8 GB 内存，GTX 750 Ti 或 R9 270X | Windows 11 64 位，Intel i5-8400，16 GB 内存，GTX 1060 |
| macOS | macOS 10.14，Apple M1 或 Intel i5 双核 2.5 GHz，支持 Metal 的显卡 | macOS 12 或更高版本，Apple M1 Pro，16 GB 内存 |
| 空间 | 2 GB | 2 GB |

## 五个步骤

1. **安装 Steam** 并登录（免费账号即可）。
2. **打开 [Origins TCG 页面](https://store.steampowered.com/app/4429430/Origins_TCG/)**，点击免费开玩的按钮：游戏免费开玩。也可以在 Steam 内搜索“Origins TCG”。安装只需几分钟。如果你玩过试玩版，你的账号和收藏已经在抢先体验版中，可以卸载试玩版。
3. **选择语言**（如果 Steam 没有自动设置）：在库中右键点击游戏，依次选择“属性”和“语言”。配音是英语的；其他语言翻译的是界面和文本。
4. **完成教程**，然后做任务：它们会教你三条路线、双方同时进行的回合，以及各个关键词：揭示时（On Reveal）、死亡时（On Death）、先攻（First Strike）、连击（Double Attack）和死触（Deathtouch）。我们的[五分钟攻略](/zh-cn/guides/origins-tcg-explained)用文字讲解了同样的内容。
5. **上线对战**，试试预设卡组。想要更多时，阅读[社区发布的卡组](/zh-cn/decks)，在[卡组构筑器](/zh-cn/deck-builder)中重建它们，并在[卡牌数据库](/zh-cn/cards)中查看当前的卡牌数值（2026年9月29日的 0.7 补丁；0.8 补丁说明没有提到任何卡牌改动）。

## 抢先体验带来了什么

2026年10月27日的 0.8 更新是抢先体验的第一个版本。根据 Koin Games 的补丁说明：

- **进度保留。** “你的账号、收藏、进度以及其他一切，现在都在 Origins 的抢先体验版中。”在官方 Discord 上，工作室负责人补充说可以卸载试玩版。
- **Grandmaster 开放。** 玩家可以晋级到 Grandmaster 段位，Grandmaster 排行榜会对他们进行全球排名。抢先体验的第一个排位赛季预计在“12月初的某个时候”结束，以最高段位结束赛季的玩家将获得限量版奖励：详情见我们的[排位攻略](/zh-cn/guides/origins-tcg-ranked)。
- **评级卡牌。** 收藏卡有 1 到 10 的评级，现在会通过瑕疵和效果显示在卡牌上，用 Koin 的话说，这“还只是第一版”。
- **在 Steam 市场交易。** 收藏卡可以在 Steam 市场购买、出售和挂单，入门游戏卡永远归你使用。不属于卡牌的收藏类装饰品暂时还不能交易，将在未来的更新中开放。整体如何运作，见 [Origins 的经济系统如何运作](/zh-cn/guides/collector-economy)。
- **通往 1.0 之路。** “0.8 不是终点”：Steam 页面写道，Koin 的目标是“大约在 2027年3月17日”结束抢先体验，这个日期可能会变。

0.8 补丁说明没有提到任何卡牌改动：我们[卡牌数据库](/zh-cn/cards)中的数值仍是 0.7 补丁的数值。

## 从试玩版到抢先体验

免费试玩版于 2026年7月15日登陆 Steam。它在 [2026年9月21日](https://store.steampowered.com/news/app/4429430/view/1844115010502611)迎来第一次大更新，带来了全新界面和棋盘、收藏者教程、测试卡包、卡组构筑和 Crimson Cup 暂定卡池；9月29日的 [0.7 补丁](/zh-cn/news/patch-0-7)是锦标赛前的最后一个平衡补丁，并让游戏支持 13 种语言；排位于 10月15日开放，就在 [Steam Next Fest](/zh-cn/guides/steam-next-fest-2026) 和 Crimson Cup 之前。2026年10月27日，试玩版结束，Origins TCG 随 0.8 更新转入抢先体验。新的更新会在 Steam 和[官方 Discord](https://discord.gg/originstcg) 上公布。

资料来源：Steam 上的 Origins TCG 页面（于 2026年10月28日查阅），2026年7月16日、8月4日、9月21日、9月29日、10月15日和 10月27日的官方 Steam 公告，以及官方 Discord 上的 0.8 补丁说明（2026年10月27日）。
`,
  },
  "origins-tcg-kickstarter": {
    title: "Origins TCG Kickstarter：日期、预注册、Alpha Edition 及已知信息",
    metaTitle: "Origins TCG Kickstarter：日期、预注册与 Alpha",
    excerpt: "Origins TCG 的 Alpha Edition Kickstarter 众筹已于 2026年10月27日开启：众筹内容与八档回报、1 美元 VIP 预注册享 15% 折扣、仅限预购的补充包盒与箱、Alpha 异画宣传卡和延伸目标，以及从试玩版到 1.0 的时间线。",
    faq: [
      {
        q: "Origins TCG 的 Kickstarter 是什么时候开始的？",
        a: "2026年10月27日：Koin Games 当天 17:02 UTC 在 Steam 上发布公告“The Origins Kickstarter is LIVE”，宣布众筹开启。CEO Tim Jooste 早在 2026年9月17日就在 X 上公布了日期（“back the Alpha Edition Kickstarter (Oct 27th)”），试玩版的主菜单也曾把 Kickstarter 显示为“Coming soon – Oct 27”，旁边是“Preregister for 15% off”。",
      },
      {
        q: "1 美元订金有什么用？",
        a: "获得 VIP 身份，众筹上线时享受 15% 折扣。官方页面写明，上线前订金可以全额退还。",
      },
      {
        q: "Alpha Edition 是什么？",
        a: "Origins Myths & Legends Alpha Edition：每个收藏补充包 5 张卡，保底至少一张 Rare 或更高稀有度；补充包盒每盒 24 包，每箱 6 盒。盒和箱仅限预购，这批印量不会重印。",
      },
      {
        q: "参与竞技需要支持 Kickstarter 吗？",
        a: "不需要。Origins 是免费竞技的：排位对战不需要任何购买，游戏本身也在 Steam 上免费开玩，自 2026年10月27日起处于抢先体验。Kickstarter 关乎收藏，而不是强度。",
      },
      {
        q: "卡牌在哪里交易？",
        a: "在 Steam 市场：自 2026年10月27日的 0.8 更新起，收藏卡可以在那里购买、出售和挂单。官方页面还提到了关联交易平台。手机开包计划于 2027年推出。",
      },
      {
        q: "Alpha Alt-Art Promo Box 是什么？",
        a: "一盒 Kickstarter 独占的异画卡牌，Apprentice 档及以上的每位支持者都能获得。它从 Van Helsing 开始，随延伸目标不断增加，在 475 万美元时达到 20 张；Koin 写道，众筹结束后这些卡牌将不再发放。众筹于 2026年12月2日结束。",
      },
    ],
    body: `## 日期：众筹于 10月27日开启 {#ri-qi}

**Myths & Legends Alpha Edition** 的 Kickstarter 于 **2026年10月27日**开启：Koin Games 在 17:02 UTC 于 Steam 发布公告 [“The Origins Kickstarter is LIVE”](https://store.steampowered.com/news/app/4429430/view/1847286114049705)，宣布众筹开启，同一天 Origins TCG 转入抢先体验。“Myths & Legends”系列的 Alpha 印量为 Kickstarter 独占，用 Koin 的话说，这个系列共有 218 张卡，“我们将在整个抢先体验期间逐步推出”。八档回报见[我们关于回报档位的文章](/zh-cn/news/kickstarter-alpha-edition-reward-tiers)，众筹链接在本页顶部的方框中。

这个日期最早来自 Koin Games 的 CEO **Tim Jooste**：他在 [2026年9月17日的一条 X 帖子](https://x.com/TimothyJooste/status/2100700207285445011)中写道“back the Alpha Edition Kickstarter (Oct 27th)”，工作室的账号转发了这条帖子。**2026年9月25日**，试玩版的主菜单也显示了 Kickstarter 方框，上面写着 **“Coming soon – Oct 27”** 和 **“Preregister for 15% off”**，而加载画面在宣传 Alpha Edition。

*2026年10月30日更新：新增 [Alpha 宣传卡与延伸目标](/zh-cn/guides/origins-tcg-kickstarter#alpha-xuan-chuan-ka)，附 Koin 的官方图片，以及众筹的结束日期 2026年12月2日。*

*2026年10月28日更新：众筹自 10月27日起已经上线，那天试玩版结束，Origins TCG 转入抢先体验。9月28日的更新确认了 Koin Games CEO 公布的日期；9月25日的更新加入了试玩版中显示的日期、官方公告中的 AMA 话题以及更正后的时间线。*

## 已公布的内容

Koin Games 在 [founder.origins-tcg.com](https://founder.origins-tcg.com) 运营官方的 **Kickstarter Early Access** 页面。**2026年9月10日**，团队在官方 Discord 的 AMA 中回答了关于众筹的问题；第二天的公告列出了话题：数字评级、卡牌稀有度、交易如何运作、错误卡、神包、锦标赛 1/1 卡、Alpha 系列是什么、Kickstarter 档位，以及如何成为享受 15% 折扣的 VIP。我们的 [AMA 新闻](/zh-cn/news/kickstarter-ama-pre-registration)做了总结。

## 预注册：1 美元换 15% 折扣

- 支付 **1 美元订金**成为 **VIP**，即可解锁**上线时 15% 的折扣**。
- 官方页面两次写明，订金**在上线前可全额退还**。
- 预注册并不等于承诺赞助：它只是为你保留早鸟价。

## Alpha Edition

这条产品线名为 **Origins Myths & Legends Alpha Edition**：

| 产品 | 内容 |
| --- | --- |
| 收藏补充包 | 5 张收藏卡，保底至少一张 Rare 或更高稀有度 |
| 补充包盒 | 24 个收藏补充包 |
| 补充包箱 | 6 盒补充包 |

对 Alpha Edition 来说，**盒和箱仅限预购**：这一批印量售完后，不会再额外生产 Alpha 盒或箱。这和实体卡牌游戏中首版印刷的逻辑相同，只是用在了数字收藏上。

## Alpha 宣传卡与延伸目标 {#alpha-xuan-chuan-ka}

Alpha Edition 的宣传卡采用**异画**，与游戏中的卡牌不同，Koin 展示它们时都装在评级壳里。2026年10月30日，Koin Games 把这些图片加入了面向创作者的媒体资料包，众筹页面也写明了哪一档包含哪张宣传卡。**Alpha Alt-Art Promo Box** 面向 Apprentice 档及以上的每位支持者，从一张异画 Van Helsing 开始，随延伸目标不断加卡；Koin 写道，这些卡牌“在本次 Kickstarter 结束后将不再发放”。其他延伸目标则与游戏本身有关：

| 延伸目标 | 新增内容 |
| --- | --- |
| 起始 | Alt-Art Promo Box 中的 Van Helsing |
| $100,000 | Sherlock |
| $250,000 | Watson |
| $500,000 | Queen of Hearts |
| $750,000 | Mulan |
| $1,000,000 | 手机版提前上线 |
| $1,250,000 | Dracula |
| $1,500,000 | Sheriff of Nottingham |
| $1,750,000 | Boogeyman |
| $2,000,000 | 轮抽（Draft）模式加入路线图 |
| $2,250,000 | Jekyll & Hyde |
| $2,500,000 | Goldi |
| $2,750,000 | Sandman |
| $3,000,000 | Conquest 模式加入路线图 |
| $3,250,000 | Moby |
| $3,500,000 | Scarecrow |
| $3,750,000 | Roo |
| $4,000,000 | Origins Radio，对局中的自定义音乐 |
| $4,250,000 | Mary 和 Baby Bear |
| $4,500,000 | Three Blind Mice 和 Bagheera |
| $4,750,000 | Shield Maiden 和 Red Knight |
| $5,000,000 | Pets，可收藏的宠物伙伴 |

2026年10月30日，众筹页面显示 75 万美元及以下的目标均已达成，包括 Mulan。正如 Koin 所写，如果 475 万美元以内的宣传卡目标全部达成，这个盒子将包含 20 张异画卡牌。各档位还会加送更多宣传卡：Hero 档起有 Golden Slab Promos，Icon 档起有 Wizard of Oz 系列，Myth 档有带编号的肖像卡，Legend 档有签名肖像卡。下面是它们，配有 Koin 发布的图片。

## 交易与所有权

自 2026年10月27日的 0.8 更新起，收藏卡可以在 **Steam 市场**购买、出售和挂单；官方页面还提到了关联交易平台。今年早些时候，Koin 转向了 Steam 市场，而不是独立的链上系统。手机开包计划于 **2027年**推出。

## 免费竞技依然免费

支持 Kickstarter 买到的是收藏品，而不是强度：在 Origins 中进行排位对战不需要任何购买，游戏本身也在 Steam 上免费开玩，自 2026年10月27日起处于抢先体验。竞技与收藏两条线如何保持分离，见 [Origins TCG 是 pay-to-win 吗？](/zh-cn/guides/is-origins-tcg-pay-to-win)

## 时间线

- 2026年7月15日：Steam 免费试玩版推出。
- 2026年9月21日：试玩版第一次大更新。
- 2026年10月15日：排位模式开放。
- 2026年10月19–26日：Steam Next Fest，期间举行 Crimson Cup（10月19–25日），CoachCrono 夺冠。
- 2026年10月27日：试玩版结束，Origins TCG 在 Steam 转入抢先体验（0.8 更新）；Alpha Edition 的 Kickstarter 开启（日期由 Koin Games 的 CEO 于 9月17日公布）。
- 2026年12月2日：根据众筹页面，Kickstarter 于 08:01 UTC 结束。
- 2027年3月17日前后：根据 Steam 页面，推出 1.0 版本（日期可能会变）。
- 2027年：手机版。

## 现在可以做什么

1. 在 [Steam](https://store.steampowered.com/app/4429430/Origins_TCG/) 上免费游玩 Origins TCG 抢先体验版。
2. 想支持 Alpha Edition，请使用本页顶部方框中的众筹链接；八档回报见[我们的文章](/zh-cn/news/kickstarter-alpha-edition-reward-tiers)。
3. 关注官方 Discord，获取众筹的最新消息。

资料来源：[官方预注册页面](https://founder.origins-tcg.com)、[Steam 页面](https://store.steampowered.com/app/4429430/Origins_TCG/)、官方 Discord 上的 AMA 公告（2026年9月11日）、[Koin Games CEO 在 X 上的帖子](https://x.com/TimothyJooste/status/2100700207285445011)（2026年9月17日）、试玩版主菜单（于 2026年9月25日查阅），以及 Koin Games 2026年10月27日宣布众筹开启的 Steam 公告。`,
  },
  "streaming-tools": {
    title: "直播 Origins TCG：OBS 叠加层与 !deck 聊天命令",
    metaTitle: "Origins TCG 的 OBS 叠加层与 !deck 聊天命令",
    excerpt: "面向 Origins TCG 主播和视频作者的免费工具：显示你卡组的 OBS 叠加层、Twitch 聊天中的 !deck 命令、卡组短链接、可下载的卡组图片，以及直播时出现在你名字旁边的 LIVE 徽章。全部无需安装，并会跟随你发布的卡组自动更新。",
    faq: [
      {
        q: "需要安装什么吗？",
        a: "不需要。叠加层是一个网页，在 OBS 中作为浏览器来源添加即可；聊天命令是给你的 Twitch 机器人用的一行文字，指向 OriginsMeta。",
      },
      {
        q: "!deck 命令支持哪些机器人？",
        a: "Nightbot、StreamElements 和 Fossabot。你的 OriginsMeta 账号会为每个机器人提供现成的命令行，你的链接已经填在里面。",
      },
      {
        q: "叠加层在 OBS 中应该设为多大？",
        a: "竖版叠加层 360 × 1000 像素，横版 1600 × 300 像素。背景是透明的。",
      },
      {
        q: "我发布新卡组后，叠加层会变吗？",
        a: "会，前提是你用的是账号里的链接：它总是显示你最近发布的卡组，并且每分钟重新加载一次。",
      },
    ],
    body: `
## 你能得到什么

OriginsMeta 为所有直播或制作 Origins TCG 视频的人提供免费工具。它们配合你在网站上发布的卡组使用，无需安装任何东西：

- 一个透明背景、显示你卡表的 **OBS 叠加层**；
- 一个用于 Twitch 聊天的 **!deck 命令**，会回复你的卡组；
- 用于简介、缩略图和动态的**短链接**和**卡组图片**；
- 直播 Origins TCG 时出现在你名字旁边的 **LIVE 徽章**。

## 开始之前

1. 登录 OriginsMeta（Discord 或邮箱，无需密码），并在[卡组构筑器](/zh-cn/deck-builder)中发布一套卡组。
2. 打开[你的账号](/zh-cn/account#stream-tools)：“直播工具”面板里有叠加层链接和聊天命令，已经填好了你的用户名。

账号里的链接始终跟随**你最近发布的卡组**：发布新卡组后，叠加层和命令会在一分钟内切换过去。如果想展示某一套特定的卡组，打开它的页面，使用“主播专用”菜单：在你自己的卡组上，这里有仅针对该卡组的叠加层和命令。

## OBS 叠加层

1. 从账号中复制两个叠加层链接之一：竖版或横版。
2. 在 OBS 中：来源 → + → 浏览器，然后粘贴链接。
3. 设置尺寸：竖版叠加层 **360 × 1000**，横版 **1600 × 300**。

背景是透明的，叠加层每分钟重新加载一次卡组，所以不用动来源也能保持最新。它显示卡组名称、你的名字、传说卡，以及 12 张卡牌和它们的费用。语言与你复制链接的页面相同：要更改语言，把链接末尾的 lang= 设为 en、it、es、fr、pt、de、ru 或 zh-cn。

## !deck 聊天命令

账号里有每个机器人要用的命令行，你的链接已经填在里面：

- **Nightbot** 和 **StreamElements**：以频道主或管理员身份，在你的 Twitch 聊天中输入这行命令；
- **Fossabot**：在它的控制面板中创建一个命令，并把这行内容作为回复。

如果你的频道已经有 !deck，把 add 改成 edit。之后，!deck 会在聊天中用一行文字回复：卡组名称、传说卡、短链接，以及可以粘贴到 Origins TCG 中的卡组代码。只有当卡组中某张卡还没有官方 ID 时，才会省略代码。

## 短链接与卡组图片

每套卡组都有一个短链接：originsmeta.com/d/ 加上卡组的地址。在直播中念出来或放进视频简介里，它会用观众的语言打开卡组。你的个人主页也有一个：originsmeta.com/@ 加上你的用户名。

在任意卡组的“主播专用”菜单中，你还可以下载一张 PNG 图片，包含传说卡、12 张卡牌及其费用和短链接：16:9（1280 × 720）用于缩略图，9:16（1080 × 1920）用于动态和短视频。

## LIVE 徽章

在公开主页中添加了 Twitch 频道的 Creator、作者、Pro 玩家和 Staff，在直播 Origins TCG 时（Twitch 上的游戏分类为本作，或标题中提到了本作），网站上他们的名字旁边会出现 **LIVE 徽章**。他们的直播还会出现在[直播页面](/zh-cn/live)和[创作者目录](/zh-cn/creators)中。角色由 OriginsMeta 团队分配：如果你经常直播 Origins TCG，请在 Discord 上联系我们。
`,
  },
};
