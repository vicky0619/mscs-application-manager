// Enhanced Kanban Board with Drag & Drop and Filtering
// Requires SortableJS for drag & drop functionality

class KanbanBoard {
    constructor() {
        this.tasks = [];
        this.filters = {
            priority: 'all',
            university: 'all',
            search: ''
        };
        this.sortBy = 'created';
        this.sortOrder = 'desc';
        this.draggedElement = null;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Filter change handlers
        document.addEventListener('change', (e) => {
            if (e.target.matches('.kanban-filter-priority')) {
                this.filters.priority = e.target.value;
                this.renderKanban();
            }
            if (e.target.matches('.kanban-filter-university')) {
                this.filters.university = e.target.value;
                this.renderKanban();
            }
            if (e.target.matches('.kanban-sort-select')) {
                const [field, order] = e.target.value.split('-');
                this.sortBy = field;
                this.sortOrder = order;
                this.renderKanban();
            }
        });

        // Search handler
        document.addEventListener('input', (e) => {
            if (e.target.matches('.kanban-search-input')) {
                this.filters.search = e.target.value;
                this.debounceRender();
            }
        });

        // Clear filters
        document.addEventListener('click', (e) => {
            if (e.target.matches('.kanban-clear-filters')) {
                this.clearFilters();
            }
        });
    }

    // Debounced render for search
    debounceRender = this.debounce(() => {
        this.renderKanban();
    }, 300);

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    setTasks(tasks) {
        this.tasks = tasks || [];
        this.renderKanban();
    }

    clearFilters() {
        this.filters = {
            priority: 'all',
            university: 'all',
            search: ''
        };
        
        // Reset form controls
        const prioritySelect = document.querySelector('.kanban-filter-priority');
        const universitySelect = document.querySelector('.kanban-filter-university');
        const searchInput = document.querySelector('.kanban-search-input');
        
        if (prioritySelect) prioritySelect.value = 'all';
        if (universitySelect) universitySelect.value = 'all';
        if (searchInput) searchInput.value = '';
        
        this.renderKanban();
    }

