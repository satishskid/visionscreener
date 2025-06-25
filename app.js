// Application data from provided JSON
const APP_DATA = {
  screening_criteria: {
    risk_factors: [
      "Anisometropia > 1.5D",
      "Hyperopia > 3.5D", 
      "Myopia > 3.0D",
      "Astigmatism > 1.5D",
      "Strabismus detected"
    ],
    age_groups: {
      "1-2": "Photoscreening only",
      "3-5": "Photoscreening + basic acuity",
      "6-18": "Full screening + detailed acuity"
    }
  },
  visual_acuity_levels: [
    {"level": "20/200", "size": "large", "distance": "3ft"},
    {"level": "20/100", "size": "medium-large", "distance": "3ft"},
    {"level": "20/70", "size": "medium", "distance": "3ft"},
    {"level": "20/50", "size": "medium-small", "distance": "3ft"},
    {"level": "20/40", "size": "small", "distance": "3ft"},
    {"level": "20/30", "size": "very-small", "distance": "3ft"},
    {"level": "20/20", "size": "smallest", "distance": "3ft"}
  ],
  optotype_directions: ["up", "down", "left", "right"],
  referral_criteria: {
    immediate_referral: "Visual acuity worse than 20/50 in either eye",
    routine_referral: "Visual acuity 20/40 or asymmetry between eyes",
    monitor: "Borderline results, rescreen in 6 months",
    pass: "No risk factors identified, normal screening"
  },
  app_settings: {
    max_retakes: 3,
    timeout_seconds: 30,
    flash_required: true,
    min_age: 1,
    max_age: 18
  }
};

// Application state
let appState = {
  currentScreen: 'welcomeScreen',
  currentStep: 0,
  totalSteps: 7,
  selectedRole: null,
  consentGiven: false,
  patientData: {},
  photosTaken: 0,
  maxPhotos: 2,
  retakeCount: 0,
  analysisResults: {},
  acuityTest: {
    currentLevel: 0,
    correctAnswers: 0,
    incorrectAnswers: 0,
    currentDirection: null,
    results: {
      rightEye: null,
      leftEye: null
    }
  },
  finalResults: {}
};

// Screen management
const screens = [
  'welcomeScreen',
  'patientDataScreen', 
  'cameraSetupScreen',
  'photoCaptureScreen',
  'analysisScreen',
  'acuityTestScreen',
  'resultsScreen'
];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
  initializeApp();
  registerServiceWorker();
});

// Register Service Worker for PWA capabilities
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered successfully:', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available, notify user
                showUpdateNotification();
              }
            });
          });
        })
        .catch((error) => {
          console.log('❌ Service Worker registration failed:', error);
        });
    });
  }
}

function showUpdateNotification() {
  // In a real app, you might show a toast or banner
  console.log('🔄 New version available! Refresh to update.');
}

function initializeApp() {
  setupEventListeners();
  updateProgress();
  showScreen('welcomeScreen');
}

function setupEventListeners() {
  // Welcome screen
  setupWelcomeScreen();
  
  // Patient data screen
  setupPatientDataScreen();
  
  // Camera setup screen
  setupCameraSetupScreen();
  
  // Photo capture screen
  setupPhotoCaptureScreen();
  
  // Visual acuity test screen
  setupAcuityTestScreen();
  
  // Results screen
  setupResultsScreen();
  
  // Navigation
  setupNavigation();
}

function setupWelcomeScreen() {
  const roleButtons = document.querySelectorAll('.role-btn');
  const consentCheckbox = document.getElementById('consentCheckbox');
  const startBtn = document.getElementById('startBtn');
  
  roleButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      roleButtons.forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      appState.selectedRole = this.dataset.role;
      updateStartButton();
    });
  });
  
  consentCheckbox.addEventListener('change', function() {
    appState.consentGiven = this.checked;
    updateStartButton();
  });
  
  startBtn.addEventListener('click', function() {
    if (appState.selectedRole && appState.consentGiven) {
      nextScreen();
    }
  });
  
  function updateStartButton() {
    startBtn.disabled = !(appState.selectedRole && appState.consentGiven);
  }
}

