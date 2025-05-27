// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {
    // Get references to the DOM elements
    const compareBtn = document.getElementById('compareBtn');
    const code1Textarea = document.getElementById('code1');
    const code2Textarea = document.getElementById('code2');
    const resultDiv = document.getElementById('result');

    // Add event listener to the compare button
    if (compareBtn) { // Check if the button exists
        compareBtn.addEventListener('click', function() {
            const code1 = code1Textarea.value;
            const code2 = code2Textarea.value;

            // Reset result styles and content
            resultDiv.className = ''; // Clear previous classes (identical, different, error)
            resultDiv.textContent = ''; // Clear previous text content

            // Validate inputs
            if (!code1.trim() && !code2.trim()) {
                resultDiv.textContent = 'Please enter some code in both text areas to compare.';
                resultDiv.classList.add('error'); // Add error class for styling
                return; // Exit the function
            }
            if (!code1.trim()) {
                resultDiv.textContent = 'Please enter some code in the first text area (Code 1).';
                resultDiv.classList.add('error');
                return;
            }
            if (!code2.trim()) {
                resultDiv.textContent = 'Please enter some code in the second text area (Code 2).';
                resultDiv.classList.add('error');
                return;
            }

            // Perform a basic string comparison
            if (code1 === code2) {
                resultDiv.textContent = 'The two code snippets are identical.';
                resultDiv.classList.add('identical'); // Add identical class for styling
            } else {
                resultDiv.textContent = 'The two code snippets are different.';
                resultDiv.classList.add('different'); // Add different class for styling
                // For a more advanced diff, you would integrate a diffing library.
                // Example: displayDiff(code1, code2, resultDiv);
            }
        });
    } else {
        console.error("Compare button not found. Check the ID 'compareBtn'.");
    }

    // Optional: A placeholder for a more advanced diff display function
    /*
    function displayDiff(text1, text2, outputElement) {
        // This is where you would typically use a library like diff_match_patch by Google or jsdiff.
        // These libraries can generate a visual representation of the differences.
        
        // Example with a conceptual diff library (not a real implementation here):
        // const dmp = new diff_match_patch();
        // const diffs = dmp.diff_main(text1, text2);
        // dmp.diff_cleanupSemantic(diffs); // Optional: to make diffs more human-readable
        // const diffHtml = dmp.diff_prettyHtml(diffs); // Generates HTML to show differences
        // outputElement.innerHTML = diffHtml; // Display the HTML diff

        // For now, we are keeping the simple text message.
        outputElement.textContent = 'The two code snippets are different. (Detailed diff view requires a more advanced implementation).';
        outputElement.classList.add('different');
    }
    */
});
