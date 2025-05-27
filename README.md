# CodeCompare

CodeCompare is a simple and intuitive web-based utility to compare two snippets of code or text. It highlights whether the provided inputs are identical or different. This tool is built purely with HTML, CSS, and JavaScript, making it lightweight and easy to deploy, especially on platforms like GitHub Pages.

## Live Demo

You can access a live demo of CodeCompare here: **[https://GeekNeuron.github.io/CodeCompare/](https://GeekNeuron.github.io/CodeCompare/)**
*(Note: Make sure your GitHub Pages is correctly set up for this link to work.)*

## Features

* **Side-by-Side Input:** Two distinct text areas for pasting code or text.
* **Simple Comparison:** Quickly determines if the two inputs are identical or different.
* **Clear Feedback:** Displays the result in an easy-to-understand message.
* **Responsive Design:** Adapts to different screen sizes (desktop, tablet, mobile).
* **Lightweight:** No external libraries or frameworks (uses vanilla HTML, CSS, JS).
* **Easy to Use:** Minimalistic interface for straightforward operation.

## Technologies Used

* **HTML5:** For the basic structure and content of the web page.
* **CSS3:** For styling the user interface and ensuring a responsive layout.
* **JavaScript (ES6+):** For handling the comparison logic and DOM manipulation.

## How to Use

### Online (GitHub Pages)

1.  Navigate to the [live demo link](https://GeekNeuron.github.io/CodeCompare/).
2.  Paste your first code/text snippet into the "Code 1" text area.
3.  Paste your second code/text snippet into the "Code 2" text area.
4.  Click the "Compare" button.
5.  The result of the comparison will be displayed below the button.

### Locally

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/GeekNeuron/CodeCompare.git](https://github.com/GeekNeuron/CodeCompare.git)
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd CodeCompare
    ```
3.  **Open `index.html` in your web browser:**
    You can usually do this by double-clicking the `index.html` file or right-clicking and selecting "Open with" your preferred browser.

## File Structure
```bash
CodeCompare/├── index.html      # The main HTML file (structure)├── style.css       # CSS file for styling├── script.js       # JavaScript file for functionality└── README.md       # This file
```

**Example: Main Interface**
`[Image of CodeCompare main interface with two text areas and a compare button]`

**Example: Comparison Result (Identical)**
`[Image of CodeCompare showing an "identical" result message]`

**Example: Comparison Result (Different)**
`[Image of CodeCompare showing a "different" result message]`

## Future Enhancements (Potential)

* **Detailed Diff View:** Implement a more sophisticated diff algorithm (e.g., using a library like `diff_match_patch` or `jsdiff`) to show specific differences (additions, deletions, modifications) highlighted within the text.
* **Line Numbers:** Add line numbers to the text areas for easier code referencing.
* **Syntax Highlighting:** Integrate a library for syntax highlighting based on detected code language.
* **File Upload:** Allow users to upload files for comparison instead of just pasting text.
* **Ignore Whitespace Option:** Add an option to ignore whitespace differences during comparison.

## Contributing

Currently, this is a small personal project. However, if you have suggestions or find bugs, feel free to open an issue in the GitHub repository.

## License

MIT License
