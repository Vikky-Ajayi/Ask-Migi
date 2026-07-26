/**
 * Comprehensive suggestion lists for Skills and Job Roles.
 * Each entry has a label and an optional category for grouped display.
 */

export interface Suggestion {
  label: string;
  category: string;
}

// ── Skills ──────────────────────────────────────────────────────────────────

export const SKILL_SUGGESTIONS: Suggestion[] = [
  // ── Programming Languages
  { label: "JavaScript", category: "Programming" },
  { label: "TypeScript", category: "Programming" },
  { label: "Python", category: "Programming" },
  { label: "Java", category: "Programming" },
  { label: "C#", category: "Programming" },
  { label: "C++", category: "Programming" },
  { label: "C", category: "Programming" },
  { label: "Go", category: "Programming" },
  { label: "Rust", category: "Programming" },
  { label: "Swift", category: "Programming" },
  { label: "Kotlin", category: "Programming" },
  { label: "Ruby", category: "Programming" },
  { label: "PHP", category: "Programming" },
  { label: "Scala", category: "Programming" },
  { label: "R", category: "Programming" },
  { label: "MATLAB", category: "Programming" },
  { label: "Perl", category: "Programming" },
  { label: "Haskell", category: "Programming" },
  { label: "Elixir", category: "Programming" },
  { label: "Dart", category: "Programming" },
  { label: "Lua", category: "Programming" },
  { label: "Bash / Shell Scripting", category: "Programming" },
  { label: "PowerShell", category: "Programming" },
  { label: "SQL", category: "Programming" },
  { label: "PL/SQL", category: "Programming" },

  // ── Frontend / UI
  { label: "React", category: "Frontend" },
  { label: "Next.js", category: "Frontend" },
  { label: "Vue.js", category: "Frontend" },
  { label: "Angular", category: "Frontend" },
  { label: "Svelte", category: "Frontend" },
  { label: "HTML5", category: "Frontend" },
  { label: "CSS3", category: "Frontend" },
  { label: "Tailwind CSS", category: "Frontend" },
  { label: "SASS / SCSS", category: "Frontend" },
  { label: "Bootstrap", category: "Frontend" },
  { label: "Material UI", category: "Frontend" },
  { label: "Redux", category: "Frontend" },
  { label: "GraphQL", category: "Frontend" },
  { label: "Webpack", category: "Frontend" },
  { label: "Vite", category: "Frontend" },
  { label: "Storybook", category: "Frontend" },
  { label: "Three.js", category: "Frontend" },
  { label: "WebGL", category: "Frontend" },

  // ── Backend / APIs
  { label: "Node.js", category: "Backend" },
  { label: "Express.js", category: "Backend" },
  { label: "NestJS", category: "Backend" },
  { label: "Django", category: "Backend" },
  { label: "Flask", category: "Backend" },
  { label: "FastAPI", category: "Backend" },
  { label: "Spring Boot", category: "Backend" },
  { label: "ASP.NET Core", category: "Backend" },
  { label: "Laravel", category: "Backend" },
  { label: "Ruby on Rails", category: "Backend" },
  { label: "REST API Design", category: "Backend" },
  { label: "gRPC", category: "Backend" },
  { label: "WebSockets", category: "Backend" },
  { label: "Microservices", category: "Backend" },
  { label: "Event-Driven Architecture", category: "Backend" },
  { label: "Message Queues", category: "Backend" },
  { label: "Apache Kafka", category: "Backend" },
  { label: "RabbitMQ", category: "Backend" },

  // ── Mobile
  { label: "React Native", category: "Mobile" },
  { label: "Flutter", category: "Mobile" },
  { label: "iOS Development", category: "Mobile" },
  { label: "Android Development", category: "Mobile" },
  { label: "Expo", category: "Mobile" },
  { label: "SwiftUI", category: "Mobile" },
  { label: "Jetpack Compose", category: "Mobile" },
  { label: "Xamarin", category: "Mobile" },

  // ── Databases
  { label: "PostgreSQL", category: "Databases" },
  { label: "MySQL", category: "Databases" },
  { label: "MongoDB", category: "Databases" },
  { label: "Redis", category: "Databases" },
  { label: "Elasticsearch", category: "Databases" },
  { label: "SQLite", category: "Databases" },
  { label: "Microsoft SQL Server", category: "Databases" },
  { label: "Oracle Database", category: "Databases" },
  { label: "DynamoDB", category: "Databases" },
  { label: "Cassandra", category: "Databases" },
  { label: "Firebase", category: "Databases" },
  { label: "Supabase", category: "Databases" },
  { label: "Neo4j", category: "Databases" },
  { label: "ClickHouse", category: "Databases" },
  { label: "Snowflake", category: "Databases" },
  { label: "BigQuery", category: "Databases" },
  { label: "Database Design", category: "Databases" },
  { label: "Data Modelling", category: "Databases" },

  // ── Cloud & DevOps
  { label: "AWS", category: "Cloud & DevOps" },
  { label: "Azure", category: "Cloud & DevOps" },
  { label: "Google Cloud (GCP)", category: "Cloud & DevOps" },
  { label: "Docker", category: "Cloud & DevOps" },
  { label: "Kubernetes", category: "Cloud & DevOps" },
  { label: "Terraform", category: "Cloud & DevOps" },
  { label: "CI/CD Pipelines", category: "Cloud & DevOps" },
  { label: "GitHub Actions", category: "Cloud & DevOps" },
  { label: "Jenkins", category: "Cloud & DevOps" },
  { label: "Ansible", category: "Cloud & DevOps" },
  { label: "Linux / Unix", category: "Cloud & DevOps" },
  { label: "Nginx", category: "Cloud & DevOps" },
  { label: "Serverless Architecture", category: "Cloud & DevOps" },
  { label: "Infrastructure as Code", category: "Cloud & DevOps" },
  { label: "Site Reliability Engineering", category: "Cloud & DevOps" },
  { label: "Monitoring & Observability", category: "Cloud & DevOps" },
  { label: "Prometheus", category: "Cloud & DevOps" },
  { label: "Grafana", category: "Cloud & DevOps" },
  { label: "Datadog", category: "Cloud & DevOps" },

  // ── AI & Data Science
  { label: "Machine Learning", category: "AI & Data" },
  { label: "Deep Learning", category: "AI & Data" },
  { label: "Natural Language Processing", category: "AI & Data" },
  { label: "Computer Vision", category: "AI & Data" },
  { label: "TensorFlow", category: "AI & Data" },
  { label: "PyTorch", category: "AI & Data" },
  { label: "scikit-learn", category: "AI & Data" },
  { label: "Pandas", category: "AI & Data" },
  { label: "NumPy", category: "AI & Data" },
  { label: "Data Analysis", category: "AI & Data" },
  { label: "Data Visualisation", category: "AI & Data" },
  { label: "Tableau", category: "AI & Data" },
  { label: "Power BI", category: "AI & Data" },
  { label: "Statistical Analysis", category: "AI & Data" },
  { label: "A/B Testing", category: "AI & Data" },
  { label: "ETL Pipelines", category: "AI & Data" },
  { label: "Data Engineering", category: "AI & Data" },
  { label: "Apache Spark", category: "AI & Data" },
  { label: "Airflow", category: "AI & Data" },
  { label: "LLMs / Generative AI", category: "AI & Data" },
  { label: "Prompt Engineering", category: "AI & Data" },
  { label: "MLOps", category: "AI & Data" },

  // ── Security
  { label: "Cybersecurity", category: "Security" },
  { label: "Penetration Testing", category: "Security" },
  { label: "OWASP", category: "Security" },
  { label: "Network Security", category: "Security" },
  { label: "SOC / SIEM", category: "Security" },
  { label: "Identity & Access Management", category: "Security" },
  { label: "Vulnerability Assessment", category: "Security" },
  { label: "Incident Response", category: "Security" },
  { label: "Cryptography", category: "Security" },
  { label: "Zero Trust Architecture", category: "Security" },

  // ── Testing & QA
  { label: "Unit Testing", category: "Testing & QA" },
  { label: "Integration Testing", category: "Testing & QA" },
  { label: "End-to-End Testing", category: "Testing & QA" },
  { label: "Test-Driven Development (TDD)", category: "Testing & QA" },
  { label: "Selenium", category: "Testing & QA" },
  { label: "Playwright", category: "Testing & QA" },
  { label: "Cypress", category: "Testing & QA" },
  { label: "Jest", category: "Testing & QA" },
  { label: "Pytest", category: "Testing & QA" },
  { label: "Performance Testing", category: "Testing & QA" },
  { label: "Accessibility Testing", category: "Testing & QA" },

  // ── Product & Design
  { label: "Product Management", category: "Product & Design" },
  { label: "Product Strategy", category: "Product & Design" },
  { label: "User Research", category: "Product & Design" },
  { label: "UX Design", category: "Product & Design" },
  { label: "UI Design", category: "Product & Design" },
  { label: "Figma", category: "Product & Design" },
  { label: "Sketch", category: "Product & Design" },
  { label: "Adobe XD", category: "Product & Design" },
  { label: "Wireframing & Prototyping", category: "Product & Design" },
  { label: "Design Systems", category: "Product & Design" },
  { label: "Usability Testing", category: "Product & Design" },
  { label: "Roadmapping", category: "Product & Design" },
  { label: "OKRs", category: "Product & Design" },
  { label: "Agile / Scrum", category: "Product & Design" },
  { label: "Kanban", category: "Product & Design" },
  { label: "JIRA", category: "Product & Design" },
  { label: "Confluence", category: "Product & Design" },

  // ── Business & Finance
  { label: "Financial Analysis", category: "Business & Finance" },
  { label: "Financial Modelling", category: "Business & Finance" },
  { label: "Budgeting & Forecasting", category: "Business & Finance" },
  { label: "Management Accounting", category: "Business & Finance" },
  { label: "Corporate Finance", category: "Business & Finance" },
  { label: "Valuation", category: "Business & Finance" },
  { label: "Investment Analysis", category: "Business & Finance" },
  { label: "Risk Management", category: "Business & Finance" },
  { label: "Excel / Advanced Excel", category: "Business & Finance" },
  { label: "SAP", category: "Business & Finance" },
  { label: "Salesforce", category: "Business & Finance" },
  { label: "Business Analysis", category: "Business & Finance" },
  { label: "Business Intelligence", category: "Business & Finance" },
  { label: "Process Improvement", category: "Business & Finance" },
  { label: "Six Sigma", category: "Business & Finance" },
  { label: "Lean Methodology", category: "Business & Finance" },
  { label: "Mergers & Acquisitions", category: "Business & Finance" },
  { label: "Private Equity", category: "Business & Finance" },
  { label: "Venture Capital", category: "Business & Finance" },

  // ── Marketing
  { label: "Digital Marketing", category: "Marketing" },
  { label: "SEO", category: "Marketing" },
  { label: "SEM / PPC", category: "Marketing" },
  { label: "Content Marketing", category: "Marketing" },
  { label: "Social Media Marketing", category: "Marketing" },
  { label: "Email Marketing", category: "Marketing" },
  { label: "Brand Strategy", category: "Marketing" },
  { label: "Growth Hacking", category: "Marketing" },
  { label: "Marketing Analytics", category: "Marketing" },
  { label: "Google Analytics", category: "Marketing" },
  { label: "CRM", category: "Marketing" },
  { label: "Conversion Rate Optimisation", category: "Marketing" },
  { label: "Copywriting", category: "Marketing" },
  { label: "Paid Social (Meta, TikTok)", category: "Marketing" },
  { label: "Influencer Marketing", category: "Marketing" },
  { label: "PR & Communications", category: "Marketing" },
  { label: "HubSpot", category: "Marketing" },
  { label: "Mailchimp", category: "Marketing" },

  // ── Sales
  { label: "B2B Sales", category: "Sales" },
  { label: "B2C Sales", category: "Sales" },
  { label: "Account Management", category: "Sales" },
  { label: "Business Development", category: "Sales" },
  { label: "Sales Strategy", category: "Sales" },
  { label: "Cold Calling / Prospecting", category: "Sales" },
  { label: "Negotiation", category: "Sales" },
  { label: "Pipeline Management", category: "Sales" },
  { label: "CRM Tools", category: "Sales" },
  { label: "SaaS Sales", category: "Sales" },
  { label: "Enterprise Sales", category: "Sales" },
  { label: "Channel Sales", category: "Sales" },

  // ── Legal
  { label: "Contract Law", category: "Legal" },
  { label: "Corporate Law", category: "Legal" },
  { label: "Employment Law", category: "Legal" },
  { label: "Intellectual Property", category: "Legal" },
  { label: "GDPR / Data Protection", category: "Legal" },
  { label: "Litigation", category: "Legal" },
  { label: "Regulatory Compliance", category: "Legal" },
  { label: "Legal Research", category: "Legal" },
  { label: "Due Diligence", category: "Legal" },
  { label: "Commercial Contracts", category: "Legal" },

  // ── Healthcare
  { label: "Clinical Research", category: "Healthcare" },
  { label: "Patient Care", category: "Healthcare" },
  { label: "Healthcare Management", category: "Healthcare" },
  { label: "Pharmacovigilance", category: "Healthcare" },
  { label: "Medical Writing", category: "Healthcare" },
  { label: "Electronic Health Records", category: "Healthcare" },
  { label: "NHS Systems", category: "Healthcare" },
  { label: "Public Health", category: "Healthcare" },
  { label: "Health & Safety (IOSH/NEBOSH)", category: "Healthcare" },

  // ── Engineering & Construction
  { label: "Civil Engineering", category: "Engineering" },
  { label: "Structural Engineering", category: "Engineering" },
  { label: "Mechanical Engineering", category: "Engineering" },
  { label: "Electrical Engineering", category: "Engineering" },
  { label: "Chemical Engineering", category: "Engineering" },
  { label: "AutoCAD", category: "Engineering" },
  { label: "SolidWorks", category: "Engineering" },
  { label: "BIM", category: "Engineering" },
  { label: "Project Management", category: "Engineering" },
  { label: "Prince2", category: "Engineering" },
  { label: "PMP", category: "Engineering" },
  { label: "SCADA", category: "Engineering" },
  { label: "Embedded Systems", category: "Engineering" },
  { label: "FPGA", category: "Engineering" },

  // ── HR & People
  { label: "Recruitment & Talent Acquisition", category: "HR & People" },
  { label: "Employee Relations", category: "HR & People" },
  { label: "Learning & Development", category: "HR & People" },
  { label: "Compensation & Benefits", category: "HR & People" },
  { label: "HRIS Systems", category: "HR & People" },
  { label: "Performance Management", category: "HR & People" },
  { label: "Organisational Development", category: "HR & People" },
  { label: "People Analytics", category: "HR & People" },
  { label: "Workforce Planning", category: "HR & People" },
  { label: "Diversity & Inclusion", category: "HR & People" },

  // ── Soft Skills
  { label: "Leadership", category: "Soft Skills" },
  { label: "Communication", category: "Soft Skills" },
  { label: "Problem Solving", category: "Soft Skills" },
  { label: "Critical Thinking", category: "Soft Skills" },
  { label: "Stakeholder Management", category: "Soft Skills" },
  { label: "Team Management", category: "Soft Skills" },
  { label: "Presentation Skills", category: "Soft Skills" },
  { label: "Mentoring & Coaching", category: "Soft Skills" },
  { label: "Adaptability", category: "Soft Skills" },
  { label: "Time Management", category: "Soft Skills" },
  { label: "Attention to Detail", category: "Soft Skills" },
  { label: "Cross-functional Collaboration", category: "Soft Skills" },
  { label: "Strategic Planning", category: "Soft Skills" },
  { label: "Change Management", category: "Soft Skills" },
  { label: "Conflict Resolution", category: "Soft Skills" },

  // ── Creative & Media
  { label: "Adobe Photoshop", category: "Creative & Media" },
  { label: "Adobe Illustrator", category: "Creative & Media" },
  { label: "Adobe Premiere Pro", category: "Creative & Media" },
  { label: "After Effects", category: "Creative & Media" },
  { label: "Video Production", category: "Creative & Media" },
  { label: "Photography", category: "Creative & Media" },
  { label: "Graphic Design", category: "Creative & Media" },
  { label: "Motion Graphics", category: "Creative & Media" },
  { label: "3D Modelling (Blender / Maya)", category: "Creative & Media" },
  { label: "Content Creation", category: "Creative & Media" },
  { label: "Technical Writing", category: "Creative & Media" },
  { label: "Journalism", category: "Creative & Media" },

  // ── Operations & Supply Chain
  { label: "Supply Chain Management", category: "Operations" },
  { label: "Logistics & Procurement", category: "Operations" },
  { label: "Inventory Management", category: "Operations" },
  { label: "Operations Management", category: "Operations" },
  { label: "ERP Systems", category: "Operations" },
  { label: "Demand Forecasting", category: "Operations" },
  { label: "Vendor Management", category: "Operations" },
  { label: "Quality Assurance", category: "Operations" },
  { label: "ISO Standards", category: "Operations" },

  // ── Languages
  { label: "English (Fluent)", category: "Languages" },
  { label: "French", category: "Languages" },
  { label: "Spanish", category: "Languages" },
  { label: "German", category: "Languages" },
  { label: "Mandarin", category: "Languages" },
  { label: "Arabic", category: "Languages" },
  { label: "Portuguese", category: "Languages" },
  { label: "Hindi", category: "Languages" },
  { label: "Japanese", category: "Languages" },
];

