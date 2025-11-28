const API_URL = 'http://localhost:3002/api';

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const analyzeBtn = document.getElementById('analyzeBtn');
const removeFileBtn = document.getElementById('removeFile');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('errorMessage');
const results = document.getElementById('results');
const newUploadBtn = document.getElementById('newUploadBtn');
const copyTextBtn = document.getElementById('copyText');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

let selectedFile = null;
let currentData = null;

// File Upload Handlers
uploadArea.addEventListener('click', () => fileInput.click());

uploadArea.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
  uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadArea.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) handleFileSelect(file);
});

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFileSelect(file);
});

function handleFileSelect(file) {
  if (file.type !== 'application/pdf') {
    showError('Please select a PDF file');
    return;
  }
  
  if (file.size > 15 * 1024 * 1024) {
    showError('File too large. Maximum size is 15MB');
    return;
  }
  
  selectedFile = file;
  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
  
  fileInfo.querySelector('.file-name').textContent = file.name;
  fileInfo.querySelector('.file-size').textContent = `${sizeMB} MB`;
  fileInfo.classList.add('show');
  analyzeBtn.disabled = false;
  hideError();
}

// Remove file
removeFileBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  resetUpload();
});

function resetUpload() {
  selectedFile = null;
  fileInput.value = '';
  fileInfo.classList.remove('show');
  analyzeBtn.disabled = true;
}


// Analyze Button Handler
analyzeBtn.addEventListener('click', async () => {
  if (!selectedFile) return;
  
  showLoading();
  hideError();
  results.classList.remove('show');
  
  const formData = new FormData();
  formData.append('pdf', selectedFile);
  
  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to analyze PDF');
    }
    
    currentData = data;
    displayResults(data);
  } catch (error) {
    showError(error.message || 'Failed to connect to server. Make sure the backend is running.');
  } finally {
    hideLoading();
  }
});

// New Upload Button
newUploadBtn.addEventListener('click', () => {
  results.classList.remove('show');
  resetUpload();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Copy Text Button
copyTextBtn.addEventListener('click', async () => {
  if (!currentData) return;
  
  try {
    await navigator.clipboard.writeText(currentData.cleanedText);
    copyTextBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => {
      copyTextBtn.innerHTML = '<i class="fas fa-copy"></i> Copy';
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
});

// Display Results
function displayResults(data) {
  // Document info
  document.getElementById('docName').textContent = data.filename;
  document.getElementById('docStats').textContent = 
    `${data.pageCount} pages • ${data.stats.topicsFound} topics • ${data.stats.keyPointsFound} key points`;
  
  // Summary
  document.querySelector('#summary .summary-text').innerHTML = 
    escapeHtml(data.summary) || '<div class="empty-state"><i class="fas fa-align-left"></i><p>No summary available</p></div>';
  
  // Explanation
  document.querySelector('#explanation .explanation-text').innerHTML = 
    escapeHtml(data.explanation) || '<div class="empty-state"><i class="fas fa-book-open"></i><p>No explanation available</p></div>';
  
  // Topics
  const topicsHtml = data.topics.length > 0 
    ? data.topics.map(t => `
        <div class="topic-item">
          <span class="topic-name">${escapeHtml(t.topic)}</span>
          <span class="topic-pages">Pages: ${t.pages.join(', ')}</span>
        </div>
      `).join('')
    : '<div class="empty-state"><i class="fas fa-sitemap"></i><p>No specific topics detected</p></div>';
  
  document.querySelector('#topics .topics-list').innerHTML = topicsHtml;
  
  // Headings
  const headingsHtml = data.headings.length > 0
    ? data.headings.map(h => `<div class="heading-item">${escapeHtml(h)}</div>`).join('')
    : '<div class="empty-state"><i class="fas fa-heading"></i><p>No headings found</p></div>';
  
  document.querySelector('#keypoints .headings-list').innerHTML = headingsHtml;
  
  // Key Points
  const keyPointsHtml = data.keyPoints.length > 0
    ? data.keyPoints.map(p => `<div class="key-point">${escapeHtml(p)}</div>`).join('')
    : '<div class="empty-state"><i class="fas fa-star"></i><p>No key points extracted</p></div>';
  
  document.querySelector('#keypoints .keypoints-list').innerHTML = keyPointsHtml;
  
  // Full text
  document.querySelector('#fulltext .full-text').textContent = data.cleanedText;
  
  results.classList.add('show');
  
  // Reset to first tab
  setActiveTab('summary');
  
  // Scroll to results
  results.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Tab Switching
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    setActiveTab(tab.dataset.tab);
  });
});

function setActiveTab(tabId) {
  tabs.forEach(t => t.classList.remove('active'));
  tabContents.forEach(c => c.classList.remove('active'));
  
  document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
  document.getElementById(tabId).classList.add('active');
}

// Utility Functions
function showLoading() {
  loading.classList.add('show');
  analyzeBtn.disabled = true;
}

function hideLoading() {
  loading.classList.remove('show');
  analyzeBtn.disabled = !selectedFile;
}

function showError(message) {
  errorMessage.querySelector('span').textContent = message;
  errorMessage.classList.add('show');
}

function hideError() {
  errorMessage.classList.remove('show');
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
