-- AI Recruitment Interview System

-- 1. Jobs Table
CREATE TABLE jobs (
    job_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    job_requirements TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status)
);

-- 2. Applicants Table (GUID-based Primary Key)
CREATE TABLE applicants (
    applicant_id VARCHAR(50) PRIMARY KEY,  -- GUID Token
    job_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(11) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(job_id) ON DELETE CASCADE,
    INDEX idx_job_id (job_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 3. Interview Results Table
CREATE TABLE interview_results (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    applicant_id VARCHAR(50) NOT NULL,
    score_overall INT NOT NULL,
    eye_contact_score INT NOT NULL,
    summary_text TEXT,
    improvement_tips TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (applicant_id) REFERENCES applicants(applicant_id) ON DELETE CASCADE,
    INDEX idx_applicant_id (applicant_id),
    INDEX idx_score_overall (score_overall)
);

-- Insert Sample Data
INSERT INTO jobs (title, job_requirements, status) VALUES 
('Senior Software Developer', 'We are seeking a highly skilled Senior Software Developer to join our dynamic engineering team. The ideal candidate will have 5+ years of experience in full-stack development with expertise in C#, .NET Core, ASP.NET Web API, and Entity Framework. Strong proficiency in database design and optimization using MySQL or SQL Server is required. Experience with cloud platforms (AWS, Azure) and containerization (Docker, Kubernetes) is highly preferred. The candidate should demonstrate excellent problem-solving abilities, code review skills, and experience mentoring junior developers. Knowledge of microservices architecture, RESTful API design, and agile development methodologies is essential. Bachelor''s degree in Computer Science or equivalent experience required.', 'Open'),
('Frontend React Developer', 'Join our innovative product team as a Frontend React Developer! We''re looking for a passionate developer with 3+ years of experience building modern, responsive web applications using React.js, TypeScript, and modern JavaScript (ES6+). Proficiency in state management libraries (Redux, Context API), CSS preprocessors (SASS/LESS), and build tools (Webpack, Vite) is required. Experience with testing frameworks (Jest, React Testing Library), version control (Git), and CI/CD pipelines is essential. Knowledge of UI/UX principles, accessibility standards (WCAG), and cross-browser compatibility is highly valued. Familiarity with Next.js, GraphQL, and design systems is a plus. Strong communication skills and ability to collaborate with designers and backend developers in an agile environment.', 'Open'),
('Data Analyst - Business Intelligence', 'We are hiring a detail-oriented Data Analyst to transform raw data into actionable business insights. The successful candidate will have 2+ years of experience in data analysis with advanced SQL skills and proficiency in Python or R for statistical analysis. Experience with data visualization tools such as Tableau, Power BI, or similar platforms is required. Strong knowledge of statistical methods, A/B testing, and predictive modeling techniques is essential. The role involves working with large datasets, creating automated reports, and presenting findings to stakeholders. Experience with cloud data platforms (AWS Redshift, Google BigQuery), ETL processes, and data warehousing concepts is preferred. Bachelor''s degree in Statistics, Mathematics, Economics, or related field. Excellent analytical thinking and communication skills required.', 'Closed')