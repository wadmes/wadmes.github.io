// app.js

document.addEventListener('DOMContentLoaded', () => {
    // --- 全局变量和 DOM 元素 ---
    let teams = JSON.parse(JSON.stringify(TEAMS_DATA)); // 工作副本
    const ratingsContainer = document.getElementById('ratingsContainer');
    const swissProbContainer = document.getElementById('swissProbContainer');
    const championProbContainer = document.getElementById('championProbContainer');
    
    const eloScaleSlider = document.getElementById('eloScale');
    const kFactorSlider = document.getElementById('kFactor');
    const simulationsSlider = document.getElementById('simulations');
    
    const eloScaleValue = document.getElementById('eloScaleValue');
    const kFactorValue = document.getElementById('kFactorValue');
    const simulationsValue = document.getElementById('simulationsValue');
    
    const runBtn = document.getElementById('runSimulationBtn');
    const btnText = runBtn.querySelector('.button-text');
    const btnSpinner = runBtn.querySelector('.loading-spinner');
    
    const progressBar = document.getElementById('progressBar');
    const simStatus = document.getElementById('simulationStatus');

    // --- 初始化 ---
    function initialize() {
        renderRatings();
        setupListeners();
    }

    // 渲染战力分板块
    function renderRatings() {
        ratingsContainer.innerHTML = '';
        teams.sort((a, b) => b.initialRating - a.initialRating);
        
        teams.forEach(team => {
            const item = document.createElement('div');
            item.className = 'rating-item';
            item.innerHTML = `
                <img src="${team.logo}" alt="${team.name} Logo">
                <span class="team-name">${team.name}</span>
                <span class="team-region">${team.region}</span>
                <input type="number" class="rating-input" data-id="${team.id}" value="${team.initialRating}">
            `;
            ratingsContainer.appendChild(item);
        });
    }

    // 设置事件监听
    function setupListeners() {
        // 滑块监听
        eloScaleSlider.addEventListener('input', e => eloScaleValue.textContent = e.target.value);
        kFactorSlider.addEventListener('input', e => kFactorValue.textContent = e.target.value);
        simulationsSlider.addEventListener('input', e => simulationsValue.textContent = e.target.value);
        
        // 战力分输入监听
        ratingsContainer.addEventListener('change', e => {
            if (e.target.classList.contains('rating-input')) {
                const teamId = e.target.dataset.id;
                const newRating = parseInt(e.target.value, 10);
                
                const team = teams.find(t => t.id === teamId);
                if (team && !isNaN(newRating)) {
                    team.initialRating = newRating;
                    // (可选) 可以在这里自动保存到 localStorage
                }
            }
        });

        // 运行模拟按钮
        runBtn.addEventListener('click', runSimulation);
    }

    // --- 模拟执行 ---
    async function runSimulation() {
        setLoadingState(true);

        const config = {
            eloScale: parseInt(eloScaleSlider.value, 10),
            kFactor: parseInt(kFactorSlider.value, 10),
            knownMatches: [] // (未来可以从UI读取)
        };
        const numSimulations = parseInt(simulationsSlider.value, 10);

        // 初始化统计结果
        let swissProb = {};
        let champProb = {};
        teams.forEach(t => {
            swissProb[t.id] = 0;
            champProb[t.id] = 0;
        });
        
        // (重置战队数据，以防用户修改了)
        teams = teams.map(t_data => {
            const input = ratingsContainer.querySelector(`input[data-id="${t_data.id}"]`);
            t_data.initialRating = input ? parseInt(input.value, 10) : t_data.initialRating;
            return t_data;
        });

        // 使用 setTimeout 分块执行，防止浏览器卡死
        for (let i = 0; i < numSimulations; i++) {
            // 创建一个新的模拟器实例，传入当前战力分
            const currentTeamsData = teams.map(t => ({
                ...t,
                initialRating: t.initialRating // 确保使用用户修改后的值
            }));
            
            const simulator = new LolSimulator(currentTeamsData, config);
            const result = simulator.runFullSimulation();
            
            result.qualifiedTeams.forEach(id => {
                if (swissProb[id] !== undefined) swissProb[id]++;
            });
            if (result.champion && champProb[result.champion] !== undefined) {
                champProb[result.champion]++;
            }

            // 更新进度条
            if (i % (Math.floor(numSimulations / 100) || 1) === 0) {
                const percent = (i / numSimulations) * 100;
                progressBar.style.width = `${percent}%`;
                simStatus.textContent = `模拟中... (${i} / ${numSimulations})`;
                // 释放UI线程
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        progressBar.style.width = '100%';
        simStatus.textContent = `模拟完成！ (共 ${numSimulations} 次)`;

        // 渲染最终结果
        renderProbabilities(swissProb, swissProbContainer, numSimulations);
        renderProbabilities(champProb, championProbContainer, numSimulations);

        setLoadingState(false);
    }
    
    // --- UI 更新辅助 ---
    
    function setLoadingState(isLoading) {
        runBtn.disabled = isLoading;
        btnText.style.display = isLoading ? 'none' : 'inline';
        btnSpinner.style.display = isLoading ? 'inline-block' : 'none';
        
        if (isLoading) {
            progressBar.style.width = '0%';
            simStatus.textContent = '准备开始模拟...';
            swissProbContainer.innerHTML = '<div class="placeholder">正在计算...</div>';
            championProbContainer.innerHTML = '<div class="placeholder">正在计算...</div>';
        }
    }
    
    function renderProbabilities(probData, container, numSimulations) {
        container.innerHTML = '';
        
        const sortedProbs = Object.keys(probData)
            .map(id => ({
                id: id,
                team: teams.find(t => t.id === id),
                prob: (probData[id] / numSimulations) * 100
            }))
            .sort((a, b) => b.prob - a.prob);

        sortedProbs.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'prob-item';
            div.innerHTML = `
                <span class="prob-rank">#${index + 1}</span>
                <img src="${item.team.logo}" alt="${item.team.name}">
                <span class="prob-team-name">${item.team.name}</span>
                <div class="prob-bar-container">
                    <div class="prob-bar" style="width: ${item.prob.toFixed(2)}%;"></div>
                </div>
                <span class="prob-value">${item.prob.toFixed(2)}%</span>
            `;
            container.appendChild(div);
        });
    }

    // --- 启动 ---
    initialize();
});