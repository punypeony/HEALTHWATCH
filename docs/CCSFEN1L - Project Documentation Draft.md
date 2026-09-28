# **CCSFEN1L – INTRODUCTION TO SOFTWARE ENGINEERING** **Project Documentation**

**GROUP INFORMATION:a**  
**PROJECT TITLE:** Health Watch: A Food Consumption Health Monitoring System for Dependent Relatives 

**Group Name:** Alt Epsteins  
**Section:** COM244  
**Project Members:**

| No. | Name | Assigned Role |
| :---: | ----- | ----- |
| 1 | Santiago, Martin B.  | Project Manager / Developer / Database Designer |
| 2 | Salgado, Joseph Paolo C. | System Analyst / Developer / UI/UX Designer |
| 3 | Bacabac, Adrid T. | Developer / Documentation Specialist |
| 4 | Oredina, Reyah Shane V. | Quality Assurance Tester / Documentation Specialist |
| 5 | Villavicencio, Yvonne C. | UI/UX Designer / Documentation Specialist |

# **TABLE OF CONTENTS**

1. Project Overview   
2. Problem Statement   
3. Project Objectives   
4. Scope and Limitations   
5. Requirements   
6. System Modeling and Design   
7. System Architecture   
8. Database Design   
9. User Interface Design   
10. System Implementation   
11. Transaction Processing   
12. Software Testing   
13. Challenges and Solutions   
14. Conclusion   
15. References   
16. Appendices 

# **1\. PROJECT OVERVIEW**

Family caregivers are increasingly asked to perform tasks once handled by trained health workers, including preparing special diets for the people they care for. This pattern is well documented in the Philippine study *Ageing and Health in the Philippines*, conducted by Cruz et al. (2019). This study found that long-term care for elderly family members is handled almost entirely by family and kin rather than trained professionals, with only 5% of caregivers reporting that they had received any formal caregiving training, even though many of those they cared for had chronic conditions such as hypertension and diabetes. This shows that diet management is not a small or occasional duty for caregivers; it is a common and demanding part of everyday caregiving.

The proposed system, **Health Watch**, is a mobile application built to support this specific need. It allows a caregiver to manage the dietary needs of one or more dependents, such as elderly parents or relatives with health conditions, from a single application. The core function is simple: the caregiver scans a food item's barcode, and the system checks that food against the dependent's personal nutrition limits and medical conditions, then reports whether the food is safe, a warning, or dangerous, along with the reason.

This kind of application is supported by existing research on digital health tools. A systematic review and meta-analysis of dietary mobile applications used by adults with chronic diseases found that these applications function as effective self-monitoring tools and produce measurable improvements in nutrition-related outcomes, particularly weight loss (Fakih El Khoury et al., 2019). Similarly, an observational study on mobile health applications for chronic disease management reported that a large share of daily and weekly users experienced improvements in blood glucose levels, weight, and adherence to dietary recommendations (Spinean et al., 2025). These findings support the idea that a mobile, scan-based diet monitoring tool can produce real, practical benefits for users managing chronic conditions.

The intended users of the system are caregivers: family members or guardians responsible for the diet of a dependent relative, especially one with a condition such as diabetes or hypertension, or one who is very young or elderly. Upon completion, the system will let a caregiver register dependents, automatically calculate each dependent's personal nutrition targets, scan barcodes to check food safety in real time, and review a history of scanned meals, alerts, and weekly summaries.

# **2\. PROBLEM STATEMENT**

Managing food choices for individuals with special health needs can be challenging, especially when their nutritional requirements vary depending on their health conditions and personal needs. Caregivers who manage the diets of these dependents face the recurring challenge of determining whether a specific food is safe and appropriate for a specific person. This decision can depend on several factors, including age, weight, medical conditions, allergies, and individual daily nutrient limits. When caring for multiple dependents with different needs, caregivers may have to repeatedly remember, calculate, or compare these limits when shopping for or preparing food.

Research on caregiving confirms that this kind of task is a genuine source of strain. Interviews with family carers conducted as part of a United Kingdom medication management study found that carers experienced stress linked to gaps in information, and described burdens such as ambiguity, unfamiliarity, and being expected to cope without adequate support (Lawson et al., 2021). In the Philippine study *Ageing and Health in the Philippines*, conducted by Cruz et al. (2019), almost all family caregivers of older adults were found to have no formal training in caregiving at all, and a significant share reported leaving paid work entirely once they took on the caregiving role. Although these studies focus on caregiving broadly rather than diet specifically, they point to the same underlying issue: family caregivers are frequently left to manage complex health-related tasks with little guidance, and diet management carries a similar risk for error.

