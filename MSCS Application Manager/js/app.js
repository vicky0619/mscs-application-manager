// Main Application Logic

// Global state
let universities = [];
let tasks = [];
let documents = [];
let deadlines = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 MSCS Application Manager starting...');
    
    // Check authentication first
    const isAuth = await checkAuth();
    
    if (isAuth) {
        // User is authenticated, load data
        await loadAllData();
        setupEventListeners();
    }
});

// Load all data from API
async function loadAllData() {
    try {
        await Promise.all([
            loadDashboardData(),
            loadUniversities(),
            loadTasks(),
            loadDocuments(),
            loadDeadlines()
        ]);
        
        console.log('✅ All data loaded successfully');
        
        // Update analytics charts if available
        if (typeof updateAnalyticsCharts === 'function') {
            setTimeout(() => updateAnalyticsCharts(), 1000);
        }
    } catch (error) {
        console.error('❌ Error loading data:', error);
        showError('Failed to load data. Please refresh the page.');
    }
}

// Load and display dashboard statistics
async function loadDashboardData() {
    try {
        const stats = await api.getDashboardStats();
        updateDashboardStats(stats);
        
        const activity = await api.getRecentActivity();
        updateRecentActivity(activity);
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Update dashboard statistics in UI
function updateDashboardStats(stats) {
    // Update modern dashboard stats
    const totalUniversitiesModern = document.getElementById('total-universities-modern');
    if (totalUniversitiesModern) totalUniversitiesModern.textContent = stats.universities?.total || 0;
    
    const pendingDeadlinesModern = document.getElementById('pending-deadlines-modern');
    if (pendingDeadlinesModern) pendingDeadlinesModern.textContent = stats.deadlines?.upcoming || 0;
    
    const completedTasksModern = document.getElementById('completed-tasks-modern');
    if (completedTasksModern) completedTasksModern.textContent = stats.tasks?.completed || 0;
    
    const totalDocumentsModern = document.getElementById('total-documents-modern');
    if (totalDocumentsModern) totalDocumentsModern.textContent = stats.documents?.total || 0;
    
    // Legacy selectors for backwards compatibility
    const totalUniversities = document.getElementById('total-universities');
    if (totalUniversities) totalUniversities.textContent = stats.universities?.total || 0;
    
    const researchingCount = document.getElementById('researching-count');
    if (researchingCount) researchingCount.textContent = stats.universities?.byStatus?.researching || 0;
    
    const appliedCount = document.getElementById('applied-count');
    if (appliedCount) appliedCount.textContent = stats.universities?.byStatus?.applied || 0;
    
    const upcomingDeadlines = document.getElementById('upcoming-deadlines');
    if (upcomingDeadlines) upcomingDeadlines.textContent = stats.deadlines?.upcoming || 0;
    
    const deadlinesWeek = document.getElementById('deadlines-week');
    if (deadlinesWeek) deadlinesWeek.textContent = stats.deadlines?.thisWeek || 0;
    
    const deadlinesMonth = document.getElementById('deadlines-month');
    if (deadlinesMonth) deadlinesMonth.textContent = stats.deadlines?.thisMonth || 0;
    
    const pendingTasks = document.getElementById('pending-tasks');
    if (pendingTasks) pendingTasks.textContent = stats.tasks?.pending || 0;
    
    const overdueTasks = document.getElementById('overdue-tasks');
    if (overdueTasks) overdueTasks.textContent = stats.tasks?.overdue || 0;
    
    const highPriorityTasks = document.getElementById('high-priority-tasks');
    if (highPriorityTasks) highPriorityTasks.textContent = stats.tasks?.highPriority || 0;
    
    const totalDocuments = document.getElementById('total-documents');
    if (totalDocuments) totalDocuments.textContent = stats.documents?.total || 0;
    
    const sopCount = document.getElementById('sop-count');
    if (sopCount) sopCount.textContent = stats.documents?.byType?.sop || 0;
    
    const lorCount = document.getElementById('lor-count');
    if (lorCount) lorCount.textContent = stats.documents?.byType?.lor || 0;
}

// Update recent activity timeline
function updateRecentActivity(activityData) {
    // Modern activity list
    const modernActivityList = document.getElementById('recent-activity-modern');
    if (modernActivityList && activityData?.activities) {
        if (activityData.activities.length === 0) {
            modernActivityList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-clock text-3xl mb-2"></i>
                    <p class="text-body-small">No recent activity</p>
                </div>
            `;
        } else {
            modernActivityList.innerHTML = activityData.activities.map(activity => `
                <div class="modern-activity-item">
                    <div class="modern-activity-icon ${getModernActivityIconBg(activity.type)}">
                        <i class="${getActivityIcon(activity.type)}"></i>
                    </div>
                    <div class="modern-activity-content">
                        <div class="modern-activity-header">
                            <h4 class="modern-activity-title">${activity.title}</h4>
                            <span class="modern-activity-time">${formatTimeAgo(activity.timestamp)}</span>
                        </div>
                        <p class="modern-activity-description">${activity.description}</p>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Legacy timeline support
    const timeline = document.getElementById('activity-timeline');
    if (timeline && activityData?.activities) {
        if (activityData.activities.length === 0) {
            timeline.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-clock text-3xl mb-2"></i>
                    <p>No recent activity</p>
                </div>
            `;
        } else {
            timeline.innerHTML = activityData.activities.map(activity => `
                <div class="timeline-item relative pl-10">
                    <div class="absolute left-0 top-0 w-10 h-10 rounded-full ${getActivityIconBg(activity.type)} flex items-center justify-center">
                        <i class="${getActivityIcon(activity.type)}"></i>
                    </div>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="flex justify-between items-start">
                            <h4 class="font-medium">${activity.title}</h4>
                            <span class="text-sm text-gray-500">${formatTimeAgo(activity.timestamp)}</span>
                        </div>
                        <p class="text-sm text-gray-500 mt-1">${activity.description}</p>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Load universities from API
async function loadUniversities() {
    try {
        const response = await api.getUniversities();
        universities = response.universities || [];
        updateUniversitiesList();
        updateUniversitiesDropdowns();
    } catch (error) {
        console.error('Error loading universities:', error);
        universities = [];
    }
}

// Update universities list in UI
function updateUniversitiesList() {
    // Modern universities grid
    const modernUniversitiesList = document.getElementById('modern-universities-list');
    if (modernUniversitiesList) {
        if (universities.length === 0) {
            modernUniversitiesList.innerHTML = `
                <div class="modern-card text-center py-12">
                    <div class="modern-stat-icon" style="background: var(--color-gray-100); color: var(--color-gray-400); margin: 0 auto var(--space-4)">
                        <i class="fas fa-university"></i>
                    </div>
                    <h3 class="text-heading-3 mb-2">No universities added yet</h3>
                    <p class="text-body text-gray-500 mb-4">Start by adding your first university application</p>
                    <button class="modern-btn modern-btn-primary" onclick="showAddUniversityModal()">
                        <i class="fas fa-plus"></i>
                        Add University
                    </button>
                </div>
            `;
        } else {
            modernUniversitiesList.innerHTML = universities.map(uni => `
                <div class="modern-card">
                    <div class="modern-card-header">
                        <div class="flex items-center gap-3">
                            <div class="modern-stat-icon" style="background: var(--color-gray-100); color: var(--color-gray-600); width: 2.5rem; height: 2.5rem;">
                                <i class="fas fa-university"></i>
                            </div>
                            <div class="flex-1">
                                <h3 class="text-heading-3">${uni.name}</h3>
                                ${uni.url ? `<a href="${uni.url}" target="_blank" class="text-body-small text-blue-600 hover:underline">${extractDomain(uni.url)}</a>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modern-card-content">
                        <div class="flex flex-wrap gap-2 mb-4">
                            <span class="modern-badge status-${uni.status.toLowerCase()}">${formatStatus(uni.status)}</span>
                            <span class="modern-badge category-${uni.category.toLowerCase()}">${uni.category}</span>
                        </div>
                        <div class="space-y-2 text-body-small text-gray-600">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-calendar-alt"></i>
                                <span>Deadline: ${formatDate(uni.deadline)}</span>
                            </div>
                            ${uni.lorDeadline ? `
                            <div class="flex items-center gap-2">
                                <i class="fas fa-envelope"></i>
                                <span>LOR Deadline: ${formatDate(uni.lorDeadline)}</span>
                            </div>
                            ` : ''}
                        </div>
                        ${uni.notes ? `<p class="text-body-small text-gray-500 mt-3">${uni.notes}</p>` : ''}
                    </div>
                    <div class="modern-card-footer">
                        <div class="flex justify-end gap-2">
                            <button class="modern-btn modern-btn-ghost modern-btn-sm" onclick="editUniversity('${uni.id}')">
                                <i class="fas fa-edit"></i>
                                Edit
                            </button>
                            <button class="modern-btn modern-btn-ghost modern-btn-sm text-red-600" onclick="deleteUniversity('${uni.id}')">
                                <i class="fas fa-trash"></i>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    // Legacy list support
    const universitiesList = document.getElementById('universities-list');
    if (universitiesList) {
        if (universities.length === 0) {
            universitiesList.innerHTML = `
                <div class="col-span-12 text-center py-8 text-gray-500">
                    <i class="fas fa-university text-3xl mb-2"></i>
                    <p>No universities added yet</p>
                    <button class="mt-2 text-purple-600 hover:text-purple-800" onclick="showAddUniversityModal()">
                        Add your first university
                    </button>
                </div>
            `;
        } else {
            universitiesList.innerHTML = universities.map(uni => `
                <div class="grid grid-cols-12 p-4 items-center hover:bg-gray-50">
                    <div class="col-span-4 font-medium">
                        <div class="flex items-center">
                            <img src="https://logo.clearbit.com/${extractDomain(uni.url)}" alt="${uni.name}" 
                                 class="w-8 h-8 mr-3 rounded-full" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iMTYiIGZpbGw9IiM2MzY2RjEiLz4KPHN2ZyB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAxNiAxNiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTggMTZMMTQgMTBINlY0TDIgMTBIMTBWMTZIOFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4K'">
                            <div>
                                <p>${uni.name}</p>
                                ${uni.url ? `<a href="${uni.url}" target="_blank" class="text-sm text-purple-600 hover:underline">${extractDomain(uni.url)}</a>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="col-span-2">
                        <span class="status-${uni.status.toLowerCase()} px-2 py-1 rounded-full text-xs font-medium">${formatStatus(uni.status)}</span>
                    </div>
                    <div class="col-span-2">
                        <span class="tag-${uni.category.toLowerCase()} px-2 py-1 rounded-full text-xs font-medium">${uni.category}</span>
                    </div>
                    <div class="col-span-2 text-sm text-gray-600">${formatDate(uni.deadline)}</div>
                    <div class="col-span-2 flex space-x-2">
                        <button class="text-purple-600 hover:text-purple-800" onclick="editUniversity('${uni.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="text-red-500 hover:text-red-700" onclick="deleteUniversity('${uni.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Load tasks and update Kanban board
async function loadTasks() {
    try {
        const response = await api.getTasks();
        tasks = response.tasks || [];
        updateKanbanBoard(response.kanbanTasks || {});
        updateTasksList();
        
        // Update enhanced Kanban board
        if (window.kanbanBoard && typeof window.kanbanBoard.setTasks === 'function') {
            window.kanbanBoard.setTasks(tasks);
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
        tasks = [];
    }
}

// Update Kanban board
function updateKanbanBoard(kanbanTasks) {
    // Update modern Kanban preview
    updateModernKanbanPreview(kanbanTasks);
    
    // Update full Kanban board
    updateFullKanbanBoard(kanbanTasks);
    
    // Legacy Kanban support
    const columns = ['pending', 'in_progress', 'completed'];
    
    columns.forEach(status => {
        const columnId = status === 'in_progress' ? 'preparing-tasks' : 
                        status === 'pending' ? 'researching-tasks' :
                        status === 'completed' ? 'completed-tasks' : 'applying-tasks';
        
        const column = document.getElementById(columnId);
        if (!column) return;

        const statusTasks = kanbanTasks[status] || [];
        
        if (statusTasks.length === 0) {
            column.innerHTML = `
                <div class="text-center py-4 text-gray-500">
                    <p class="text-sm">No ${status.replace('_', ' ')} tasks</p>
                </div>
            `;
            return;
        }

        column.innerHTML = statusTasks.map(task => `
            <div class="kanban-item bg-white p-3 rounded-lg shadow cursor-move" data-task-id="${task.id}">
                <div class="flex justify-between items-start">
                    <span class="font-medium">${task.title}</span>
                    <span class="text-xs ${getPriorityClass(task.priority)} px-2 py-1 rounded">${task.priority}</span>
                </div>
                ${task.description ? `<p class="text-sm text-gray-500 mt-1">${task.description}</p>` : ''}
                <div class="flex justify-between items-center mt-2">
                    <span class="text-xs text-gray-400">${task.dueDate ? `Due: ${formatDate(task.dueDate)}` : 'No due date'}</span>
                    <div class="flex space-x-1">
                        <button class="text-gray-400 hover:text-purple-700" onclick="editTask('${task.id}')">
                            <i class="fas fa-edit text-xs"></i>
                        </button>
                        <button class="text-gray-400 hover:text-red-500" onclick="deleteTask('${task.id}')">
                            <i class="fas fa-trash text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    });
}

// Load documents
async function loadDocuments() {
    try {
        const response = await api.getDocuments();
        documents = response.documents || [];
        updateDocumentsList();
    } catch (error) {
        console.error('Error loading documents:', error);
        documents = [];
    }
}

// Load deadlines
async function loadDeadlines() {
    try {
        const response = await api.getDeadlines();
        deadlines = response.deadlines || [];
        updateUpcomingDeadlines(response.categorizedDeadlines);
    } catch (error) {
        console.error('Error loading deadlines:', error);
        deadlines = [];
    }
}

// Update upcoming deadlines widget
function updateUpcomingDeadlines(categorized) {
    // Modern deadlines list
    const modernDeadlinesList = document.getElementById('upcoming-deadlines-modern');
    if (modernDeadlinesList && categorized) {
        const urgent = [...(categorized?.overdue || []), ...(categorized?.thisWeek || [])];
        
        if (urgent.length === 0) {
            modernDeadlinesList.innerHTML = `
                <div class="text-center py-8 text-gray-400">
                    <i class="fas fa-calendar-alt text-3xl mb-2"></i>
                    <p class="text-body-small">No upcoming deadlines</p>
                </div>
            `;
        } else {
            modernDeadlinesList.innerHTML = urgent.slice(0, 5).map(deadline => {
                const isOverdue = new Date(deadline.date) < new Date();
                return `
                    <div class="modern-deadline-item">
                        <div class="modern-deadline-indicator ${isOverdue ? 'overdue' : 'upcoming'}"></div>
                        <div class="modern-deadline-content">
                            <div class="modern-deadline-header">
                                <h4 class="modern-deadline-title">${deadline.title}</h4>
                                <span class="modern-deadline-date ${isOverdue ? 'overdue' : 'upcoming'}">
                                    ${formatDate(deadline.date)}
                                </span>
                            </div>
                            <p class="modern-deadline-university">${deadline.university?.name || 'General'}</p>
                            <div class="modern-deadline-status">
                                <i class="fas fa-clock"></i>
                                <span>${isOverdue ? 'Overdue' : getTimeUntil(deadline.date)}</span>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
    
    // Legacy list support
    const upcomingList = document.getElementById('upcoming-deadlines-list');
    if (upcomingList && categorized) {
        const urgent = [...(categorized?.overdue || []), ...(categorized?.thisWeek || [])];
        
        if (urgent.length === 0) {
            upcomingList.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-calendar-alt text-3xl mb-2"></i>
                    <p>No upcoming deadlines</p>
                </div>
            `;
        } else {
            upcomingList.innerHTML = urgent.slice(0, 5).map(deadline => {
                const isOverdue = new Date(deadline.date) < new Date();
                return `
                    <div class="border-l-4 ${isOverdue ? 'border-red-500' : 'border-yellow-500'} pl-4 py-2">
                        <div class="flex justify-between items-start">
                            <div>
                                <h4 class="font-medium">${deadline.title}</h4>
                                <p class="text-sm text-gray-500">${deadline.university?.name || 'General'}</p>
                            </div>
                            <span class="text-sm font-medium ${isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'} px-2 py-1 rounded">
                                ${formatDate(deadline.date)}
                            </span>
                        </div>
                        <div class="flex items-center mt-2 text-sm text-gray-500">
                            <i class="fas fa-clock mr-2"></i>
                            <span>${isOverdue ? 'Overdue' : getTimeUntil(deadline.date)}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }
}

// Setup event listeners
function setupEventListeners() {
    // Add university button
    const addUniversityBtn = document.getElementById('add-university-btn');
    if (addUniversityBtn) {
        addUniversityBtn.addEventListener('click', showAddUniversityModal);
    }

    // Add task buttons (there might be multiple)
    const addTaskBtns = document.querySelectorAll('[id="add-task-btn"], [onclick*="showAddTaskModal"]');
    addTaskBtns.forEach(btn => {
        btn.addEventListener('click', showAddTaskModal);
        // Remove any existing onclick attributes
        btn.removeAttribute('onclick');
    });

    // Tab switching (keep existing functionality)
    setupTabSwitching();
    
    // Setup modal close buttons
    setupModalEvents();
}

function setupModalEvents() {
    // University modal
    const universityModal = document.getElementById('university-modal');
    if (universityModal) {
        const closeBtn = document.getElementById('close-university-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideUniversityModal);
        }
        
        universityModal.addEventListener('click', (e) => {
            if (e.target === universityModal) hideUniversityModal();
        });
    }
    
    // Task modal
    const taskModal = document.getElementById('task-modal');
    if (taskModal) {
        const closeBtn = document.getElementById('close-task-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', hideTaskModal);
        }
        
        taskModal.addEventListener('click', (e) => {
            if (e.target === taskModal) hideTaskModal();
        });
    }
}

// Helper functions
function getActivityIcon(type) {
    const icons = {
        university: 'fas fa-university',
        document: 'fas fa-file-alt',
        task: 'fas fa-tasks',
        deadline: 'fas fa-calendar-alt'
    };
    return icons[type] || 'fas fa-circle';
}

function getActivityIconBg(type) {
    const backgrounds = {
        university: 'bg-purple-100 text-purple-700',
        document: 'bg-blue-100 text-blue-700',
        task: 'bg-green-100 text-green-700',
        deadline: 'bg-red-100 text-red-700'
    };
    return backgrounds[type] || 'bg-gray-100 text-gray-700';
}

function getModernActivityIconBg(type) {
    const backgrounds = {
        university: 'modern-activity-icon-purple',
        document: 'modern-activity-icon-blue',
        task: 'modern-activity-icon-green',
        deadline: 'modern-activity-icon-red'
    };
    return backgrounds[type] || 'modern-activity-icon-gray';
}

function getPriorityClass(priority) {
    const classes = {
        'LOW': 'bg-gray-100 text-gray-800',
        'MEDIUM': 'bg-yellow-100 text-yellow-800',
        'HIGH': 'bg-orange-100 text-orange-800',
        'URGENT': 'bg-red-100 text-red-800'
    };
    return classes[priority] || 'bg-gray-100 text-gray-800';
}

function formatStatus(status) {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now - time) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
}

function getTimeUntil(dateString) {
    const now = new Date();
    const target = new Date(dateString);
    const diffInDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 0) return 'Overdue';
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Tomorrow';
    return `${diffInDays} days`;
}

function extractDomain(url) {
    if (!url) return '';
    try {
        return new URL(url).hostname;
    } catch {
        return url;
    }
}

// Modern Kanban helper functions
function updateModernKanbanPreview(kanbanTasks) {
    const todoCount = document.getElementById('todo-count');
    const progressCount = document.getElementById('progress-count');
    const doneCount = document.getElementById('done-count');
    
    const todoPreview = document.getElementById('todo-preview');
    const progressPreview = document.getElementById('progress-preview');
    const donePreview = document.getElementById('done-preview');
    
    if (todoCount) todoCount.textContent = (kanbanTasks.pending || []).length;
    if (progressCount) progressCount.textContent = (kanbanTasks.in_progress || []).length;
    if (doneCount) doneCount.textContent = (kanbanTasks.completed || []).length;
    
    // Show preview items (first 3 of each)
    if (todoPreview) {
        const pendingTasks = (kanbanTasks.pending || []).slice(0, 3);
        todoPreview.innerHTML = pendingTasks.map(task => `
            <div class="modern-kanban-mini-item">
                <span class="modern-kanban-mini-title">${task.title}</span>
                <span class="modern-kanban-mini-priority priority-${task.priority.toLowerCase()}">${task.priority}</span>
            </div>
        `).join('');
    }
    
    if (progressPreview) {
        const inProgressTasks = (kanbanTasks.in_progress || []).slice(0, 3);
        progressPreview.innerHTML = inProgressTasks.map(task => `
            <div class="modern-kanban-mini-item">
                <span class="modern-kanban-mini-title">${task.title}</span>
                <span class="modern-kanban-mini-priority priority-${task.priority.toLowerCase()}">${task.priority}</span>
            </div>
        `).join('');
    }
    
    if (donePreview) {
        const completedTasks = (kanbanTasks.completed || []).slice(0, 3);
        donePreview.innerHTML = completedTasks.map(task => `
            <div class="modern-kanban-mini-item">
                <span class="modern-kanban-mini-title">${task.title}</span>
                <span class="modern-kanban-mini-priority priority-${task.priority.toLowerCase()}">${task.priority}</span>
            </div>
        `).join('');
    }
}

function updateFullKanbanBoard(kanbanTasks) {
    const modernKanbanBoard = document.getElementById('modern-kanban-board');
    if (!modernKanbanBoard) return;
    
    const columns = [
        { key: 'pending', title: 'To Do', icon: 'fas fa-circle' },
        { key: 'in_progress', title: 'In Progress', icon: 'fas fa-play-circle' },
        { key: 'completed', title: 'Done', icon: 'fas fa-check-circle' }
    ];
    
    modernKanbanBoard.innerHTML = columns.map(column => {
        const columnTasks = kanbanTasks[column.key] || [];
        return `
            <div class="modern-kanban-column">
                <div class="modern-kanban-header">
                    <div class="flex items-center gap-2">
                        <i class="${column.icon}"></i>
                        <span class="modern-kanban-title">${column.title}</span>
                    </div>
                    <span class="modern-kanban-count">${columnTasks.length}</span>
                </div>
                <div class="modern-kanban-items">
                    ${columnTasks.map(task => `
                        <div class="modern-kanban-item" data-task-id="${task.id}">
                            <div class="modern-kanban-item-header">
                                <span class="modern-kanban-item-title">${task.title}</span>
                                <span class="modern-kanban-priority priority-${task.priority.toLowerCase()}">${task.priority}</span>
                            </div>
                            ${task.description ? `<p class="modern-kanban-item-description">${task.description}</p>` : ''}
                            <div class="modern-kanban-item-footer">
                                <span class="modern-kanban-item-due">${task.dueDate ? formatDate(task.dueDate) : 'No due date'}</span>
                                <div class="modern-kanban-item-actions">
                                    <button class="modern-btn modern-btn-ghost modern-btn-sm" onclick="editTask('${task.id}')">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="modern-btn modern-btn-ghost modern-btn-sm text-red-600" onclick="deleteTask('${task.id}')">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// Authentication handling
async function checkAuth() {
    try {
        if (!authToken) {
            console.log('No auth token found');
            showAuthPrompt();
            return false;
        }
        
        const user = await api.getCurrentUser();
        if (user) {
            console.log('✅ User authenticated:', user.name);
            updateUserUI(user);
            return true;
        } else {
            console.log('❌ Authentication failed');
            showAuthPrompt();
            return false;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showAuthPrompt();
        return false;
    }
}

function updateUserUI(user) {
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.textContent = user.name || user.email || 'User';
    }
}

function showAuthPrompt() {
    // Create a simple auth prompt for now
    const authRequired = document.createElement('div');
    authRequired.className = 'modern-modal';
    authRequired.innerHTML = `
        <div class="modern-modal-content">
            <div class="modern-modal-header">
                <h2 class="text-heading-2">Authentication Required</h2>
            </div>
            <div class="modern-modal-body text-center">
                <p class="text-body mb-4">Please log in to access your application manager.</p>
                <button class="modern-btn modern-btn-primary" onclick="this.closest('.modern-modal').remove(); window.location.reload();">
                    Refresh Page
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(authRequired);
}

// Update dropdowns with universities data
function updateUniversitiesDropdowns() {
    const dropdowns = document.querySelectorAll('select[name="universityId"]');
    dropdowns.forEach(dropdown => {
        const currentValue = dropdown.value;
        dropdown.innerHTML = '<option value="">None</option>';
        universities.forEach(uni => {
            const option = document.createElement('option');
            option.value = uni.id;
            option.textContent = uni.name;
            if (currentValue === uni.id) option.selected = true;
            dropdown.appendChild(option);
        });
    });
}