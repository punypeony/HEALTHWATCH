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

**4.2 Limitations**

* The system's risk classification is limited to sodium, sugar, calories, allergies, and two medical conditions, diabetic and hypertensive status. It does not account for other nutrients or other medical conditions.  
* The system only scans product barcodes for identification. It does not use Optical Character Recognition (OCR) to read nutrition labels or ingredient text directly, so a product without a recognizable barcode, or one missing from the Open Food Facts database, cannot be scanned or checked.   
* The system is a support tool, not a medical device. It does not provide medical diagnoses and is not a substitute for professional advice from a doctor or registered dietitian.  
* The risk assessment is produced by a simple, rule-based decision tree model rather than a full clinical evaluation. Its accuracy is limited by the quality of the rules and training data used to build it, consistent with concerns raised in the literature that many mobile health applications lack rigorous clinical validation.

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
| FR-01 | The system shall allow a caregiver to register and log in using a username and password.  |
| FR-02 | The system shall allow a caregiver to add, edit, and manage multiple dependents, each with their own profile (age, height, weight, sex, allergies, and conditions).  |
| FR-03 | The system shall automatically compute a dependent's daily sodium, sugar, and calorie targets whenever their profile is created or updated.  |
| FR-04 | The system shall allow a caregiver to scan a food product's barcode and retrieve its nutrition information.  |
| FR-05 | The system shall compare a scanned food's nutrition data against a dependent's targets, allergies, and conditions, and classify it as safe, warning, or danger.  |
| FR-06 | The system shall save every scan as a meal log entry linked to the correct dependent.  |
| FR-07 | The system shall generate an alert whenever a scanned food is classified as warning or danger.  |
| FR-08 | The system shall let a caregiver view a dependent's meal history and alerts.  |
| FR-09 | The system shall generate a weekly summary of a dependent's eating pattern based on their scan history.  |

**5.3 Non-Functional Requirements**

| Performance | Requirement |
| ----- | ----- |
| Security | The system shall return a food safety result within 3 seconds after a barcode is scanned, under normal network conditions.  |
| Usability | The system shall only allow a caregiver to view or edit the profiles and data of their own registered dependents.  |
| Reliability | The system shall display results using simple text and clear color codes (green, amber, red) so caregivers can understand them at a glance.  |
| Performance | The system shall continue to function in offline demo mode using saved sample data if there is no internet connection.  |

**5.4 Business Rules**  
*List the rules that govern how the system operates.*

1. A caregiver can only view and manage dependents that they personally registered.  
2. Every dependent's daily nutrition targets must be calculated by the system; caregivers cannot enter these values manually.  
3. A food item is automatically marked as "danger" if it contains an ingredient matching one of the dependent's listed allergies, regardless of other nutrition values.  
4. Every scan result, whether safe, warning, or danger, must be saved to the dependent's meal history for record-keeping.

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

**6.1 Use Case Diagram**

**Figure 1\. Use Case Diagram**  
\[Insert diagram here\]

**Description:**  
\[Briefly explain the diagram.\]

**6.2 Activity Diagram**

**Figure 2\. Activity Diagram**  
\[Insert diagram here\]

**Description:**  
\[Briefly explain the diagram.\]

**6.3 Class Diagram**

**Figure 3\. Class Diagram**  
\[Insert diagram here\]

**Description:**  
\[Briefly explain the diagram.\]

**6.4 Other UML Diagrams**  
*Include other appropriate diagrams when necessary.*  
*Examples:*

* *Sequence Diagram*   
* *State Diagram*   
* *Component Diagram* 

# **7\. SYSTEM ARCHITECTURE**

*Present the overall architecture of the system.*

**Figure 4\. System Architecture**  
\[Insert architecture diagram here\]

**Description:**  
\[Briefly explain the major components and how they interact.\]

# **8\. DATABASE DESIGN**

**8.1 Entity Relationship Diagram**

**Figure 5\. Entity Relationship Diagram**  
\[Insert ERD here\]

**8.2 Database Tables**

| Table | Purpose |
| ----- | ----- |
| \[Table 1\] | \[Purpose\] |
| \[Table 2\] | \[Purpose\] |
| \[Table 3\] | \[Purpose\] |

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
| \[Programming Language\] | \[Purpose\] |
| \[Database\] | \[Purpose\] |
| \[IDE/Editor\] | \[Purpose\] |
| \[Framework/Library\] | \[Purpose\] |

**10.2 Major System Features**  
*Describe the major features implemented in the system*.

1. \[Feature 1\]   
2. \[Feature 2\]   
3. \[Feature 3\]   
4. \[Feature 4\] 

# **11\. TRANSACTION PROCESSING**

*Describe the major transactions of the system.*

Each major transaction should generally demonstrate:  
**Input → Validation → Processing → Database Update → Confirmation/Output**

**Transaction 1: \[Transaction Name\]**

**Input:**  
\[Describe the input.\]  
**Validation:**  
\[Describe the validation.\]  
**Processing:**  
\[Describe what the system does.\]  
**Database Update:**  
\[Describe the database changes.\]  
**Confirmation/Output:**  
\[Describe the resulting output.\]  
**Screenshot:**  
\[Insert screenshot\]

# **12\. SOFTWARE TESTING**

**12.1 Test Plan**  
*Briefly describe how the system was tested.*

**12.2 Test Cases and Results**

| Test Case ID | Feature/Transaction | Expected Result | Actual Result | Status |
| ----- | ----- | ----- | ----- | ----- |
| TC-01 | \[Feature\] | \[Expected result\] | \[Actual result\] | Pass/Fail |
| TC-02 | \[Feature\] | \[Expected result\] | \[Actual result\] | Pass/Fail |
| TC-03 | \[Feature\] | \[Expected result\] | \[Actual result\] | Pass/Fail |

**12.3 Defects and Corrective Actions**

| Defect | Corrective Action | Status |
| ----- | ----- | ----- |
| \[Problem encountered\] | \[Action taken\] | Resolved/Pending |
| \[Problem encountered\] | \[Action taken\] | Resolved/Pending |

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