function setupPatientDataScreen() {
  const patientForm = document.getElementById('patientForm');
  const skipBtn = document.getElementById('skipDataBtn');
  const anonymizeCheckbox = document.getElementById('anonymizeData');
  
  patientForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    if (validatePatientData()) {
      collectPatientData();
      nextScreen();
    }
  });
  
  skipBtn.addEventListener('click', function() {
    appState.patientData = { anonymous: true };
    nextScreen();
  });
  
  anonymizeCheckbox.addEventListener('change', function() {
    const formInputs = patientForm.querySelectorAll('input, select');
    formInputs.forEach(input => {
      if (input.id !== 'anonymizeData') {
        input.disabled = this.checked;
        if (this.checked) input.value = '';
      }
    });
  });
}

function validatePatientData() {
  const age = parseInt(document.getElementById('childAge').value);
  const name = document.getElementById('childName').value.trim();
  const anonymize = document.getElementById('anonymizeData').checked;
  
  if (!anonymize && !name) {
    alert('Please enter the child\'s name or select anonymous screening.');
    return false;
  }
  
  if (age && (age < APP_DATA.app_settings.min_age || age > APP_DATA.app_settings.max_age)) {
    alert(`Age must be between ${APP_DATA.app_settings.min_age} and ${APP_DATA.app_settings.max_age} years.`);
    return false;
  }
  
  return true;
}

function collectPatientData() {
  appState.patientData = {
    name: document.getElementById('childName').value.trim(),
    age: parseInt(document.getElementById('childAge').value),
    gender: document.getElementById('childGender').value,
    patientId: document.getElementById('patientId').value.trim(),
    anonymous: document.getElementById('anonymizeData').checked,
    timestamp: new Date().toISOString()
  };
}

function setupCameraSetupScreen() {
  const startCameraBtn = document.getElementById('startCameraBtn');
  
  startCameraBtn.addEventListener('click', function() {
    nextScreen();
    initializeCamera();
  });
}

function setupPhotoCaptureScreen() {
  const captureBtn = document.getElementById('captureBtn');
  const retakeBtn = document.getElementById('retakeBtn');
  
  captureBtn.addEventListener('click', function() {
    capturePhoto();
  });
  
  retakeBtn.addEventListener('click', function() {
    retakePhoto();
  });
}

function initializeCamera() {
  // Simulate camera initialization
  const cameraPreview = document.getElementById('cameraPreview');
  const fixationTarget = document.getElementById('fixationTarget');
  
  // Start fixation target animation
  const targets = ['🎈', '⭐', '🦋', '🌟', '🎭'];
  let targetIndex = 0;
  
  setInterval(() => {
    fixationTarget.textContent = targets[targetIndex];
    targetIndex = (targetIndex + 1) % targets.length;
  }, 2000);
  
  // Simulate real-time feedback
  simulateCameraFeedback();
}

function simulateCameraFeedback() {
  const lookingIcon = document.getElementById('lookingIcon');
  const lookingStatus = document.getElementById('lookingStatus');
  const qualityIcon = document.getElementById('qualityIcon');
  const qualityStatus = document.getElementById('qualityStatus');
  
  // Randomize feedback to simulate real conditions
  setInterval(() => {
    const looking = Math.random() > 0.3;
    const goodQuality = Math.random() > 0.2;
    
    if (looking) {
      lookingIcon.textContent = '👁️';
      lookingStatus.textContent = 'Child looking at camera';
      lookingStatus.style.color = 'var(--color-success)';
    } else {
      lookingIcon.textContent = '👀';
      lookingStatus.textContent = 'Guide child to look at target';
      lookingStatus.style.color = 'var(--color-warning)';
    }
    
    if (goodQuality) {
      qualityIcon.textContent = '✅';
      qualityStatus.textContent = 'Image quality good';
      qualityStatus.style.color = 'var(--color-success)';
    } else {
      qualityIcon.textContent = '⚠️';
      qualityStatus.textContent = 'Improve lighting/position';
      qualityStatus.style.color = 'var(--color-warning)';
    }
  }, 1500);
}

