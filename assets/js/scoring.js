/**
 * 온도의 좌표 — 채점, 키워드 분류, 말투 신호, 위기 표현 감지 순수 함수 모듈 (scoring.js)
 * 브라우저(window.WC_SCORING)와 Node 테스트(CommonJS) 모두에서 동작합니다.
 */
(function (root) {
  "use strict";

  const scriptModule =
    typeof module !== "undefined" && module.exports
      ? require("./script.js")
      : root.WC_SCRIPT;

  const { COMFORT_TYPES, TYPE_ORDER, QUADRANTS } = scriptModule;

  const COMFORT_TURN_IDS = ["T1", "T2", "T3", "T5"];
  const SCORED_TURN_IDS = ["T1", "T2", "T3", "T5", "T7"];

  /**
   * 6개 위로 유형 키워드 사전 (기획안 6장 기준 + 일상 구어 어간 확장)
   */
  const KEYWORD_DICTIONARY = {
    recognition: [
      "잘했",
      "잘하고",
      "잘해왔",
      "잘해냈",
      "대단",
      "버텼",
      "버티고",
      "버틴",
      "버티느라",
      "고생했",
      "고생 많",
      "고생많",
      "수고했",
      "수고 많",
      "수고많",
      "멋지",
      "멋져",
      "자랑스",
      "해온 거",
      "해온게",
      "충분히 잘",
      "최선을 다",
      "애썼",
      "애 많이"
    ],
    rest: [
      "쉬어",
      "쉬자",
      "푹 쉬",
      "쉬어도",
      "그냥 자",
      "얼른 자",
      "푹 자",
      "자자",
      "잠부터",
      "눈 좀 붙",
      "그만해",
      "내려놓",
      "내려놔",
      "천천히",
      "멈춰도",
      "멈추고",
      "아무것도 하지",
      "아무 생각 말",
      "생각하지 마",
      "내일 생각",
      "미뤄두",
      "꺼두"
    ],
    acceptance: [
      "괜찮아",
      "그래도 너",
      "그래도 넌",
      "있는 그대로",
      "어때서",
      "좀 어때",
      "하면 어때",
      "면 어때",
      "지금의 너",
      "네가 좋아",
      "너도 좋",
      "완벽하지 않",
      "모자라도",
      "실수해도",
      "그럴 수 있",
      "그럴수도",
      "그럴 수도"
    ],
    companionship: [
      "옆에",
      "곁에",
      "같이 있",
      "함께 있",
      "함께해",
      "전화할까",
      "전화해",
      "통화",
      "언제든",
      "연락해",
      "불러줘",
      "불러",
      "달려갈",
      "어디 안 가",
      "여기 있",
      "혼자 아니",
      "혼자가 아니",
      "보러 갈",
      "만나자"
    ],
    empathy: [
      "힘들었",
      "힘들겠",
      "속상했",
      "속상하",
      "그랬구나",
      "마음이 안 좋",
      "마음이 아",
      "마음 고생",
      "마음고생",
      "마음이 무거",
      "아팠겠",
      "지쳤겠",
      "서러웠",
      "외로웠",
      "답답했",
      "참았겠",
      "많이 참았",
      "얼마나 힘",
      "울고 싶"
    ],
    solution: [
      "해보자",
      "해 보자",
      "방법",
      "먼저",
      "정리해",
      "정리부터",
      "왜 그런지",
      "원인",
      "수습",
      "찾아보",
      "찾아보자",
      "계획",
      "하나씩",
      "인스타부터",
      "줄여보",
      "바꿔보",
      "적어보",
      "같이 생각"
    ]
  };

  /**
   * 위기 신호 키워드 (기획안 7장)
   */
  const CRISIS_PATTERNS = [
    "죽고싶",
    "자살",
    "자해",
    "사라지고싶",
    "살기싫",
    "죽어버리",
    "세상떠나고싶",
    "목숨을끊"
  ];

  const T6_PATTERNS = {
    open: [
      "힘들",
      "지치",
      "지쳐",
      "피곤",
      "우울",
      "불안",
      "외로",
      "외롭",
      "막막",
      "속상",
      "버겁",
      "버거",
      "어렵",
      "어려워",
      "슬프",
      "슬퍼",
      "고민",
      "스트레스",
      "울고",
      "아프",
      "아파",
      "안 좋",
      "안좋",
      "쉽지 않",
      "쉽지않",
      "나도 요즘",
      "사실 나도",
      "나도 비슷",
      "나도 똑같",
      "잠이 안",
      "못 자",
      "번아웃",
      "복잡",
      "싱숭생숭",
      "무기력",
      "답답"
    ],
    deflect: [
      "내 얘긴",
      "내 얘기는",
      "내얘긴",
      "내얘기는",
      "됐고",
      "넌 더",
      "너나",
      "나보단",
      "나보다",
      "네 얘기",
      "너 얘기",
      "다음에 하자"
    ],
    unsure: [
      "모르겠",
      "글쎄",
      "그냥 그래",
      "그저 그래",
      "애매하",
      "애매해",
      "멍하",
      "멍해"
    ],
    closed: [
      "괜찮지",
      "괜찮아",
      "잘 지내",
      "잘지내",
      "별일 없",
      "별일없",
      "문제없",
      "멀쩡",
      "아무렇지",
      "걱정 마",
      "걱정마",
      "똑같지"
    ]
  };

  const QUESTION_PATTERNS = [
    "?",
    "왜",
    "어떻게",
    "어떤",
    "무슨",
    "뭐야",
    "어디",
    "누구",
    "언제",
    "할까",
    "줄래",
    "있어",
    "어때"
  ];

  function normalizeText(text) {
    if (typeof text !== "string") return "";
    return text.trim().replace(/\s+/g, " ");
  }

  function stripSpaces(text) {
    return normalizeText(text).replace(/\s+/g, "");
  }

  /**
   * 한국어 받침 여부에 따라 조사 선택 (예: withKoreanParticle("지우", ["은", "는"]) -> "지우는")
   */
  function withKoreanParticle(word, particles) {
    const clean = normalizeText(word);
    if (!clean) return "";
    const lastChar = clean.charCodeAt(clean.length - 1);
    if (lastChar < 0xac00 || lastChar > 0xd7a3) {
      return clean + particles[1];
    }
    const hasBatchim = (lastChar - 0xac00) % 28 !== 0;
    return clean + (hasBatchim ? particles[0] : particles[1]);
  }

  /**
   * 위기 표현 감지 (공백 변형 포함)
   */
  function detectCrisisSignal(text) {
    const compact = stripSpaces(text);
    if (!compact) {
      return { detected: false, matchedKeyword: null };
    }
    for (let i = 0; i < CRISIS_PATTERNS.length; i += 1) {
      const pattern = CRISIS_PATTERNS[i];
      if (compact.includes(pattern)) {
        return { detected: true, matchedKeyword: pattern };
      }
    }
    return { detected: false, matchedKeyword: null };
  }

  /**
   * 직접 쓴 문장 키워드 분류 (기획안 6장)
   */
  function classifyComfortText(text) {
    const normalized = normalizeText(text);
    const compact = stripSpaces(text);
    const scores = {};
    TYPE_ORDER.forEach(function (typeCode) {
      scores[typeCode] = 0;
    });

    if (!normalized) {
      return {
        status: "unclassified",
        type: null,
        candidates: [],
        scores: scores
      };
    }

    TYPE_ORDER.forEach(function (typeCode) {
      const keywords = (KEYWORD_DICTIONARY[typeCode] || [])
        .map(function (kw) {
          return kw.replace(/\s+/g, "");
        })
        .filter(Boolean)
        .sort(function (a, b) {
          return b.length - a.length;
        });

      const matchedSpans = [];
      keywords.forEach(function (kwCompact) {
        const start = compact.indexOf(kwCompact);
        if (start === -1) return;
        const end = start + kwCompact.length;
        const overlaps = matchedSpans.some(function (span) {
          return !(end <= span[0] || start >= span[1]);
        });
        if (!overlaps) {
          matchedSpans.push([start, end]);
          scores[typeCode] += 1;
        }
      });
    });

    let maxScore = 0;
    TYPE_ORDER.forEach(function (typeCode) {
      if (scores[typeCode] > maxScore) {
        maxScore = scores[typeCode];
      }
    });

    if (maxScore === 0) {
      return {
        status: "unclassified",
        type: null,
        candidates: [],
        scores: scores
      };
    }

    const topTypes = TYPE_ORDER.filter(function (typeCode) {
      return scores[typeCode] === maxScore;
    });

    if (topTypes.length === 1) {
      return {
        status: "matched",
        type: topTypes[0],
        candidates: topTypes,
        scores: scores
      };
    }

    return {
      status: "ambiguous",
      type: null,
      candidates: topTypes,
      scores: scores
    };
  }

  /**
   * 보기 원문과 수정된 입력 텍스트 간의 유사도(2-gram 겹침 비율) 계산
   */
  function computeBigramOverlap(baseText, targetText) {
    const a = stripSpaces(baseText);
    const b = stripSpaces(targetText);
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (b.includes(a) || a.includes(b)) {
      const shorter = Math.min(a.length, b.length);
      const longer = Math.max(a.length, b.length);
      if (shorter / longer >= 0.45) return 0.8;
    }
    if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;

    const aGrams = new Set();
    for (let i = 0; i < a.length - 1; i += 1) {
      aGrams.add(a.slice(i, i + 2));
    }
    let matches = 0;
    for (let j = 0; j < b.length - 1; j += 1) {
      if (aGrams.has(b.slice(j, j + 2))) {
        matches += 1;
      }
    }
    return matches / Math.max(1, aGrams.size);
  }

  /**
   * 턴별 사용자 입력 평가 (보기 그대로 / 보기 고쳐 쓰기 / 직접 쓰기)
   */
  function evaluateTurnInput(params) {
    const turnId = params.turnId;
    const cleanText = normalizeText(params.text);
    const selectedOption = params.selectedOption || null;
    const isScoredTurn = SCORED_TURN_IDS.includes(turnId);
    const classification = classifyComfortText(cleanText);

    if (selectedOption && normalizeText(selectedOption.text) === cleanText) {
      const choiceType = selectedOption.type || null;
      return {
        turnId: turnId,
        text: cleanText,
        mode: "choice",
        editedFromChoice: false,
        selectedOptionId: selectedOption.id || null,
        optionType: choiceType,
        reactionType: selectedOption.reactionType || null,
        receivingType: selectedOption.receivingType || null,
        classification: classification,
        resolvedType: choiceType,
        clarifiedType: null,
        needsClarification: false
      };
    }

    if (selectedOption) {
      const overlap = computeBigramOverlap(selectedOption.text, cleanText);
      // 보기 원문 일부를 유지하며 내 말투로 다듬은 경우
      if (overlap >= 0.3) {
        let resolvedType = selectedOption.type || null;
        if (classification.status === "matched") {
          resolvedType = classification.type;
        }
        return {
          turnId: turnId,
          text: cleanText,
          mode: "edited",
          editedFromChoice: true,
          selectedOptionId: selectedOption.id || null,
          optionType: selectedOption.type || null,
          reactionType: selectedOption.reactionType || null,
          receivingType: selectedOption.receivingType || null,
          classification: classification,
          resolvedType: resolvedType,
          clarifiedType: null,
          needsClarification: Boolean(isScoredTurn && !resolvedType)
        };
      }
    }

    // 처음부터 직접 썼거나 보기를 완전히 지우고 새로 작성한 경우
    const matchedType =
      classification.status === "matched" ? classification.type : null;

    return {
      turnId: turnId,
      text: cleanText,
      mode: "custom",
      editedFromChoice: Boolean(selectedOption),
      selectedOptionId: selectedOption ? selectedOption.id || null : null,
      optionType: null,
      reactionType: null,
      receivingType: null,
      classification: classification,
      resolvedType: isScoredTurn ? matchedType : null,
      clarifiedType: null,
      needsClarification: Boolean(isScoredTurn && !matchedType)
    };
  }

  /**
   * 애매하거나 미분류된 직접 입력 문장 중 사용자에게 물어볼 대상 추출 (최대 2문장, T7 우선)
   */
  function getClarificationTargets(turnRecords, maxCount) {
    const limit = typeof maxCount === "number" ? maxCount : 2;
    if (!Array.isArray(turnRecords) || limit <= 0) return [];

    const unresolved = turnRecords.filter(function (rec) {
      return (
        rec &&
        SCORED_TURN_IDS.includes(rec.turnId) &&
        !rec.resolvedType &&
        !rec.clarifiedType &&
        normalizeText(rec.text).length > 0
      );
    });

    // T7 마지막 한마디(+2점)를 최우선으로 묻고, 나머지는 대화 순서대로 선택
    unresolved.sort(function (a, b) {
      if (a.turnId === "T7" && b.turnId !== "T7") return -1;
      if (b.turnId === "T7" && a.turnId !== "T7") return 1;
      return SCORED_TURN_IDS.indexOf(a.turnId) - SCORED_TURN_IDS.indexOf(b.turnId);
    });

    return unresolved.slice(0, limit);
  }

  /**
   * T6 ("근데 넌 요즘 어때?") 응답으로 받는 힘 분류
   * 반환값: "open" | "unsure" | "closed" | "deflect"
   */
  function classifyT6Response(turnRecord) {
    if (!turnRecord) return "closed";
    const text = normalizeText(turnRecord.text);
    const compact = stripSpaces(text);

    if (
      (turnRecord.mode === "choice" || turnRecord.mode === "edited") &&
      turnRecord.receivingType
    ) {
      // 보기 선택 후 수정하면서 자기 힘든 얘기를 덧붙인 경우 열림으로 승격
      if (turnRecord.mode === "edited") {
        const hasOpenSignal = T6_PATTERNS.open.some(function (kw) {
          return text.includes(kw) || compact.includes(kw.replace(/\s+/g, ""));
        });
        if (hasOpenSignal) return "open";
      }
      return turnRecord.receivingType;
    }

    const matchesCategory = function (cat) {
      return T6_PATTERNS[cat].some(function (kw) {
        return text.includes(kw) || compact.includes(kw.replace(/\s+/g, ""));
      });
    };

    if (matchesCategory("open")) return "open";
    if (matchesCategory("deflect")) return "deflect";
    if (matchesCategory("unsure")) return "unsure";
    if (matchesCategory("closed")) return "closed";

    // 닫힘/돌림/모름 표현 없이 자기 근황이나 상태를 8자 이상 직접 적어 보낸 경우 열림으로 해석
    if (compact.length >= 8) {
      return "open";
    }
    return "closed";
  }

  /**
   * T4 ("솔직히 잘 와닿지는 않아") 대응 분류
   */
  function classifyT4Reaction(turnRecord) {
    if (!turnRecord) return "listen";
    if (turnRecord.reactionType) return turnRecord.reactionType;

    const text = normalizeText(turnRecord.text);
    if (/미안|쉽지|그치|맞아/.test(text)) return "step_back";
    if (/말해|들을게|들어줄|더 얘|더 해/.test(text)) return "listen";
    if (/진심|정말|진짜로/.test(text)) return "reassure";
    return "custom";
  }

  /**
   * 되묻기(질문) 여부 판별
   */
  function hasQuestionSignal(text) {
    const clean = normalizeText(text);
    if (!clean) return false;
    if (clean.includes("?")) return true;
    return /(왜\s|어떻게|어떤\s|무슨\s|뭐야|누구|할까|줄래|있었어|어땠어|어때)/.test(
      clean
    );
  }

  /**
   * 전송 전 쓰고 지운 횟수 추적기 (지운 원문은 저장하지 않고 횟수만 집계)
   */
  function createRevisionTracker() {
    let count = 0;
    let prevLength = 0;
    let inDeleteStreak = false;

    return {
      onInputChange: function (currentValue) {
        const len = typeof currentValue === "string" ? currentValue.length : 0;
        if (len < prevLength && !inDeleteStreak) {
          count += 1;
          inDeleteStreak = true;
        } else if (len > prevLength) {
          inDeleteStreak = false;
        }
        prevLength = len;
        return count;
      },
      onOptionFill: function (newValue, hadPreviousDiffText) {
        if (hadPreviousDiffText) {
          count += 1;
        }
        prevLength = typeof newValue === "string" ? newValue.length : 0;
        inDeleteStreak = false;
        return count;
      },
      resetTurn: function () {
        prevLength = 0;
        inDeleteStreak = false;
      },
      getCount: function () {
        return count;
      }
    };
  }

  /**
   * 나에게 돌려줄 대표 문장 선정 (기획안 3-5장: 내가 직접 쓴 문장 우선)
   */
  function selectReturnedSentence(turnRecords, primaryType) {
    const validTurns = (turnRecords || []).filter(function (rec) {
      if (!rec || !SCORED_TURN_IDS.includes(rec.turnId)) return false;
      const clean = normalizeText(rec.text);
      if (clean.length < 2) return false;
      if (detectCrisisSignal(clean).detected) return false;
      return true;
    });

    const getEffectiveType = function (rec) {
      return rec.clarifiedType || rec.resolvedType || null;
    };

    const byRecency = validTurns.slice().reverse();

    // 1순위: T7에서 직접 쓴 문장
    const t7Custom = validTurns.find(function (r) {
      return r.turnId === "T7" && r.mode === "custom";
    });
    if (t7Custom) {
      return {
        text: t7Custom.text,
        turnId: "T7",
        mode: "custom"
      };
    }

    // 2순위: 주 유형과 일치하는 직접 쓴 위로 문장 (최신순)
    const primaryCustom = byRecency.find(function (r) {
      return r.mode === "custom" && getEffectiveType(r) === primaryType;
    });
    if (primaryCustom) {
      return {
        text: primaryCustom.text,
        turnId: primaryCustom.turnId,
        mode: "custom"
      };
    }

    // 3순위: 유형 무관 직접 쓴 위로 문장 (최신순)
    const anyCustom = byRecency.find(function (r) {
      return r.mode === "custom";
    });
    if (anyCustom) {
      return {
        text: anyCustom.text,
        turnId: anyCustom.turnId,
        mode: "custom"
      };
    }

    // 4순위: 선택지를 내 말투로 고쳐 보낸 문장 (T7 우선, 그다음 최신순)
    const editedTurn =
      validTurns.find(function (r) {
        return r.turnId === "T7" && r.mode === "edited";
      }) ||
      byRecency.find(function (r) {
        return r.mode === "edited";
      });
    if (editedTurn) {
      return {
        text: editedTurn.text,
        turnId: editedTurn.turnId,
        mode: "edited"
      };
    }

    // 5순위: T7에서 선택한 문장 또는 주 유형에 해당하는 선택 문장
    const t7Choice = validTurns.find(function (r) {
      return r.turnId === "T7";
    });
    if (t7Choice) {
      return {
        text: t7Choice.text,
        turnId: "T7",
        mode: "choice"
      };
    }

    const primaryChoice = byRecency.find(function (r) {
      return getEffectiveType(r) === primaryType;
    });
    if (primaryChoice) {
      return {
        text: primaryChoice.text,
        turnId: primaryChoice.turnId,
        mode: primaryChoice.mode || "choice"
      };
    }

    const fallbackQuote = COMFORT_TYPES[primaryType]
      ? COMFORT_TYPES[primaryType].toFriendQuote
      : COMFORT_TYPES.companionship.toFriendQuote;

    return {
      text: fallbackQuote,
      turnId: null,
      mode: "choice"
    };
  }

  /**
   * 대화 습관 요약 생성 (기획안 3-5, 6장)
   */
  function analyzeHabits(turnRecords, meta) {
    const records = Array.isArray(turnRecords) ? turnRecords : [];
    const revisionCount =
      meta && typeof meta.revisionCount === "number" ? meta.revisionCount : 0;

    let customCount = 0;
    let editedChoiceCount = 0;
    let questionCount = 0;
    let laughCount = 0;
    let tearCount = 0;
    let totalChars = 0;

    records.forEach(function (rec) {
      if (!rec) return;
      const text = normalizeText(rec.text);
      totalChars += text.length;
      if (rec.mode === "custom") customCount += 1;
      if (rec.editedFromChoice) editedChoiceCount += 1;
      if (hasQuestionSignal(text)) questionCount += 1;
      if (/[ㅋㅎ]{2,}/.test(text)) laughCount += 1;
      if (/[ㅠㅜ]{1,}/.test(text)) tearCount += 1;
    });

    const avgLength =
      records.length > 0 ? Math.round(totalChars / records.length) : 0;

    const t4Record = records.find(function (r) {
      return r && r.turnId === "T4";
    });
    const t6Record = records.find(function (r) {
      return r && r.turnId === "T6";
    });

    const t4Reaction = classifyT4Reaction(t4Record);
    const t6Receiving = classifyT6Response(t6Record);

    const lines = [];

    // 1줄: 전송 전 수정 및 말투 다듬기 습관
    if (revisionCount > 0 && editedChoiceCount > 0) {
      lines.push(
        "보내기 전에 말을 " +
          revisionCount +
          "번 고쳐 썼고, 보기 중 " +
          editedChoiceCount +
          "번을 내 말투로 다듬어 보냈어요."
      );
    } else if (revisionCount > 0) {
      lines.push(
        "전송 버튼을 누르기 전에 말을 " +
          revisionCount +
          "번 고치며 단어의 온도를 신중히 골랐어요."
      );
    } else if (editedChoiceCount > 0) {
      lines.push(
        "주어진 보기를 그대로 쓰지 않고 " +
          editedChoiceCount +
          "번 내 말투로 고쳐 보냈어요."
      );
    } else {
      lines.push("망설임 없이 처음 마음에 닿은 말을 곧바로 건넸어요.");
    }

    // 2줄: 직접 쓰기 + 먼저 물어보기/말투 습관
    if (customCount > 0 && questionCount > 0) {
      lines.push(
        "직접 적은 답장이 " +
          customCount +
          "번이었고, 친구에게 먼저 되물어본 횟수는 " +
          questionCount +
          "번이에요."
      );
    } else if (customCount > 0) {
      lines.push(
        records.length +
          "번의 답장 중 " +
          customCount +
          "번을 보기에 기대지 않고 내 문장으로 직접 적었어요."
      );
    } else if (questionCount > 0) {
      lines.push(
        "단정 짓기보다 친구에게 먼저 안부와 사정을 물어본 횟수가 " +
          questionCount +
          "번이에요."
      );
    } else if (laughCount >= 2) {
      lines.push(
        "대화 곳곳에 ‘ㅋㅋ·ㅎㅎ’를 섞어 새벽 공기가 너무 무거워지지 않게 배려했어요."
      );
    } else if (tearCount >= 1) {
      lines.push("친구의 속상한 대목마다 ‘ㅠㅠ’로 마음의 물기를 함께 나누었어요.");
    } else {
      lines.push(
        "평균 " +
          avgLength +
          "자 안팎의 차분하고 담백한 호흡으로 끝까지 대화를 지켰어요."
      );
    }

    // 3줄: 위로가 튕겨 나왔을 때(T4) & 내 안부를 물었을 때(T6)
    const t4Descriptions = {
      step_back: "위로가 와닿지 않는다는 말에는 한발 물러나 미안함을 먼저 표했고",
      listen: "위로가 튕겨 나왔을 때는 조언 대신 더 이야기해 달라며 귀를 열었고",
      reassure: "말이 닿지 않는다는 말 앞에서도 내 진심만큼은 조용히 다시 전했고",
      custom: "위로가 튕겨 나왔을 때도 당황하지 않고 내 방식의 말로 다시 다독였고"
    };
    const t6Descriptions = {
      open: "‘넌 요즘 어때?’라는 되물음에는 내 솔직한 상태도 조금 꺼내 보였어요.",
      unsure:
        "‘넌 요즘 어때?’라는 되물음에는 괜찮다고 꾸미기보다 잘 모르겠다며 잠시 멈춰 섰어요.",
      closed:
        "정작 ‘넌 요즘 어때?’라는 질문에는 괜찮다며 내 이야기를 조용히 덮어두었어요.",
      deflect:
        "정작 ‘넌 요즘 어때?’라는 질문에는 내 얘기는 됐다며 다시 친구 쪽으로 시선을 돌렸어요."
    };

    lines.push(
      (t4Descriptions[t4Reaction] || t4Descriptions.listen) +
        ", " +
        (t6Descriptions[t6Receiving] || t6Descriptions.closed)
    );

    return {
      revisionCount: revisionCount,
      editedChoiceCount: editedChoiceCount,
      customCount: customCount,
      questionCount: questionCount,
      laughCount: laughCount,
      tearCount: tearCount,
      avgLength: avgLength,
      t4Reaction: t4Reaction,
      t6Receiving: t6Receiving,
      lines: lines
    };
  }

  /**
   * 전체 대화 채점 및 좌표 산출 (기획안 6장 채점·동점 규칙 구현)
   *
   * - T1, T2, T3, T5 보기 선택(또는 보기 기반 소폭 수정): 해당 유형 +1
   * - T1, T2, T3, T5 직접 쓴 문장(유형 분류됨): 해당 유형 +1.5
   * - T7 마지막 한마디: 해당 유형 +2
   * - 동점 시: T7 유형 → 직접 쓴 문장의 유형(최신순) → 가장 나중에 고른 유형 순 → 기본 순서
   */
  function scoreConversation(turnRecords, meta) {
    const records = Array.isArray(turnRecords) ? turnRecords : [];
    const scores = {};
    TYPE_ORDER.forEach(function (typeCode) {
      scores[typeCode] = 0;
    });

    let t7Type = null;
    const customTypeHistory = [];
    const chosenTypeHistory = [];

    records.forEach(function (rec) {
      if (!rec) return;
      const effectiveType = rec.clarifiedType || rec.resolvedType || null;
      if (!effectiveType || !COMFORT_TYPES[effectiveType]) return;

      if (COMFORT_TURN_IDS.includes(rec.turnId)) {
        const delta = rec.mode === "custom" ? 1.5 : 1;
        scores[effectiveType] += delta;
        if (rec.mode === "custom") {
          customTypeHistory.push(effectiveType);
        } else {
          chosenTypeHistory.push(effectiveType);
        }
      } else if (rec.turnId === "T7") {
        scores[effectiveType] += 2;
        t7Type = effectiveType;
        if (rec.mode === "custom") {
          customTypeHistory.push(effectiveType);
        } else {
          chosenTypeHistory.push(effectiveType);
        }
      }
    });

    const totalPoints = TYPE_ORDER.reduce(function (acc, code) {
      return acc + scores[code];
    }, 0);

    const compareTypes = function (a, b) {
      if (scores[b] !== scores[a]) {
        return scores[b] - scores[a];
      }
      // 1. T7 마지막 한마디 유형 우선
      if (t7Type) {
        if (a === t7Type && b !== t7Type) return -1;
        if (b === t7Type && a !== t7Type) return 1;
      }
      // 2. 직접 쓴 문장의 유형 (가장 나중에 쓴 것 우선)
      const aCustomIdx = customTypeHistory.lastIndexOf(a);
      const bCustomIdx = customTypeHistory.lastIndexOf(b);
      if (aCustomIdx !== bCustomIdx) {
        return bCustomIdx - aCustomIdx;
      }
      // 3. 가장 나중에 고른 유형 순
      const aChosenIdx = chosenTypeHistory.lastIndexOf(a);
      const bChosenIdx = chosenTypeHistory.lastIndexOf(b);
      if (aChosenIdx !== bChosenIdx) {
        return bChosenIdx - aChosenIdx;
      }
      // 4. 모든 점수가 0이고 선택 이력이 없을 때 기본 안전 폴백(companionship 우선)
      if (totalPoints === 0) {
        if (a === "companionship" && b !== "companionship") return -1;
        if (b === "companionship" && a !== "companionship") return 1;
      }
      return TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b);
    };

    const rankedTypes = TYPE_ORDER.slice().sort(compareTypes);
    const primaryType = rankedTypes[0];
    const secondaryType = rankedTypes[1];

    // 4분면 좌표 계산
    const primaryDef = COMFORT_TYPES[primaryType];
    const givingAxis = primaryDef.axis; // "stay" | "lift"

    const habits = analyzeHabits(records, meta);
    const t6Receiving = habits.t6Receiving;
    const isReceivingOpen =
      t6Receiving === "open" || t6Receiving === "unsure";

    const quadrantKey =
      givingAxis + "_" + (isReceivingOpen ? "open" : "closed");
    const quadrant = QUADRANTS[quadrantKey];

    // 사분면 내 시각적 점 위치 (퍼센트 15% ~ 85%, 온도 숫자 표기 없음)
    const stayScore =
      scores.acceptance + scores.companionship + scores.empathy;
    const liftScore = scores.recognition + scores.rest + scores.solution;
    const sumAxis = stayScore + liftScore;
    let ratio = sumAxis > 0 ? Math.abs(liftScore - stayScore) / sumAxis : 0.35;
    ratio = Math.max(0.22, Math.min(0.78, ratio));

    const xPercent =
      givingAxis === "stay"
        ? Math.round(50 - ratio * 38)
        : Math.round(50 + ratio * 38);

    const yPercentMap = {
      open: 22,
      unsure: 36,
      closed: 66,
      deflect: 80
    };
    const yPercent = yPercentMap[t6Receiving] || 66;

    const returnedSentence = selectReturnedSentence(records, primaryType);

    return {
      scores: scores,
      rankedTypes: rankedTypes,
      primaryType: primaryType,
      secondaryType: secondaryType,
      isAllZeroFallback: totalPoints === 0,
      quadrantKey: quadrantKey,
      quadrant: quadrant,
      coordinates: {
        xPercent: xPercent,
        yPercent: yPercent,
        givingAxis: givingAxis,
        receivingType: t6Receiving,
        isReceivingOpen: isReceivingOpen
      },
      returnedSentence: returnedSentence,
      habits: habits
    };
  }

  const exported = {
    COMFORT_TURN_IDS: COMFORT_TURN_IDS,
    SCORED_TURN_IDS: SCORED_TURN_IDS,
    KEYWORD_DICTIONARY: KEYWORD_DICTIONARY,
    normalizeText: normalizeText,
    withKoreanParticle: withKoreanParticle,
    detectCrisisSignal: detectCrisisSignal,
    classifyComfortText: classifyComfortText,
    computeBigramOverlap: computeBigramOverlap,
    evaluateTurnInput: evaluateTurnInput,
    getClarificationTargets: getClarificationTargets,
    classifyT6Response: classifyT6Response,
    classifyT4Reaction: classifyT4Reaction,
    hasQuestionSignal: hasQuestionSignal,
    createRevisionTracker: createRevisionTracker,
    selectReturnedSentence: selectReturnedSentence,
    analyzeHabits: analyzeHabits,
    scoreConversation: scoreConversation
  };

  root.WC_SCORING = exported;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  }
})(typeof window !== "undefined" ? window : globalThis);
