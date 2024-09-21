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
    const critChanceDisplay = document.getElementById('crit-chance');
    const critMultiplierDisplay = document.getElementById('crit-multiplier');
    const pauseOverlay = document.getElementById('pause-overlay');
    const gameOverOverlay = document.getElementById('game-over-overlay');
    const gameContainer = document.getElementById('game-container');

    window.requestAnimationFrame =
           window.requestAnimationFrame ||
           window.mozRequestAnimationFrame ||
           window.webkitRequestAnimationFrame ||
           window.msRequestAnimationFrame;

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
    let normalSpawnInterval = 1000 * 60 / 100;
    let rareEnemySpawnTime = Date.now();
    let rareEnemySpawnInterval = 1000 * 60 / 20;
    let eliteSpawnTime = Date.now();
    let eliteSpawnIntervalTime = 1000 * 60 / 3;
    let bossSpawnTime = Date.now();
    let bossSpawnIntervalTime = 1000 * 60 / 1;
    let nextEnemyId = 0;

    let originalStats = {};
    let stats = {
        hp: 500,
        maxHp: 500,
        mana: 50,
        physicalDamage: 10,
        attackSpeed: 2,
        attackRange: 250, 
        critChance: 5.0,
        critMultiplier: 150,
        armour: 0,
        hpRegen: 1,
        manaRegen: 1,
        level: 1,
        exp: 0,
        expThreshold: 8,
        abilityList: {},
    };

    let originalEnemyStats = {};
    let enemyStats = {
        hp: 10,
        maxHp: 10,
        physicalDamage: 2,
        attackSpeed: 1.25,
        attackRange: 50, 
        armour: 0,
        hpRegen: 0.5,
        moveSpeed: 1,
        exp: 2
    };

    let originalStatsList = {};
    let statsList = {
        "Uprade Damage": {level: 0, maxLevel: 1000},
        "Uprade AoE": {level: 0, maxLevel: 25},
        "Uprade Attack Speed": {level: 0, maxLevel: 50},
        "Uprade HP": {level: 0, maxLevel: 1000},
        "Uprade HP Regen": {level: 0, maxLevel: 1000},
        "Uprade Armour": {level: 0, maxLevel: 1000},
        "Uprade Crit Chance": {level: 0, maxLevel: 40},
        "Uprade Crit Multiplier": {level: 0, maxLevel: 100}
    };

    let originalAbilityList = {};
    let abilityList = {
        "Reflect": {text: "Return ??%(50%) damage to the enemy", progression: ["10", "20", "30", "40", "50"], level: 0, maxLevel: 5},
        "Bounce": {text: "You deal ??%(10%) less damage, Projectile bounce ??(5) additional time", progression: ["50", "40", "30", "20", "10", "1", "2", "3", "4", "5"], level: 0, maxLevel: 5},
        //"Attack Speed Buff": {text: "Grant additional ??%(50%) attack speed for 5 seconds, cooldown 10 seconds", progression: ["10", "20", "30", "40", "50"], level: 0, maxLevel: 5},
        //"Damage Buff": {text: "Grant additional ??%(50%) damage for 5 seconds, cooldown 10 seconds", progression: ["10", "20", "30", "40", "50"], level: 0, maxLevel: 5},
        "Damage Reduction": {text: "Grant ??%(50%) damage reduction", progression: ["10", "20", "30", "40", "50"], level: 0, maxLevel: 5},
        "Lifesteal": {text: "Grant ??%(50%) lifesteal", progression: ["10", "20", "30", "40", "50"], level: 0, maxLevel: 5},
        //"Immune Damage": {text: "Immune to damage for ??(5) seconds, cooldown ??(10) seconds", progression: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"], level: 0, maxLevel: 5},
    };

    let abilityLevelThreshold = [];

    const enemies = [];
    const bullets = [];

    init();

    function init(){
        initVariable();
        createPlayerAttackRange();
        updatePlayerPosition();
        gameLoop();
    };

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
                enemyY = -4;
                break;
            case 1:
                enemyX = 100;
                enemyY = Math.random()  * 100;
                break;
            case 2:
                enemyX = Math.random()  * 100;
                enemyY = 100;
                break;
            case 3:
                enemyX = -4;
                enemyY = Math.random()  * 100;
                break;
        }

        const spawnTime = Date.now();
        const enemy = document.createElement('div');
        enemy.id = `enemy-${nextEnemyId++}`; // Assign a unique ID to the enemy
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
        enemyStatsCopy.hp = enemyStats.hp + enemyStats.hp * (currentDifficultyLevel) / 2 + enemyStats.hp * Math.pow(currentDifficultyLevel, 1.2) / 5;
        enemyStatsCopy.physicalDamage = enemyStats.physicalDamage + enemyStats.physicalDamage * (currentDifficultyLevel) / 3 + enemyStats.physicalDamage * Math.pow(currentDifficultyLevel, 1.1) / 10;
        enemyStatsCopy.exp = enemyStats.exp + enemyStats.exp * (currentDifficultyLevel) / 5 + enemyStats.exp * Math.pow(currentDifficultyLevel, 1.5) / 5;
        if(rarity == "boss"){
            enemy.className = 'boss';
            enemyStatsCopy.hp = enemyStatsCopy.hp * 10;
            enemyStatsCopy.physicalDamage = enemyStatsCopy.physicalDamage * 1.5 * (Math.log(currentDifficultyLevel + 3));
            enemyStatsCopy.exp = enemyStatsCopy.exp * 10;
        }
        else if(rarity == "elite"){
            enemy.className = 'elite';
            enemyStatsCopy.hp = enemyStatsCopy.hp * 4;
            enemyStatsCopy.physicalDamage = enemyStatsCopy.physicalDamage * 1.2 * (Math.log(currentDifficultyLevel + 3));
            enemyStatsCopy.exp = enemyStatsCopy.exp * 4;
        }
        else if(rarity == "rareEnemy"){
            enemy.className = 'rare-enemy';
            enemyStatsCopy.hp = enemyStatsCopy.hp * 2;
            enemyStatsCopy.physicalDamage = enemyStatsCopy.physicalDamage * 1.1 * (Math.log(currentDifficultyLevel + 3));
            enemyStatsCopy.exp = enemyStatsCopy.exp * 2;
        }
        else {
            enemy.className = 'enemy';
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
            moveAnimationId: null // Store animation ID
        });

        enemyAttackCooldown[enemy.id] = 0; // Initialize attack cooldown for the enemy

        // Start moving the enemy
        moveEnemy(enemies[enemies.length - 1]);
    }

    function moveEnemy(enemy) {
        // Initialize enemy position
        let enemyX = parseFloat(enemy.element.style.left);
        let enemyY = parseFloat(enemy.element.style.top);

        // Calculate the player's center
        const targetX = parseFloat(player.style.left);
        const targetY = parseFloat(player.style.top);

        const animate = () => {
            if (gamePaused || gameOver) return; 

            const angle = Math.atan2(targetY - enemyY, targetX - enemyX);

            const distanceX = Math.abs(enemyX - targetX) * window.innerWidth / 100;
            const distanceY = Math.abs(enemyY - targetY) * window.innerHeight / 100;

            const distanceToPlayer = Math.hypot(distanceX, distanceY);

            if (distanceToPlayer > enemy.stats.attackRange) {
                const velocityX = Math.cos(angle) * (enemy.stats.moveSpeed / 10 * window.innerWidth / 100);
                const velocityY = Math.sin(angle) * (enemy.stats.moveSpeed / 10 * window.innerHeight / 100);

                // Update the enemy's center position
                enemyX += velocityX * 100 / window.innerWidth;
                enemyY += velocityY * 100 / window.innerHeight;

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

        const bulletSpeed = 5;
        const animate = () => {
            if (gamePaused || gameOver) return;

            const velocityX = Math.cos(angle) * (bulletSpeed / 10 * window.innerWidth / 100);
            const velocityY = Math.sin(angle) * (bulletSpeed / 10 * window.innerHeight / 100);

            bulletX += velocityX * 100 / window.innerWidth;
            bulletY += velocityY * 100 / window.innerHeight;

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
                damageDealToEnemy(hitEnemy, false);

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
        let damage = 0;
        damage = enemy.stats.physicalDamage - stats.armour;

        damageReductionLevel = abilityList["Damage Reduction"].level;
        damage = Math.floor(damageReductionLevel > 0 ? damage * damageReductionLevel * 10 / 100 : damage);

        if(stats.armour >= enemy.stats.physicalDamage * 3){
            damage = Math.max(0, damage);
        }
        else
        {
            damage = Math.max(1, damage);
        }

        stats.hp -= damage;
    }

    function damageDealToEnemy(hitEnemy, isReflect){
        let isCriticalHit = Math.random() < stats.critChance / 100; // critChance should be between 0 and 1

        let damage = stats.physicalDamage - hitEnemy.stats.armour;

        if (isCriticalHit) {
            damage *= stats.critMultiplier / 100; 
        }

        damage = Math.floor(isReflect ? abilityList["Reflect"].level * 10 / 100 * damage : damage);
        damage = Math.floor(abilityList["Bounce"].level > 0 ? (50 + 10 * (abilityList["Bounce"].level - 1)) / 100 * damage : damage);
        damage = Math.floor(Math.max(1, damage));

        hitEnemy.stats.hp -= damage;
        
        showDamageFeedback(hitEnemy, damage, isCriticalHit);
        updateEnemyHealthBar(hitEnemy);

        if (hitEnemy.stats.hp <= 0) {
            removeEnemy(hitEnemy);
        }

        if(!isReflect){
            lifestealLevel = abilityList["Lifesteal"].level;
            if(lifestealLevel > 0){
                stats.hp += Math.floor(damage * lifestealLevel * 10 / 100);
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
            
            if (currentTime - timerStart >= 1000) {
                elapsedSeconds = Math.floor((currentTime - timerStart) / 1000);
                const minutes = Math.floor(elapsedSeconds / 60);
                const seconds = elapsedSeconds % 60;
                timerDisplay.textContent = `Time: ${minutes}:${seconds.toString().padStart(2, '0')}`;
                currentDifficultyLevel = Math.floor(elapsedSeconds / (difficultyIntervalTime / 1000));
                if(previousDifficultyLevel != currentDifficultyLevel){
                    previousDifficultyLevel = currentDifficultyLevel;
                    normalSpawnInterval = 1000 * 60 / (100 + 3 * currentDifficultyLevel);
                    rareEnemySpawnInterval = 1000 * 60 / (20 + currentDifficultyLevel);
                    eliteSpawnIntervalTime = 1000 * 60 / (3 + currentDifficultyLevel / 3);
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

            // Regen logic
            if (currentTime - healthRegenTime >= healthRegenInterval) {
                healthRegenTime = currentTime;
                stats.hp += stats.hpRegen;
            }

            updateStatsDisplay();
        }

        gameLoopId = requestAnimationFrame(gameLoop);
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
                damageDealToEnemy(enemy, true);
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

        console.log(excludeTarget);

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
            stats.physicalDamage += Math.floor(1 + originalStats.physicalDamage / 5 + statLevel / 2);
        }          
        else if (stat == "Uprade AoE"){
            stats.attackRange += 20;
        }
        else if (stat == "Uprade Attack Speed")
            stats.attackSpeed += 0.1;
        else if (stat == "Uprade HP"){
            stats.hp += Math.floor(originalStats.hp / 25 * (statLevel) / 5 + originalStats.hp / 25 * Math.pow(statLevel, 1.1) / 10);
            stats.maxHp += Math.floor(originalStats.hp / 25 * (statLevel) / 5 + originalStats.hp / 25 * Math.pow(statLevel, 1.1) / 10);
        }
        else if (stat == "Uprade HP Regen"){
            stats.hpRegen += 4 + statLevel;
        }
        else if (stat == "Uprade Armour"){
            stats.armour += Math.floor(1 + (statLevel) / 2 + Math.pow(statLevel, 1.1) / 5);
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
        stats.physicalDamage += Math.floor(2 + stats.level / 4);
        stats.armour += 1;
        stats.hpRegen += 1;
        stats.hp += Math.floor(10 + stats.level);
        stats.maxHp += Math.floor(10 + stats.level);
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
        return originalStats.expThreshold + Math.floor(originalStats.expThreshold * (stats.level) / 5 + originalStats.expThreshold * Math.pow(stats.level, 2) / 10);
    }

    function removeEnemy(enemy) {
        stats.exp += enemy.stats.exp;
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

    function getAbilities(abilityList) {
        const abilitiesClone = Object.assign([], abilityList);

        const abilitiesArray = Object.keys(abilitiesClone).filter(key => 
            abilitiesClone[key].level < abilitiesClone[key].maxLevel
        );

        return abilitiesArray;
    }

    function getRandomStats(statsList, num) {
        const availableStats = Object.keys(statsList).filter(key => 
            statsList[key].level < statsList[key].maxLevel
        );
        
        const statsClone = Object.assign([], availableStats);
        const shuffledStats = statsClone.sort(() => 0.5 - Math.random());
        const selectedStats = shuffledStats.slice(0, num);
    
        const orderedStats = selectedStats.sort((a, b) => {
            return availableStats.indexOf(a) - availableStats.indexOf(b);
        });
    
        return orderedStats;
    }

    function showAbilityChoice(){
        abilityChoices.style.display = 'flex';
        if(abilityLevelThreshold.includes(stats.level)){
            let n = 1;
            let abilities = getAbilities(abilityList);
            let abilityText = "";
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
            let randomAbilities = getRandomStats(statsList, 3);
            let abilityText = "";
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
        originalStats = Object.assign([], stats);
        originalEnemyStats = Object.assign([], enemyStats);
        originalStatsList = Object.assign([], statsList);
        originalAbilityList = Object.assign([], abilityList);

        for(var i = 0; i < 20; i++){
            abilityLevelThreshold.push(9 + 10 * i);
        }
    }

    function restartGame() {
        cancelAnimationFrame(gameLoopId);
        gamePaused = false;
        gameOver = false;
        stats = Object.assign([], originalStats);
        enemyStats = Object.assign([], originalEnemyStats);
        statsList = Object.assign([], originalStatsList);
        abilityList = Object.assign([], originalAbilityList);
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
        elapsedSeconds = 0;
        currentDifficultyLevel = 0;
        levelUpPending = false;
        updateStatsDisplay();
        gameOverOverlay.style.display = 'none'; // Hide game over overlay
        gameLoop();
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
            healthRegenTime += elapsedTime;
            enemies.forEach(enemy => {
                enemyAttackCooldown[enemy.element.id] += elapsedTime;
                enemy.spawnTime += elapsedTime;
                moveEnemy(enemy); 
            });
            bullets.forEach(bullet => {
                moveBullet(bullet, bullet.targetEnemy);
            });
            gameLoop(); // Restart the game loop if unpaused
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

    var Timer = function(callback, delay) {
        var timerId, start, remaining = delay;
    
        this.pause = function() {
            window.clearTimeout(timerId);
            timerId = null;
            remaining -= Date.now() - start;
        };
    
        this.resume = function() {
            if (timerId) {
                return;
            }
    
            start = Date.now();
            timerId = window.setTimeout(callback, remaining);
        };
    
        this.resume();
    };

    function uuidv4() {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
          (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
        );
      }

    document.addEventListener('keydown', (event) => {
        if (gameOver && !gamePaused) { // Restart game on any key press when game is over
            restartGame();
        }
        else if (event.key === 'Escape') { // Change pause key to ESC
            if (levelUpPending) return;
            pauseOrResumeGame();
        }
        else if (event.key >= '1' && event.key <= '9') {
            const buttonIndex = parseInt(event.key) - 1;

            const buttons = abilityButtonWrapper.querySelectorAll('.button-keys');

            if (buttonIndex < buttons.length) {
                const selectedButton = buttons[buttonIndex]; 
                selectedButton.click();
            }
        }
    });
      
    window.addEventListener('blur', function() {
        if(!gameOver && !gamePaused) pauseOrResumeGame();
    });
});
