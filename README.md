# Ovi 

Bridging the gap between you and your clinician to improve and destigmatize menstrual health.

## What it does

Ovi tracks your menstrual cycle while also predicting your follicular, luteal, and ovulatory phases. It takes months worth of data and creates a detailed analysis highlighting symptoms and flagging potential health risks to connect early with healthcare providers.
**Track**: The home calendar shows logged and predicted periods, and it can color each day by cycle phase (menstrual, follicular, ovulation, luteal). Our egg mascot gives phase-specific tips and jokes. The daily log records flow, mood, symptoms, and notes. The History page charts period and cycle lengths over time.
**Understand**: The Insights page runs three kinds of analysis on the user’s own logs:
- Pattern flags: rule-based checks for irregular cycles, long gaps, heavy and painful periods, and cramps outside the period.
- PCOS and endometriosis pattern checks: each shows a similarity level and lists exactly what raised or lowered it.
- Plain-language summary: Gemini turns those findings into a short, readable summary.
**Learn**: An Info page explains PCOS, endometriosis, and menopause and perimenopause in plain language.
**Share**: One tap generates a clean PDF report of the user’s raw data to bring to a clinician. It covers period and cycle lengths, symptom frequency, flow by day, and self-reported habits, and it deliberately leaves out our analysis.

Ovi never diagnoses. It flags early patterns that can be worth discussing with a doctor.

## How to start program in terminal

| PCOS Data | Header 2 | Header 3 |
| -------- | -------- | -------- |
| python3 -m pip install -r requirements.txt | cd backend | cd frontend |
| python3 train_pcos.py data/PCOS_data_without_infertility.xls | export "\[Google AI Studio API Key\]"| npx expo start |
| python3 seed.py | uvicorn main:app --reload --host 0.0.0.0 |  |
