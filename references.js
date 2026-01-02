/* ================================================
   REFERENCES PAGE JAVASCRIPT
   Handles references loading, filtering, and interactions
   ================================================ */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabase = createClient(
  "https://cfajcmbhspradnvofbgb.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNmYWpjbWJoc3ByYWRudm9mYmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMDI0MDQsImV4cCI6MjA2OTg3ODQwNH0.mlq67ZmdeE_3_sPXY17JLd9xJ8KGDnR3eiJ9LoO9NUE"
);

// ================================================
// STATE MANAGEMENT
// ================================================

let allReferences = [];
let filteredReferences = [];
let currentCategory = 'all';
let currentSort = 'newest';
let currentDifficulty = '';
let bookmarkedReferences = JSON.parse(localStorage.getItem('bookmarkedReferences')) || [];

// ================================================
// SAMPLE DATA
// ================================================

const SAMPLE_REFERENCES = [
  {
    id: 'ref1',
    title: 'Array Data Structure - Complete Guide',
    category: 'dsa',
    description: 'Comprehensive guide covering array implementation, operations, and time complexity analysis.',
    source_url: 'https://www.geeksforgeeks.org/array-data-structure/',
    source_name: 'GeeksforGeeks',
    icon: 'bi-diagram-3',
    difficulty: 'beginner',
    tags: ['Array', 'DSA', 'Fundamental'],
    views_count: 1250,
    created_at: '2024-01-15'
  },
  {
    id: 'ref2',
    title: 'Binary Search Trees - Complete Reference',
    category: 'dsa',
    description: 'Learn BST operations, rotations, and balancing. Includes AVL trees and Red-Black trees.',
    source_url: 'https://www.geeksforgeeks.org/binary-search-tree/',
    source_name: 'GeeksforGeeks',
    icon: 'bi-diagram-3',
    difficulty: 'intermediate',
    tags: ['BST', 'Tree', 'DSA'],
    views_count: 980,
    created_at: '2024-01-12'
  },
  {
    id: 'ref3',
    title: 'Dynamic Programming Patterns',
    category: 'algorithms',
    description: 'Master the major DP patterns: 0/1 Knapsack, LCS, LDS, Coin Change, and more.',
    source_url: 'https://www.geeksforgeeks.org/dynamic-programming/',
    source_name: 'GeeksforGeeks',
    icon: 'bi-cpu',
    difficulty: 'advanced',
    tags: ['DP', 'Algorithm', 'Optimization'],
    views_count: 2100,
    created_at: '2024-01-10'
  },
  {
    id: 'ref4',
    title: 'Java Collections Framework',
    category: 'java',
    description: 'Complete reference to Java collections including List, Set, Map, Queue implementations.',
    source_url: 'https://docs.oracle.com/javase/tutorial/collections/',
    source_name: 'Oracle Documentation',
    icon: 'bi-cup-hot',
    difficulty: 'intermediate',
    tags: ['Collections', 'Java', 'Framework'],
    views_count: 1650,
    created_at: '2024-01-08'
  },
  {
    id: 'ref5',
    title: 'Python Data Structures',
    category: 'python',
    description: 'List, tuple, dictionary, set operations and comprehensions.',
    source_url: 'https://www.geeksforgeeks.org/python-data-structures/',
    source_name: 'GeeksforGeeks',
    icon: 'bi-code-square',
    difficulty: 'beginner',
    tags: ['Data Structures', 'Python', 'Fundamental'],
    views_count: 1430,
    created_at: '2024-01-05'
  },
  {
    id: 'ref6',
    title: 'CSS Grid and Flexbox',
    category: 'web',
    description: 'Master layout techniques with CSS Grid and Flexbox for responsive design.',
    source_url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout',
    source_name: 'MDN Web Docs',
    icon: 'bi-globe',
    difficulty: 'beginner',
    tags: ['CSS', 'Layout', 'Responsive'],
    views_count: 2340,
    created_at: '2024-01-02'
  },
  {
    id: 'ref7',
    title: 'SQL Query Optimization',
    category: 'database',
    description: 'Index strategies, query optimization, and execution plans.',
    source_url: 'https://www.geeksforgeeks.org/sql-optimization/',
    source_name: 'GeeksforGeeks',
    icon: 'bi-database',
    difficulty: 'advanced',
    tags: ['SQL', 'Database', 'Performance'],
    views_count: 890,
    created_at: '2023-12-28'
  },
  {
    id: 'ref8',
    title: 'Microservices Architecture',
    category: 'system-design',
    description: 'Building scalable systems with microservices, service discovery, and load balancing.',
    source_url: 'https://microservices.io/',
    source_name: 'Microservices.io',
    icon: 'bi-boxes',
    difficulty: 'advanced',
    tags: ['Microservices', 'Architecture', 'Scalability'],
    views_count: 1120,
    created_at: '2023-12-25'
  }
];