At the same time, most nutrition guidance is written for the general population rather than tailored to an individual's condition. Global health guidance sets sodium limits at less than 2,000 milligrams per day for adults (World Health Organization, 2012\) and free sugar limits at less than 10% of total daily energy intake, with additional benefit from reducing this further to below 5% (World Health Organization, 2015). These are population-wide averages; they do not account for a dependent's specific age, weight, or conditions such as diabetes or hypertension, which typically require even lower limits. A caregiver reading a nutrition label has no easy way to translate general guidance like this into a clear yes-or-no answer for a specific relative, at the moment they are deciding whether to buy or serve a food. Thus, there is currently no simple, personal tool that automatically compares a scanned food item against an individual dependent's computed daily limits, allergies, and conditions, and gives the caregiver an immediate, understandable answer.

---

The study aims to develop a food consumption health monitoring system that can help caregivers assess whether food products are appropriate for their dependent relatives based on their dietary information, allergies, and medical conditions. 

SOP 1-5 questions

# **3\. PROJECT OBJECTIVES**

**3.1 General Objective**  
To design and develop a mobile application that helps caregivers manage multiple dependents and determine, at the point of scanning, whether a specific food item is safe for a specific dependent, based on that dependent's personal health profile.  
**3.2 Specific Objectives**

1. To **Design** a food consumption monitoring system that allows caregivers to manage individual health profiles for each dependent, including their age, weight, height, allergies, and medical conditions, such as diabetes and hypertension.  
2. To **Develop** a barcode scanning feature that identifies food products and retrieves their nutritional information.   
3. To **Implement** a function that automatically computes each dependent's daily sodium, sugar, and calorie targets using established nutrition guidance, reducing these targets appropriately when specific conditions are present, rather than relying on a single generic limit for all users.  
4. To **Integrate** the Open Food Facts API, PostgreSQL database, and locally trained Decision Tree model to process food information and generate risk classifications.   
5. To **Evaluate** the system's functionality and classification performance in identifying whether scanned food products are **Safe, Warning, or Danger** for a dependent. 

# **4\. SCOPE AND LIMITATIONS**

**4.1 Scope**

* The system will allow a single caregiver account to register and manage multiple dependents, each with a separate profile and scan history.  
* The system will automatically calculate daily nutrition targets for sodium, sugar, and calories using standard formulas, adjusted for age band and for the presence of diabetic or hypertensive conditions, in line with World Health Organization (2012, 2015\) guidance.  
* The system will retrieve nutrition data for scanned products from the Open Food Facts database, an open and freely accessible source of food product information.  
* The system will classify each scanned product as safe, warning, or danger using a locally trained decision tree model, and will explain the classification in plain language.  
* The system will maintain a history of scanned meals, generate alerts for risky food items, and produce a weekly summary of eating patterns for each dependent.  
* The system will include an offline demo mode using a small, fixed set of sample products, to support demonstrations without depending on live internet access.
* The caregiver can type `spaghetti` or `adobo`. Those two names use a local FNRI table. They are not looked up on Open Food Facts.
* The caregiver can mark a scan as eaten and enter grams. Daily intake sums only those meals. The weekly summary still counts every scan.
* Optional conditions are Diabetic, Hypertension, High cholesterol, and Kidney disease. A dependent can be saved with none of them checked.

**4.2 Limitations**

* The decision tree still classifies from sodium, sugar, calories, an allergy flag, a condition-conflict flag, and age band. Carbohydrate, saturated fat, and protein are hard rules for the matching condition. They are not tree features, and the saved model was not retrained.
* Saturated fat is read only for high cholesterol, carbohydrate only for diabetic, and protein only for kidney disease. A missing value fails the scan only when that box is checked. Fiber is not a danger rule. The protein danger rule applies at age 12 or older and uses 1.3 g per kg of body weight per day. It does not apply to children, and there is no dialysis flag or disease stage.
* The only typed dishes are `spaghetti` and `adobo`. Any other name is not found. Adobo has no saturated-fat value, and neither dish has carbohydrate or protein, so those condition checks reject the dish instead of storing zero.
* The system does not use Optical Character Recognition or a camera model to identify a plated meal. A barcode still has to be in Open Food Facts, or in the offline demo file when demo mode is on.
* The system is a support tool, not a medical device. It does not provide medical diagnoses and is not a substitute for professional advice from a doctor or registered dietitian.
* The risk assessment is produced by a simple decision tree plus the hard rules above, not a full clinical evaluation. Reported test accuracy on the synthetic holdout is 92.90%. That figure is not clinical validation.

