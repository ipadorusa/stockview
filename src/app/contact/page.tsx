import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/page-container"
import { JsonLd } from "@/components/seo/json-ld"
import { buildWebPage } from "@/lib/seo"

export const metadata: Metadata = {
  title: "문의하기",
  description: "StockView 서비스 관련 문의, 오류 신고, 데이터 정정 요청, 광고 제휴 문의 안내.",
  openGraph: {
    title: "문의하기 - StockView",
    description: "StockView 서비스 관련 문의 안내",
  },
}

export default function ContactPage() {
  return (
    <PageContainer>
      <JsonLd data={buildWebPage("문의하기", "StockView 서비스 관련 문의 안내", "/contact")} />
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>문의하기</h1>
        <p>StockView에 대한 문의사항이 있으시면 아래 안내에 따라 연락해 주세요. 문의 유형에 따라 처리 우선순위가 다르므로, 해당하는 유형을 확인 후 연락 부탁드립니다.</p>

        <h2>연락처</h2>
        <ul>
          <li><strong>이메일</strong>: contact@stockview.app</li>
        </ul>

        <h2>문의 유형별 안내</h2>
        <h3>데이터 오류 신고</h3>
        <p>종목 시세, 배당 정보, 실적 데이터 등에 오류가 있는 경우 알려주세요. 종목명(또는 티커)과 함께 어떤 데이터가 잘못되었는지 구체적으로 기재해 주시면 빠른 확인이 가능합니다.</p>

        <h3>서비스 이용 관련 문의</h3>
        <p>회원 가입, 즐겨찾기, 알림 설정 등 서비스 이용 중 불편하신 점이 있으시면 문의해 주세요.</p>

        <h3>AI 리포트 관련 문의</h3>
        <p>AI가 생성한 분석 리포트의 내용에 대한 의견이나 정정 요청은 해당 리포트 URL과 함께 보내주시면 검토 후 반영합니다.</p>

        <h3>광고·제휴 문의</h3>
        <p>광고 게재, 데이터 제휴, 콘텐츠 협업 등의 비즈니스 제안은 이메일로 보내주시면 검토 후 회신드립니다.</p>

        <h3>개인정보 관련 요청</h3>
        <p>개인정보 열람·정정·삭제 요청은 개인정보처리방침에 명시된 절차에 따라 처리됩니다. 요청 시 본인 확인을 위한 정보가 필요할 수 있습니다.</p>

        <h2>응답 안내</h2>
        <ul>
          <li>일반 문의: 영업일 기준 2~3일 이내 회신</li>
          <li>데이터 오류 신고: 확인 후 가능한 빠르게 반영</li>
          <li>긴급 서비스 장애: 확인 즉시 처리</li>
        </ul>

        <h2>자주 묻는 질문</h2>
        <h3>StockView 데이터는 실시간인가요?</h3>
        <p>StockView는 정기적 크론 작업으로 데이터를 수집하므로 실시간 데이터가 아닙니다. 시세 지연은 수분에서 수십 분 발생할 수 있습니다.</p>

        <h3>종목 추천을 해주나요?</h3>
        <p>StockView는 투자 참고용 정보 제공 서비스이며, 특정 종목에 대한 투자 권유나 추천을 하지 않습니다.</p>

        <h3>AI 리포트의 정확도는 어느 정도인가요?</h3>
        <p>AI 리포트는 기술적 지표와 공개 데이터를 기반으로 생성되며, 오류를 포함할 수 있습니다. 전문적인 투자 조언을 대체하지 않으므로 참고용으로만 활용해 주세요.</p>

        <h3>무료 서비스인가요?</h3>
        <p>네, StockView의 모든 기능은 무료로 제공됩니다.</p>

        <h3>회원 탈퇴는 어떻게 하나요?</h3>
        <p>설정 페이지에서 회원 탈퇴를 진행할 수 있으며, 탈퇴 시 모든 개인 데이터(즐겨찾기, 설정 등)가 즉시 삭제됩니다.</p>
      </article>
    </PageContainer>
  )
}