// ── Job Roles ────────────────────────────────────────────────────────────────

export const ROLE_SUGGESTIONS: Suggestion[] = [
  // ── Software Engineering
  { label: "Software Engineer", category: "Software Engineering" },
  { label: "Senior Software Engineer", category: "Software Engineering" },
  { label: "Staff Software Engineer", category: "Software Engineering" },
  { label: "Principal Engineer", category: "Software Engineering" },
  { label: "Frontend Developer", category: "Software Engineering" },
  { label: "Backend Developer", category: "Software Engineering" },
  { label: "Full Stack Developer", category: "Software Engineering" },
  { label: "Full Stack Engineer", category: "Software Engineering" },
  { label: "React Developer", category: "Software Engineering" },
  { label: "Node.js Developer", category: "Software Engineering" },
  { label: "Python Developer", category: "Software Engineering" },
  { label: "Java Developer", category: "Software Engineering" },
  { label: "iOS Developer", category: "Software Engineering" },
  { label: "Android Developer", category: "Software Engineering" },
  { label: "Mobile Developer", category: "Software Engineering" },
  { label: "Embedded Software Engineer", category: "Software Engineering" },
  { label: "Firmware Engineer", category: "Software Engineering" },
  { label: "Software Architect", category: "Software Engineering" },
  { label: "Solutions Architect", category: "Software Engineering" },
  { label: "Technical Lead", category: "Software Engineering" },
  { label: "Engineering Manager", category: "Software Engineering" },
  { label: "VP of Engineering", category: "Software Engineering" },
  { label: "CTO", category: "Software Engineering" },

  // ── Data & AI
  { label: "Data Scientist", category: "Data & AI" },
  { label: "Senior Data Scientist", category: "Data & AI" },
  { label: "Data Analyst", category: "Data & AI" },
  { label: "Senior Data Analyst", category: "Data & AI" },
  { label: "Data Engineer", category: "Data & AI" },
  { label: "Senior Data Engineer", category: "Data & AI" },
  { label: "Machine Learning Engineer", category: "Data & AI" },
  { label: "AI Engineer", category: "Data & AI" },
  { label: "AI Research Scientist", category: "Data & AI" },
  { label: "NLP Engineer", category: "Data & AI" },
  { label: "Computer Vision Engineer", category: "Data & AI" },
  { label: "MLOps Engineer", category: "Data & AI" },
  { label: "Analytics Engineer", category: "Data & AI" },
  { label: "Business Intelligence Analyst", category: "Data & AI" },
  { label: "Quantitative Analyst", category: "Data & AI" },
  { label: "Head of Data", category: "Data & AI" },
  { label: "Chief Data Officer", category: "Data & AI" },

  // ── DevOps & Infrastructure
  { label: "DevOps Engineer", category: "DevOps & Cloud" },
  { label: "Senior DevOps Engineer", category: "DevOps & Cloud" },
  { label: "Platform Engineer", category: "DevOps & Cloud" },
  { label: "Site Reliability Engineer (SRE)", category: "DevOps & Cloud" },
  { label: "Cloud Engineer", category: "DevOps & Cloud" },
  { label: "Cloud Architect", category: "DevOps & Cloud" },
  { label: "Infrastructure Engineer", category: "DevOps & Cloud" },
  { label: "Kubernetes Engineer", category: "DevOps & Cloud" },
  { label: "AWS Solutions Architect", category: "DevOps & Cloud" },
  { label: "Azure Engineer", category: "DevOps & Cloud" },

  // ── Cybersecurity
  { label: "Cybersecurity Analyst", category: "Cybersecurity" },
  { label: "Security Engineer", category: "Cybersecurity" },
  { label: "Penetration Tester", category: "Cybersecurity" },
  { label: "Security Architect", category: "Cybersecurity" },
  { label: "SOC Analyst", category: "Cybersecurity" },
  { label: "Information Security Manager", category: "Cybersecurity" },
  { label: "CISO", category: "Cybersecurity" },
  { label: "GRC Analyst", category: "Cybersecurity" },

  // ── QA & Testing
  { label: "QA Engineer", category: "QA & Testing" },
  { label: "Senior QA Engineer", category: "QA & Testing" },
  { label: "SDET", category: "QA & Testing" },
  { label: "Test Analyst", category: "QA & Testing" },
  { label: "Automation Test Engineer", category: "QA & Testing" },
  { label: "Performance Test Engineer", category: "QA & Testing" },
  { label: "QA Lead", category: "QA & Testing" },
  { label: "QA Manager", category: "QA & Testing" },

  // ── Product & Design
  { label: "Product Manager", category: "Product & Design" },
  { label: "Senior Product Manager", category: "Product & Design" },
  { label: "Principal Product Manager", category: "Product & Design" },
  { label: "Director of Product", category: "Product & Design" },
  { label: "VP of Product", category: "Product & Design" },
  { label: "Chief Product Officer (CPO)", category: "Product & Design" },
  { label: "Product Owner", category: "Product & Design" },
  { label: "UX Designer", category: "Product & Design" },
  { label: "UI Designer", category: "Product & Design" },
  { label: "UX/UI Designer", category: "Product & Design" },
  { label: "Product Designer", category: "Product & Design" },
  { label: "Senior Product Designer", category: "Product & Design" },
  { label: "UX Researcher", category: "Product & Design" },
  { label: "Design Lead", category: "Product & Design" },
  { label: "Head of Design", category: "Product & Design" },
  { label: "Graphic Designer", category: "Product & Design" },
  { label: "Creative Director", category: "Product & Design" },
  { label: "Motion Designer", category: "Product & Design" },
  { label: "3D Artist", category: "Product & Design" },

  // ── Finance & Banking
  { label: "Financial Analyst", category: "Finance & Banking" },
  { label: "Senior Financial Analyst", category: "Finance & Banking" },
  { label: "Finance Manager", category: "Finance & Banking" },
  { label: "CFO", category: "Finance & Banking" },
  { label: "Investment Analyst", category: "Finance & Banking" },
  { label: "Portfolio Manager", category: "Finance & Banking" },
  { label: "Risk Analyst", category: "Finance & Banking" },
  { label: "Risk Manager", category: "Finance & Banking" },
  { label: "Compliance Analyst", category: "Finance & Banking" },
  { label: "Compliance Manager", category: "Finance & Banking" },
  { label: "Accountant", category: "Finance & Banking" },
  { label: "Management Accountant", category: "Finance & Banking" },
  { label: "Financial Controller", category: "Finance & Banking" },
  { label: "Treasury Analyst", category: "Finance & Banking" },
  { label: "Credit Analyst", category: "Finance & Banking" },
  { label: "Trader", category: "Finance & Banking" },
  { label: "Quantitative Researcher", category: "Finance & Banking" },
  { label: "Private Equity Associate", category: "Finance & Banking" },
  { label: "Investment Banking Analyst", category: "Finance & Banking" },
  { label: "Actuary", category: "Finance & Banking" },
  { label: "Tax Manager", category: "Finance & Banking" },
  { label: "Audit Manager", category: "Finance & Banking" },
  { label: "FP&A Manager", category: "Finance & Banking" },

  // ── Marketing
  { label: "Marketing Manager", category: "Marketing" },
  { label: "Digital Marketing Manager", category: "Marketing" },
  { label: "SEO Manager", category: "Marketing" },
  { label: "SEO Specialist", category: "Marketing" },
  { label: "Content Manager", category: "Marketing" },
  { label: "Content Strategist", category: "Marketing" },
  { label: "Social Media Manager", category: "Marketing" },
  { label: "Paid Media Manager", category: "Marketing" },
  { label: "Performance Marketing Manager", category: "Marketing" },
  { label: "Brand Manager", category: "Marketing" },
  { label: "Growth Manager", category: "Marketing" },
  { label: "Head of Marketing", category: "Marketing" },
  { label: "CMO", category: "Marketing" },
  { label: "Marketing Analyst", category: "Marketing" },
  { label: "CRM Manager", category: "Marketing" },
  { label: "Email Marketing Manager", category: "Marketing" },
  { label: "Copywriter", category: "Marketing" },
  { label: "PR Manager", category: "Marketing" },
  { label: "Communications Manager", category: "Marketing" },

  // ── Sales
  { label: "Sales Executive", category: "Sales" },
  { label: "Account Executive", category: "Sales" },
  { label: "Account Manager", category: "Sales" },
  { label: "Senior Account Manager", category: "Sales" },
  { label: "Business Development Manager", category: "Sales" },
  { label: "Business Development Representative (BDR)", category: "Sales" },
  { label: "Sales Development Representative (SDR)", category: "Sales" },
  { label: "Sales Manager", category: "Sales" },
  { label: "Head of Sales", category: "Sales" },
  { label: "VP of Sales", category: "Sales" },
  { label: "Chief Revenue Officer (CRO)", category: "Sales" },
  { label: "Customer Success Manager", category: "Sales" },
  { label: "Enterprise Account Executive", category: "Sales" },
  { label: "Sales Engineer", category: "Sales" },
  { label: "Solutions Consultant", category: "Sales" },

  // ── Legal
  { label: "Solicitor", category: "Legal" },
  { label: "Barrister", category: "Legal" },
  { label: "Legal Counsel", category: "Legal" },
  { label: "In-house Counsel", category: "Legal" },
  { label: "General Counsel", category: "Legal" },
  { label: "Paralegal", category: "Legal" },
  { label: "Legal Assistant", category: "Legal" },
  { label: "Contract Manager", category: "Legal" },
  { label: "Compliance Officer", category: "Legal" },
  { label: "IP Lawyer", category: "Legal" },
  { label: "Employment Lawyer", category: "Legal" },
  { label: "Corporate Lawyer", category: "Legal" },

  // ── HR & People
  { label: "HR Manager", category: "HR & People" },
  { label: "HR Business Partner", category: "HR & People" },
  { label: "Talent Acquisition Manager", category: "HR & People" },
  { label: "Recruiter", category: "HR & People" },
  { label: "Technical Recruiter", category: "HR & People" },
  { label: "Head of HR", category: "HR & People" },
  { label: "Chief People Officer", category: "HR & People" },
  { label: "L&D Manager", category: "HR & People" },
  { label: "Compensation & Benefits Manager", category: "HR & People" },
  { label: "People Operations Manager", category: "HR & People" },

  // ── Operations & Management
  { label: "Operations Manager", category: "Operations" },
  { label: "Chief Operating Officer (COO)", category: "Operations" },
  { label: "Project Manager", category: "Operations" },
  { label: "Programme Manager", category: "Operations" },
  { label: "PMO Analyst", category: "Operations" },
  { label: "Business Analyst", category: "Operations" },
  { label: "Strategy Manager", category: "Operations" },
  { label: "Management Consultant", category: "Operations" },
  { label: "Change Manager", category: "Operations" },
  { label: "Scrum Master", category: "Operations" },
  { label: "Agile Coach", category: "Operations" },
  { label: "Office Manager", category: "Operations" },
  { label: "Executive Assistant", category: "Operations" },
  { label: "Chief of Staff", category: "Operations" },

  // ── Engineering (non-software)
  { label: "Mechanical Engineer", category: "Engineering" },
  { label: "Civil Engineer", category: "Engineering" },
  { label: "Structural Engineer", category: "Engineering" },
  { label: "Electrical Engineer", category: "Engineering" },
  { label: "Chemical Engineer", category: "Engineering" },
  { label: "Aerospace Engineer", category: "Engineering" },
  { label: "Biomedical Engineer", category: "Engineering" },
  { label: "Manufacturing Engineer", category: "Engineering" },
  { label: "Process Engineer", category: "Engineering" },
  { label: "Quality Engineer", category: "Engineering" },
  { label: "Project Engineer", category: "Engineering" },

  // ── Healthcare
  { label: "Doctor / Physician", category: "Healthcare" },
  { label: "Nurse", category: "Healthcare" },
  { label: "Pharmacist", category: "Healthcare" },
  { label: "Healthcare Manager", category: "Healthcare" },
  { label: "Clinical Research Associate", category: "Healthcare" },
  { label: "Medical Writer", category: "Healthcare" },
  { label: "Healthcare Data Analyst", category: "Healthcare" },
  { label: "Health & Safety Manager", category: "Healthcare" },
  { label: "Physiotherapist", category: "Healthcare" },
  { label: "Mental Health Therapist", category: "Healthcare" },

  // ── Education
  { label: "Teacher", category: "Education" },
  { label: "Lecturer", category: "Education" },
  { label: "Instructional Designer", category: "Education" },
  { label: "Education Manager", category: "Education" },
  { label: "Curriculum Developer", category: "Education" },
  { label: "Tutor", category: "Education" },
  { label: "Academic Researcher", category: "Education" },

  // ── Customer Service & Support
  { label: "Customer Support Specialist", category: "Customer & Support" },
  { label: "Customer Experience Manager", category: "Customer & Support" },
  { label: "Head of Customer Success", category: "Customer & Support" },
  { label: "Technical Support Engineer", category: "Customer & Support" },
  { label: "Help Desk Analyst", category: "Customer & Support" },

  // ── Startups / Generalist
  { label: "Founder / Co-founder", category: "Startups" },
  { label: "CEO", category: "Startups" },
  { label: "General Manager", category: "Startups" },
  { label: "Head of Growth", category: "Startups" },
  { label: "Head of Product", category: "Startups" },
  { label: "Head of Engineering", category: "Startups" },
  { label: "Technical Co-founder", category: "Startups" },
];