    filterTasks(tasks) {
        return tasks.filter(task => {
            // Priority filter
            if (this.filters.priority !== 'all' && task.priority !== this.filters.priority) {
                return false;
            }
            
            // University filter
            if (this.filters.university !== 'all' && task.universityId !== this.filters.university) {
                return false;
            }
            
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const titleMatch = task.title.toLowerCase().includes(searchTerm);
                const descMatch = task.description && task.description.toLowerCase().includes(searchTerm);
                if (!titleMatch && !descMatch) {
                    return false;
                }
            }
            
            return true;
        });
    }

    sortTasks(tasks) {
        return tasks.sort((a, b) => {
            let aVal, bVal;
            
            switch (this.sortBy) {
                case 'created':
                    aVal = new Date(a.createdAt || 0);
                    bVal = new Date(b.createdAt || 0);
                    break;
                case 'priority':
                    const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                    aVal = priorityOrder[a.priority] || 0;
                    bVal = priorityOrder[b.priority] || 0;
                    break;
                case 'due':
                    aVal = a.dueDate ? new Date(a.dueDate) : new Date('2099-12-31');
                    bVal = b.dueDate ? new Date(b.dueDate) : new Date('2099-12-31');
                    break;
                case 'title':
                    aVal = a.title.toLowerCase();
                    bVal = b.title.toLowerCase();
                    break;
                default:
                    return 0;
            }
            
            if (aVal < bVal) return this.sortOrder === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }

    groupTasksByStatus(tasks) {
        const filtered = this.filterTasks(tasks);
        const sorted = this.sortTasks(filtered);
        
        return {
            pending: sorted.filter(task => task.status === 'PENDING'),
            in_progress: sorted.filter(task => task.status === 'IN_PROGRESS'),
            completed: sorted.filter(task => task.status === 'COMPLETED')
        };
    }

    renderKanban() {
        const kanbanBoard = document.getElementById('modern-kanban-board');
        if (!kanbanBoard) return;

        const groupedTasks = this.groupTasksByStatus(this.tasks);
        
        kanbanBoard.innerHTML = `
            <!-- Kanban Controls -->
            <div class="modern-kanban-controls">
                <div class="modern-kanban-filters">
                    <div class="modern-filter-group">
                        <label class="modern-label">Search Tasks</label>
                        <div class="modern-search-wrapper">
                            <input type="text" class="modern-input kanban-search-input" placeholder="Search by title or description...">
                            <i class="fas fa-search modern-search-icon"></i>
                        </div>
                    </div>
                    
                    <div class="modern-filter-group">
                        <label class="modern-label">Priority</label>
                        <select class="modern-select kanban-filter-priority">
                            <option value="all">All Priorities</option>
                            <option value="URGENT">Urgent</option>
                            <option value="HIGH">High</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="LOW">Low</option>
                        </select>
                    </div>
                    
                    <div class="modern-filter-group">
                        <label class="modern-label">University</label>
                        <select class="modern-select kanban-filter-university">
                            <option value="all">All Universities</option>
                            ${this.getUniversityOptions()}
                        </select>
                    </div>
                    
                    <div class="modern-filter-group">
                        <label class="modern-label">Sort By</label>
                        <select class="modern-select kanban-sort-select">
                            <option value="created-desc">Newest First</option>
                            <option value="created-asc">Oldest First</option>
                            <option value="priority-desc">Priority: High to Low</option>
                            <option value="priority-asc">Priority: Low to High</option>
                            <option value="due-asc">Due Date: Soonest</option>
                            <option value="due-desc">Due Date: Latest</option>
                            <option value="title-asc">Title: A to Z</option>
                            <option value="title-desc">Title: Z to A</option>
                        </select>
                    </div>
                    
                    <button class="modern-btn modern-btn-ghost kanban-clear-filters">
                        <i class="fas fa-times"></i>
                        Clear Filters
                    </button>
                </div>
                
                <div class="modern-kanban-stats">
                    <div class="modern-stat-pill">
                        <span class="modern-stat-pill-label">Total:</span>
                        <span class="modern-stat-pill-value">${this.filterTasks(this.tasks).length}</span>
                    </div>
                    <div class="modern-stat-pill">
                        <span class="modern-stat-pill-label">To Do:</span>
                        <span class="modern-stat-pill-value">${groupedTasks.pending.length}</span>
                    </div>
                    <div class="modern-stat-pill">
                        <span class="modern-stat-pill-label">In Progress:</span>
                        <span class="modern-stat-pill-value">${groupedTasks.in_progress.length}</span>
                    </div>
                    <div class="modern-stat-pill">
                        <span class="modern-stat-pill-label">Done:</span>
                        <span class="modern-stat-pill-value">${groupedTasks.completed.length}</span>
                    </div>
                </div>
            </div>
            
            <!-- Kanban Columns -->
            <div class="modern-kanban-columns">
                ${this.renderColumn('pending', 'To Do', groupedTasks.pending)}
                ${this.renderColumn('in_progress', 'In Progress', groupedTasks.in_progress)}
                ${this.renderColumn('completed', 'Done', groupedTasks.completed)}
            </div>
        `;

        // Initialize drag and drop
        this.initializeDragAndDrop();
        
        // Set current filter values
        this.setFilterValues();
    }

    renderColumn(status, title, tasks) {
        const statusIcons = {
            pending: 'fas fa-circle',
            in_progress: 'fas fa-play-circle',
            completed: 'fas fa-check-circle'
        };

        return `
            <div class="modern-kanban-column" data-status="${status}">
                <div class="modern-kanban-column-header">
                    <div class="modern-kanban-column-title">
                        <i class="${statusIcons[status]}"></i>
                        <span>${title}</span>
                    </div>
                    <div class="modern-kanban-column-count">${tasks.length}</div>
                </div>
                
                <div class="modern-kanban-column-content" data-status="${status}">
                    ${tasks.map(task => this.renderTaskCard(task)).join('')}
                    
                    ${tasks.length === 0 ? `
                        <div class="modern-kanban-empty">
                            <i class="fas fa-inbox"></i>
                            <p>No tasks in ${title.toLowerCase()}</p>
                        </div>
                    ` : ''}
                </div>
                
                <div class="modern-kanban-column-footer">
                    <button class="modern-btn modern-btn-ghost modern-btn-sm" onclick="showAddTaskModal('${status}')">
                        <i class="fas fa-plus"></i>
                        Add Task
                    </button>
                </div>
            </div>
        `;
    }

    renderTaskCard(task) {
        const priorityColors = {
            'URGENT': 'priority-urgent',
            'HIGH': 'priority-high',
            'MEDIUM': 'priority-medium',
            'LOW': 'priority-low'
        };

        const university = window.universities?.find(uni => uni.id === task.universityId);
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

        return `
            <div class="modern-kanban-task-card ${isOverdue ? 'overdue' : ''}" 
                 data-task-id="${task.id}" 
                 draggable="true">
                
                <div class="modern-kanban-task-header">
                    <div class="modern-kanban-task-priority ${priorityColors[task.priority] || 'priority-medium'}">
                        ${task.priority}
                    </div>
                    <div class="modern-kanban-task-actions">
                        <button class="modern-btn modern-btn-ghost modern-btn-xs" onclick="editTask('${task.id}')" title="Edit Task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="modern-btn modern-btn-ghost modern-btn-xs" onclick="deleteTask('${task.id}')" title="Delete Task">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                
                <div class="modern-kanban-task-content">
                    <h4 class="modern-kanban-task-title">${task.title}</h4>
                    ${task.description ? `<p class="modern-kanban-task-description">${task.description}</p>` : ''}
                </div>
                
                <div class="modern-kanban-task-footer">
                    ${university ? `
                        <div class="modern-kanban-task-university">
                            <i class="fas fa-university"></i>
                            ${university.name}
                        </div>
                    ` : ''}
                    
                    ${task.dueDate ? `
                        <div class="modern-kanban-task-due ${isOverdue ? 'overdue' : ''}">
                            <i class="fas fa-calendar"></i>
                            ${this.formatDate(task.dueDate)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getUniversityOptions() {
        if (!window.universities || window.universities.length === 0) {
            return '';
        }
        
        return window.universities.map(uni => 
            `<option value="${uni.id}">${uni.name}</option>`
        ).join('');
    }

    setFilterValues() {
        const prioritySelect = document.querySelector('.kanban-filter-priority');
        const universitySelect = document.querySelector('.kanban-filter-university');
        const searchInput = document.querySelector('.kanban-search-input');
        const sortSelect = document.querySelector('.kanban-sort-select');
        
        if (prioritySelect) prioritySelect.value = this.filters.priority;
        if (universitySelect) universitySelect.value = this.filters.university;
        if (searchInput) searchInput.value = this.filters.search;
        if (sortSelect) sortSelect.value = `${this.sortBy}-${this.sortOrder}`;
    }

    initializeDragAndDrop() {
        const columns = document.querySelectorAll('.modern-kanban-column-content');
        
        columns.forEach(column => {
            // Make sortable if SortableJS is available
            if (window.Sortable) {
                new Sortable(column, {
                    group: 'kanban',
                    animation: 150,
                    ghostClass: 'modern-kanban-ghost',
                    chosenClass: 'modern-kanban-chosen',
                    dragClass: 'modern-kanban-drag',
                    onEnd: (evt) => this.handleTaskMove(evt)
                });
            } else {
                // Fallback to native drag and drop
                this.setupNativeDragAndDrop(column);
            }
        });
    }

    setupNativeDragAndDrop(column) {
        // Drag start
        column.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('modern-kanban-task-card')) {
                this.draggedElement = e.target;
                e.target.classList.add('modern-kanban-dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', e.target.outerHTML);
            }
        });

        // Drag over
        column.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            column.classList.add('modern-kanban-drop-zone');
        });

        // Drag leave
        column.addEventListener('dragleave', (e) => {
            if (!column.contains(e.relatedTarget)) {
                column.classList.remove('modern-kanban-drop-zone');
            }
        });

        // Drop
        column.addEventListener('drop', (e) => {
            e.preventDefault();
            column.classList.remove('modern-kanban-drop-zone');
            
            if (this.draggedElement) {
                const taskId = this.draggedElement.dataset.taskId;
                const newStatus = column.dataset.status;
                this.moveTask(taskId, newStatus);
            }
        });

        // Drag end
        column.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('modern-kanban-task-card')) {
                e.target.classList.remove('modern-kanban-dragging');
                this.draggedElement = null;
            }
        });
    }

    handleTaskMove(evt) {
        const taskId = evt.item.dataset.taskId;
        const newStatus = evt.to.dataset.status;
        this.moveTask(taskId, newStatus);
    }

    async moveTask(taskId, newStatus) {
        const statusMapping = {
            'pending': 'PENDING',
            'in_progress': 'IN_PROGRESS',
            'completed': 'COMPLETED'
        };

        const mappedStatus = statusMapping[newStatus];
        if (!mappedStatus) return;

        try {
            // Update task via API
            await api.updateTask(taskId, { status: mappedStatus });
            
            // Update local task data
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                task.status = mappedStatus;
            }
            
            // Show success message
            showSuccess(`Task moved to ${newStatus.replace('_', ' ')}`);
            
            // Reload tasks to ensure consistency
            if (typeof loadTasks === 'function') {
                await loadTasks();
            }
            
        } catch (error) {
            console.error('Failed to move task:', error);
            showError('Failed to move task. Please try again.');
            // Refresh to restore correct state
            this.renderKanban();
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = date - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
            return `${Math.abs(diffDays)} days overdue`;
        } else if (diffDays === 0) {
            return 'Due today';
        } else if (diffDays === 1) {
            return 'Due tomorrow';
        } else if (diffDays <= 7) {
            return `Due in ${diffDays} days`;
        } else {
            return date.toLocaleDateString();
        }
    }
}

// Global instance
window.kanbanBoard = new KanbanBoard();

// Update kanban when tasks change
function updateKanbanBoard(tasks) {
    if (window.kanbanBoard) {
        window.kanbanBoard.setTasks(tasks);
    }
}