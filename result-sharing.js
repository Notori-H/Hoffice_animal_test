/* Office Animal Test: sharing, nickname, and summary PNG card add-on */
(function () {
  "use strict";

  const EVENT_PAGE_URL = "https://hyundaideptgroup.sharepoint.com/sites/eventpage";
  const HTML2CANVAS_URL = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
  let participantName = "";

  const css = `
    #shareCardStage{position:fixed;left:-10000px;top:0;width:720px;pointer-events:none}
    .share-card{position:relative;width:720px;min-height:1040px;overflow:hidden;padding:58px 58px 52px;color:#292522;background:radial-gradient(circle at 10% 5%,#fff2da 0,transparent 32%),radial-gradient(circle at 95% 22%,#e5f7f4 0,transparent 30%),#fffdf8;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif}
    .share-card::before{content:"";position:absolute;top:24px;right:28px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.55)}
    .share-card-header{position:relative;z-index:1;text-align:center}
    .share-card-eyebrow{color:#ff7658;font-size:18px;font-weight:900;letter-spacing:.12em;text-transform:uppercase}
    .share-card-type{display:inline-block;margin-top:18px;padding:9px 18px;border-radius:999px;color:#fff;font-size:18px;font-weight:900}
    .share-card-character{position:relative;z-index:1;height:335px;margin:20px auto 5px;display:flex;align-items:center;justify-content:center}
    .share-card-character img{max-width:430px;max-height:325px;object-fit:contain;filter:drop-shadow(0 18px 18px rgba(55,42,30,.14))}
    .share-card-emoji{font-size:210px;line-height:1}
    .share-card-owner{position:relative;z-index:1;text-align:center;font-size:20px;font-weight:850;color:#7c7067;margin:4px 0 7px}
    .share-card-name{position:relative;z-index:1;margin:3px 0 10px;text-align:center;font-size:48px;font-weight:950;letter-spacing:-.05em}
    .share-card-tagline{position:relative;z-index:1;max-width:570px;margin:0 auto 30px;text-align:center;font-size:24px;font-weight:850;line-height:1.55;letter-spacing:-.025em;word-break:keep-all;overflow-wrap:break-word}
    .share-card-box{position:relative;z-index:1;margin-top:17px;padding:23px 25px;border:1px solid rgba(125,102,82,.12);border-radius:22px;background:rgba(255,255,255,.82)}
    .share-card-box-title{margin-bottom:9px;font-size:17px;font-weight:900}
    .share-card-box-text{color:#554e48;font-size:18px;line-height:1.65;letter-spacing:-.015em;word-break:keep-all;overflow-wrap:break-word}
    .share-card-centralization{border-color:rgba(255,118,88,.2);background:#fff1eb}
    .share-card-centralization .share-card-box-title{color:#d95d42}
    .share-card-footer{position:relative;z-index:1;margin-top:28px;color:#9b9188;text-align:center;font-size:14px;font-weight:700}
    .result-owner{text-align:center;font-size:18px;font-weight:850;color:#7c7067;margin:0 0 18px}
    .event-btn{color:#51483e;background:#f5efe6}
    .shared-notice{max-width:560px;margin:0 auto 28px;padding:16px 18px;border:1px solid #ffd5c8;border-radius:18px;color:#7c4938;background:#fff4ef;text-align:center;font-size:14px;line-height:1.7}
    .actions .btn{min-width:180px}
    @media(max-width:600px){.actions{display:grid;grid-template-columns:1fr}.actions .btn{width:100%}}
  `;

  function installUi() {
    if (!document.getElementById("resultSharingStyles")) {
      const style = document.createElement("style");
      style.id = "resultSharingStyles";
      style.textContent = css;
      document.head.appendChild(style);
    }
    if (!document.getElementById("shareCardStage")) {
      const stage = document.createElement("div");
      stage.id = "shareCardStage";
      document.body.appendChild(stage);
    }
  }

  function getResultUrl(type) {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("type", type);
    if (participantName) url.searchParams.set("name", participantName);
    return url.toString();
  }

  function findSection(result, keyword) {
    return result.sections.find(function (section) {
      return section.title.includes(keyword);
    });
  }

  function cleanText(text) {
    return String(text || "").replace(/[“”]/g, "").replace(/\s+/g, " ").replace(/✔/g, "").trim();
  }

  function shorten(text, length) {
    const value = cleanText(text);
    return value.length <= length ? value : value.slice(0, length).trim() + "…";
  }

  function buildShareCard(type) {
    installUi();
    const result = DATA.results[type];
    const stage = document.getElementById("shareCardStage");
    if (!result || !stage) return null;

    const personality = findSection(result, "당신은 이런 사람이에요");
    const closing = findSection(result, "당신을 위한 한 줄");
    const centralization = findSection(result, "문서중앙화");
    const personalityText = personality && personality.paragraphs.length ? personality.paragraphs[0] : result.animalQuote;
    const centralizationText = closing && closing.paragraphs.length
      ? closing.paragraphs.join(" ")
      : centralization && centralization.paragraphs.length
        ? centralization.paragraphs[0]
        : "정보가 함께 연결될수록 업무는 더 편리해집니다.";

    stage.innerHTML = "";
    const card = document.createElement("div");
    card.className = "share-card";

    const header = document.createElement("div");
    header.className = "share-card-header";
    const eyebrow = document.createElement("div");
    eyebrow.className = "share-card-eyebrow";
    eyebrow.textContent = "Office Animal Test";
    const badge = document.createElement("div");
    badge.className = "share-card-type";
    badge.style.background = result.color;
    badge.textContent = result.mbti;
    header.append(eyebrow, badge);
    card.appendChild(header);

    const character = document.createElement("div");
    character.className = "share-card-character";
    const image = document.createElement("img");
    image.src = result.image;
    image.alt = result.name + " 캐릭터";
    image.onerror = function () {
      character.innerHTML = "";
      const fallback = document.createElement("div");
      fallback.className = "share-card-emoji";
      fallback.textContent = result.emoji;
      character.appendChild(fallback);
    };
    character.appendChild(image);
    card.appendChild(character);

    if (window.participantName) {
  const owner =
    document.createElement("div");

  owner.className =
    "share-card-owner";

  if (
    window.testMode ===
    "leader_prediction"
  ) {
    owner.textContent =
      window.participantName +
      "님의 예측 결과";
  } else {
    owner.textContent =
      window.participantName +
      "님의 결과";
  }

  card.appendChild(owner);
}

    const name = document.createElement("div");
    name.className = "share-card-name";
    name.textContent = result.emoji + " " + result.name;
    card.appendChild(name);

    const tagline = document.createElement("div");
    tagline.className = "share-card-tagline";
    tagline.textContent = "“" + cleanText(result.tagline) + "”";
    card.appendChild(tagline);

    function addBox(title, text, extraClass) {
      const box = document.createElement("div");
      box.className = "share-card-box" + (extraClass ? " " + extraClass : "");
      const boxTitle = document.createElement("div");
      boxTitle.className = "share-card-box-title";
      boxTitle.textContent = title;
      const boxText = document.createElement("div");
      boxText.className = "share-card-box-text";
      boxText.textContent = text;
      box.append(boxTitle, boxText);
      card.appendChild(box);
    }

    addBox("나는 이런 유형이에요", shorten(personalityText, 130), "");
    addBox("문서중앙화가 도와주는 방식", "“" + shorten(centralizationText, 115) + "”", "share-card-centralization");

    const footer = document.createElement("div");
    footer.className = "share-card-footer";
    footer.textContent = "문서중앙화로 알아보는 나의 업무 동물 유형";
    card.appendChild(footer);
    stage.appendChild(card);
    return card;
  }

  function loadHtml2Canvas() {
    if (typeof window.html2canvas === "function") return Promise.resolve();
    return new Promise(function (resolve, reject) {
      const existing = document.querySelector('script[data-html2canvas="true"]');
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = HTML2CANVAS_URL;
      script.dataset.html2canvas = "true";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  window.saveShareCard = async function (type) {
    try {
      await loadHtml2Canvas();
      const result = DATA.results[type];
      const card = buildShareCard(type);
      if (!result || !card) throw new Error("카드 생성 실패");
      const images = Array.from(card.querySelectorAll("img"));
      await Promise.all(images.map(function (img) {
        if (img.complete) return Promise.resolve();
        return new Promise(function (resolve) {
          img.onload = resolve;
          img.onerror = resolve;
        });
      }));
      const canvas = await window.html2canvas(card, {
        backgroundColor: "#fffdf8",
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: 720,
        height: card.scrollHeight,
        windowWidth: 720,
        windowHeight: card.scrollHeight
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png", 1);
      link.download = "업무동물테스트_" + type + "_" + result.name + ".png";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("결과 이미지 저장 오류:", error);
      alert("결과 이미지를 저장하지 못했어요. 네트워크 연결을 확인해주세요.");
    }
  };

  window.shareResult = async function (type) {
    const resultUrl = getResultUrl(type);
    try {
      await navigator.clipboard.writeText(resultUrl);
      alert("결과 공유 링크를 복사했어요!");
    } catch (error) {
      prompt("아래 결과 링크를 복사하세요.", resultUrl);
    }
  };

  window.goToEventPage = function () {
    window.location.href = EVENT_PAGE_URL;
  };

  window.startTest = function () {
    const enteredName = window.prompt("결과에 표시될 이름을 입력해주세요.\n\n(닉네임 가능)\n※ 🎁 결과 공유 이벤트 참여 시 실명 입력 권장", "");
    if (enteredName === null) return;
    participantName = enteredName.trim().slice(0, 20);
    window.participantName = participantName;
    if (!participantName) {
      alert("닉네임을 입력해야 테스트를 시작할 수 있어요.");
      return;
    }
    idx = 0;
    answers = [];
    resultSaved = false;
    window.history.replaceState({}, "", window.location.origin + window.location.pathname);
    show("quiz");
    renderQ();
  };

  window.finish = function () {
    const scores = { E: 0, I: 0, N: 0, S: 0, T: 0, F: 0, J: 0, P: 0 };
    DATA.questions.forEach(function (q, i) {
      scores[answers[i] === "a" ? q.av : q.bv]++;
    });
    const tie = {
      EI: answers[3] === "a" ? "E" : "I",
      NS: answers[7] === "a" ? "N" : "S",
      TF: answers[11] === "a" ? "F" : "T",
      JP: answers[15] === "a" ? "P" : "J"
    };
    function pick(a, b, axis) {
      return scores[a] === scores[b] ? tie[axis] : scores[a] > scores[b] ? a : b;
    }
    const type = pick("E", "I", "EI") + pick("N", "S", "NS") + pick("T", "F", "TF") + pick("J", "P", "JP");
    window.history.replaceState({}, "", getResultUrl(type));
    window.renderResult(type, scores, false);
    show("result");
    saveResult(type);
  };

  window.renderResult = function (type, scores, sharedResult) {
    const r = DATA.results[type];
    if (!r) {
      alert("결과 정보를 찾지 못했습니다: " + type);
      return;
    }
    const sections = r.sections.map(function (s) {
      let body = "";
      if (s.title.includes("추천하는 활용법")) {
        const items = s.paragraphs.join("\n").split(/\n|✔/).map(function (x) { return x.trim(); }).filter(Boolean);
        body = "<ul>" + items.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
      } else {
        body = s.paragraphs.map(function (x) { return "<p>" + esc(x) + "</p>"; }).join("");
      }
      return '<div class="section"><h3>' + esc(s.title) + "</h3>" + body + "</div>";
    }).join("");

    let notice = "";
    let buttons = "";
    if (sharedResult) {
      notice = '<div class="shared-notice">공유받은 업무 동물 유형이에요.<br>결과를 확인하고 내 유형도 직접 찾아보세요!</div>';
      buttons = '<div class="actions"><button type="button" class="btn primary" onclick="startTest()">나도 참여하기</button></div>';
    } else {
      buttons = '<div class="actions">' +
        '<button type="button" class="btn ghost" onclick="saveShareCard(\'' + type + '\')">결과 카드 저장</button>' +
        '<button type="button" class="btn primary" onclick="shareResult(\'' + type + '\')">동료에게 결과 공유하기</button>' +
        '<button type="button" class="btn event-btn" onclick="goToEventPage()">이벤트 페이지 돌아가기</button>' +
        "</div>";
    }

    const resultBody = document.getElementById("resultBody");
    resultBody.innerHTML = notice;

    if (participantName) {
      const ownerTitle = document.createElement("div");
      ownerTitle.className = "result-owner";
      ownerTitle.textContent = participantName + "님의 결과";
      resultBody.appendChild(ownerTitle);
    }

    const head = document.createElement("div");
    head.className = "resultHead";
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.style.background = r.color;
    badge.textContent = r.mbti;
    const visual = document.createElement("div");
    visual.className = "visual";
    const image = document.createElement("img");
    image.src = r.image;
    image.alt = r.name + " 캐릭터";
    image.onerror = function () {
      visual.innerHTML = "";
      const fallback = document.createElement("div");
      fallback.className = "emojiFallback";
      fallback.textContent = r.emoji;
      visual.appendChild(fallback);
    };
    visual.appendChild(image);
    const title = document.createElement("h1");
    title.textContent = r.emoji + " " + r.name;
    const tagline = document.createElement("p");
    tagline.className = "tagline";
    tagline.textContent = "“" + r.tagline + "”";
    const quote = document.createElement("div");
    quote.className = "quote";
    quote.textContent = r.animalQuote;
    head.append(badge, visual, title, tagline, quote);
    resultBody.appendChild(head);
    resultBody.insertAdjacentHTML("beforeend", sections + buttons);
  };

  function openSharedResultFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const value = params.get("type");
    if (!value) return;
    const type = value.toUpperCase();
    if (!DATA.results[type]) return;
    const sharedName = params.get("name");
    participantName = sharedName ? sharedName.trim().slice(0, 20) : "";
    window.renderResult(type, null, true);
    show("result");
  }

  installUi();
  openSharedResultFromUrl();
})();