# 

# **5\. REQUIREMENTS**

**5.1 Target Users and Stakeholders**

| User/Stakeholder | Description |
| ----- | ----- |
| Caregiver  | The main user of the app. Adds and manages dependents, scans food items, and views alerts and summaries.  |
| Dependent  | The person being cared for (e.g., an elderly relative or a child with a health condition) does not use the app directly; their health data is managed by the caregiver. |
| \[Stakeholder\] | \[Description\] |

**5.2 Functional Requirements**  
*List the major functions of the system.*

|  | Description |
| :---: | ----- |
| FR-01 | The system shall allow a caregiver to register and log in with an email and a password. The implemented account does not have a separate username. |
| FR-02 | The system shall allow a caregiver to add, edit, and manage multiple dependents, each with their own profile (age, height, weight, sex, allergies, and conditions).  |
| FR-03 | The system shall automatically compute a dependent's daily sodium, sugar, and calorie targets whenever their profile is created or updated.  |
| FR-04 | The system shall allow a caregiver to scan a food product's barcode and retrieve its nutrition information.  |
| FR-05 | The system shall compare a scanned food's nutrition data against a dependent's targets, allergies, and conditions, and classify it as safe, warning, or danger.  |
| FR-06 | The system shall save every scan as a meal log entry linked to the correct dependent.  |
| FR-07 | The system shall generate an alert whenever a scanned food is classified as warning or danger.  |
| FR-08 | The system shall let a caregiver view a dependent's meal history and alerts.  |
| FR-09 | The system shall generate a weekly summary of a dependent's eating pattern based on their scan history.  |
| FR-10 | The system shall accept the dish names spaghetti and adobo and run the same classification, meal-log, and alert steps used for a barcode. |
| FR-11 | The system shall let the caregiver record grams eaten, and shall report daily intake from those meals only. |

**5.3 Non-Functional Requirements**

| Quality | Requirement |
| ----- | ----- |
| Performance | The course target is a food-safety result within 3 seconds after a barcode is scanned, under normal network conditions. The implemented Open Food Facts client uses a 10-second timeout. That 3-second line has not been measured for live lookups. |
| Security | The system shall only allow a caregiver to view or edit the profiles and data of their own registered dependents. |
| Usability | The system shall display safe, warning, and danger as readable text. History rows use a distinct fill for each label. |
| Reliability | The system shall continue to function in offline demo mode using saved sample products, and the two typed dishes, if there is no internet connection. |

**5.4 Business Rules**  
*List the rules that govern how the system operates.*

1. A caregiver can only view and manage dependents that they personally registered.  
2. Every dependent's daily nutrition targets must be calculated by the system; caregivers cannot enter these values manually.  
3. A food item is automatically marked as "danger" if it contains an ingredient matching one of the dependent's listed allergies, regardless of other nutrition values.  
4. Every scan result, whether safe, warning, or danger, must be saved to the dependent's meal history for record-keeping.
5. A new scan is not eaten until the caregiver confirms a gram amount. Daily intake uses those confirmed meals. The weekly summary still counts every scan.

**5.5 Requirements Gathering**  
*Indicate the method/s used to gather requirements.*  
*☐ Interview*  
*☐ Observation*  
*☐ Questionnaire*  
*☐ Document Analysis*  
*☐ Other: \_\_\_\_\_\_\_\_\_\_\_*

**Brief Description:**  
\[Explain how the requirements were gathered.\]

# **6\. SYSTEM MODELING AND DESIGN**

*Include the appropriate UML diagrams required for the project.*

The diagrams below match the running routes. The same figures are maintained in [diagrams.md](diagrams.md). There is no class diagram in the repository.

**6.1 Use Case Diagram**

The caregiver is the only actor. Register and login are public. Later cases use the JWT.

```mermaid
flowchart TD
  caregiver[Caregiver]
  caregiver --> registerLogin[Register / Login]
  caregiver --> manageDependents[Manage Dependents]
  caregiver --> scanFood[Scan Food or Typed Dish]
  caregiver --> viewHistory[View History]
  caregiver --> viewAlerts[View Alerts]
  caregiver --> acknowledgeAlerts[Acknowledge Alerts]
  caregiver --> weeklySummary[View Weekly Summary]
  caregiver --> confirmEaten[Confirm grams eaten]
  caregiver --> dailyIntake[View Daily Intake]
```

