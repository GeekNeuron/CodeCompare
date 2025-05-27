// Function to count lines
function updateLineCount(textareaId, counterId) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    if (textarea && counter) {
        const lines = textarea.value.split('\n').length;
        counter.textContent = `Lines: ${lines}`;
    }
}

// Function to clear all
function clearAll() {
    const originalCodeTextarea = document.getElementById('originalCode');
    const modifiedCodeTextarea = document.getElementById('modifiedCode');
    const leftLinesCounter = document.getElementById('leftLines');
    const rightLinesCounter = document.getElementById('rightLines');
    const emptyStateDiv = document.getElementById('emptyState');
    const diffContainerDiv = document.getElementById('diffContainer');
    const legendDiv = document.getElementById('legend');
    const statsDiv = document.getElementById('stats');

    if (originalCodeTextarea) originalCodeTextarea.value = '';
    if (modifiedCodeTextarea) modifiedCodeTextarea.value = '';
    if (leftLinesCounter) leftLinesCounter.textContent = 'Lines: 0';
    if (rightLinesCounter) rightLinesCounter.textContent = 'Lines: 0';
    
    if (emptyStateDiv) emptyStateDiv.style.display = 'block';
    if (diffContainerDiv) diffContainerDiv.style.display = 'none';
    if (legendDiv) legendDiv.style.display = 'none';
    if (statsDiv) statsDiv.style.display = 'none';
}

// Function to swap code
function swapCode() {
    const originalTextarea = document.getElementById('originalCode');
    const modifiedTextarea = document.getElementById('modifiedCode');

    if (originalTextarea && modifiedTextarea) {
        const originalValue = originalTextarea.value;
        const modifiedValue = modifiedTextarea.value;
        
        originalTextarea.value = modifiedValue;
        modifiedTextarea.value = originalValue;
        
        updateLineCount('originalCode', 'leftLines');
        updateLineCount('modifiedCode', 'rightLines');
    }
}

// LCS algorithm to find longest common subsequence
function lcs(a, b) {
    const m = a.length;
    const n = b.length;
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (a[i - 1] === b[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    
    return dp;
}

// Function to create diff
function createDiff(original, modified) {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    
    const lcsTable = lcs(originalLines, modifiedLines);
    const diffResult = []; // Renamed from 'diff' to avoid conflict if 'diff' is a global var.
    
    let i = originalLines.length;
    let j = modifiedLines.length;
    
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && originalLines[i - 1] === modifiedLines[j - 1]) {
            diffResult.unshift({
                type: 'equal',
                originalLine: i - 1,
                modifiedLine: j - 1,
                content: originalLines[i - 1]
            });
            i--;
            j--;
        } else if (j > 0 && (i === 0 || lcsTable[i][j - 1] >= lcsTable[i - 1][j])) {
            diffResult.unshift({
                type: 'added',
                originalLine: null,
                modifiedLine: j - 1,
                content: modifiedLines[j - 1]
            });
            j--;
        } else if (i > 0 && (j === 0 || lcsTable[i][j - 1] < lcsTable[i - 1][j])) {
            diffResult.unshift({
                type: 'removed',
                originalLine: i - 1,
                modifiedLine: null,
                content: originalLines[i - 1]
            });
            i--;
        } else { // Should not happen if LCS is correct, but as a fallback
            break;
        }
    }
    
    return diffResult;
}

// Main compare function
function compareCode() {
    const originalCode = document.getElementById('originalCode').value;
    const modifiedCode = document.getElementById('modifiedCode').value;
    const loadingDiv = document.getElementById('loading');
    const emptyStateDiv = document.getElementById('emptyState');
    const diffContainerDiv = document.getElementById('diffContainer');
    
    if (!originalCode.trim() && !modifiedCode.trim()) {
        alert('Please enter at least one code block to compare.');
        return;
    }
    
    if (loadingDiv) loadingDiv.classList.add('show');
    if (emptyStateDiv) emptyStateDiv.style.display = 'none';
    if (diffContainerDiv) diffContainerDiv.style.display = 'none'; // Hide previous diff
    
    // Simulate delay for loading animation
    setTimeout(() => {
        const diffResult = createDiff(originalCode, modifiedCode);
        renderDiff(diffResult);
        
        if (loadingDiv) loadingDiv.classList.remove('show');
        if (diffContainerDiv) diffContainerDiv.style.display = 'grid';
        
        const legendDiv = document.getElementById('legend');
        const statsDiv = document.getElementById('stats');
        if (legendDiv) legendDiv.style.display = 'flex';
        if (statsDiv) statsDiv.style.display = 'flex';

    }, 500);
}

