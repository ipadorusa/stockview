import type { Metadata } from "next"
import { PageContainer } from "@/components/layout/page-container"
import { JsonLd } from "@/components/seo/json-ld"
import { buildWebPage } from "@/lib/seo"

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "StockView 개인정보처리방침. 수집하는 개인정보 항목, 이용 목적, 보유 기간, 제3자 제공 등을 안내합니다.",
}

export default function PrivacyPage() {
  return (
    <PageContainer>
      <JsonLd data={buildWebPage("개인정보처리방침", "StockView 개인정보처리방침", "/privacy")} />
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1>개인정보처리방침</h1>
        <p>StockView(이하 &quot;서비스&quot;)는 이용자의 개인정보를 중요시하며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 본 개인정보처리방침은 서비스가 수집하는 개인정보의 항목, 수집 목적, 보유 및 이용 기간, 제3자 제공 등에 관한 사항을 안내합니다.</p>

        <h2>1. 수집하는 개인정보 항목</h2>
        <p>서비스는 회원가입 및 서비스 이용 과정에서 아래와 같은 개인정보를 수집합니다.</p>
        <ul>
          <li><strong>필수 항목</strong>: 이메일 주소, 비밀번호(암호화 저장)</li>
          <li><strong>자동 수집 항목</strong>: 접속 IP, 접속 일시, 브라우저 정보, 쿠키</li>
        </ul>

        <h2>2. 개인정보 수집 목적</h2>
        <ul>
          <li>회원 식별 및 서비스 제공 (관심종목 관리, 설정 저장)</li>
          <li>서비스 이용 통계 분석 및 개선</li>
          <li>광고 게재 및 맞춤형 콘텐츠 제공</li>
        </ul>

        <h2>3. 보유 및 이용 기간</h2>
        <p>이용자의 개인정보는 서비스 탈퇴 시 또는 수집 목적 달성 시 지체 없이 파기합니다. 단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.</p>
        <ul>
          <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
          <li>접속 기록: 3개월</li>
        </ul>

        <h2>4. 제3자 제공</h2>
        <p>서비스는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우 예외로 합니다.</p>
        <ul>
          <li><strong>Google AdSense</strong>: 광고 게재를 위해 쿠키 기반 정보가 Google에 전달될 수 있습니다.</li>
          <li><strong>Google Analytics / GTM</strong>: 서비스 이용 통계 분석을 위해 비식별 데이터가 수집됩니다.</li>
          <li>법률에 의해 요구되는 경우</li>
        </ul>

        <h2>5. 쿠키 사용 안내</h2>
        <p>서비스는 이용자 경험 개선 및 광고 제공을 위해 쿠키를 사용합니다.</p>
        <ul>
          <li><strong>필수 쿠키</strong>: 로그인 세션 유지, 서비스 기본 기능에 필요</li>
          <li><strong>분석 쿠키</strong>: Google Analytics를 통한 사이트 이용 통계</li>
          <li><strong>광고 쿠키</strong>: Google AdSense를 통한 맞춤형 광고 제공</li>
        </ul>
        <p>이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으며, 페이지 하단의 &quot;쿠키 설정&quot;을 통해 동의를 관리할 수 있습니다.</p>

        <h2>6. Google 광고 기술 개인정보 정책</h2>
        <p>서비스는 Google AdSense를 통해 광고를 게재합니다. Google은 광고 제공을 위해 쿠키를 사용하며, 이에 대한 자세한 내용은{" "}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">
            Google 광고 기술 개인정보 정책
          </a>
          에서 확인할 수 있습니다.
        </p>
        <p>이용자는{" "}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">
            Google 광고 설정
          </a>
          에서 맞춤 광고를 비활성화할 수 있습니다.
        </p>

        <h2>7. 이용자 권리</h2>
        <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다.</p>
        <ul>
          <li>개인정보 열람, 정정, 삭제 요청</li>
          <li>개인정보 처리 정지 요청</li>
          <li>회원 탈퇴를 통한 개인정보 파기 요청</li>
        </ul>
        <p>위 요청은 서비스 내 설정 페이지 또는 아래 연락처를 통해 가능합니다.</p>

        <h2>8. 개인정보 보호책임자</h2>
        <ul>
          <li><strong>책임자</strong>: StockView 운영팀</li>
          <li><strong>이메일</strong>: privacy@stockview.app</li>
        </ul>

        <h2>9. 시행일</h2>
        <p>본 개인정보처리방침은 2026년 3월 22일부터 시행됩니다.</p>
      </article>
    </PageContainer>
  )
}