**6.2 Activity Diagram**

```mermaid
flowchart TD
  scanned[Barcode, or spaghetti or adobo]
  scanned --> validate[Validate the one lookup and the dietary profile]
  validate --> fetchProduct[Fetch barcode product or local dish]
  fetchProduct --> percentages[Calculate percentages]
  percentages --> checks[Check allergies and conditions]
  checks --> hardRule{Allergy match or condition conflict over half the target?}
  hardRule -->|yes| dangerLabel[Label danger]
  hardRule -->|no| decisionTree[Decision tree prediction]
  dangerLabel --> mealLog[Save meal log]
  decisionTree --> mealLog
  mealLog --> alert{Warning or danger?}
  alert -->|yes| createAlert[Create alert]
  alert -->|no| noAlert[Leave alert empty]
  createAlert --> result[Return result]
  noAlert --> result
```

An allergy match, or a condition conflict above half the matching target, is danger before the tree. Warning and danger create an alert. The meal starts uneaten.

**6.3 Class Diagram**

No class diagram has been drawn for this repository. The request and table models are `backend/app/schemas.py` and `backend/app/models.py`.

**6.4 Sequence Diagram**

```mermaid
sequenceDiagram
  participant Mobile
  participant FastAPI
  participant FoodLookup as Food Lookup
  participant Source as Open Food Facts, Demo Data, or Dishes
  participant Classifier as Risk Classifier
  participant PostgreSQL

  Mobile->>FastAPI: POST /dependents/{id}/scan with JWT
  FastAPI->>PostgreSQL: Load dependent owned by the token
  PostgreSQL-->>FastAPI: Dependent and dietary profile
  alt dish name
    FastAPI->>FoodLookup: resolve_dish
    FoodLookup->>Source: Read dishes.json
  else DEMO_MODE true
    FastAPI->>FoodLookup: fetch_product(barcode)
    FoodLookup->>Source: Read demo_products.json
  else Cached barcode
    FastAPI->>FoodLookup: fetch_product(barcode)
    FoodLookup->>PostgreSQL: Read scanned_products
  else Cache miss
    FastAPI->>FoodLookup: fetch_product(barcode)
    FoodLookup->>Source: GET Open Food Facts product JSON
    FoodLookup->>PostgreSQL: Insert scanned_products
  end
  FoodLookup-->>FastAPI: Name, calories, sodium, sugar, raw response
  FastAPI->>Classifier: predict_risk
  Classifier-->>FastAPI: safe, warning, or danger, plus reasons
  FastAPI->>PostgreSQL: Insert meal log and alert when needed
  FastAPI-->>Mobile: Scan result JSON
``` 

# **7\. SYSTEM ARCHITECTURE**

*Present the overall architecture of the system.*

```mermaid
flowchart TD
  expo[Expo Mobile]
  api[FastAPI]
  db[PostgreSQL]
  off[Open Food Facts]
  dishes[Local dishes.json]
  expo --> api
  api --> db
  api --> off
  api --> dishes
```

The phone is Expo and React Native. FastAPI loads the decision tree in process and talks to PostgreSQL 16. Open Food Facts is used only for a live barcode lookup. Typed dishes and demo mode stay on local files. Detail is in [ARCHITECTURE.md](ARCHITECTURE.md).

# **8\. DATABASE DESIGN**

**8.1 Entity Relationship Diagram**

Caregiver accounts own dependents. Each dependent has one dietary profile. Meal logs point at a cached product. Alerts point at a meal log. Summaries are one row per dependent and week start. `meal_logs.eaten` and `meal_logs.grams_eaten` record a confirmed amount. The full diagram is in [database.md](database.md).

```mermaid
erDiagram
    users ||--o{ dependents : owns
    dependents ||--|| dietary_profiles : has_current
    dependents ||--o{ meal_logs : records
    scanned_products ||--o{ meal_logs : references
    dependents ||--o{ alerts : receives
    meal_logs ||--o{ alerts : causes
    dependents ||--o{ summaries : summarizes
```

**8.2 Database Tables**

| Table | Purpose |
| ----- | ----- |
| users | Caregiver name, unique email, and password hash |
| dependents | Owned person: age, height, weight, and sex |
| dietary_profiles | Allergies, conditions, and computed calorie, sodium, and sugar targets |
| scanned_products | Cached barcode or dish nutrition, including the raw JSON |
| meal_logs | One scan: risk label, reasons, eaten flag, and grams eaten |
| alerts | Warning or danger message, active or acknowledged |
| summaries | Templated weekly sentence for one dependent and week start |

