
document.addEventListener("DOMContentLoaded", () => {
  const selectedRoleLabel = document.getElementById("selected-role-label");
  const jobRoleInput = document.getElementById("jobRole");
  const statusBanner = document.getElementById("statusBanner");
  const form = document.getElementById("application-form");
  const clearBtn = document.getElementById("clearBtn");
  const adminBtn = document.getElementById("adminAccessBtn");
  const modalBackdrop = document.getElementById("modalBackdrop");

  setTimeout(() => {
  const btn = document.getElementById("adminAccessBtn");
  if (btn) {
    btn.classList.add("pulse");
    setTimeout(() => btn.classList.remove("pulse"), 3000);
  }
}, 800);

  // Job selection
  document.querySelectorAll(".job-card").forEach(card => {
    card.addEventListener("click", () => {
      const role = card.dataset.job;
      selectedRoleLabel.textContent = role;
      jobRoleInput.value = role;
      document.querySelectorAll(".job-card").forEach(c => c.style.borderColor = "");
      card.style.borderColor = "rgba(56, 189, 248, 0.7)";
    });
  });

  // Clear form
  clearBtn?.addEventListener("click", () => {
    form.reset();
    selectedRoleLabel.textContent = "None";
    jobRoleInput.value = "";
    document.querySelectorAll(".job-card").forEach(c => c.style.borderColor = "");
    statusBanner?.classList.remove("show");
  });

  // Submit (demo)
  form?.addEventListener("submit", e => {
    e.preventDefault();
    if (!jobRoleInput.value) return alert("Please select a job.");
    if (!document.getElementById("consent").checked) return alert("Please agree to terms.");

    statusBanner.textContent = "Simulating AI voice interview...";
    statusBanner.classList.add("show");

    setTimeout(() => {
      statusBanner.textContent = "AI interview completed! Check email for result.";
      statusBanner.classList.add("status-success");
    }, 2000);
  });

  // ADMIN LOGIN MODAL
  if (adminBtn) {
    adminBtn.addEventListener("click", () => {
      modalBackdrop.innerHTML = `
        <div class="modal">
          <div class="modal-header">
            <div class="modal-title">HR Login</div>
            <button class="btn btn-ghost" id="closeModal">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Email</label>
              <input type="email" placeholder="hr@company.com" value="admin@demo.com" />
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" placeholder="••••••••" value="123456" />
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" id="closeModal2">Cancel</button>
            <button class="btn btn-primary" id="loginBtn">Login</button>
          </div>
        </div>
      `;
      modalBackdrop.classList.add("show");

      // Close buttons
      document.querySelectorAll("#closeModal, #closeModal2").forEach(btn => {
        btn.addEventListener("click", () => {
          modalBackdrop.classList.remove("show");
        });
      });

      // Login (static - redirects)
      document.getElementById("loginBtn")?.addEventListener("click", () => {
        // Pre-filled creds work; in real app, validate here
        window.location.href = "hr-dashboard.html";
      });
    });
  }

  // HR Dashboard interactions (basic)
  if (document.querySelector("hr-dashboard.html")) {  // Simple check
    document.querySelectorAll(".btn-sm").forEach(btn => {
      btn.addEventListener("click", () => {
        alert("Demo: Action triggered (e.g., view/schedule). In real app, opens modal.");
      });
    });
  }
});

