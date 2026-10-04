# Power TBM · BIXPO 시연

실제 앱 화면으로 설명하는 전시용 시연 앱입니다.

## 설명 순서
소개 → 안전회의 → 서명·회의록 → 안전가이드 → 현장도구·응급의료시설 → AI 안전교육(Safety 4-Cut) → 마무리

이전·다음으로 진행하며, 접어두는 발표 멘트, 화면 확대, 교육영상 전체 재생을 지원합니다. Safety 4-Cut은 파워TBM의 AI 안전교육 기능으로 소개합니다.

## 실행
먼저 `node scripts/restore-video.cjs`로 원본 영상을 복원합니다.

`python3 -m http.server 8080 --directory public` 실행 후 http://localhost:8080 에 접속합니다.

## Vercel 배포
Framework Preset: Other / Build Command: `node scripts/restore-video.cjs` / Output Directory: public

공종·작업자·건강/보호구·위험요인·서명은 실제 TBM UI를 재사용하는 `/exhibit.html`과 연결합니다. 이전·다음을 누르면 해당 단계가 열리고, 프레임을 유지해 입력값이 남습니다. 처음으로 버튼은 체험 데이터를 초기화합니다.

AI 안전교육 입력은 TBM의 `/safety-toons/exhibit.html` 경로로 연결합니다. 파일 선택과 현장조건을 체험할 수 있지만 파일을 서버로 전송하거나 유료 AI 생성을 실행하지 않습니다. AI 검토, PDF, 보관함, 생성 결과는 준비된 예시로 설명합니다.

`직접 체험 / 예시 화면`으로 전환할 수 있으며 10초 동안 연결 확인이 없으면 기존 이미지로 돌아갑니다. 실제 앱의 일반 로그인·운영 데이터와 전시 체험은 분리되어 있습니다. TBM 및 toons 저장소의 exhibit 파일이 먼저 배포되어야 직접 체험이 열립니다.

영상은 전송 한도 때문에 video-parts에 분할 저장되며, 배포 시 원본 바이트 그대로 복원하고 SHA-256을 확인합니다. 화질·길이·소리는 변경하지 않았습니다.
