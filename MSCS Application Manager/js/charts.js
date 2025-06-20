// Interactive Charts and Analytics Module
// Requires Chart.js to be loaded

class AnalyticsCharts {
    constructor() {
        this.charts = {};
        this.chartColors = {
            primary: '#000000',
            secondary: '#6b7280',
            accent: '#3b82f6',
            success: '#16a34a',
            warning: '#f59e0b',
            danger: '#ef4444',
            background: '#f9fafb',
            border: '#e5e7eb'
        };
        
        // Chart.js default configuration
        Chart.defaults.font.family = 'Inter, system-ui, sans-serif';
        Chart.defaults.color = this.chartColors.secondary;
        Chart.defaults.borderColor = this.chartColors.border;
        Chart.defaults.backgroundColor = this.chartColors.background;
    }

    // Initialize all charts
    async initializeCharts() {
        try {
            console.log('📊 Initializing analytics charts...');
            
            // Wait for data to be loaded
            await this.waitForData();
            
            // Initialize different chart types
            this.initializeProgressChart();
            this.initializeApplicationStatusChart();
            this.initializeTimelineChart();
            this.initializeDeadlinesChart();
            this.initializePriorityDistribution();
            this.initializeMonthlyProgress();
            this.initializeUniversityRankingsChart();
            this.initializeDeadlineCalendarHeatmap();
            this.initializeApplicationFunnelChart();
            
            console.log('✅ All charts initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize charts:', error);
        }
    }

