// Client-side JavaScript for index.html <script> tag
// Form submission handler for application start

document.getElementById('applicationForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = {
    job_id: parseInt(document.getElementById('job_id').value),
    full_name: document.getElementById('full_name').value,
    email: document.getElementById('email').value,
    mobile_number: document.getElementById('mobile_number').value
  };
  
  try {
    const response = await fetch('/api/application/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Redirect to interview page with token
      window.location.href = `/interview.html?token=${result.token}`;
    } else {
      alert('Error: ' + result.error);
    }
  } catch (error) {
    alert('Network error: ' + error.message);
  }
});