// Function to count lines
function updateLineCount(textareaId, counterId) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    if (textarea && counter) {
        const lines = textarea.value.split('\n').length;
        counter.textContent = `Lines: ${lines}`;
    } else {
        console.error(`Error in updateLineCount: Textarea or Counter element not found. ID1: ${textareaId}, ID2: ${counterId}`);
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
    const leftSideDiv = document.getElementById('leftSide');
    const rightSideDiv = document.getElementById('rightSide');

    if (originalCodeTextarea) originalCodeTextarea.value = ''; else console.error("clearAll: originalCode textarea not found");
    if (modifiedCodeTextarea) modifiedCodeTextarea.value = ''; else console.error("clearAll: modifiedCode textarea not found");
    if (leftLinesCounter) leftLinesCounter.textContent = 'Lines: 0'; else console.error("clearAll: leftLines counter not found");
    if (rightLinesCounter) rightLinesCounter.textContent = 'Lines: 0'; else console.error("clearAll: rightLines counter not found");
    
    if (emptyStateDiv) emptyStateDiv.style.display = 'block'; else console.error("clearAll: emptyState div not found");
    if (diffContainerDiv) diffContainerDiv.style.display = 'none'; else console.error("clearAll: diffContainer div not found");
    if (legendDiv) legendDiv.style.display = 'none'; else console.error("clearAll: legend div not found");
    if (statsDiv) statsDiv.style.display = 'none'; else console.error("clearAll: stats div not found");

    // Clear diff content as well
    if (leftSideDiv) leftSideDiv.innerHTML = ''; else console.error("clearAll: leftSide div not found");
    if (rightSideDiv) rightSideDiv.innerHTML = ''; else console.error("clearAll: rightSide div not found");
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
    } else {
        console.error("Error in swapCode: One or both textareas not found.");
        if (!originalTextarea) console.error("originalCode textarea not found for swap");
        if (!modifiedTextarea) console.error("modifiedCode textarea not found for swap");
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
    const diffResult = [];
    
    let i = originalLines.length;
    let j = modifiedLines.length;
    
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && originalLines[i - 1] === modifiedLines[j - 1]) {
            diffResult.unshift({ type: 'equal', originalLine: i - 1, modifiedLine: j - 1, content: originalLines[i - 1] });
            i--; j--;
        } else if (j > 0 && (i === 0 || lcsTable[i][j - 1] >= lcsTable[i - 1][j])) {
            diffResult.unshift({ type: 'added', originalLine: null, modifiedLine: j - 1, content: modifiedLines[j - 1] });
            j--;
        } else if (i > 0 && (j === 0 || lcsTable[i][j - 1] < lcsTable[i - 1][j])) {
            diffResult.unshift({ type: 'removed', originalLine: i - 1, modifiedLine: null, content: originalLines[i - 1] });
            i--;
        } else { break; }
    }
    return diffResult;
}

// Main compare function
function compareCode() {
    const originalCodeTextarea = document.getElementById('originalCode');
    const modifiedCodeTextarea = document.getElementById('modifiedCode');
    const loadingDiv = document.getElementById('loading');
    const emptyStateDiv = document.getElementById('emptyState');
    const diffContainerDiv = document.getElementById('diffContainer');
    const legendDiv = document.getElementById('legend');
    const statsDiv = document.getElementById('stats');

    if (!originalCodeTextarea || !modifiedCodeTextarea) {
        console.error("CompareCode Error: Code textarea(s) not found.");
        alert("Error: Code input field(s) are missing. Cannot compare.");
        return;
    }
    // These elements are crucial for UI updates during/after comparison
    if (!loadingDiv || !emptyStateDiv || !diffContainerDiv || !legendDiv || !statsDiv) {
        console.error("CompareCode Error: Essential UI elements for results display are missing.");
        alert("Error: UI elements for displaying results are missing.");
        // Depending on severity, you might choose to return or allow comparison with broken UI
        // For now, let's allow it to proceed if textareas are there, but log the issue.
    }

    const originalCode = originalCodeTextarea.value;
    const modifiedCode = modifiedCodeTextarea.value;
    
    if (!originalCode.trim() && !modifiedCode.trim()) {
        alert('Please enter at least one code block to compare.');
        return;
    }
    
    if (loadingDiv) loadingDiv.classList.add('show');
    if (emptyStateDiv) emptyStateDiv.style.display = 'none';
    if (diffContainerDiv) diffContainerDiv.style.display = 'none';
    if (legendDiv) legendDiv.style.display = 'none'; // Hide initially
    if (statsDiv) statsDiv.style.display = 'none';   // Hide initially
    
    setTimeout(() => {
        try {
            const diffResult = createDiff(originalCode, modifiedCode);
            renderDiff(diffResult);
        
            if (diffContainerDiv) diffContainerDiv.style.display = 'grid';
            if (legendDiv) legendDiv.style.display = 'flex';
            if (statsDiv) statsDiv.style.display = 'flex';

        } catch (error) {
            console.error("Error during diff processing or rendering:", error);
            alert("An error occurred while trying to compare the code. Please check console for details if possible.");
        } finally {
            if (loadingDiv) loadingDiv.classList.remove('show');
        }
    }, 500);
}