// ================================================
// DOM ELEMENTS
// ================================================

const referencesContainer = document.getElementById('referencesContainer');
const searchInput = document.getElementById('searchInput');
const filterChips = document.querySelectorAll('.filter-chip');
const sortSelect = document.getElementById('sortSelect');
const difficultySelect = document.getElementById('difficultySelect');
const emptyState = document.getElementById('emptyState');
const errorState = document.getElementById('errorState');
const retryBtn = document.getElementById('retryBtn');
const referenceModal = document.getElementById('referenceModal');
const closeModalBtn = document.getElementById('closeModal');
const bookmarkedBtn = document.getElementById('bookmarkedBtn');
const bookmarkCount = document.getElementById('bookmarkCount');
const logoutBtn = document.getElementById('logoutBtn');
const hamburgerBtn = document.getElementById('hamburgerBtn');
const navMenu = document.getElementById('navMenu');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// ================================================
// INITIALIZATION
// ================================================

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadReferences();
  setupEventListeners();
  updateBookmarkCount();
  setupHamburgerMenu();
});

// ================================================
// AUTH CHECK
// ================================================

function checkAuth() {
  const userId = localStorage.getItem('user_id');
  if (!userId) {
    window.location.href = 'user-login.html';
  }
}

// ================================================
// LOAD REFERENCES
// ================================================

async function loadReferences() {
  try {
    console.log('📚 Attempting to load references from Supabase...');
    
    let shouldUseSampleData = false;
    
    try {
      const { data, error } = await supabase
        .from('references')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.warn('⚠️ Supabase Error:', error.message);
        console.log('ℹ️ Using sample data. To setup real data: Run references-schema.sql in Supabase SQL Editor');
        shouldUseSampleData = true;
      } else if (data && data.length > 0) {
        console.log(`✅ Loaded ${data.length} references from Supabase`);
        allReferences = data;
      } else {
        console.log('📚 No references in Supabase, using sample data');
        shouldUseSampleData = true;
      }
    } catch (supabaseError) {
      console.warn('⚠️ Supabase Connection Error:', supabaseError.message);
      shouldUseSampleData = true;
    }
    
    if (shouldUseSampleData) {
      console.log('📚 Loading sample references for demonstration...');
      allReferences = SAMPLE_REFERENCES;
    }
    
    if (allReferences.length === 0) {
      console.error('❌ No references available');
      showError();
      return;
    }
    
    console.log(`✨ Ready to display ${allReferences.length} references`);
    filteredReferences = [...allReferences];
    renderReferences();
  } catch (error) {
    console.error('❌ Unexpected error in loadReferences():', error);
    allReferences = SAMPLE_REFERENCES;
    filteredReferences = [...allReferences];
    renderReferences();
  }
}

// ================================================
// RENDER REFERENCES
// ================================================

function renderReferences() {
  referencesContainer.innerHTML = '';
  
  if (filteredReferences.length === 0) {
    emptyState.style.display = 'block';
    errorState.style.display = 'none';
    return;
  }
  
  emptyState.style.display = 'none';
  errorState.style.display = 'none';
  
  filteredReferences.forEach((ref, index) => {
    const refCard = createReferenceCard(ref, index);
    referencesContainer.appendChild(refCard);
  });
}

// ================================================
// CREATE REFERENCE CARD
// ================================================

