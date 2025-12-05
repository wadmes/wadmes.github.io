// data.js
const TEAMS_DATA = [
    // LPL (China)
    { id: 'BLG', name: 'BLG', region: 'LPL', initialRating: 1840, logo: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/b/b8/Bilibili_Gaming_logo_square.png' },
    { id: 'AL', name: 'AL', region: 'LPL', initialRating: 1760, logo: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/5/5a/Anyone%27s_Legend_logo_square.png' },
    { id: 'TES', name: 'TES', region: 'LPL', initialRating: 1820, logo: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/e/e0/Top_Esports_logo_square.png' },

    // LCK (Korea)
    { id: 'GEN', name: 'GEN', region: 'LCK', initialRating: 1850, logo: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/5/55/Gen.G_logo_square.png' },
    { id: 'HLE', name: 'HLE', region: 'LCK', initialRating: 1830, logo: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/c/c3/Hanwha_Life_Esports_logo_square.png' },
    { id: 'KT', name: 'KT', region: 'LCK', initialRating: 1780, logo: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/d/de/KT_Rolster_logo_square.png' },
    { id: 'T1', name: 'T1', region: 'LCK', initialRating: 1800, logo: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/7/73/T1_logo_square.png' },

    // Americas (LTA - LCS/CBLOL)
    { id: 'FLY', name: 'FLY', region: 'LTA', initialRating: 1700, logo: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/b/b8/FlyQuest_logo_square.png' },
    { id: 'VKS', name: 'VKS', region: 'LTA', initialRating: 1600, logo: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/0/0e/Vivo_Keyd_Stars_logo_square.png' },
    { id: '100T', name: '100T', region: 'LTA', initialRating: 1680, logo: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/e/e9/100_Thieves_logo_square.png' },

    // LEC (Europe)
    { id: 'G2', name: 'G2', region: 'LEC', initialRating: 1770, logo: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/e/e5/G2_Esports_logo_square.png' },
    { id: 'MKOI', name: 'MKOI', region: 'LEC', initialRating: 1700, logo: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/1/1b/MAD_Lions_KOI_logo_square.png' },
    { id: 'FNC', name: 'FNC', region: 'LEC', initialRating: 1720, logo: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/8/83/Fnatic_logo_square.png' },

    // LCP (Pacific - PCS/VCS)
    { id: 'CFO', name: 'CFO', region: 'LCP', initialRating: 1650, logo: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/b/b5/CTBC_Flying_Oyster_logo_square.png' },
    { id: 'TSW', name: 'TSW', region: 'LCP', initialRating: 1620, logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIJISANJI_empty.svg/1200px-Logo_NIJISANJI_empty.svg.png' }, // Placeholder logo
    { id: 'PS', name: 'PS', region: 'LCP', initialRating: 1640, logo: 'https://static.wikia.nocookie.net/lolesports_gamepedia_en/images/c/c5/PSG_Talon_logo_square.png' }
];

// 已知的比赛结果 (示例)
// 格式: { teamA: 'ID', teamB: 'ID', winner: 'ID', round: 1, format: 'Bo1' }
const KNOWN_MATCHES = [
    // 示例: 假如第一轮已有结果
    // { teamA: 'GEN', teamB: 'VKS', winner: 'GEN', round: 1, format: 'Bo1' },
    // { teamA: 'BLG', teamB: 'FNC', winner: 'BLG', round: 1, format: 'Bo1' },
];