function capturePhoto() {
  appState.photosTaken++;
  updateCaptureCounter();
  
  // Simulate flash and capture
  const cameraPreview = document.getElementById('cameraPreview');
  cameraPreview.style.backgroundColor = 'white';
  setTimeout(() => {
    cameraPreview.style.backgroundColor = 'var(--color-surface)';
  }, 100);
  
  if (appState.photosTaken >= appState.maxPhotos) {
    setTimeout(() => {
      nextScreen();
      startAnalysis();
    }, 1000);
  } else {
    document.getElementById('retakeBtn').style.display = 'inline-flex';
    updateCaptureStatus();
  }
}

function retakePhoto() {
  if (appState.retakeCount < APP_DATA.app_settings.max_retakes) {
    appState.retakeCount++;
    appState.photosTaken = Math.max(0, appState.photosTaken - 1);
    updateCaptureCounter();
    document.getElementById('retakeBtn').style.display = 'none';
    updateCaptureStatus();
  }
}

function updateCaptureCounter() {
  document.getElementById('captureCount').textContent = 
    `Photos taken: ${appState.photosTaken}/${appState.maxPhotos}`;
}

function updateCaptureStatus() {
  const status = document.getElementById('captureStatus');
  if (appState.photosTaken === 0) {
    status.textContent = 'Position child and tap when ready';
  } else if (appState.photosTaken === 1) {
    status.textContent = 'Great! Take one more photo';
  } else {
    status.textContent = 'Photos captured successfully';
  }
}

function startAnalysis() {
  const steps = document.querySelectorAll('.analysis-step');
  const progressBar = document.getElementById('analysisProgress');
  let currentStep = 0;
  
  const stepInterval = setInterval(() => {
    if (currentStep > 0) {
      steps[currentStep - 1].classList.remove('active');
    }
    
    if (currentStep < steps.length) {
      steps[currentStep].classList.add('active');
      progressBar.style.width = `${((currentStep + 1) / steps.length) * 100}%`;
      currentStep++;
    } else {
      clearInterval(stepInterval);
      setTimeout(() => {
        generateAnalysisResults();
        nextScreen();
      }, 1000);
    }
  }, 1500);
}

function generateAnalysisResults() {
  // Simulate AI analysis results
  const riskFactors = [];
  const confidence = Math.random() * 0.3 + 0.7; // 70-100% confidence
  
  // Randomly determine if risk factors are present
  if (Math.random() > 0.7) {
    const availableRisks = [...APP_DATA.screening_criteria.risk_factors];
    const numRisks = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numRisks; i++) {
      const randomIndex = Math.floor(Math.random() * availableRisks.length);
      riskFactors.push(availableRisks.splice(randomIndex, 1)[0]);
    }
  }
  
  appState.analysisResults = {
    confidence: confidence,
    riskFactors: riskFactors,
    pupilDiameter: (Math.random() * 2 + 3).toFixed(1), // 3-5mm
    limbusWidth: (Math.random() * 1 + 11).toFixed(1), // 11-12mm
    crescentWidth: (Math.random() * 0.5 + 0.2).toFixed(1), // 0.2-0.7mm
    gradable: Math.random() > 0.1 // 90% gradable
  };
}

function setupAcuityTestScreen() {
  const directionButtons = document.querySelectorAll('.direction-btn');
  
  directionButtons.forEach(btn => {
    btn.addEventListener('click', function() {
      handleAcuityResponse(this.dataset.direction);
    });
  });
  
  // Skip acuity test for very young children
  if (appState.patientData.age && appState.patientData.age < 3) {
    setTimeout(() => {
      nextScreen();
      generateFinalResults();
    }, 1000);
    return;
  }
  
  startAcuityTest();
}

function startAcuityTest() {
  appState.acuityTest.currentLevel = 0;
  appState.acuityTest.correctAnswers = 0;
  appState.acuityTest.incorrectAnswers = 0;
  
  displayNextOptotype();
}

