function enterBossBattle() {
    if (inBossDungeon) {
        exitBossDungeon();
        return;
    }
    if (userData.hp <= 0) {
        alert("체력이 부족합니다.");
        return;
    }
    inBossDungeon = true;
    document.getElementById(
            "fightBossBtn").innerText =
        "보스 전투 중지";
    log("⚔️ 보스와의 전투가 시작됩니다!");
    // 보스 스탯 계산 (스테이지 기반)
    let bossStage =
    currentBossStage; // 보스 스테이지도 currentStage 기준 사용
    let bossHp = Math.floor((bossStage /
        5 + 2) * bossStage * 10);
    let bossCrit = bossStage * 2;
    let bossHit = bossStage * 10;
    let bossDef = (bossStage / 15 +
        1.2) * bossStage;
    let bossAtk = Math.floor((
            bossStage / 3 + 2) *
        bossStage);
    let bossReward = bossStage * 2;
    const evasionRatePlayer = userData
        .totalDex / (userData.totalDex +
            bossHit);
    const bossEvasion = bossStage * 1.5;
    const evasionRateBoss =
        bossEvasion / (bossEvasion +
            userData.totalDex * 5 +
            userData.totalStr * 5 + 1);
    bossdungeonInterval = setInterval(
        async () => {
            if (
                isProcessingBossTick)
                return; // 이미 처리 중이면 skip
            isProcessingBossTick
                = true;
            try {
                if (Math
                    .random() <
                    evasionRatePlayer
                    ) {
                    log(
                    "플레이어가 보스 공격을 회피했습니다.");
                } else {
                    let isCrit =
                        Math
                        .random() *
                        100 <
                        bossCrit;
                    let playerDef =
                        userData
                        .totalCon;
                    let dmgReduction =
                        1 - (
                            playerDef /
                            (userData
                                .level *
                                2 +
                                playerDef
                                )
                            );
                    let dmg =
                        bossAtk;
                    if (
                        isCrit) {
                        dmg =
                            Math
                            .floor(
                                bossAtk *
                                (bossCrit /
                                    2000 +
                                    1.1
                                    )
                                );
                        dmg =
                            Math
                            .floor(
                                dmg *
                                dmgReduction
                                );
                        dmg =
                            applyRandomVariance(
                                dmg
                                );
                        dmg =
                            Math
                            .max(
                                1,
                                dmg
                                );
                        userData
                            .hp -=
                            dmg;
                        log(
                        `💥 보스의 치명타! 플레이어가 ${dmg} 피해를 받았습니다.`);
                    } else {
                        dmg =
                            Math
                            .floor(
                                dmg *
                                dmgReduction
                                );
                        dmg =
                            applyRandomVariance(
                                dmg
                                );
                        dmg =
                            Math
                            .max(
                                1,
                                dmg
                                );
                        userData
                            .hp -=
                            dmg;
                        log(
                        `플레이어가 ${dmg} 피해를 받았습니다.`);
                    }
                }
                if (Math
                    .random() <
                    evasionRateBoss
                    ) {
                    log(
                    "보스가 플레이어 공격을 회피했습니다.");
                } else {
                    const
                        playerAtk =
                        1 + ((userData
                                .level /
                                2
                                ) +
                            1) *
                        userData
                        .totalStr *
                        1.5;
                    const
                        critStat =
                        userData
                        .totalDex *
                        5;
                    const
                        critChance =
                        critStat /
                        (critStat +
                            150
                            );
                    let isCrit =
                        Math
                        .random() <
                        critChance;
                    let dmgReductionPlayer =
                        1 - (
                            bossDef /
                            (userData
                                .level *
                                2 +
                                bossDef
                                )
                            );
                    let dmg;
                    if (
                        isCrit) {
                        const
                            critDamage =
                            playerAtk *
                            (critStat /
                                2000 +
                                1.1
                                );
                        dmg =
                            Math
                            .floor(
                                critDamage *
                                dmgReductionPlayer
                                );
                        dmg =
                            applyRandomVariance(
                                dmg
                                );
                        dmg =
                            Math
                            .max(
                                1,
                                dmg
                                );
                        bossHp
                            -=
                            dmg;
                        log(
                        `🎯 치명타! 보스가 ${dmg} 피해를 입었습니다.`);
                    } else {
                        dmg =
                            Math
                            .floor(
                                playerAtk *
                                dmgReductionPlayer
                                );
                        dmg =
                            applyRandomVariance(
                                dmg
                                );
                        dmg =
                            Math
                            .max(
                                1,
                                dmg
                                );
                        bossHp
                            -=
                            dmg;
                        log(
                        `보스가 ${dmg} 피해를 입었습니다.`);
                    }
                }
                log(
                `🧟&zwj;♂️ 보스 남은 체력: ${Math.max(0, bossHp)}`);
                // 보스 처치
                if (bossHp <=
                    0) {
                    userData
                        .gold +=
                        bossReward *
                        50;
                    userData
                        .exp +=
                        bossReward *
                        30;
                    log(
                    `🏆 보스를 처치했습니다! 골드 +${bossReward * 50}, 경험치 +${bossReward * 30}`);
                    // 서버에 보스 처치 사실 알리고 아이템 드랍 처리 요청
                    bossdungeonInterval
                        &&
                        clearInterval(
                            bossdungeonInterval
                            );
                    inBossDungeon
                        = false;
                    try {
                        const
                            firebaseToken =
                            await firebase
                            .auth()
                            .currentUser
                            .getIdToken();
                        const
                            result =
                            await reportBossDefeat(
                                bossStage,
                                firebaseToken
                                );
                        if (result
                            .success &&
                            result
                            .droppedItem
                            ) {
                            userData
                                .inventory
                                .push(
                                    result
                                    .droppedItem
                                    );
                            log(
                            `🎁 보스 전리품 획득: ${result.droppedItem.item_name}`);
                            document
                                .getElementById(
                                    'bossFightResult'
                                    )
                                .innerHTML =
                                `🎁 보스 전리품 획득: ${result.droppedItem.item_name}`
                        } else {
                            log(
                            `⚠️ 보스 전리품 획득 실패: ${result.message || '아이템이 드랍되지 않았습니다.'}`);
                            document
                                .getElementById(
                                    'bossFightResult'
                                    )
                                .innerHTML =
                                "⚠️ 보스 전리품 획득 실패";
                        }
                        saveData
                            ();
                        updateUI
                            ();
                    } catch (
                        error) {
                        console
                            .error(
                                error
                                );
                        document
                            .getElementById(
                                'bossFightResult'
                                )
                            .innerHTML =
                            '서버 통신 실패';
                    }
                    enterBossBattle
                        (); // 자동전투 중지
                    checkLevelUp
                        ();
                }
                populateEnhanceList
                    (userData
                        .inventory
                        );
                autoUsePotion();
                updateUI();
                saveData();
                // 플레이어 사망
                if (userData
                    .hp <= 0) {
                    stopBossBattle
                        ();
                    log(
                    "💀 보스에게 패배했습니다. 체력이 100%회복되고 보유 경험치의 30%를 잃습니다.");
                    userData
                        .exp =
                        Math
                        .floor(
                            userData
                            .exp *
                            0.7
                            );
                    userData
                        .hp =
                        userData
                        .maxHp;
                    updateUI();
                    saveData();
                    showTab(
                        "home");
                    alert(
                        "보스에게 패배했습니다. 체력이 100%회복되고 보유 경험치의 30%를 잃습니다.");
                }
            } catch (error) {
                console.error(
                    error);
            } finally {
                isProcessingBossTick
                    = false;
            }
        }, 1);
}

