import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// Configuration
const SUPABASE_URL = "https://cfajcmbhspradnvofbgb.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmYWpjbWJoc3ByYWRudm9mYmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMDI0MDQsImV4cCI6MjA2OTg3ODQwNH0.mlq67ZmdeE_3_sPXY17JLd9xJ8KGDnR3eiJ9LoO9NUE";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CACHE_KEY = 'highlights_cache';
const CACHE_EXPIRY = 3600000; // 1 hour in milliseconds
const WATCH_KEY = 'highlights_watched';

// Month list for reference
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

// Global state
let allHighlights = [];
let filteredHighlights = [];
let currentFilter = 'all';
let currentYear = new Date().getFullYear().toString();
let currentModalData = null;

/**
 * Initialize the highlights module on page load
 */
window.addEventListener('DOMContentLoaded', async () => {
    try {
        // Check user session
        const { data: { session } } = await supabase.auth.getSession();
        const userId = localStorage.getItem('user_id') || session?.user?.id;

        if (!userId) {
            console.log('No user session, showing demo data');
        }

        // Check for monthly highlight on first load
        await checkAndCreateMonthlyHighlight();

        // Load highlights (cache first, then Supabase)
        await loadHighlights();

        // Setup filter listeners
        setupFilterListeners();

        // Setup keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Failed to load highlights', 'error');
    }
});

/**
 * Load highlights from cache or Supabase
 */
async function loadHighlights() {
    try {
        // Try to get cached data first
        const cached = getCachedHighlights();
        if (cached && cached.length > 0) {
            allHighlights = cached;
            renderHighlights();
            // Refresh from Supabase in background
            refreshHighlightsFromSupabase();
        } else {
            // Load from Supabase if no cache
            await loadHighlightsFromSupabase();
        }
    } catch (error) {
        console.error('Error loading highlights:', error);
        showToast('Could not load highlights', 'error');
    }
}

/**
 * Load highlights from Supabase
 */
async function loadHighlightsFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('highlights')
            .select('*')
            .order('month', { ascending: false });

        if (error) throw error;

        allHighlights = data || [];
        cacheHighlights(allHighlights);
        renderHighlights();
    } catch (error) {
        console.error('Supabase load error:', error);
        showToast('Error loading highlights from server', 'error');
    }
}

/**
 * Refresh highlights in background without blocking UI
 */
async function refreshHighlightsFromSupabase() {
    try {
        const { data, error } = await supabase
            .from('highlights')
            .select('*')
            .order('month', { ascending: false });

        if (error) throw error;

        if (data && data.length > 0) {
            allHighlights = data;
            cacheHighlights(allHighlights);
            renderHighlights();
        }
    } catch (error) {
        console.error('Background refresh error:', error);
    }
}

/**
 * Check and create monthly highlight if it doesn't exist
 */
async function checkAndCreateMonthlyHighlight() {
    try {
        const now = new Date();
        const currentMonth = MONTHS[now.getMonth()];
        const currentYear = now.getFullYear();
        const monthKey = `${currentMonth}-${currentYear}`;

        // Check if highlight exists for this month
        const { data, error } = await supabase
            .from('highlights')
            .select('id')
            .eq('month', monthKey)
            .single();

        // If no highlight exists, create one
        if (!data && error?.code === 'PGRST116') {
            const { error: insertError } = await supabase
                .from('highlights')
                .insert([{
                    month: monthKey,
                    title: `${currentMonth} ${currentYear} Highlights`,
                    description: `Join our community for the ${currentMonth} ${currentYear} monthly challenges!`,
                    completed_count: 0,
                    top_users: [],
                    is_watched: {}
                }]);

            if (insertError) {
                console.error('Error creating monthly highlight:', insertError);
            } else {
                console.log('Monthly highlight created for', monthKey);
            }
        }
    } catch (error) {
        console.error('Error checking monthly highlight:', error);
    }
}

/**
 * Cache highlights to localStorage
 */
function cacheHighlights(highlights) {
    try {
        const cacheData = {
            highlights: highlights,
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Cache error:', error);
    }
}

/**
 * Get cached highlights if valid
 */
function getCachedHighlights() {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;

        const cacheData = JSON.parse(cached);
        const isExpired = Date.now() - cacheData.timestamp > CACHE_EXPIRY;

        if (isExpired) {
            localStorage.removeItem(CACHE_KEY);
            return null;
        }

        return cacheData.highlights;
    } catch (error) {
        console.error('Error reading cache:', error);
        return null;
    }
}

