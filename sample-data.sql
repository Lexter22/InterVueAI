-- Sample data for testing

-- Insert sample jobs
INSERT INTO jobs (title, job_requirements, status) VALUES 
('Frontend Developer', 'React, JavaScript, CSS, HTML experience required', 'Open'),
('Backend Developer', 'Node.js, MySQL, API development experience', 'Open'),
('Full Stack Developer', 'React, Node.js, database management skills', 'Open');

-- Insert sample applicants (using UUIDs as applicant_id)
INSERT INTO applicants (applicant_id, job_id, full_name, email, mobile_number, status) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 1, 'Juan Dela Cruz', 'juan@example.com', '+63 912 345 6789', 'Pending'),
('550e8400-e29b-41d4-a716-446655440002', 2, 'Maria Santos', 'maria@example.com', '+63 923 456 7890', 'Pending'),
('550e8400-e29b-41d4-a716-446655440003', 3, 'Mark Reyes', 'mark@example.com', '+63 934 567 8901', 'Pending');

-- Insert sample interview results
INSERT INTO interview_results (applicant_id, score_overall, eye_contact_score, summary_text, improvement_tips) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 82, 85, 'Strong communication skills and good technical knowledge', 'Work on confidence during technical discussions'),
('550e8400-e29b-41d4-a716-446655440002', 69, 70, 'Good potential but needs more experience', 'Practice more technical scenarios'),
('550e8400-e29b-41d4-a716-446655440003', 54, 60, 'Basic skills present but not meeting requirements', 'Focus on core technical fundamentals');