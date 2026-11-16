# model-laya-testing

Laya 決策測試樣本: 兩個相同的角色 (100 hp) 對戰, 各自由一種模式決定每回合用哪個技能.

| 技能 | 效果 | 冷卻 (自己的回合數) |
| --- | --- | --- |
| attack | 造成 18 傷害 | 1 |
| defense | 擋下對手下一擊的 70% | 3 |
| heal | 回復 35 hp | 5 |

| 模式 | 決策方式 |
| --- | --- |
| laya | 與 lookahead 相同的結果計算, 但對手各回應的機率由 laya 估計 (`POST /v1/systemone`, 每個技能一題是非題, 依對手的健康狀態文字描述作答) |
| sequence | 依固定順序循環 (`--sequence`), 下一個技能冷卻中就等待 |
| roundrobin | attack → defense → heal 輪流, 跳過冷卻中的技能 |
| lookahead | 對每個可用技能模擬「我出招後, 對手各種可用回應」的結果, 選期望血量差 (我方 - 對手) 最高的; 對手的可用回應視為等機率, 冷卻中的技能雙方都排除 |

```bash
npm start                              # 互動選擇兩個模式後開打
npm start -- -a laya -b roundrobin     # 直接指定
```

畫面固定在同一位置重繪: 雙方各有 HP 條與三個技能的冷卻條, 每回合停留 0.3 秒.
需要 Node 24 以上 (直接執行 TypeScript, 沒有相依套件).

laya 模式需要 laya server (預設 `http://localhost:8503`, 用 `--laya-url` 覆寫).