function displayNextOptotype() {
  const currentLevelData = APP_DATA.visual_acuity_levels[appState.acuityTest.currentLevel];
  const optotype = document.getElementById('optotype');
  const currentLevel = document.getElementById('currentLevel');
  const testProgress = document.getElementById('testProgress');
  
  // Set optotype size based on level
  const sizeMap = {
    'large': '180px',
    'medium-large': '150px', 
    'medium': '120px',
    'medium-small': '100px',
    'small': '80px',
    'very-small': '60px',
    'smallest': '50px'
  };
  
  optotype.style.fontSize = sizeMap[currentLevelData.size] || '120px';
  
  // Randomly rotate the E
  const directions = APP_DATA.optotype_directions;
  const randomDirection = directions[Math.floor(Math.random() * directions.length)];
  appState.acuityTest.currentDirection = randomDirection;
  
  const rotationMap = {
    'up': '0deg',
    'right': '90deg', 
    'down': '180deg',
    'left': '270deg'
  };
  
  optotype.style.transform = `rotate(${rotationMap[randomDirection]})`;
  
  // Update UI
  currentLevel.textContent = `Level: ${currentLevelData.level}`;
  testProgress.textContent = `${appState.acuityTest.correctAnswers}/3 correct`;
}

function handleAcuityResponse(selectedDirection) {
  const correct = selectedDirection === appState.acuityTest.currentDirection;
  
  if (correct) {
    appState.acuityTest.correctAnswers++;
    
    // Move to next level after 3 correct answers
    if (appState.acuityTest.correctAnswers >= 3) {
      appState.acuityTest.results.rightEye = APP_DATA.visual_acuity_levels[appState.acuityTest.currentLevel].level;
      
      if (appState.acuityTest.currentLevel < APP_DATA.visual_acuity_levels.length - 1) {
        appState.acuityTest.currentLevel++;
        appState.acuityTest.correctAnswers = 0;
        appState.acuityTest.incorrectAnswers = 0;
      } else {
        // Completed all levels
        completeAcuityTest();
        return;
      }
    }
  } else {
    appState.acuityTest.incorrectAnswers++;
    
    // Stop test after 3 incorrect answers
    if (appState.acuityTest.incorrectAnswers >= 3) {
      completeAcuityTest();
      return;
    }
  }
  
  // Continue with next optotype
  setTimeout(() => {
    displayNextOptotype();
  }, 500);
}

function completeAcuityTest() {
  // Record final acuity level
  if (!appState.acuityTest.results.rightEye) {
    const previousLevel = Math.max(0, appState.acuityTest.currentLevel - 1);
    appState.acuityTest.results.rightEye = APP_DATA.visual_acuity_levels[previousLevel].level;
  }
  
  // For simplicity, assume same result for left eye
  appState.acuityTest.results.leftEye = appState.acuityTest.results.rightEye;
  
  setTimeout(() => {
    nextScreen();
    generateFinalResults();
  }, 1000);
}

function generateFinalResults() {
  const age = appState.patientData.age || 5;
  const riskFactorsPresent = appState.analysisResults.riskFactors.length > 0;
  const acuityResults = appState.acuityTest.results;
  
  // Determine overall result based on criteria
  let overallResult = 'pass';
  let recommendations = [];
  
  if (riskFactorsPresent) {
    overallResult = 'refer';
    recommendations.push({
      type: 'urgent',
      text: 'Recommend comprehensive eye examination by eye care professional'
    });
  }
  
  // Check acuity results
  if (acuityResults.rightEye) {
    const acuityValue = parseAcuityValue(acuityResults.rightEye);
    if (acuityValue > 50) { // Worse than 20/50
      overallResult = 'refer';
      recommendations.push({
        type: 'urgent', 
        text: APP_DATA.referral_criteria.immediate_referral
      });
    } else if (acuityValue >= 40) { // 20/40 or 20/50
      if (overallResult === 'pass') overallResult = 'monitor';
      recommendations.push({
        type: 'monitor',
        text: APP_DATA.referral_criteria.routine_referral
      });
    }
  }
  
  if (overallResult === 'pass') {
    recommendations.push({
      type: 'pass',
      text: APP_DATA.referral_criteria.pass
    });
  }
  
  appState.finalResults = {
    overall: overallResult,
    photoscreening: appState.analysisResults,
    acuity: acuityResults,
    recommendations: recommendations,
    timestamp: new Date().toISOString()
  };
  
  displayResults();
}

