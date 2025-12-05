// simulator.js

class LolSimulator {
    constructor(teamsData, config) {
        this.teams = this.deepCopy(teamsData).map(t => ({
            ...t,
            currentRating: t.initialRating,
            wins: 0,
            losses: 0,
            opponentsPlayed: [], // 瑞士轮中已对战过的对手
            qualified: false,
            eliminated: false,
            swissRank: 0 // 3-0, 3-1, 3-2
        }));
        this.config = config; // { eloScale, kFactor, knownMatches }
        
        // 为已知比赛更新初始状态
        this.applyKnownMatches();
    }

    deepCopy(data) {
        return JSON.parse(JSON.stringify(data));
    }

    // 1. 胜率计算
    calculateWinProbability(ratingA, ratingB) {
        const exponent = (ratingB - ratingA) / this.config.eloScale;
        return 1 / (1 + Math.pow(10, exponent));
    }

    // 2. 模拟系列赛 (Bo1, Bo3, Bo5)
    simulateSeries(teamA, teamB, format) {
        const probA_Bo1 = this.calculateWinProbability(teamA.currentRating, teamB.currentRating);
        
        if (format === 'Bo1') {
            return (Math.random() < probA_Bo1) ? teamA.id : teamB.id;
        }
        
        let winsA = 0;
        let winsB = 0;
        const gamesToWin = format === 'Bo3' ? 2 : 3;

        for (let i = 0; i < (gamesToWin * 2 - 1); i++) {
            if (Math.random() < probA_Bo1) {
                winsA++;
            } else {
                winsB++;
            }
            
            if (winsA === gamesToWin) return teamA.id;
            if (winsB === gamesToWin) return teamB.id;
        }
        // 理论上不会到这里
        return (winsA > winsB) ? teamA.id : teamB.id;
    }

    // 3. 更新战力分
    updateRatings(winner, loser, format) {
        const probWinner = this.calculateWinProbability(winner.currentRating, loser.currentRating);
        const probLoser = 1 - probWinner;
        
        const gamesPlayed = format === 'Bo1' ? 1 : (format === 'Bo3' ? 2.5 : 4); // BoX的平均局数近似
        const k = this.config.kFactor * (format === 'Bo1' ? 1 : (format === 'Bo3' ? 1.5 : 2)); // 系列赛K值权重更高

        winner.currentRating += k * (1 - probWinner);
        loser.currentRating += k * (0 - probLoser);
    }
    
    // 应用已知比赛结果
    applyKnownMatches() {
        // (此功能在 app.js 中实现，通过更新战力分和瑞士轮状态)
        // 在这个模拟器里，我们假设模拟从当前状态开始
        // 简单起见，我们让 app.js 先更新战队数据，再传入
    }

