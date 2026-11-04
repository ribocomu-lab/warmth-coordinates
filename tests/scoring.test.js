/**
 * 온도의 좌표 — 3종 시나리오 균형, 심층 분석 리포트, 말투 반응 분기, 채점·동점 검증 테스트
 * 실행: node tests/scoring.test.js
 */
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const scriptData = require("../assets/js/script.js");
const scoring = require("../assets/js/scoring.js");

const {
  SCENARIO_LIST,
  SCENARIOS,
  COMFORT_TYPES,
  TYPE_ORDER,
  QUADRANTS,
  TURNS
} = scriptData;

const {
  COMFORT_TURN_IDS,
  withKoreanParticle,
  detectCrisisSignal,
  classifyComfortText,
  evaluateTurnInput,
  getClarificationTargets,
  classifyT6Response,
  selectFriendReaction,
  createRevisionTracker,
  selectReturnedSentence,
  scoreConversation
} = scoring;

function runTests() {
  // 1. 3개 상황 팩 모두에 대해 8턴 구조 및 6유형 2회 균등 노출 검증
  assert.equal(SCENARIO_LIST.length, 3, "상황 팩은 3종이어야 합니다.");
  SCENARIO_LIST.forEach((scen) => {
    const turns = SCENARIOS[scen.id];
    assert.ok(Array.isArray(turns), `${scen.id} 시나리오가 존재해야 합니다.`);
    assert.equal(turns.length, 8, `${scen.id} 대화는 T0~T7 총 8턴이어야 합니다.`);
    assert.equal(turns[0].time, "02:13");
    assert.equal(turns[7].time, "02:41");

    const exposureCounts = {};
    TYPE_ORDER.forEach((code) => {
      exposureCounts[code] = 0;
    });

    turns
      .filter((t) => COMFORT_TURN_IDS.includes(t.id))
      .forEach((turn) => {
        assert.equal(turn.options.length, 3, `${scen.id}:${turn.id} 보기는 3개여야 합니다.`);
        turn.options.forEach((opt) => {
          assert.ok(COMFORT_TYPES[opt.type]);
          exposureCounts[opt.type] += 1;
        });
      });

    TYPE_ORDER.forEach((code) => {
      assert.equal(
        exposureCounts[code],
        2,
        `${scen.id} 시나리오의 ${code} 노출 횟수가 정확히 2회여야 합니다.`
      );
    });

    const t6 = turns.find((t) => t.id === "T6");
    t6.options.forEach((opt) => {
      assert.notEqual(opt.receivingType, "open", `${scen.id}:T6 기본 보기에 open이 없어야 합니다.`);
    });
  });

  // 2. 심층 유형 데이터 및 안전 표현 기준 검증
  TYPE_ORDER.forEach((code) => {
    const t = COMFORT_TYPES[code];
    assert.ok(t.strengthInRelation && t.blindSpotForSelf && t.burnoutTrigger);
    const combined = `${t.summary} ${t.detail} ${t.strengthInRelation} ${t.blindSpotForSelf} ${t.burnoutTrigger}`;
    assert.ok(!combined.includes("당신은 "), `${code} 문구에 단정적 진단 표현이 없어야 합니다.`);
    assert.ok(!combined.includes("결핍"), `${code} 문구에 결핍 판정 표현이 없어야 합니다.`);
  });

  Object.values(QUADRANTS).forEach((q) => {
    assert.ok(Array.isArray(q.careTips) && q.careTips.length >= 2);
    assert.ok(q.asymmetryNote);
  });

  // 3. 키워드 분류기 검증
  assert.equal(classifyComfortText("너 그동안 진짜 잘 버텼어").type, "recognition");
  assert.equal(classifyComfortText("아무 생각 말고 푹 쉬어").type, "rest");
  assert.equal(classifyComfortText("실수해도 괜찮아 있는 그대로의 네가 좋아").type, "acceptance");
  assert.equal(classifyComfortText("내가 옆에 있을게 언제든 톡해").type, "companionship");
  assert.equal(classifyComfortText("오늘 하루 얼마나 힘들었어 속상했겠다").type, "empathy");
  assert.equal(classifyComfortText("원인부터 정리해서 수습 방법을 찾아보자").type, "solution");

  const ambiguous = classifyComfortText("그동안 잘 버텼어, 이제 푹 쉬어");
  assert.equal(ambiguous.status, "ambiguous");
  assert.equal(ambiguous.type, null);

  const unclassified = classifyComfortText("내일 점심에 마라탕 먹으러 가자");
  assert.equal(unclassified.status, "unclassified");

  // 4. 내 말투·길이에 맞춘 친구 리액션 분기 검증
  const t1Turn = SCENARIOS.campus_job[1];
  const laughRec = evaluateTurnInput({ turnId: "T0", text: "왜 안 자냐 ㅋㅋㅋ" });
  const laughReply = selectFriendReaction({
    turn: SCENARIOS.campus_job[0],
    record: laughRec,
    turnIndex: 0
  });
  assert.ok(laughReply.includes("ㅋ"), "웃음 표지 답장에는 친구도 웃음 톤으로 반응해야 합니다.");

  const tearRec = evaluateTurnInput({ turnId: "T0", text: "헐 어떡해 ㅠㅠㅠ" });
  const tearReply = selectFriendReaction({
    turn: SCENARIOS.campus_job[0],
    record: tearRec,
    turnIndex: 0
  });
  assert.ok(tearReply.includes("ㅠ"), "눈물 표지 답장에는 친구도 감정에 반응해야 합니다.");

  const longRec = evaluateTurnInput({
    turnId: "T1",
    text: "오늘 하루도 책상 앞에서 버티느라 너무 고생 많았어 아무 생각 말고 이불 덮고 편하게 쉬어"
  });
  const longReply = selectFriendReaction({
    turn: t1Turn,
    record: longRec,
    turnIndex: 1
  });
  assert.ok(longReply.length > 10);

  // 5. 분류 실패 추출(최대 2개, T7 우선) 및 0점 폴백 검증
  const rawUnclassifiedTurns = [
    evaluateTurnInput({ turnId: "T1", text: "내일 맛있는 거 먹자" }),
    evaluateTurnInput({ turnId: "T2", text: "이불 꼭 덮고 있어" }),
    evaluateTurnInput({ turnId: "T5", text: "물 한 잔 마셔" }),
    evaluateTurnInput({ turnId: "T7", text: "좋은 꿈 꿔 안녕" })
  ];
  const clarifyTargets = getClarificationTargets(rawUnclassifiedTurns, 2);
  assert.equal(clarifyTargets.length, 2);
  assert.equal(clarifyTargets[0].turnId, "T7");

  const zeroResult = scoreConversation(rawUnclassifiedTurns, { revisionCount: 0 });
  assert.equal(zeroResult.isAllZeroFallback, true);
  assert.equal(zeroResult.primaryType, "companionship");

  // 6. 심층 분석 리포트(스펙트럼·조합·4단계 해부·계량 지표) 검증
  const richSessionTurns = [
    evaluateTurnInput({
      turnId: "T0",
      text: TURNS[0].options[1].text,
      selectedOption: TURNS[0].options[1]
    }),
    evaluateTurnInput({
      turnId: "T1",
      text: TURNS[1].options[0].text,
      selectedOption: TURNS[1].options[0] // recognition +1
    }),
    evaluateTurnInput({
      turnId: "T2",
      text: "결과 기다리느라 진짜 속상했겠다 ㅠㅠ" // custom empathy +1.5
    }),
    evaluateTurnInput({
      turnId: "T3",
      text: TURNS[3].options[0].text,
      selectedOption: TURNS[3].options[0] // recognition +1
    }),
    evaluateTurnInput({
      turnId: "T4",
      text: TURNS[4].options[1].text,
      selectedOption: TURNS[4].options[1] // listen
    }),
    evaluateTurnInput({
      turnId: "T5",
      text: TURNS[5].options[2].text,
      selectedOption: TURNS[5].options[2] // empathy +1
    }),
    evaluateTurnInput({
      turnId: "T6",
      text: "사실 나도 요즘 취업 준비 때문에 마음이 좀 불안하고 힘들어" // open
    }),
    evaluateTurnInput({
      turnId: "T7",
      text: "지금까지 버틴 것만으로도 충분히 잘했어 푹 자!" // custom recognition +2
    })
  ];

  const richReport = scoreConversation(richSessionTurns, { revisionCount: 3 });
  assert.equal(richReport.primaryType, "recognition"); // 1 + 1 + 2 = 4
  assert.equal(richReport.secondaryType, "empathy"); // 1.5 + 1 = 2.5
  assert.equal(richReport.quadrantKey, "lift_open");
  assert.equal(richReport.spectrum.items.length, 6);
  assert.equal(
    richReport.spectrum.stayPercent + richReport.spectrum.liftPercent,
    100
  );
  assert.ok(richReport.combinationInsight.badge.includes("인정형 × 공감형"));
  assert.equal(richReport.turnBreakdown.length, 4);
  assert.equal(richReport.habits.revisionCount, 3);
  assert.equal(richReport.habits.t6Receiving, "open");

  // 7. 위기 표현 및 조사/수정 추적 검증
  assert.equal(detectCrisisSignal("그냥 사 라 지 고 싶 다").detected, true);
  assert.equal(withKoreanParticle("지우", ["은", "는"]), "지우는");
  assert.equal(withKoreanParticle("민준", ["은", "는"]), "민준은");

  const tracker = createRevisionTracker();
  tracker.onInputChange("괜찮아");
  tracker.onInputChange("괜찮");
  tracker.onInputChange("괜");
  assert.equal(tracker.getCount(), 1);

  // 8. HTML DOM ID 정합성 검증
  const rootDir = path.resolve(__dirname, "..");
  const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
  for (const rel of ["assets/js/chat.js", "assets/js/result.js"]) {
    const src = fs.readFileSync(path.join(rootDir, rel), "utf8");
    const re = /getElementById\("([^"]+)"\)/g;
    let m;
    while ((m = re.exec(src)) !== null) {
      assert.ok(html.includes(`id="${m[1]}"`), `${rel}에서 참조하는 #${m[1]} 누락`);
    }
  }

  console.log("✅ 온도의 좌표 — 3종 시나리오·심층 분석·말투 분기·DOM 정합성 테스트 모두 통과!");
}

runTests();
