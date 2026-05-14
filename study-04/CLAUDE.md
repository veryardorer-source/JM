# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

`study-04`는 OpenRouter API를 사용하는 AI 관련 프로젝트입니다. 현재 초기 단계입니다.

## 환경 변수

`.env` 파일에 `OPENROUTER_API_KEY`가 설정되어 있습니다.
- OpenRouter API 엔드포인트: `https://openrouter.ai/api/v1`
- OpenAI 호환 포맷을 사용합니다 (Authorization: Bearer 헤더)

## 관련 프로젝트 (상위 디렉토리)

이 저장소는 여러 study 프로젝트를 포함합니다:
- `todolist/app/` — React 18 + Vite + Tailwind 할일관리 웹앱 (메인 프로젝트)
- `character/app/` — Next.js 앱
- `study-03/`, `study-05/` — 기타 학습 프로젝트
