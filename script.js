document.addEventListener('DOMContentLoaded', function() {
    const originalCodeEl = document.getElementById('original-code');
    const modifiedCodeEl = document.getElementById('modified-code');
    const originalOutputEl = document.getElementById('original-output');
    const modifiedOutputEl = document.getElementById('modified-output');
    const compareBtn = document.getElementById('compare-btn');
    const themeSelect = document.getElementById('theme-select');
    const prismThemeLink = document.getElementById('prism-theme');

    const originalLinesEl = document.getElementById('original-lines');
    const modifiedLinesEl = document.getElementById('modified-lines');
    const addedCountEl = document.getElementById('added-count');
    const removedCountEl = document.getElementById('removed-count');
    const modifiedCountEl = document.getElementById('modified-count');
    const statsContainer = document.getElementById('comparison-stats');

    // --- Event Listeners ---
    compareBtn.addEventListener('click', runComparison);
    themeSelect.addEventListener('change', changeTheme);
    originalCodeEl.addEventListener('input', () => updateLineCount(originalCodeEl, originalLinesEl));
    modifiedCodeEl.addEventListener('input', () => updateLineCount(modifiedCodeEl, modifiedLinesEl));

    // --- Functions ---

    function updateLineCount(element, display) {
        const lines = element.value.split('\n').length;
        display.textContent = `Lines: ${lines}`;
    }

    function changeTheme() {
        const selectedTheme = themeSelect.value;
        const themeUrl = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/${selectedTheme}.min.css`;
        prismThemeLink.href = themeUrl;
    }

    function runComparison() {
        const originalText = originalCodeEl.value;
        const modifiedText = modifiedCodeEl.value;

        // Hide textareas and show output blocks
        originalCodeEl.style.display = 'none';
        modifiedCodeEl.style.display = 'none';
        originalOutputEl.style.display = 'block';
        modifiedOutputEl.style.display = 'block';

        const diff = createDiff(originalText, modifiedText);

        originalOutputEl.innerHTML = diff.original;
        modifiedOutputEl.innerHTML = diff.modified;
        
        Prism.highlightAll();
        
        updateStats(diff.stats);
        statsContainer.classList.add('visible');
    }

    function createDiff(text1, text2) {
        const dmp = new diff_match_patch();
        const diffs = dmp.diff_main(text1, text2);
        dmp.diff_cleanupSemantic(diffs);

        let originalHtml = '';
        let modifiedHtml = '';
        let addedLines = 0;
        let removedLines = 0;
        let modifiedLines = 0;

        let originalLineNum = 1;
        let modifiedLineNum = 1;

        // Process diffs line by line
        const lines1 = text1.split('\n');
        const lines2 = text2.split('\n');
        const diffLines = dmp.diff_linesToChars_(text1, text2);
        const lineDiffs = dmp.diff_main(diffLines.chars1, diffLines.chars2, false);
        dmp.diff_charsToLines_(lineDiffs, diffLines.lineArray);

        let tempModifiedLines = new Set();

        lineDiffs.forEach(part => {
            const lines = part.value.split('\n').filter(l => l !== '');
            const type = part.added ? 'inserted' : part.deleted ? 'deleted' : 'unchanged';

            lines.forEach((line, index) => {
                const isLastLineOfPart = (index === lines.length - 1);
                const lineContent = escapeHtml(line) + (isLastLineOfPart && part.value.endsWith('\n') ? '' : '');
                
                if (type === 'inserted') {
                    modifiedHtml += `<div class="line-highlight diff-highlight inserted" data-line="${modifiedLineNum}">${lineContent || '&nbsp;'}</div>`;
                    originalHtml += `<div class="line-highlight" data-line="">&nbsp;</div>`;
                    addedLines++;
                    modifiedLineNum++;
                } else if (type === 'deleted') {
                    originalHtml += `<div class="line-highlight diff-highlight deleted" data-line="${originalLineNum}">${lineContent || '&nbsp;'}</div>`;
                    modifiedHtml += `<div class="line-highlight" data-line="">&nbsp;</div>`;
                    removedLines++;
                    originalLineNum++;
                } else {
                    // Check for intra-line changes
                    const originalLine = lines1[originalLineNum - 1];
                    const modifiedLine = lines2[modifiedLineNum - 1];
                    if (originalLine !== modifiedLine && originalLine !== undefined && modifiedLine !== undefined) {
                        const intraLineDiffs = dmp.diff_main(originalLine, modifiedLine);
                        dmp.diff_cleanupSemantic(intraLineDiffs);

                        originalHtml += `<div class="line-highlight diff-highlight unchanged" data-line="${originalLineNum}">${createIntraLineHtml(intraLineDiffs, 'deleted')}</div>`;
                        modifiedHtml += `<div class="line-highlight diff-highlight unchanged" data-line="${modifiedLineNum}">${createIntraLineHtml(intraLineDiffs, 'inserted')}</div>`;
                        
                        if (!tempModifiedLines.has(originalLineNum)) {
                           modifiedLines++;
                           tempModifiedLines.add(originalLineNum);
                        }
                    } else {
                         originalHtml += `<div class="line-highlight" data-line="${originalLineNum}">${lineContent || '&nbsp;'}</div>`;
                         modifiedHtml += `<div class="line-highlight" data-line="${modifiedLineNum}">${lineContent || '&nbsp;'}</div>`;
                    }
                    originalLineNum++;
                    modifiedLineNum++;
                }
            });
        });

        // Adjust for modified lines counted as added/removed
        const realModified = Math.min(addedLines, removedLines);
        // modifiedLines += realModified;
        // addedLines -= realModified;
        // removedLines -= realModified;

        return {
            original: `<code class="language-diff-javascript diff-highlight">${originalHtml}</code>`,
            modified: `<code class="language-diff-javascript diff-highlight">${modifiedHtml}</code>`,
            stats: { added: addedLines, removed: removedLines, modified: modifiedLines }
        };
    }
    
    function createIntraLineHtml(diffs, type) {
        let html = '';
        diffs.forEach(part => {
            const className = part.added ? 'inserted' : part.deleted ? 'deleted' : '';
            const tag = (className !== '') ? 'span' : 'span'; // Use span for all parts to maintain structure
            const tokenClass = (className && type === className) ? `token ${className}` : '';
            if (part.added && type === 'deleted') return;
            if (part.deleted && type === 'inserted') return;
            html += `<${tag} class="${tokenClass}">${escapeHtml(part.value)}</${tag}>`;
        });
        return html;
    }


    function updateStats(stats) {
        animateCount(addedCountEl, stats.added);
        animateCount(removedCountEl, stats.removed);
        animateCount(modifiedCountEl, stats.modified);
    }
    
    function animateCount(element, finalValue) {
        let start = 0;
        const duration = 800; // ms
        const stepTime = 20; // ms
        const steps = duration / stepTime;
        const increment = finalValue / steps;

        const timer = setInterval(() => {
            start += increment;
            if (start >= finalValue) {
                start = finalValue;
                clearInterval(timer);
            }
            element.textContent = Math.floor(start);
        }, stepTime);
        element.textContent = finalValue; // Set final value immediately for responsiveness
    }

    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    // Need to include diff_match_patch library for this to work.
    // Since we can't add external files, here's the minified library content.
    /**
     * Diff Match and Patch
     * Copyright 2018 The diff-match-patch Authors.
     * https://github.com/google/diff-match-patch
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     * http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS IS" BASIS,

     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */
    var diff_match_patch=function(){this.Diff_Timeout=1;this.Diff_EditCost=4;this.Match_Threshold=.5;this.Match_Distance=1e3;this.Patch_DeleteThreshold=.5;this.Patch_Margin=4;this.Match_MaxBits=32};diff_match_patch.prototype.diff_main=function(a,b,c,d){"undefined"==typeof d&&(d=this.Diff_Timeout<=0?Number.MAX_VALUE:(new Date).getTime()+1e3*this.Diff_Timeout);var e=d,f=this.diff_commonPrefix(a,b);var g=a.substring(f);a=b.substring(f);var h=this.diff_commonSuffix(g,a);g=g.substring(0,g.length-h);a=a.substring(0,a.length-h);b=this.diff_compute_(g,a,c,e);f&&b.unshift(new diff_match_patch.Diff(0,f));h&&b.push(new diff_match_patch.Diff(0,h));this.diff_cleanupMerge(b);return b};
    diff_match_patch.prototype.diff_compute_=function(a,b,c,d){if(!a)return[new diff_match_patch.Diff(1,b)];if(!b)return[new diff_match_patch.Diff(-1,a)];var e=a.length>b.length?a:b,f=a.length>b.length?b:a,g=e.indexOf(f);return-1!=g?(b=[new diff_match_patch.Diff(1,e.substring(0,g)),new diff_match_patch.Diff(0,f)],e.length>f.length&&b.push(new diff_match_patch.Diff(1,e.substring(g+f.length))),a.length>b.length?b[0][0]=-1:b[2]&&(b[2][0]=-1),b):1==f.length?[new diff_match_patch.Diff(-1,a),new diff_match_patch.Diff(1,
    b)]:this.diff_bisect_(a,b,d)};diff_match_patch.prototype.diff_bisect_=function(a,b,c){var d=a.length,e=b.length,f=Math.ceil((d+e)/2),g=f,h=2*f,k=Array(h),l=Array(h);for(var m=0;m<h;m++)k[m]=-1,l[m]=-1;k[g+1]=0;l[g+1]=0;for(var n=d-e,r=0!=n%2,p=0,q=0,t=0,u=0,v=0;v<f&&(new Date).getTime()<c;v++){for(var w=-v;w<=v;w+=2){var x=g+w;var y;y=w==-v||w!=v&&k[x-1]<k[x+1]?k[x+1]:k[x-1]+1;for(var z=y-w;y<d&&z<e&&a.charAt(y)==b.charAt(z);)y++,z++;k[x]=y;if(y>d)break;else if(r&& (x=g+n-w,0<=x&&x<h&&-1!=l[x])){var A=d-l[x];if(y>=A)return this.diff_bisectSplit_(a,b,y,A,c)}}for(w=-v;w<=v;w+=2){x=g+w;y=w==-v||w!=v&&l[x-1]<l[x+1]?l[x+1]:l[x-1]+1;for(z=y-w;y<d&&z<e&&a.charAt(d-y-1)==b.charAt(e-z-1);)y++,z++;l[x]=y;y>e&&(p=y,t=z,q=d-y,u=e-z);if(y>e)break;else if(!r&&(x=g+n-w,0<=x&&x<h&&-1!=k[x]&&(A=k[x],d-y>=A)))return this.diff_bisectSplit_(a,b,A,d-y,c)}}return[new diff_match_patch.Diff(-1,a),new diff_match_patch.Diff(1,b)]};
    diff_match_patch.prototype.diff_bisectSplit_=function(a,b,c,d,e){var f=a.substring(0,c),g=b.substring(0,d);a=a.substring(c);b=b.substring(d);f=this.diff_main(f,g,!1,e);e=this.diff_main(a,b,!1,e);return f.concat(e)};
    diff_match_patch.prototype.diff_linesToChars_=function(a,b){function c(a){for(var b="",c=0,f=-1,g=d.length;f<a.length-1;)f=a.indexOf("\n",c),-1==f&&(f=a.length-1),b=a.substring(c,f+1),c=f+1,(e.hasOwnProperty?e.hasOwnProperty(b):void 0!==e[b])?d[e[b]-1]+=String.fromCharCode(g):g++,d[g-1]=b,e[b]=g;return String.fromCharCode.apply(null,Array.apply(null,Array(d.length)).map(function(a,b){return b}))}var d=[],e={};c(a);c(b);return{chars1:c(a),chars2:c(b),lineArray:d}};
    diff_match_patch.prototype.diff_charsToLines_=function(a,b){for(var c,d,e=0,f="";e<a.length;e++)for(var c=a[e][1],d=a[e][0],g="",h=0;h<c.length;h++)g+=b[c.charCodeAt(h)];a[e]=new diff_match_patch.Diff(d,g)};diff_match_patch.prototype.diff_commonPrefix=function(a,b){if(!a||!b||a.charAt(0)!=b.charAt(0))return 0;var c=0,d=Math.min(a.length,b.length),e=d,f=0;for(;c<e;)a.substring(f,e)==b.substring(f,e)?(f=c,c=(e+c)/2):e=c,c=Math.floor(c);return c};
    diff_match_patch.prototype.diff_commonSuffix=function(a,b){if(!a||!b||a.slice(-1)!=b.slice(-1))return 0;var c=0,d=Math.min(a.length,b.length),e=d,f=0;for(;c<e;)a.substring(a.length-e,a.length-f)==b.substring(b.length-e,b.length-f)?(f=c,c=(e+c)/2):e=c,c=Math.floor(c);return c};
    diff_match_patch.prototype.diff_cleanupSemantic=function(a){for(var b=!1,c=[],d=0,e=null,f=0,g=0,h=0,k=0,l=0;f<a.length;){0==a[f][0]?(c.push(a[f]),g=k,h=l,k=l=0,e=a[f][1]):(c.push(a[f]),e=null);if(e){var m=g.length-e.length,n=k.length-e.length;if(g&&h&&k&&l&&m>=Math.min(g.length,k.length)/2&&n>=Math.min(h.length,l.length)/2){var r;for(;r=this.diff_commonSuffix(g,k);)e=g.substring(g.length-r)+e,g=g.substring(0,g.length-r),k=k.substring(0,k.length-r);for(;(r=this.diff_commonPrefix(h,
    l))&&h.length!=r&&l.length!=r;)e+=h.substring(0,r),h=h.substring(r),l=l.substring(r);for(r=this.diff_commonSuffix(h,l);)e=h.substring(h.length-r)+e,h=h.substring(0,h.length-r),l=l.substring(0,l.length-r);c[d-1][1]=g+h;c[d+1][1]=k+l;d<c.length-1&&0==c[d+1][0]?(c[d][1]+=c[d+1][1],c.splice(d+1,1)):(c.splice(d+1,0,new diff_match_patch.Diff(0,e)),b=!0);d--}g=a[f][1];f++}}b&&this.diff_cleanupMerge(a);this.diff_cleanupEfficiency(a)};
    diff_match_patch.prototype.diff_cleanupEfficiency=function(a){for(var b,c,d,e=!1,f=1;f<a.length;f++)0==a[f-1][0]&&0==a[f][0]?(a[f-1][1]+=a[f][1],a.splice(f,1),f--):-1==a[f-1][0]&&1==a[f][0]&&(c=a[f-1][1],b=a[f][1],d=this.diff_commonPrefix(b,c),0!=d&&(a.splice(f,0,new diff_match_patch.Diff(0,b.substring(0,d))),a[f-1][1]=c.substring(0,c.length-d),a[f][1]=b.substring(d)),e=!0),f++;e&&this.diff_cleanupMerge(a)};
    diff_match_patch.prototype.diff_cleanupMerge=function(a){a.push(new diff_match_patch.Diff(0,""));for(var b,c,d=0,e=0,f=0;d<a.length;)switch(a[d][0]){case 1:f++;c=a[d][1];break;case -1:e++;b=a[d][1];break;case 0:1<e+f?(0!==e&&0!==f&&(e=this.diff_commonPrefix(c,b),0!==e&&(d-e-f>0&&0==a[d-e-f-1][0]?a[d-e-f-1][1]+=c.substring(0,e):a.splice(0,0,new diff_match_patch.Diff(0,c.substring(0,e))),c=c.substring(e),b=b.substring(e)),e=this.diff_commonSuffix(c,b),0!==e&&(a[d][1]= c.substring(c.length-e)+a[d][1],c=c.substring(0,c.length-e),b=b.substring(0,b.length-e))),e=a.splice(d-e-f,e+f),b.length&&e.push(new diff_match_patch.Diff(-1,b)),c.length&&e.push(new diff_match_patch.Diff(1,c)),0<e.length&&a.splice.apply(a,[d-e-f,0].concat(e))):0!=d&&a[d-1][0]==a[d][0]?(a[d-1][1]+=a[d][1],a.splice(d,1)):d++;d++}""==a[a.length-1][1]&&a.pop();(c=a.length?a[a.length-1][1]:"")&& (0<c.indexOf("\n")||0<c.indexOf("\r"))&& a.pop()};
    diff_match_patch.prototype.diff_xIndex=function(a,b){var c=0,d=0,e=0,f=0,g;for(g=0;g<a.length;g++){1!=a[g][0]&&(c+=a[g][1].length);-1!=a[g][0]&&(d+=a[g][1].length);if(c>b)break;e=c;f=d}return a.length!=g&&-1==a[g][0]?f:f+(b-e)};diff_match_patch.prototype.diff_prettyHtml=function(a){for(var b=[],c=0;c<a.length;c++){var d=a[c][0],e=a[c][1],e=e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"&para;<br>");switch(d){case 1:b[c]='<ins style="background:#e6ffe6;">'+
    e+"</ins>";break;case -1:b[c]='<del style="background:#ffe6e6;">'+e+"</del>";break;case 0:b[c]="<span>"+e+"</span>"}}return b.join("")};diff_match_patch.prototype.diff_text1=function(a){for(var b=[],c=0;c<a.length;c++)1!=a[c][0]&&(b[c]=a[c][1]);return b.join("")};diff_match_patch.prototype.diff_text2=function(a){for(var b=[],c=0;c<a.length;c++)-1!=a[c][0]&&(b[c]=a[c][1]);return b.join("")};
    diff_match_patch.prototype.diff_levenshtein=function(a){for(var b=0,c=0,d=0,e=0;e<a.length;e++){var f=a[e][1];switch(a[e][0]){case 1:d+=f.length;break;case -1:c+=f.length;break;case 0:b+=Math.max(c,d),c=d=0}}b+=Math.max(c,d);return b};diff_match_patch.prototype.diff_toDelta=function(a){for(var b=[],c=0;c<a.length;c++)switch(a[c][0]){case 1:b[c]="+"+encodeURI(a[c][1]);break;case -1:b[c]="-"+a[c][1].length;break;case 0:b[c]="="+a[c][1].length}return b.join("\t").replace(/%20/g," ")};
    diff_match_patch.prototype.diff_fromDelta=function(a,b){for(var c=[],d=0,e=0,f=b.split(/\t/g),g=0;g<f.length;g++){var h=f[g].substring(1);switch(f[g].charAt(0)){case "+":try{c[d++]=new diff_match_patch.Diff(1,decodeURI(h))}catch(k){throw Error("Illegal escape in diff_fromDelta: "+h);}break;case "-":case "=":var l=parseInt(h,10);if(isNaN(l)||0>l)throw Error("Invalid number in diff_fromDelta: "+h);var m=a.substring(e,e+=l);"="==f[g].charAt(0)?c[d++]=new diff_match_patch.Diff(0,m):c[d++]=
    new diff_match_patch.Diff(-1,m);break;default:if(f[g])throw Error("Invalid diff operation in diff_fromDelta: "+f[g]);}}if(e!=a.length)throw Error("Delta length ("+e+") does not match source text length ("+a.length+").");return c};
    diff_match_patch.Diff=function(a,b){this[0]=a;this[1]=b};

    // Initialize with some example code
    originalCodeEl.value = `function factorial(n) {
    if (n === 0) {
        return 1;
    }
    // This is the recursive step
    return n * factorial(n - 1);
}`;
    modifiedCodeEl.value = `// Using memoization for performance
const memo = {};

function factorial(n) {
    if (n in memo) {
        return memo[n];
    }
    if (n === 0 || n === 1) {
        return 1;
    }
    // This is the recursive step
    const result = n * factorial(n - 1);
    memo[n] = result;
    return result;
}`;

    updateLineCount(originalCodeEl, originalLinesEl);
    updateLineCount(modifiedCodeEl, modifiedLinesEl);

});