# **9\. USER INTERFACE DESIGN**

*Include screenshots or prototypes of the major system interfaces.*  
**9.1 Login Page**  
\[Insert screenshot\]

**9.2 Dashboard**  
\[Insert screenshot\]

**9.3 Transaction Page**  
\[Insert screenshot\]

**9.4 Other Major Interfaces**  
\[Insert screenshots\]

# **10\. SYSTEM IMPLEMENTATION**

*Briefly describe how the system was developed.*

**10.1 Development Tools and Technologies**

| Tool/Technology | Purpose |
| ----- | ----- |
| Python, FastAPI, SQLAlchemy, Pydantic | API, validation, and database access |
| PostgreSQL 16 | Application database, through Docker |
| scikit-learn Decision Tree, joblib | Local risk classifier |
| Expo, React Native, TypeScript | Caregiver phone app |
| pytest | Backend tests |

**10.2 Major System Features**

1. Register, login, and JWT ownership of dependents.
2. Computed calorie, sodium, and sugar targets, plus condition checks for hypertension, diabetic, high cholesterol, and kidney disease.
3. Barcode scan through Open Food Facts or offline demo products, and typed lookup for spaghetti and adobo.
4. Meal history, alerts, weekly summary, eaten grams, and daily intake. 

# **11\. TRANSACTION PROCESSING**

*Describe the major transactions of the system.*

Each major transaction should generally demonstrate:  
**Input → Validation → Processing → Database Update → Confirmation/Output**

**Transaction 1: Food scan**

**Input:**  
A barcode of 8–14 digits, or the dish name spaghetti or adobo, for one owned dependent.

**Validation:**  
The JWT caregiver must own the dependent. The body must contain exactly one lookup. A dietary profile must exist. Required nutrition must be present. A condition nutrient is required only when that condition is checked.

**Processing:**  
Percentages, allergy match, condition conflicts, then the local decision tree when no hard rule forces danger.

**Database Update:**  
One transaction stores or reuses the product, inserts a meal log with eaten false, and inserts an alert when the label is warning or danger.

**Confirmation/Output:**  
The phone shows safe, warning, or danger, the reasons, and calories, sodium, and sugar. Saturated fat, carbohydrate, or protein appears only when that value was checked and is above half its target.

**Screenshot:**  
Not inserted in this file.

**Transaction 2: Confirm eaten amount**

**Input:**  
Meal log id and grams greater than zero.

**Validation:**  
The meal must belong to a dependent owned by the JWT caregiver.

**Processing:**  
The grams are stored and the meal is marked eaten.

**Database Update:**  
`meal_logs.eaten` becomes true and `grams_eaten` is set. Daily intake on the next read includes that meal. The weekly summary already counted the scan.

**Confirmation/Output:**  
The meal response returns the id, eaten true, grams, and risk label.

# **12\. SOFTWARE TESTING**

**12.1 Test Plan**

Backend business logic is tested with pytest against PostgreSQL. The mobile project is typechecked with `npx tsc --noEmit`. The offline demo is the barcode script in [DEMO_SCRIPT.md](DEMO_SCRIPT.md).

**12.2 Test Cases and Results**

| Test Case ID | Feature/Transaction | Expected Result | Actual Result | Status |
| ----- | ----- | ----- | ----- | ----- |
| TC-01 | Demo barcodes on Demo Hypertension | `2000000000015` safe, `2000000000022` warning, `2000000000039` danger | Covered by the scan tests and the demo script | Pass in the scan suite |
| TC-02 | Typed dishes | spaghetti and adobo classify; any other name is not found; adobo with high cholesterol is invalid | Covered by the dish scan tests | Pass when those tests were run |
| TC-03 | Decision tree holdout | Test accuracy at least 90% | 92.90% in [MODEL_EVALUATION.md](MODEL_EVALUATION.md) | Pass |
| TC-04 | Daily intake carbohydrate limit | API limit matches the unrounded formula inside the default approx tolerance | The API returns 305.66 and the formula is 305.6625 | Fail, see D6 |

**12.3 Defects and Corrective Actions**

| Defect | Corrective Action | Status |
| ----- | ----- | ----- |
| Evaluation file recorded Python 3.14.7 while this machine uses 3.11 | Metrics are compared without treating the Python version string as part of the match | Resolved |
| Daily intake limit is rounded to two decimal places and one intake test uses a tighter comparison | Not changed yet | Pending |

