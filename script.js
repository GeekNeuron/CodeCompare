// --- START HELPER FUNCTIONS FOR SIMILARITY ---
/**
 * Calculates the Levenshtein distance between two strings.
 * @param {string} a The first string.
 * @param {string} b The second string.
 * @returns {number} The Levenshtein distance.
 */
function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];

    // Increment along the first column of each row
    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // Increment each column in the first row
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

/**
 * Checks if two lines are similar enough to be considered a modification.
 * @param {string} line1 The first line.
 * @param {string} line2 The second line.
 * @param {number} threshold The similarity threshold (e.g., 0.6 for 60%).
 * @returns {boolean} True if lines are similar, false otherwise.
 */
function areLinesSimilar(line1, line2, threshold) {
    if (line1 === null || line2 === null) return false;
    const len1 = line1.length;
    const len2 = line2.length;

    if (len1 === 0 && len2 === 0) return true; // Both empty are similar
    // If one is empty and the other is not, they are not similar enough for a "modification"
    // (though one could argue an empty line changing to content is a modification)
    // For simplicity here, if one is empty, they are not "modified" but rather add/remove.
    if (len1 === 0 || len2 === 0) return false;


    const distance = levenshteinDistance(line1, line2);
    const maxLength = Math.max(len1, len2);
    // if (maxLength === 0) return true; // Already handled by len1 === 0 && len2 === 0

    const similarity = 1 - (distance / maxLength);
    return similarity >= threshold;
}

const SIMILARITY_THRESHOLD = 0.5; // 50% similarity required to be 'modified'
// --- END HELPER FUNCTIONS FOR SIMILARITY ---

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

// Function to create diff structure from LCS
function createDiff(original, modified) {
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    
    const lcsTable = lcs(originalLines, modifiedLines);
    const diffResult = [];
    
    let i = originalLines.length;
    let j = modifiedLines.length;
    
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && originalLines[i - 1] === modifiedLines[j - 1]) {
            diffResult.unshift({ type: 'equal', originalLineNumber: i, modifiedLineNumber: j, content: originalLines[i - 1] });
            i--; j--;
        } else if (j > 0 && (i === 0 || lcsTable[i][j - 1] >= lcsTable[i - 1][j])) {
            diffResult.unshift({ type: 'added', originalLineNumber: null, modifiedLineNumber: j, content: modifiedLines[j - 1] });
            j--;
        } else if (i > 0 && (j === 0 || lcsTable[i][j - 1] < lcsTable[i - 1][j])) {
            diffResult.unshift({ type: 'removed', originalLineNumber: i, modifiedLineNumber: null, content: originalLines[i - 1] });
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
    if (!loadingDiv || !emptyStateDiv || !diffContainerDiv || !legendDiv || !statsDiv) {
        console.error("CompareCode Error: Essential UI elements for results display are missing.");
        // Allow comparison if textareas are there, but log the issue.
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
    if (legendDiv) legendDiv.style.display = 'none';
    if (statsDiv) statsDiv.style.display = 'none';
    
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
    
    let currentLeftLineNumber = 1;
    let currentRightLineNumber = 1;
    let addedCount = 0;
    let removedCount = 0;
    let modifiedCount = 0;
    
    // This new approach iterates through the diffResult and tries to match
    // consecutive removed/added lines as potential modifications.
    let i = 0;
    while (i < diffResult.length) {
        const item = diffResult[i];
        if (item.type === 'equal') {
            leftSide.appendChild(createDiffLine(currentLeftLineNumber++, item.content, 'equal'));
            rightSide.appendChild(createDiffLine(currentRightLineNumber++, item.content, 'equal'));
            i++;
        } else if (item.type === 'removed') {
            // Check if the next item is an 'added' item, to potentially form a 'modified' pair
            if (i + 1 < diffResult.length && diffResult[i + 1].type === 'added') {
                const removedContent = item.content;
                const addedContent = diffResult[i + 1].content;
                if (areLinesSimilar(removedContent, addedContent, SIMILARITY_THRESHOLD)) {
                    leftSide.appendChild(createDiffLine(currentLeftLineNumber++, removedContent, 'modified'));
                    rightSide.appendChild(createDiffLine(currentRightLineNumber++, addedContent, 'modified'));
                    modifiedCount++;
                    i += 2; // Consumed two items (one removed, one added)
                } else {
                    // Not similar enough, treat as separate remove
                    leftSide.appendChild(createDiffLine(currentLeftLineNumber++, removedContent, 'removed'));
                    rightSide.appendChild(createDiffLine('', '', 'removed-empty'));
                    removedCount++;
                    i++;
                }
            } else {
                // No subsequent 'added' item, so it's definitely a 'removed'
                leftSide.appendChild(createDiffLine(currentLeftLineNumber++, item.content, 'removed'));
                rightSide.appendChild(createDiffLine('', '', 'removed-empty'));
                removedCount++;
                i++;
            }
        } else if (item.type === 'added') {
            // This 'added' item was not consumed as part of a 'modified' pair
            leftSide.appendChild(createDiffLine('', '', 'added-empty'));
            rightSide.appendChild(createDiffLine(currentRightLineNumber++, item.content, 'added'));
            addedCount++;
            i++;
        } else {
            i++; // Should not happen
        }
    }
    
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
    lineContent.textContent = content || '';
    
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

    if (originalCodeTextarea && originalCodeTextarea.value === '') updateLineCount('originalCode', 'leftLines');
    if (modifiedCodeTextarea && modifiedCodeTextarea.value === '') updateLineCount('modifiedCode', 'rightLines');

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