function createReferenceCard(ref, index) {
  const card = document.createElement('div');
  card.className = 'reference-card';
  card.style.opacity = '0';
  card.style.animation = `fadeIn 0.5s ease forwards ${index * 0.05}s`;
  
  const isBookmarked = bookmarkedReferences.includes(ref.id);
  const difficultyClass = `difficulty-${ref.difficulty || 'intermediate'}`;
  
  card.innerHTML = `
    <div class="reference-header">
      <div class="reference-icon">
        <i class="bi ${ref.icon || 'bi-link-45deg'}"></i>
      </div>
      <div style="flex: 1;">
        <div class="reference-title">${ref.title}</div>
        <div class="reference-source">
          <i class="bi bi-globe"></i>
          ${ref.source_name || 'External Resource'}
        </div>
      </div>
    </div>
    <div class="reference-description">${ref.description}</div>
    <div class="reference-meta">
      <span class="reference-badge">
        <i class="bi bi-tag"></i>
        ${ref.category.replace('-', ' ')}
      </span>
      <span class="difficulty-badge ${difficultyClass}">
        <i class="bi bi-lightning-fill"></i>
        ${(ref.difficulty || 'intermediate').charAt(0).toUpperCase() + (ref.difficulty || 'intermediate').slice(1)}
      </span>
    </div>
    <div class="reference-footer">
      <div class="reference-stats">
        <span><i class="bi bi-eye"></i> ${ref.views_count || 0}</span>
      </div>
      <div class="reference-actions">
        <button class="action-btn ${isBookmarked ? 'bookmarked' : ''}" data-ref-id="${ref.id}" title="Bookmark">
          <i class="bi ${isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}"></i>
        </button>
        <button class="action-btn" onclick="window.open('${ref.source_url}', '_blank')" title="Open Reference">
          <i class="bi bi-box-arrow-up-right"></i>
        </button>
      </div>
    </div>
  `;
  
  // Add click event to open modal
  card.addEventListener('click', (e) => {
    if (!e.target.closest('.action-btn')) {
      openReferenceModal(ref);
    }
  });
  
  // Add bookmark button event
  const bookmarkBtn = card.querySelector('[data-ref-id]');
  bookmarkBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleBookmark(ref.id);
  });
  
  return card;
}

// ================================================
// REFERENCE MODAL
// ================================================