**12.4 User Acceptance Testing (UAT)**  
***When applicable, include the UAT results.***  
\[Insert UAT evidence/results.\]

# **13\. CHALLENGES AND SOLUTIONS**

 *.*

| Challenge | Solution |
| ----- | ----- |
| \[Challenge\] | \[Solution\] |
| \[Challenge\] | \[Solution\] |
| \[Challenge\] | \[Solution\] |

# **14\. CONCLUSION**

*Provide a brief summary of the completed project.*  
*Discuss:*

* *Whether the objectives were achieved*   
* *Major accomplishments*   
* *Overall system performance*   
* *Possible improvements* 

# **15\. REFERENCES**

Cruz, G. T., Natividad, J. N., & Saito, Y. (2019). Discussion, conclusions, and recommendations. In G. T. Cruz, C. J. P. Cruz, & Y. Saito (Eds.), *Ageing and health in the Philippines* (pp. 215–226). Economic Research Institute for ASEAN and East Asia. [https://www.eria.org/uploads/media/Books/2019-Dec-Ageing-and-Health-Philippines/20-Ageing-and-Health-Philippines-Chapter-14-new.pdf](https://www.eria.org/uploads/media/Books/2019-Dec-Ageing-and-Health-Philippines/20-Ageing-and-Health-Philippines-Chapter-14-new.pdf)

Fakih El Khoury, C., Karavetian, M., Halfens, R. J. G., Crutzen, R., Khoja, L., & Schols, J. M. G. A. (2019). The effects of dietary mobile apps on nutritional outcomes in adults with chronic diseases: A systematic review and meta-analysis. *Journal of the Academy of Nutrition and Dietetics, 119*(4), 626–651. [https://doi.org/10.1016/j.jand.2018.11.010](https://doi.org/10.1016/j.jand.2018.11.010)

Lawson, S., Mullan, J., Wong, G., Zaman, H., Booth, A., Watson, A., & Maidment, I. (2021). Family carers' experiences of managing older relative's medications: Insights from the MEMORABLE study. *Patient Education and Counseling.* Advance online publication. [https://doi.org/10.1016/j.pec.2021.12.017](https://doi.org/10.1016/j.pec.2021.12.017)

Spinean, A., Mladin, A., Carniciu, S., Stănescu, A. M. A., & Serafinceanu, C. (2025). Emerging methods for integrative management of chronic diseases: Utilizing mHealth apps for lifestyle interventions. *Nutrients, 17*(9), Article 1506\. [https://doi.org/10.3390/nu17091506](https://doi.org/10.3390/nu17091506)

World Health Organization. (2012). *Guideline: Sodium intake for adults and children.* World Health Organization. [https://www.ncbi.nlm.nih.gov/books/NBK133309/](https://www.ncbi.nlm.nih.gov/books/NBK133309/)

World Health Organization. (2015, March 4). *WHO calls on countries to reduce sugars intake among adults and children* \[Press release\]. [https://www.who.int/news/item/04-03-2015-who-calls-on-countries-to-reduce-sugars-intake-among-adults-and-children](https://www.who.int/news/item/04-03-2015-who-calls-on-countries-to-reduce-sugars-intake-among-adults-and-children)

# **16\. APPENDICES**

*Include supporting documents and evidence.*  
Possible contents:

* **Appendix A – Requirements Gathering Evidence**   
* **Appendix B – Additional UML Diagrams**   
* **Appendix C – Additional Screenshots**   
* **Appendix D – Testing Evidence**   
* **Appendix E – UAT Results**   
* **Appendix F – Source Code / Repository Information**   
* **Appendix G – Individual Contributions** 

**INDIVIDUAL CONTRIBUTION**

| Member | Assigned Responsibilities | Actual Contribution |
| ----- | ----- | ----- |
| Bacabac, Adrid T. | Developer / Documentation Specialist | \[Contribution\] |
| Oredina, Reyah Shane V. | Quality Assurance Tester / Documentation Specialist | \[Contribution\] |
| Salgado, Joseph Paolo C. | System Analyst / Developer / UI/UI Designer | \[Contribution\] |
| Santiago, Martin B.  | Project Manager / Developer / Database Designer | \[Contribution\] |
| Villavicencio, Yvonne C. | UI/UX Designer / Documentation Specialist | \[Contribution\] |

