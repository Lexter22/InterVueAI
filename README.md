# InterVueAI

AI-powered interview platform with real-time voice screening and HR management dashboard.

## Features

- **Applicant Portal**: Job browsing and application submission
- **AI Interview Room**: Real-time video/audio interview simulation powered by Agora AI
- **HR Dashboard**: Job management and applicant tracking
- **Database Integration**: AWS RDS MySQL with raw SQL queries

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL (AWS RDS for production, localhost/XAMPP for development)
- **AI Integration**: Agora AI for real-time voice interviewing
- **Frontend**: HTML, CSS, JavaScript
- **Dependencies**: mysql2, uuid, dotenv

## Future Implementation

- **Agora AI Integration**: Real-time AI interviewer with voice recognition and natural language processing
- **AWS RDS**: Production database deployment for scalability and reliability
- **Advanced Analytics**: AI-powered candidate scoring and feedback generation

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   - Start MySQL (XAMPP)
   - Create database named `hack`
   - Run the SQL schema:
   ```sql
   CREATE TABLE jobs (
       job_id INT AUTO_INCREMENT PRIMARY KEY,
       title VARCHAR(100),
       job_requirements TEXT,
       status VARCHAR(20) DEFAULT 'Open'
   );

   CREATE TABLE applicants (
       applicant_id VARCHAR(50) PRIMARY KEY,
       job_id INT,
       full_name VARCHAR(100),
       email VARCHAR(100),
       mobile_number VARCHAR(20),
       status VARCHAR(20) DEFAULT 'Pending',
       FOREIGN KEY (job_id) REFERENCES jobs(job_id)
   );

   CREATE TABLE interview_results (
       result_id INT AUTO_INCREMENT PRIMARY KEY,
       applicant_id VARCHAR(50),
       score_overall INT,
       eye_contact_score INT,
       summary_text TEXT,
       improvement_tips TEXT,
       FOREIGN KEY (applicant_id) REFERENCES applicants(applicant_id)
   );
   ```

3. **Environment Variables**
   Update `.env` with your database credentials:
   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=hack
   PORT=3000
   ```

4. **Start Server**
   ```bash
   npm start
   ```

5. **Access Application**
   - Applicant Portal: http://localhost:3000
   - HR Dashboard: Click "HR Dashboard" button

## API Endpoints

- `GET /api/jobs` - Get open jobs
- `POST /api/application/start` - Submit application
- `GET /api/hr/jobs` - Get all jobs (HR)
- `POST /api/hr/jobs` - Create job
- `PUT /api/hr/jobs/:id` - Update job
- `DELETE /api/hr/jobs/:id` - Delete job
- `GET /api/hr/applicants` - Get all applicants

## File Structure

```
InterVueAI/
├── public/
│   ├── index.html              # Applicant portal
│   ├── hr-dashboard.html       # HR management
│   ├── interview-room.html     # AI interview
│   ├── interview-summary.html  # Results page
│   ├── styles.css             # Main stylesheet
│   └── hr-dashboard.js        # HR functionality
├── server.js                  # Express server
├── db.js                     # Database connection
├── package.json              # Dependencies
└── .env                      # Environment variables
```

## Usage

1. **HR**: Add jobs via HR Dashboard
2. **Applicants**: Browse and apply for jobs
3. **Interview**: Complete AI interview simulation
4. **Results**: View interview summary and feedback