/**
 * Clear highlights cache
 */
function clearHighlightsCache() {
    try {
        localStorage.removeItem(CACHE_KEY);
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
}

/**
 * Mark highlight as watched
 */
async function markAsWatched(highlightId) {
    try {
        const userId = localStorage.getItem('user_id');
        if (!userId) return;

        const watchedKey = `${WATCH_KEY}_${userId}`;
        let watched = JSON.parse(localStorage.getItem(watchedKey) || '{}');

        watched[highlightId] = true;
        localStorage.setItem(watchedKey, JSON.stringify(watched));
    } catch (error) {
        console.error('Error marking as watched:', error);
    }
}

/**
 * Check if highlight is watched
 */
function isHighlightWatched(highlightId) {
    try {
        const userId = localStorage.getItem('user_id');
        if (!userId) return false;

        const watchedKey = `${WATCH_KEY}_${userId}`;
        const watched = JSON.parse(localStorage.getItem(watchedKey) || '{}');

        return watched[highlightId] === true;
    } catch (error) {
        console.error('Error checking watched status:', error);
        return false;
    }
}

/**
 * Setup filter button listeners
 */
function setupFilterListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.closest('.filter-btn').classList.add('active');
            currentFilter = e.target.closest('.filter-btn').dataset.filter;
            renderHighlights();
        });
    });

    // Year dropdown
    document.getElementById('yearSelect').addEventListener('change', (e) => {
        currentYear = e.target.value;
        renderHighlights();
    });
}

/**
 * Render highlights based on filters
 */