// ── Shared fuzzy search ──────────────────────────────────────────────────────

/**
 * Score a suggestion against a query string.
 * Returns a number > 0 if it matches (higher = better), 0 if no match.
 */
export function scoreSuggestion(suggestion: string, query: string): number {
  const s = suggestion.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  // Exact match
  if (s === q) return 100;
  // Starts with query
  if (s.startsWith(q)) return 90;
  // Word in suggestion starts with query
  const words = s.split(/[\s/()&,]+/);
  if (words.some((w) => w.startsWith(q))) return 70;
  // Contains query as substring
  if (s.includes(q)) return 50;
  // All query chars appear in order (fuzzy)
  let qi = 0;
  for (let i = 0; i < s.length && qi < q.length; i++) {
    if (s[i] === q[qi]) qi++;
  }
  if (qi === q.length) return Math.max(1, 30 - (s.length - q.length));
  return 0;
}

export function filterSuggestions(
  list: Suggestion[],
  query: string,
  already: string[],
  maxResults = 8,
): Suggestion[] {
  if (!query.trim()) return [];
  const alreadyLower = new Set(already.map((a) => a.toLowerCase()));
  return list
    .map((s) => ({ s, score: scoreSuggestion(s.label, query) }))
    .filter(({ s, score }) => score > 0 && !alreadyLower.has(s.label.toLowerCase()))
    .sort((a, b) => b.score - a.score || a.s.label.localeCompare(b.s.label))
    .slice(0, maxResults)
    .map(({ s }) => s);
}
