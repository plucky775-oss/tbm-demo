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

화면은 실제 앱의 스크린샷이며, 이 시연 앱에서 회의록 작성이나 AI 생성 요청을 실행하지 않습니다.

영상은 전송 한도 때문에 video-parts에 분할 저장되며, 배포 시 원본 바이트 그대로 복원하고 SHA-256을 확인합니다. 화질·길이·소리는 변경하지 않았습니다.
