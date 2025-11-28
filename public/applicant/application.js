document.addEventListener("DOMContentLoaded", () => {
  const selectedRoleLabel = document.getElementById("selected-role-label");
  const statusBanner = document.getElementById("statusBanner");
  const form = document.getElementById("applicationForm");
  const clearBtn = document.getElementById("clearBtn");

  let selectedJob = null;

  loadJobs();

  async function loadJobs() {
    try {
      const response = await fetch('/api/jobs');
      const result = await response.json();
      
      if (result.success) {
        displayJobs(result.data);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  }

  function displayJobs(jobs) {
    const jobList = document.getElementById('jobList');
    if (!jobList) return;
    
    jobList.innerHTML = '';
    if (!jobs || jobs.length === 0) {
      jobList.innerHTML = '<p style="text-align: center; color: #94a3b8; padding: 20px;">No open positions available</p>';
      return;
    }
    
    jobs.forEach(job => {
      const jobCard = document.createElement('div');
      jobCard.className = 'job-card';
      jobCard.dataset.jobId = job.job_id;
      jobCard.innerHTML = `
        <div class="job-title">${job.title}</div>
        <div class="job-meta">${job.job_requirements ? job.job_requirements.substring(0, 100) + '...' : 'No description available'}</div>
        <div class="job-tags">
          <span class="job-tag">${job.status}</span>
        </div>
      `;
      
      jobCard.addEventListener('click', () => {
        selectedJob = job;
        selectedRoleLabel.textContent = job.title;
        document.getElementById('job_id').value = job.job_id;
        
        document.querySelectorAll('.job-card').forEach(c => c.style.borderColor = 'var(--border)');
        jobCard.style.borderColor = 'rgba(56, 189, 248, 0.6)';
      });
      
      jobList.appendChild(jobCard);
    });
  }

  clearBtn.addEventListener('click', () => {
    form.reset();
    selectedJob = null;
    selectedRoleLabel.textContent = 'None';
    document.getElementById('job_id').value = '';
    document.querySelectorAll('.job-card').forEach(c => c.style.borderColor = 'var(--border)');
    statusBanner.classList.remove('show');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!selectedJob) {
      showStatus('Please select a job position first', 'error');
      return;
    }

    const formData = {
      job_id: parseInt(selectedJob.job_id),
      full_name: document.getElementById('full_name').value,
      email: document.getElementById('email').value,
      mobile_number: document.getElementById('mobile_number').value
    };
    
    try {
      showStatus('Submitting application...', 'info');
      
      const response = await fetch('/api/application/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const result = await response.json();
      
      if (result.success) {
        const interviewData = {
          job_id: selectedJob.job_id,
          job_title: selectedJob.title,
          job_requirements: selectedJob.job_requirements,
          full_name: formData.full_name,
          email: formData.email,
          mobile_number: formData.mobile_number,
          applicant_id: result.applicant_id
        };
        
        localStorage.setItem('interviewData', JSON.stringify(interviewData));
        console.log('✓ Stored interview data:', interviewData);
        
        showStatus('Application submitted! Redirecting to interview...', 'success');
        setTimeout(() => {
          window.location.href = `/interviewRoom/interview-room.html`;
        }, 1500);
      } else {
        showStatus('Error: ' + result.error, 'error');
      }
    } catch (error) {
      showStatus('Network error: ' + error.message, 'error');
    }
  });

  function showStatus(message, type) {
    const messageEl = document.getElementById('statusMessage');
    messageEl.textContent = message;
    statusBanner.className = `status-banner show status-${type === 'error' ? 'info' : type}`;
    
    if (type === 'success') {
      setTimeout(() => statusBanner.classList.remove('show'), 3000);
    }
  }
});

async function testDatabase() {
  try {
    const response = await fetch('/api/test-db');
    const result = await response.json();
    
    if (result.success) {
      alert('✅ Database connected successfully!');
    } else {
      alert('❌ Database connection failed: ' + result.error);
    }
  } catch (error) {
    alert('❌ Network error: ' + error.message);
  }
}