function openReferenceModal(ref) {
  document.getElementById('modalTitle').textContent = ref.title;
  document.getElementById('modalSource').textContent = ref.source_name || 'External Resource';
  document.getElementById('modalCategory').textContent = ref.category.replace('-', ' ');
  document.getElementById('modalDifficulty').textContent = (ref.difficulty || 'intermediate').charAt(0).toUpperCase() + (ref.difficulty || 'intermediate').slice(1);
  document.getElementById('modalViews').textContent = (ref.views_count || 0).toLocaleString();
  document.getElementById('modalDescription').textContent = ref.description;
  
  // Render tags
  const modalTags = document.getElementById('modalTags');
  modalTags.innerHTML = (ref.tags || []).map(tag => 
    `<span class="modal-tag">${tag}</span>`
  ).join('');
  
  // Update bookmark button
  const bookmarkRefBtn = document.getElementById('bookmarkRefBtn');
  const isBookmarked = bookmarkedReferences.includes(ref.id);
  bookmarkRefBtn.innerHTML = `<i class="bi ${isBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}"></i>`;
  bookmarkRefBtn.onclick = () => {
    toggleBookmark(ref.id);
    const newIsBookmarked = bookmarkedReferences.includes(ref.id);
    bookmarkRefBtn.innerHTML = `<i class="bi ${newIsBookmarked ? 'bi-bookmark-fill' : 'bi-bookmark'}"></i>`;
  };
  
  // Open reference
  document.getElementById('openRefBtn').onclick = () => {
    window.open(ref.source_url, '_blank');
  };
  
  // Show modal
  referenceModal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeReferenceModal() {
  referenceModal.classList.remove('active');
  document.body.style.overflow = '';
}

// ================================================
// BOOKMARK REFERENCE
// ================================================

function toggleBookmark(refId) {
  const index = bookmarkedReferences.indexOf(refId);
  
  if (index > -1) {
    bookmarkedReferences.splice(index, 1);
    showToast('Removed from bookmarks');
  } else {
    bookmarkedReferences.push(refId);
    showToast('Added to bookmarks');
  }
  
  localStorage.setItem('bookmarkedReferences', JSON.stringify(bookmarkedReferences));
  updateBookmarkCount();
  renderReferences();
}

function updateBookmarkCount() {
  bookmarkCount.textContent = bookmarkedReferences.length;
}

// ================================================
// FILTERING & SORTING
// ================================================

function applyFilters() {
  let results = [...allReferences];
  
  // Apply category filter
  if (currentCategory !== 'all') {
    results = results.filter(ref => ref.category === currentCategory);
  }
  
  // Apply difficulty filter
  if (currentDifficulty) {
    results = results.filter(ref => (ref.difficulty || 'intermediate') === currentDifficulty);
  }
  
  // Apply search filter
  const searchTerm = searchInput.value.toLowerCase().trim();
  if (searchTerm) {
    results = results.filter(ref =>
      ref.title.toLowerCase().includes(searchTerm) ||
      ref.description.toLowerCase().includes(searchTerm) ||
      ref.source_name.toLowerCase().includes(searchTerm) ||
      (ref.tags || []).some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }
  
  // Apply sorting
  results = sortReferences(results, currentSort);
  
  filteredReferences = results;
  renderReferences();
}

function sortReferences(references, sortType) {
  const sorted = [...references];
  
  switch (sortType) {
    case 'oldest':
      sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      break;
    case 'title':
      sorted.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'views':
      sorted.sort((a, b) => (b.views_count || 0) - (a.views_count || 0));
      break;
    case 'newest':
    default:
      sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
  
  return sorted;
}

// ================================================
// EVENT LISTENERS
// ================================================

function setupEventListeners() {
  // Search
  searchInput.addEventListener('input', debounce(applyFilters, 300));
  
  // Category filters
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      currentCategory = chip.dataset.category;
      applyFilters();
    });
  });
  
  // Sort
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    applyFilters();
  });
  
  // Difficulty
  difficultySelect.addEventListener('change', (e) => {
    currentDifficulty = e.target.value;
    applyFilters();
  });
  
  // Modal close
  closeModalBtn.addEventListener('click', closeReferenceModal);
  document.querySelector('.modal-overlay').addEventListener('click', closeReferenceModal);
  
  // ESC key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && referenceModal.classList.contains('active')) {
      closeReferenceModal();
    }
  });
  
  // Retry button
  retryBtn.addEventListener('click', () => {
    loadReferences();
  });
  
  // Bookmarked button
  bookmarkedBtn.addEventListener('click', () => {
    if (bookmarkedReferences.length === 0) {
      showToast('No bookmarked references yet');
      return;
    }
    
    filteredReferences = allReferences.filter(ref => bookmarkedReferences.includes(ref.id));
    renderReferences();
    filterChips.forEach(c => c.classList.remove('active'));
    showToast(`Showing ${bookmarkedReferences.length} bookmarked references`);
  });
  
  // Logout
  logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    window.location.href = 'user-login.html';
  });
}

// ================================================
// HAMBURGER MENU
// ================================================

function setupHamburgerMenu() {
  function openMenu() {
    navMenu.classList.add('active');
    hamburgerBtn.classList.add('active');
  }

  function closeMenu() {
    navMenu.classList.remove('active');
    hamburgerBtn.classList.remove('active');
  }

  hamburgerBtn.addEventListener('click', () => {
    if (navMenu.classList.contains('active')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close menu when clicking nav links
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', closeMenu);
  });
}

// ================================================
// SHOW ERROR
// ================================================

function showError() {
  referencesContainer.innerHTML = '';
  emptyState.style.display = 'none';
  errorState.style.display = 'block';
}

// ================================================
// TOAST NOTIFICATION
// ================================================

function showToast(message) {
  toastMessage.textContent = message;
  toast.classList.add('show');
  
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ================================================
// UTILITY FUNCTIONS
// ================================================

function debounce(func, wait) {
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

// Add fade-in animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);