    // 4. 瑞士轮模拟
    runSwissSimulation() {
        let activeTeams = this.deepCopy(this.teams);
        let qualifiedTeams = [];
        let eliminatedTeams = [];

        for (let round = 1; round <= 5; round++) {
            let matches = [];
            let format = 'Bo1';

            if (round === 1) {
                // 第1轮：简单抽签，同赛区规避
                // 为简化，我们随机配对，并检查赛区
                let teamsToPair = [...activeTeams];
                teamsToPair.sort(() => 0.5 - Math.random()); // 随机打乱
                
                let pairedTeams = new Set();
                for (let i = 0; i < teamsToPair.length; i++) {
                    if (pairedTeams.has(teamsToPair[i].id)) continue;
                    
                    for (let j = i + 1; j < teamsToPair.length; j++) {
                        if (pairedTeams.has(teamsToPair[j].id)) continue;
                        
                        // 赛区规避
                        if (teamsToPair[i].region !== teamsToPair[j].region) {
                            matches.push({ teamA: teamsToPair[i], teamB: teamsToPair[j], format });
                            pairedTeams.add(teamsToPair[i].id);
                            pairedTeams.add(teamsToPair[j].id);
                            break;
                        }
                    }
                }
                // (如果最后剩下同赛区，也没办法，只能配对)
                
            } else {
                // 第 2-5 轮：按战绩分组
                let teamsByRecord = {};
                for (const team of activeTeams) {
                    const record = `${team.wins}-${team.losses}`;
                    if (!teamsByRecord[record]) teamsByRecord[record] = [];
                    teamsByRecord[record].push(team);
                }

                // 确定比赛形式 (晋级/淘汰赛为 Bo3)
                if (round === 3) {
                    // 2-0 (Bo3), 1-1 (Bo1), 0-2 (Bo3)
                    matches.push(...this.pairGroup(teamsByRecord['2-0'] || [], 'Bo3', true));
                    matches.push(...this.pairGroup(teamsByRecord['1-1'] || [], 'Bo1', true));
                    matches.push(...this.pairGroup(teamsByRecord['0-2'] || [], 'Bo3', true));
                } else if (round === 4) {
                    // 2-1 (Bo3), 1-2 (Bo3)
                    matches.push(...this.pairGroup(teamsByRecord['2-1'] || [], 'Bo3', true));
                    matches.push(...this.pairGroup(teamsByRecord['1-2'] || [], 'Bo3', true));
                } else if (round === 5) {
                    // 2-2 (Bo3)
                    matches.push(...this.pairGroup(teamsByRecord['2-2'] || [], 'Bo3', true));
                } else { // Round 2
                    // 1-0 (Bo1), 0-1 (Bo1)
                    matches.push(...this.pairGroup(teamsByRecord['1-0'] || [], 'Bo1', true));
                    matches.push(...this.pairGroup(teamsByRecord['0-1'] || [], 'Bo1', true));
                }
            }

            // 模拟所有比赛
            for (const match of matches) {
                const winnerId = this.simulateSeries(match.teamA, match.teamB, match.format);
                const loserId = (winnerId === match.teamA.id) ? match.teamB.id : match.teamA.id;

                let winner = activeTeams.find(t => t.id === winnerId);
                let loser = activeTeams.find(t => t.id === loserId);

                // 更新战力分
                this.updateRatings(winner, loser, match.format);

                // 更新瑞士轮状态
                winner.wins++;
                loser.losses++;
                winner.opponentsPlayed.push(loser.id);
                loser.opponentsPlayed.push(winner.id);
            }

            // 处理晋级和淘汰
            let nextRoundTeams = [];
            for (const team of activeTeams) {
                if (team.wins === 3) {
                    team.qualified = true;
                    team.swissRank = team.losses; // 0 (3-0), 1 (3-1), 2 (3-2)
                    qualifiedTeams.push(team);
                } else if (team.losses === 3) {
                    team.eliminated = true;
                    eliminatedTeams.push(team);
                } else {
                    nextRoundTeams.push(team);
                }
            }
            activeTeams = nextRoundTeams;
        }
        
        return qualifiedTeams;
    }

    // 瑞士轮配对辅助函数 (带规避)
    pairGroup(group, format, avoidRematch) {
        let matches = [];
        let teamsToPair = [...group];
        teamsToPair.sort(() => 0.5 - Math.random()); // 随机打乱
        let pairedTeams = new Set();

        for (let i = 0; i < teamsToPair.length; i++) {
            if (pairedTeams.has(teamsToPair[i].id)) continue;
            
            for (let j = i + 1; j < teamsToPair.length; j++) {
                if (pairedTeams.has(teamsToPair[j].id)) continue;
                
                // 规避已对战过的
                const alreadyPlayed = teamsToPair[i].opponentsPlayed.includes(teamsToPair[j].id);
                
                if (!avoidRematch || !alreadyPlayed) {
                    matches.push({ teamA: teamsToPair[i], teamB: teamsToPair[j], format });
                    pairedTeams.add(teamsToPair[i].id);
                    pairedTeams.add(teamsToPair[j].id);
                    break;
                }
            }
        }
        // (如果最后没办法只能打重复的，那也没办法了)
        return matches;
    }

