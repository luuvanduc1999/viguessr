document.addEventListener('DOMContentLoaded', () => {
    // Initialize display
    updateBestScoreDisplay();

    // Hook into showResultModal
    if (typeof window.showResultModal === 'function') {
        const originalShowResultModal = window.showResultModal;
        window.showResultModal = function(distance) {
            // Call original
            originalShowResultModal(distance);
            
            // Update best score
            saveBestScore(distance);
        };
    } else {
        console.warn('showResultModal not found. High score feature might not work.');
    }
});

function saveBestScore(distance) {
    const distVal = parseFloat(distance);
    if (isNaN(distVal)) return;

    const currentBest = localStorage.getItem('viguessr_best_score');
    
    // Lower distance is better
    if (currentBest === null || distVal < parseFloat(currentBest)) {
        localStorage.setItem('viguessr_best_score', distVal);
        updateBestScoreDisplay();
    }
}

function updateBestScoreDisplay() {
    const bestScore = localStorage.getItem('viguessr_best_score');
    const displayElement = document.getElementById('best-score-display');
    
    if (displayElement) {
        if (bestScore !== null) {
             const distVal = parseFloat(bestScore);
             let formattedDistance;
             if (distVal >= 1000) {
                 formattedDistance = (distVal / 1000).toFixed(2) + ' KM';
             } else {
                 formattedDistance = distVal.toFixed(1) + ' M';
             }
             displayElement.innerText = `Best: ${formattedDistance}`;
             displayElement.style.display = 'block';
        } else {
            displayElement.style.display = 'none';
        }
    }
}
