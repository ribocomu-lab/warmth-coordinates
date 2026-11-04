/**
 * 온도의 좌표 — 대화 스크립트, 유형 정의 및 모든 UI·결과 문구 (script.js)
 * 모든 텍스트는 이 파일 한 곳에서 관리합니다.
 */
(function (root) {
  "use strict";

  const SITE_META = {
    title: "온도의 좌표",
    subtitle: "그 말, 사실 네가 듣고 싶었던 거 아니야?",
    defaultFriendName: "지우",
    storageKey: "warmth_coordinates_v1",
    landingTime: "02:13",
    landingPreviewSender: "새 메시지",
    landingPreviewText: "자...?",
    landingCta: "답장하기",
    resumeCta: "지난 결과 다시 보기",
    landingNotice:
      "가상의 친구와 나누는 약 3분간의 새벽 대화예요. 의학적·심리학적 진단이 아닌 자기 이해 콘텐츠이며, 작성한 문장과 전송 전 수정 횟수는 서버로 전송되지 않고 이 기기 안에서만 처리돼요."
  };

  const NAME_STEP_TEXT = {
    heading: "힘들 때 먼저 떠오르는 친구가 있나요?",
    subheading: "그 친구를 평소 뭐라고 부르세요?",
    helper:
      "실제 친구를 떠올리면 대답이 평소 내 말투에 가까워져요. 입력한 이름은 이 기기 안에서만 쓰이며 외부나 공유 링크에 절대 포함되지 않아요.",
    placeholder: "예: 지우, 민수, 언니 (최대 12자)",
    startBtn: "대화 시작하기",
    skipBtn: "건너뛰기 (기본 이름 ‘지우’)"
  };

  const CHAT_UI_TEXT = {
    backLabel: "처음으로",
    backConfirm: "진행 중인 대화를 멈추고 첫 화면으로 돌아갈까요?",
    statusAwake: "새벽에 깨어 있음",
    statusSleeping: "잠듦",
    readReceipt: "읽음",
    typingLabel: "입력 중",
    skipWaitHint: "화면을 탭하면 바로 이어서 볼 수 있어요",
    inputPlaceholder: "보기를 눌러 고치거나, 직접 답장을 적어보세요",
    inputPlaceholderT7: "자기 전 친구에게 건넬 마지막 한마디를 적어보세요",
    sendLabel: "전송",
    choiceGuide: "보기를 누르면 입력창에 채워져요. 내 말투로 고쳐서 보내도 좋아요.",
    t7Guide: "마지막 인사는 직접 적어보길 권해요.",
    t7FallbackBtn: "막히면 대신 고르기 (앞서 보낸 말)",
    t7HideFallbackBtn: "직접 쓰기로 돌아가기"
  };

  const CLARIFY_UI_TEXT = {
    eyebrow: "대화를 정리하는 중",
    heading: "방금 직접 적어준 말, 어떤 마음에 가장 가까웠나요?",
    description:
      "직접 쓴 문장의 결을 오해하지 않도록 최대 두 문장까지만 여쭤봐요.",
    skipBtn: "건너뛰기",
    progressTemplate: "{current} / {total}"
  };

  const CRISIS_MODAL_TEXT = {
    heading: "혹시 지금 많이 힘든 건 당신 쪽인가요?",
    body:
      "방금 적어주신 말에 마음이 쓰여 대화를 잠시 멈추었어요. 가상의 대화보다 지금 당신의 안전과 평안이 훨씬 더 중요해요. 혼자 감당하기 버거운 밤이라면 아래 전문 상담 창구에 바로 연결해 보세요.",
    contacts: [
      {
        name: "자살예방 상담전화",
        number: "109",
        tel: "109",
        note: "24시간 운영"
      },
      {
        name: "정신건강 위기상담전화",
        number: "1577-0199",
        tel: "1577-0199",
        note: "24시간 운영"
      }
    ],
    continueBtn: "괜찮아요, 대화 이어가기",
    exitBtn: "대화 멈추고 첫 화면으로"
  };

  /**
   * 6가지 위로 유형 정의 (기획안 4장)
   * 가로축:
   *  - stay (곁에 머무는 말): acceptance, companionship, empathy
   *  - lift (일으켜 주는 말): recognition, rest, solution
   */
  const COMFORT_TYPES = {
    recognition: {
      code: "recognition",
      name: "인정형",
      axis: "lift",
      axisLabel: "일으켜 주는 말",
      clarifyLabel: "인정",
      clarifyDesc: "충분히 잘 버텨왔다고 알아주기",
      toFriendQuote: "너 그동안 진짜 잘 버텼어",
      innerChildMetaphor: "칭찬 스티커를 모으듯 스스로를 증명하려 애쓰는 마음",
      neededQuote: "넌 이미 충분히 잘했어",
      summary:
        "힘들어하는 사람 앞에서 그 사람이 버텨온 시간과 애쓴 흔적을 가장 먼저 발견해 주는 편일지 몰라요.",
      detail:
        "누군가 자책할 때 ‘네가 해온 걸 봐’라고 말해주는 사람은, 정작 자기 자신에게는 가장 박한 기준을 들이대곤 해요. 칭찬 스티커를 한 장씩 모으는 아이처럼 뭔가 해내야만 안심하고 있지는 않았나요? 아무 성과가 없는 날에도 당신이 견뎌온 하루는 이미 충분한 의미를 갖고 있어요. 오늘 밤만큼은 남에게 건네던 그 인정을 당신 몫으로 남겨두어도 좋아요."
    },
    rest: {
      code: "rest",
      name: "안식형",
      axis: "lift",
      axisLabel: "일으켜 주는 말",
      clarifyLabel: "안식",
      clarifyDesc: "잠시 멈추고 쉬어도 된다고 해주기",
      toFriendQuote: "아무것도 하지 말고 쉬어",
      innerChildMetaphor: "방의 불을 끄는 것조차 허락받고 싶어 하는 마음",
      neededQuote: "오늘은 여기까지만 해도 돼",
      summary:
        "지친 사람에게 ‘그만 애써도 된다’, ‘푹 쉬어라’라며 멈출 자격을 먼저 내어주는 편일지 몰라요.",
      detail:
        "다른 사람에게는 기꺼이 이불을 덮어주면서, 정작 내 방의 불을 끄는 일에는 죄책감을 느끼기 쉬워요. 쉬는 동안에도 머릿속으로 내일 할 일을 점검하느라 진짜 휴식을 미루어 두었을 수 있어요. 누군가의 허락이 없어도 괜찮아요. 오늘 당신이 감당해야 할 몫은 이미 끝났으니, 이만 스위치를 내려도 아무 일도 일어나지 않아요."
    },
    acceptance: {
      code: "acceptance",
      name: "수용형",
      axis: "stay",
      axisLabel: "곁에 머무는 말",
      clarifyLabel: "수용",
      clarifyDesc: "어떤 모습이든 괜찮다고 안아주기",
      toFriendQuote: "그런 너여도 괜찮아",
      innerChildMetaphor: "실망시키지 않으려 늘 괜찮은 모습을 연기하는 마음",
      neededQuote: "아무것도 안 해도 네가 좋아",
      summary:
        "실수하거나 제자리걸음인 상대에게 ‘그래도 넌 너야’라며 조건 없는 자리를 내어주는 편일지 몰라요.",
      detail:
        "상대의 흔들리는 모습까지 너그럽게 품어주지만, 정작 내가 흔들릴 때는 ‘이러면 미움받지 않을까’ 먼저 검열하곤 해요. 늘 무난하고 괜찮은 사람을 연기하느라 지친 구석이 있을지도 몰라요. 무언가를 잘 해내거나 밝은 얼굴을 하지 않아도, 있는 그대로의 당신을 반가워하는 자리가 분명히 있다는 말을 오늘 당신에게도 돌려주고 싶어요."
    },
    companionship: {
      code: "companionship",
      name: "동행형",
      axis: "stay",
      axisLabel: "곁에 머무는 말",
      clarifyLabel: "동행",
      clarifyDesc: "혼자가 아니라고 곁을 지켜주기",
      toFriendQuote: "내가 옆에 있을게",
      innerChildMetaphor: "창가에서 누군가 먼저 불러주길 조용히 기다리는 마음",
      neededQuote: "나 여기 있어. 어디 안 가",
      summary:
        "해결책보다 ‘혼자 두지 않겠다’는 기척을 먼저 건네며 조용히 곁을 지키는 편일지 몰라요.",
      detail:
        "새벽에도 상대가 외롭지 않게 전화나 대화의 창을 열어두는 사람이지만, 막상 내가 외로울 때는 폐가 될까 봐 연락창을 열었다 닫곤 해요. 창가에서 누군가 먼저 안부를 물어주길 기다리는 마음처럼, 사실은 당신에게도 아무 용건 없이 곁에 머물러 줄 사람이 필요했을 수 있어요. 적어도 오늘 밤, 당신이 자기 자신을 혼자 두지 않았으면 해요."
    },
    empathy: {
      code: "empathy",
      name: "공감형",
      axis: "stay",
      axisLabel: "곁에 머무는 말",
      clarifyLabel: "공감",
      clarifyDesc: "얼마나 힘들었을지 마음을 헤아리기",
      toFriendQuote: "진짜 힘들었겠다",
      innerChildMetaphor: "굳이 말하지 않아도 내 속마음을 알아주길 바라는 마음",
      neededQuote: "그동안 얼마나 힘들었어",
      summary:
        "상대가 미처 다 설명하지 못한 감정의 무게를 먼저 읽고 이름 붙여주는 편일지 몰라요.",
      detail:
        "남의 한숨 속에 담긴 사정은 세심하게 알아채면서, 내 아픔은 ‘다들 이 정도는 겪으니까’ 하고 작게 접어두기 쉬워요. 구구절절 설명하지 않아도 누군가 내 지친 기색을 먼저 알아봐 주기를 바랐던 날들이 있었을 거예요. 다른 사람의 마음을 어루만지느라 뒤로 미뤄둔 당신의 속상함에도, 오늘은 먼저 안부를 물어주세요."
    },
    solution: {
      code: "solution",
      name: "해결형",
      axis: "lift",
      axisLabel: "일으켜 주는 말",
      clarifyLabel: "해결",
      clarifyDesc: "수습할 실마리와 방법을 함께 찾기",
      toFriendQuote: "일단 이것부터 해보자",
      innerChildMetaphor: "기댈 곳 대신 스스로 수습하며 일찍 어른이 된 마음",
      neededQuote: "이제 네가 다 해결 안 해도 돼",
      summary:
        "막막한 상황 앞에서 감정에만 잠기지 않도록 당장 딛고 설 다음 한 걸음을 함께 찾아주는 편일지 몰라요.",
      detail:
        "해결책을 건네는 사람에게 정작 필요한 말은 또 다른 해결책이 아닐 때가 많아요. 문제가 생기면 누구보다 먼저 정신을 차리고 수습하는 역할을 맡아오느라, 힘들다는 말조차 사치처럼 느껴졌을 수 있어요. 모든 매듭을 당신 손으로 다 풀지 않아도 괜찮아요. 오늘 밤만큼은 해결사 역할을 잠시 내려놓고 그냥 지친 채로 머물러도 돼요."
    }
  };

  const TYPE_ORDER = [
    "recognition",
    "rest",
    "acceptance",
    "companionship",
    "empathy",
    "solution"
  ];

  /**
   * 온도의 좌표 — 4분면 정의 (기획안 4장)
   * 가로축: stay(곁에 머무는 말) vs lift(일으켜 주는 말)
   * 세로축: open_side(열림·모름) vs closed_side(닫힘·돌림)
   */
  const QUADRANTS = {
    stay_open: {
      key: "stay_open",
      title: "마주 앉는 사람",
      givingAxis: "곁에 머무는 말",
      receivingAxis: "받는 힘이 열려 있음",
      description:
        "친구의 힘든 마음 옆에 조용히 내려앉으면서도, 내 안의 솔직한 기색이나 망설임을 완전히 숨기지 않는 위치에 있어요. 감정을 주고받는 창이 양쪽으로 열려 있어 깊은 대화가 오가지만, 상대의 감정이 내 안으로 쉽게 스며들어 함께 지칠 수 있으니 대화 뒤에는 내 마음의 경계를 가볍게 털어주는 시간이 도움이 될 수 있어요."
    },
    lift_open: {
      key: "lift_open",
      title: "함께 걷는 사람",
      givingAxis: "일으켜 주는 말",
      receivingAxis: "받는 힘이 열려 있음",
      description:
        "지친 친구가 다시 숨을 고르고 일어설 수 있게 격려하거나 쉼을 권하면서도, ‘너는 어떠냐’는 질문 앞에 내 상태를 솔직히 들여다볼 줄 아는 위치에 있어요. 서로 기대고 부축하며 나아가는 균형감이 있지만, 내가 힘들 때도 습관처럼 괜찮은 해결책부터 찾으려 할 수 있으니 가끔은 답 없는 투정도 스스로에게 허락해 주세요."
    },
    stay_closed: {
      key: "stay_closed",
      title: "혼자 불 켜두는 사람",
      givingAxis: "곁에 머무는 말",
      receivingAxis: "받는 힘이 닫혀 있음",
      description:
        "친구의 밤에는 끝까지 불을 켜두고 곁을 지키면서, 정작 ‘넌 요즘 어때?’라는 물음에는 괜찮다거나 네 얘기를 더 하라며 내 방문을 조용히 닫는 위치에 있어요. 주변에서 ‘잘 들어주는 사람’이라는 말을 자주 듣지만, 대화가 끝난 뒤 가장 외로워지기 쉬운 자리이기도 해요. 내 이야기를 꺼내는 일은 짐을 지우는 게 아니라 관계를 대등하게 만드는 일일지도 몰라요."
    },
    lift_closed: {
      key: "lift_closed",
      title: "앞에서 끌어주는 사람",
      givingAxis: "일으켜 주는 말",
      receivingAxis: "받는 힘이 닫혀 있음",
      description:
        "흔들리는 사람에게 든든한 지지대나 쉼표, 혹은 현실적인 실마리를 건네주지만, 내 몫의 피로는 내색하지 않고 삼키는 위치에 있어요. 기대기 좋은 어른스러운 친구로 보이기 쉽지만, 정작 본인은 어디에도 기대지 못한 채 배터리를 소진하고 있을 수 있어요. 챙기는 역할에서 잠시 내려와도 당신의 가치는 줄어들지 않아요."
    }
  };

  /**
   * 8턴 대화 스크립트 (T0 오프닝 + T1~T7 본 대화, 기획안 5장)
   * 유형 측정 4턴(T1, T2, T3, T5)에 6개 유형이 정확히 2번씩 등장합니다.
   */
  const TURNS = [
    {
      id: "T0",
      time: "02:13",
      role: "opening",
      friendMessages: ["자...?"],
      options: [
        {
          id: "T0_1",
          text: "안 자. 무슨 일 있어?",
          tag: "warm_ask",
          reply: "깨어 있었네... 늦었는데 미안"
        },
        {
          id: "T0_2",
          text: "뭐야 이 시간에 ㅋㅋ",
          tag: "playful",
          reply: "ㅋㅋㅋ 미안 잠이 도저히 안 와서"
        },
        {
          id: "T0_3",
          text: "나도 못 자고 있었어",
          tag: "shared_night",
          reply: "진짜? 다행이다... 아니 못 자면 안 되는데 ㅎㅎ"
        }
      ],
      customReplies: [
        "안 자고 있었구나... 이 시간에 연락해서 미안",
        "답장 진짜 빠르다 ㅎㅎ 깨어 있었어?"
      ]
    },
    {
      id: "T1",
      time: "02:17",
      role: "comfort",
      friendMessages: [
        "나 요즘 진짜 아무것도 못 하겠어",
        "집 오면 그냥 누워만 있어"
      ],
      options: [
        {
          id: "T1_rec",
          type: "recognition",
          text: "너 그동안 진짜 잘 버텼어",
          reply: "잘 버틴 건지 모르겠는데... 네가 그렇게 말해주니까 좀 이상하다"
        },
        {
          id: "T1_rest",
          type: "rest",
          text: "이번 주말은 그냥 푹 쉬어",
          reply: "그럴까... 쉬어도 마음이 안 편해서 문제야 ㅎㅎ"
        },
        {
          id: "T1_comp",
          type: "companionship",
          text: "지금 전화할까? 말 안 해도 돼",
          reply: "전화는 괜찮아 ㅎㅎ 근데 그 말 진짜 고맙다"
        }
      ],
      customReplies: [
        "...그렇게 말해주는 사람이 요즘 너밖에 없다",
        "가만히 읽는데 마음이 조금 놓인다"
      ]
    },
    {
      id: "T2",
      time: "02:21",
      role: "comfort",
      friendMessages: [
        "오늘 회의에서 또 실수했어",
        "나 왜 이 모양이지 진짜"
      ],
      options: [
        {
          id: "T2_acc",
          type: "acceptance",
          text: "실수 좀 하면 어때. 그래도 넌 너야",
          reply: "그렇게 봐주는 사람은 너밖에 없을 듯..."
        },
        {
          id: "T2_emp",
          type: "empathy",
          text: "그래서 오늘 하루 종일 마음이 안 좋았구나",
          reply: "응... 퇴근하고 내내 그 장면만 다시 생각났어"
        },
        {
          id: "T2_sol",
          type: "solution",
          text: "어떤 실수였어? 수습 방법 같이 생각해 보자",
          reply: "큰 사고까진 아닌데... 내일 아침에 다시 정리해 봐야지"
        }
      ],
      customReplies: [
        "ㅎㅎ 잠깐 눈물 날 뻔했어",
        "혼자 곱씹을 때보다 너한테 말하니까 좀 낫다"
      ]
    },
    {
      id: "T3",
      time: "02:25",
      role: "comfort",
      friendMessages: ["다들 잘 사는 것 같은데 나만 제자리인 것 같아"],
      options: [
        {
          id: "T3_rec",
          type: "recognition",
          text: "제자리 아니야. 네가 해온 거 내가 다 봤어",
          reply: "네가 다 봤다는 말 왜 이렇게 뭉클하냐..."
        },
        {
          id: "T3_acc",
          type: "acceptance",
          text: "제자리면 어때. 난 지금의 너도 좋은데",
          reply: "아... 그 말 좀 반칙인데 ㅎㅎ"
        },
        {
          id: "T3_sol",
          type: "solution",
          text: "누구 보고 그런 생각 들었어? 인스타부터 좀 쉬자",
          reply: "맞아 방금도 침대에서 남들 소식 보다가 이랬어..."
        }
      ],
      customReplies: [
        "그 말 캡처해 두고 싶네...",
        "그렇게 말해줘서 고마워 진짜로"
      ]
    },
    {
      id: "T4",
      time: "02:29",
      role: "pushback",
      friendMessages: ["말은 고마운데... 솔직히 잘 와닿지는 않아 ㅎㅎ"],
      options: [
        {
          id: "T4_back",
          reactionType: "step_back",
          text: "그치, 말이 쉽지. 미안",
          reply: "아니야 내가 미안... 괜히 삐딱하게 말했네"
        },
        {
          id: "T4_listen",
          reactionType: "listen",
          text: "그럼 그냥 더 말해 봐. 들을게",
          reply: "그냥... 들어준다는 말 자체가 고맙네"
        },
        {
          id: "T4_reassure",
          reactionType: "reassure",
          text: "그래도 난 진심이야",
          reply: "...알지. 네가 빈말 안 하는 거 알아"
        }
      ],
      customReplies: [
        "...응, 내가 괜히 투정 부렸어",
        "그래도 이렇게 받아줘서 고맙다"
      ]
    },
    {
      id: "T5",
      time: "02:33",
      role: "comfort",
      friendMessages: [
        "미안, 괜히 이런 얘기 해서.",
        "너도 피곤할 텐데"
      ],
      options: [
        {
          id: "T5_rest",
          type: "rest",
          text: "미안해하지 말고 오늘은 그냥 자",
          reply: "응... 이제 진짜 눈 좀 붙여봐야지"
        },
        {
          id: "T5_comp",
          type: "companionship",
          text: "난 네 얘기 듣는 거 좋아. 언제든 연락해",
          reply: "너한테 연락하길 진짜 잘했다..."
        },
        {
          id: "T5_emp",
          type: "empathy",
          text: "그 말 꺼내기까지 많이 참았겠다",
          reply: "...어떻게 알았어. 사실 며칠 고민하다 보낸 거야"
        }
      ],
      customReplies: [
        "역시 너한테 연락하길 잘했다",
        "덕분에 숨이 좀 쉬어진다 고마워"
      ]
    },
    {
      id: "T6",
      time: "02:37",
      role: "receiving",
      friendMessages: [
        "근데 넌? 맨날 내 얘기만 했네.",
        "넌 요즘 어때?"
      ],
      options: [
        {
          id: "T6_closed",
          receivingType: "closed",
          text: "나야 뭐 괜찮지",
          reply: "너 맨날 괜찮다고만 하더라... 무리하진 말고"
        },
        {
          id: "T6_deflect",
          receivingType: "deflect",
          text: "내 얘긴 됐고, 넌 더 없어?",
          reply: "또 내 얘기만 챙기네 ㅎㅎ 알았어"
        },
        {
          id: "T6_unsure",
          receivingType: "unsure",
          text: "글쎄... 잘 모르겠어",
          reply: "그치... 요즘 다들 자기 마음도 잘 모르겠는 때인가 봐"
        }
      ],
      customReplies: {
        open: "그랬구나... 너도 요즘 쉽지 않았네. 말해줘서 고마워",
        closed: "다행이긴 한데... 너도 너무 참지는 마",
        deflect: "맨날 남 걱정만 하지 또 ㅎㅎ 알았어",
        unsure: "맞아... 요즘은 뭐라고 딱 말하기 어려운 밤이 많지"
      }
    },
    {
      id: "T7",
      time: "02:41",
      role: "closing",
      friendMessages: [
        "이제 자야겠다. 고마워.",
        "자기 전에 한마디만 해줄래?"
      ],
      options: [],
      defaultFallbackOptions: [
        {
          id: "T7_fb_rec",
          type: "recognition",
          text: "오늘 하루도 버티느라 정말 고생 많았어. 잘 자"
        },
        {
          id: "T7_fb_rest",
          type: "rest",
          text: "아무 생각 말고 푹 자. 내일 걱정은 내일 하자"
        },
        {
          id: "T7_fb_comp",
          type: "companionship",
          text: "언제든 또 연락해. 내가 옆에 있을게, 잘 자"
        }
      ],
      closingReply: "응... 고마워. 너도 오늘 꼭 푹 자. 잘 자!"
    }
  ];

  const RESULT_UI_TEXT = {
    bridgeTemplate:
      "{friendTopic} 이제 잠들었어요. 그런데 오늘 건넨 말들, 혹시 다른 사람도 듣고 싶어 하지 않았을까요?",
    sharedBannerText:
      "공유 링크로 열람 중인 유형 안내예요. 직접 새벽 대화를 나누면 내가 쓴 문장으로 결과를 받아볼 수 있어요.",
    sharedStartBtn: "나도 답장해 보기",
    returnedEyebrow: "오늘 내가 건넨 말에서 돌아온 문장",
    readAloudPrompt: "오늘 이 말을 스스로에게 소리 내어 읽어주세요.",
    returnedSourceCustom: "내가 직접 적어 보낸 문장이에요",
    returnedSourceEdited: "선택지를 내 말투로 고쳐 보낸 문장이에요",
    returnedSourceChoice: "대화 중 내가 골라 건넨 문장이에요",
    typeEyebrow: "오늘 당신에게도 필요했을지 모를 온도",
    neededHeadlineLabel: "내가 듣고 싶었던 말일지도 몰라요",
    metaphorLabel: "비유로 본 마음의 결",
    secondaryTypeTemplate:
      "함께 드러난 결은 ‘{secondaryName}’이에요. “{secondaryQuote}” 같은 말도 오늘 마음에 닿을 수 있어요.",
    feedbackHeading: "이 해석이 오늘 마음에 닿나요?",
    feedbackYesBtn: "맞는 것 같아요",
    feedbackOtherBtn: "다른 말에 더 끌려요",
    feedbackThanksYes:
      "응답을 기록했어요. 오늘 밤엔 이 문장을 내 몫으로 챙겨두세요.",
    feedbackPickerGuide:
      "지금 내 마음에 가장 필요한 문장을 직접 골라보세요. 선택한 문장에 맞춰 아래 해설도 함께 바뀌어요.",
    feedbackChangedNotice: "내가 직접 다시 고른 문장으로 결과를 바꾸었어요.",
    quadrantEyebrow: "온도의 좌표",
    quadrantSubcopy:
      "건네는 방식과 ‘넌 요즘 어때?’에 답한 방식으로 살펴본 대화의 자리예요. (임의의 온도 숫자는 표시하지 않아요)",
    axisTop: "받는 힘이 열림 (솔직히 꺼냄 · 머무름)",
    axisBottom: "받는 힘이 닫힘 (괜찮다며 넘김 · 화제 돌림)",
    axisLeft: "곁에 머무는 말",
    axisRight: "일으켜 주는 말",
    habitsEyebrow: "오늘 밤의 대화 습관",
    myMessagesSummary: "내가 보낸 답장 다시 보기",
    shareLinkBtn: "유형 결과 링크 복사",
    shareLinkCopied: "유형 코드만 담긴 링크를 복사했어요 (대화 원문·친구 이름 미포함)",
    restartBtn: "처음부터 다시 대화하기",
    eraseBtn: "내 대화 지우기",
    eraseConfirm: "이 기기에 저장된 대화 기록과 결과를 모두 지울까요?",
    erasedNotice: "이 기기에 저장된 대화 기록을 모두 지웠어요.",
    disclaimerTitle: "안내 및 도움받을 곳",
    disclaimerItems: [
      "‘남에게 건네는 위로가 내가 듣고 싶은 말’이라는 관점은 확정된 의학적 사실이 아닌 자기 성찰용 가설입니다. 순수하게 친구에게 그 말이 필요해 보여 건넸을 수도 있습니다.",
      "이 사이트는 진단 도구가 아니며, 작성한 대화와 수정 횟수는 서버로 전송되지 않고 브라우저 안에서만 처리됩니다.",
      "마음이 오래 무겁거나 혼자 버티기 힘들다면 전문가와 이야기해 보세요. 자살예방 상담전화 109 · 정신건강 위기상담 1577-0199 (24시간)"
    ]
  };

  const exported = {
    SITE_META: SITE_META,
    NAME_STEP_TEXT: NAME_STEP_TEXT,
    CHAT_UI_TEXT: CHAT_UI_TEXT,
    CLARIFY_UI_TEXT: CLARIFY_UI_TEXT,
    CRISIS_MODAL_TEXT: CRISIS_MODAL_TEXT,
    COMFORT_TYPES: COMFORT_TYPES,
    TYPE_ORDER: TYPE_ORDER,
    QUADRANTS: QUADRANTS,
    TURNS: TURNS,
    RESULT_UI_TEXT: RESULT_UI_TEXT
  };

  root.WC_SCRIPT = exported;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  }
})(typeof window !== "undefined" ? window : globalThis);
