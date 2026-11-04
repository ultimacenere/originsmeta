import type { KickstarterLabels } from "./kickstarterLabels";

/**
 * Testi del Kickstarter in cinese semplificato (04/11/2026, docs/cinese.md; forma e regole in kickstarterLabels.ts).
 * Stessi termini della guida al Kickstarter in cinese (guides-zh-cn-b.ts): 众筹, 档 (livello), 支持者, 收藏补充包 /
 * 补充包盒 / 补充包箱, 异画, 评级壳, 宣传卡, 延伸目标; l'ancora della sezione delle promo è quella della guida.
 */
export const zhCn: KickstarterLabels = {
  meta: {
    title: "在 Kickstarter 上支持 Origins TCG Alpha Edition",
    description:
      "Origins TCG 的 Alpha Edition 只在 Kickstarter 上推出，2026年10月27日起开放：首版、永不重印、官方公布的开出概率，卡牌作为 Steam 物品归你所有。这里汇总了众筹内容、回报档位、宣传卡和常见问题，方便你在支持前了解清楚。",
  },
  kicker: "Kickstarter · 2026年10月27日起",
  h1: "Origins TCG 的 Alpha Edition 只在 Kickstarter 上推出",
  lead: "Myths and Legends 的第一个收藏版本：带有 Alpha 标记的卡牌，永不重印，并作为 Steam 物品永远归你所有。",
  points: [
    "仅限 Kickstarter：众筹结束后，Koin Games 不会再发行任何 Alpha 卡牌、补充包、盒或箱",
    "每种稀有度的开出概率全部公开，从每包必出的 Rare 到 1,200 包出 1 张的 Storybook",
    "玩游戏不需要它：所有对战卡牌对每个人都免费",
  ],
  ctaPre: "在 Kickstarter 上获取上线提醒",
  cta: "在 Kickstarter 上选择你的 Alpha 回报",
  ctaNote: "将带你前往 Koin Games 在 Kickstarter 上的官方众筹页面。",
  disclosure: "推荐链接：OriginsMeta 是非官方粉丝网站，通过这里开始的赞助，Koin Games 会付给我们一笔佣金。你支付的价格不变。",
  launchNote: "众筹于 2026年10月27日开放。如果还没开始，你可以在 Kickstarter 上申请上线提醒。",
  heroAlt: "开包时的一包 Origins TCG Myths & Legends 收藏补充包，共 5 张卡，封面是一位戴护目镜的金发女主角。",
  heroCaption: "开包时的 Myths & Legends 收藏补充包。官方截图，开发中版本。",
  more: "包含什么",
  why: {
    title: "为什么选择 Alpha Edition",
    items: [
      {
        title: "首版，只印一次",
        text: "Myths and Legends 是第一个系列：218 个角色。它的 Alpha Edition 只在这次 Kickstarter 众筹中出售，每张卡都带有 Alpha 标记。角色可能会在之后的系列中回归，但绝不会再以 Alpha 的形式出现。",
      },
      {
        title: "密封产品，和实体集换式卡牌游戏一样",
        text: "收藏补充包每包 5 张卡，补充包盒每盒 24 包，补充包箱每箱 6 盒。盒和箱仅限预购：这一批印量售完后，不会再有。",
      },
      {
        title: "归你所有，在 Steam 上",
        text: "补充包、盒和卡牌都是 Steam 库存物品。你可以打开它们、保持密封，或在 Steam 上与其他玩家交易。",
      },
      {
        title: "毫无隐藏",
        text: "Koin 会永久公布每个系列中每张卡的开出概率，并发布数量报告，列出每张卡、每个补充包、每盒和每箱各有多少份。",
      },
      {
        title: "错误卡、神包、评级",
        text: "Koin 的众筹页面承诺“error cards, god packs, & digitally graded cards you really own”。评级从 1 到 10，带半级；Koin 在 10月表示这套系统仍在完善中。",
      },
    ],
  },
  rates: {
    title: "开出概率，以 Koin 公布的为准",
    intro: "Alpha Edition 每种稀有度的每包开出概率，来自 Koin Games 官方的 Kickstarter VIP 页面（查阅于 {date}）。",
    tier: "稀有度",
    odds: "概率",
    everyPack: "每包",
    oneIn: "每 {n} 包 1 张",
    anyAlt: "任意一种异画卡：每 {n} 包 1 张。",
    source: "来源：founder.origins-tcg.com，Koin Games 的官方 VIP 页面。",
  },
  game: {
    title: "游戏简介",
    text: "Origins TCG 是 Koin Games 在 Steam 上推出的免费竞技卡牌游戏。它是“免费竞技”的：每张对战卡牌对每位玩家、每个赛季都免费，你购买的任何东西都不会让卡组变强。Kickstarter 是为了收藏。",
    reviews: "在抢先体验之前，Steam 上的免费试玩版评价为“特别好评”：{total} 篇评测中 {n}% 为好评（查阅于 {date}）。",
  },
  how: {
    title: "在 Kickstarter 上支持的流程",
    steps: [
      { title: "选择一个回报档位", text: "Koin 在众筹页面上列出了各个档位以及每档包含的内容。" },
      { title: "只有众筹成功才付款", text: "Kickstarter 采用全有或全无的规则：众筹结束时才会从你的卡中扣款，而且只有达到目标才会扣款。" },
      { title: "你可以改变主意", text: "在众筹进行期间，你通常可以按照 Kickstarter 的规则修改或取消你的赞助。" },
    ],
    note: "赞助是在支持一个项目：回报和交付取决于众筹本身，所以赞助前请先阅读它的页面。",
  },
  faq: {
    title: "支持前的常见问题",
    items: [
      {
        q: "Kickstarter 是什么时候开放的？",
        a: "2026年10月27日开放：Koin Games 当天在 Steam 上发布了公告（“The Origins Kickstarter is LIVE”）。",
      },
      {
        q: "回报档位多少钱？",
        a: "Koin 会在众筹开放时在众筹页面上公布档位和价格。一旦上线，我们会立即补充到这里。",
      },
      {
        q: "玩游戏需要参加 Kickstarter 吗？",
        a: "不需要。对战卡牌是免费的，排位赛无需购买，Steam 上的游戏也是免费游玩的。",
      },
      {
        q: "我的补充包和卡牌会去哪里？",
        a: "根据 Koin 的官方页面，它们会进入你的 Steam 库存，成为可以在 Steam 上打开、保持密封或交易的物品。",
      },
      {
        q: "我已经预注册成为 VIP：应该用哪个链接？",
        a: "用 Koin 发给你的 VIP 链接：你的 15% 折扣与它绑定。",
      },
      {
        q: "这个推荐链接是什么？",
        a: "一个带有我们代码的 Kickstarter 链接：Koin Games 会看到你来自 OriginsMeta，并按你的赞助付给我们一笔佣金。你支付的价格不变。付款在 Kickstarter 上完成：我们永远看不到你的数据。",
      },
    ],
  },
  final: {
    title: "Alpha Edition 只印一次",
    text: "从首版开始你的 Origins 收藏。",
  },
  about: {
    title: "这些内容由谁提供",
    text: "OriginsMeta 是关于 Origins TCG 的独立粉丝网站：在游戏中核对过的 122 张卡牌的数据库、卡组构筑器、强度榜、攻略以及 OriginsMeta Tracker。本页只使用 Koin Games 已公布的信息。",
    guide: "关于 Kickstarter 的一切，附日期和来源",
  },
  unofficial: "OriginsMeta 是非官方粉丝网站，与 Koin Games 无关联。在 Kickstarter 方面，我们参加了 Koin 的推荐计划。",
  tiers: {
    title: "回报档位",
    intro: "Koin Games 公布的众筹档位，从最便宜的开始。价格以美元计。",
    digital: "正如 Koin Games 所说明的，所有 Kickstarter 回报都是数字产品。",
    packs: { one: "{n} 包", few: "{n} 包", many: "{n} 包", other: "{n} 包" },
    includes: "此档包含的全部内容",
    from: "档位从 {min} 到 {max}",
    faq: "从 {min} 到 {max}：每一档及其包含的内容都在上面的版块中。",
    source: "档位和内容来自 Koin Games 在 Kickstarter 上的众筹。",
  },
  stickyNote: "推荐链接 · 你支付的价格不变",
  bar: { text: "Origins TCG 的 Alpha Edition 自 10月27日起在 Kickstarter 上推出", cta: "了解 Alpha Edition", close: "关闭" },
  slide: {
    kicker: "Kickstarter · 10月27日",
    title: "Alpha Edition 只在 Kickstarter 上推出",
    text: "首版、永不重印、官方开出概率：支持前需要了解的一切。",
    cta: "了解 Alpha Edition",
    alt: "Origins TCG 的金发女主角 Goldi 抱着双臂微笑，旁边是她带熊头图案的金色名字。",
  },
  guide: {
    title: "众筹已在 Kickstarter 上线",
    text: "Alpha Edition 于 2026年10月27日在 Kickstarter 上开放。我们的页面汇总了其中包含的内容，并附有官方开出概率。",
    landing: "Alpha Edition 简介",
  },
  promos: {
    title: "Alpha 宣传卡",
    intro: "Alpha Edition 的宣传卡采用异画，与游戏中的卡牌不同，Koin 展示它们时都装在评级壳里。这里列出了已公开的宣传卡以及包含它们的档位。",
    box: {
      title: "Alpha Alt-Art Promo Box",
      text: "Apprentice 档及以上的每位支持者都能获得 Alpha Alt-Art Promo Box。它从 Van Helsing 开始，每达成一个延伸目标就增加一张，在 {max} 时达到 {n} 张。Koin 写道，这些卡牌在 Kickstarter 之后将永不再发放。",
      start: "上线即有",
      unlocked: "已解锁",
      goal: "延伸目标：{usd}",
      more: "尚待解锁的延伸目标（{n}）",
      status: "延伸目标以众筹页面在 {date} 显示的为准。",
    },
    golden: { title: "Golden Slab Promos", text: "Hero 档起获得 Van Helsing；Champion 档及以上获得 Van Helsing 和 Rapunzel。" },
    oz: { title: "Premium Alternate Art Promo Set", text: "Icon 档及以上：《绿野仙踪》的五个角色 Dorothy、Scarecrow、Tin Woodman、Cowardly Lion 和 Toto。" },
    profiles: {
      title: "限量编号肖像",
      text: "每个 Myth 档都包含对应角色的限量编号肖像：Winnie-the-Pooh、Death、Alice、Robin Hood 或 Queen of Hearts。Legend 档还附有签名版，这里展示的是 Winnie-the-Pooh 的；在 {date} 它们显示为已售罄。",
    },
    signed: "签名版",
    artist: "画师：{name}",
    alt: "{name}，Origins TCG Alpha Edition 的异画宣传卡，装在评级壳里",
    credit: "Koin Games 官方图片，来自面向创作者的媒体资料包；每张卡都标有其画师。",
    guideAnchor: "alpha-xuan-chuan-ka",
  },
};
