import React, {useEffect, useState} from 'react';
import SubHeader from '../components/SubHeader';
import TabMenu from '../components/TabMenu';
import '../styles/academy.css';

function Academy() {
  const [pageName, setPageName] = useState('');
  const [descName, setDescName] = useState('');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [activeTab, setActiveTab] = useState('academy');

  useEffect(() => {
    const title = '아카데미 소개';
    setPageName(title);
    document.title = title;
    const descName = '본주짓수는 다양한 지역에서 활동하고 있습니다.';
    setDescName(descName);
    const backgroundImage = '/images/bon_academy_back@3x.png';
    setBackgroundImage(backgroundImage);
  }, []);

  // TabMenu에서 호출되는 탭 클릭 핸들러
  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  // 아카데미 소개 컨텐츠
  const renderAcademyContent = () => (
      <>
        <h1>아카데미 소개</h1>

        <h2>본주짓수 설립과 성장</h2>
        <p className="info-box">
          "본주짓수는 히카르도 딜라하바 선생님께 블랙벨트로 인정을 받은 이정우 대표가 한국에 설립한 단체입니다. 본주짓수는 국내에
          브라질리안 주짓수를 발전시키는 데 이바지하였으며, 국내 다양한 단체와 동반 성장, 인재 양성 등 지역 사회적 책임과 성장을
          함께 추구하고 있습니다."
        </p>

        <h3>본주짓수 프로그램</h3>
        <p>
          현재 50개 지역에서 80여 명의 지도자들이 하루 평균 3,000명 이상의 학생들에게 특별한 경험을 전달하며 올바른
          도장으로
          성장하고 있습니다. 해외 전문 기관 교육에 견주어도 부족함 없는 체계적인 시스템을 자랑하며, 최고의 프로그램을 만들기 위해
          매년
          새롭게 리뉴얼하고 있습니다.
        </p>

        <h4>체계적인 커리큘럼</h4>
        <p className="highlight-box">
          본주짓수 지도자들은 학생들이 만족스러운 움직임을 할 수 있도록 고민을 멈추지 않으며, 수년간의 경험을 통해 입증된 기술만을
          교육합니다. 효율적인 기술 연습과 안전하게 배우고 익힐 수 있는 환경을 조성하며, 개개인의 실력 향상과 목표에 도달할 수
          있도록
          지원합니다.
        </p>
      </>
  );

  // 브라질리언 주짓수란 컨텐츠
  const renderJiujitsuContent = () => (
      <>
        <h1>브라질리언 주짓수란?</h1>
        <p className="jiujitsu-intro">
          주짓수는 무사들이 최후의 상황에서 생존하기 위해 사용하던 방법이었습니다. 그 당시 전투가 벌어지면 원거리에서는 활을
          사용했으며, 근거리에서는 창이나 칼 등 다양한 무기를 사용했습니다. 무기마저도 사용할 수 없는 절체절명의 상황에서 육박전을
          벌였는데 이미 단단한 갑옷을 착용한 무사들에게는 치고, 차는, 타격 기술이 그다지 효과적이지 못하다는 것을 수많은 전투를 통해
          스스로 깨닫게 됩니다. 그렇게 생존과 제압을 위한 수단으로 목을 조르거나 신체의 각 관절을 꺾어 더 공격할 수 없게 해야만
          했습니다. 그러한 기술들이 비전으로 대대로 내려오게 된 것이 바로 브라질리안 주짓수입니다.
        </p>

        <p>
          주짓수를 브라질에 처음 전수해준 인물이 바로 '콘데 코마'로 불리던 "마에다 미쯔요"입니다. "마에다 미쯔요"는 고류 유술과
          유도를 강도관의 수장 "가노 지고로(근대 유도를 체계화시킨 사람)"로부터 전수 하였습니다. 그 뒤 그 위대한 실전 무술을
          알리기 위해 전 세계를 돌며 수많은 실전 대결을 펼쳤으며 무패를 기록했습니다. 그리고 마지막으로 정착한 곳 브라질의 항구 도시
          벨렝에서 카를로스 그레이시에겐 전수하게 됩니다. 카를로스는 당시 그의 형제들에게 실전 무술 즉 주짓수를 전수하게 됩니다. 그
          중 막내 동생 엘리오 그레이시는 약한 사람도 충분히 생존할 수 있고 상대를 제압할 수 있도록 주짓수를 재구성하게 됩니다.
        </p>

        <p className="jiujitsu-intro">
          1925년 세계 최초로 리오 데 자네이로에 주짓수 아카데미가 개관되었고 이때부터 주짓수는 학생들에게 지도를 통해 그리고 실전
          대결을 통해 본격적으로 알려지게 됩니다. 1993년 미국에서 무규칙 격투기 대회인 UFC가 개최되었고 그 대회에서 마르고 약해
          보이는 주짓수 선수가 연속해서 우승하며 전 세계에 알려지기 시작했습니다. 이후 수많은 주짓수 주특기 가던 선수들이 종합 격투기
          대회에서 지속적으로 좋은 성적을 거두게 되면서 전 세계에 주짓수(브라질 유술)가 전파되었습니다. 그러하여 경기 규칙과 승급
          인증 시스템을 포함, 관리 운영하는 공식적인 총괄 조직의 설립과 함께 체계적인 브라질리안 주짓수의 새대가 시작되었습니다.
        </p>
      </>
  );

  // 대표 인삿말 컨텐츠
  const renderGreetingContent = () => (
      <div className="greeting-content">
        <h1>대표 인삿말</h1>
        <p>
          본주짓수는 국내 생활체육 문화를 선도하는 이정우 대표가 운영하는 브라질리안 주짓수 전문 교육기관입니다.

          2006년 안산주짓수클럽이라는 이름으로 아카데미 운영을 시작하여 17년의 주짓수, 주류 분야 노하우와 기술력을 바탕으로
          성장하고 있는 브라질리언 주짓수 아카데미입니다.

          미래를 준비하는 창의적인 생각, 남들보다 한발 더 나아가는 열정, 건강한 주짓수 문화를 만드는 정직한 인재를 길러내기 위한
          인간중심의 교육이념을 지향합니다. 최고의 지도진이 저희 학생들의 잠재력을 최대한 발휘하도록 이끌어 줄 것입니다.

          다년간의 경험을 통해 효과가 입증된 기술을 이해하기 쉽게 지도하고, 가장 경쟁력 있는 커리큘럼을 만들어 학생들이 꾸준히
          성장하도록 이끌 것입니다. 더 나아가 대한민국을 넘어 글로벌하게 인정받는 브라질리언 주짓수 전문 교육기관으로 지속 성장하도록
          항상 노력하겠습니다.
        </p>
        <p className="greeting-signature">
          감사합니다.
        </p>
      </div>
  );

  // 승급 시스템 안내 컨텐츠
  const renderLevelContent = () => (
      <>
        <h1>승급 시스템 안내</h1>
        <p className="highlight-box">
          본주짓수 지도자는 경험, 노력, 기술을 고려하여 모든 학생을 동등하게 평가합니다.
          학생들은 벨트에 승급되기 위해 이 세가지 요소를 골고루 잘 수행해야 합니다.

          경험을 위해 기술 연습에 소요된 일수를 확인하며, 각 단계에 충족될 때마다 그라우(Grau)를 갑합니다.
          그라우의 수는 개인이 노력한 부분을 의미합니다.

          시험 참가 여부와 관계없이 경기 규칙을 숙지하고 경기력을 입증하면 벨트 승급이 이루어집니다.
          벨트별로 필요한 기술과 움직임이 충족되었는지도 평가합니다.
        </p>
        <h2>브라질리언 주짓수 벨트 시스템</h2>
        <p>
          "브라질리언 주짓수는 체계적인 벨트 시스템을 통해 실력과 경험을 평가합니다.
          각 벨트는 단순히 기술적 능력뿐만 아니라 인성, 출석률, 스파링 능력 등을 종합적으로 고려하여 승급됩니다."
        </p>

        <h3>아이들을 위한 벨트 색상</h3>
        <p className="kids-belt-section">
          그레이벨트 (4~15세)

          옐로우벨트 (7~15세)

          오렌지벨트 (10~15세)

          그린벨트 (13~15세)
        </p>

        <h4 className="white-belt">화이트벨트</h4><br/>
        <p>
          처음 시작할 때 착용하는 첫 번째 벨트입니다.
          초급자는 주짓수에 대한 기본적인 원리와 움직임을 배웁니다.
          15세 미만의 경우 벨트 승급 기준이 16세 이상과 다르므로 이 경우 모두 시작점은 화이트벨트입니다.
          기술 연습에 소요된 일수를 확인하며, 각 단계에 충족될 때마다 그라우(Grau)를 갑합니다.
          1그라우부터 4그라우까지 총 4단계의 레벨이 있습니다.
        </p>

        <p className="belt-requirements">
          <strong className="blue-belt">블루벨트를 달성하기 위한 요구 사항</strong><br/>
          연습일 : 200일 이상

          교육기간 : 최소 1년 8개월 이상

          기술 요구 사항 : 초급자 커리큘럼 이수
        </p>

        <h4 className="blue-belt">블루벨트</h4>
        <p>
          "고브라질리언 주짓수의 첫 번째 단계는 블루벨트인 것입니다.
          초급자 커리큘럼을 습득하여 중급자가 되기 위한 시작입니다.
          블루벨트에서 퍼플벨트까지의 기간은 블루벨트를 제대로, 가장 다양한 경험을 하는 시기입니다.
        </p>

        <p className="belt-requirements">
          <strong className="purple-belt">퍼플벨트를 달성하기 위한 요구 사항</strong><br/>
          연습일 : 200일 이상

          교육기간 : 최소 1년 8개월 이상

          기술 요구 사항 : 초급자 커리큘럼을 이수하고 중급자 커리큘럼 시작
        </p>

        <h4 className="purple-belt">퍼플벨트</h4>
        <p>
          브라질리언 주짓수 벨트 체계에서 가장 중요한 시기입니다.
          초급자 커리큘럼을 높은 수준으로 이수 후 중급 커리큘럼에 대한 지식을 가지고 있습니다.
          자신의 세밀한 부분을 효율적인 기술로 연구하고 반복하도록 노력합니다.
        </p>

        <p className="belt-requirements">
          <strong className="brown-belt">브라운벨트를 달성하기 위한 요구 사항</strong><br/>
          연습일 : 200일 이상

          교육기간 : 최소 1년 8개월 이상

          기술 요구 사항 : 중급 커리큘럼 이수 후 상급 커리큘럼 시작
        </p>

        <h4 className="brown-belt">브라운벨트</h4>
        <p>
          브라질리언 주짓수의 전문가로 간주하는 벨트입니다.
          중급자 커리큘럼을 높은 수준으로 이수 후 상급 커리큘럼에 대한 지식을 가지고 있습니다.
          도복 착용과 비도복 (Gi / No-Gi) 전반적인 기술의 이해도가 있어야 합니다.
        </p>

        <p className="belt-requirements">
          <strong className="black-belt">블랙벨트를 달성하기 위한 요구 사항</strong><br/>
          연습일 : 220일 이상

          교육기간 : 최소 1년 이상

          기술 요구 사항 : 상급 커리큘럼 이수
        </p>

        <h4 className="black-belt">블랙벨트</h4>
        <p>
          브라질리언 주짓수 최상위에 속하는 최상위 벨트입니다.
          모든 상황에서 이길 수 있도록 꾸준한 연구와 연습이 필요합니다.
          이제부터 시합과 팀을 위한 활동이 함께 이루어집니다.
        </p>
      </>
  );

  // 현재 활성 탭에 따라 컨텐츠 렌더링
  const renderContent = () => {
    switch (activeTab) {
      case 'introJiujitsu':
        return renderJiujitsuContent();
      case 'introGreeting':
        return renderGreetingContent();
      case 'introLevel':
        return renderLevelContent();
      default:
        return renderAcademyContent();
    }
  };

  return (
      <div className="academy">
        <SubHeader pageName={pageName} descName={descName}
                   backgroundImage={backgroundImage}/>
        <div className='academy_container'>
          <TabMenu activeTab={activeTab} onTabClick={handleTabClick}/>
          <div className='academy_content'>
            {renderContent()}
          </div>
        </div>
      </div>
  );
}

export default Academy;