function renderHighlights() {
    try {
        const grid = document.getElementById('highlightsGrid');
        const emptyState = document.getElementById('emptyState');

        // Remove skeletons
        document.querySelectorAll('.highlight-card.skeleton').forEach(el => el.remove());

        // Filter highlights
        filteredHighlights = allHighlights.filter(highlight => {
            // Year filter
            if (currentYear && !highlight.month.includes(currentYear)) {
                return false;
            }

            // View filter
            const isWatched = isHighlightWatched(highlight.id);
            if (currentFilter === 'viewed' && !isWatched) return false;
            if (currentFilter === 'unwatched' && isWatched) return false;

            return true;
        });

        // Render cards
        if (filteredHighlights.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        grid.style.display = 'grid';
        emptyState.style.display = 'none';
        grid.innerHTML = filteredHighlights.map(highlight => createHighlightCard(highlight)).join('');
    } catch (error) {
        console.error('Render error:', error);
    }
}

/**
 * Create highlight card HTML
 */
function createHighlightCard(highlight) {
    const isWatched = isHighlightWatched(highlight.id);
    const month = highlight.month.split('-')[0];
    const topCount = highlight.top_users ? highlight.top_users.length : 0;

    const newBadge = !isWatched ? '<div class="new-badge">NEW</div>' : '';
    const watchedBtn = isWatched
        ? '<button class="btn-mark-read read" onclick="toggleWatched(\'' + highlight.id + '\')"><i class="bi bi-bookmark-check-fill"></i></button>'
        : '<button class="btn-mark-read" onclick="toggleWatched(\'' + highlight.id + '\')"><i class="bi bi-bookmark"></i></button>';

    return `
        <div class="highlight-card">
            <div class="card-header">
                ${newBadge}
                <div class="card-month">${month}</div>
                <h3 class="card-title">${escapeHtml(highlight.title)}</h3>
            </div>
            <div class="card-body">
                <p class="card-description">${escapeHtml(highlight.description || 'No description')}</p>
                <div class="card-stats">
                    <div class="stat-box">
                        <div class="stat-box-label">Problems</div>
                        <div class="stat-box-value">${highlight.completed_count || 0}</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-box-label">Top Performers</div>
                        <div class="stat-box-value">${topCount}</div>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-read-more" onclick="openModal('${highlight.id}')">
                        <i class="bi bi-arrow-right-circle"></i>
                        Read More
                    </button>
                    ${watchedBtn}
                </div>
            </div>
        </div>
    `;
}

/**
 * Open detail modal
 */
async function openModal(highlightId) {
    try {
        const highlight = allHighlights.find(h => h.id === highlightId);
        if (!highlight) return;

        currentModalData = highlight;

        // Mark as watched
        await markAsWatched(highlightId);

        // Update modal content
        document.getElementById('modalTitle').textContent = highlight.title;
        document.getElementById('modalDescription').textContent = highlight.description || 'No description';
        document.getElementById('completedCount').textContent = highlight.completed_count || 0;

        const performerCount = highlight.top_users ? highlight.top_users.length : 0;
        document.getElementById('performerCount').textContent = performerCount;

        // Render top performers
        const performersList = document.getElementById('topPerformersList');
        if (highlight.top_users && highlight.top_users.length > 0) {
            performersList.innerHTML = highlight.top_users.map(performer => `
                <li class="performer-item">
                    <i class="bi bi-person-circle"></i>
                    <div>
                        <div class="performer-name">${escapeHtml(performer.name || 'Unknown')}</div>
                        <div class="performer-score">${performer.score || 0} points</div>
                    </div>
                </li>
            `).join('');
        } else {
            performersList.innerHTML = '<li class="performer-item"><div style="text-align: center; width: 100%; color: #64748b;">No performers yet</div></li>';
        }

        // Update watch button
        const watchBtn = document.getElementById('watchBtn');
        const isWatched = isHighlightWatched(highlightId);
        if (isWatched) {
            watchBtn.innerHTML = '<i class="bi bi-bookmark-check-fill"></i> Mark as Unread';
            watchBtn.style.background = '#14b8a6';
        } else {
            watchBtn.innerHTML = '<i class="bi bi-bookmark-check-fill"></i> Mark as Read';
            watchBtn.style.background = '';
        }

        // Show modal
        const modal = document.getElementById('highlightModal');
        modal.classList.add('show');

        // Re-render highlights to update UI
        renderHighlights();
    } catch (error) {
        console.error('Modal error:', error);
        showToast('Error opening highlight details', 'error');
    }
}

/**
 * Close modal
 */
function closeModal() {
    const modal = document.getElementById('highlightModal');
    modal.classList.remove('show');
    currentModalData = null;
}

/**
 * Toggle watched status from modal
 */
window.toggleWatchedFromModal = async function() {
    if (!currentModalData) return;

    const isWatched = isHighlightWatched(currentModalData.id);
    if (isWatched) {
        const watchedKey = `${WATCH_KEY}_${localStorage.getItem('user_id')}`;
        let watched = JSON.parse(localStorage.getItem(watchedKey) || '{}');
        delete watched[currentModalData.id];
        localStorage.setItem(watchedKey, JSON.stringify(watched));
    } else {
        await markAsWatched(currentModalData.id);
    }

    // Update button
    const watchBtn = document.getElementById('watchBtn');
    const newIsWatched = isHighlightWatched(currentModalData.id);
    if (newIsWatched) {
        watchBtn.innerHTML = '<i class="bi bi-bookmark-check-fill"></i> Mark as Unread';
        watchBtn.style.background = '#14b8a6';
    } else {
        watchBtn.innerHTML = '<i class="bi bi-bookmark-check-fill"></i> Mark as Read';
        watchBtn.style.background = '';
    }

    renderHighlights();
};

/**
 * Toggle watched status from card
 */
window.toggleWatched = async function(highlightId) {
    const isWatched = isHighlightWatched(highlightId);
    if (isWatched) {
        const userId = localStorage.getItem('user_id');
        const watchedKey = `${WATCH_KEY}_${userId}`;
        let watched = JSON.parse(localStorage.getItem(watchedKey) || '{}');
        delete watched[highlightId];
        localStorage.setItem(watchedKey, JSON.stringify(watched));
        showToast('Marked as unread', 'info');
    } else {
        await markAsWatched(highlightId);
        showToast('Marked as read', 'success');
    }
    renderHighlights();
};

/**
 * Go back function
 */
window.goBack = function() {
    window.history.back();
};

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    try {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icons = {
            success: 'bi-check-circle',
            error: 'bi-exclamation-circle',
            warning: 'bi-exclamation-triangle',
            info: 'bi-info-circle'
        };

        toast.innerHTML = `
            <i class="bi ${icons[type]}"></i>
            <span class="toast-message">${escapeHtml(message)}</span>
        `;

        container.appendChild(toast);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.style.animation = 'slideInRight 0.3s ease reverse';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    } catch (error) {
        console.error('Toast error:', error);
    }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Close modal when clicking overlay
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('highlightModal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
});