function parseAcuityValue(acuityString) {
  // Convert "20/40" to 40 for comparison
  const parts = acuityString.split('/');
  return parseInt(parts[1]);
}

function displayResults() {
  const overallResult = document.getElementById('overallResult');
  const resultIcon = document.getElementById('resultIcon');
  const resultTitle = document.getElementById('resultTitle');
  const resultDescription = document.getElementById('resultDescription');
  const photoscreenResults = document.getElementById('photoscreenResults');
  const acuityResults = document.getElementById('acuityResults');
  const recommendations = document.getElementById('recommendations');
  
  // Set overall result styling and content
  const result = appState.finalResults.overall;
  overallResult.className = `result-status ${result}`;
  
  const resultConfig = {
    pass: {
      icon: '✅',
      title: 'Screening Passed',
      description: 'No vision concerns identified'
    },
    monitor: {
      icon: '⚠️', 
      title: 'Monitor Results',
      description: 'Some findings require monitoring'
    },
    refer: {
      icon: '🔴',
      title: 'Referral Recommended', 
      description: 'Professional eye examination advised'
    }
  };
  
  const config = resultConfig[result];
  resultIcon.textContent = config.icon;
  resultTitle.textContent = config.title;
  resultDescription.textContent = config.description;
  
  // Display photoscreening results
  const photoResults = appState.finalResults.photoscreening;
  photoscreenResults.innerHTML = `
    <div class="metric-item">
      <span class="metric-label">Confidence</span>
      <span class="metric-value">${(photoResults.confidence * 100).toFixed(0)}%</span>
    </div>
    <div class="metric-item">
      <span class="metric-label">Pupil Diameter</span>
      <span class="metric-value">${photoResults.pupilDiameter}mm</span>
    </div>
    <div class="metric-item">
      <span class="metric-label">Risk Factors</span>
      <span class="metric-value">${photoResults.riskFactors.length}</span>
    </div>
    <div class="metric-item">
      <span class="metric-label">Gradable</span>
      <span class="metric-value">${photoResults.gradable ? 'Yes' : 'No'}</span>
    </div>
  `;
  
  // Display acuity results
  const acuity = appState.finalResults.acuity;
  acuityResults.innerHTML = `
    <div class="acuity-item">
      <span>Right Eye:</span>
      <span>${acuity.rightEye || 'Not tested'}</span>
    </div>
    <div class="acuity-item">
      <span>Left Eye:</span>
      <span>${acuity.leftEye || 'Not tested'}</span>
    </div>
  `;
  
  // Display recommendations
  recommendations.innerHTML = appState.finalResults.recommendations.map(rec => 
    `<div class="recommendation-item ${rec.type}">
      <p>${rec.text}</p>
    </div>`
  ).join('');
}

function setupResultsScreen() {
  const printBtn = document.getElementById('printBtn');
  const shareBtn = document.getElementById('shareBtn');
  const newScreeningBtn = document.getElementById('newScreeningBtn');
  
  printBtn.addEventListener('click', function() {
    window.print();
  });
  
  shareBtn.addEventListener('click', function() {
    shareResults();
  });
  
  newScreeningBtn.addEventListener('click', function() {
    resetApp();
  });
}

function shareResults() {
  const shareData = {
    title: 'Skids Vision - Screening Results',
    text: `Vision screening completed for ${appState.patientData.name || 'patient'}. Result: ${appState.finalResults.overall}`,
    // Note: In a real app, this would be a secure link to results
  };
  
  if (navigator.share) {
    navigator.share(shareData);
  } else {
    // Fallback for browsers without Web Share API
    const shareText = `${shareData.title}\n${shareData.text}`;
    navigator.clipboard.writeText(shareText).then(() => {
      alert('Results copied to clipboard');
    });
  }
}

