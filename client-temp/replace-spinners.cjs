const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.jsx')) results.push(file);
        }
    });
    return results;
}

const files = walk('C:/Users/jyoti/Desktop/AG/college-erp/client-temp/src');
let changed = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('className="spinner-lg"') || content.includes('className="spinner"')) {
        let newContent = content.replace(/<div className="spinner-lg" \/>/g, '<PacmanLoader color="#3ecec9" />');
        newContent = newContent.replace(/<span className="spinner" \/>/g, '<PacmanLoader color="#3ecec9" size={10} />');

        if (newContent !== content && !newContent.includes('PacmanLoader')) {
            newContent = "import { PacmanLoader } from 'react-spinners';\n" + newContent;
        }

        fs.writeFileSync(file, newContent);
        changed++;
        console.log('Updated', file);
    }
});
console.log('Total files updated:', changed);
