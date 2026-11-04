/**
 * 온도의 좌표 — 채점, 키워드 분류, 동점 처리, 분류 실패·건너뛰기, 위기 감지 검증 테스트
 * 실행: node tests/scoring.test.js
 */
const assert = require("node:assert/strict");
const scriptData = require("../assets/js/script.js");
const scoring = require("../assets/js/scoring.js");

const { COMFORT_TYPES, TYPE_ORDER, QUADRANTS, TURNS } = scriptData;
const {
  COMFORT_TURN_IDS,
  withKoreanParticle,
  detectCrisisSignal,
  classifyComfortText,
  evaluateTurnInput,
  getClarificationTargets,
  classifyT6Response,
  createRevisionTracker,
  selectReturnedSentence,
  scoreConversation
} = scoring;

function runTests() {
  // 1. 스크립트 및 유형 균형 검증 (기획안 4, 5장)
  assert.equal(TYPE_ORDER.length, 6, "위로 유형은 정확히 6개여야 합니다.");
  assert.equal(TURNS.length, 8, "대화는 T0~T7 총 8턴이어야 합니다.");
  assert.equal(TURNS[0].time, "02:13", "시작 시각은 02:13이어야 합니다.");
  assert.equal(TURNS[7].time, "02:41", "종료 시각은 02:41이어야 합니다.");

  // 유형 측정 4턴(T1, T2, T3, T5)에서 6개 유형이 정확히 2번씩 노출되는지 확인
  const exposureCounts = {};
  TYPE_ORDER.forEach((code) => {
    exposureCounts[code] = 0;
  });
  TURNS.filter((t) => COMFORT_TURN_IDS.includes(t.id)).forEach((turn) => {
    assert.equal(turn.options.length, 3, `${turn.id} 보기는 3개여야 합니다.`);
    turn.options.forEach((opt) => {
      assert.ok(COMFORT_TYPES[opt.type], `${turn.id} 보기 유형이 유효해야 합니다.`);
      exposureCounts[opt.type] += 1;
    });
  });
  TYPE_ORDER.forEach((code) => {
    assert.equal(
      exposureCounts[code],
      2,
      `유형 ${code} 노출 횟수가 정확히 2회여야 합니다 (실제: ${exposureCounts[code]}).`
    );
  });

  // T6 보기에는 '열림(open)' 선택지가 없어야 함 (기획안 5장)
  const t6 = TURNS.find((t) => t.id === "T6");
  t6.options.forEach((opt) => {
    assert.notEqual(
      opt.receivingType,
      "open",
      "T6 기본 보기에는 열림(open) 선택지를 넣지 않아야 합니다."
    );
  });

  // 7장 안전 표현 기준: 단정적 진단 표현("당신은 ~입니다", "결핍") 미사용 확인
  TYPE_ORDER.forEach((code) => {
    const t = COMFORT_TYPES[code];
    const combined = `${t.summary} ${t.detail}`;
    assert.ok(!combined.includes("당신은 "), `${code} 문구에 단정적 표현이 없어야 합니다.`);
    assert.ok(!combined.includes("결핍"), `${code} 문구에 결핍 판정 표현이 없어야 합니다.`);
  });

  // 2. 키워드 분류기 검증 (단일 매칭 / 중복 동점 / 미분류)
  assert.equal(classifyComfortText("너 그동안 진짜 잘 버텼어").type, "recognition");
  assert.equal(classifyComfortText("아무 생각 말고 푹 쉬어").type, "rest");
  assert.equal(classifyComfortText("실수해도 괜찮아 있는 그대로의 네가 좋아").type, "acceptance");
  assert.equal(classifyComfortText("내가 옆에 있을게 언제든 연락해").type, "companionship");
  assert.equal(classifyComfortText("오늘 하루 얼마나 힘들었어 속상했겠다").type, "empathy");
  assert.equal(classifyComfortText("원인부터 정리해서 수습 방법을 찾아보자").type, "solution");

  const ambiguous = classifyComfortText("그동안 잘 버텼어, 이제 푹 쉬어");
  assert.equal(ambiguous.status, "ambiguous");
  assert.equal(ambiguous.type, null);
  assert.deepEqual(ambiguous.candidates.sort(), ["recognition", "rest"].sort());

  const unclassified = classifyComfortText("내일 점심에 마라탕 먹으러 가자");
  assert.equal(unclassified.status, "unclassified");
  assert.equal(unclassified.type, null);

  // 3. 분류 실패 문장 확인 대상 추출 (최대 2문장, T7 최우선) 및 건너뛰기 제외 검증
  const rawUnclassifiedTurns = [
    evaluateTurnInput({ turnId: "T1", text: "내일 맛있는 거 먹자" }),
    evaluateTurnInput({ turnId: "T2", text: "이불 꼭 덮고 있어" }),
    evaluateTurnInput({ turnId: "T5", text: "물 한 잔 마셔" }),
    evaluateTurnInput({ turnId: "T7", text: "좋은 꿈 꿔 안녕" })
  ];
  const clarifyTargets = getClarificationTargets(rawUnclassifiedTurns, 2);
  assert.equal(clarifyTargets.length, 2, "확인 문장은 최대 2개까지만 추출해야 합니다.");
  assert.equal(clarifyTargets[0].turnId, "T7", "T7 미분류 문장을 최우선으로 물어야 합니다.");
  assert.equal(clarifyTargets[1].turnId, "T1", "그다음 미분류 문장은 순서대로 선택해야 합니다.");

  // 전부 건너뛰었을 때(모든 점수 0점) 에러 없이 안전 폴백 동작 확인
  const zeroResult = scoreConversation(rawUnclassifiedTurns, { revisionCount: 0 });
  assert.equal(zeroResult.isAllZeroFallback, true);
  assert.equal(zeroResult.primaryType, "companionship");
  assert.ok(QUADRANTS[zeroResult.quadrantKey]);

  // 4. 채점 가중치 및 동점 처리 검증 (기획안 6장)
  // 4-A. T1 인정(+1), T2 수용(+1), T3 인정(+1), T5 수용(+1) -> 2:2 동점 시 가장 나중에 고른 수용(T5) 우선
  const tieByOrder = [
    evaluateTurnInput({
      turnId: "T1",
      text: "너 그동안 진짜 잘 버텼어",
      selectedOption: TURNS[1].options[0] // recognition +1
    }),
    evaluateTurnInput({
      turnId: "T2",
      text: "실수 좀 하면 어때. 그래도 넌 너야",
      selectedOption: TURNS[2].options[0] // acceptance +1
    }),
    evaluateTurnInput({
      turnId: "T3",
      text: "제자리 아니야. 네가 해온 거 내가 다 봤어",
      selectedOption: TURNS[3].options[0] // recognition +1
    }),
    Object.assign(
      evaluateTurnInput({
        turnId: "T5",
        text: "그럴 수도 있지",
        selectedOption: { id: "mock_acc", type: "acceptance", text: "그럴 수도 있지" } // acceptance +1
      })
    )
  ];
  const resOrder = scoreConversation(tieByOrder, {});
  assert.equal(resOrder.scores.recognition, 2);
  assert.equal(resOrder.scores.acceptance, 2);
  assert.equal(
    resOrder.primaryType,
    "acceptance",
    "보기 동점 시 가장 나중에 고른 유형이 주 유형이어야 합니다."
  );
  assert.equal(resOrder.secondaryType, "recognition");

  // 4-B. 직접 쓴 문장(+1.5) vs 보기 선택: 동점 시 직접 쓴 문장 유형 우선
  // 공감 직접 쓰기(+1.5) + 공감 보기(+1) = 2.5 vs 안식 직접 쓰기 없이 보기만 불가하므로
  // 직접 쓰기 1회(공감 +1.5) vs 해결 보기 1회(+1) 비교, 그리고 동점(예: T7 안식 보기 +2 vs T1,T5 안식 제외 타 유형 보기 2회 +2)
  const tieWithT7 = [
    evaluateTurnInput({
      turnId: "T1",
      text: "너 그동안 진짜 잘 버텼어",
      selectedOption: TURNS[1].options[0] // recognition +1
    }),
    evaluateTurnInput({
      turnId: "T3",
      text: "제자리 아니야. 네가 해온 거 내가 다 봤어",
      selectedOption: TURNS[3].options[0] // recognition +1 (합계 2)
    }),
    evaluateTurnInput({
      turnId: "T7",
      text: "아무 생각 말고 푹 자. 내일 걱정은 내일 하자",
      selectedOption: TURNS[7].defaultFallbackOptions[1] // rest +2 (합계 2)
    })
  ];
  const resT7 = scoreConversation(tieWithT7, {});
  assert.equal(resT7.scores.recognition, 2);
  assert.equal(resT7.scores.rest, 2);
  assert.equal(
    resT7.primaryType,
    "rest",
    "동점 시 T7 마지막 한마디 유형이 최우선이어야 합니다."
  );

  // 직접 쓴 문장(+1.5) 두 번은 3점, 보기 선택 세 번도 3점 -> 직접 쓴 문장 유형 우선 확인
  const tieCustomVsChoice = [
    evaluateTurnInput({
      turnId: "T1",
      text: "오늘 하루 정말 힘들었겠다 마음이 아프네" // custom empathy +1.5
    }),
    evaluateTurnInput({
      turnId: "T2",
      text: "혼자 참느라 얼마나 속상했어" // custom empathy +1.5 -> 합계 3.0
    }),
    evaluateTurnInput({
      turnId: "T3",
      text: "제자리 아니야. 네가 해온 거 내가 다 봤어",
      selectedOption: TURNS[3].options[0] // choice recognition +1
    }),
    evaluateTurnInput({
      turnId: "T5",
      text: "고생했어",
      selectedOption: { id: "m1", type: "recognition", text: "고생했어" } // choice recognition +1
    })
  ];
  // recognition에 +1을 더 주지 않고 2점일 때 empathy(3점) 우승 확인, 그리고 3:3 동점 구성
  tieCustomVsChoice.push({
    turnId: "T1",
    text: "버텼어",
    mode: "choice",
    resolvedType: "recognition" // choice recognition +1 -> 합계 3.0 (가장 마지막에 추가됨)
  });
  const resCustom = scoreConversation(tieCustomVsChoice, {});
  assert.equal(resCustom.scores.empathy, 3);
  assert.equal(resCustom.scores.recognition, 3);
  assert.equal(
    resCustom.primaryType,
    "empathy",
    "동점 시 나중에 고른 보기보다 직접 쓴 문장의 유형이 우선해야 합니다."
  );

  // 5. T6 받는 힘 분류 및 4분면 매핑 검증 (기획안 4, 5장)
  assert.equal(
    classifyT6Response(
      evaluateTurnInput({
        turnId: "T6",
        text: "나야 뭐 괜찮지",
        selectedOption: t6.options[0]
      })
    ),
    "closed"
  );
  assert.equal(
    classifyT6Response(
      evaluateTurnInput({
        turnId: "T6",
        text: "내 얘긴 됐고, 넌 더 없어?",
        selectedOption: t6.options[1]
      })
    ),
    "deflect"
  );
  assert.equal(
    classifyT6Response(
      evaluateTurnInput({
        turnId: "T6",
        text: "글쎄... 잘 모르겠어",
        selectedOption: t6.options[2]
      })
    ),
    "unsure"
  );
  assert.equal(
    classifyT6Response(
      evaluateTurnInput({
        turnId: "T6",
        text: "사실 나도 요즘 회사 일 때문에 좀 지치고 힘들어"
      })
    ),
    "open"
  );

  // 곁에 머무는 말(stay: companionship) + 닫힘(closed) => 혼자 불 켜두는 사람 (stay_closed)
  const stayClosedResult = scoreConversation(
    [
      evaluateTurnInput({
        turnId: "T1",
        text: "지금 전화할까? 말 안 해도 돼",
        selectedOption: TURNS[1].options[2]
      }),
      evaluateTurnInput({
        turnId: "T6",
        text: "나야 뭐 괜찮지",
        selectedOption: t6.options[0]
      })
    ],
    { revisionCount: 2 }
  );
  assert.equal(stayClosedResult.quadrantKey, "stay_closed");
  assert.equal(stayClosedResult.quadrant.title, "혼자 불 켜두는 사람");

  // 일으켜 주는 말(lift: solution) + 열림(open) => 함께 걷는 사람 (lift_open)
  const liftOpenResult = scoreConversation(
    [
      evaluateTurnInput({
        turnId: "T2",
        text: "어떤 실수였어? 수습 방법 같이 생각해 보자",
        selectedOption: TURNS[2].options[2]
      }),
      evaluateTurnInput({
        turnId: "T6",
        text: "사실 나도 요즘 번아웃 와서 밤마다 잠이 안 와"
      })
    ],
    { revisionCount: 0 }
  );
  assert.equal(liftOpenResult.quadrantKey, "lift_open");
  assert.equal(liftOpenResult.quadrant.title, "함께 걷는 사람");

  // 6. 돌려줄 문장 우선순위 검증 (직접 쓴 문장 우선, 위기 표현 제외)
  const sentSelection = selectReturnedSentence(
    [
      evaluateTurnInput({
        turnId: "T1",
        text: "너 그동안 진짜 잘 버텼어",
        selectedOption: TURNS[1].options[0]
      }),
      evaluateTurnInput({
        turnId: "T3",
        text: "네가 얼마나 애썼는지 내가 다 알아"
      }),
      evaluateTurnInput({
        turnId: "T7",
        text: "오늘 하루도 버티느라 정말 고생 많았어. 잘 자",
        selectedOption: TURNS[7].defaultFallbackOptions[0]
      })
    ],
    "recognition"
  );
  assert.equal(
    sentSelection.text,
    "네가 얼마나 애썼는지 내가 다 알아",
    "T7이 보기 선택이면 앞서 직접 쓴 문장이 우선 선택되어야 합니다."
  );

  // 7. 위기 신호 감지 및 수정 횟수 추적기 검증
  assert.equal(detectCrisisSignal("요즘 좀 죽고 싶어").detected, true);
  assert.equal(detectCrisisSignal("그냥 사 라 지 고 싶 다").detected, true);
  assert.equal(detectCrisisSignal("자해 생각이 나").detected, true);
  assert.equal(detectCrisisSignal("오늘 회의에서 실수해서 속상해").detected, false);

  const tracker = createRevisionTracker();
  tracker.onInputChange("너");
  tracker.onInputChange("너 진짜");
  tracker.onInputChange("너 진"); // 삭제 시작 -> 1회
  tracker.onInputChange("너 "); // 연속 백스페이스 -> 여전히 1회
  tracker.onInputChange("너 정말 잘했어"); // 다시 입력
  tracker.onInputChange("너 정말 잘"); // 두 번째 삭제 -> 2회
  assert.equal(tracker.getCount(), 2, "연속 삭제는 1회의 수정 에피소드로 계산해야 합니다.");

  assert.equal(withKoreanParticle("지우", ["은", "는"]), "지우는");
  assert.equal(withKoreanParticle("민준", ["은", "는"]), "민준은");

  console.log("✅ 온도의 좌표 — 스크립트·채점·동점·분류실패·위기감지 테스트 모두 통과!");
}

runTests();