function setupNavigation() {
  const backBtn = document.getElementById('backBtn');
  const homeBtn = document.getElementById('homeBtn');
  
  backBtn.addEventListener('click', function() {
    previousScreen();
  });
  
  homeBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to return to the home screen? Current progress will be lost.')) {
      resetApp();
    }
  });
}

function showScreen(screenId) {
  // Hide all screens
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.remove('active');
  });
  
  // Show target screen
  document.getElementById(screenId).classList.add('active');
  appState.currentScreen = screenId;
  
  // Update progress and navigation
  updateProgress();
  updateNavigation();
  
  // Scroll to top
  window.scrollTo(0, 0);
}

function nextScreen() {
  const currentIndex = screens.indexOf(appState.currentScreen);
  if (currentIndex < screens.length - 1) {
    appState.currentStep = currentIndex + 1;
    showScreen(screens[currentIndex + 1]);
  }
}

function previousScreen() {
  const currentIndex = screens.indexOf(appState.currentScreen);
  if (currentIndex > 0) {
    appState.currentStep = currentIndex - 1;
    showScreen(screens[currentIndex - 1]);
  }
}

function updateProgress() {
  const progressContainer = document.getElementById('progressContainer');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  
  if (appState.currentScreen === 'welcomeScreen') {
    progressContainer.style.display = 'none';
  } else {
    progressContainer.style.display = 'block';
    const currentIndex = screens.indexOf(appState.currentScreen);
    const progress = (currentIndex / (screens.length - 1)) * 100;
    
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `Step ${currentIndex + 1} of ${screens.length}`;
  }
}

function updateNavigation() {
  const navigation = document.getElementById('navigation');
  const backBtn = document.getElementById('backBtn');
  
  if (appState.currentScreen === 'welcomeScreen') {
    navigation.style.display = 'none';
  } else {
    navigation.style.display = 'flex';
    const currentIndex = screens.indexOf(appState.currentScreen);
    backBtn.style.display = currentIndex > 1 ? 'block' : 'none';
  }
}

function resetApp() {
  // Reset application state
  appState = {
    currentScreen: 'welcomeScreen',
    currentStep: 0,
    totalSteps: 7,
    selectedRole: null,
    consentGiven: false,
    patientData: {},
    photosTaken: 0,
    maxPhotos: 2,
    retakeCount: 0,
    analysisResults: {},
    acuityTest: {
      currentLevel: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      currentDirection: null,
      results: {
        rightEye: null,
        leftEye: null
      }
    },
    finalResults: {}
  };
  
  // Reset form fields
  document.querySelectorAll('form').forEach(form => form.reset());
  document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('selected'));
  document.getElementById('startBtn').disabled = true;
  
  // Show welcome screen
  showScreen('welcomeScreen');
}

// Utility functions
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString();
}

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString();
}

// Export functionality for PDF generation (simplified)
function generatePDFReport() {
  const results = appState.finalResults;
  const patient = appState.patientData;
  
  const reportContent = `
    SKIDS VISION - PEDIATRIC VISION SCREENING REPORT
    
    Patient Information:
    Name: ${patient.name || 'Anonymous'}
    Age: ${patient.age || 'Not specified'}
    Date: ${formatDate(results.timestamp)}
    
    Screening Results:
    Overall Result: ${results.overall.toUpperCase()}
    
    Photoscreening:
    - Confidence: ${(results.photoscreening.confidence * 100).toFixed(0)}%
    - Risk Factors: ${results.photoscreening.riskFactors.length}
    - Gradable: ${results.photoscreening.gradable ? 'Yes' : 'No'}
    
    Visual Acuity:
    - Right Eye: ${results.acuity.rightEye || 'Not tested'}
    - Left Eye: ${results.acuity.leftEye || 'Not tested'}
    
    Recommendations:
    ${results.recommendations.map(rec => `- ${rec.text}`).join('\n')}
    
    Generated by Skids Vision - made by greybrain.ai
  `;
  
  return reportContent;
}