    // 5. 淘汰赛模拟
    runKnockoutSimulation(qualifiedTeams) {
        if (qualifiedTeams.length !== 8) {
            // 瑞士轮模拟出错
            return null;
        }

        let teams = this.deepCopy(qualifiedTeams);
        
        // --- 淘汰赛抽签 ---
        // 规则: 3-0 分在不同半区。 规避瑞士轮已对战过的。
        let teams3_0 = teams.filter(t => t.swissRank === 0).sort(() => 0.5 - Math.random());
        let teams3_1 = teams.filter(t => t.swissRank === 1).sort(() => 0.5 - Math.random());
        let teams3_2 = teams.filter(t => t.swissRank === 2).sort(() => 0.5 - Math.random());
        
        // 确保3-0有两个 (如果模拟中出现3个或1个3-0, 抽签会简化)
        let seed1 = (teams3_0.length > 0) ? teams3_0.pop() : teams3_1.pop();
        let seed2 = (teams3_0.length > 0) ? teams3_0.pop() : teams3_1.pop();
        
        let pool = [...teams3_0, ...teams3_1, ...teams3_2].sort(() => 0.5 - Math.random());
        
        // 分配对手
        let qf1 = { teamA: seed1, teamB: this.findOpponent(seed1, pool) };
        let qf2 = { teamA: seed2, teamB: this.findOpponent(seed2, pool) };
        let qf3 = { teamA: pool.pop(), teamB: this.findOpponent(pool[pool.length - 1], pool, 0) };
        let qf4 = { teamA: pool.pop(), teamB: pool.pop() };

        let qfMatches = [qf1, qf2, qf3, qf4];
        let sfTeams = [];
        
        // --- QF (Bo5) ---
        for (const match of qfMatches) {
            const winnerId = this.simulateSeries(match.teamA, match.teamB, 'Bo5');
            const winner = winnerId === match.teamA.id ? match.teamA : match.teamB;
            sfTeams.push(winner);
        }

        // --- SF (Bo5) ---
        // 确保半区 (qf1 和 qf3 在一个半区, qf2 和 qf4 在另一个)
        let sf1 = { teamA: sfTeams[0], teamB: sfTeams[2] };
        let sf2 = { teamA: sfTeams[1], teamB: sfTeams[3] };
        
        let finalTeams = [];
        finalTeams.push(sf1.teamA.id === this.simulateSeries(sf1.teamA, sf1.teamB, 'Bo5') ? sf1.teamA : sf1.teamB);
        finalTeams.push(sf2.teamA.id === this.simulateSeries(sf2.teamA, sf2.teamB, 'Bo5') ? sf2.teamA : sf2.teamB);

        // --- Finals (Bo5) ---
        let f = { teamA: finalTeams[0], teamB: finalTeams[1] };
        const championId = this.simulateSeries(f.teamA, f.teamB, 'Bo5');
        
        return teams.find(t => t.id === championId);
    }
    
    // 抽签辅助函数
    findOpponent(team, pool, startIndex = 0) {
        for (let i = startIndex; i < pool.length; i++) {
            if (pool[i] && !team.opponentsPlayed.includes(pool[i].id)) {
                return pool.splice(i, 1)[0]; // 抽出对手
            }
        }
        // 如果都打过了，随便抽一个
        return pool.splice(startIndex, 1)[0];
    }

    // 6. 主执行函数
    runFullSimulation() {
        // 先跑瑞士轮
        const qualifiedTeams = this.runSwissSimulation();
        // 再跑淘汰赛
        const champion = this.runKnockoutSimulation(qualifiedTeams);

        return {
            qualifiedTeams: qualifiedTeams.map(t => t.id),
            champion: champion ? champion.id : null
        };
    }
}