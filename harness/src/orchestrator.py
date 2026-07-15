"""
프로젝트명: 범용 데이터 수집/분석/배포 통합 오케스트레이터 (Orchestrator Tool)
파일 역할: 정찰, 데이터 크롤링, 시각화 분석(EDA), 전처리 변환, 빌드 및 타입 검증을 총괄 제어하는 로컬 파이프라인 CLI 엔진입니다.
작성자: Antigravity AI
생성일: 2026-07-15
"""

import os
import sys
import subprocess
import argparse

def checkDependencies() -> bool:
    """
    파이프라인 가동에 필수적인 Node.js, Python 패키지들의 정상 작동 여부를 사전에 확인합니다.
    """
    try:
        # Node 및 npm 점검
        subprocess.run(["node", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        subprocess.run(["npm", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("🚨 오류: 로컬 시스템에 Node.js 또는 npm이 설치되어 있지 않거나 환경 변수에 누락되었습니다.")
        return False

def runScraper(target_script: str) -> bool:
    """
    데이터 크롤링 및 API 스니핑 파이썬 수집기를 실행합니다.
    """
    print(f"\n[1단계] 수집기 실행 개시: {target_script}")
    if not os.path.exists(target_script):
        print(f" ❌ 오류: 수집기 스크립트 파일이 경로에 존재하지 않습니다: {target_script}")
        return False
        
    try:
        result = subprocess.run([sys.executable, target_script], check=True)
        if result.returncode == 0:
            print(" ✅ 수집 단계가 성공적으로 완수되었습니다.")
            return True
    except Exception as e:
        print(f" ❌ 수집 실패 예외 발생: {e}")
    return False

def runAnalyzer(target_script: str) -> bool:
    """
    pandas 가공 및 matplotlib 시각화 EDA 스크립트를 구동합니다.
    """
    print(f"\n[2단계] 분석 및 시각화 엔진 가동: {target_script}")
    if not os.path.exists(target_script):
        print(f" ❌ 오류: 시각화 분석 엔진 스크립트가 존재하지 않습니다: {target_script}")
        return False
        
    try:
        result = subprocess.run([sys.executable, target_script], check=True)
        if result.returncode == 0:
            print(" ✅ EDA 분석 및 시각화 이미지 출력이 성공적으로 완료되었습니다.")
            return True
    except Exception as e:
        print(f" ❌ 시각화 분석 실패 예외 발생: {e}")
    return False

def runPreprocess(target_script: str) -> bool:
    """
    CSV에서 정형화된 JSON 에셋으로 변환 전처리를 진행합니다.
    """
    print(f"\n[3단계] 데이터 전처리(CSV -> JSON) 파이프라인 구동: {target_script}")
    if not os.path.exists(target_script):
        print(f" ❌ 오류: 전처리 스크립트가 존재하지 않습니다: {target_script}")
        return False
        
    try:
        result = subprocess.run([sys.executable, target_script], check=True)
        if result.returncode == 0:
            print(" ✅ 데이터 전처리 및 프론트엔드 에셋 배치가 완료되었습니다.")
            return True
    except Exception as e:
        print(f" ❌ 데이터 전처리 실패 예외 발생: {e}")
    return False

def runBuildAndValidate(project_dir: str) -> bool:
    """
    대시보드 웹앱의 TypeScript 컴파일 오류 여부 및 최종 Vite 프로덕션 빌드 무결성을 검증합니다.
    """
    print(f"\n[4단계] 대시보드 TypeScript 컴파일 및 빌드 무결성 검증: {project_dir}")
    if not os.path.exists(os.path.join(project_dir, "package.json")):
        print(f" ❌ 오류: {project_dir} 경로 내에 package.json이 존재하지 않습니다.")
        return False
        
    try:
        # npm install (의존성 동기화)
        print("  - 의존성 패키지 동기화(npm install) 실행...")
        subprocess.run(["npm", "install"], cwd=project_dir, check=True, stdout=subprocess.DEVNULL)
        
        # npm run build (tsc 타입 검사 및 Vite 빌드 실행)
        print("  - 프로덕션 컴파일(npm run build) 무결성 체크 실행...")
        result = subprocess.run(["npm", "run", "build"], cwd=project_dir, check=True)
        if result.returncode == 0:
            print(" ✅ TypeScript 타입 체크 및 프로덕션 빌드 번들링이 에러 없이 무결하게 성공했습니다!")
            return True
    except Exception as e:
        print(f" ❌ 빌드 검증 실패 예외 발생: {e}")
    return False

def main() -> None:
    """
    CLI 인자를 분석하여 범용 파이프라인 단계를 오케스트레이션합니다.
    """
    parser = argparse.ArgumentParser(description="범용 데이터 수집/분석/배포 파이프라인 오케스트레이터 CLI")
    parser.add_argument("--scraper", help="수집기(scraper.py) 파일 경로")
    parser.add_argument("--analyzer", help="분석기(eda.py) 파일 경로")
    parser.add_argument("--converter", help="데이터 전처리(convert_data.py) 파일 경로")
    parser.add_argument("--dashboard", help="프론트엔드 대시보드 프로젝트 루트 디렉터리 경로")
    
    args = parser.parse_args()
    
    print("====================================================")
    print(" 🚀 통합 데이터 오케스트레이터 가동 (Orchestration)")
    print("====================================================")
    
    if not checkDependencies():
        sys.exit(1)
        
    success = True
    
    # 1. 크롤러 동작
    if args.scraper:
        if not runScraper(args.scraper):
            success = False
            
    # 2. EDA 이미지/리포트 생산
    if success and args.analyzer:
        if not runAnalyzer(args.analyzer):
            success = False
            
    # 3. 데이터 프론트엔드 포맷 전처리
    if success and args.converter:
        if not runPreprocess(args.converter):
            success = False
            
    # 4. 타입 체크 및 빌드 최종 검증
    if success and args.dashboard:
        if not runBuildAndValidate(args.dashboard):
            success = False
            
    print("\n====================================================")
    if success:
        print(" 🎉 [축하합니다] 전체 파이프라인 무결성 검증을 통과했습니다!")
        print("    코드를 안전하게 커밋하고 푸시하셔도 좋습니다.")
        sys.exit(0)
    else:
        print(" 🚨 [경고] 파이프라인 중 오류가 감지되었습니다. 에러 로그를 수정하세요.")
        sys.exit(1)

if __name__ == "__main__":
    main()
