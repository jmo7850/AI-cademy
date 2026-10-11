# Catalog and verification

What the course catalog contains, how credential types are kept apart, and which facts are verified.

## Catalog and verification status

### Content totals (from [BUILD_REPORT.md](BUILD_REPORT.md))
- 42 catalog entries.
- 10 study courses with 19 lessons, 105 original practice questions and 43 flashcards.
- Questions come in 6 formats: single choice, multiple choice, true/false, fill-in (text or numeric), order and match.
- Every option has its own `why` explanation.
- All lessons, explanations and questions are original. They are labelled as practice and are never official exam questions.

### Study courses (`src/data/curriculum/index.ts`)
- Vendor-neutral: AI Foundations, Developer Foundations, LLM App Engineering, Local LLMs, Career Readiness.
- Exam prep: AWS AI Practitioner (AIF-C01), AWS Cloud Practitioner (CLF-C02), Microsoft Azure AI Fundamentals (AI-901), Google Generative AI Leader, NVIDIA NCA-GENL.
- NCA-GENL has 12 questions across all 5 published domains, weighted 30/14/22/24/10.

### Credential classes
1. Official professional certification
2. Official foundational certification
3. Professional certificate program
4. Provider course completion certificate or badge
5. Vendor skill credential or microcredential
6. Independent learning assessment
7. Portfolio project
8. Learning resource (no credential stated)

Classes 3 and 8 were added in the course-expansion update.

### Providers in the catalog
- **Claude Academy:** 12 entries.
- **AWS:** AI Practitioner, Cloud Practitioner, and Skill Builder learning.
- **Microsoft:** AI-901 and Applied Skills. The Foundry agents credential is available; the Copilot Studio agents credential is **retired** and labelled as such.
- **Google Cloud:** Generative AI Leader, Cloud Digital Leader, and Introduction to Generative AI.
- **Google (non-Cloud):** the AI Professional Certificate ($49/month on Coursera) and AI Essentials.
- **OpenAI Academy:** Apply AI at Work and Build with AI. Both are filed as learning resources, because OpenAI mentions no certificate.
- **AMD:** three free AI Academy paths and the free ROCm Certified Associate. AMD calls it a certification, but the page does not say the exam is proctored, so it is filed as a vendor skill credential.
- **NVIDIA:** NCA-GENL, NCA-GENM and NCA-AIIO at $125 each, NCP-GENL at $200, and the free DLI courses.
- **App content:** the app's own curricula and the projects.

### Verification
- All official facts were read on the official pages on **2026-10-10**.
- The app flags an entry "Needs re-check" after 90 days, which is **2027-01-08**. A learner can mark a re-check from any entry page.
- The source URLs are listed in the README under "Data sources and accuracy".

**Still unverified, and labelled that way in the app:**
- Claude Academy per-course price and badge terms.
- AWS Cloud Practitioner Essentials duration and cost (the page needs sign-in).
- AI-901 price, duration and renewal (region-dependent or not shown).
- Applied Skills assessment cost.
- Google Generative AI Leader domain weights. The simulator uses equal weights and says so.
- OpenAI Academy cost and duration.
- AMD per-path completion certificates, and whether the ROCm exam is proctored.
- Which NVIDIA DLI free courses give a certificate.
- Question counts for NVIDIA exams other than NCA-GENL.
- Google AI Professional Certificate total hours. Eight one-hour courses is an inference, and Google's FAQ also says seven.

**Not listed yet:** AMD's announced ROCm Professional and Expert levels.

Study-time figures for certifications are app estimates and are labelled as such.