// Function to render diff
function renderDiff(diffResult) {
    const leftSide = document.getElementById('leftSide');
    const rightSide = document.getElementById('rightSide');
    
    if (!leftSide || !rightSide) return;

    leftSide.innerHTML = '';
    rightSide.innerHTML = '';
    
    let leftLineNumber = 1;
    let rightLineNumber = 1;
    let addedCount = 0;
    let removedCount = 0;
    let modifiedCount = 0;
    
    const groupedDiff = [];
    let currentGroup = [];
    
    diffResult.forEach((item) => {
        if (item.type === 'equal') {
            if (currentGroup.length > 0) {
                groupedDiff.push(currentGroup);
                currentGroup = [];
            }
            groupedDiff.push([item]);
        } else {
            currentGroup.push(item);
        }
    });
    
    if (currentGroup.length > 0) {
        groupedDiff.push(currentGroup);
    }
    
    groupedDiff.forEach(group => {
        if (group[0].type === 'equal') {
            const item = group[0];
            const leftLine = createDiffLine(leftLineNumber, item.content, 'equal');
            const rightLine = createDiffLine(rightLineNumber, item.content, 'equal');
            
            leftSide.appendChild(leftLine);
            rightSide.appendChild(rightLine);
            
            leftLineNumber++;
            rightLineNumber++;
        } else {
            const removedItems = group.filter(item => item.type === 'removed');
            const addedItems = group.filter(item => item.type === 'added');
            const maxLength = Math.max(removedItems.length, addedItems.length);
            
            for (let i = 0; i < maxLength; i++) {
                const removedItem = removedItems[i];
                const addedItem = addedItems[i];
                
                if (removedItem && addedItem) {
                    const leftLine = createDiffLine(leftLineNumber, removedItem.content, 'modified');
                    const rightLine = createDiffLine(rightLineNumber, addedItem.content, 'modified');
                    leftSide.appendChild(leftLine);
                    rightSide.appendChild(rightLine);
                    leftLineNumber++;
                    rightLineNumber++;
                    modifiedCount++;
                } else if (removedItem) {
                    const leftLine = createDiffLine(leftLineNumber, removedItem.content, 'removed');
                    const rightLine = createDiffLine('', '', 'removed-empty'); // Placeholder for alignment
                    leftSide.appendChild(leftLine);
                    rightSide.appendChild(rightLine);
                    leftLineNumber++;
                    removedCount++;
                } else if (addedItem) {
                    const leftLine = createDiffLine('', '', 'added-empty'); // Placeholder for alignment
                    const rightLine = createDiffLine(rightLineNumber, addedItem.content, 'added');
                    leftSide.appendChild(leftLine);
                    rightSide.appendChild(rightLine);
                    rightLineNumber++;
                    addedCount++;
                }
            }
        }
    });
    
    const addedCountEl = document.getElementById('addedCount');
    const removedCountEl = document.getElementById('removedCount');
    const modifiedCountEl = document.getElementById('modifiedCount');

    if (addedCountEl) addedCountEl.textContent = addedCount;
    if (removedCountEl) removedCountEl.textContent = removedCount;
    if (modifiedCountEl) modifiedCountEl.textContent = modifiedCount;
}

// Function to create a diff line element
function createDiffLine(lineNumber, content, type) {
    const line = document.createElement('div');
    line.className = `diff-line ${type}`;
    
    const lineNumberEl = document.createElement('div');
    lineNumberEl.className = 'line-number';
    lineNumberEl.textContent = lineNumber === '' ? ' ' : String(lineNumber); // Use ' ' for empty placeholders
    
    const lineContent = document.createElement('div');
    lineContent.className = 'line-content';
    lineContent.textContent = content; // textContent handles HTML entities safely
    
    line.appendChild(lineNumberEl);
    line.appendChild(lineContent);
    
    return line;
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    const originalCodeTextarea = document.getElementById('originalCode');
    const modifiedCodeTextarea = document.getElementById('modifiedCode');

    if (originalCodeTextarea) {
        originalCodeTextarea.placeholder = `// Enter your original code here
function hello() {
    console.log("Hello World!");
}`;
        updateLineCount('originalCode', 'leftLines'); // Initialize count
    }
    
    if (modifiedCodeTextarea) {
        modifiedCodeTextarea.placeholder = `// Enter your modified code here
function hello() {
    console.log("Hello GeekNeuron!");
    console.log("Welcome to CodeCompare!");
}`;
        updateLineCount('modifiedCode', 'rightLines'); // Initialize count
    }

    // Initialize line counts for empty textareas if not already done by placeholder logic
    if (originalCodeTextarea && !originalCodeTextarea.value) updateLineCount('originalCode', 'leftLines');
    if (modifiedCodeTextarea && !modifiedCodeTextarea.value) updateLineCount('modifiedCode', 'rightLines');
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault(); // Prevent default browser action for Ctrl+Enter
        compareCode();
    } else if (e.ctrlKey && e.key === 'Delete') {
        e.preventDefault(); // Prevent default browser action
        clearAll();
    }
});
