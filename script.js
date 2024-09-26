document.addEventListener('DOMContentLoaded', () => {
    const player = document.getElementById('player');
    const abilityChoices = document.getElementById('ability-choices-overlay');
    const abilityButtonWrapper = document.getElementById('ability-button-wrapper');
    const timerDisplay = document.getElementById('timer');
    const expBarFill = document.getElementById('exp-bar-fill');
    const hpBarFill = document.getElementById('hp-bar-fill');
    const expValue = document.getElementById('exp-value');
    const hpValue = document.getElementById('hp-value');
    const levelDisplay = document.getElementById('level');
    const damageDisplay = document.getElementById('damage');
    const aoeDisplay = document.getElementById('aoe');
    const attackSpeedDisplay = document.getElementById('attack-speed');
    const hpRegenDisplay = document.getElementById('hp-regen');
    const armourDisplay = document.getElementById('armour');
    const evadeDisplay = document.getElementById('evade');
    const critChanceDisplay = document.getElementById('crit-chance');
    const critMultiplierDisplay = document.getElementById('crit-multiplier');
    const pauseOverlay = document.getElementById('pause-overlay');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const gameContainer = document.getElementById('game-container');
    const charaterSelectionDisplay = document.getElementById('character-selection');
    const charaterListDisplay = document.getElementById('character-list');
    const gameUIDisplay = document.getElementById('game-ui');

    window.requestAnimationFrame =
           window.requestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.msRequestAnimationFrame;

    let characterSelection = false;
    let gamePaused = false;
    let gameOver = false;
    let gameLoopId;
    let lastAttackTime = 0;
    let elapsedSeconds = 0;
    let timerStart = Date.now();
    let pauseTime = Date.now();
    let levelUpPending = false;
    let enemyAttackCooldown = {};
    let currentDifficultyLevel = 0;
    let previousDifficultyLevel = 0;
    let difficultyIntervalTime = 1000 * 10;
    let healthRegenTime = Date.now();
    let healthRegenInterval = 1000 * 1;
    let normalSpawnTime = Date.now();
    let normalSpawnInterval = 1000 * 60 / 50;
    let rareEnemySpawnTime = Date.now();
    let rareEnemySpawnInterval = 1000 * 60 / 15;
    let eliteSpawnTime = Date.now();
    let eliteSpawnIntervalTime = 1000 * 60 / 3;
    let bossSpawnTime = Date.now();
    let bossSpawnIntervalTime = 1000 * 60 / 1;
    let nextEnemyId = 0;

    //buffs
    let attackSpeedBuffTime = Date.now();
    let attackSpeedBuffInterval = 1000 * 10;
    let attackSpeedBuffDuration = 1000 * 5;

    const characters = [
        {
            name: "Adventurer",
            stats: {
                hp: 600,
                maxHp: 600,
                physicalDamage: 30,
                attackSpeed: 2,
                attackRange: 150, 
                critChance: 5.0,
                critMultiplier: 150,
                armour: 30,
                evade: 15,
                hpRegen: 3,
                level: 1,
                exp: 0,
                expGain: 1.5,
                expThreshold: 8,
                buffList: {},
            },
            description: "A strong beginner friendly."
        },
        {
            name: "Warrior",
            stats: {
                hp: 1000,
                maxHp: 1000,
                physicalDamage: 30,
                attackSpeed: 1.30,
                attackRange: 80, 
                critChance: 5.0,
                critMultiplier: 200,
                armour: 45,
                evade: 0,
                hpRegen: 10,
                level: 1,
                exp: 0,
                expGain: 1,
                expThreshold: 8,
                buffList: {},
            },
            description: "A strong melee fighter."
        },
        {
            name: "Ranger",
            stats: {
                hp: 350,
                maxHp: 350,
                physicalDamage: 40,
                attackSpeed: 2.5,
                attackRange: 300, 
                critChance: 15.0,
                critMultiplier: 125,
                armour: 10,
                evade: 25,
                hpRegen: 1,
                level: 1,
                exp: 0,
                expGain: 1,
                expThreshold: 8,
                buffList: {},
            },
            description: "A strong ranger."
        },
        {
            name: "Assassin",
            stats: {
                hp: 300,
                maxHp: 300,
                physicalDamage: 45,
                attackSpeed: 2.1,
                attackRange: 100, 
                critChance: 25.0,
                critMultiplier: 250,
                armour: 5,
                evade: 50,
                hpRegen: 1,
                level: 1,
                exp: 0,
                expGain: 1,
                expThreshold: 8,
                buffList: {},
            },
            description: "A strong assassin."
        },
        {
            name: "Healer",
            stats: {
                hp: 800,
                maxHp: 800,
                physicalDamage: 25,
                attackSpeed: 1.85,
                attackRange: 200, 
                critChance: 5.0,
                critMultiplier: 150,
                armour: 25,
                evade: 10,
                hpRegen: 150,
                level: 1,
                exp: 0,
                expGain: 1,
                expThreshold: 8,
                buffList: {},
            },
            description: "A strong healer."
        },
    ];

    let originalStats = {};
    let stats = {
        hp: 600,
        maxHp: 600,
        physicalDamage: 10,
        attackSpeed: 2,
        attackRange: 150, 
        critChance: 5.0,
        critMultiplier: 150,
        armour: 1,
        evade: 0,
        hpRegen: 3,
        level: 1,
        exp: 0,
        expGain: 1,
        expThreshold: 8,
        buffList: {},
    };

    let originalEnemyStats = {};
    let enemyStats = {
        hp: 15,
        maxHp: 15,
        physicalDamage: 10,
        attackSpeed: 1.4,
        attackRange: 50, 
        armour: 0,
        hpRegen: 0.5,
        moveSpeed: 0.3,
        exp: 3
    };

    let originalStatsList = {};
    let statsList = {
        "Uprade Damage": {level: 0, maxLevel: 1000},
        "Uprade AoE": {level: 0, maxLevel: 25},
        "Uprade Attack Speed": {level: 0, maxLevel: 50},
        "Uprade HP (Recover 20% Life)": {level: 0, maxLevel: 1000},
        "Uprade HP Regen": {level: 0, maxLevel: 1000},
        "Uprade Armour": {level: 0, maxLevel: 1000},
        "Uprade Crit Chance": {level: 0, maxLevel: 40},
        "Uprade Crit Multiplier": {level: 0, maxLevel: 100}
    };

    let originalAbilityList = {};
    let abilityList = {
        "Reflect": {text: "Return ??%(25%) damage to the enemy", progression: ["5", "10", "15", "20", "25"], level: 0, maxLevel: 5},
        "Bounce": {text: "You deal ??%(0%) less damage, Projectile bounce ??(5) additional time", progression: ["40", "30", "20", "10", "0", "1", "2", "3", "4", "5"], level: 0, maxLevel: 5},
        "Attack Speed Buff": {text: "Grant additional ??%(80%) attack speed for 5 seconds, cooldown 10 seconds", progression: ["16", "32", "48", "64", "80"], level: 0, maxLevel: 5},
        //"Damage Buff": {text: "Grant additional ??%(80%) damage for 5 seconds, cooldown 10 seconds", progression: ["16", "32", "48", "64", "80"], level: 0, maxLevel: 5},
        "Damage Reduction": {text: "Grant ??%(60%) damage reduction", progression: ["12", "24", "36", "48", "60"], level: 0, maxLevel: 5},
        "Lifesteal": {text: "Grant ??%(75%) lifesteal", progression: ["15", "30", "45", "60", "75"], level: 0, maxLevel: 5},
        "HP To Damage": {text: "Deal additional ??%(30%) of maximum life as damage", progression: ["6", "12", "18", "24", "30"], level: 0, maxLevel: 5},
        "Regen To Damage": {text: "Deal additional ??%(250%) of Regen as damage, More ??%(100%) Regen Speed", progression: ["50", "100", "150", "200", "250", "20", "40", "60", "80", "100"], level: 0, maxLevel: 5},
        //"Immune Damage": {text: "Immune to damage for ??(5) seconds, cooldown ??(10) seconds", progression: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], level: 0, maxLevel: 5},
    };

    let abilityLevelThreshold = [];

    const enemies = [];
    const bullets = [];

    showCharacterSelection();

    function startGame(){
        characterSelection = false;
        charaterSelectionDisplay.style.display = 'none';
        gameUIDisplay.style.display = 'flex';
        gameContainer.style.display = 'flex';

        initVariable();
        createPlayerAttackRange();
        updatePlayerPosition();
        updateStatsDisplay();
        gameLoop();
    };

    function showCharacterSelection(){
        characterSelection = true;

        charaterSelectionDisplay.style.display = 'flex';
        gameOverOverlay.style.display = 'none';
        gameUIDisplay.style.display = 'none';
        gameContainer.style.display = 'none';

        let characterText = "";
        let n = 1;
        characters.forEach(element => {
            let i = 0;
            characterText += "<button class=\"character-button\" onclick=\"selectCharacter('" + element.name + "')\">" + n + ". " +  element.name + "</button>"
            n++;
        });
        charaterListDisplay.innerHTML = characterText;
    }

    window.selectCharacter = function(character) {
        let selectedCharacter = characters.find(o => o.name === character);
        let selectedCharacterStats = selectedCharacter.stats;
        originalStats = JSON.parse(JSON.stringify(selectedCharacterStats));
        stats = JSON.parse(JSON.stringify(originalStats));
        startGame();
    }

    function updatePlayerPosition() {
        player.style.left = `50vw`;
        player.style.top = `50vh`;

        const attackRangeCircle = document.querySelector('.player-attack-range');
        if (attackRangeCircle) {
            const rangeInVW = stats.attackRange * 2;
            const rangeInVH = stats.attackRange * 2;
            attackRangeCircle.style.width = `${rangeInVW}px`;
            attackRangeCircle.style.height = `${rangeInVH}px`;
        }
    }

    function createPlayerAttackRange() {
        const attackRangeCircle = document.createElement('div');
        attackRangeCircle.className = 'player-attack-range';
        
        const rangeInVW = stats.attackRange * 2;
        const rangeInVH = stats.attackRange * 2;
        attackRangeCircle.style.width = `${rangeInVW}px`;
        attackRangeCircle.style.height = `${rangeInVH}px`;

        attackRangeCircle.style.left = '50%';
        attackRangeCircle.style.top = '50%';
        
        document.getElementById('game-container').appendChild(attackRangeCircle);
    }

    function spawnEnemy(rarity) {
        const edge = Math.floor(Math.random() * 4);
        let enemyX, enemyY;

        switch (edge) {
            case 0:
                enemyX = Math.random()  * 100;
                enemyY = -2;
                break;
            case 1:
                enemyX = 102;
                enemyY = Math.random()  * 100;
                break;
            case 2:
                enemyX = Math.random()  * 100;
                enemyY = 102;
                break;
            case 3:
                enemyX = -2;
                enemyY = Math.random()  * 100;
                break;
        }

        enemyX = enemyX * 1920 / window.innerWidth;
        enemyY = enemyY * 1080 / window.innerHeight;

        const spawnTime = Date.now();
        const enemy = document.createElement('div');
        enemy.id = `enemy-${nextEnemyId++}`;
        enemy.style.left = `${enemyX}vw`;
        enemy.style.top = `${enemyY}vh`;

        // Create mini health bar for enemy
        const enemyHealthBar = document.createElement('div');
        enemyHealthBar.className = 'enemy-health-bar';
        const enemyHealthBarFill = document.createElement('div');
        enemyHealthBarFill.className = 'enemy-health-bar-fill';
        enemyHealthBarFill.style.width = '100%';
        enemyHealthBar.appendChild(enemyHealthBarFill);
        enemy.appendChild(enemyHealthBar);

        document.getElementById('game-container').appendChild(enemy);

        const enemyStatsCopy = Object.assign([], enemyStats);
        enemyStatsCopy.hp = enemyStats.hp + enemyStats.hp * currentDifficultyLevel / 3 + enemyStats.hp * Math.pow(currentDifficultyLevel, 1.7) / 5;
        enemyStatsCopy.physicalDamage = enemyStats.physicalDamage + enemyStats.physicalDamage * (currentDifficultyLevel) / 12 + enemyStats.physicalDamage * Math.pow(currentDifficultyLevel, 1.4) / 25;
        enemyStatsCopy.exp = enemyStats.exp + enemyStats.exp * (currentDifficultyLevel) / 5 + enemyStats.exp * Math.pow(currentDifficultyLevel, 1.2) / 5;
        if(rarity == "boss"){
            enemy.className = 'boss';
            enemyStatsCopy.hp = enemyStatsCopy.hp * 10;
            enemyStatsCopy.hp += enemyStatsCopy.hp * currentDifficultyLevel / 20;
            enemyStatsCopy.physicalDamage = enemyStatsCopy.physicalDamage * 1.5 * (Math.log(currentDifficultyLevel + 3));
            enemyStatsCopy.physicalDamage += enemyStatsCopy.physicalDamage * currentDifficultyLevel / 96;
            enemyStatsCopy.exp = enemyStatsCopy.exp * 12;
        }
        else if(rarity == "elite"){
            enemy.className = 'elite';
            enemyStatsCopy.hp = enemyStatsCopy.hp * 5;
            enemyStatsCopy.hp += enemyStatsCopy.hp * currentDifficultyLevel / 24;
            enemyStatsCopy.physicalDamage = enemyStatsCopy.physicalDamage * 1.35 * (Math.log(currentDifficultyLevel + 3));
            enemyStatsCopy.physicalDamage += enemyStatsCopy.physicalDamage * currentDifficultyLevel / 80;
            enemyStatsCopy.exp = enemyStatsCopy.exp * 5;
        }
        else if(rarity == "rareEnemy"){
            enemy.className = 'rare-enemy';
            enemyStatsCopy.hp = enemyStatsCopy.hp * 2;
            enemyStatsCopy.hp += enemyStatsCopy.hp * currentDifficultyLevel / 28;
            enemyStatsCopy.physicalDamage = enemyStatsCopy.physicalDamage * 1.2 * (Math.log(currentDifficultyLevel + 3));
            enemyStatsCopy.physicalDamage += enemyStatsCopy.physicalDamage * currentDifficultyLevel / 64;
            enemyStatsCopy.exp = enemyStatsCopy.exp * 2.5;
        }
        else {
            enemy.className = 'enemy';
            enemyStatsCopy.hp += enemyStatsCopy.hp * currentDifficultyLevel / 32;
            enemyStatsCopy.physicalDamage += enemyStatsCopy.physicalDamage * currentDifficultyLevel / 48;
        }

        enemyStatsCopy.hp = Math.floor(enemyStatsCopy.hp);
        enemyStatsCopy.physicalDamage = Math.floor(enemyStatsCopy.physicalDamage);
        enemyStatsCopy.exp = Math.floor(enemyStatsCopy.exp);
        enemyStatsCopy.maxHp = enemyStatsCopy.hp;

        enemies.push({
            id: enemy.id,
            element: enemy,
            stats: enemyStatsCopy,
            spawnTime: spawnTime,
            moveAnimationId: null
        });

        enemyAttackCooldown[enemy.id] = 0;

        moveEnemy(enemies[enemies.length - 1]);
    }

    function moveEnemy(enemy) {
        let enemyX = parseFloat(enemy.element.style.left);
        let enemyY = parseFloat(enemy.element.style.top);

        const targetX = parseFloat(player.style.left);
        const targetY = parseFloat(player.style.top);

        const animate = () => {
            if (gamePaused || gameOver) return; 

            const angle = Math.atan2(targetY - enemyY, targetX - enemyX);

            const distanceX = Math.abs(enemyX - targetX) * window.innerWidth / 100;
            const distanceY = Math.abs(enemyY - targetY) * window.innerHeight / 100;

            const distanceToPlayer = Math.hypot(distanceX, distanceY);

            if (distanceToPlayer > enemy.stats.attackRange) {
                const velocityX = Math.cos(angle) * enemy.stats.moveSpeed;
                const velocityY = Math.sin(angle) * enemy.stats.moveSpeed;

                // Update the enemy's center position
                enemyX += velocityX;
                enemyY += velocityY;

                // Apply new position to the element
                enemy.element.style.left = `${enemyX}vw`;
                enemy.element.style.top = `${enemyY}vh`;
            }
            
            // Continue the animation
            enemy.moveAnimationId = requestAnimationFrame(animate);
        };

        animate();
    }

    function moveBullet(bullet, enemy) {
        let bulletX = parseFloat(bullet.element.style.left);
        let bulletY = parseFloat(bullet.element.style.top);
        
        const enemyX = parseFloat(enemy.element.style.left);
        const enemyY = parseFloat(enemy.element.style.top);
        const angle = Math.atan2(enemyY - bulletY, enemyX - bulletX);

        let enemiesClone = Object.assign([], enemies);

        if(bullet.excludeTarget != null){
            enemiesClone = enemiesClone.filter(x => x.id !== bullet.excludeTarget.id);
        }

        const bulletSpeed = 1;
        const animate = () => {
            if (gamePaused || gameOver) return;

            const velocityX = Math.cos(angle) * bulletSpeed;
            const velocityY = Math.sin(angle) * bulletSpeed;

            bulletX += velocityX;
            bulletY += velocityY;

            bullet.element.style.left = `${bulletX}vw`;
            bullet.element.style.top = `${bulletY}vh`;

            let hitEnemy = null;

            for (let enemy of enemiesClone){
                const enemyLeft = parseFloat(enemy.element.style.left);
                const enemyTop = parseFloat(enemy.element.style.top);
                const enemyWidth = enemy.element.offsetWidth * 100 / window.innerWidth; // Convert to vw
                const enemyHeight = enemy.element.offsetHeight * 100 / window.innerHeight; // Convert to vh

                if (Math.abs(bulletX - enemyLeft) < (enemyWidth / 2) && 
                    Math.abs(bulletY - enemyTop) < (enemyHeight / 2) && 
                    enemy.stats.hp > 0) {
                    hitEnemy = enemy;
                    break;
                }
            }
    
            // Remove bullet if it reaches the enemy
            if (hitEnemy) {
                damageDealToEnemy(hitEnemy, false, bullet.remainingBounce > 0 ? true : false);

                if(bullet.remainingBounce > 0){
                    bullet.remainingBounce--;
                    attackNearestEnemy(enemyX, enemyY, hitEnemy, bullet.remainingBounce);
                }
                
                bullet.element.remove();
                bullets.splice(bullets.indexOf(bullet), 1);
            } else {
                bullet.moveAnimationId = requestAnimationFrame(animate);
            }
        };
    
        animate();
    }

    function damageDealToPlayer(enemy){
        let isEvadeHit = Math.random() < stats.evade / 100;

        if(!isEvadeHit){
            let damage = 0;
            damage = enemy.stats.physicalDamage - stats.armour;
    
            damageReductionLevel = abilityList["Damage Reduction"].level;
            damage = Math.floor(damageReductionLevel > 0 ? damage * damageReductionLevel * 12 / 100 : damage);
    
            if(stats.armour >= enemy.stats.physicalDamage * 3){
                damage = Math.max(0, damage);
            }
            else
            {
                damage = Math.max(1, damage);
            }
    
            stats.hp -= damage;
        }
    }

    function damageDealToEnemy(hitEnemy, isReflect, isBounce){
        let damage = stats.physicalDamage - hitEnemy.stats.armour;

        damage = Math.floor(abilityList["HP To Damage"].level > 0 ? ( stats.maxHp * abilityList["HP To Damage"].level * 6 / 100 + damage) : damage);
        damage = Math.floor(abilityList["Regen To Damage"].level > 0 ? ( stats.hpRegen * abilityList["Regen To Damage"].level * 50 / 100 + damage) : damage);
        damage = Math.floor(isReflect ? abilityList["Reflect"].level * 5 / 100 * damage : damage);
        damage = Math.floor(abilityList["Bounce"].level > 0 ? (60 + 10 * (abilityList["Bounce"].level - 1)) / 100 * damage : damage);

        let isCriticalHit = Math.random() < stats.critChance / 100; // critChance should be between 0 and 1
        if (isCriticalHit) {
            damage *= stats.critMultiplier / 100; 
        }

        damage = Math.floor(Math.max(1, damage));

        hitEnemy.stats.hp -= damage;
        
        showDamageFeedback(hitEnemy, damage, isCriticalHit);
        updateEnemyHealthBar(hitEnemy);

        if (hitEnemy.stats.hp <= 0) {
            removeEnemy(hitEnemy);
        }

        if(!isReflect && !isBounce){
            lifestealLevel = abilityList["Lifesteal"].level;
            if(lifestealLevel > 0){
                stats.hp += Math.floor(damage * lifestealLevel * 5 / 100);
                updateStatsDisplay();
            }
        }
    }

    function showDamageFeedback(enemy, damage, isCriticalHit) {
        const damageText = document.createElement('div');
        damageText.innerText = damage;
        damageText.style.position = 'absolute';
        damageText.style.left = `${parseFloat(enemy.element.style.left) - enemy.element.offsetWidth / 2 * 100 / window.innerWidth}vw`;
        damageText.style.top = `${parseFloat(enemy.element.style.top) - enemy.element.offsetHeight / 2 * 100 / window.innerHeight}vh`;
        damageText.style.color = isCriticalHit ? '#ffd700' : '#ff8554';
        damageText.style.textShadow = `
            0.1vw 0.1vw 0 rgba(128, 128, 128, 0.1),
            -0.1vw -0.1vw 0 rgba(128, 128, 128, 0.1),
            0.1vw -0.1vw 0 rgba(128, 128, 128, 0.1),
            -0.1vw 0.1vw 0 rgba(128, 128, 128, 0.1)
        `;
        damageText.style.transform = 'translateY(-2vw)';
        damageText.style.fontSize = '3.6vw';
        damageText.style.transition = 'opacity 2.5s ease-out, transform 2.5s ease-out';
        document.body.appendChild(damageText);

        setTimeout(function() {
            damageText.style.opacity = '0';
            damageText.style.transform = 'translateY(-6vw)';
        }, 0);

        setTimeout(function() {
            damageText.remove();
        }, 2500);
    }

    function updateStatsDisplay() {
        if(stats.hp > stats.maxHp)
            stats.hp = stats.maxHp;
        hpBarFill.style.width = `${(stats.hp / stats.maxHp) * 100}%`;
        hpValue.textContent = `HP: ${stats.hp} / ${stats.maxHp}`;
        expBarFill.style.width = `${(stats.exp / stats.expThreshold) * 100}%`;
        expValue.textContent = `EXP: ${stats.exp} / ${stats.expThreshold}`;
        levelDisplay.textContent = `Level: ${stats.level}`;
        damageDisplay.textContent = `Damage: ${stats.physicalDamage}`;
        aoeDisplay.textContent = `AoE: ${stats.attackRange}`;
        attackSpeedDisplay.textContent = `Attack Speed: ${stats.attackSpeed.toFixed(2).replace(/[.,]00$/, "")}`;
        hpRegenDisplay.textContent = `HP Regen: ${stats.hpRegen}`;
        armourDisplay.textContent = `Armour: ${stats.armour}`;
        evadeDisplay.textContent = `Evade: ${stats.evade.toFixed(2).replace(/[.,]00$/, "")}%`;
        critChanceDisplay.textContent = `Crit: ${stats.critChance.toFixed(2).replace(/[.,]00$/, "")}%`;
        critMultiplierDisplay.textContent = `Crit Multi: ${stats.critMultiplier}%`;
    }

    function gameLoop() {
        const currentTime = Date.now();

        if (!gamePaused && !gameOver) {
            // Player auto-attack
            if (currentTime - lastAttackTime >= 1000 / stats.attackSpeed) {
                attackNearestEnemy(parseFloat(player.style.left), parseFloat(player.style.top), null, null); // Attack nearest enemy
            }

            if (abilityList["Attack Speed Buff"].level > 0) {
                if(currentTime - attackSpeedBuffTime >= attackSpeedBuffInterval) {
                    attackSpeedBuffTime = currentTime;
                    GrantBuff("Attack Speed Buff");
                }
                else if (currentTime - attackSpeedBuffTime >= attackSpeedBuffDuration){
                    RemoveBuff("Attack Speed Buff");
                }
            }
            
            if (currentTime - timerStart >= 1000) {
                elapsedSeconds = Math.floor((currentTime - timerStart) / 1000);
                const minutes = Math.floor(elapsedSeconds / 60);
                const seconds = elapsedSeconds % 60;
                timerDisplay.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                currentDifficultyLevel = Math.floor(elapsedSeconds / (difficultyIntervalTime / 1000));
                if(previousDifficultyLevel != currentDifficultyLevel){
                    previousDifficultyLevel = currentDifficultyLevel;
                    normalSpawnInterval = 1000 * 60 / (50 + 4 * currentDifficultyLevel);
                    rareEnemySpawnInterval = 1000 * 60 / (15 + 2 * currentDifficultyLevel);
                    eliteSpawnIntervalTime = 1000 * 60 / (3 + currentDifficultyLevel / 1.5);
                    bossSpawnIntervalTime = 1000 * 60 / (1 + currentDifficultyLevel / 25);
                }
            }

            if (stats.hp <= 0) {
                gameOver = true;
                gameOverOverlay.style.display = 'flex';
                return;
            }

            if (currentTime - bossSpawnTime >= bossSpawnIntervalTime) {
                bossSpawnTime = currentTime;
                spawnEnemy("boss");
            }

            if (currentTime - eliteSpawnTime >= eliteSpawnIntervalTime) {
                eliteSpawnTime = currentTime;
                spawnEnemy("elite");
            }

            if (currentTime - rareEnemySpawnTime >= rareEnemySpawnInterval) {
                rareEnemySpawnTime = currentTime;
                spawnEnemy("rareEnemy");
            }

            if (currentTime - normalSpawnTime >= normalSpawnInterval) {
                normalSpawnTime = currentTime;
                spawnEnemy("normal");
            }

            enemies.forEach((enemy) => {
                if (currentTime - enemyAttackCooldown[enemy.element.id] >= 1000 / enemy.stats.attackSpeed) {
                    enemyAttackCooldown[enemy.element.id] = currentTime;
                    attackPlayer(enemy);
                }
            });

            if (currentTime - healthRegenTime >= (healthRegenInterval / (1 + (abilityList["Regen To Damage"].level > 0 ? abilityList["Regen To Damage"].level * 20 / 100 : 0)))) {
                healthRegenTime = currentTime;
                stats.hp += stats.hpRegen;
            }

            updateStatsDisplay();
        }

        gameLoopId = requestAnimationFrame(gameLoop);
    }

    function GrantBuff(buff){
        if(stats.buffList.length > 0 && stats.buffList[buff]){
            RemoveBuff(buff);
            GrantBuff(buff);
        }
        else{
            if(buff == "Attack Speed Buff"){
                let attackSpeedBuff = abilityList[buff].level > 0 ? stats.attackSpeed * abilityList[buff].level * 16 / 100 : 0;
                stats.buffList[buff] = attackSpeedBuff;
                stats.attackSpeed += stats.buffList[buff];
                updateStatsDisplay();
            }
        }
    }

    function RemoveBuff(buff){
        if(stats.buffList[buff]){
            if(buff == "Attack Speed Buff"){
                stats.attackSpeed -= stats.buffList[buff];
                updateStatsDisplay();
            }
            delete stats.buffList[buff];
        }
    }

    function attackPlayer(enemy) {
        const playerX = parseFloat(player.style.left);
        const playerY = parseFloat(player.style.top);
        const enemyX = parseFloat(enemy.element.style.left);
        const enemyY = parseFloat(enemy.element.style.top);

        const distanceX = Math.abs(enemyX - playerX) * window.innerWidth / 100;
        const distanceY = Math.abs(enemyY - playerY) * window.innerHeight / 100;

        const distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
        if (distance <= enemy.stats.attackRange) { 
            damageDealToPlayer(enemy);

            if(abilityList["Reflect"].level > 0){
                damageDealToEnemy(enemy, true, false);
            }

            updateStatsDisplay();
        }
    }

    function attackNearestEnemy(fromX, fromY, excludeTarget, remainingBounce) {
        let nearestEnemy = null;
        const attackRange = stats.attackRange;
        let minDistance = attackRange;

        let enemiesClone = Object.assign([], enemies);

        if(excludeTarget != null){
            enemiesClone = enemiesClone.filter(x => x.id !== excludeTarget.id);
        }

        enemiesClone.forEach((enemy) => {
            const enemyX = parseFloat(enemy.element.style.left);
            const enemyY = parseFloat(enemy.element.style.top);
    
            let distanceX = Math.abs(fromX - enemyX) * window.innerWidth / 100 ;
            let distanceY = Math.abs(fromY - enemyY) * window.innerHeight / 100 ;

            const distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));

            if (distance <= attackRange && distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        });

        if (nearestEnemy) {
            if(excludeTarget == null) lastAttackTime = Date.now();
            fireBullet(fromX, fromY, nearestEnemy, excludeTarget, remainingBounce);
        }
    }

    function fireBullet(fromX, fromY, enemy, excludeTarget, remainingBounce) {
        const bullet = document.createElement('div');
        bullet.className = 'bullet-effect'; // Add animation class
        bullet.style.left = `${parseFloat(fromX)}vw`;
        bullet.style.top = `${parseFloat(fromY)}vh`;
        document.getElementById('game-container').appendChild(bullet);
        const bulletData = {
            element: bullet,
            remainingBounce: remainingBounce != null ? remainingBounce : abilityList["Bounce"].level,
            targetEnemy: enemy,
            excludeTarget: excludeTarget,
            moveAnimationId: null
        };
        
        bullets.push(bulletData);

        setTimeout(function() {
            bullet.remove();
            bullets.splice(bullets.indexOf(bulletData), 1); 
        }, 5000);

        moveBullet(bullets[bullets.length - 1], enemy);
    }

    window.selectStat = function(stat) {
        statLevel = statsList[stat].level + 1;
        if(stat == "Uprade Damage"){
            stats.physicalDamage += Math.floor(1 + originalStats.physicalDamage / 3 + statLevel / 2);
        }          
        else if (stat == "Uprade AoE"){
            stats.attackRange += 15;
        }
        else if (stat == "Uprade Attack Speed")
            stats.attackSpeed += 0.05 + originalStats.attackSpeed / 30;
        else if (stat == "Uprade HP (Recover 20% Life)"){
            stats.hp += Math.floor(5 + originalStats.hp / 100 * (statLevel) + statLevel * (Math.log(statLevel * 1.5 + 1)));
            stats.maxHp += Math.floor(5 + originalStats.hp / 100 * (statLevel) + statLevel * (Math.log(statLevel * 1.5 + 1)));
            stats.hp += Math.floor(stats.maxHp * 20 / 100);
        }
        else if (stat == "Uprade HP Regen"){
            stats.hpRegen += Math.floor(2 + statLevel * 2 + originalStats.hpRegen / 20);
        }
        else if (stat == "Uprade Armour"){
            stats.armour += Math.floor(1 + statLevel / 2 + originalStats.armour / 40);
        }
        else if (stat == "Uprade Crit Chance"){
            stats.critChance += 2.5;
        }
        else if (stat == "Uprade Crit Multiplier"){
            stats.critMultiplier += 12.5;
        }

        statsList[stat].level += 1;
        abilityChoices.style.display = 'none';
        abilityButtonWrapper.innerHTML = "";
        levelUpAfterChoosing();
        pauseOrResumeGame();
    };

    window.selectAbility = function(ability) {
        abilityLevel = abilityList[ability].level + 1;
        abilityList[ability].level += 1;
        abilityChoices.style.display = 'none';
        abilityButtonWrapper.innerHTML = "";
        levelUpAfterChoosing();
        pauseOrResumeGame();
    };

    function levelUpAfterChoosing(){
        levelUpPending = false;
        stats.level++;
        stats.physicalDamage += Math.floor(1 + stats.level / 3 + originalStats.physicalDamage / 5);
        stats.armour += Math.floor(1 + stats.level / 8 + originalStats.armour / 40);
        stats.hpRegen += Math.floor(1 + stats.level / 15 + originalStats.hpRegen / 20);
        stats.hp += Math.floor(5 + 1.5 * stats.level + originalStats.hp / 150);
        stats.maxHp += Math.floor(5 + 1.5 * stats.level + originalStats.maxHp / 150);
        stats.exp -= stats.expThreshold;
        stats.expThreshold = calculateExpThreshold();
        updateStatsDisplay();
        updatePlayerPosition();
    }

    function updateEnemyHealthBar(enemy) {
        const healthBar = enemy.element.querySelector('.enemy-health-bar-fill');
        if (healthBar) {
            const healthPercentage = (enemy.stats.hp / enemy.stats.maxHp) * 100;
            healthBar.style.width = `${healthPercentage}%`;
        }
    }

    function calculateExpThreshold() {
        return originalStats.expThreshold + Math.floor(originalStats.expThreshold * (stats.level) / 4 + originalStats.expThreshold * Math.pow(stats.level, 2) / 10);
    }

    function removeEnemy(enemy) {
        stats.exp += Math.floor(enemy.stats.exp * stats.expGain);
        updateStatsDisplay();
        if (stats.exp >= stats.expThreshold) {
            levelUp();
        }
        enemy.element.remove();
        enemies.splice(enemies.indexOf(enemy), 1);
    }

    function levelUp() {
        levelUpPending = true;
        showAbilityChoice();
        pauseOrResumeGame();
        pauseOverlay.style.display = 'none';
    }

    function getAbilities(list) {
        const abilitiesClone = JSON.parse(JSON.stringify(list));

        const abilitiesArray = Object.keys(abilitiesClone).filter(key => 
            abilitiesClone[key].level < abilitiesClone[key].maxLevel
        );

        return abilitiesArray;
    }

    function getRandomStats(list, num) {
        const availableStats = Object.keys(list).filter(key => 
            list[key].level < list[key].maxLevel
        );
        
        const statsClone = JSON.parse(JSON.stringify(availableStats));
        const shuffledStats = statsClone.sort(() => 0.5 - Math.random());
        const selectedStats = shuffledStats.slice(0, num);
    
        const orderedStats = selectedStats.sort((a, b) => {
            return availableStats.indexOf(a) - availableStats.indexOf(b);
        });
    
        return orderedStats;
    }

    function showAbilityChoice(){
        abilityChoices.style.display = 'flex';
        console.clear();
        if(abilityLevelThreshold.includes(stats.level)){
            let n = 1;
            let abilities = getAbilities(abilityList);
            let abilityText = "";
            console.log(abilities);
            abilities.forEach(element => {
                let i = 0;
                let description = abilityList[element].text.replace(/\?\?/g, (match, index) => {
                    const replacementIndex = abilityList[element].level + i * abilityList[element].maxLevel;
                    i++;
                    return (replacementIndex < abilityList[element].progression.length) ? abilityList[element].progression[replacementIndex] : "??";
                });

                abilityText += "<button class=\"ability-button button-keys\" onclick=\"selectAbility('" + element + "')\">" + n + ": " + description + " | Level: " + abilityList[element].level + "</button>";
                n++;
            });
            abilityButtonWrapper.innerHTML = abilityText;
        }
        else{
            let n = 1;
            let randomAbilities = getRandomStats(statsList, 4);
            let abilityText = "";
            console.log(randomAbilities);
            randomAbilities.forEach(element => {
                abilityText += "<button class=\"stats-button button-keys\" onclick=\"selectStat('" + element + "')\">" + n + ": " + element + " | Level: " + statsList[element].level + "</button>";
                n++;
            });
            abilityButtonWrapper.innerHTML = abilityText;
        }
    }

    function initVariable(){
        enemies.length = 0;
        bullets.length = 0;
        originalEnemyStats = JSON.parse(JSON.stringify(enemyStats));
        originalStatsList = JSON.parse(JSON.stringify(statsList));
        originalAbilityList = JSON.parse(JSON.stringify(abilityList));

        for(var i = 0; i < 25; i++){
            abilityLevelThreshold.push(9 + 10 * i);
        }
    }

    function restartGame() {
        cancelAnimationFrame(gameLoopId);
        gamePaused = false;
        gameOver = false;
        enemyStats = JSON.parse(JSON.stringify(originalEnemyStats));
        statsList = JSON.parse(JSON.stringify(originalStatsList));
        abilityList = JSON.parse(JSON.stringify(originalAbilityList));
        enemies.forEach(enemy => {
            enemy.element.remove();
        });
        enemies.length = 0;
        bullets.forEach(bullet => {
            bullet.element.remove();
        });
        bullets.length = 0;
        lastAttackTime = 0;
        timerStart = Date.now();
        healthRegenTime = Date.now();
        normalSpawnTime = Date.now();
        rareEnemySpawnTime = Date.now();
        eliteSpawnTime = Date.now();
        bossSpawnTime = Date.now();
        attackSpeedBuffTime = Date.now();
        elapsedSeconds = 0;
        currentDifficultyLevel = 0;
        levelUpPending = false;
        showCharacterSelection();
    }

    function pauseOrResumeGame(){
        gamePaused = !gamePaused;
        pauseOverlay.style.display = gamePaused ? 'flex' : 'none';
        gameContainer.style.filter = gamePaused ? 'grayscale(100%)' : 'none';
        if (!gamePaused) {
            let elapsedTime = Date.now() - pauseTime;
            lastAttackTime += elapsedTime;
            timerStart += elapsedTime;
            bossSpawnTime += elapsedTime;
            eliteSpawnTime += elapsedTime;
            rareEnemySpawnTime += elapsedTime;
            normalSpawnTime += elapsedTime;
            attackSpeedBuffTime += elapsedTime;
            healthRegenTime += elapsedTime;
            enemies.forEach(enemy => {
                enemyAttackCooldown[enemy.element.id] += elapsedTime;
                enemy.spawnTime += elapsedTime;
                moveEnemy(enemy); 
            });
            bullets.forEach(bullet => {
                moveBullet(bullet, bullet.targetEnemy);
            });
            gameLoop();
        }
        else{
            pauseTime = Date.now();
            cancelAnimationFrame(gameLoopId);
            enemies.forEach(enemy => {
                if (enemy.moveAnimationId) {
                    cancelAnimationFrame(enemy.moveAnimationId);
                }
            });
            bullets.forEach(bullet => {
                if (bullet.moveAnimationId) {
                    cancelAnimationFrame(bullet.moveAnimationId);
                }
            });
        }
    }

    document.addEventListener('keydown', (event) => {
        if (gameOver && !gamePaused) {
            restartGame();
        }
        else if (event.key === 'Escape' && !characterSelection) {
            if (levelUpPending) return;
            pauseOrResumeGame();
        }
        else if (event.key >= '1' && event.key <= '9') {
            const buttonIndex = parseInt(event.key) - 1;
            if(characterSelection){
                let buttons = charaterListDisplay.querySelectorAll('.character-button');

                if (buttonIndex < buttons.length) {
                    const selectedButton = buttons[buttonIndex]; 
                    selectedButton.click();
                }
            }
            else{
                let buttons = abilityButtonWrapper.querySelectorAll('.button-keys');

                if (buttonIndex < buttons.length) {
                    const selectedButton = buttons[buttonIndex]; 
                    selectedButton.click();
                }
            }
        }
    });

    document.addEventListener('click', (event) => {
        if (gameOver && !gamePaused) { // Restart game on any key press when game is over
            restartGame();
        }
    });
      
    window.addEventListener('blur', function() {
        //if(!gameOver && !gamePaused && !characterSelection) pauseOrResumeGame();
    });
});