    // Wait for global data to be available
    async waitForData(maxWait = 5000) {
        const startTime = Date.now();
        while ((!window.universities || !window.tasks) && (Date.now() - startTime) < maxWait) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // Application Progress Chart
    initializeProgressChart() {
        const ctx = document.getElementById('progress-chart');
        if (!ctx) return;

        // Clear placeholder
        const placeholder = ctx.parentElement.querySelector('.modern-chart-placeholder');
        if (placeholder) placeholder.style.display = 'none';

        const data = this.getProgressData();
        
        this.charts.progress = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Applications Submitted',
                    data: data.applications,
                    borderColor: this.chartColors.primary,
                    backgroundColor: this.chartColors.primary + '10',
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.chartColors.primary,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6
                }, {
                    label: 'Tasks Completed',
                    data: data.tasks,
                    borderColor: this.chartColors.accent,
                    backgroundColor: this.chartColors.accent + '10',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: this.chartColors.accent,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: {
                            boxWidth: 12,
                            boxHeight: 12,
                            borderRadius: 6,
                            useBorderRadius: true,
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: this.chartColors.border,
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        boxPadding: 4
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: this.chartColors.border + '40'
                        },
                        border: {
                            display: false
                        },
                        ticks: {
                            stepSize: 1,
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                elements: {
                    point: {
                        hoverRadius: 8
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // Application Status Pie Chart
    initializeApplicationStatusChart() {
        const ctx = document.getElementById('status-chart');
        if (!ctx) {
            // Create status chart element if it doesn't exist
            this.createStatusChart();
            return;
        }

        const statusData = this.getStatusData();
        
        this.charts.status = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: statusData.labels,
                datasets: [{
                    data: statusData.values,
                    backgroundColor: [
                        this.chartColors.secondary,
                        this.chartColors.warning,
                        this.chartColors.accent,
                        this.chartColors.success,
                        this.chartColors.danger
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 3,
                    hoverBorderWidth: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            boxWidth: 12,
                            boxHeight: 12,
                            borderRadius: 6,
                            useBorderRadius: true,
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Timeline Progress Chart
    initializeTimelineChart() {
        const ctx = document.getElementById('timeline-chart');
        if (!ctx) {
            this.createTimelineChart();
            return;
        }

        const timelineData = this.getTimelineData();
        
        this.charts.timeline = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: timelineData.labels,
                datasets: [{
                    label: 'Completed',
                    data: timelineData.completed,
                    backgroundColor: this.chartColors.success + '80',
                    borderColor: this.chartColors.success,
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }, {
                    label: 'Pending',
                    data: timelineData.pending,
                    backgroundColor: this.chartColors.warning + '80',
                    borderColor: this.chartColors.warning,
                    borderWidth: 1,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: true,
                        grid: {
                            display: false
                        },
                        border: {
                            display: false
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        grid: {
                            color: this.chartColors.border + '40'
                        },
                        border: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end'
                    }
                }
            }
        });
    }

    // Deadlines Chart
    initializeDeadlinesChart() {
        const ctx = document.getElementById('deadlines-chart');
        if (!ctx) {
            this.createDeadlinesChart();
            return;
        }

        const deadlineData = this.getDeadlineData();
        
        this.charts.deadlines = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: deadlineData.labels,
                datasets: [{
                    label: 'Upcoming Deadlines',
                    data: deadlineData.values,
                    borderColor: this.chartColors.danger,
                    backgroundColor: this.chartColors.danger + '20',
                    borderWidth: 2,
                    pointBackgroundColor: this.chartColors.danger,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        grid: {
                            color: this.chartColors.border + '40'
                        },
                        angleLines: {
                            color: this.chartColors.border + '40'
                        },
                        pointLabels: {
                            font: {
                                size: 11
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    // Priority Distribution Chart
    initializePriorityDistribution() {
        const ctx = document.getElementById('priority-chart');
        if (!ctx) {
            this.createPriorityChart();
            return;
        }

        const priorityData = this.getPriorityData();
        
        this.charts.priority = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: priorityData.labels,
                datasets: [{
                    data: priorityData.values,
                    backgroundColor: [
                        this.chartColors.secondary + '60',
                        this.chartColors.warning + '60',
                        this.chartColors.danger + '60',
                        this.chartColors.danger + '80'
                    ],
                    borderColor: [
                        this.chartColors.secondary,
                        this.chartColors.warning,
                        this.chartColors.danger,
                        this.chartColors.danger
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        grid: {
                            color: this.chartColors.border + '40'
                        }
                    }
                }
            }
        });
    }

    // Monthly Progress Chart
    initializeMonthlyProgress() {
        const ctx = document.getElementById('monthly-progress-chart');
        if (!ctx) {
            this.createMonthlyProgressChart();
            return;
        }

        const monthlyData = this.getMonthlyProgressData();
        
        this.charts.monthly = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Universities Added',
                    data: monthlyData.universities,
                    backgroundColor: this.chartColors.primary + '80',
                    borderColor: this.chartColors.primary,
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false
                }, {
                    label: 'Applications Submitted',
                    data: monthlyData.applications,
                    backgroundColor: this.chartColors.accent + '80',
                    borderColor: this.chartColors.accent,
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        align: 'end'
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        border: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: this.chartColors.border + '40'
                        },
                        border: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Data processing methods
    getProgressData() {
        const last30Days = Array.from({length: 30}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return date;
        });

        const applications = last30Days.map(date => {
            if (!window.universities) return 0;
            return window.universities.filter(uni => {
                const createdDate = new Date(uni.createdAt || Date.now());
                return createdDate.toDateString() === date.toDateString() && 
                       uni.status === 'APPLIED';
            }).length;
        });

        const tasks = last30Days.map(date => {
            if (!window.tasks) return 0;
            return window.tasks.filter(task => {
                const completedDate = new Date(task.updatedAt || task.createdAt || Date.now());
                return completedDate.toDateString() === date.toDateString() && 
                       task.status === 'COMPLETED';
            }).length;
        });

        return {
            labels: last30Days.map(date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
            applications: applications,
            tasks: tasks
        };
    }

    getStatusData() {
        if (!window.universities || window.universities.length === 0) {
            return {
                labels: ['No data available'],
                values: [1]
            };
        }

        const statusCounts = window.universities.reduce((acc, uni) => {
            acc[uni.status] = (acc[uni.status] || 0) + 1;
            return acc;
        }, {});

        return {
            labels: Object.keys(statusCounts).map(status => 
                status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
            ),
            values: Object.values(statusCounts)
        };
    }

    getTimelineData() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const last6Months = Array.from({length: 6}, (_, i) => {
            const monthIndex = (currentMonth - (5 - i) + 12) % 12;
            return months[monthIndex];
        });

        if (!window.tasks || window.tasks.length === 0) {
            return {
                labels: last6Months,
                completed: new Array(6).fill(0),
                pending: new Array(6).fill(0)
            };
        }

        const completed = last6Months.map(month => {
            return window.tasks.filter(task => {
                const taskDate = new Date(task.updatedAt || task.createdAt || Date.now());
                const taskMonth = months[taskDate.getMonth()];
                return taskMonth === month && task.status === 'COMPLETED';
            }).length;
        });

        const pending = last6Months.map(month => {
            return window.tasks.filter(task => {
                const taskDate = new Date(task.createdAt || Date.now());
                const taskMonth = months[taskDate.getMonth()];
                return taskMonth === month && task.status !== 'COMPLETED';
            }).length;
        });

        return {
            labels: last6Months,
            completed: completed,
            pending: pending
        };
    }

    getDeadlineData() {
        const categories = ['This Week', 'Next Week', 'This Month', 'Next Month', 'Later'];
        
        if (!window.deadlines || window.deadlines.length === 0) {
            return {
                labels: categories,
                values: [0, 0, 0, 0, 0]
            };
        }

        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const thisMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);

        const counts = [0, 0, 0, 0, 0];

        window.deadlines.forEach(deadline => {
            const deadlineDate = new Date(deadline.date);
            
            if (deadlineDate <= nextWeek) {
                if (deadlineDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) {
                    counts[0]++; // This week
                } else {
                    counts[1]++; // Next week
                }
            } else if (deadlineDate <= thisMonth) {
                counts[2]++; // This month
            } else if (deadlineDate <= nextMonth) {
                counts[3]++; // Next month
            } else {
                counts[4]++; // Later
            }
        });

        return {
            labels: categories,
            values: counts
        };
    }

    getPriorityData() {
        if (!window.tasks || window.tasks.length === 0) {
            return {
                labels: ['Low', 'Medium', 'High', 'Urgent'],
                values: [0, 0, 0, 0]
            };
        }

        const priorityCounts = window.tasks.reduce((acc, task) => {
            acc[task.priority] = (acc[task.priority] || 0) + 1;
            return acc;
        }, {});

        return {
            labels: ['Low', 'Medium', 'High', 'Urgent'],
            values: [
                priorityCounts.LOW || 0,
                priorityCounts.MEDIUM || 0,
                priorityCounts.HIGH || 0,
                priorityCounts.URGENT || 0
            ]
        };
    }

    getMonthlyProgressData() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const currentMonth = new Date().getMonth();
        const last6Months = Array.from({length: 6}, (_, i) => {
            const monthIndex = (currentMonth - (5 - i) + 12) % 12;
            return months[monthIndex];
        });

        const universities = last6Months.map(month => {
            if (!window.universities) return 0;
            return window.universities.filter(uni => {
                const uniDate = new Date(uni.createdAt || Date.now());
                const uniMonth = months[uniDate.getMonth()];
                return uniMonth === month;
            }).length;
        });

        const applications = last6Months.map(month => {
            if (!window.universities) return 0;
            return window.universities.filter(uni => {
                const appliedDate = new Date(uni.updatedAt || uni.createdAt || Date.now());
                const appliedMonth = months[appliedDate.getMonth()];
                return appliedMonth === month && uni.status === 'APPLIED';
            }).length;
        });

        return {
            labels: last6Months,
            universities: universities,
            applications: applications
        };
    }

    getUniversityRankingsData() {
        if (!window.universities || window.universities.length === 0) {
            return {
                reach: [],
                target: [],
                safety: []
            };
        }

        // Mock ranking data - in a real app, this would come from a university rankings API
        const universityRankings = {
            'Stanford University': { ranking: 2, acceptanceRate: 3.9 },
            'MIT': { ranking: 1, acceptanceRate: 4.1 },
            'UC Berkeley': { ranking: 22, acceptanceRate: 11.4 },
            'Carnegie Mellon': { ranking: 25, acceptanceRate: 15.7 },
            'University of Washington': { ranking: 59, acceptanceRate: 48.0 },
            'Georgia Tech': { ranking: 35, acceptanceRate: 21.0 },
            'UIUC': { ranking: 47, acceptanceRate: 45.0 },
            'Purdue': { ranking: 53, acceptanceRate: 53.0 }
        };

        const reach = [];
        const target = [];
        const safety = [];

        window.universities.forEach(uni => {
            const rankingData = universityRankings[uni.name] || { 
                ranking: Math.floor(Math.random() * 100) + 1, 
                acceptanceRate: Math.floor(Math.random() * 50) + 5 
            };

            const dataPoint = {
                x: rankingData.ranking,
                y: rankingData.acceptanceRate,
                name: uni.name,
                status: uni.status
            };

            switch (uni.category) {
                case 'REACH':
                    reach.push(dataPoint);
                    break;
                case 'TARGET':
                    target.push(dataPoint);
                    break;
                case 'SAFETY':
                    safety.push(dataPoint);
                    break;
            }
        });

        return { reach, target, safety };
    }

    getDeadlineHeatmapData() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        if (!window.universities || window.universities.length === 0) {
            return {
                labels: months,
                application: new Array(12).fill(0),
                lor: new Array(12).fill(0),
                other: new Array(12).fill(0)
            };
        }

        const application = new Array(12).fill(0);
        const lor = new Array(12).fill(0);
        const other = new Array(12).fill(0);

        // Count application deadlines
        window.universities.forEach(uni => {
            if (uni.deadline) {
                const month = new Date(uni.deadline).getMonth();
                application[month]++;
            }
            if (uni.lorDeadline) {
                const month = new Date(uni.lorDeadline).getMonth();
                lor[month]++;
            }
        });

        // Count other deadlines
        if (window.deadlines) {
            window.deadlines.forEach(deadline => {
                const month = new Date(deadline.date).getMonth();
                if (deadline.title.toLowerCase().includes('lor') || deadline.title.toLowerCase().includes('recommendation')) {
                    lor[month]++;
                } else if (!deadline.title.toLowerCase().includes('application')) {
                    other[month]++;
                } else {
                    application[month]++;
                }
            });
        }

        return {
            labels: months,
            application: application,
            lor: lor,
            other: other
        };
    }

    getApplicationFunnelData() {
        if (!window.universities || window.universities.length === 0) {
            return {
                labels: ['Researching', 'Planning', 'Applied', 'Admitted', 'Rejected'],
                values: [0, 0, 0, 0, 0]
            };
        }

        const statusMapping = {
            'RESEARCHING': 0,
            'PLANNING_TO_APPLY': 1,
            'APPLIED': 2,
            'ADMITTED': 3,
            'REJECTED': 4
        };

        const counts = [0, 0, 0, 0, 0];
        
        window.universities.forEach(uni => {
            const index = statusMapping[uni.status];
            if (index !== undefined) {
                counts[index]++;
            }
        });

        return {
            labels: ['Researching', 'Planning to Apply', 'Applied', 'Admitted', 'Rejected'],
            values: counts
        };
    }

    // Helper methods to create chart containers
    createStatusChart() {
        const container = document.querySelector('.modern-dashboard-grid');
        if (!container) return;

        const chartCard = document.createElement('div');
        chartCard.className = 'modern-card';
        chartCard.innerHTML = `
            <div class="modern-card-header">
                <h3 class="text-heading-3">Application Status</h3>
                <button class="modern-btn modern-btn-ghost modern-btn-sm">
                    <i class="fas fa-refresh"></i>
                </button>
            </div>
            <div class="modern-card-content">
                <div style="height: 250px; position: relative;">
                    <canvas id="status-chart"></canvas>
                </div>
            </div>
        `;
        container.appendChild(chartCard);
        
        // Reinitialize the chart
        setTimeout(() => this.initializeApplicationStatusChart(), 100);
    }

    createTimelineChart() {
        const container = document.querySelector('.modern-dashboard-grid');
        if (!container) return;

        const chartCard = document.createElement('div');
        chartCard.className = 'modern-card';
        chartCard.innerHTML = `
            <div class="modern-card-header">
                <h3 class="text-heading-3">Task Timeline</h3>
                <select class="modern-select modern-select-sm">
                    <option>Last 6 months</option>
                    <option>Last 3 months</option>
                    <option>This year</option>
                </select>
            </div>
            <div class="modern-card-content">
                <div style="height: 250px; position: relative;">
                    <canvas id="timeline-chart"></canvas>
                </div>
            </div>
        `;
        container.appendChild(chartCard);
        
        setTimeout(() => this.initializeTimelineChart(), 100);
    }

    createDeadlinesChart() {
        const container = document.querySelector('.modern-dashboard-grid');
        if (!container) return;

        const chartCard = document.createElement('div');
        chartCard.className = 'modern-card';
        chartCard.innerHTML = `
            <div class="modern-card-header">
                <h3 class="text-heading-3">Deadline Distribution</h3>
            </div>
            <div class="modern-card-content">
                <div style="height: 250px; position: relative;">
                    <canvas id="deadlines-chart"></canvas>
                </div>
            </div>
        `;
        container.appendChild(chartCard);
        
        setTimeout(() => this.initializeDeadlinesChart(), 100);
    }

    createPriorityChart() {
        const container = document.querySelector('.modern-dashboard-grid');
        if (!container) return;

        const chartCard = document.createElement('div');
        chartCard.className = 'modern-card';
        chartCard.innerHTML = `
            <div class="modern-card-header">
                <h3 class="text-heading-3">Task Priority</h3>
            </div>
            <div class="modern-card-content">
                <div style="height: 250px; position: relative;">
                    <canvas id="priority-chart"></canvas>
                </div>
            </div>
        `;
        container.appendChild(chartCard);
        
        setTimeout(() => this.initializePriorityDistribution(), 100);
    }

    createMonthlyProgressChart() {
        const container = document.querySelector('.modern-dashboard-grid');
        if (!container) return;

        const chartCard = document.createElement('div');
        chartCard.className = 'modern-card modern-chart-card';
        chartCard.innerHTML = `
            <div class="modern-card-header">
                <h3 class="text-heading-3">Monthly Progress</h3>
                <div class="modern-chart-controls">
                    <select class="modern-select modern-select-sm">
                        <option>Last 6 months</option>
                        <option>This year</option>
                        <option>All time</option>
                    </select>
                </div>
            </div>
            <div class="modern-card-content">
                <div style="height: 300px; position: relative;">
                    <canvas id="monthly-progress-chart"></canvas>
                </div>
            </div>
        `;
        container.appendChild(chartCard);
        
        setTimeout(() => this.initializeMonthlyProgress(), 100);
    }

    createRankingsChart() {
        const container = document.querySelector('.modern-analytics-grid');
        if (!container) return;

        const chartCard = document.createElement('div');
        chartCard.className = 'modern-card';
        chartCard.innerHTML = `
            <div class="modern-card-header">
                <h3 class="text-heading-3">University Rankings vs Acceptance Rate</h3>
                <button class="modern-btn modern-btn-ghost modern-btn-sm">
                    <i class="fas fa-info-circle"></i>
                </button>
            </div>
            <div class="modern-card-content">
                <div style="height: 300px; position: relative;">
                    <canvas id="rankings-chart"></canvas>
                </div>
            </div>
        `;
        container.appendChild(chartCard);
        
        setTimeout(() => this.initializeUniversityRankingsChart(), 100);
    }

    createDeadlineHeatmap() {
        const container = document.querySelector('.modern-analytics-grid');
        if (!container) return;

        const chartCard = document.createElement('div');
        chartCard.className = 'modern-card modern-chart-card';
        chartCard.innerHTML = `
            <div class="modern-card-header">
                <h3 class="text-heading-3">Deadline Calendar Heatmap</h3>
                <div class="modern-chart-controls">
                    <select class="modern-select modern-select-sm">
                        <option>2024</option>
                        <option>2025</option>
                    </select>
                </div>
            </div>
            <div class="modern-card-content">
                <div style="height: 300px; position: relative;">
                    <canvas id="deadline-heatmap"></canvas>
                </div>
            </div>
        `;
        container.appendChild(chartCard);
        
        setTimeout(() => this.initializeDeadlineCalendarHeatmap(), 100);
    }

    createFunnelChart() {
        const container = document.querySelector('.modern-analytics-grid');
        if (!container) return;

        const chartCard = document.createElement('div');
        chartCard.className = 'modern-card';
        chartCard.innerHTML = `
            <div class="modern-card-header">
                <h3 class="text-heading-3">Application Funnel</h3>
                <button class="modern-btn modern-btn-ghost modern-btn-sm">
                    <i class="fas fa-funnel-dollar"></i>
                </button>
            </div>
            <div class="modern-card-content">
                <div style="height: 300px; position: relative;">
                    <canvas id="funnel-chart"></canvas>
                </div>
            </div>
        `;
        container.appendChild(chartCard);
        
        setTimeout(() => this.initializeApplicationFunnelChart(), 100);
    }

    // University Rankings Chart
    initializeUniversityRankingsChart() {
        const ctx = document.getElementById('rankings-chart');
        if (!ctx) {
            this.createRankingsChart();
            return;
        }

        const rankingsData = this.getUniversityRankingsData();
        
        this.charts.rankings = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Reach Schools',
                    data: rankingsData.reach,
                    backgroundColor: this.chartColors.danger + '80',
                    borderColor: this.chartColors.danger,
                    borderWidth: 2,
                    pointRadius: 8,
                    pointHoverRadius: 10
                }, {
                    label: 'Target Schools',
                    data: rankingsData.target,
                    backgroundColor: this.chartColors.warning + '80',
                    borderColor: this.chartColors.warning,
                    borderWidth: 2,
                    pointRadius: 8,
                    pointHoverRadius: 10
                }, {
                    label: 'Safety Schools',
                    data: rankingsData.safety,
                    backgroundColor: this.chartColors.success + '80',
                    borderColor: this.chartColors.success,
                    borderWidth: 2,
                    pointRadius: 8,
                    pointHoverRadius: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 8,
                        callbacks: {
                            title: function(context) {
                                return context[0].raw.name || 'University';
                            },
                            label: function(context) {
                                const point = context.raw;
                                return [
                                    `Acceptance Rate: ${point.y}%`,
                                    `Ranking: #${point.x}`,
                                    `Status: ${point.status || 'Unknown'}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'University Ranking'
                        },
                        min: 0,
                        max: 100,
                        reverse: false
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Acceptance Rate (%)'
                        },
                        min: 0,
                        max: 100
                    }
                }
            }
        });
    }

    // Deadline Calendar Heatmap
    initializeDeadlineCalendarHeatmap() {
        const ctx = document.getElementById('deadline-heatmap');
        if (!ctx) {
            this.createDeadlineHeatmap();
            return;
        }

        const heatmapData = this.getDeadlineHeatmapData();
        
        this.charts.heatmap = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: heatmapData.labels,
                datasets: [{
                    label: 'Application Deadlines',
                    data: heatmapData.application,
                    backgroundColor: this.chartColors.danger + '80',
                    borderColor: this.chartColors.danger,
                    borderWidth: 1,
                    borderRadius: 4
                }, {
                    label: 'LOR Deadlines',
                    data: heatmapData.lor,
                    backgroundColor: this.chartColors.warning + '80',
                    borderColor: this.chartColors.warning,
                    borderWidth: 1,
                    borderRadius: 4
                }, {
                    label: 'Other Deadlines',
                    data: heatmapData.other,
                    backgroundColor: this.chartColors.accent + '80',
                    borderColor: this.chartColors.accent,
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 8
                    }
                },
                scales: {
                    x: {
                        stacked: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // Application Funnel Chart
    initializeApplicationFunnelChart() {
        const ctx = document.getElementById('funnel-chart');
        if (!ctx) {
            this.createFunnelChart();
            return;
        }

        const funnelData = this.getApplicationFunnelData();
        
        this.charts.funnel = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: funnelData.labels,
                datasets: [{
                    label: 'Universities',
                    data: funnelData.values,
                    backgroundColor: [
                        this.chartColors.secondary + '80',
                        this.chartColors.warning + '80',
                        this.chartColors.accent + '80',
                        this.chartColors.success + '80',
                        this.chartColors.danger + '80'
                    ],
                    borderColor: [
                        this.chartColors.secondary,
                        this.chartColors.warning,
                        this.chartColors.accent,
                        this.chartColors.success,
                        this.chartColors.danger
                    ],
                    borderWidth: 2,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed.x / total) * 100).toFixed(1);
                                return `${context.parsed.x} universities (${percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: this.chartColors.border + '40'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Update charts with new data
    updateCharts() {
        console.log('📊 Updating charts with new data...');
        
        Object.keys(this.charts).forEach(chartKey => {
            const chart = this.charts[chartKey];
            if (chart && chart.data) {
                try {
                    // Update data based on chart type
                    switch (chartKey) {
                        case 'progress':
                            const progressData = this.getProgressData();
                            chart.data.labels = progressData.labels;
                            chart.data.datasets[0].data = progressData.applications;
                            chart.data.datasets[1].data = progressData.tasks;
                            break;
                        case 'status':
                            const statusData = this.getStatusData();
                            chart.data.labels = statusData.labels;
                            chart.data.datasets[0].data = statusData.values;
                            break;
                        case 'timeline':
                            const timelineData = this.getTimelineData();
                            chart.data.labels = timelineData.labels;
                            chart.data.datasets[0].data = timelineData.completed;
                            chart.data.datasets[1].data = timelineData.pending;
                            break;
                        case 'deadlines':
                            const deadlineData = this.getDeadlineData();
                            chart.data.datasets[0].data = deadlineData.values;
                            break;
                        case 'priority':
                            const priorityData = this.getPriorityData();
                            chart.data.datasets[0].data = priorityData.values;
                            break;
                        case 'monthly':
                            const monthlyData = this.getMonthlyProgressData();
                            chart.data.labels = monthlyData.labels;
                            chart.data.datasets[0].data = monthlyData.universities;
                            chart.data.datasets[1].data = monthlyData.applications;
                            break;
                        case 'rankings':
                            const rankingsData = this.getUniversityRankingsData();
                            chart.data.datasets[0].data = rankingsData.reach;
                            chart.data.datasets[1].data = rankingsData.target;
                            chart.data.datasets[2].data = rankingsData.safety;
                            break;
                        case 'heatmap':
                            const heatmapData = this.getDeadlineHeatmapData();
                            chart.data.datasets[0].data = heatmapData.application;
                            chart.data.datasets[1].data = heatmapData.lor;
                            chart.data.datasets[2].data = heatmapData.other;
                            break;
                        case 'funnel':
                            const funnelData = this.getApplicationFunnelData();
                            chart.data.datasets[0].data = funnelData.values;
                            break;
                    }
                    
                    chart.update('active');
                } catch (error) {
                    console.error(`Failed to update ${chartKey} chart:`, error);
                }
            }
        });
    }

    // Destroy all charts
    destroyCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        this.charts = {};
    }
}

// Global instance
window.analyticsCharts = new AnalyticsCharts();

// Initialize charts when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for other scripts to load data first
    setTimeout(() => {
        window.analyticsCharts.initializeCharts();
    }, 2000);
});

// Update charts when data changes
function updateAnalyticsCharts() {
    if (window.analyticsCharts) {
        window.analyticsCharts.updateCharts();
    }
}