// Function to render diff
function renderDiff(diffResult) {
    const leftSide = document.getElementById('leftSide');
    const rightSide = document.getElementById('rightSide');
    const addedCountEl = document.getElementById('addedCount');
    const removedCountEl = document.getElementById('removedCount');
    const modifiedCountEl = document.getElementById('modifiedCount');
    
    if (!leftSide || !rightSide || !addedCountEl || !removedCountEl || !modifiedCountEl) {
        console.error("RenderDiff Error: One or more display elements not found.");
        return;
    }

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
            if (currentGroup.length > 0) { groupedDiff.push(currentGroup); currentGroup = []; }
            groupedDiff.push([item]);
        } else { currentGroup.push(item); }
    });
    if (currentGroup.length > 0) { groupedDiff.push(currentGroup); }
    
    groupedDiff.forEach(group => {
        if (group[0].type === 'equal') {
            const item = group[0];
            leftSide.appendChild(createDiffLine(leftLineNumber++, item.content, 'equal'));
            rightSide.appendChild(createDiffLine(rightLineNumber++, item.content, 'equal'));
        } else {
            const removedItems = group.filter(item => item.type === 'removed');
            const addedItems = group.filter(item => item.type === 'added');
            const maxLength = Math.max(removedItems.length, addedItems.length);
            
            for (let i = 0; i < maxLength; i++) {
                const removedItem = removedItems[i];
                const addedItem = addedItems[i];
                
                if (removedItem && addedItem) {
                    leftSide.appendChild(createDiffLine(leftLineNumber++, removedItem.content, 'modified'));
                    rightSide.appendChild(createDiffLine(rightLineNumber++, addedItem.content, 'modified'));
                    modifiedCount++;
                } else if (removedItem) {
                    leftSide.appendChild(createDiffLine(leftLineNumber++, removedItem.content, 'removed'));
                    rightSide.appendChild(createDiffLine('', '', 'removed-empty'));
                    removedCount++;
                } else if (addedItem) {
                    leftSide.appendChild(createDiffLine('', '', 'added-empty'));
                    rightSide.appendChild(createDiffLine(rightLineNumber++, addedItem.content, 'added'));
                    addedCount++;
                }
            }
        }
    });
    
    addedCountEl.textContent = addedCount;
    removedCountEl.textContent = removedCount;
    modifiedCountEl.textContent = modifiedCount;
}

// Function to create a diff line element
function createDiffLine(lineNumber, content, type) {
    const line = document.createElement('div');
    line.className = `diff-line ${type}`;
    
    const lineNumberEl = document.createElement('div');
    lineNumberEl.className = 'line-number';
    lineNumberEl.textContent = lineNumber === '' ? ' ' : String(lineNumber);
    
    const lineContent = document.createElement('div');
    lineContent.className = 'line-content';
    lineContent.textContent = content || ''; // Ensure content is not null/undefined
    
    line.appendChild(lineNumberEl);
    line.appendChild(lineContent);
    
    return line;
}

// Event listeners - DOMContentLoaded ensures this runs after the HTML is parsed
document.addEventListener('DOMContentLoaded', function() {
    const originalCodeTextarea = document.getElementById('originalCode');
    const modifiedCodeTextarea = document.getElementById('modifiedCode');

    if (originalCodeTextarea) {
        originalCodeTextarea.placeholder = `// Enter your original code here
function hello() {
    console.log("Hello World!");
}`;
        updateLineCount('originalCode', 'leftLines');
    } else {
        console.error("DOMContentLoaded: originalCode textarea not found.");
    }
    
    if (modifiedCodeTextarea) {
        modifiedCodeTextarea.placeholder = `// Enter your modified code here
function hello() {
    console.log("Hello GeekNeuron!");
    console.log("Welcome to CodeCompare!");
}`;
        updateLineCount('modifiedCode', 'rightLines');
    } else {
        console.error("DOMContentLoaded: modifiedCode textarea not found.");
    }

    // Initialize line counts for empty textareas (handles case if placeholder logic doesn't cover it)
    if (originalCodeTextarea && originalCodeTextarea.value === '') updateLineCount('originalCode', 'leftLines');
    if (modifiedCodeTextarea && modifiedCodeTextarea.value === '') updateLineCount('modifiedCode', 'rightLines');

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault(); 
            compareCode();
        } else if (e.ctrlKey && e.key === 'Delete') {
            e.preventDefault(); 
            clearAll();
        }
    });
});

