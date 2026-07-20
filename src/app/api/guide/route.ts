import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import type { GuideRequest } from "@/lib/types";
import { distanceKo } from "@/lib/geo";

export const maxDuration = 60;

const MODEL = "anthropic/claude-sonnet-5";

const SYSTEM = `당신은 "뉴욕 나들이"의 따뜻하고 친절한 개인 여행 안내원입니다.
뉴저지에 사시는 한국 어르신들이 뉴욕을 편안하게 구경하실 수 있도록 돕습니다.

말투와 규칙:
- 항상 존댓말을 쓰고, 어르신을 "어르신"이라고 부르며 공손하게 안내합니다.
- 쉬운 한국어로, 짧고 또렷한 문장을 사용합니다. 어려운 영어 단어는 한국어로 풀어 설명하고 필요하면 괄호로 영어를 덧붙입니다.
- 답변은 소리 내어 읽어드릴 것이므로, 3~5문장 정도로 간결하게 말합니다. 목록보다는 자연스러운 이야기체로 안내합니다.
- 지금 계신 위치와 주변 정보를 바탕으로만 안내하고, 확실하지 않은 것은 지어내지 않습니다.
- 길 안내를 할 때는 방향(예: 북쪽)과 대략의 거리(예: 100미터)를 함께 알려드립니다.
- 안전과 편안함을 우선합니다. 필요하면 가까운 화장실, 쉴 곳, 지하철역을 함께 알려드립니다.`;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as GuideRequest;

  if (!process.env.AI_GATEWAY_API_KEY) {
    return NextResponse.json({
      text:
        "안내원 기능을 사용하려면 설정이 필요합니다. (AI_GATEWAY_API_KEY 가 아직 준비되지 않았습니다.) " +
        "그동안에도 근처 명소와 맛집 찾기는 사용하실 수 있습니다.",
      configured: false,
    });
  }

  const nearbyText =
    body.nearby && body.nearby.length > 0
      ? body.nearby
          .map(
            (p) =>
              `- ${p.name} (${p.kind === "restaurant" ? "식당" : "명소"}, ${
                p.bearing ?? ""
              } ${p.distanceMeters != null ? distanceKo(p.distanceMeters) : ""})`,
          )
          .join("\n")
      : "(주변 장소 정보 없음)";

  const question =
    body.question && body.question.trim().length > 0
      ? body.question.trim()
      : "지금 제가 있는 곳이 어디인지, 무엇을 구경하면 좋을지 알려주세요.";

  const prompt = `[어르신의 현재 위치]
좌표: 위도 ${body.coords.lat}, 경도 ${body.coords.lng}
주소: ${body.locationLabel ?? "(확인 중)"}

[주변에서 확인된 장소]
${nearbyText}

[어르신의 질문]
${question}`;

  try {
    const { text } = await generateText({
      model: MODEL,
      system: SYSTEM,
      prompt,
    });
    return NextResponse.json({ text, configured: true });
  } catch (err) {
    console.error("guide error", err);
    return NextResponse.json(
      {
        text: "죄송합니다. 지금은 안내를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
        configured: true,
      },
      { status: 502 },
    );
  }
}
