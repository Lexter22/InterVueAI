// HR Dashboard JavaScript
document.addEventListener('DOMContentLoaded', async () => {
    await loadApplicants();
    await loadJobs();
    setupJobManagement();
});

let currentJobs = [];

async function loadApplicants() {
    try {
        const response = await fetch('/api/hr/applicants');
        const result = await response.json();
        
        if (result.success) {
            console.log('Raw applicant data:', result.data);
            displayApplicants(result.data);
        }
    } catch (error) {
        console.error('Error loading applicants:', error);
    }
}

function displayApplicants(applicants) {
    const tbody = document.getElementById('applicantTable');
    tbody.innerHTML = '';
    
    applicants.forEach((applicant, index) => {
        console.log('Applicant data:', { score: applicant.score_overall, status: applicant.status });
        const status = getStatusBadge(applicant.score_overall, applicant.status);
        const row = `
            <tr>
                <td>APP-${String(index + 1).padStart(3, '0')}</td>
                <td>${applicant.full_name}</td>
                <td>${applicant.job_title}</td>
                <td><strong>${applicant.score_overall || 'N/A'} / 100</strong></td>
                <td>${status}</td>
                <td>
                    <button class="btn btn-ghost btn-sm" onclick="viewApplicant('${applicant.applicant_id}')">View</button>
                    ${applicant.score_overall >= 70 ? '<button class="btn btn-primary btn-sm">Schedule</button>' : ''}
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function getStatusBadge(score, status) {
    if (status === 'Passed') return '<span class="badge badge-pass">Passed</span>';
    if (status === 'Failed') return '<span class="badge badge-fail">Failed</span>';
    return '<span class="badge badge-fail">Failed</span>';
}

async function viewApplicant(applicantId) {
    try {
        const response = await fetch(`/api/interview/session/${applicantId}`);
        const result = await response.json();
        
        if (result.success) {
            showApplicantModal(result.data);
        }
    } catch (error) {
        console.error('Error loading applicant details:', error);
    }
}

function showApplicantModal(applicant) {
    const modal = `
        <div class="modal">
            <div class="modal-header">
                <div class="modal-title">Applicant Details</div>
                <button class="btn btn-ghost" onclick="closeModal()">×</button>
            </div>
            <div class="modal-body">
                <h3>${applicant.full_name}</h3>
                <p><strong>Email:</strong> ${applicant.email}</p>
                <p><strong>Phone:</strong> ${applicant.mobile_number}</p>
                <p><strong>Applied for:</strong> ${applicant.title}</p>
                <p><strong>Status:</strong> ${applicant.status}</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="closeModal()">Close</button>
            </div>
        </div>
    `;
    
    document.getElementById('modalBackdrop').innerHTML = modal;
    document.getElementById('modalBackdrop').classList.add('show');
}

function closeModal() {
    document.getElementById('modalBackdrop').classList.remove('show');
}

async function loadJobs() {
    try {
        const response = await fetch('/api/hr/jobs');
        const result = await response.json();
        
        if (result.success) {
            currentJobs = result.data;
            updateJobFilters(result.data);
            displayJobs(result.data);
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
    }
}

function updateJobFilters(jobs) {
    const filterJob = document.getElementById('filterJob');
    filterJob.innerHTML = '<option value="">All jobs</option>';
    
    jobs.forEach(job => {
        filterJob.innerHTML += `<option value="${job.title}">${job.title}</option>`;
    });
}

function displayJobs(jobs) {
    const tbody = document.querySelector('.card:last-child tbody');
    tbody.innerHTML = '';
    
    jobs.forEach(job => {
        const row = `
            <tr>
                <td>${job.title}</td>
                <td>${job.job_requirements ? job.job_requirements.substring(0, 50) + '...' : 'N/A'}</td>
                <td><span class="badge ${job.status === 'Open' ? 'badge-pass' : 'badge-pending'}">${job.status}</span></td>
                <td>
                    <button class="btn btn-ghost btn-sm" onclick="editJob(${job.job_id})">Edit</button>
                    <button class="btn btn-ghost btn-sm" onclick="deleteJob(${job.job_id})">Delete</button>
                </td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
}

function setupJobManagement() {
    document.getElementById('addJobBtn').addEventListener('click', showAddJobModal);
}

function showAddJobModal() {
    const modal = `
        <div class="modal">
            <div class="modal-header">
                <div class="modal-title">Add New Job</div>
                <button class="btn btn-ghost" onclick="closeModal()">×</button>
            </div>
            <div class="modal-body">
                <form id="jobForm">
                    <div class="form-group">
                        <label for="jobTitle">Job Title</label>
                        <input type="text" id="jobTitle" required>
                    </div>
                    <div class="form-group">
                        <label for="jobRequirements">Job Requirements</label>
                        <textarea id="jobRequirements" rows="4" required></textarea>
                    </div>
                    <div class="form-group">
                        <label for="jobStatus">Status</label>
                        <select id="jobStatus">
                            <option value="Open">Open</option>
                            <option value="Closed">Closed</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="saveJob()">Save Job</button>
            </div>
        </div>
    `;
    
    document.getElementById('modalBackdrop').innerHTML = modal;
    document.getElementById('modalBackdrop').classList.add('show');
}

function editJob(jobId) {
    const job = currentJobs.find(j => j.job_id === jobId);
    if (!job) return;
    
    const modal = `
        <div class="modal">
            <div class="modal-header">
                <div class="modal-title">Edit Job</div>
                <button class="btn btn-ghost" onclick="closeModal()">×</button>
            </div>
            <div class="modal-body">
                <form id="jobForm">
                    <input type="hidden" id="jobId" value="${job.job_id}">
                    <div class="form-group">
                        <label for="jobTitle">Job Title</label>
                        <input type="text" id="jobTitle" value="${job.title}" required>
                    </div>
                    <div class="form-group">
                        <label for="jobRequirements">Job Requirements</label>
                        <textarea id="jobRequirements" rows="4" required>${job.job_requirements || ''}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="jobStatus">Status</label>
                        <select id="jobStatus">
                            <option value="Open" ${job.status === 'Open' ? 'selected' : ''}>Open</option>
                            <option value="Closed" ${job.status === 'Closed' ? 'selected' : ''}>Closed</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
                <button class="btn btn-primary" onclick="saveJob()">Update Job</button>
            </div>
        </div>
    `;
    
    document.getElementById('modalBackdrop').innerHTML = modal;
    document.getElementById('modalBackdrop').classList.add('show');
}

async function saveJob() {
    const jobId = document.getElementById('jobId')?.value;
    const title = document.getElementById('jobTitle').value;
    const requirements = document.getElementById('jobRequirements').value;
    const status = document.getElementById('jobStatus').value;
    
    if (!title || !requirements) {
        alert('Please fill in all required fields');
        return;
    }
    
    try {
        const url = jobId ? `/api/hr/jobs/${jobId}` : '/api/hr/jobs';
        const method = jobId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, job_requirements: requirements, status })
        });
        
        const result = await response.json();
        
        if (result.success) {
            closeModal();
            await loadJobs();
            alert(jobId ? 'Job updated successfully!' : 'Job created successfully!');
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Network error: ' + error.message);
    }
}

async function deleteJob(jobId) {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
        const response = await fetch(`/api/hr/jobs/${jobId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadJobs();
            alert('Job deleted successfully!');
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Network error: ' + error.message);
    }
}

async function updateApplicantStatuses() {
    try {
        const response = await fetch('/api/hr/update-statuses', {
            method: 'PUT'
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadApplicants();
            alert('Applicant statuses updated successfully!');
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        alert('Network error: ' + error.message);
    }
}