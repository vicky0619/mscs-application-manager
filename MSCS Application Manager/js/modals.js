// Modal and Form Management

// University Modal Functions
function showAddUniversityModal() {
    if (!requireAuth()) return;
    
    const modal = document.getElementById('university-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // Clear form
        const form = modal.querySelector('form');
        if (form) form.reset();
        
        // Set up form submission
        setupUniversityFormSubmission();
    }
}

function hideUniversityModal() {
    const modal = document.getElementById('university-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function setupUniversityFormSubmission() {
    const form = document.querySelector('#university-modal form');
    const submitBtn = document.querySelector('#university-modal button[type="submit"]');
    
    if (!form) return;
    
    // Remove existing event listeners
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Add form submission handler
    newForm.addEventListener('submit', handleUniversitySubmission);
    
    // Also handle submit button click if it's outside the form
    if (submitBtn && !newForm.contains(submitBtn)) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const formEvent = new Event('submit', { cancelable: true });
            newForm.dispatchEvent(formEvent);
        });
    }
}

async function handleUniversitySubmission(e) {
    e.preventDefault();
    
    console.log('🏫 University form submission started');
    
    const formData = new FormData(e.target);
    const universityData = {
        name: formData.get('name'),
        url: formData.get('url'),
        status: formData.get('status') || 'RESEARCHING',
        category: formData.get('category'),
        deadline: formData.get('deadline') || null,
        lorDeadline: formData.get('lorDeadline') || null,
        notes: formData.get('notes')
    };

    console.log('🏫 University data:', universityData);

    // Validate required fields
    if (!universityData.name || !universityData.category) {
        showError('Please fill in university name and category');
        console.error('❌ Validation failed: Missing required fields');
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]') || document.querySelector('#university-modal button[type="submit"]');
    if (!submitBtn) {
        console.error('❌ Submit button not found');
        return;
    }
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating...';
    submitBtn.disabled = true;

    try {
        console.log('🚀 Sending university to API...');
        const response = await api.createUniversity(universityData);
        console.log('✅ University API Response:', response);
        
        showSuccess('University added successfully!');
        hideUniversityModal();
        
        // Reload data
        if (typeof loadUniversities === 'function') {
            await loadUniversities();
        }
        if (typeof loadDashboardData === 'function') {
            await loadDashboardData();
        }
        
        // Update charts
        if (typeof updateAnalyticsCharts === 'function') {
            setTimeout(() => updateAnalyticsCharts(), 500);
        }
        
    } catch (error) {
        console.error('❌ University creation error:', error);
        showError(error.message || 'Failed to add university');
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Task Modal Functions
function showAddTaskModal() {
    if (!requireAuth()) return;
    
    const modal = document.getElementById('task-modal');
    if (modal) {
        modal.classList.remove('hidden');
        
        // Clear form
        const form = modal.querySelector('form');
        if (form) form.reset();
        
        // Populate universities dropdown
        populateUniversitiesDropdown();
        
        // Set up form submission
        setupTaskFormSubmission();
    }
}

function hideTaskModal() {
    const modal = document.getElementById('task-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function setupTaskFormSubmission() {
    const form = document.querySelector('#task-modal form');
    const submitBtn = document.querySelector('#task-modal button[type="submit"]');
    
    if (!form) return;
    
    // Remove existing event listeners
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Add form submission handler
    newForm.addEventListener('submit', handleTaskSubmission);
    
    // Also handle submit button click if it's outside the form
    if (submitBtn && !newForm.contains(submitBtn)) {
        submitBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const formEvent = new Event('submit', { cancelable: true });
            newForm.dispatchEvent(formEvent);
        });
    }
}

async function handleTaskSubmission(e) {
    e.preventDefault();
    
    console.log('📝 Form submission started');
    
    const formData = new FormData(e.target);
    const taskData = {
        title: formData.get('title'),
        description: formData.get('description'),
        status: formData.get('status') || 'PENDING',
        priority: formData.get('priority') || 'MEDIUM',
        dueDate: formData.get('dueDate') || null,
        universityId: formData.get('universityId') || null
    };

    console.log('📋 Task data:', taskData);

    // Validate required fields
    if (!taskData.title || taskData.title.trim() === '') {
        showError('Please enter a task title');
        console.error('❌ Validation failed: No title');
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]') || document.querySelector('#task-modal button[type="submit"]');
    if (!submitBtn) {
        console.error('❌ Submit button not found');
        return;
    }
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating...';
    submitBtn.disabled = true;

    try {
        console.log('🚀 Sending to API...');
        const response = await api.createTask(taskData);
        console.log('✅ API Response:', response);
        
        showSuccess('Task added successfully!');
        hideTaskModal();
        
        // Reload data
        if (typeof loadTasks === 'function') {
            await loadTasks();
        }
        if (typeof loadDashboardData === 'function') {
            await loadDashboardData();
        }
        
        // Update charts
        if (typeof updateAnalyticsCharts === 'function') {
            setTimeout(() => updateAnalyticsCharts(), 500);
        }
        
    } catch (error) {
        console.error('❌ Task creation error:', error);
        showError(error.message || 'Failed to add task');
    } finally {
        // Reset button
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

function populateUniversitiesDropdown() {
    const dropdown = document.querySelector('#task-modal select[name="universityId"]');
    if (!dropdown) return;
    
    dropdown.innerHTML = '<option value="">None</option>';
    if (universities && universities.length > 0) {
        universities.forEach(uni => {
            dropdown.innerHTML += `<option value="${uni.id}">${uni.name}</option>`;
        });
    }
}

// Edit Functions
async function editUniversity(id) {
    if (!requireAuth()) return;
    
    try {
        const response = await api.getUniversity(id);
        const university = response.university;
        
        // Fill modal with existing data
        showAddUniversityModal();
        
        setTimeout(() => {
            const modal = document.getElementById('university-modal');
            if (modal) {
                modal.querySelector('input[type="text"]').value = university.name || '';
                modal.querySelector('input[type="url"]').value = university.url || '';
                modal.querySelector('select').value = university.status || 'RESEARCHING';
                modal.querySelectorAll('select')[1].value = university.category || '';
                if (university.deadline) {
                    modal.querySelector('input[type="date"]').value = university.deadline.split('T')[0];
                }
                modal.querySelector('textarea').value = university.notes || '';
                
                // Change submit button text
                const submitBtn = modal.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.textContent = 'Update University';
                
                // Update form submission to handle edit
                const form = modal.querySelector('form');
                form.onsubmit = async (e) => {
                    e.preventDefault();
                    await handleUniversityUpdate(id, e);
                };
            }
        }, 100);
        
    } catch (error) {
        showError('Failed to load university details');
    }
}

async function handleUniversityUpdate(id, e) {
    const formData = new FormData(e.target);
    const universityData = {
        name: formData.get('name') || document.querySelector('#university-modal input[type="text"]').value,
        url: formData.get('url') || document.querySelector('#university-modal input[type="url"]').value,
        status: formData.get('status') || document.querySelector('#university-modal select').value,
        category: formData.get('category') || document.querySelectorAll('#university-modal select')[1].value,
        deadline: formData.get('deadline') || document.querySelector('#university-modal input[type="date"]').value,
        notes: formData.get('notes') || document.querySelector('#university-modal textarea').value
    };

    try {
        await api.updateUniversity(id, universityData);
        showSuccess('University updated successfully!');
        hideUniversityModal();
        
        // Reload data
        await loadUniversities();
        await loadDashboardData();
        
    } catch (error) {
        showError(error.message || 'Failed to update university');
    }
}

async function deleteUniversity(id) {
    if (!requireAuth()) return;
    
    if (confirm('Are you sure you want to delete this university? This action cannot be undone.')) {
        try {
            await api.deleteUniversity(id);
            showSuccess('University deleted successfully!');
            
            // Reload data
            await loadUniversities();
            await loadDashboardData();
            
        } catch (error) {
            showError(error.message || 'Failed to delete university');
        }
    }
}

async function editTask(id) {
    if (!requireAuth()) return;
    
    try {
        const task = tasks.find(t => t.id === id);
        if (!task) {
            showError('Task not found');
            return;
        }
        
        // Fill modal with existing data
        showAddTaskModal();
        
        setTimeout(() => {
            const modal = document.getElementById('task-modal');
            if (modal) {
                modal.querySelector('input[placeholder*="Stanford"]').value = task.title || '';
                modal.querySelector('textarea').value = task.description || '';
                modal.querySelectorAll('select')[0].value = task.status || 'PENDING';
                modal.querySelectorAll('select')[1].value = task.priority || 'MEDIUM';
                if (task.dueDate) {
                    modal.querySelectorAll('input[type="date"]')[0].value = task.dueDate.split('T')[0];
                }
                modal.querySelectorAll('select')[3].value = task.universityId || '';
                
                // Change submit button text
                const submitBtn = modal.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.textContent = 'Update Task';
                
                // Update form submission to handle edit
                const form = modal.querySelector('form');
                form.onsubmit = async (e) => {
                    e.preventDefault();
                    await handleTaskUpdate(id, e);
                };
            }
        }, 100);
        
    } catch (error) {
        showError('Failed to load task details');
    }
}

async function handleTaskUpdate(id, e) {
    const formData = new FormData(e.target);
    const taskData = {
        title: formData.get('title') || document.querySelector('#task-modal input[placeholder*="Stanford"]').value,
        description: formData.get('description') || document.querySelector('#task-modal textarea').value,
        status: formData.get('status') || document.querySelectorAll('#task-modal select')[0].value,
        priority: formData.get('priority') || document.querySelectorAll('#task-modal select')[1].value,
        dueDate: formData.get('dueDate') || document.querySelectorAll('#task-modal input[type="date"]')[0].value,
        universityId: formData.get('universityId') || document.querySelectorAll('#task-modal select')[3].value
    };

    try {
        await api.updateTask(id, taskData);
        showSuccess('Task updated successfully!');
        hideTaskModal();
        
        // Reload data
        await loadTasks();
        await loadDashboardData();
        
    } catch (error) {
        showError(error.message || 'Failed to update task');
    }
}

async function deleteTask(id) {
    if (!requireAuth()) return;
    
    if (confirm('Are you sure you want to delete this task?')) {
        try {
            await api.deleteTask(id);
            showSuccess('Task deleted successfully!');
            
            // Reload data
            await loadTasks();
            await loadDashboardData();
            
        } catch (error) {
            showError(error.message || 'Failed to delete task');
        }
    }
}

// Global functions for button clicks
window.showAddUniversityModal = showAddUniversityModal;
window.hideUniversityModal = hideUniversityModal;
window.showAddTaskModal = showAddTaskModal;
window.hideTaskModal = hideTaskModal;
window.editUniversity = editUniversity;
window.deleteUniversity = deleteUniversity;
window.editTask = editTask;
window.deleteTask = deleteTask;