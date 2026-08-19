# Client Industry Classification

The SPC Workforce Management Platform uses a standardized, strictly controlled `PrimaryIndustry` enum to classify clients by their business sector. 

## Definition of Primary Industry
The **Primary Industry** represents the client organization's core business sector, *not* the type of job or candidate being recruited. For example:
- A hospital hiring data-entry operators is classified as `Healthcare & Life Sciences`.
- A software company hiring accountants is classified as `Information Technology & Software`.

## Canonical Industry Values
We use a predefined set of canonical values to prevent data fragmentation. These enum values are translated into friendly labels in the UI:

| Stored Value | Display Label |
|--------------|---------------|
| `BFSI` | Banking, Financial Services & Insurance (BFSI) |
| `BPO_KPO_ITES` | Business Process Outsourcing (BPO/KPO/ITES) |
| `CONSULTING_PROFESSIONAL_SERVICES` | Consulting & Professional Services |
| `CONSTRUCTION_REAL_ESTATE` | Construction & Real Estate |
| `EDUCATION_TRAINING` | Education & Training |
| `ENERGY_UTILITIES` | Energy & Utilities |
| `FMCG_CONSUMER_GOODS` | FMCG & Consumer Goods |
| `GOVERNMENT_PUBLIC_SECTOR` | Government & Public Sector |
| `HEALTHCARE_LIFE_SCIENCES` | Healthcare & Life Sciences |
| `HOSPITALITY_TRAVEL_TOURISM` | Hospitality, Travel & Tourism |
| `INFORMATION_TECHNOLOGY_SOFTWARE` | Information Technology & Software |
| `LOGISTICS_TRANSPORTATION_WAREHOUSING` | Logistics, Transportation & Warehousing |
| `MANUFACTURING_ENGINEERING` | Manufacturing & Engineering |
| `MEDIA_ADVERTISING_ENTERTAINMENT` | Media, Advertising & Entertainment |
| `RETAIL_ECOMMERCE` | Retail & E-commerce |
| `TELECOMMUNICATIONS` | Telecommunications |
| `OTHER` | Other |

## "Other" and Custom Values
When a user selects `OTHER`, they are prompted with a required "Specify Industry" text field. 
- The system stores `industry: "OTHER"` and `industryOtherText: "<entered value>"`. 
- The text is trimmed, and must contain at least 2 characters.
- In the UI, whenever `OTHER` is selected, the application displays `industryOtherText` instead of the generic "Other" label.
- If a user edits the client and switches from `OTHER` to a canonical industry, the application clears `industryOtherText`.

## API & Validation Rules
- **Creation & Update**: The `industry` field must map exactly to one of the canonical values in the `PrimaryIndustry` enum.
- **Other Values**: If `industry` is `OTHER`, `industryOtherText` becomes required. If `industry` is not `OTHER`, `industryOtherText` should be omitted or cleared.

## Legacy Data Migration
Upon load, the `AppContext` state initializer attempts a non-destructive migration of any legacy free-text industries:
- Maps variations like `IT`, `Technology`, `Software` to `INFORMATION_TECHNOLOGY_SOFTWARE`.
- Maps `Healthcare`, `Hospital`, `Medical` to `HEALTHCARE_LIFE_SCIENCES`.
- Maps `Banking`, `Finance`, `Insurance` to `BFSI`.
- Unrecognized values fall back to `OTHER` and the unrecognized string is preserved in `industryOtherText`.

## Single-Select Rule
The industry classifier is strictly a single-select dropdown (`SearchableSelect` component) because a client can only have one primary business identity for reporting and filtering purposes.