function populateEnhanceList(inventory) {
    const select = document.getElementById("itemSelect");
    const prevSelectedId = select.value;
    const prevSelectedIndex = select.selectedIndex;

    select.innerHTML = "";

    const options = [];

    inventory.forEach(item => {
        if (item.equipped) return; // 장착된 아이템은 제외

        const enhLevel = item.enhancement_level || 0;
        const baseName = item.item_name.replace(/(\d+강\s*)?/, "");
        const displayName = enhLevel > 0 ? `${enhLevel}강 ${baseName}` : baseName;

        const option = document.createElement("option");
        option.value = item.id;
        option.textContent = displayName;
        options.push(option);
        select.appendChild(option);
    });

    // 우선순위 1: 기존 선택된 ID가 여전히 있다면 그것을 선택
    if (options.some(opt => opt.value === prevSelectedId)) {
        select.value = prevSelectedId;
    }
    // 우선순위 2: 기존 선택 인덱스가 유효하면 해당 인덱스 선택
    else if (prevSelectedIndex >= 0 && prevSelectedIndex < options.length) {
        select.selectedIndex = prevSelectedIndex;
    }
    // 우선순위 3: 그 외에는 첫 번째 항목 선택
    else if (options.length > 0) {
        select.selectedIndex = 0;
    }

    updateEnhanceChance();
}

async function enhanceItem() {
    const itemId = document
        .getElementById(
            "itemSelect").value;
    if (!itemId) {
        alert("강화할 아이템을 선택하세요.");
        return;
    }
    if (!window.idToken) {
        alert(
            "로그인 상태가 아닙니다. 다시 로그인하세요.");
        return;
    }
    try {
        const res = await fetch(
            "https://autorpg.onrender.com/api/enhance", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " +
                        window
                        .idToken
                },
                body: JSON
                    .stringify({
                        uid: userData
                            .uid,
                        id: itemId
                    }),
            });
        const result = await res
            .json();
        // 성공/실패 모두 최신 유저 데이터 불러오기
        const resUser = await fetch(
            'https://autorpg.onrender.com/api/userdata', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' +
                        window
                        .idToken,
                },
                body: JSON
                    .stringify({
                        uid: userData
                            .uid
                    }),
            });
        if (!resUser.ok)
        throw new Error(
                '유저 데이터 불러오기 실패'
                );
        const dataUser =
            await resUser.json();
        userData = dataUser.user;
        userData.uid = userData.uid;
        userData.inventory =
            dataUser
        .inventory || [];
        updateUI();
        populateEnhanceList(userData
            .inventory);
        saveData();
    } catch (err) {
        console.error("강화 실패:",
        err);
        alert("강화 중 오류가 발생했습니다.");
    }
}
alert("Welcome To Advanced-AutoRPG v1");
